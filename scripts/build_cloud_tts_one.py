#!/usr/bin/env python3
import argparse, base64, hashlib, html, json, os, re, subprocess, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

API_BASE='https://suttacentral.net/api'
AUTHOR='minh_chau'
LANG='vi'
UA='Thu-Vien-Kinh-Nikaya-CloudTTS/1.0'
VOICES={
 'chirp3-hd':'vi-VN-Chirp3-HD-Aoede',
 'neural2':'vi-VN-Neural2-A',
 'wavenet':'vi-VN-Wavenet-A',
}
MODEL_MAX_CHARS={
 'chirp3-hd':900,
 'neural2':3000,
 'wavenet':3000,
}
CHIRP_MAX_SENTENCE_CHARS=220


def fetch_json(url, attempts=5):
    last=None
    for i in range(attempts):
        try:
            req=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':UA})
            with urllib.request.urlopen(req,timeout=60) as r:return json.loads(r.read().decode())
        except Exception as e:
            last=e; time.sleep(min(2**i,10))
    raise RuntimeError(f'fetch failed {url}: {last}')


def clean(s):
    s=html.unescape(s or '')
    s=re.sub(r'<br\s*/?>','\n',s,flags=re.I); s=re.sub(r'<[^>]+>',' ',s)
    s=s.replace('\u00a0',' ').replace('–','—')
    s=re.sub(r'[ \t]+',' ',s); s=re.sub(r'\n\s*\n+','\n\n',s)
    return s.strip()


def segments(data):
    if not data:return []
    raw=data.get('translation_text')
    if raw is None:
        tr=data.get('translation')
        raw=tr.get('text') if isinstance(tr,dict) else tr
    if raw is None: raw=data.get('text')
    if isinstance(raw,str): return [clean(x) for x in re.split(r'\n{2,}|</p>',raw,flags=re.I) if clean(x)]
    if isinstance(raw,dict):
        keys=data.get('keys_order') or list(raw)
        return [clean(str(raw.get(k,''))) for k in keys if clean(str(raw.get(k,'')))]
    return []


def fetch_text(uid):
    info=fetch_json(f'{API_BASE}/suttas/{uid}')
    trs=((info or {}).get('suttaplex') or {}).get('translations') or []
    same=[t for t in trs if t.get('lang')==LANG]
    if not same: raise RuntimeError(f'{uid}: no Vietnamese translation')
    chosen=next((t for t in same if t.get('author_uid')==AUTHOR),None) or next((t for t in same if t.get('segmented')),same[0])
    au=chosen.get('author_uid')
    payload=None
    if chosen.get('segmented'):
        try: payload=fetch_json(f'{API_BASE}/bilarasuttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(au)}?lang={LANG}')
        except Exception: pass
    seg=segments(payload)
    if not seg:
        seg=segments(fetch_json(f'{API_BASE}/suttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(au)}?lang={LANG}'))
    if not seg: raise RuntimeError(f'{uid}: empty translation')
    text='\n\n'.join(seg)
    source=f'https://suttacentral.net/{uid}/{LANG}/{au}'
    return normalize(text),chosen,source


def normalize(text):
    text=re.sub(r'\b(?:TTC|Vi-n|SC)\s*\d+[A-Za-z.-]*\b',' ',text,flags=re.I)
    refs={
        'DN':'Trường Bộ',
        'MN':'Trung Bộ',
        'SN':'Tương Ưng Bộ',
        'AN':'Tăng Chi Bộ',
        'KN':'Tiểu Bộ',
    }
    for code,name in refs.items():
        text=re.sub(rf'\b{code}\s*(\d+(?:\.\d+)*)\b',rf'{name} \1',text,flags=re.I)
    text=text.replace('…','...')
    text=re.sub(r'\s+([,.;:!?])',r'\1',text)
    text=re.sub(r'([.!?])\s+',r'\1\n',text)
    text=re.sub(r'\n{3,}','\n\n',text)
    return text.strip()


def split_long_piece(text,max_chars):
    text=text.strip()
    if len(text)<=max_chars:return [text] if text else []
    out=[]; rest=text
    preferred=('; ',': ', ', ',' — ','— ')
    while len(rest)>max_chars:
        cut=0
        for marker in preferred:
            pos=rest.rfind(marker,0,max_chars+1)
            if pos>=max_chars//2: cut=max(cut,pos+len(marker))
        if cut==0:
            pos=rest.rfind(' ',0,max_chars+1)
            if pos>0: cut=pos+1
        if cut==0: cut=max_chars
        out.append(rest[:cut].strip()); rest=rest[cut:].strip()
    if rest: out.append(rest)
    return out


def chunks(text,max_chars=3200):
    paras=[p.strip() for p in text.split('\n') if p.strip()]
    out=[]; cur=''
    for p in paras:
        sentence_bits=re.split(r'(?<=[.!?])\s+',p)
        for sentence in sentence_bits:
            for x in split_long_piece(sentence,max_chars):
                cand=(cur+' '+x).strip()
                if cur and len(cand)>max_chars:
                    out.append(cur); cur=x
                else: cur=cand
    if cur: out.append(cur)
    return out


def chirp_sentence(text):
    """Create a request-only sentence boundary without modifying source/corpus text."""
    text=text.strip()
    if not text:return ''
    if text[-1] in '.!?':return text
    # At artificial split points, replace trailing clause punctuation with a real
    # sentence stop. Chirp3-HD enforces a sentence-length limit independently of
    # the overall request size, so request boundaries alone are insufficient.
    text=text.rstrip(' ,;:—')
    return text+'.' if text else ''


def chirp_chunks(text,max_sentence_chars=CHIRP_MAX_SENTENCE_CHARS):
    """One bounded, explicitly terminated sentence per Chirp3-HD API request."""
    out=[]
    for para in (p.strip() for p in text.split('\n') if p.strip()):
        for sentence in re.split(r'(?<=[.!?])\s+',para):
            for fragment in split_long_piece(sentence,max_sentence_chars):
                request_text=chirp_sentence(fragment)
                if request_text: out.append(request_text)
    return out


def tts_chunks(text,model):
    if model=='chirp3-hd':return chirp_chunks(text)
    return chunks(text,MODEL_MAX_CHARS[model])


def validate_tts_chunks(pieces,model):
    if not pieces:return False
    if any(len(piece)>MODEL_MAX_CHARS[model] for piece in pieces):return False
    if model=='chirp3-hd':
        for piece in pieces:
            if piece[-1] not in '.!?':return False
            sentence_bodies=[x.strip() for x in re.split(r'(?<=[.!?])\s+',piece) if x.strip()]
            if any(len(x)>CHIRP_MAX_SENTENCE_CHARS+1 for x in sentence_bodies):return False
    return True


def synth(key,voice,text,out):
    payload={'input':{'text':text},'voice':{'languageCode':'vi-VN','name':voice},'audioConfig':{'audioEncoding':'MP3','speakingRate':0.92}}
    req=urllib.request.Request(f'https://texttospeech.googleapis.com/v1/text:synthesize?key={key}',data=json.dumps(payload,ensure_ascii=False).encode(),headers={'Content-Type':'application/json; charset=utf-8'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=90) as r: data=json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(e.read().decode(errors='replace'))
    out.write_bytes(base64.b64decode(data['audioContent']))


def duration(path):
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)],capture_output=True,text=True,check=True)
    return float(p.stdout.strip())


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--ref',required=True); ap.add_argument('--model',choices=VOICES,required=True); ap.add_argument('--out',default='dist/cloud-one'); a=ap.parse_args()
    key=os.environ['GOOGLE_TTS_API_KEY']; out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    text,chosen,source=fetch_text(a.ref)
    if len(text)<200: raise RuntimeError(f'{a.ref}: suspicious text {len(text)} chars')
    pieces=tts_chunks(text,a.model); part_files=[]
    if not validate_tts_chunks(pieces,a.model):
        raise RuntimeError(f'{a.ref}: invalid TTS chunking for {a.model}')
    for i,piece in enumerate(pieces,1):
        f=out/f'.part-{i:03d}.mp3'; synth(key,VOICES[a.model],piece,f); part_files.append(f)
    concat=out/'.concat.txt'; concat.write_text('\n'.join("file '%s'"%f.resolve().as_posix().replace("'","'\\''") for f in part_files),encoding='utf-8')
    mp3=out/f'{a.ref}.mp3'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(mp3)],check=True)
    dur=duration(mp3); sha=hashlib.sha256(mp3.read_bytes()).hexdigest()
    meta={'version':'1.0','canonicalRef':a.ref,'language':'vi','provider':'Google Cloud Text-to-Speech','model':a.model,'voice':VOICES[a.model],'characters':sum(len(x) for x in pieces),'normalizedTextCharacters':len(text),'chunkCount':len(pieces),'durationSeconds':round(dur,3),'bytes':mp3.stat().st_size,'sha256':sha,'textSha256':hashlib.sha256(text.encode()).hexdigest(),'textSource':source,'textAuthorUid':chosen.get('author_uid'),'narrationNormalizationVersion':'1.2','ttsSegmentationVersion':'chirp-sentence-safe-v2' if a.model=='chirp3-hd' else 'standard-v1','ttsMaxSentenceCharacters':CHIRP_MAX_SENTENCE_CHARS if a.model=='chirp3-hd' else None,'speakingRate':0.92}
    (out/f'{a.ref}.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(meta,ensure_ascii=False))
if __name__=='__main__': main()
