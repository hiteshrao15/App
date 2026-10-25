$ErrorActionPreference = "Stop"

function Assert-MajorVersion([string]$Name, [string]$Actual, [int]$Expected) {
  if ($Actual -notmatch "(\d+)") {
    throw "$Name version could not be parsed: $Actual"
  }
  $major = [int]$Matches[1]
  if ($major -ne $Expected) {
    throw "$Name major version $major is not the required $Expected (reported: $Actual)"
  }
  Write-Host "OK $Name $Actual"
}

$java = (& $env:ComSpec /c "java -version 2>&1" | Select-Object -First 1)
$javac = (& $env:ComSpec /c "javac -version 2>&1" | Select-Object -First 1)
$maven = (& mvn -version 2>&1 | Select-Object -First 1)
$node = (& node --version)
$npm = (& npm --version)
$expo = (& npx expo --version)
$docker = (& docker --version)
$compose = (& docker compose version)
$playwright = (& npx playwright --version)

Assert-MajorVersion "java" $java 21
Assert-MajorVersion "javac" $javac 21
Assert-MajorVersion "maven" $maven 3
Assert-MajorVersion "node" $node 20
Assert-MajorVersion "npm" $npm 10
Assert-MajorVersion "expo" $expo 57

if ($docker -notmatch "Docker version") { throw "Docker CLI unavailable" }
if ($compose -notmatch "Docker Compose") { throw "Docker Compose unavailable" }
if ($playwright -notmatch "Version") { throw "Playwright CLI unavailable" }

Write-Host "Toolchain preflight passed."
