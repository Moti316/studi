# build-cabundle.ps1 - build a runtime CA bundle so the NotebookLM bridge works
# behind a corporate TLS-inspection proxy.
#
# WHY: notebooklm-py uses httpx, which loads certifi.where() and ignores
# SSL_CERT_FILE for its OWN trust store. Behind an SSL-decrypting corporate proxy
# the chain is re-signed by an internal root CA that is NOT in certifi -> every
# HTTPS call fails with CERTIFICATE_VERIFY_FAILED. (UV_SYSTEM_CERTS only fixes the
# `uv` installer, not runtime.) Fix: build a bundle = certifi + the Windows
# cert-store (which DOES contain the corporate root CA) and point SSL_CERT_FILE at
# it. httpx honors SSL_CERT_FILE when the file is a superset that includes certifi.
#
# Output: tools/nblm-bridge/.cache-cabundle.pem (git-ignored).
# generate-scenarios.ts auto-detects this file and sets SSL_CERT_FILE per CLI call.
# Idempotent - re-run if the corporate root CA rotates.
# See BUGS.md#notebooklm-runtime-ssl.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\nblm-bridge\build-cabundle.ps1
$ErrorActionPreference = 'Stop'

$here   = $PSScriptRoot
$venvPy = Join-Path $here '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPy)) { throw 'venv missing - run setup.ps1 first' }

# 1) certifi bundle path (the file httpx loads by default)
$certifi = (& $venvPy -c "import certifi; print(certifi.where())").Trim()
if (-not (Test-Path $certifi)) { throw "certifi bundle not found: $certifi" }

# 2) Windows root + intermediate CA stores (include the corporate root CA)
$stores = @(
  'Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root',
  'Cert:\LocalMachine\CA',   'Cert:\CurrentUser\CA'
)
$certs = Get-ChildItem -Path $stores -ErrorAction SilentlyContinue

# 3) combine: certifi first (full public root set), then the Windows certs
$bundle = Join-Path $here '.cache-cabundle.pem'
Get-Content $certifi -Raw -Encoding ascii | Out-File -FilePath $bundle -Encoding ascii
Add-Content -Path $bundle -Value "`r`n# === Windows cert-store (corporate root CA) ===" -Encoding ascii
foreach ($c in $certs) {
  $b64 = [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks')
  Add-Content -Path $bundle -Value "# Subject: $($c.Subject)" -Encoding ascii
  Add-Content -Path $bundle -Value '-----BEGIN CERTIFICATE-----' -Encoding ascii
  Add-Content -Path $bundle -Value $b64 -Encoding ascii
  Add-Content -Path $bundle -Value '-----END CERTIFICATE-----' -Encoding ascii
}

$size = (Get-Item $bundle).Length
Write-Host "[build-cabundle] wrote $bundle ($size bytes, $($certs.Count) Windows certs)"
Write-Host '[build-cabundle] generate-scenarios.ts auto-detects it via SSL_CERT_FILE.'
Write-Host '[build-cabundle] for an interactive CLI session, also run:'
Write-Host '    $env:SSL_CERT_FILE = "<repo>\tools\nblm-bridge\.cache-cabundle.pem"'
