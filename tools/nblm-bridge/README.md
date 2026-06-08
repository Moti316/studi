# nblm-bridge — גשר NotebookLM אוטומטי

כלי Python מבודד שמאפשר **אפס-קליקים** בהפקת תוכן מ-NotebookLM לאחר login חד-פעמי.
מבודד מ-pnpm-tree (אין imports עם `src/`); כותב **רק** ל-`.cache/notebooklm/`.

> **המודל בקצרה:** מתחברים **פעם-אחת** (login בדפדפן) → ה-session נשמר ל-`storage_state.json` →
> מכאן הגשר טוען את ה-session ומדבר עם NotebookLM ישירות (בלי דפדפן, בלי קליקים). זה **לא** MCP-חי
> (שרת-תמיד-פעיל); זו **הזדהות-שמורה שסקריפט-מקומי משתמש בה לפי-דרישה** (offline · batch).
> ה-session מתיישן מדי פעם → מתחברים שוב (login).

---

## 🚀 התקנה חוצת-מחשבים (3 פקודות)

```powershell
# 1) bootstrap per-user (ללא admin · uv→Python→venv→deps→chromium · עוקף TLS ארגוני)
powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\setup.ps1

# 2) login חד-פעמי (ההזדהות שלך · נפתח דפדפן → התחבר ל-Google של מנוי-NotebookLM)
powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\login.ps1

# 3) בניית מחברת-החקיקה (יוצר מחברת-אחת + מעלה את כל ~43 הנוסחים אוטומטית)
powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\build-notebook.ps1
```

ואז (אופציונלי) מפת-חשיבה + הפקת-התרחישים:

```powershell
powershell -File tools\nblm-bridge\mindmap.ps1  <notebook-id>   # מפת-חשיבה של הקורפוס
powershell -File tools\nblm-bridge\generate.ps1 <notebook-id>   # מפיק 20 תרחישים → .cache
pnpm scenarios:import:dry                                       # דו"ח-אימות G1–G5 (ללא DB)
pnpm scenarios:import                                           # כתיבה ל-DB
```

---

## למה מחברת-אחת לכל החקיקה

תרחישי-בטיחות חוצי-תחומים (גובה + חשמל + צמ"א בתרחיש אחד) → **מחברת-אחת עם מלוא-הקורפוס**
נותנת ל-NotebookLM לצטט את התקנה-הנכונה פר-תרחיש. בנוסף — עיגון באותם קבצי-`.md` שעליהם
שער-G3 בודק verbatim → **שיעור-מעבר-ציטוט גבוה יותר**. ~43 מקורות < מגבלת-50 של NotebookLM.

---

## למה login אינטראקטיבי (ולא חילוץ-cookies)

`--browser-cookies chrome` נחסם ע"י **App-Bound Encryption של Chrome** (מ-Chrome 127+):
פענוח-cookies דורש הרשאות-מערכת (`RtlAdjustPrivilege`) שאין בלי admin. לכן login אינטראקטיבי
(Playwright פותח חלון → אתה מתחבר → session נשמר ישירות). זה הצעד היחיד שאינו ניתן-לאוטומציה
(ה-Google-auth שלך · סיסמה/2FA).

---

## עקיפת TLS-inspection ארגוני (חשוב במחשבי-ארגון)

חומת-אש ארגונית לעתים מפענחת SSL עם root-CA ארגוני, ש-uv לא מכיר → `invalid peer certificate`.
הפתרון (ב-`setup.ps1`): **`UV_SYSTEM_CERTS=1`** — uv סומך על ה-cert-store של Windows (שמכיל את
ה-CA הארגוני). לגיטימי לחלוטין, לא עקיפת-אבטחה. אם הורדה אחרת נכשלת על TLS — בדוק את אותו עיקרון.

---

## חוזה-הקבצים

| פעולה        | נתיב                                     | הערה                                             |
| ------------ | ---------------------------------------- | ------------------------------------------------ |
| קריאת prompt | `.cache/notebooklm/requests/<name>.txt`  | נוצר ע"י `pnpm notebooklm:request`               |
| כתיבת פלט    | `.cache/notebooklm/scenarios/<ref>.json` | `{ref,generated_at,content}` · נצרך ע"י importer |
| מפת-חשיבה    | `.cache/notebooklm/mindmaps/<ref>.json`  | עץ-מושגים (אופציונלי)                            |
| session auth | `tools/nblm-bridge/storage_state.json`   | git-ignored — אישי לחלוטין                       |
| venv         | `tools/nblm-bridge/.venv/`               | git-ignored                                      |

ה-importer (`scripts/import-scenarios.ts`) מחלץ את `content` מהמעטפת ומריץ שערי-G1–G5 מול
קורפוס-החקיקה לפני כתיבה ל-DB (status='מוסקנא'). **הפלט-הגולמי אף-פעם לא נכתב ישירות.**

---

## הסקריפטים

| סקריפט               | תפקיד                                                           |
| -------------------- | --------------------------------------------------------------- |
| `setup.ps1`          | bootstrap per-user (uv→Python 3.12→venv→notebooklm-py→chromium) |
| `login.ps1`          | login חד-פעמי + doctor + list (קבל `msedge`/`chrome` כ-arg)     |
| `build-notebook.ps1` | יצירת מחברת-אחת + העלאת כל נוסחי-החקיקה                         |
| `mindmap.ps1`        | מפת-חשיבה (`generate mind-map`) של הקורפוס                      |
| `generate.ps1`       | `ask --prompt-file` → מעטפת-JSON ב-`.cache`                     |
| `run_generation.py`  | חלופת-Python ל-generate.ps1 (עוטף את אותו CLI · חוצה-פלטפורמה)  |

---

## שביריות ומגבלות

- **RPC לא-מתועד:** notebooklm-py נשען על RPC פנימי של Google. עדכון-Google עלול לשבור →
  `uv pip install --upgrade --python tools\nblm-bridge\.venv\Scripts\python.exe notebooklm-py`.
- **session-expiry:** ~15–20 דק' חוסר-פעילות → הרץ שוב `login.ps1`.
- **ToS / חשבון:** פועל עם **חשבון-Google שלך בלבד**, להפקה פנימית. אל תפיץ `storage_state.json`.
  שים-לב במחשב-ארגוני: זה מנוי-אישי שלך, והמכונה ארגונית.
- **throttle:** הסקריפטים ממתינים בין-קריאות; backoff על 429.

---

## fallback (ללא שינוי-קוד-אפליקציה)

אם הגשר יישבר לצמיתות — אפשר **הדבקה-ידנית**: כתוב את פלט-NotebookLM ל-
`.cache/notebooklm/scenarios/<ref>.json` בפורמט `{"ref":"...","generated_at":"...","content":"<JSON-של-המודל>"}`
(או batch-ישיר `{batch,contentType,items}`). ה-importer מזהה את שניהם. קוד-האפליקציה לא משתנה.
