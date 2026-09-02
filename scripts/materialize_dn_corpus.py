#!/usr/bin/env python3
import hashlib,json,re,sys
from pathlib import Path
from build_collection_audio import API_BASE,fetch_json,fetch_text

CAT=Path('data/catalog/suttas.json')
AUDIO=Path('data/catalog/audio.json')
OUT=Path('data/content/dn.vi.json')
REPO='nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya'
TAG='dn-vi-audio-v1'


def title_from_text(text,n):
    sample=re.sub(r'\s+',' ',text[:2200]).strip()
    for p in [rf'(?:Trường Bộ(?: Kinh)?\s*)?{n}\s*[\.\-:]\s*(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)',r'Kinh\s+(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)']:
        m=re.search(p,sample,re.I)
        if m:
            t=m.group(1).strip(' .—:-')
            if t and len(t)<180:return t if t.lower().startswith('kinh ') else 'Kinh '+t
    return f'Trường Bộ Kinh {n}'


def main():
    catalog=json.loads(CAT.read_text(encoding='utf-8'))
    old={x.get('canonicalRef'):x for x in catalog if x.get('collection')=='DN'}
    others=[x for x in catalog if x.get('collection')!='DN']
    audio=json.loads(AUDIO.read_text(encoding='utf-8'))
    corpus={}; entries=[]
    for n in range(1,35):
        uid=f'dn{n}'; print(f'DN {n}/34',flush=True)
        text,chosen,source=fetch_text('dn',n)
        if len(text)<500: raise RuntimeError(f'{uid}: suspicious text length {len(text)}')
        seg=[{'id':f'p{i+1}','text':p.strip()} for i,p in enumerate(re.split(r'\n\s*\n+',text)) if p.strip()]
        if not seg: raise RuntimeError(f'{uid}: no segments')
        sp=fetch_json(f'{API_BASE}/suttaplex/{uid}'); sp=sp[0] if isinstance(sp,list) and sp else (sp or {})
        prev=old.get(uid,{})
        vi=prev.get('vi') or title_from_text(text,n)
        pali=prev.get('pali') or (sp.get('original_title') or f'Dīgha Nikāya {n}').strip()
        en=prev.get('en') or (sp.get('translated_title') or f'Long Discourses {n}').strip()
        translator=chosen.get('author') or chosen.get('author_short') or 'Thích Minh Châu'
        corpus[uid]={
          'language':'vi','author':translator,'authorUid':chosen.get('author_uid') or 'minh_chau','sourceUrl':source,
          'license':'Xem ghi chú quyền sử dụng tại nguồn','segments':seg,
          'contentHash':hashlib.sha256(text.encode()).hexdigest(),'contentVersion':'2026-09-02.dn-full-v1'
        }
        entries.append({
          'id':f'nikaya.dn.{n}','canonicalRef':uid,'slug':prev.get('slug') or f'dn-{n}','code':f'DN {n}','viCode':f'TrB {n}','collection':'DN',
          'pali':pali,'vi':vi,'en':en,'topics':prev.get('topics',[]),
          'source':{'url':source,'provider':'SuttaCentral','translator':translator,'license':'Xem ghi chú quyền sử dụng tại nguồn','language':'vi'},
          'media':prev.get('media') or {'bookUrl':'https://suttacentral.net/edition/dn/vi/minh_chau'},
          'summary':prev.get('summary') or {'vi':f'{vi} — bài số {n} thuộc Trường Bộ Kinh (Dīgha Nikāya). Toàn văn đã được materialize để đọc và tạo PDF trực tiếp trong thư viện.','en':sp.get('blurb') or en},
          'practice':prev.get('practice') or {'vi':f'Đọc chậm toàn văn TrB {n}, đánh dấu đoạn quan trọng và nghe MP3 khi cần.','en':'Read the full discourse slowly and reflect on key passages.'},
          'readMinutes':max(3,round(len(text)/850)),'featured':prev.get('featured',False),'contentVersion':'2026-09-02.dn-full-v1'
        })
        audio.setdefault(f'nikaya.dn.{n}',{})['vi']={
          'url':f'https://github.com/{REPO}/releases/download/{TAG}/dn{n}.mp3','label':f'TrB {n} · MP3 checkpoint tiếng Việt',
          'provider':'5 Đại Tạng Kinh Nikāya','sourceUrl':source,'download':True
        }
    merged=entries+others
    CAT.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    AUDIO.write_text(json.dumps(audio,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(corpus,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert len(entries)==34 and len(corpus)==34
    assert all(corpus[f'dn{n}']['segments'] for n in range(1,35))
    print('DN corpus materialized: 34/34 catalog + 34/34 full text + 34/34 checkpoint audio mappings')

if __name__=='__main__':
    try: main()
    except Exception as e:
        print(f'FATAL: {e}',file=sys.stderr); raise
