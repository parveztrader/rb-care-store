param([string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$wordpressRoot = Split-Path $PSScriptRoot -Parent
$projectRoot = Split-Path $wordpressRoot -Parent
if (!$OutputDirectory) { $OutputDirectory = Join-Path $wordpressRoot 'releases' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$OutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path
$themeHeader = Get-Content -LiteralPath (Join-Path $wordpressRoot 'wp-content/themes/rb-care/style.css') -Raw
$pluginHeader = Get-Content -LiteralPath (Join-Path $wordpressRoot 'wp-content/plugins/rb-care-commerce/rb-care-commerce.php') -Raw
$themeVersion = [regex]::Match($themeHeader, 'Version:\s*([0-9.]+)').Groups[1].Value
$pluginVersion = [regex]::Match($pluginHeader, 'Version:\s*([0-9.]+)').Groups[1].Value
if (!$themeVersion -or !$pluginVersion) { throw 'Theme/plugin version headers are required.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Write-RBCareArchive($destination, $entries) {
    $stream = [System.IO.File]::Open($destination, [System.IO.FileMode]::Create)
    $archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        foreach ($entry in $entries) {
            if ($entry.Name -match '(^|/)(private|reports|downloads|node_modules|\.git)(/|$)|(^|/)\.env($|\.)|\.sql$') { throw "Private/runtime file rejected: $($entry.Name)" }
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $entry.Path, $entry.Name, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $archive.Dispose(); $stream.Dispose() }
}
function Get-RBCareEntries($directory, $prefix) {
    $absolute = (Resolve-Path -LiteralPath $directory).Path
    foreach ($file in Get-ChildItem -LiteralPath $absolute -Recurse -File) {
        $relative = $file.FullName.Substring($absolute.Length + 1).Replace('\', '/')
        [pscustomobject]@{Path = $file.FullName; Name = "$prefix/$relative"}
    }
}
$theme = @(Get-RBCareEntries (Join-Path $wordpressRoot 'wp-content/themes/rb-care') 'rb-care')
$plugin = @(Get-RBCareEntries (Join-Path $wordpressRoot 'wp-content/plugins/rb-care-commerce') 'rb-care-commerce')
Write-RBCareArchive (Join-Path $OutputDirectory "rb-care-theme-$themeVersion.zip") $theme
Write-RBCareArchive (Join-Path $OutputDirectory "rb-care-commerce-$pluginVersion.zip") $plugin
$source = @()
$source += Get-RBCareEntries (Join-Path $wordpressRoot 'wp-content/themes/rb-care') 'wordpress/wp-content/themes/rb-care'
$source += Get-RBCareEntries (Join-Path $wordpressRoot 'wp-content/plugins/rb-care-commerce') 'wordpress/wp-content/plugins/rb-care-commerce'
foreach ($relative in @('dev/compose.yml', 'dev/local-guard.php', 'dev/uploads.ini', 'dev/start.ps1', 'dev/stop.ps1', 'migration/catalog.seed.json', 'migration/content.seed.json', 'tools/package.ps1', 'tools/test.ps1', 'tools/local-status.php', 'tools/update-status.php', 'tests/http.mjs', 'tests/integration.php', 'tests/cleanup.php', 'tests/admin-prepare.mjs', 'tests/admin-fixtures.php', 'tests/admin-check.mjs', 'tests/admin-verify.php', 'tests/admin-cleanup.php', 'tests/admin-cleanup.mjs')) {
    $source += [pscustomobject]@{Path = Join-Path $wordpressRoot $relative; Name = "wordpress/$relative"}
}
foreach ($relative in @('README.md', 'HANDOFF.md', 'Start-WordPress.cmd', 'Stop-WordPress.cmd', 'Test-WordPress.cmd', '.gitignore')) { $source += [pscustomobject]@{Path = Join-Path $projectRoot $relative; Name = $relative} }
$source += Get-RBCareEntries (Join-Path $projectRoot 'docs') 'docs'
Write-RBCareArchive (Join-Path $OutputDirectory "rb-care-wordpress-source-$pluginVersion.zip") $source
Get-ChildItem -LiteralPath $OutputDirectory -Filter 'rb-care-*-*.zip' | Get-FileHash -Algorithm SHA256 | Select-Object Hash,Path | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $OutputDirectory 'rb-care-checksums.json') -Encoding utf8
Write-Output "Packages saved in $OutputDirectory"
