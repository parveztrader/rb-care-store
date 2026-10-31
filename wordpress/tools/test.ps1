$ErrorActionPreference = 'Stop'
$wordpressRoot = Split-Path $PSScriptRoot -Parent
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required for the test scripts. The WordPress site itself runs with Docker.' }
Push-Location (Join-Path $wordpressRoot 'dev')
try {
    Invoke-WebRequest -Uri 'http://localhost:8096/' -UseBasicParsing -TimeoutSec 15 | Out-Null
    & docker compose exec -T web sh -c 'find /project/wp-content /project/tests /project/tools -name "*.php" -print0 | xargs -0 -n1 php -l'
    if ($LASTEXITCODE -ne 0) { throw 'PHP syntax check failed.' }
    foreach ($script in @('wp-content/plugins/rb-care-commerce/assets/store.js','wp-content/plugins/rb-care-commerce/assets/admin.js','tests/http.mjs','tests/admin-prepare.mjs','tests/admin-check.mjs','tests/admin-cleanup.mjs')) {
        & node --check (Join-Path $wordpressRoot $script)
        if ($LASTEXITCODE -ne 0) { throw "JavaScript syntax check failed: $script" }
    }
    & node (Join-Path $wordpressRoot 'tests/http.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'WordPress regression suite failed. Review wordpress/dev/reports/.' }
    Write-Output 'WordPress syntax and regression checks passed.'
} finally { Pop-Location }
