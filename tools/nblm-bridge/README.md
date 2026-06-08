# nblm-bridge — גשר NotebookLM אוטומטי

כלי Python מבודד שמאפשר **אפס-קליקים** בהפקת תוכן מ-NotebookLM לאחר bootstrap חד-פעמי.

> תיקייה זו מבודדת לחלוטין מ-pnpm-tree של הפרויקט.
> אין imports הדדיים עם `src/`.

---

## הגדרה חד-פעמית (מוטי בלבד)

### 1. התקנת Python

דרוש Python **3.10 ומעלה** (בדיקה: `python --version`).
הורדה: https://www.python.org/downloads/

### 2. יצירת virtualenv והתקנת תלויות

```powershell
# מתוך שורש-הפרויקט
cd tools\nblm-bridge
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Playwright מתקין את Chromium אוטומטית עם notebooklm-py[browser]
```

### 3. הגדרת PYTHONUTF8 (Windows — חובה לעברית)

```powershell
$env:PYTHONUTF8 = "1"
# להפיכה לקבועה: הוסף ל-profile.ps1 שלך
```

### 4. login — שמירת session

```powershell
# פועל עם Chromium שכבר מחובר לחשבון Google שלך
notebooklm login --browser-cookies chrome
# ייצר storage_state.json בתיקייה זו (git-ignored)
```

**חשוב:** ה-session תקף כ-15–20 דקות של חוסר-פעילות. ראה §שביריות.

### 5. smoke test

```powershell
python run_generation.py \
  --notebook-id <notebook-id-from-notebooklm-url> \
  --request smoke_test \
  --dry-run
```

---

## אפס-קליקים לאחר bootstrap

לאחר ה-bootstrap, כל הפקה:

```powershell
$env:NBLM_NOTEBOOK_ID = "<id>"  # פעם אחת לסשן
python run_generation.py --request scenarios_ch01 --ref ch01_batch1
```

הפלט נכתב ל-`.cache/notebooklm/scenarios/ch01_batch1.json` — הפורמט שה-importer של StudiBuilder צורך.

### הוספת prompt חדש

1. כתוב את הפרומפט ל-`.cache/notebooklm/requests/<name>.txt` (UTF-8 BOM-free).
2. הרץ `python run_generation.py --request <name>`.
3. הפלט מחכה ב-`.cache/notebooklm/scenarios/<name>.json`.

---

## חוזה-הקבצים

| פעולה        | נתיב                                     | הערה                         |
| ------------ | ---------------------------------------- | ---------------------------- |
| קריאת prompt | `.cache/notebooklm/requests/<name>.txt`  | כתוב ידנית / ייוצר ע"י agent |
| כתיבת פלט    | `.cache/notebooklm/scenarios/<ref>.json` | נצרך ע"י importer            |
| session auth | `tools/nblm-bridge/storage_state.json`   | git-ignored — אישי לחלוטין   |

**הסקריפט כותב רק ל-`.cache/notebooklm/`** — אין כתיבה ל-`src/` / `courses/` / `drizzle/`.

---

## שביריות ומגבלות (קרא לפני שימוש)

### RPC לא-מתועד

notebooklm-py מבוסס על RPC פנימי של Google NotebookLM שאינו API רשמי.
**כל עדכון של Google עלול לשבור את הספרייה ללא התראה.**

סדר-עדיפויות לתגובה:

1. `pip install --upgrade notebooklm-py` — פתרון ב-90% מהמקרים.
2. אם לא עוזר: בדוק issues ב-repo של notebooklm-py.
3. fallback: הדבקה-ידנית ל-`.cache/notebooklm/scenarios/<ref>.json` בפורמט:
   `{"ref":"<ref>","generated_at":"<ISO>","content":"<text>"}`

### session-expiry

Session תקף ~15–20 דקות. לאחר מכן:

```powershell
notebooklm login --browser-cookies chrome  # refresh
```

### ToS / חשבון

כלי זה פועל עם **חשבון Google של מוטי בלבד** ולצרכי הפקה פנימית.
אין להפיץ `storage_state.json` לאחרים.
שימוש בכלי זה כפוף לתנאי-השימוש של Google NotebookLM.

### קצב (throttle)

NotebookLM אינו מיועד לקריאות API מהירות.
הסקריפט ממתין 30s+ על שגיאת-429 (backoff מעריכי עד 3 ניסיונות).
להפקת batches גדולים — הוסף השהייה בין קריאות (\`--timeout 120\`).

---

## החלפה אפשרית (ללא שינוי-קוד-אפליקציה)

אם notebooklm-py יישבר לצמיתות, ניתן להחליף ב:

- **gemini-webapi** — ממשק דומה לגמיני (RPC לא-רשמי גם הוא)
- **הדבקה-ידנית** — כתוב ידנית לקובץ JSON בפורמט חוזה-הקבצים למעלה

**קוד-האפליקציה (importer) לא ישתנה** — הוא צורך רק את קובצי-ה-JSON.
