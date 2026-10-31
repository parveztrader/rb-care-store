$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try { & docker compose stop; if ($LASTEXITCODE -ne 0) { throw 'Could not stop RB Care containers.' } }
finally { Pop-Location }
