<#
  setup.ps1 — bootstrap per-user (ללא admin) של גשר-NotebookLM.
  uv → Python 3.12 standalone → venv → notebooklm-py[browser] → chromium.

  עוקף TLS-inspection ארגוני: UV_SYSTEM_CERTS=1 גורם ל-uv לסמוך על cert-store
  של Windows (שמכיל את ה-root-CA הארגוני) → הורדות עובדות גם דרך proxy-מפענח.

  אידמפוטנטי — בטוח להריץ שוב (מדלג על מה שכבר קיים).

  שימוש:
    powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\setup.ps1
#>
$ErrorActionPreference = 'Stop'
$env:UV_SYSTEM_CERTS = '1'   # עוקף TLS-inspection ארגוני (cert-store של Windows)
$env:PYTHONUTF8 = '1'        # עברית/Windows

$here   = $PSScriptRoot
$venv   = Join-Path $here '.venv'
$venvPy = Join-Path $venv 'Scripts\python.exe'
$req    = Join-Path $here 'requirements.txt'

function Find-Uv {
  $c = Get-Command uv -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  $p = Join-Path $env:USERPROFILE '.local\bin\uv.exe'
  if (Test-Path $p) { return $p }
  return $null
}

# 1) uv (per-user · ללא admin)
$uv = Find-Uv
if (-not $uv) {
  Write-Host '[setup] מתקין uv (per-user · ללא admin)...'
  powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
  $uv = Find-Uv
  if (-not $uv) { throw 'התקנת uv נכשלה — ראה https://astral.sh/uv' }
}
Write-Host "[setup] uv: $uv"

# 2) Python 3.12 standalone (per-user)
Write-Host '[setup] מוודא Python 3.12 (standalone)...'
& $uv python install 3.12

# 3) venv
if (-not (Test-Path $venvPy)) {
  Write-Host '[setup] יוצר venv...'
  & $uv venv $venv --python 3.12
}

# 4) תלויות
Write-Host '[setup] מתקין תלויות (notebooklm-py[browser])...'
& $uv pip install --python $venvPy -r $req

# 5) chromium (ל-login האינטראקטיבי)
Write-Host '[setup] מוודא chromium ל-login...'
& $venvPy -m playwright install chromium

Write-Host ''
Write-Host '[setup] ✓ הותקן בהצלחה.'
Write-Host '[setup] הצעד הבא — login חד-פעמי (ההזדהות שלך · נשמרת מקומית):'
Write-Host '        powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\login.ps1'
