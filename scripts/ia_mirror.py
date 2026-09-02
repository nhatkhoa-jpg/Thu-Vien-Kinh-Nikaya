#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os
from pathlib import Path
from typing import Iterable

RIGHTS_PHRASE = "YES_I_HAVE_VERIFIED_REDISTRIBUTION_RIGHTS"

def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def safe_assets(pack:Path, collection:str, publish:bool)->list[Path]:
    out=[]
    if publish:
        for p in (pack/f'{collection.lower()}-complete.pdf', pack/f'{collection.lower()}-complete.mp3'):
            if p.exists(): out.append(p)
        d=pack/'mp3'
        if d.exists(): out.extend(sorted(p for p in d.glob('*.mp3') if p.is_file()))
    return out

def write_preservation_files(pack:Path,collection:str,identifier:str,assets:Iterable[Path]):
    src=json.loads((pack/'manifest.json').read_text(encoding='utf-8'))
    rows=[{'path':p.relative_to(pack).as_posix(),'bytes':p.stat().st_size,'sha256':sha256(p)} for p in assets]
    payload={'schemaVersion':1,'identifier':identifier,'collection':collection,'generatedAt':src.get('generatedAt'),'catalogCount':src.get('catalogCount'),'readyCount':src.get('readyCount'),'missingCount':src.get('missingCount'),'totalTtsCharacters':src.get('totalChars'),'ttsPolicy':src.get('ttsPolicy'),'assetPolicy':'TTS source TXT files are never uploaded to Internet Archive by this mirror.','assets':rows}
    m=pack/'PRESERVATION-MANIFEST.json'; m.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    s=pack/'SHA256SUMS'; s.write_text(''.join(f'{sha256(p)}  {p.relative_to(pack).as_posix()}\n' for p in [m,*assets]),encoding='utf-8')
    return m,s

def main()->int:
    ap=argparse.ArgumentParser(); ap.add_argument('--collection',required=True,choices=['DN','MN','SN','AN','KN']); ap.add_argument('--pack',required=True); ap.add_argument('--identifier'); ap.add_argument('--publish-content',action='store_true'); ap.add_argument('--rights-confirmation',default=''); ap.add_argument('--dry-run',action='store_true'); args=ap.parse_args()
    c=args.collection.upper(); pack=Path(args.pack).resolve()/c.lower()
    if not (pack/'manifest.json').exists(): raise SystemExit(f'Missing media pack manifest: {pack / "manifest.json"}')
    if args.publish_content and args.rights_confirmation!=RIGHTS_PHRASE: raise SystemExit('Public scripture-bearing upload blocked: redistribution rights were not explicitly confirmed.')
    identifier=args.identifier or f'nikaya-vietnamese-{c.lower()}'
    assets=safe_assets(pack,c,args.publish_content); manifest,sums=write_preservation_files(pack,c,identifier,assets)
    upload=[manifest,sums,*assets]
    if args.dry_run:
        print(json.dumps({'status':'PASS','dryRun':True,'identifier':identifier,'collection':c,'mode':'content' if args.publish_content else 'metadata-only','plannedFiles':len(upload),'contentAssets':len(assets)},ensure_ascii=False)); return 0
    access=os.environ.get('IA_ACCESS_KEY',''); secret=os.environ.get('IA_SECRET_KEY','')
    if not access or not secret: raise SystemExit('Internet Archive credentials are missing')
    import internetarchive
    metadata={'title':f'{c} — Thư viện 5 Đại Tạng Kinh Nikāya','description':'Preservation mirror for the Five Nikāya Library. Manifests and SHA-256 checksums support restore verification. Scripture-bearing assets are uploaded only after redistribution rights are verified.','creator':'Thư viện 5 Đại Tạng Kinh Nikāya','subject':['Nikaya','Buddhism','Pali Canon','Vietnamese','digital preservation'],'language':'vie','mediatype':'data' if not args.publish_content else 'texts'}
    item=internetarchive.get_item(identifier,config={'s3':{'access':access,'secret':secret}})
    responses=item.upload([str(p) for p in upload],metadata=metadata,verbose=False,retries=3,retries_sleep=5)
    for r in responses:
        if not getattr(r,'ok',False): raise SystemExit(f'Internet Archive upload failed with HTTP {getattr(r,"status_code","unknown")}')
    names={f.get('name') for f in internetarchive.get_item(identifier).files}
    for required in (manifest.name,sums.name):
        if required not in names: raise SystemExit(f'Verification failed: {required} not present in item {identifier}')
    print(json.dumps({'status':'PASS','identifier':identifier,'collection':c,'mode':'content' if args.publish_content else 'metadata-only','uploadedFiles':len(upload),'contentAssets':len(assets)},ensure_ascii=False)); return 0

if __name__=='__main__': raise SystemExit(main())
