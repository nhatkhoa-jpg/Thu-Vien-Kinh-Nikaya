param(
  [Parameter(Mandatory=$false)][ValidateSet('DN','MN','SN','AN','KN')][string]$Collection='DN',
  [Parameter(Mandatory=$true)][string]$TtsCommand,
  [string]$PackRoot='dist/local-media',
  [int]$Workers=1,
  [switch]$Force
)

$ErrorActionPreference='Stop'
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

# Default is deliberately conservative. Raise Workers only if the local TTS backend safely supports parallel GPU jobs.
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
Write-Host "Tip: re-run this command anytime; existing per-sutta MP3 files are checkpointed and skipped."
