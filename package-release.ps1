$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pkg = Get-Content (Join-Path $root "package.json") | ConvertFrom-Json
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$version = [string]$pkg.version

$releaseRoot = Join-Path $root "release"
$stagingName = "AutoLableServer-$version"
$stagingDir = Join-Path $releaseRoot $stagingName
$zipPath = Join-Path $releaseRoot ("{0}-{1}.zip" -f $stagingName, $timestamp)

$includePaths = @(
  ".env.example",
  "README.md",
  "QUICKSTART.md",
  "package.json",
  "package-lock.json",
  "index.js",
  "Dockerfile",
  "docker-compose.yml",
  "deploy.sh",
  "deploy.bat",
  "test-api.js",
  "config",
  "data",
  "middleware",
  "routes",
  "services",
  "utils"
)

if (Test-Path $stagingDir) {
  Remove-Item -Recurse -Force $stagingDir
}

if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

foreach ($relativePath in $includePaths) {
  $source = Join-Path $root $relativePath
  if (-not (Test-Path $source)) {
    throw "Missing required release path: $relativePath"
  }

  Copy-Item -Path $source -Destination $stagingDir -Recurse -Force
}

$runtimeFiles = @(
  (Join-Path $stagingDir "data\data.json"),
  (Join-Path $stagingDir "data\sessions.json"),
  (Join-Path $stagingDir "server.log"),
  (Join-Path $stagingDir "server.pid")
)

foreach ($file in $runtimeFiles) {
  if (Test-Path $file) {
    Remove-Item -Force $file
  }
}

$releaseInfo = @"
AutoLableServer Release Package
Version: $version
BuiltAt: $(Get-Date -Format s)

Quick deploy:
  Windows: deploy.bat
  Linux:   ./deploy.sh
"@

Set-Content -Path (Join-Path $stagingDir "RELEASE_INFO.txt") -Value $releaseInfo -Encoding UTF8

Compress-Archive -Path $stagingDir -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Release package created:"
Write-Host "  Staging: $stagingDir"
Write-Host "  Zip:     $zipPath"
