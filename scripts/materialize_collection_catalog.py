#!/usr/bin/env python3
"""Materialize AN/SN catalog rows without expanding canonical ranges."""
from __future__ import annotations

import argparse
import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/catalog"
CATALOG = DATA / "suttas.json"
LICENSE = "Xem ghi chú quyền sử dụng tại nguồn"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", required=True, choices=["AN", "SN"])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    lower = args.collection.lower()
    discovery = load(DATA / f"discovery-{lower}.json")
    vi = load(DATA / f"discovery-{lower}-suttaplex.json")
    en = load(DATA / f"discovery-{lower}-suttaplex-en.json")
    existing = load(CATALOG)
    refs = [x["canonicalRef"] for x in discovery["items"]]
    vi_map = {x["canonicalRef"]: x for x in vi["items"]}
    en_map = {x["canonicalRef"]: x for x in en["items"]}
    if len(refs) != len(set(refs)) or set(refs) != set(vi_map) or set(refs) != set(en_map):
        raise SystemExit("canonical/metadata identity mismatch")
    old = {x["canonicalRef"]: x for x in existing if x.get("collection") == args.collection}
    final = [x for x in existing if x.get("collection") != args.collection]
    missing_vi = []
    rows = []
    for ref in refs:
        vm, em = vi_map[ref], en_map[ref]
        preferred_vi = vm.get("preferredVi")
        preferred_en = em.get("preferredEn")
        source_pali = (vm.get("originalTitle") or "").strip()
        pali = source_pali or str((old.get(ref) or {}).get("pali") or "").strip()
        en_title = ((preferred_en or {}).get("title") or em.get("translatedTitle") or "").strip()
        if not en_title:
            raise SystemExit(f"missing English title canonicalRef={ref}")
        has_minh_chau = (preferred_vi or {}).get("authorUid") == "minh_chau"
        vi_title = ((preferred_vi or {}).get("title") or vm.get("translatedTitle") or "").strip()
        if not has_minh_chau:
            missing_vi.append(ref)
            vi_title = f"{pali or ref.upper()} (chưa có bản Việt Thích Minh Châu)"
        elif not vi_title:
            vi_title = f"{pali or ref.upper()} (bản Việt Thích Minh Châu; tiêu đề Việt chưa có trong metadata nguồn)"
        number = ref[len(lower):]
        row = deepcopy(old.get(ref) or {})
        row.update({
            "id": row.get("id") or f"nikaya.{lower}.{number}",
            "canonicalRef": ref,
            "slug": row.get("slug") or f"{lower}-" + re.sub(r"[^0-9]+", "-", number).strip("-"),
            "code": (vm.get("acronym") or f"{args.collection} {number}").strip(),
            "viCode": f"TCB {number}" if args.collection == "AN" else f"TƯB {number}",
            "collection": args.collection,
            "pali": pali,
            "paliTitleAvailable": bool(pali),
            "vi": vi_title,
            "en": en_title,
        })
        row.setdefault("topics", [])
        row.setdefault("summary", {"vi": "", "en": ""})
        row.setdefault("practice", {"vi": "", "en": ""})
        row.setdefault("readMinutes", 0)
        row.setdefault("featured", False)
        row["contentVersion"] = f"2026-09-02.{lower}-canonical-v1"
        row["source"] = ({
            "url": f"https://suttacentral.net/{ref}/vi/minh_chau", "provider": "SuttaCentral",
            "translator": "Thích Minh Châu", "license": LICENSE, "language": "vi",
        } if has_minh_chau else {
            "url": f"https://suttacentral.net/{ref}", "provider": "SuttaCentral",
            "translator": "Không áp dụng (bản Pāli gốc)", "license": LICENSE, "language": "pli",
        })
        row["media"] = ({"bookUrl": f"https://suttacentral.net/edition/{lower}/vi/minh_chau"} if has_minh_chau else {})
        rows.append(row)
    final.extend(rows)
    for key in ("canonicalRef", "id", "slug"):
        values = [x.get(key) for x in final]
        if None in values or len(values) != len(set(values)):
            raise SystemExit(f"missing/duplicate {key}")
    report = {
        "collection": args.collection, "canonicalCount": len(refs), "catalogCount": len(rows),
        "preservedEditorialRecords": sorted(old), "minhChauVietnameseRecords": len(refs) - len(missing_vi),
        "missingMinhChauVietnameseRecords": len(missing_vi), "missingMinhChauRefs": missing_vi,
        "rangeCanonicalRefsPreserved": sum("-" in ref for ref in refs),
        "policy": "Canonical ranges preserved; missing translations explicit; no generated scripture or editorial summary.",
    }
    dump(DATA / f"{lower}-materialization-preview.json", rows)
    dump(DATA / f"{lower}-materialization-report.json", report)
    if args.apply:
        dump(CATALOG, final)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
