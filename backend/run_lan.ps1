
Set-Location $PSScriptRoot
Write-Host "Starting Heart Monitor API on http://0.0.0.0:8000 (LAN) ..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
