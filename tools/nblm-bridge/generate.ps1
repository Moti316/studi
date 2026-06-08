<#
  generate.ps1 — שולח בקשת-הרחבה ל-NotebookLM וכותב את הפלט בפורמט שה-importer צורך.

  קורא את הפרומפט מ-.cache/notebooklm/requests/<request>.txt (נוצר ע"י
  `pnpm notebooklm:request`), שולח דרך `notebooklm ask --prompt-file`, וכותב
  מעטפת { ref, generated_at, content } ל-.cache/notebooklm/scenarios/<ref>.json.
  ה-importer (scripts/import-scenarios.ts) מחלץ את content ומריץ G1–G5.

  דרישה מוקדמת: setup.ps1 + login.ps1 + build-notebook.ps1 (notebook-id).

  שימוש:
    powershell -File tools\nblm-bridge\generate.ps1 <notebook-id>
    powershell -File tools\nblm-bridge\generate.ps1 <notebook-id> scenarios-expand my-ref
    # או הגדר $env:NBLM_NOTEBOOK_ID והרץ בלי arg.
#>
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'

$here   = $PSScriptRoot
$repo   = (Resolve-Path (Join-Path $here '..\..')).Path
$venvPy = Join-Path $here '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPy)) { throw 'venv חסר — הרץ setup.ps1 + login.ps1' }

$nbId = if ($args.Count -ge 1 -and $args[0]) { $args[0] }
        elseif ($env:NBLM_NOTEBOOK_ID) { $env:NBLM_NOTEBOOK_ID }
        else { throw 'חסר notebook-id (arg ראשון או $env:NBLM_NOTEBOOK_ID) — הרץ build-notebook.ps1' }
$request = if ($args.Count -ge 2) { $args[1] } else { 'scenarios-expand' }
$ref     = if ($args.Count -ge 3) { $args[2] } else { $request }

$reqFile = Join-Path $repo ".cache\notebooklm\requests\$request.txt"
$outDir  = Join-Path $repo '.cache\notebooklm\scenarios'
if (-not (Test-Path $reqFile)) { throw "קובץ-בקשה חסר: $reqFile  (הרץ: pnpm notebooklm:request)" }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "[generate] שולח בקשה (notebook=$nbId · request=$request)..."
$raw = & $venvPy -m notebooklm ask --prompt-file $reqFile -n $nbId --new --json | Out-String
$res = $raw | ConvertFrom-Json

# חילוץ הטקסט-תשובה (פלט-המודל = ה-JSON שלנו) — שמות-שדה אפשריים לפי גרסה.
$content = if ($res.answer) { $res.answer }
           elseif ($res.text) { $res.text }
           elseif ($res.response) { $res.response }
           elseif ($res.content) { $res.content }
           else { $raw }

$envelope = [ordered]@{
  ref          = $ref
  generated_at = (Get-Date).ToUniversalTime().ToString('o')
  content      = $content
}
$outFile = Join-Path $outDir "$ref.json"
($envelope | ConvertTo-Json -Depth 8) | Out-File -FilePath $outFile -Encoding utf8

Write-Host "[generate] ✓ נכתב: $outFile  ($($content.Length) תווים)"
Write-Host '[generate] הצעד הבא (אימות G1–G5 · ללא DB):'
Write-Host "    pnpm scenarios:import:dry"
Write-Host '[generate] ואז כתיבה ל-DB:  pnpm scenarios:import'
