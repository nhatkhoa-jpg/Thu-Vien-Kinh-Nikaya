#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path

from build_mn_audio import API_BASE, AUTHOR, LANG, fetch_json, fetch_mn_text

REPO = "nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya"
AUDIO_TAG = "mn-vi-audio-v1"


def pali_display(value: str) -> str:
    value=(value or '').strip()
    if re.search(r'sutta$',value,re.I) and not re.search(r'\sSutta$',value):
        value=re.sub(r'sutta$', ' Sutta', value, flags=re.I)
    return value or 'Majjhima Nikāya'


def infer_vi_title(text: str, number: int) -> str:
    sample=re.sub(r'\s+',' ',text[:1800]).strip()
    patterns=[
        rf'(?:Trung Bộ(?: Kinh)?\s*)?{number}\s*[\.\-:]\s*(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)',
        rf'Kinh\s+(.+?)(?=\s+Như vầy tôi nghe|\s+Như vậy tôi nghe|$)',
    ]
    for pattern in patterns:
        m=re.search(pattern,sample,re.I)
        if m:
            title=m.group(1).strip(' .—:-')
            if title and len(title)<180:
                if not title.lower().startswith('kinh '): title='Kinh '+title
                return title
    return f'Trung Bộ Kinh {number}'


def generic_summary(number: int, vi_title: str) -> str:
    return f'{vi_title} — bài số {number} thuộc Trung Bộ Kinh (Majjhima Nikāya). Thư viện cung cấp toàn văn để đọc trực tiếp và MP3 dựng sẵn để nghe trên mọi thiết bị.'


def generic_practice(number: int) -> str:
    return f'Đọc chậm toàn văn TB {number}, đánh dấu đoạn quan trọng và có thể chuyển sang MP3 dựng sẵn để nghe liên tục. Phần tóm lược chuyên đề sẽ được biên tập bổ sung sau.'


def build_entry(number:int, existing_by_ref:dict):
    uid=f'mn{number}'
    text, chosen, source_url=fetch_mn_text(number)
    suttaplex_payload=fetch_json(f'{API_BASE}/suttaplex/{uid}')
    if isinstance(suttaplex_payload,list): sp=suttaplex_payload[0] if suttaplex_payload else {}
    else: sp=suttaplex_payload or {}
    original=pali_display(sp.get('original_title') or '')
    english=(sp.get('translated_title') or f'Majjhima Nikāya {number}').strip()
    vi_title=infer_vi_title(text,number)
    previous=existing_by_ref.get(uid)
    if previous:
        # Preserve hand-edited titles, summaries, slugs and featured flags already reviewed.
        vi_title=previous.get('vi') or vi_title
        english=previous.get('en') or english
        original=previous.get('pali') or original
        slug=previous.get('slug') or f'mn-{number}'
        summary=previous.get('summary') or {'vi':generic_summary(number,vi_title),'en':sp.get('blurb') or english}
        practice=previous.get('practice') or {'vi':generic_practice(number),'en':'Read the full discourse slowly and use the prebuilt MP3 for continuous listening.'}
        featured=previous.get('featured',False)
    else:
        slug=f'mn-{number}'
        summary={'vi':generic_summary(number,vi_title),'en':sp.get('blurb') or f'Discourse {number} of the Majjhima Nikāya.'}
        practice={'vi':generic_practice(number),'en':'Read the full discourse slowly and use the prebuilt MP3 for continuous listening.'}
        featured=False
    read_minutes=max(3,round(len(text)/850))
    return {
        'id':f'nikaya.mn.{number}',
        'canonicalRef':uid,
        'slug':slug,
        'code':f'MN {number}',
        'viCode':f'TB {number}',
        'collection':'MN',
        'pali':original,
        'vi':vi_title,
        'en':english,
        'topics':previous.get('topics',[]) if previous else [],
        'source':{
            'url':source_url,
            'provider':'SuttaCentral',
            'translator':chosen.get('author') or chosen.get('author_short') or 'Thích Minh Châu',
            'license':'Xem ghi chú quyền sử dụng tại nguồn',
            'language':'vi',
        },
        'media':{'bookUrl':'https://suttacentral.net/edition/mn/vi/minh_chau'},
        'summary':summary,
        'practice':practice,
        'readMinutes':read_minutes,
        'featured':featured,
        'contentVersion':'2026-09-01.mn-full-v1',
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--catalog',default='data/catalog/suttas.json')
    parser.add_argument('--audio',default='data/catalog/audio.json')
    args=parser.parse_args()
    catalog_path=Path(args.catalog);audio_path=Path(args.audio)
    current=json.loads(catalog_path.read_text(encoding='utf-8'))
    existing_by_ref={x.get('canonicalRef'):x for x in current if x.get('collection')=='MN'}
    others=[x for x in current if x.get('collection')!='MN']
    mn=[]
    for number in range(1,153):
        print(f'Catalog MN {number}/152',flush=True)
        mn.append(build_entry(number,existing_by_ref))
    merged=mn+others
    catalog_path.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    audio=json.loads(audio_path.read_text(encoding='utf-8'))
    for number in range(1,153):
        key=f'nikaya.mn.{number}'
        audio.setdefault(key,{})['vi']={
            'url':f'https://github.com/{REPO}/releases/download/{AUDIO_TAG}/mn{number}.mp3',
            'label':f'TB {number} · MP3 dựng sẵn tiếng Việt',
            'provider':'5 Đại Tạng Kinh Nikāya',
            'sourceUrl':f'https://suttacentral.net/mn{number}/vi/minh_chau',
            'download':True,
        }
    audio_path.write_text(json.dumps(audio,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    assert len([x for x in merged if x.get('collection')=='MN'])==152
    assert all(f'nikaya.mn.{n}' in audio and 'vi' in audio[f'nikaya.mn.{n}'] for n in range(1,153))
    print('FULL MN CATALOG COMPLETE: 152 suttas + 152 prebuilt MP3 mappings',flush=True)


if __name__=='__main__':
    try: main()
    except Exception as exc:
        print(f'FATAL: {exc}',file=sys.stderr,flush=True)
        raise
