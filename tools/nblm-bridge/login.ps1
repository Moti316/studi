<#
  login.ps1 — ההתחברות החד-פעמית ל-NotebookLM (ההזדהות שלך · נשמרת מקומית).

  פותח חלון-דפדפן → אתה מתחבר לחשבון-Google שבו יש מנוי Gemini/NotebookLM →
  הכלי מזהה אוטומטית ושומר session ל-storage_state.json (git-ignored · אישי).
  מכאן והלאה הגשר משתמש ב-session השמור — אפס-קליקים פר-הפקה.

  ⚠️ זהו הצעד היחיד שאינו ניתן-לאוטומציה (ה-Google-auth שלך · סיסמה/2FA).
     חילוץ-cookies מ-Chrome נחסם ע"י App-Bound Encryption (דורש admin) — לכן login אינטראקטיבי.

  שימוש:
    powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\login.ps1
    powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\login.ps1 msedge   # אם chromium קורס
#>
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'

$here   = $PSScriptRoot
$venvPy = Join-Path $here '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPy)) { throw 'venv חסר — הרץ קודם setup.ps1' }

$browser = if ($args.Count -ge 1) { $args[0] } else { 'chromium' }

Write-Host "[login] פותח דפדפן ($browser) — התחבר לחשבון-Google של מנוי ה-NotebookLM."
Write-Host '        (אם החלון קורס/לא-נפתח: הרץ עם msedge או chrome — login.ps1 msedge)'
& $venvPy -m notebooklm login --browser $browser

Write-Host ''
Write-Host '[login] בדיקת-תקינות (doctor):'
& $venvPy -m notebooklm doctor

Write-Host ''
Write-Host '[login] המחברות שלך:'
& $venvPy -m notebooklm list

Write-Host ''
Write-Host '[login] ✓ מחובר. עכשיו אפשר לבנות את מחברת-החקיקה:'
Write-Host '        powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\build-notebook.ps1'
