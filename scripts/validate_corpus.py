#!/usr/bin/env python3
"""Fail with exact canonical references when catalog or full-text invariants break."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r"^[0-9a-f]{64}$")


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise SystemExit(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", choices=["DN", "MN", "SN", "AN", "KN"])
    args = parser.parse_args()
    catalog = load(ROOT / "data/catalog/suttas.json")
    if args.collection:
        catalog = [x for x in catalog if x.get("collection") == args.collection]
    for key in ("id", "slug", "canonicalRef"):
        seen = set()
        for row in catalog:
            value = row.get(key)
            if not value:
                fail(f"missing {key}: canonicalRef={row.get('canonicalRef', 'unknown')}")
            if value in seen:
                fail(f"duplicate {key}={value}")
            seen.add(value)
    for row in catalog:
        source = row.get("source") or {}
        if not source.get("url") or not source.get("provider"):
            fail(f"missing source: canonicalRef={row['canonicalRef']} slug={row['slug']}")

    records = {}
    content = ROOT / "data/content"
    paths = list(content.glob("*.vi.json")) + list(content.glob("*/*.vi.json"))
    for path in sorted(paths):
        for ref, record in load(path).items():
            if ref in records:
                fail(f"duplicate materialized full text canonicalRef={ref} paths include {path}")
            records[ref] = record
    wanted = {x["canonicalRef"] for x in catalog}
    for ref in sorted(wanted & records.keys()):
        record = records[ref]
        if record.get("canonicalRef") not in (None, ref):
            fail(f"full-text key mismatch canonicalRef={ref}")
        segments = record.get("segments") or []
        text = "\n\n".join(str(x.get("text", "")).strip() for x in segments if isinstance(x, dict)).strip()
        if len(text) < 80:
            fail(f"empty/short full text canonicalRef={ref}")
        digest = record.get("contentHash")
        if digest is not None:
            if not SHA.fullmatch(str(digest)):
                fail(f"invalid content hash format canonicalRef={ref}")
            if hashlib.sha256(text.encode("utf-8")).hexdigest() != digest:
                fail(f"content hash mismatch canonicalRef={ref}")
        if not record.get("sourceUrl"):
            fail(f"missing full-text source URL canonicalRef={ref}")
    print(json.dumps({"catalogValidated": len(catalog), "fullTextValidated": len(wanted & records.keys()), "collection": args.collection or "ALL"}))


if __name__ == "__main__":
    main()
