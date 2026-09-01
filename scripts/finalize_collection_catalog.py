#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

from build_collection_audio import API_BASE, COLLECTIONS, LANG, fetch_json, fetch_text

REPO = "nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya"

FINALIZE = {
    "dn": {"collection": "DN", "count": 34, "vi": "Trường Bộ", "viCode": "TrB", "intlCode": "DN", "tag": "dn-vi-audio-v1", "edition": "dn", "version": "2026-09-02.dn-full-v1"},
    "mn": {"collection": "MN", "count": 152, "vi": "Trung Bộ", "viCode": "TB", "intlCode": "MN", "tag": "mn-vi-audio-v1", "edition": "mn", "version": "2026-09-01.mn-full-v1"},
}


def pali_display(value: str, fallback: str) -> str:
    value=(value or '').strip()
    if re.search(r'sutta$',value,re.I) and not re.search(r'\sSutta$',value):
        value=re.sub(r'sutta$', ' Sutta', value, flags=re.I)
    return value or fallback


def infer_vi_title(text: str, number: int, spec: dict) -> str:
    sample=re.sub(r'\s+',' ',text[:2200]).strip()
    vi=spec['vi']
    patterns=[
        rf'(?:{re.escape(vi)}(?: Kinh)?\s*)?{number}\s*[\.\-:]\s*(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)',
        rf'Kinh\s+(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)',
    ]
    for pattern in patterns:
        m=re.search(pattern,sample,re.I)
        if m:
            title=m.group(1).strip(' .—:-')
            if title and len(title)<180:
                if not title.lower().startswith('kinh '): title='Kinh '+title
                return title
    return f"{vi} Kinh {number}"


def build_entry(prefix: str, number: int, existing_by_ref: dict):
    spec=FINALIZE[prefix]
    uid=f'{prefix}{number}'
    text, chosen, source_url=fetch_text(prefix,number)
    suttaplex_payload=fetch_json(f'{API_BASE}/suttaplex/{uid}')
    sp=(suttaplex_payload[0] if isinstance(suttaplex_payload,list) and suttaplex_payload else suttaplex_payload) or {}
    original=pali_display(sp.get('original_title') or '', f"{spec['vi']} {number}")
    english=(sp.get('translated_title') or f"{spec['vi']} {number}").strip()
    vi_title=infer_vi_title(text,number,spec)
    previous=existing_by_ref.get(uid)
    if previous:
        vi_title=previous.get('vi') or vi_title
        english=previous.get('en') or english
        original=previous.get('pali') or original
        slug=previous.get('slug') or f'{prefix}-{number}'
        topics=previous.get('topics',[])
        featured=previous.get('featured',False)
        summary=previous.get('summary')
        practice=previous.get('practice')
    else:
        slug=f'{prefix}-{number}'; topics=[]; featured=False; summary=None; practice=None
    summary=summary or {
        'vi':f"{vi_title} — bài số {number} thuộc {spec['vi']}. Thư viện cung cấp toàn văn để đọc trực tiếp và MP3 dựng sẵn để nghe trên mọi thiết bị.",
        'en':sp.get('blurb') or f"Discourse {number} of {spec['collection']}."
    }
    practice=practice or {
        'vi':f"Đọc chậm toàn văn {spec['viCode']} {number}, lưu các đoạn quan trọng và dùng MP3 dựng sẵn để nghe liên tục.",
        'en':'Read the full discourse slowly, save important passages, and use the prebuilt MP3 for continuous listening.'
    }
    return {
        'id':f"nikaya.{prefix}.{number}", 'canonicalRef':uid, 'slug':slug,
        'code':f"{spec['intlCode']} {number}", 'viCode':f"{spec['viCode']} {number}", 'collection':spec['collection'],
        'pali':original, 'vi':vi_title, 'en':english, 'topics':topics,
        'source':{'url':source_url,'provider':'SuttaCentral','translator':chosen.get('author') or chosen.get('author_short') or chosen.get('author_uid') or 'Thích Minh Châu','license':'Xem ghi chú quyền sử dụng tại nguồn','language':'vi'},
        'media':{'bookUrl':f"https://suttacentral.net/edition/{spec['edition']}/vi/minh_chau"},
        'summary':summary, 'practice':practice, 'readMinutes':max(3,round(len(text)/850)),
        'featured':featured, 'contentVersion':spec['version']
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--collection',choices=sorted(FINALIZE),required=True)
    parser.add_argument('--catalog',default='data/catalog/suttas.json')
    parser.add_argument('--audio',default='data/catalog/audio.json')
    args=parser.parse_args(); prefix=args.collection; spec=FINALIZE[prefix]
    catalog_path=Path(args.catalog); audio_path=Path(args.audio)
    current=json.loads(catalog_path.read_text(encoding='utf-8'))
    existing={x.get('canonicalRef'):x for x in current if x.get('collection')==spec['collection']}
    others=[x for x in current if x.get('collection')!=spec['collection']]
    items=[]
    for n in range(1,spec['count']+1):
        print(f"Catalog {spec['collection']} {n}/{spec['count']}",flush=True)
        items.append(build_entry(prefix,n,existing))
    merged=others+items
    catalog_path.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    audio=json.loads(audio_path.read_text(encoding='utf-8'))
    for n in range(1,spec['count']+1):
        key=f'nikaya.{prefix}.{n}'
        audio.setdefault(key,{})['vi']={
            'url':f"https://github.com/{REPO}/releases/download/{spec['tag']}/{prefix}{n}.mp3",
            'label':f"{spec['viCode']} {n} · MP3 dựng sẵn tiếng Việt",
            'provider':'5 Đại Tạng Kinh Nikāya','sourceUrl':f"https://suttacentral.net/{prefix}{n}/vi/minh_chau",'download':True,
        }
    audio_path.write_text(json.dumps(audio,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    got=[x for x in merged if x.get('collection')==spec['collection']]
    assert len(got)==spec['count'],(len(got),spec['count'])
    assert all(f'nikaya.{prefix}.{n}' in audio and 'vi' in audio[f'nikaya.{prefix}.{n}'] for n in range(1,spec['count']+1))
    print(f"FULL {spec['collection']} CATALOG COMPLETE: {spec['count']} suttas + {spec['count']} prebuilt MP3 mappings")

if __name__=='__main__': main()
