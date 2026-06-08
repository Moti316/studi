<#
  build-notebook.ps1 — יוצר מחברת-NotebookLM אחת מאוחדת ומעלה אליה את **כל**
  נוסחי-החקיקה (.md · ~43) מ-courses/safety-officer/sources/legislation/.

  למה מחברת-אחת: תרחישי-בטיחות חוצי-תחומים (גובה+חשמל+צמ"א בתרחיש אחד) →
  מחברת-אחת עם מלוא-הקורפוס נותנת ל-NotebookLM לצטט את התקנה-הנכונה פר-תרחיש.
  ועיגון באותם קבצי-.md שעליהם שער-G3 בודק → שיעור-מעבר-verbatim גבוה יותר.
  (~43 מקורות < מגבלת-50 של NotebookLM.)

  דרישה מוקדמת: setup.ps1 + login.ps1 הורצו.

  שימוש:
    powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\build-notebook.ps1
    powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\build-notebook.ps1 "כותרת מותאמת"
#>
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'

$here    = $PSScriptRoot
$repo    = (Resolve-Path (Join-Path $here '..\..')).Path
$venvPy  = Join-Path $here '.venv\Scripts\python.exe'
$legiDir = Join-Path $repo 'courses\safety-officer\sources\legislation'
if (-not (Test-Path $venvPy)) { throw 'venv חסר — הרץ setup.ps1 + login.ps1' }
if (-not (Test-Path $legiDir)) { throw "תיקיית-חקיקה חסרה: $legiDir" }

$title = if ($args.Count -ge 1) { $args[0] } else { 'ממונה בטיחות — חקיקה מלאה' }

# 1) יצירת מחברת
Write-Host "[notebook] יוצר מחברת: $title"
$nbJson = & $venvPy -m notebooklm create $title --json | Out-String
$nb = $nbJson | ConvertFrom-Json
# notebooklm create --json מחזיר { "notebook": { "id": ... } } (מקונן)
$nbId = if ($nb.notebook -and $nb.notebook.id) { $nb.notebook.id }
        elseif ($nb.id) { $nb.id }
        elseif ($nb.notebook_id) { $nb.notebook_id }
        else { $nb.notebookId }
if (-not $nbId) { throw "לא הצלחתי לחלץ notebook-id מהפלט: $nbJson" }
Write-Host "[notebook] ID: $nbId"

# 2) העלאת כל נוסחי-החקיקה (.md) — למעט אינדקסים
$mdFiles = Get-ChildItem -Path $legiDir -Recurse -Filter *.md |
  Where-Object { $_.Name -ne 'INDEX.md' -and $_.Name -ne 'README.md' } |
  Sort-Object FullName
Write-Host "[notebook] מעלה $($mdFiles.Count) נוסחי-חקיקה (.md)..."

$ok = 0; $fail = 0
foreach ($f in $mdFiles) {
  try {
    & $venvPy -m notebooklm source add $f.FullName -n $nbId --type file --title $f.BaseName
    $ok++
    Write-Host "  ✓ $($f.Name)"
    Start-Sleep -Milliseconds 600   # throttle עדין (לא להעמיס)
  } catch {
    $fail++
    Write-Warning "  ✗ $($f.Name) — $($_.Exception.Message)"
  }
}

Write-Host ''
Write-Host "[notebook] ✓ הושלם: $ok הועלו · $fail נכשלו · מחברת=$nbId"
Write-Host "[notebook] שמור את ה-ID להפקה:"
Write-Host "    `$env:NBLM_NOTEBOOK_ID = '$nbId'"
Write-Host '[notebook] הצעדים הבאים:'
Write-Host "    powershell -File tools\nblm-bridge\mindmap.ps1   $nbId   # (אופציונלי) מפת-חשיבה"
Write-Host "    powershell -File tools\nblm-bridge\generate.ps1  $nbId   # הפקת 20 התרחישים"
