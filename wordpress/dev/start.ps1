param([switch]$InitializeDemo, [switch]$SkipImport)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    function New-RBCareSecret {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes); $rng.Dispose()
        return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    }
    function Invoke-RBCareCompose {
        & docker compose @args
        if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed: $($args[0])" }
    }
    New-Item -ItemType Directory -Force -Path private | Out-Null
    if (!(Test-Path -LiteralPath '.env')) {
        $dbSecret = New-RBCareSecret; $rootSecret = New-RBCareSecret; $adminSecret = New-RBCareSecret
        @("DB_PASSWORD=$dbSecret", "DB_ROOT_PASSWORD=$rootSecret", "ADMIN_PASSWORD=$adminSecret") | Set-Content -LiteralPath '.env' -Encoding ascii
        @('# Local WordPress access', '', 'Store: http://localhost:8096/', 'Admin: http://localhost:8096/wp-admin/', 'Username: rb_admin', "Password: $adminSecret", '', 'Local credentials only. Do not commit or upload this file.') | Set-Content -LiteralPath 'private/LOCAL-ACCESS.md' -Encoding utf8
    }
    & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & docker desktop start
        if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop and retry.' }
    }
    Invoke-RBCareCompose up -d db web
    Invoke-RBCareCompose exec -T -u root web sh -c 'mkdir -p /var/www/rbcare-private && chown www-data:www-data /var/www/rbcare-private && chmod 700 /var/www/rbcare-private'
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        & docker compose exec -T web test -f /var/www/html/wp-config.php
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 2
    }
    if (!$ready) { throw 'WordPress files are not ready. Retry this launcher.' }
    $freshInstall = $false
    & docker compose run --rm cli core is-installed 2>$null
    if ($LASTEXITCODE -ne 0) {
        $freshInstall = $true
        Invoke-RBCareCompose run --rm --entrypoint sh cli -c 'wp core install --url=http://localhost:8096 --title="RB Care Store" --admin_user=rb_admin --admin_email=admin@example.invalid --admin_password="$RB_ADMIN_PASSWORD" --skip-email'
    }
    & docker compose run --rm cli plugin is-installed woocommerce
    if ($LASTEXITCODE -ne 0) { Invoke-RBCareCompose run --rm cli plugin install woocommerce --activate }
    else { Invoke-RBCareCompose run --rm cli plugin activate woocommerce }
    Invoke-RBCareCompose run --rm cli plugin activate rb-care-commerce
    Invoke-RBCareCompose run --rm cli theme activate rb-care
    if (($freshInstall -or $InitializeDemo) -and !$SkipImport) {
        Invoke-RBCareCompose run --rm cli rb-care setup /project/migration/content.seed.json --publish --configure-local
        Invoke-RBCareCompose run --rm cli rb-care import-catalog /project/migration/catalog.seed.json --publish
        Invoke-RBCareCompose run --rm cli language core install hi_IN
    }
    Invoke-RBCareCompose run --rm cli rewrite flush --hard
    Write-Output 'Store: http://localhost:8096/ | Admin: http://localhost:8096/wp-admin/'
    Write-Output 'Local login: wordpress/dev/private/LOCAL-ACCESS.md (ignored by Git).'
    if (!$freshInstall -and !$InitializeDemo) { Write-Output 'Existing store data and settings were preserved; demo setup was not rerun.' }
} finally { Pop-Location }
