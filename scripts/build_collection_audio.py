#!/usr/bin/env python3
import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API_BASE = "https://suttacentral.net/api"
VOICE = "vi_VN-vais1000-medium"
AUTHOR = "minh_chau"
LANG = "vi"
USER_AGENT = "Thu-Vien-Kinh-Nikaya-AudioBuilder/2.0"

COLLECTIONS = {
    "dn": {"max": 34, "vi": "Trường Bộ", "viCode": "TrB", "album": "Trường Bộ"},
    "mn": {"max": 152, "vi": "Trung Bộ", "viCode": "TB", "album": "Trung Bộ"},
}


def fetch_json(url: str, attempts: int = 5):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last = exc
            if attempt < attempts:
                time.sleep(min(2 ** attempt, 12))
    raise RuntimeError(f"Unable to fetch {url}: {last}")


def clean_text(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("\u00a0", " ").replace("–", "—")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n\s*\n+", "\n\n", value)
    return value.strip()


def extract_segments(data):
    if not data:
        return []
    raw = data.get("translation_text")
    if raw is None:
        translation = data.get("translation")
        if isinstance(translation, dict) and "text" in translation:
            raw = translation.get("text")
        elif translation is not None:
            raw = translation
    if raw is None:
        raw = data.get("text")
    if isinstance(raw, str):
        parts = re.split(r"\n{2,}|</p>", raw, flags=re.I)
        return [clean_text(x) for x in parts if clean_text(x)]
    if isinstance(raw, dict):
        keys = data.get("keys_order") if isinstance(data.get("keys_order"), list) else list(raw.keys())
        return [text for key in keys if (text := clean_text(str(raw.get(key, ""))))]
    return []


def fetch_text(prefix: str, number: int):
    spec = COLLECTIONS[prefix]
    uid = f"{prefix}{number}"
    info = fetch_json(f"{API_BASE}/suttas/{uid}")
    translations = ((info or {}).get("suttaplex") or {}).get("translations") or []
    same = [t for t in translations if t.get("lang") == LANG]
    if not same:
        raise RuntimeError(f"{uid}: no Vietnamese translation found")
    chosen = next((t for t in same if t.get("author_uid") == AUTHOR), None)
    if chosen is None:
        chosen = next((t for t in same if t.get("segmented")), same[0])
    author_uid = chosen.get("author_uid")
    if not author_uid:
        raise RuntimeError(f"{uid}: translation has no author_uid")

    payload = None
    if chosen.get("segmented"):
        try:
            payload = fetch_json(f"{API_BASE}/bilarasuttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(author_uid)}?lang={LANG}")
        except Exception:
            payload = None
    segments = extract_segments(payload)
    if not segments:
        payload = fetch_json(f"{API_BASE}/suttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(author_uid)}?lang={LANG}")
        segments = extract_segments(payload)
    if not segments:
        raise RuntimeError(f"{uid}: translation text is empty")

    text = "\n\n".join(segments)
    text = re.sub(r"\bSC\s*(\d+)\b", r"Đoạn \1.", text, flags=re.I)
    text = re.sub(rf"\b{prefix.upper()}\s*(\d+)\b", lambda m: f"{spec['vi']} {m.group(1)}", text, flags=re.I)
    source_url = f"https://suttacentral.net/{uid}/{LANG}/{author_uid}"
    return text, chosen, source_url


def run(cmd, **kwargs):
    print("+", " ".join(str(x) for x in cmd), flush=True)
    return subprocess.run(cmd, check=True, **kwargs)


def probe_duration(path: Path) -> float:
    proc = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)], check=True, text=True, capture_output=True)
    return float(proc.stdout.strip())


def render_one(prefix: str, number: int, out_dir: Path):
    spec = COLLECTIONS[prefix]
    uid = f"{prefix}{number}"
    mp3_path = out_dir / f"{uid}.mp3"
    meta_path = out_dir / f"{uid}.json"
    wav_path = out_dir / f".{uid}.wav"
    txt_path = out_dir / f".{uid}.txt"

    print(f"=== {uid}: fetch Vietnamese full text ===", flush=True)
    text, chosen, source_url = fetch_text(prefix, number)
    if len(text) < 500:
        raise RuntimeError(f"{uid}: suspiciously short source text ({len(text)} chars)")
    txt_path.write_text(text, encoding="utf-8")

    print(f"=== {uid}: render {VOICE} ({len(text)} chars) ===", flush=True)
    with txt_path.open("r", encoding="utf-8") as stdin:
        run(["piper", "--model", VOICE, "--sentence-silence", "0.18", "--output_file", str(wav_path)], stdin=stdin)
    if not wav_path.exists() or wav_path.stat().st_size < 100_000:
        raise RuntimeError(f"{uid}: invalid Piper WAV")

    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path), "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame", "-b:a", "48k", "-id3v2_version", "3", "-metadata", f"title={spec['vi']} {number} ({prefix.upper()} {number})", "-metadata", f"album=5 Đại Tạng Kinh Nikāya · {spec['album']}", "-metadata", "artist=Giọng đọc thư viện · Piper vi_VN-vais1000-medium", "-metadata", f"comment=Nguồn văn bản: {source_url}", str(mp3_path)])

    duration = probe_duration(mp3_path)
    size = mp3_path.stat().st_size
    if duration < 20 or size < 100_000:
        raise RuntimeError(f"{uid}: invalid MP3 duration={duration:.1f}s size={size}")
    metadata = {
        "id": f"nikaya.{prefix}.{number}", "canonicalRef": uid, "number": number,
        "collection": prefix.upper(), "viCode": f"{spec['viCode']} {number}", "language": LANG,
        "textAuthor": chosen.get("author") or chosen.get("author_short") or chosen.get("author_uid"),
        "textAuthorUid": chosen.get("author_uid"), "textSource": source_url, "voice": VOICE,
        "codec": "mp3", "bitrateKbps": 48, "sampleRate": 22050, "channels": 1,
        "durationSeconds": round(duration, 3), "bytes": size,
        "sha256": hashlib.sha256(mp3_path.read_bytes()).hexdigest(),
        "textSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    wav_path.unlink(missing_ok=True); txt_path.unlink(missing_ok=True)
    print(f"OK {uid}: {duration/60:.1f} min, {size/1024/1024:.1f} MiB", flush=True)
    return metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", choices=sorted(COLLECTIONS), required=True)
    parser.add_argument("--start", type=int, required=True)
    parser.add_argument("--end", type=int, required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    max_n = COLLECTIONS[args.collection]["max"]
    if args.start < 1 or args.end > max_n or args.start > args.end:
        parser.error(f"range must be 1..{max_n}")
    out_dir = Path(args.out); out_dir.mkdir(parents=True, exist_ok=True)
    results = [render_one(args.collection, n, out_dir) for n in range(args.start, args.end + 1)]
    (out_dir / f"manifest-{args.start:03d}-{args.end:03d}.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    try: main()
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr, flush=True)
        raise
