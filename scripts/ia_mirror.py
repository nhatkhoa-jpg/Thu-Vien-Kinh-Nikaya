#!/usr/bin/env python3
"""Internet Archive preservation mirror for Nikaya collection media packs.

Default mode uploads only preservation metadata/checksums. Scripture-bearing PDF/MP3
assets require an explicit rights confirmation. TTS source TXT files are never
uploaded by this script.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Iterable

import internetarchive

RIGHTS_PHRASE = "YES_I_HAVE_VERIFIED_REDISTRIBUTION_RIGHTS"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_assets(pack: Path, collection: str, publish_content: bool) -> list[Path]:
    assets: list[Path] = []
    if publish_content:
        pdf = pack / f"{collection.lower()}-complete.pdf"
        whole_mp3 = pack / f"{collection.lower()}-complete.mp3"
        if pdf.exists():
            assets.append(pdf)
        if whole_mp3.exists():
            assets.append(whole_mp3)
        mp3_dir = pack / "mp3"
        if mp3_dir.exists():
            assets.extend(sorted(p for p in mp3_dir.glob("*.mp3") if p.is_file()))
    return assets


def write_preservation_files(pack: Path, collection: str, identifier: str, assets: Iterable[Path]) -> tuple[Path, Path]:
    src_manifest = json.loads((pack / "manifest.json").read_text(encoding="utf-8"))
    asset_rows = []
    for p in assets:
        rel = p.relative_to(pack).as_posix()
        asset_rows.append({"path": rel, "bytes": p.stat().st_size, "sha256": sha256(p)})

    preservation = {
        "schemaVersion": 1,
        "identifier": identifier,
        "collection": collection,
        "generatedAt": src_manifest.get("generatedAt"),
        "catalogCount": src_manifest.get("catalogCount"),
        "readyCount": src_manifest.get("readyCount"),
        "missingCount": src_manifest.get("missingCount"),
        "totalTtsCharacters": src_manifest.get("totalChars"),
        "ttsPolicy": src_manifest.get("ttsPolicy"),
        "assetPolicy": "TTS source TXT files are never uploaded to Internet Archive by this mirror.",
        "assets": asset_rows,
    }
    manifest_path = pack / "PRESERVATION-MANIFEST.json"
    manifest_path.write_text(json.dumps(preservation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checksum_paths = [manifest_path, *assets]
    sums_path = pack / "SHA256SUMS"
    sums_path.write_text(
        "".join(f"{sha256(p)}  {p.relative_to(pack).as_posix()}\n" for p in checksum_paths),
        encoding="utf-8",
    )
    return manifest_path, sums_path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--collection", required=True, choices=["DN", "MN", "SN", "AN", "KN"])
    ap.add_argument("--pack", required=True)
    ap.add_argument("--identifier")
    ap.add_argument("--publish-content", action="store_true")
    ap.add_argument("--rights-confirmation", default="")
    args = ap.parse_args()

    access = os.environ.get("IA_ACCESS_KEY", "")
    secret = os.environ.get("IA_SECRET_KEY", "")
    if not access or not secret:
        raise SystemExit("Internet Archive credentials are missing")

    collection = args.collection.upper()
    pack = Path(args.pack).resolve() / collection.lower()
    if not (pack / "manifest.json").exists():
        raise SystemExit(f"Missing media pack manifest: {pack / 'manifest.json'}")

    if args.publish_content and args.rights_confirmation != RIGHTS_PHRASE:
        raise SystemExit(
            "Public scripture-bearing upload blocked: redistribution rights were not explicitly confirmed."
        )

    identifier = args.identifier or f"nikaya-vietnamese-{collection.lower()}"
    assets = safe_assets(pack, collection, args.publish_content)
    manifest_path, sums_path = write_preservation_files(pack, collection, identifier, assets)

    upload_files = [manifest_path, sums_path, *assets]
    metadata = {
        "title": f"{collection} — Thư viện 5 Đại Tạng Kinh Nikāya",
        "description": (
            "Preservation mirror for the Five Nikāya Library. This item uses manifests and SHA-256 checksums "
            "for restore verification. Scripture-bearing assets are only uploaded after redistribution rights are verified."
        ),
        "creator": "Thư viện 5 Đại Tạng Kinh Nikāya",
        "subject": ["Nikaya", "Buddhism", "Pali Canon", "Vietnamese", "digital preservation"],
        "language": "vie",
        "mediatype": "data" if not args.publish_content else "texts",
    }

    item = internetarchive.get_item(identifier, config={"s3": {"access": access, "secret": secret}})
    responses = item.upload(
        [str(p) for p in upload_files],
        metadata=metadata,
        verbose=False,
        retries=3,
        retries_sleep=5,
    )
    for r in responses:
        if not getattr(r, "ok", False):
            raise SystemExit(f"Internet Archive upload failed with HTTP {getattr(r, 'status_code', 'unknown')}")

    refreshed = internetarchive.get_item(identifier)
    names = {f.get("name") for f in refreshed.files}
    expected = {p.name if p.parent == pack else p.relative_to(pack).as_posix() for p in upload_files}
    # internetarchive may flatten absolute upload paths to basenames; require at least the preservation files.
    for required in (manifest_path.name, sums_path.name):
        if required not in names:
            raise SystemExit(f"Verification failed: {required} not present in item {identifier}")

    print(json.dumps({
        "status": "PASS",
        "identifier": identifier,
        "collection": collection,
        "mode": "content" if args.publish_content else "metadata-only",
        "uploadedFiles": len(upload_files),
        "contentAssets": len(assets),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
