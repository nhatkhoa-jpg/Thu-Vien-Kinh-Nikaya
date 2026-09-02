#!/usr/bin/env python3
"""Discover the authoritative Samyutta Nikaya catalog and Suttaplex metadata.

This script is intentionally data-first: it reads the canonical SN tree from
SuttaCentral sc-data, preserves published range UIDs exactly, and then maps
Vietnamese/English Suttaplex metadata onto that canonical set. It never expands
range UIDs into invented canonical records and never invents missing translations.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
import time
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/catalog"
TREE_URL = "https://raw.githubusercontent.com/suttacentral/sc-data/main/structure/tree/sutta/sn-tree.json"
VI_URL = "https://suttacentral.net/api/suttaplex/sn?language=vi"
EN_URL = "https://suttacentral.net/api/suttaplex/sn?language=en"
UID_RE = re.compile(r"^sn(\d+)\.(\d+)(?:-(\d+))?$")
LEAF_RE = re.compile(r"^sn\d+\.\d+(?:-\d+)?$")


def fetch_bytes(url: str, attempts: int = 5) -> bytes:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Nikaya-Corpus-Builder/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as res:
                data = res.read()
            if not data:
                raise RuntimeError(f"Empty response from {url}")
            return data
        except Exception as exc:  # network retry is deliberate in CI
            last = exc
            if attempt < attempts:
                time.sleep(attempt * 2)
    raise RuntimeError(f"Failed to fetch {url}: {last}")


def write_json(name: str, value) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def canonical_discovery() -> tuple[dict, list[str]]:
    raw = fetch_bytes(TREE_URL)
    tree = json.loads(raw)
    refs: list[str] = []

    def walk(node):
        if isinstance(node, str):
            if UID_RE.fullmatch(node):
                refs.append(node)
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for value in node.values():
                walk(value)

    walk(tree)
    if not refs:
        raise SystemExit("No SN canonical refs found")
    if len(refs) != len(set(refs)):
        dupes = [r for r, n in Counter(refs).items() if n > 1]
        raise SystemExit(f"Duplicate canonical refs: {dupes[:20]}")

    rows = []
    group_counts = Counter()
    range_count = 0
    implied = 0
    for ref in refs:
        m = UID_RE.fullmatch(ref)
        assert m
        samyutta = int(m.group(1))
        start = int(m.group(2))
        end = int(m.group(3)) if m.group(3) else start
        if end < start:
            raise SystemExit(f"Invalid canonical range: {ref}")
        is_range = end != start
        range_count += int(is_range)
        implied += end - start + 1
        group_counts[samyutta] += 1
        rows.append({"canonicalRef": ref, "samyutta": samyutta, "start": start, "end": end, "isRange": is_range, "impliedCount": end - start + 1})

    groups = sorted(group_counts)
    if groups != list(range(1, 57)):
        raise SystemExit(f"Expected SN groups 1..56, got {groups}")
    if len(rows) != 1819:
        raise SystemExit(f"Unexpected SN canonical leaf count {len(rows)} (expected 1819)")

    generated = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    source_sha = hashlib.sha256(raw).hexdigest()
    discovery = {
        "collection": "SN",
        "source": {"provider": "SuttaCentral sc-data", "url": TREE_URL, "sha256": source_sha},
        "generatedAt": generated,
        "policy": "Canonical leaf UIDs are preserved exactly as published. Range UIDs are not expanded automatically.",
        "canonicalLeafCount": len(rows),
        "rangeLeafCount": range_count,
        "impliedNumericCount": implied,
        "samyuttaCount": len(groups),
        "groupLeafCounts": {str(k): group_counts[k] for k in groups},
        "items": rows,
    }
    report = {
        "collection": "SN",
        "sourceSha256": source_sha,
        "canonicalLeafCount": len(rows),
        "rangeLeafCount": range_count,
        "impliedNumericCount": implied,
        "samyuttaCount": len(groups),
        "firstCanonicalRef": rows[0]["canonicalRef"],
        "lastCanonicalRef": rows[-1]["canonicalRef"],
        "groupLeafCounts": {str(k): group_counts[k] for k in groups},
        "generatedAt": generated,
    }
    write_json("discovery-sn.json", discovery)
    write_json("discovery-sn-report.json", report)
    return discovery, refs


def flatten_suttaplex(raw, wanted: set[str]) -> dict[str, dict]:
    found: dict[str, dict] = {}

    def walk(node):
        if isinstance(node, list):
            for x in node:
                walk(x)
            return
        if not isinstance(node, dict):
            return
        uid = node.get("uid")
        if isinstance(uid, str) and LEAF_RE.fullmatch(uid) and uid in wanted:
            if uid not in found or len(node) > len(found[uid]):
                found[uid] = node
        for value in node.values():
            if isinstance(value, (list, dict)):
                walk(value)

    walk(raw)
    return found


def map_vi(refs: list[str]) -> None:
    raw = json.loads(fetch_bytes(VI_URL))
    wanted = set(refs)
    found = flatten_suttaplex(raw, wanted)
    items = []
    vi_count = 0
    minh_count = 0
    for uid in refs:
        rec = found.get(uid) or {}
        translations = rec.get("translations") if isinstance(rec.get("translations"), list) else []
        vi_trans = [t for t in translations if isinstance(t, dict) and t.get("lang") == "vi"]
        minh = next((t for t in vi_trans if t.get("author_uid") == "minh_chau"), None)
        selected = minh or (vi_trans[0] if vi_trans else None)
        vi_count += int(bool(vi_trans))
        minh_count += int(minh is not None)
        items.append({
            "canonicalRef": uid,
            "acronym": rec.get("acronym"),
            "originalTitle": rec.get("original_title"),
            "translatedTitle": rec.get("translated_title"),
            "hasSuttaplexRecord": uid in found,
            "viTranslations": [{"authorUid": t.get("author_uid"), "author": t.get("author"), "title": t.get("title"), "segmented": t.get("segmented")} for t in vi_trans],
            "preferredVi": ({"authorUid": selected.get("author_uid"), "author": selected.get("author"), "title": selected.get("title"), "segmented": selected.get("segmented")} if selected else None),
        })
    missing = [uid for uid in refs if uid not in found]
    report = {
        "collection": "SN",
        "endpoint": VI_URL,
        "canonicalLeafCount": len(refs),
        "matchedCanonicalRecords": len(refs) - len(missing),
        "missingCanonicalRecords": len(missing),
        "recordsWithAnyViTranslation": vi_count,
        "recordsWithMinhChauTranslation": minh_count,
        "firstMissing": missing[:30],
    }
    if report["matchedCanonicalRecords"] != 1819:
        raise SystemExit(f"Vietnamese Suttaplex canonical coverage mismatch: {report}")
    write_json("discovery-sn-suttaplex.json", {"collection": "SN", "endpoint": VI_URL, "coverage": report, "items": items})
    write_json("discovery-sn-suttaplex-report.json", report)


def map_en(refs: list[str]) -> None:
    raw = json.loads(fetch_bytes(EN_URL))
    wanted = set(refs)
    found = flatten_suttaplex(raw, wanted)
    items = []
    preferred_count = 0
    title_count = 0
    for uid in refs:
        rec = found.get(uid) or {}
        translations = rec.get("translations") if isinstance(rec.get("translations"), list) else []
        en_trans = [t for t in translations if isinstance(t, dict) and t.get("lang") == "en"]
        sujato = next((t for t in en_trans if t.get("author_uid") == "sujato"), None)
        selected = sujato or (en_trans[0] if en_trans else None)
        preferred = ({"authorUid": selected.get("author_uid"), "author": selected.get("author"), "title": selected.get("title")} if selected else None)
        preferred_count += int(preferred is not None)
        translated_title = rec.get("translated_title")
        title_count += int(bool((preferred or {}).get("title") or translated_title))
        items.append({"canonicalRef": uid, "translatedTitle": translated_title, "preferredEn": preferred})
    report = {"collection": "SN", "canonicalLeafCount": len(refs), "matched": sum(uid in found for uid in refs), "preferredEnCount": preferred_count, "englishTitleCount": title_count}
    if report["matched"] != 1819 or report["englishTitleCount"] != 1819:
        raise SystemExit(f"English Suttaplex coverage mismatch: {report}")
    write_json("discovery-sn-suttaplex-en.json", {"coverage": report, "items": items})
    write_json("discovery-sn-suttaplex-en-report.json", report)


def main() -> None:
    _, refs = canonical_discovery()
    map_vi(refs)
    map_en(refs)
    print(f"SN discovery complete: {len(refs)} canonical leaves")


if __name__ == "__main__":
    main()
