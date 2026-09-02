param(
  [Parameter(Mandatory=$true)][string]$File,
  [Parameter(Mandatory=$true)][string]$Prefix,
  [switch]$DeleteVerifiedLocal,
  [string]$Repo='nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya'
)

$ErrorActionPreference='Stop'
$filePath=(Resolve-Path $File).Path
if(-not (Test-Path $filePath -PathType Leaf)){throw "File not found: $File"}

function Resolve-Gh {
  $cmd=Get-Command gh -ErrorAction SilentlyContinue
  if($cmd){return $cmd.Source}
  $candidate='C:\Program Files\GitHub CLI\gh.exe'
  if(Test-Path $candidate){return $candidate}
  $winget=Get-Command winget -ErrorAction SilentlyContinue
  if($winget){
    & $winget.Source install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements --silent | Out-Null
    if(Test-Path $candidate){return $candidate}
  }
  throw 'GitHub CLI is unavailable and could not be installed automatically.'
}

$gh=Resolve-Gh

# Prefer an existing gh login. If gh itself is not logged in, reuse the existing
# Git Credential Manager credential already used by git without printing it.
& $gh auth status --hostname github.com *> $null
if($LASTEXITCODE -ne 0 -and [string]::IsNullOrWhiteSpace($env:GH_TOKEN)){
  $credentialInput="protocol=https`nhost=github.com`n`n"
  $credentialOutput=$credentialInput | git credential fill 2>$null
  $passwordLine=$credentialOutput | Where-Object {$_ -like 'password=*'} | Select-Object -First 1
  if($passwordLine){
    $env:GH_TOKEN=$passwordLine.Substring(9)
  }
}

& $gh api "repos/$Repo" --silent
if($LASTEXITCODE -ne 0){throw 'No reusable GitHub authentication is available on this machine.'}

$sha=(Get-FileHash -Algorithm SHA256 -LiteralPath $filePath).Hash.ToLowerInvariant()
$size=(Get-Item -LiteralPath $filePath).Length
$requestId=[Guid]::NewGuid().ToString('N')
$tag="r2-relay-$requestId"
$runName="R2 relay $requestId"

Write-Host "RELAY STAGE: $([IO.Path]::GetFileName($filePath)) -> $Prefix"
& $gh release create $tag $filePath --repo $Repo --title $tag --notes 'Temporary private-to-ops relay object. Delete after verified R2 upload.'
if($LASTEXITCODE -ne 0){throw 'Failed to create temporary GitHub release asset.'}

try {
  & $gh workflow run r2-relay.yml --repo $Repo --ref main `
    -f "tag=$tag" `
    -f "prefix=$Prefix" `
    -f "expected_sha256=$sha" `
    -f "expected_size=$size" `
    -f "request_id=$requestId"
  if($LASTEXITCODE -ne 0){throw 'Failed to dispatch R2 relay workflow.'}

  $run=$null
  for($i=0;$i -lt 90 -and -not $run;$i++){
    Start-Sleep -Seconds 2
    $json=& $gh run list --repo $Repo --workflow r2-relay.yml --limit 30 --json databaseId,name,status,conclusion
    if($LASTEXITCODE -eq 0){
      $runs=$json | ConvertFrom-Json
      $run=$runs | Where-Object {$_.name -eq $runName} | Select-Object -First 1
    }
  }
  if(-not $run){throw 'Timed out waiting for GitHub R2 relay run to appear.'}

  & $gh run watch $run.databaseId --repo $Repo --exit-status
  if($LASTEXITCODE -ne 0){throw "R2 relay workflow failed. GitHub run id=$($run.databaseId)"}

  Write-Host "R2 RELAY VERIFIED: sha256=$sha size=$size"
  if($DeleteVerifiedLocal){
    Remove-Item -LiteralPath $filePath -Force
    Write-Host "DELETE-LOCAL verified object: $filePath"
  }
}
catch {
  Write-Warning 'R2 relay failed; local source was preserved.'
  throw
}
