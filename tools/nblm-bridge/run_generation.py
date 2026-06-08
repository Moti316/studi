#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# PYTHONUTF8=1  (נדרש ב-Windows — ראה README.md)
"""
run_generation.py — גשר NotebookLM אוטומטי
=============================================
תפקיד: טוען session שמור (storage_state) → פותח notebook → שולח prompt → שומר פלט כ-JSON.
לא-רץ-ריצה-ממשית בסשן זה (Python לא מותקן במכונה) — סקאפולד+תיעוד בלבד.

שימוש:
    python run_generation.py --notebook-id <id> --request <name>

ארגומנטים:
    --notebook-id   מזהה ה-notebook ב-NotebookLM (חובה אם לא מוגדר NBLM_NOTEBOOK_ID)
    --request       שם קובץ-הפרומפט ב-.cache/notebooklm/requests/ (ללא סיומת .txt)
    --ref           מזהה-פלט (ref) עבור שם-קובץ-הפלט (ברירת-מחדל: שווה ל--request)
    --dry-run       הדפסת-הפרומפט בלבד, ללא שליחה אמיתית ל-NotebookLM
    --storage       נתיב ל-storage_state.json (ברירת-מחדל: ./storage_state.json)
    --timeout       timeout בשניות לבקשה (ברירת-מחדל: 120)
    --max-retries   מספר-ניסיונות-חוזר על שגיאת-429 (ברירת-מחדל: 3)

פלט:
    .cache/notebooklm/scenarios/<ref>.json — תגובת ה-chat מ-NotebookLM
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# ============================
# ניהול-תלויות (graceful fail)
# ============================
try:
    from notebooklm import NotebookLMClient  # notebooklm-py[browser]
except ImportError:
    print(
        "[שגיאה] notebooklm-py לא מותקן. הרץ: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)


# ============================
# קבועים
# ============================
# שורש-הפרויקט = שתי תיקיות מעל tools/nblm-bridge/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# תיקיית cache (git-ignored — מוגדר ב-.gitignore)
CACHE_DIR = PROJECT_ROOT / ".cache" / "notebooklm"
REQUESTS_DIR = CACHE_DIR / "requests"
SCENARIOS_DIR = CACHE_DIR / "scenarios"

# throttle: השהייה בין ניסיונות-חוזר (בשניות)
RETRY_BASE_DELAY_SECONDS = 30  # 429 → המתן לפני ניסיון-חוזר
RETRY_MULTIPLIER = 2           # backoff מעריכי: 30s → 60s → 120s


# ============================
# עזר: קריאת prompt מקובץ
# ============================
def load_prompt(request_name: str) -> str:
    """
    טוען את הפרומפט מ-.cache/notebooklm/requests/<request_name>.txt.
    מחזיר את תוכן-הקובץ כ-string (כולל שמירת ירידות-שורה).
    """
    prompt_path = REQUESTS_DIR / f"{request_name}.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"קובץ-פרומפט לא נמצא: {prompt_path}\n"
            f"צפוי נתיב: {prompt_path.resolve()}"
        )
    return prompt_path.read_text(encoding="utf-8")


# ============================
# עזר: כתיבת תגובה לקובץ JSON
# ============================
def save_response(ref: str, response_text: str) -> Path:
    """
    שומר את תגובת ה-chat ל-.cache/notebooklm/scenarios/<ref>.json.
    מחזיר את הנתיב שנכתב.
    פורמט JSON: { "ref": <ref>, "generated_at": <ISO-8601>, "content": <text> }
    """
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = SCENARIOS_DIR / f"{ref}.json"

    payload = {
        "ref": ref,
        "generated_at": _utc_now_iso(),
        "content": response_text,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output_path


# ============================
# עזר: חותמת-זמן ISO-8601 UTC
# ============================
def _utc_now_iso() -> str:
    """מחזיר חותמת-זמן כ-ISO-8601 UTC (ללא תלות ב-datetime.timezone ב-Python<3.11)."""
    import datetime
    return datetime.datetime.utcnow().isoformat() + "Z"


# ============================
# ליבה: שליחת prompt עם retry
# ============================
def ask_with_retry(
    chat,
    prompt: str,
    max_retries: int,
    base_delay: int,
) -> str:
    """
    שולח prompt ל-chat.ask עם retry על RateLimitError (429).
    max_retries: מספר-ניסיונות-נוספים אחרי הניסיון-הראשון.
    base_delay: זמן-המתנה-ראשוני בשניות (מוכפל ב-RETRY_MULTIPLIER בכל ניסיון).
    מחזיר את הטקסט של התגובה כ-string.
    """
    attempt = 0
    delay = base_delay

    while True:
        try:
            # chat.ask מחזיר אובייקט-תגובה; נשלוף .text (API notebooklm-py)
            response = chat.ask(prompt)
            return response.text if hasattr(response, "text") else str(response)

        except Exception as exc:
            # בדיקת 429 / rate-limit — notebooklm-py משתמש במונחים שונים לפי גרסה
            is_rate_limit = (
                "429" in str(exc)
                or "rate" in str(exc).lower()
                or "quota" in str(exc).lower()
                or "throttl" in str(exc).lower()
            )

            if is_rate_limit and attempt < max_retries:
                attempt += 1
                print(
                    f"[throttle] שגיאת-429 (ניסיון {attempt}/{max_retries}). "
                    f"ממתין {delay}s לפני ניסיון-חוזר…",
                    file=sys.stderr,
                )
                time.sleep(delay)
                delay *= RETRY_MULTIPLIER  # backoff מעריכי
            else:
                # שגיאה שאינה rate-limit, או מיצינו ניסיונות
                raise


# ============================
# main
# ============================
def main() -> None:
    parser = argparse.ArgumentParser(
        description="גשר NotebookLM — שולח prompt ושומר פלט JSON."
    )
    parser.add_argument(
        "--notebook-id",
        default=os.environ.get("NBLM_NOTEBOOK_ID"),
        help="מזהה ה-notebook ב-NotebookLM (או NBLM_NOTEBOOK_ID env)",
    )
    parser.add_argument(
        "--request",
        required=True,
        help="שם קובץ-הפרומפט ב-.cache/notebooklm/requests/ (ללא .txt)",
    )
    parser.add_argument(
        "--ref",
        default=None,
        help="מזהה-פלט עבור שם-קובץ-JSON (ברירת-מחדל: שווה ל--request)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="הדפסת-הפרומפט בלבד, ללא שליחה",
    )
    parser.add_argument(
        "--storage",
        default=str(Path(__file__).parent / "storage_state.json"),
        help="נתיב ל-storage_state.json (ברירת-מחדל: ./storage_state.json)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=120,
        help="timeout בשניות לבקשה (ברירת-מחדל: 120)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="מספר-ניסיונות-חוזר על 429 (ברירת-מחדל: 3)",
    )
    args = parser.parse_args()

    # ולידציה: notebook-id נדרש
    if not args.notebook_id:
        parser.error(
            "חסר --notebook-id. הגדר ארגומנט או משתנה-סביבה NBLM_NOTEBOOK_ID."
        )

    # ref = request אם לא סופק
    ref = args.ref or args.request

    # --- טעינת prompt ---
    print(f"[run_generation] טוען prompt: {args.request}")
    prompt_text = load_prompt(args.request)

    # --- dry-run: הדפסה בלבד ---
    if args.dry_run:
        print(f"\n{'='*60}")
        print(f"[dry-run] notebook-id : {args.notebook_id}")
        print(f"[dry-run] request     : {args.request}")
        print(f"[dry-run] ref         : {ref}")
        print(f"[dry-run] storage     : {args.storage}")
        print(f"[dry-run] prompt ({len(prompt_text)} תווים):")
        print("─" * 40)
        print(prompt_text[:500] + ("…" if len(prompt_text) > 500 else ""))
        print(f"{'='*60}")
        print("[dry-run] לא נשלח ל-NotebookLM.")
        return

    # --- ולידציה: storage_state קיים ---
    storage_path = Path(args.storage)
    if not storage_path.exists():
        print(
            f"[שגיאה] storage_state.json לא נמצא ב: {storage_path}\n"
            f"הרץ: notebooklm login --browser-cookies chrome",
            file=sys.stderr,
        )
        sys.exit(1)

    # --- חיבור ל-NotebookLM ---
    print(f"[run_generation] טוען session מ: {storage_path}")
    client = NotebookLMClient.from_storage(str(storage_path))

    # --- פתיחת notebook ---
    print(f"[run_generation] פותח notebook: {args.notebook_id}")
    notebook = client.get_notebook(args.notebook_id)

    # --- יצירת chat session ---
    # chat = סשן-שיחה עם ה-notebook; ask שולח הודעה ומקבל תגובה
    chat = notebook.chat(timeout=args.timeout)

    # --- שליחת prompt עם retry ---
    print(f"[run_generation] שולח prompt ({len(prompt_text)} תווים)…")
    response_text = ask_with_retry(
        chat=chat,
        prompt=prompt_text,
        max_retries=args.max_retries,
        base_delay=RETRY_BASE_DELAY_SECONDS,
    )

    # --- שמירת פלט ---
    output_path = save_response(ref=ref, response_text=response_text)
    print(f"[run_generation] פלט נשמר: {output_path.relative_to(PROJECT_ROOT)}")
    print(f"[run_generation] אורך-תגובה: {len(response_text)} תווים")


if __name__ == "__main__":
    main()
