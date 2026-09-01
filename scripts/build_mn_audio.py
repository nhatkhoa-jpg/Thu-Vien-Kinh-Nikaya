#!/usr/bin/env python3
import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API_BASE = "https://suttacentral.net/api"
VOICE = "vi_VN-vais1000-medium"
AUTHOR = "minh_chau"
LANG = "vi"
USER_AGENT = "Thu-Vien-Kinh-Nikaya-AudioBuilder/1.0"


def fetch_json(url: str, attempts: int = 5):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            )
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
    value = value.replace("\u00a0", " ")
    value = value.replace("–", "—")
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
        keys = data.get("keys_order")
        if not isinstance(keys, list) or not keys:
            keys = list(raw.keys())
        out = []
        for key in keys:
            text = clean_text(str(raw.get(key, "")))
            if text:
                out.append(text)
        return out
    return []


def fetch_mn_text(number: int):
    uid = f"mn{number}"
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
            payload = fetch_json(
                f"{API_BASE}/bilarasuttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(author_uid)}?lang={LANG}"
            )
        except Exception:
            payload = None
    segments = extract_segments(payload)
    if not segments:
        payload = fetch_json(
            f"{API_BASE}/suttas/{urllib.parse.quote(uid)}/{urllib.parse.quote(author_uid)}?lang={LANG}"
        )
        segments = extract_segments(payload)
    if not segments:
        raise RuntimeError(f"{uid}: translation text is empty")

    # Keep natural paragraph boundaries for Piper; do not read SuttaCentral segment IDs.
    text = "\n\n".join(segments)
    text = re.sub(r"\bSC\s*(\d+)\b", r"Đoạn \1.", text, flags=re.I)
    text = re.sub(r"\bMN\s*(\d+)\b", r"Trung Bộ \1", text, flags=re.I)
    source_url = f"https://suttacentral.net/{uid}/{LANG}/{author_uid}"
    return text, chosen, source_url


def run(cmd, **kwargs):
    print("+", " ".join(str(x) for x in cmd), flush=True)
    return subprocess.run(cmd, check=True, **kwargs)


def probe_duration(path: Path) -> float:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        text=True,
        capture_output=True,
    )
    return float(proc.stdout.strip())


def render_one(number: int, out_dir: Path):
    uid = f"mn{number}"
    mp3_path = out_dir / f"{uid}.mp3"
    meta_path = out_dir / f"{uid}.json"
    wav_path = out_dir / f".{uid}.wav"
    txt_path = out_dir / f".{uid}.txt"

    print(f"=== {uid}: fetching Vietnamese full text ===", flush=True)
    text, chosen, source_url = fetch_mn_text(number)
    if len(text) < 500:
        raise RuntimeError(f"{uid}: suspiciously short source text ({len(text)} chars)")
    txt_path.write_text(text, encoding="utf-8")

    print(f"=== {uid}: neural render with {VOICE} ({len(text)} chars) ===", flush=True)
    with txt_path.open("r", encoding="utf-8") as stdin:
        run(
            [
                "piper",
                "--model",
                VOICE,
                "--sentence-silence",
                "0.18",
                "--output_file",
                str(wav_path),
            ],
            stdin=stdin,
        )

    if not wav_path.exists() or wav_path.stat().st_size < 100_000:
        raise RuntimeError(f"{uid}: Piper WAV was not created correctly")

    print(f"=== {uid}: encode stable streaming MP3 ===", flush=True)
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(wav_path),
            "-af",
            "loudnorm=I=-18:TP=-2:LRA=11",
            "-ac",
            "1",
            "-ar",
            "22050",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "48k",
            "-id3v2_version",
            "3",
            "-metadata",
            f"title=Trung Bộ {number} (MN {number})",
            "-metadata",
            "album=5 Đại Tạng Kinh Nikāya · Trung Bộ",
            "-metadata",
            "artist=Giọng đọc thư viện · Piper vi_VN-vais1000-medium",
            "-metadata",
            f"comment=Nguồn văn bản: {source_url}",
            str(mp3_path),
        ]
    )

    duration = probe_duration(mp3_path)
    size = mp3_path.stat().st_size
    if duration < 20 or size < 100_000:
        raise RuntimeError(f"{uid}: invalid MP3 duration={duration:.1f}s size={size}")

    sha256 = hashlib.sha256(mp3_path.read_bytes()).hexdigest()
    metadata = {
        "id": f"nikaya.mn.{number}",
        "canonicalRef": uid,
        "number": number,
        "language": LANG,
        "textAuthor": chosen.get("author") or chosen.get("author_short") or chosen.get("author_uid"),
        "textAuthorUid": chosen.get("author_uid"),
        "textSource": source_url,
        "voice": VOICE,
        "codec": "mp3",
        "bitrateKbps": 48,
        "sampleRate": 22050,
        "channels": 1,
        "durationSeconds": round(duration, 3),
        "bytes": size,
        "sha256": sha256,
        "textSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
    }
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    wav_path.unlink(missing_ok=True)
    txt_path.unlink(missing_ok=True)
    print(f"OK {uid}: {duration/60:.1f} min, {size/1024/1024:.1f} MiB, sha256={sha256[:12]}", flush=True)
    return metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, required=True)
    parser.add_argument("--end", type=int, required=True)
    parser.add_argument("--out", default="dist/mn-audio")
    args = parser.parse_args()
    if args.start < 1 or args.end > 152 or args.start > args.end:
        parser.error("range must be within MN 1..152")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for number in range(args.start, args.end + 1):
        results.append(render_one(number, out_dir))

    batch_manifest = out_dir / f"manifest-{args.start:03d}-{args.end:03d}.json"
    batch_manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Batch complete: MN {args.start}..{args.end}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr, flush=True)
        raise
