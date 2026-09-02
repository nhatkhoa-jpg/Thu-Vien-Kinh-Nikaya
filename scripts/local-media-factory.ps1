param(
  [Parameter(Mandatory=$false)][ValidateSet('DN','MN','SN','AN','KN')][string]$Collection='DN',
  [Parameter(Mandatory=$true)][string]$TtsCommand,
  [string]$PackRoot='dist/local-media',
  [int]$Workers=1,
  [switch]$Force,
  [switch]$AutoPublishR2,
  [switch]$AutoPublishViaGitHub,
  [switch]$DeleteVerifiedLocal
)

$ErrorActionPreference='Stop'
if($AutoPublishR2 -and $AutoPublishViaGitHub){throw 'Choose only one publish path: direct R2 or GitHub relay.'}
$collectionLower=$Collection.ToLowerInvariant()
$base=Join-Path $PackRoot $collectionLower
$manifestPath=Join-Path $base 'manifest.json'
if(-not (Test-Path $manifestPath)){
  node scripts/export-local-media-pack.mjs --collection $Collection --out $PackRoot
}
$manifest=Get-Content $manifestPath -Raw | ConvertFrom-Json
$ready=@($manifest.items | Where-Object {$_.status -eq 'ready'})
if($ready.Count -eq 0){throw "No ready items for $Collection"}

function Invoke-One($item){
  $input=Join-Path $base $item.textFile
  $output=Join-Path $base $item.mp3File
  $outputDir=Split-Path $output -Parent
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  if((Test-Path $output) -and -not $Force){
    Write-Host "SKIP $($item.canonicalRef) -> already exists"
    return
  }
  $cmd=$TtsCommand.Replace('{input}',('"'+$input+'"')).Replace('{output}',('"'+$output+'"'))
  Write-Host "RENDER $($item.canonicalRef)"
  cmd.exe /d /s /c $cmd
  if($LASTEXITCODE -ne 0){throw "TTS failed for $($item.canonicalRef) exit=$LASTEXITCODE"}
  if(-not (Test-Path $output)){throw "TTS command did not create $output"}
}

if($Workers -le 1){
  foreach($item in $ready){Invoke-One $item}
}else{
  $queue=[System.Collections.Concurrent.ConcurrentQueue[object]]::new()
  foreach($item in $ready){$queue.Enqueue($item)}
  $jobs=@()
  for($i=0;$i -lt $Workers;$i++){
    $jobs+=Start-ThreadJob -ArgumentList $queue,$base,$TtsCommand,$Force -ScriptBlock {
      param($queue,$base,$template,$force)
      while($queue.TryDequeue([ref]$item)){
        $input=Join-Path $base $item.textFile;$output=Join-Path $base $item.mp3File
        if((Test-Path $output) -and -not $force){continue}
        New-Item -ItemType Directory -Force -Path (Split-Path $output -Parent) | Out-Null
        $cmd=$template.Replace('{input}',('"'+$input+'"')).Replace('{output}',('"'+$output+'"'))
        cmd.exe /d /s /c $cmd
        if($LASTEXITCODE -ne 0){throw "TTS failed for $($item.canonicalRef)"}
      }
    }
  }
  $jobs | Wait-Job | Receive-Job
  $jobs | Remove-Job
}

$missing=@($ready | Where-Object {-not (Test-Path (Join-Path $base $_.mp3File))})
if($missing.Count){
  Write-Warning "$($missing.Count) MP3 files are still missing. Re-run the same command; completed files will be skipped."
  exit 2
}

$ffconcat=Join-Path $base 'concat.ffconcat'
$outMp3=Join-Path $base ($collectionLower+'-complete.mp3')
ffmpeg -hide_banner -loglevel warning -y -f concat -safe 0 -i $ffconcat -c copy $outMp3
if($LASTEXITCODE -ne 0){throw 'FFmpeg concat failed. Ensure all per-sutta files use the same MP3 codec/sample rate/channel layout.'}
Write-Host "DONE: $outMp3"

if($AutoPublishViaGitHub){
  $relay=Join-Path $PSScriptRoot 'r2-relay-via-github.ps1'
  if(-not (Test-Path $relay)){throw "Missing relay script: $relay"}
  $mp3Dir=Join-Path $base 'mp3'
  $files=@(Get-ChildItem -LiteralPath $mp3Dir -File -Filter '*.mp3' | Sort-Object Name)
  foreach($media in $files){
    $relayArgs=@('-ExecutionPolicy','Bypass','-File',$relay,'-File',$media.FullName,'-Prefix',("audio/"+$collectionLower))
    if($DeleteVerifiedLocal){$relayArgs+='-DeleteVerifiedLocal'}
    & powershell @relayArgs
    if($LASTEXITCODE -ne 0){throw "GitHub R2 relay failed for $($media.Name)"}
  }
  $relayArgs=@('-ExecutionPolicy','Bypass','-File',$relay,'-File',$outMp3,'-Prefix',("audio/"+$collectionLower+"/complete"))
  if($DeleteVerifiedLocal){$relayArgs+='-DeleteVerifiedLocal'}
  & powershell @relayArgs
  if($LASTEXITCODE -ne 0){throw "GitHub R2 relay failed for complete MP3"}
}

if($AutoPublishR2){
  foreach($name in @('R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_ACCOUNT_ID')){
    if([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))){
      throw "AutoPublishR2 requested but environment variable $name is missing"
    }
  }
  $mp3Dir=Join-Path $base 'mp3'
  $args=@('scripts/r2_sync.py',$mp3Dir,'--prefix',("audio/"+$collectionLower),'--max-total-gib','9')
  if($DeleteVerifiedLocal){$args+='--delete-verified-local'}
  Write-Host "R2 PUBLISH per-sutta MP3 -> audio/$collectionLower"
  python @args
  if($LASTEXITCODE -ne 0){throw "R2 sync failed for per-sutta MP3"}

  $completeStage=Join-Path $base '_r2-complete'
  New-Item -ItemType Directory -Force -Path $completeStage | Out-Null
  $stagedComplete=Join-Path $completeStage (Split-Path $outMp3 -Leaf)
  Copy-Item $outMp3 $stagedComplete -Force
  $args2=@('scripts/r2_sync.py',$completeStage,'--prefix',("audio/"+$collectionLower+"/complete"),'--max-total-gib','9')
  if($DeleteVerifiedLocal){$args2+='--delete-verified-local'}
  Write-Host "R2 PUBLISH complete MP3 -> audio/$collectionLower/complete"
  python @args2
  if($LASTEXITCODE -ne 0){throw "R2 sync failed for complete MP3"}
  Remove-Item $completeStage -Recurse -Force -ErrorAction SilentlyContinue
  if($DeleteVerifiedLocal -and (Test-Path $outMp3)){
    Remove-Item $outMp3 -Force
    Write-Host "DELETE-LOCAL verified complete MP3: $outMp3"
  }
}

Write-Host "Tip: re-run this command anytime; existing per-sutta MP3 files are checkpointed and skipped."
