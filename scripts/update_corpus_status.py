#!/usr/bin/env python3
"""Generate the machine-readable corpus status from repository data."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def valid(record: dict) -> bool:
    segments = record.get("segments")
    text = "\n".join(str(x.get("text", "")) for x in segments or [] if isinstance(x, dict)).strip()
    content_hash = record.get("contentHash")
    return bool(segments and len(text) >= 80 and (content_hash is None or SHA256_RE.fullmatch(str(content_hash))))


def content_refs(collection: str) -> set[str]:
    refs: set[str] = set()
    legacy = DATA / "content" / f"{collection.lower()}.vi.json"
    paths = ([legacy] if legacy.exists() else []) + list((DATA / "content" / collection.lower()).glob("*.vi.json"))
    for path in paths:
        for ref, record in load(path).items():
            if valid(record):
                refs.add(ref)
    return refs


def main() -> None:
    catalog = load(DATA / "catalog/suttas.json")
    audio = load(DATA / "catalog/audio.json")
    verified_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    rows = []
    for collection in ("DN", "MN", "SN", "AN", "KN"):
        catalog_rows = [x for x in catalog if x.get("collection") == collection]
        discovery = DATA / "catalog" / f"discovery-{collection.lower()}.json"
        canonical_count = load(discovery).get("canonicalLeafCount") if discovery.exists() else len(catalog_rows)
        full_refs = content_refs(collection)
        known_refs = {x["canonicalRef"] for x in catalog_rows}
        vi_audio = sum(bool((audio.get(x["id"]) or {}).get("vi")) for x in catalog_rows)
        missing = max(0, canonical_count - len(full_refs))
        rows.append({
            "collection": collection,
            "canonicalCount": canonical_count,
            "catalogCount": len(catalog_rows),
            "vietnameseFullTextCount": len(full_refs & known_refs),
            "missingVietnameseCount": missing,
            "audioCount": vi_audio,
            "source": "SuttaCentral canonical tree + repository materialized corpus",
            "lastVerifiedAt": verified_at,
            "status": "complete" if canonical_count == len(catalog_rows) == len(full_refs & known_refs) else "in_progress",
        })
    target = DATA / "status/corpus-status.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"schemaVersion": 1, "lastVerifiedAt": verified_at, "collections": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
