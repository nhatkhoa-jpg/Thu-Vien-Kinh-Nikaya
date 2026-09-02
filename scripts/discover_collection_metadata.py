#!/usr/bin/env python3
"""Snapshot SuttaCentral Suttaplex metadata for canonical AN/SN leaves."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/catalog"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fetch(url: str, attempts: int = 5) -> bytes:
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Nikaya-Corpus-Builder/2.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as response:
                body = response.read()
            if not body:
                raise RuntimeError("empty response")
            return body
        except Exception as exc:
            last = exc
            if attempt + 1 < attempts:
                time.sleep(min(30, 2 ** attempt))
    raise RuntimeError(f"failed after {attempts} attempts: {url}: {last}")


def flatten(node, wanted: set[str], pattern: re.Pattern[str], found: dict[str, dict]) -> None:
    if isinstance(node, list):
        for item in node:
            flatten(item, wanted, pattern, found)
    elif isinstance(node, dict):
        uid = node.get("uid")
        if isinstance(uid, str) and pattern.fullmatch(uid) and uid in wanted:
            if uid not in found or len(node) > len(found[uid]):
                found[uid] = node
        for value in node.values():
            if isinstance(value, (list, dict)):
                flatten(value, wanted, pattern, found)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", required=True, choices=["AN", "SN"])
    args = parser.parse_args()
    collection = args.collection.lower()
    discovery = load(OUT / f"discovery-{collection}.json")
    refs = [item["canonicalRef"] for item in discovery["items"]]
    wanted = set(refs)
    if len(refs) != discovery["canonicalLeafCount"] or len(wanted) != len(refs):
        raise SystemExit("canonical discovery count/uniqueness mismatch")
    pattern = re.compile(rf"^{collection}\d+\.\d+(?:-\d+)?$")
    generated = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

    for language in ("vi", "en"):
        url = f"https://suttacentral.net/api/suttaplex/{collection}?language={language}"
        raw = fetch(url)
        payload = json.loads(raw)
        found: dict[str, dict] = {}
        flatten(payload, wanted, pattern, found)
        items = []
        preferred_count = 0
        title_count = 0
        for ref in refs:
            record = found.get(ref) or {}
            translations = record.get("translations") if isinstance(record.get("translations"), list) else []
            candidates = [x for x in translations if isinstance(x, dict) and x.get("lang") == language]
            author_uid = "minh_chau" if language == "vi" else "sujato"
            selected = next((x for x in candidates if x.get("author_uid") == author_uid), None)
            selected = selected or (candidates[0] if candidates else None)
            preferred = ({
                "authorUid": selected.get("author_uid"),
                "author": selected.get("author"),
                "title": selected.get("title"),
                "segmented": selected.get("segmented"),
            } if selected else None)
            preferred_count += int(preferred is not None)
            title_count += int(bool((preferred or {}).get("title") or record.get("translated_title")))
            items.append({
                "canonicalRef": ref,
                "acronym": record.get("acronym"),
                "originalTitle": record.get("original_title"),
                "translatedTitle": record.get("translated_title"),
                "hasSuttaplexRecord": ref in found,
                f"preferred{language.title()}": preferred,
            })
        report = {
            "collection": args.collection,
            "language": language,
            "endpoint": url,
            "endpointSha256": hashlib.sha256(raw).hexdigest(),
            "generatedAt": generated,
            "canonicalLeafCount": len(refs),
            "matchedCanonicalRecords": len(found),
            "preferredTranslationCount": preferred_count,
            "titleCount": title_count,
            "missingCanonicalRefs": [ref for ref in refs if ref not in found],
        }
        if len(found) != len(refs):
            raise SystemExit(f"Suttaplex coverage mismatch: {report}")
        suffix = "" if language == "vi" else "-en"
        target = OUT / f"discovery-{collection}-suttaplex{suffix}.json"
        target.write_text(json.dumps({"coverage": report, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (OUT / f"discovery-{collection}-suttaplex{suffix}-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
