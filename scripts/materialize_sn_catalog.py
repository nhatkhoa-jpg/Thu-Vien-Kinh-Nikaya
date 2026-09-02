#!/usr/bin/env python3
"""Deterministically materialize the Samyutta Nikaya catalog from discovery data.

Discovery refs are authoritative and range UIDs are preserved exactly. Existing SN
editorial records are preserved field-for-field except source metadata can be
normalized to the preferred Vietnamese source when available.
"""
from __future__ import annotations

import argparse
import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/catalog/suttas.json"
DISCOVERY = ROOT / "data/catalog/discovery-sn.json"
VI_META = ROOT / "data/catalog/discovery-sn-suttaplex.json"
EN_META = ROOT / "data/catalog/discovery-sn-suttaplex-en.json"
PREVIEW = ROOT / "data/catalog/sn-materialization-preview.json"
REPORT = ROOT / "data/catalog/sn-materialization-report.json"

LICENSE_NOTE = "Xem ghi chú quyền sử dụng tại nguồn"
VI_TRANSLATOR = "Thích Minh Châu"
CONTENT_VERSION = "2026-09-02.sn-canonical-v1"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def numeric_part(ref: str) -> str:
    if not ref.startswith("sn"):
        raise ValueError(ref)
    return ref[2:]


def generated_id(ref: str) -> str:
    return f"nikaya.sn.{numeric_part(ref)}"


def generated_slug(ref: str) -> str:
    return "sn-" + re.sub(r"[^0-9]+", "-", numeric_part(ref)).strip("-")


def materialize() -> tuple[list[dict], dict]:
    existing = load(CATALOG)
    discovery = load(DISCOVERY)
    vi = load(VI_META)
    en = load(EN_META)

    refs = [x["canonicalRef"] for x in discovery["items"]]
    vi_map = {x["canonicalRef"]: x for x in vi["items"]}
    en_map = {x["canonicalRef"]: x for x in en["items"]}
    old_sn = {x["canonicalRef"]: x for x in existing if x.get("collection") == "SN"}
    non_sn = [x for x in existing if x.get("collection") != "SN"]

    if len(refs) != 1819 or len(set(refs)) != len(refs):
        raise SystemExit(f"Unexpected SN canonical set: {len(refs)} refs")
    if set(refs) != set(vi_map) or set(refs) != set(en_map):
        raise SystemExit("Metadata maps do not exactly match authoritative canonical refs")

    rows: list[dict] = []
    missing_vi: list[str] = []
    preserved: list[str] = []
    generated: list[str] = []

    for ref in refs:
        vm = vi_map[ref]
        em = en_map[ref]
        preferred_vi = vm.get("preferredVi")
        preferred_en = em.get("preferredEn")
        pali = (vm.get("originalTitle") or "").strip()
        if not pali:
            raise SystemExit(f"Missing Pali title for {ref}")

        vi_title = ((preferred_vi or {}).get("title") or vm.get("translatedTitle") or "").strip()
        has_minh_chau = (preferred_vi or {}).get("authorUid") == "minh_chau"
        if not has_minh_chau:
            missing_vi.append(ref)
            vi_title = f"{pali} (chưa có bản Việt Thích Minh Châu)"

        en_title = ((preferred_en or {}).get("title") or em.get("translatedTitle") or "").strip()
        if not en_title:
            raise SystemExit(f"Missing English title for {ref}")

        code = (vm.get("acronym") or f"SN {numeric_part(ref)}").strip()
        vi_code = f"TƯB {numeric_part(ref)}"

        if ref in old_sn:
            row = deepcopy(old_sn[ref])
            preserved.append(ref)
            row["canonicalRef"] = ref
            row["code"] = code
            row["viCode"] = vi_code
            row["collection"] = "SN"
            if has_minh_chau:
                row["source"] = {
                    "url": f"https://suttacentral.net/{ref}/vi/minh_chau",
                    "provider": "SuttaCentral",
                    "translator": VI_TRANSLATOR,
                    "license": LICENSE_NOTE,
                    "language": "vi",
                }
                row.setdefault("media", {})["bookUrl"] = "https://suttacentral.net/edition/sn/vi/minh_chau"
            continue_row = row
        else:
            generated.append(ref)
            source = (
                {
                    "url": f"https://suttacentral.net/{ref}/vi/minh_chau",
                    "provider": "SuttaCentral",
                    "translator": VI_TRANSLATOR,
                    "license": LICENSE_NOTE,
                    "language": "vi",
                }
                if has_minh_chau
                else {
                    "url": f"https://suttacentral.net/{ref}",
                    "provider": "SuttaCentral",
                    "translator": "Không áp dụng (bản Pāli gốc)",
                    "license": LICENSE_NOTE,
                    "language": "pli",
                }
            )
            media = {"bookUrl": "https://suttacentral.net/edition/sn/vi/minh_chau"} if has_minh_chau else {}
            continue_row = {
                "id": generated_id(ref),
                "canonicalRef": ref,
                "slug": generated_slug(ref),
                "code": code,
                "viCode": vi_code,
                "collection": "SN",
                "pali": pali,
                "vi": vi_title,
                "en": en_title,
                "topics": [],
                "source": source,
                "media": media,
                "summary": {"vi": "", "en": ""},
                "practice": {"vi": "", "en": ""},
                "readMinutes": 0,
                "featured": False,
                "contentVersion": CONTENT_VERSION,
            }
        rows.append(continue_row)

    final = non_sn + rows
    for key in ("canonicalRef", "id", "slug"):
        values = [x[key] for x in final]
        if len(values) != len(set(values)):
            dupes = sorted({v for v in values if values.count(v) > 1})
            raise SystemExit(f"Duplicate {key}: {dupes[:20]}")

    report = {
        "collection": "SN",
        "authoritativeCanonicalCount": len(refs),
        "materializedSnCount": len(rows),
        "preservedEditorialRecords": preserved,
        "generatedRecords": len(generated),
        "minhChauVietnameseRecords": len(refs) - len(missing_vi),
        "missingMinhChauVietnameseRecords": len(missing_vi),
        "missingMinhChauRefs": missing_vi,
        "rangeCanonicalRefsPreserved": sum("-" in r for r in refs),
        "finalCatalogCount": len(final),
        "newRecordsUseUnknownReadMinutesZero": sum(x.get("readMinutes") == 0 for x in rows),
        "policy": {
            "canonicalRanges": "Preserved exactly; never expanded into invented canonical refs.",
            "editorialSeeds": "Existing SN records preserve slug/topics/summary/practice/featured/media except source normalization.",
            "missingVietnamese": "Pali title is shown with an explicit missing-Vietnamese marker; no translation is invented.",
            "summaryPractice": "New records use empty editorial fields; no doctrinal summary/practice text is fabricated.",
            "readMinutes": "0 means unknown until runtime full text can provide a word-count estimate.",
        },
    }
    return final, report


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true", help="Replace data/catalog/suttas.json after writing preview/report")
    args = p.parse_args()
    final, report = materialize()
    sn_rows = [x for x in final if x.get("collection") == "SN"]
    dump(PREVIEW, sn_rows)
    dump(REPORT, report)
    if args.apply:
        dump(CATALOG, final)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
