#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# PYTHONUTF8=1  (נדרש ב-Windows — ראה README.md)
"""
run_generation.py — גשר NotebookLM (חלופת-Python ל-generate.ps1)
================================================================
תפקיד: שולח prompt למחברת ב-NotebookLM ושומר את הפלט בפורמט שה-importer צורך.

מימוש: עוטף את ה-**CLI** המאומת של notebooklm-py (`python -m notebooklm ask
--prompt-file ... --json`) דרך subprocess — לא ה-Python-API הפנימי (שמשתנה בין
גרסאות). זהה בתוצאה ל-generate.ps1; קיים כדי לאפשר הרצה חוצת-פלטפורמה.

זרימה:
  1. קורא prompt מ-.cache/notebooklm/requests/<request>.txt.
  2. מריץ `notebooklm ask --prompt-file <f> -n <notebook> --new --json`.
  3. מחלץ את טקסט-התשובה (פלט-המודל = ה-JSON שלנו) וכותב מעטפת
     { ref, generated_at, content } ל-.cache/notebooklm/scenarios/<ref>.json.

דרישה מוקדמת: setup + login (storage_state.json קיים).

שימוש:
    python run_generation.py --notebook-id <id> --request scenarios-expand
"""

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path

# שורש-הפרויקט = שתי תיקיות מעל tools/nblm-bridge/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = PROJECT_ROOT / ".cache" / "notebooklm"
REQUESTS_DIR = CACHE_DIR / "requests"
SCENARIOS_DIR = CACHE_DIR / "scenarios"


def _utc_now_iso() -> str:
    """חותמת-זמן ISO-8601 UTC (ללא תלות ב-timezone · תואם Python<3.11)."""
    return datetime.datetime.utcnow().isoformat() + "Z"


def load_prompt(request_name: str) -> Path:
    prompt_path = REQUESTS_DIR / f"{request_name}.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"קובץ-פרומפט לא נמצא: {prompt_path}\n"
            f"הרץ תחילה: pnpm notebooklm:request"
        )
    return prompt_path


def ask_notebooklm(notebook_id: str, prompt_file: Path, timeout: int) -> str:
    """מריץ את ה-CLI ומחזיר את טקסט-התשובה (פלט-המודל)."""
    cmd = [
        sys.executable, "-m", "notebooklm", "ask",
        "--prompt-file", str(prompt_file),
        "-n", notebook_id,
        "--new", "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(f"notebooklm ask נכשל (exit {proc.returncode}):\n{proc.stderr}")
    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError:
        # פלט לא-JSON — החזר כפי-שהוא (ה-importer יחלץ/יסנן fences)
        return proc.stdout
    for key in ("answer", "text", "response", "content"):
        if isinstance(data, dict) and data.get(key):
            return data[key]
    return proc.stdout


def save_response(ref: str, content: str) -> Path:
    """כותב מעטפת { ref, generated_at, content } — ה-importer מחלץ את content."""
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = SCENARIOS_DIR / f"{ref}.json"
    payload = {"ref": ref, "generated_at": _utc_now_iso(), "content": content}
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="גשר NotebookLM — שולח prompt ושומר פלט JSON.")
    parser.add_argument("--notebook-id", required=True, help="מזהה ה-notebook ב-NotebookLM")
    parser.add_argument("--request", required=True, help="שם קובץ-הפרומפט (ללא .txt)")
    parser.add_argument("--ref", default=None, help="מזהה-פלט (ברירת-מחדל: שווה ל--request)")
    parser.add_argument("--timeout", type=int, default=300, help="timeout בשניות (ברירת-מחדל: 300)")
    parser.add_argument("--dry-run", action="store_true", help="הדפסת-הפרומפט בלבד, ללא שליחה")
    args = parser.parse_args()

    ref = args.ref or args.request
    prompt_file = load_prompt(args.request)

    if args.dry_run:
        text = prompt_file.read_text(encoding="utf-8")
        print(f"[dry-run] notebook={args.notebook_id} · request={args.request} · ref={ref}")
        print(f"[dry-run] prompt ({len(text)} תווים):")
        print(text[:500] + ("…" if len(text) > 500 else ""))
        return

    print(f"[run_generation] שולח prompt: {args.request} → notebook {args.notebook_id}")
    content = ask_notebooklm(args.notebook_id, prompt_file, args.timeout)
    out = save_response(ref, content)
    print(f"[run_generation] ✓ נכתב: {out.relative_to(PROJECT_ROOT)} ({len(content)} תווים)")
    print("[run_generation] הצעד הבא: pnpm scenarios:import:dry")


if __name__ == "__main__":
    main()
