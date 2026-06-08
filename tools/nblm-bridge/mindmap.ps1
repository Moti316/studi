<#
  mindmap.ps1 — מפיק מפת-חשיבה (mind-map) של מחברת-החקיקה ב-NotebookLM.

  מפת-חשיבה = עץ-מושגים מובנה של הקורפוס (חוק→תקנה→נושא). שימושים:
   · עזר-יוצר: לראות את מבנה-הדומיין ולאתר חוסרים/חיבורים.
   · אות-מבנה: אפשר להזין את ה-JSON-tree כהקשר-מבני נוסף לבקשות-ההרחבה (דיוק-cross-reference).
   · ערך-לומד (עתידי): תצוגה-ויזואלית בקורס.

  הפלט: עץ-JSON ב-.cache/notebooklm/mindmaps/<ref>.json (git-ignored).
  דרישה מוקדמת: setup.ps1 + login.ps1 + build-notebook.ps1 (notebook-id).

  שימוש:
    powershell -File tools\nblm-bridge\mindmap.ps1 <notebook-id> [ref]
#>
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'

$here   = $PSScriptRoot
$repo   = (Resolve-Path (Join-Path $here '..\..')).Path
$venvPy = Join-Path $here '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPy)) { throw 'venv חסר — הרץ setup.ps1 + login.ps1' }

$nbId = if ($args.Count -ge 1 -and $args[0]) { $args[0] }
        elseif ($env:NBLM_NOTEBOOK_ID) { $env:NBLM_NOTEBOOK_ID }
        else { throw 'חסר notebook-id (arg ראשון או $env:NBLM_NOTEBOOK_ID)' }
$ref = if ($args.Count -ge 2) { $args[1] } else { 'legislation' }

$outDir = Join-Path $repo '.cache\notebooklm\mindmaps'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "$ref.json"

Write-Host "[mindmap] מפיק מפת-חשיבה (note-backed · sync) עבור notebook=$nbId..."
$raw = & $venvPy -m notebooklm generate mind-map -n $nbId --kind note-backed --json | Out-String
$raw | Out-File -FilePath $outFile -Encoding utf8

Write-Host "[mindmap] ✓ נכתב: $outFile"
Write-Host '[mindmap] (ניתן גם להפיק גרסה אינטראקטיבית: generate mind-map --kind interactive)'
