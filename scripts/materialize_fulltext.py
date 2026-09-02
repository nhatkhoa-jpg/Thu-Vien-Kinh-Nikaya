#!/usr/bin/env python3
"""Checkpointable, source-backed Vietnamese full-text materializer.

The script writes one shard per canonical group. Existing verified records are
never fetched again unless --force is supplied. A failed item is recorded in a
checkpoint report and does not stop successful items from being saved.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import hashlib
import html
import json
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/catalog/suttas.json"
CONTENT = ROOT / "data/content"
STATUS = ROOT / "data/status"
API = "https://suttacentral.net/api"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class BlockParser(HTMLParser):
    BLOCKS = {"h1", "h2", "h3", "h4", "p", "li", "blockquote", "footer"}

    def __init__(self) -> None:
        super().__init__()
        self.depth = 0
        self.parts: list[str] = []
        self.blocks: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCKS:
            if self.depth == 0:
                self.parts = []
            self.depth += 1
        elif tag == "br" and self.depth:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.BLOCKS and self.depth:
            self.depth -= 1
            if self.depth == 0:
                text = re.sub(r"[ \t\r\f\v]+", " ", html.unescape("".join(self.parts)))
                text = re.sub(r" *\n *", "\n", text).strip()
                if text:
                    self.blocks.append(text)

    def handle_data(self, data):
        if self.depth:
            self.parts.append(data)


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def fetch_json(url: str, attempts: int = 5):
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Nikaya-Corpus-Builder/2.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=90) as response:
                body = response.read()
            if not body:
                raise RuntimeError("empty response")
            return json.loads(body)
        except (OSError, ValueError, urllib.error.HTTPError) as exc:
            last = exc
            if attempt + 1 < attempts:
                time.sleep(min(30, 2 ** attempt) + random.random())
    raise RuntimeError(f"source request failed after {attempts} attempts: {url}: {last}")


def collection_rows(collection: str) -> list[dict]:
    rows = [x for x in load(CATALOG) if x.get("collection") == collection]
    return rows


def shard_name(collection: str, ref: str) -> str:
    match = re.match(r"^[a-z]+(\d+)", ref)
    group = int(match.group(1)) if match else 0
    if collection in {"SN", "AN"}:
        return f"{group:02d}.vi.json"
    return f"{collection.lower()}.vi.json"


def valid_record(record: dict | None, ref: str) -> bool:
    if not isinstance(record, dict) or record.get("canonicalRef") != ref:
        return False
    segments = record.get("segments")
    if not isinstance(segments, list) or not segments:
        return False
    text = "\n".join(str(x.get("text", "")) for x in segments if isinstance(x, dict)).strip()
    return len(text) >= 80 and SHA256_RE.fullmatch(str(record.get("contentHash", ""))) is not None


def preferred_author(row: dict) -> str | None:
    source = row.get("source") or {}
    if source.get("language") == "vi" and "minh_chau" in str(source.get("url", "")):
        return "minh_chau"
    return None


def fetch_one(row: dict) -> tuple[str, dict | None, str | None]:
    ref = row["canonicalRef"]
    author_uid = preferred_author(row)
    if not author_uid:
        return ref, None, "missing_verified_vietnamese_source"
    url = f"{API}/suttas/{urllib.parse.quote(ref)}/{author_uid}?lang=vi"
    try:
        payload = fetch_json(url)
        translation = payload.get("translation") or {}
        raw_html = translation.get("text")
        if not isinstance(raw_html, str) or len(raw_html) < 100:
            return ref, None, "empty_or_invalid_translation"
        parser = BlockParser()
        parser.feed(raw_html)
        blocks = parser.blocks
        # Nested blocks can repeat their children. Keep stable order, removing exact adjacent duplicates.
        cleaned: list[str] = []
        for block in blocks:
            if not cleaned or block != cleaned[-1]:
                cleaned.append(block)
        joined = "\n\n".join(cleaned).strip()
        if len(joined) < 80 or "source returned" in joined.lower():
            return ref, None, "text_below_validation_threshold"
        materialized = now()
        record = {
            "canonicalRef": ref,
            "collection": row["collection"],
            "language": "vi",
            "author": translation.get("author") or row["source"].get("translator") or author_uid,
            "authorUid": translation.get("author_uid") or author_uid,
            "source": "SuttaCentral",
            "sourceUrl": row["source"]["url"],
            "license": row["source"].get("license", "Xem ghi chú quyền sử dụng tại nguồn"),
            "fetchedAt": materialized,
            "materializedAt": materialized,
            "contentHash": hashlib.sha256(joined.encode("utf-8")).hexdigest(),
            "segments": [{"id": f"p{i}", "text": text} for i, text in enumerate(cleaned, 1)],
        }
        return ref, record, None
    except Exception as exc:
        return ref, None, str(exc)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", required=True, choices=["DN", "MN", "SN", "AN", "KN"])
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--strict", action="store_true", help="Return non-zero when individual source requests fail")
    args = parser.parse_args()

    rows = collection_rows(args.collection)
    existing_by_shard: dict[str, dict] = {}
    base = CONTENT / args.collection.lower()
    if args.collection in {"SN", "AN", "KN"}:
        for path in sorted(base.glob("*.vi.json")):
            existing_by_shard[path.name] = load(path)
    else:
        legacy = CONTENT / f"{args.collection.lower()}.vi.json"
        if legacy.exists():
            existing_by_shard[legacy.name] = load(legacy)

    verified = {ref for shard in existing_by_shard.values() for ref, record in shard.items() if valid_record(record, ref)}
    missing_path = STATUS / "missing-vietnamese.json"
    missing_registry = load(missing_path) if missing_path.exists() else {}
    known_missing = set(missing_registry.get(args.collection, []))
    pending = [
        row for row in rows
        if args.force or (row["canonicalRef"] not in verified and row["canonicalRef"] not in known_missing)
    ]
    selected = pending[args.offset:args.offset + args.batch_size]
    successes: list[str] = []
    failures: dict[str, str] = {}
    missing: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(fetch_one, row): row for row in selected}
        for future in concurrent.futures.as_completed(futures):
            ref, record, error = future.result()
            if record:
                name = shard_name(args.collection, ref)
                shard = existing_by_shard.setdefault(name, {})
                shard[ref] = record
                successes.append(ref)
            elif error == "missing_verified_vietnamese_source":
                missing.append(ref)
            else:
                failures[ref] = error or "unknown_error"

    for name, shard in existing_by_shard.items():
        target = (base / name) if args.collection in {"SN", "AN", "KN"} else (CONTENT / name)
        dump(target, dict(sorted(shard.items())))

    if missing:
        missing_registry[args.collection] = sorted(known_missing | set(missing))
        dump(missing_path, missing_registry)

    report = {
        "collection": args.collection,
        "catalogCount": len(rows),
        "verifiedBefore": len(verified),
        "selected": len(selected),
        "materializedThisRun": len(successes),
        "missingVietnameseThisRun": sorted(missing),
        "failures": failures,
        "remainingAfterRun": max(0, len(pending) - len(successes) - len(missing)),
        "lastRunAt": now(),
    }
    dump(STATUS / f"materialize-{args.collection.lower()}-last-run.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if failures and args.strict:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
