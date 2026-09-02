#!/usr/bin/env python3
"""Snapshot an authoritative SuttaCentral canonical tree without inventing UIDs."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/catalog"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", required=True, choices=["dn", "mn", "sn", "an"])
    args = parser.parse_args()
    collection = args.collection
    url = f"https://raw.githubusercontent.com/suttacentral/sc-data/main/structure/tree/sutta/{collection}-tree.json"
    req = urllib.request.Request(url, headers={"User-Agent": "Nikaya-Corpus-Builder/2.0"})
    raw = urllib.request.urlopen(req, timeout=120).read()
    tree = json.loads(raw)
    pattern = re.compile(rf"^{collection}\d+(?:\.\d+)?(?:-\d+)?$")
    refs: list[str] = []

    def walk(value):
        if isinstance(value, str) and pattern.fullmatch(value):
            refs.append(value)
        elif isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)

    walk(tree)
    duplicates = sorted(ref for ref, count in Counter(refs).items() if count > 1)
    if not refs or duplicates:
        raise SystemExit(f"Invalid canonical tree: count={len(refs)}, duplicates={duplicates[:20]}")
    generated = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    snapshot = {
        "collection": collection.upper(),
        "source": {"provider": "SuttaCentral sc-data", "url": url, "sha256": hashlib.sha256(raw).hexdigest()},
        "generatedAt": generated,
        "policy": "Canonical leaf UIDs are preserved exactly as published; ranges are not expanded.",
        "canonicalLeafCount": len(refs),
        "rangeLeafCount": sum("-" in ref for ref in refs),
        "items": [{"canonicalRef": ref} for ref in refs],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"discovery-{collection}.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {k: snapshot[k] for k in ("collection", "source", "generatedAt", "canonicalLeafCount", "rangeLeafCount", "policy")}
    report.update({"firstCanonicalRef": refs[0], "lastCanonicalRef": refs[-1]})
    (OUT / f"discovery-{collection}-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
