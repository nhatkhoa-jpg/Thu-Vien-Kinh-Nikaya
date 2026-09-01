#!/usr/bin/env python3
"""Generate server-side MP3 files for Majjhima Nikaya from SuttaCentral Vietnamese text.

Usage:
  python scripts/generate-mn-audio.py 1 10 out/mn

The script intentionally does all TTS work offline in CI. End users only stream the
resulting MP3 files, so playback no longer depends on browser/device TTS support.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

API = "https://suttacentral.net/api"
VOICE_MODEL = os.environ.get("PIPER_MODEL", "vi_VN-vais1000-medium.onnx")
VOICE_CONFIG = os.environ.get("PIPER_CONFIG", f"{VOICE_MODEL}.json")
AUTHOR_UID = os.environ.get("MN_VI_AUTHOR", "minh_chau")


def fetch_json(url: str, retries: int = 4):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "NikayaAudioBuilder/1.0"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed fetching {url}: {last}")


def clean_html(value: str) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"')
    value = value.replace("&#39;", "'").replace("&apos;", "'")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def extract_segments(payload):
    raw = None
    if isinstance(payload, dict):
        raw = payload.get("translation_text") or payload.get("translation") or payload.get("text")
    if isinstance(raw, dict) and "text" in raw:
        raw = raw["text"]
    if isinstance(raw, str):
        return [clean_html(x) for x in re.split(r"\n{2,}|</p>", raw, flags=re.I) if clean_html(x)]
    if isinstance(raw, dict):
        order = payload.get("keys_order") if isinstance(payload, dict) else None
        keys = order if isinstance(order, list) and order else list(raw.keys())
        return [clean_html(str(raw.get(k, ""))) for k in keys if clean_html(str(raw.get(k, "")))]
    return []


def fetch_vi_text(uid: str):
    info = fetch_json(f"{API}/suttas/{uid}")
    translations = ((info or {}).get("suttaplex") or {}).get("translations") or []
    vi = [t for t in translations if t.get("lang") == "vi"]
    chosen = next((t for t in vi if t.get("author_uid") == AUTHOR_UID), None) or next((t for t in vi if t.get("segmented")), None) or (vi[0] if vi else None)
    if not chosen:
        raise RuntimeError(f"{uid}: no Vietnamese translation")
    author_uid = chosen.get("author_uid")
    payload = None
    if chosen.get("segmented"):
        try:
            payload = fetch_json(f"{API}/bilarasuttas/{uid}/{author_uid}?lang=vi")
        except Exception:
            payload = None
    segments = extract_segments(payload)
    if not segments:
        payload = fetch_json(f"{API}/suttas/{uid}/{author_uid}?lang=vi")
        segments = extract_segments(payload)
    if not segments:
        raise RuntimeError(f"{uid}: empty Vietnamese translation")
    return chosen, segments


def normalize_for_tts(text: str) -> str:
    text = text.replace("–", ", ").replace("—", ", ")
    text = re.sub(r"\bSC\s*(\d+)\b", r"Đoạn \1.", text, flags=re.I)
    text = re.sub(r"\bMN\s*(\d+)\b", r"Trung Bộ \1", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_chunks(text: str, max_chars: int = 700):
    text = normalize_for_tts(text)
    sentences = re.split(r"(?<=[.!?。！？])\s+", text)
    out, current = [], ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        candidate = f"{current} {sentence}".strip()
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            out.append(current)
        while len(sentence) > max_chars:
            cut = max(sentence.rfind(",", 0, max_chars), sentence.rfind(";", 0, max_chars), sentence.rfind(" ", 0, max_chars))
            if cut < int(max_chars * 0.55):
                cut = max_chars
            out.append(sentence[:cut].strip())
            sentence = sentence[cut:].strip()
        current = sentence
    if current:
        out.append(current)
    return out


def synthesize_mp3(uid: str, segments, target: Path):
    full_text = "\n\n".join(segments)
    chunks = split_chunks(full_text)
    if not chunks:
        raise RuntimeError(f"{uid}: no TTS chunks")
    with tempfile.TemporaryDirectory(prefix=f"{uid}-") as td:
        td = Path(td)
        wavs = []
        for i, chunk in enumerate(chunks, 1):
            wav = td / f"{i:04d}.wav"
            proc = subprocess.run(
                ["piper", "--model", VOICE_MODEL, "--config", VOICE_CONFIG, "--output_file", str(wav)],
                input=chunk + "\n",
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if proc.returncode != 0 or not wav.exists() or wav.stat().st_size < 1000:
                raise RuntimeError(f"{uid}: piper failed on chunk {i}: {proc.stderr[-1000:]}")
            wavs.append(wav)
        concat = td / "concat.txt"
        concat.write_text("\n".join(f"file '{w.as_posix()}'" for w in wavs), encoding="utf-8")
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat), "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame", "-b:a", "64k", str(target)
        ], check=True)
    if not target.exists() or target.stat().st_size < 10_000:
        raise RuntimeError(f"{uid}: invalid mp3 output")
    return len(chunks), len(full_text)


def main():
    if len(sys.argv) < 3:
        print("usage: generate-mn-audio.py START END [OUTDIR]", file=sys.stderr)
        return 2
    start, end = int(sys.argv[1]), int(sys.argv[2])
    outdir = Path(sys.argv[3] if len(sys.argv) > 3 else "out/mn")
    manifest = []
    for n in range(start, end + 1):
        uid = f"mn{n}"
        target = outdir / f"mn{n:03d}.mp3"
        print(f"[mn-audio] {uid} -> {target}", flush=True)
        chosen, segments = fetch_vi_text(uid)
        chunks, chars = synthesize_mp3(uid, segments, target)
        manifest.append({
            "uid": uid,
            "number": n,
            "file": target.name,
            "bytes": target.stat().st_size,
            "chunks": chunks,
            "characters": chars,
            "language": "vi",
            "translator": chosen.get("author") or chosen.get("author_short") or chosen.get("author_uid"),
            "authorUid": chosen.get("author_uid"),
            "sourceUrl": f"https://suttacentral.net/{uid}/vi/{chosen.get('author_uid')}",
            "voice": "Piper vi_VN-vais1000-medium",
        })
    (outdir / f"manifest-{start:03d}-{end:03d}.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
