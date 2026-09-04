#!/usr/bin/env python3
"""Render one materialized Vietnamese scripture with Gemini TTS in GitHub Actions.

This is an independent cloud lane. It reads source-backed corpus already committed
under data/content, never rewrites scripture text, and publishes Gemini narration
under a dedicated R2 prefix so local/PC narration remains available as fallback.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

MODEL = "gemini-3.1-flash-tts-preview"
VOICE_POOL = [
    "Kore", "Achernar", "Schedar", "Gacrux", "Sulafat", "Iapetus",
    "Erinome", "Despina", "Algieba", "Vindemiatrix", "Sadaltager", "Umbriel",
]
COLLECTION_ORDER = {"DN": 0, "MN": 1, "SN": 2, "AN": 3, "KN": 4}
TECHNICAL_LINE = re.compile(r"^(?:PTS\b|SC\b|TTC\b|Vi-n\b|segment\b|navigation\b)", re.I)


def ref_collection(ref: str) -> str:
    m = re.match(r"^([a-z]+)", ref, re.I)
    return m.group(1).upper() if m else "OTHER"


def ref_sort_key(ref: str):
    collection = ref_collection(ref)
    nums = tuple(int(x) for x in re.findall(r"\d+", ref))
    return (COLLECTION_ORDER.get(collection, 99), nums, ref)


def load_materialized() -> dict[str, dict]:
    corpus: dict[str, dict] = {}
    for path in sorted(Path("data/content").rglob("*.vi.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            continue
        for key, value in payload.items():
            if isinstance(value, dict) and value.get("segments"):
                ref = str(value.get("canonicalRef") or key).lower()
                corpus[ref] = value
    return corpus


def scripture_text(entry: dict) -> str:
    lines: list[str] = []
    for segment in entry.get("segments") or []:
        text = str(segment.get("text") or "").strip()
        if not text or TECHNICAL_LINE.match(text):
            continue
        lines.append(text)
    text = "\n\n".join(lines)
    text = re.sub(r"[\u200b\u200c\u200d\u2060\ufeff]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) < 80:
        raise RuntimeError("Suspiciously short scripture text")
    return text


def chunks(text: str, max_chars: int = 3500) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    out: list[str] = []
    cur = ""
    for paragraph in paragraphs:
        parts = [paragraph]
        if len(paragraph) > max_chars:
            parts = [x.strip() for x in re.split(r"(?<=[.!?…])\s+", paragraph) if x.strip()]
        for part in parts:
            pieces = [part[i:i + max_chars] for i in range(0, len(part), max_chars)] if len(part) > max_chars else [part]
            for piece in pieces:
                candidate = f"{cur}\n\n{piece}".strip() if cur else piece
                if cur and len(candidate) > max_chars:
                    out.append(cur)
                    cur = piece
                else:
                    cur = candidate
    if cur:
        out.append(cur)
    return out


def pick_voice(ref: str) -> str:
    n = int(hashlib.sha256(ref.encode()).hexdigest()[:8], 16)
    return VOICE_POOL[n % len(VOICE_POOL)]


def pcm_from_response(interaction) -> bytes:
    audio = getattr(interaction, "output_audio", None)
    data = getattr(audio, "data", None) if audio is not None else None
    if data is None:
        raise RuntimeError("Gemini response did not contain audio")
    if isinstance(data, bytes):
        return data
    if isinstance(data, str):
        return base64.b64decode(data)
    raise RuntimeError(f"Unsupported Gemini audio type: {type(data)!r}")


def is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(x in msg for x in ("429", "resource_exhausted", "quota", "rate limit"))


def render(ref: str, entry: dict, out_dir: Path) -> dict:
    from google import genai
    key = (
        os.environ.get("GEMINI_API_KEY_NIKAYA")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if not key:
        raise RuntimeError("Missing GEMINI_API_KEY_NIKAYA/GEMINI_API_KEY/GOOGLE_API_KEY")

    text = scripture_text(entry)
    pieces = chunks(text)
    voice = pick_voice(ref)
    client = genai.Client(api_key=key)
    pcm_parts: list[bytes] = []

    for idx, piece in enumerate(pieces, 1):
        prompt = (
            "Đọc nguyên văn đoạn kinh tiếng Việt sau với giọng điềm tĩnh, rõ ràng, trang nghiêm, "
            "nhịp vừa phải. Không thêm lời dẫn, không giải thích, không bỏ câu, không đổi từ.\n\n"
            "--- BẮT ĐẦU KINH VĂN ---\n" + piece + "\n--- KẾT THÚC KINH VĂN ---"
        )
        try:
            interaction = client.interactions.create(
                model=MODEL,
                input=prompt,
                response_format={"type": "audio"},
                generation_config={"speech_config": [{"voice": voice, "language": "vi-VN"}]},
            )
        except Exception as exc:
            if is_quota_error(exc):
                print(f"QUOTA_BLOCKED chunk={idx}/{len(pieces)} ref={ref}", file=sys.stderr)
                raise SystemExit(75)
            raise
        pcm = pcm_from_response(interaction)
        if len(pcm) < 4000:
            raise RuntimeError(f"Chunk {idx} returned suspiciously small audio")
        pcm_parts.append(pcm)

    out_dir.mkdir(parents=True, exist_ok=True)
    pcm_path = out_dir / f"{ref}.pcm"
    mp3_path = out_dir / f"{ref}.mp3"
    pcm_path.write_bytes(b"".join(pcm_parts))
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(pcm_path),
        "-ar", "48000", "-ac", "1", "-b:a", "96k", str(mp3_path),
    ], check=True)
    pcm_path.unlink(missing_ok=True)

    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(mp3_path)
    ], capture_output=True, text=True, check=True)
    duration = float(probe.stdout.strip())
    if duration < 5:
        raise RuntimeError(f"Suspiciously short final audio: {duration:.2f}s")

    audio_sha = hashlib.sha256(mp3_path.read_bytes()).hexdigest()
    text_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
    receipt = {
        "version": "1.1",
        "canonicalRef": ref,
        "collection": ref_collection(ref),
        "language": "vi",
        "provider": "Google Gemini API",
        "model": MODEL,
        "voice": voice,
        "sourceUrl": entry.get("sourceUrl"),
        "author": entry.get("author"),
        "textSha256": text_sha,
        "audioSha256": audio_sha,
        "bytes": mp3_path.stat().st_size,
        "durationSeconds": round(duration, 3),
        "chunkCount": len(pieces),
        "normalizedTextCharacters": len(text),
        "policy": "verbatim-source-backed-scripture",
        "r2Tier": "preferred",
    }
    (out_dir / f"{ref}.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(receipt, ensure_ascii=False))
    return receipt


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default="", help="Exact canonical ref, otherwise choose next missing Gemini narration")
    ap.add_argument("--existing-file", default="", help="R2 object keys, one per line")
    ap.add_argument("--out", default="dist/gemini-online")
    args = ap.parse_args()

    corpus = load_materialized()
    if not corpus:
        raise RuntimeError("No materialized Vietnamese corpus found")
    existing = set()
    if args.existing_file and Path(args.existing_file).exists():
        existing = {x.strip().lower() for x in Path(args.existing_file).read_text(encoding="utf-8").splitlines() if x.strip()}

    if args.ref:
        ref = args.ref.lower()
        if ref not in corpus:
            raise RuntimeError(f"{ref}: not materialized in data/content")
    else:
        ref = ""
        for candidate in sorted(corpus, key=ref_sort_key):
            c = ref_collection(candidate).lower()
            preferred_key = f"audio/gemini/{c}/{candidate}.mp3".lower()
            if preferred_key not in existing:
                ref = candidate
                break
        if not ref:
            print("NO_MISSING=1")
            return 0

    render(ref, corpus[ref], Path(args.out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
