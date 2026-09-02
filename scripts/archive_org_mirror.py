#!/usr/bin/env python3
"""Mirror verified Nikaya MP3 objects from private R2 to one Internet Archive item.

Required env:
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
  IA_ACCESS_KEY, IA_SECRET_KEY

The script is idempotent at the filename/checksum level: an existing Archive.org
file is skipped when its MD5 matches the local R2 object download.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import tempfile
from pathlib import Path

import boto3
import internetarchive


def need(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def md5_file(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def archive_name(key: str) -> str:
    """Keep collection identity in the archive filename (audio/dn/dn1.mp3 -> dn-dn1.mp3)."""
    clean = key.strip("/")
    parts = clean.split("/")
    if len(parts) >= 3 and parts[0] == "audio":
        return f"{parts[-2]}-{parts[-1]}"
    return clean.replace("/", "-")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", default="audio/")
    parser.add_argument("--identifier", default="thu-vien-kinh-nikaya-audio")
    parser.add_argument("--title", default="5 Great Nikāya Collections — Audio Library")
    parser.add_argument("--description", default="Preservation mirror of verified Nikāya MP3 readings. Source and editorial information: https://thu-vien-kinh-nikaya.nhatkhoa-nikaya.workers.dev/en/editorial-policy")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    account = need("R2_ACCOUNT_ID")
    bucket = need("R2_BUCKET_NAME")
    r2 = boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=need("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=need("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )

    ia_access = need("IA_ACCESS_KEY")
    ia_secret = need("IA_SECRET_KEY")
    item = internetarchive.get_item(args.identifier)
    remote_md5 = {f.get("name"): f.get("md5") for f in item.files if f.get("name")}

    paginator = r2.get_paginator("list_objects_v2")
    objects = []
    for page in paginator.paginate(Bucket=bucket, Prefix=args.prefix):
        for obj in page.get("Contents", []):
            key = obj.get("Key", "")
            if key.lower().endswith(".mp3"):
                objects.append((key, int(obj.get("Size", 0))))

    if not objects:
        print(f"No MP3 objects found under {args.prefix}")
        return 0

    metadata = {
        "title": args.title,
        "description": args.description,
        "mediatype": "audio",
        "collection": "opensource_audio",
        "subject": ["Nikaya", "Theravada", "Early Buddhism", "Buddhist discourses", "Vietnamese audio"],
        "language": "Vietnamese",
    }

    uploaded = skipped = 0
    with tempfile.TemporaryDirectory(prefix="nikaya-ia-") as td:
        root = Path(td)
        for key, size in sorted(objects):
            name = archive_name(key)
            local = root / name
            print(f"R2 -> local: {key} ({size} bytes)")
            r2.download_file(bucket, key, str(local))
            digest = md5_file(local)
            if remote_md5.get(name) == digest:
                print(f"SKIP {name}: checksum already matches Archive.org")
                skipped += 1
                continue
            if args.dry_run:
                print(f"DRY-RUN upload {name} md5={digest}")
                continue
            print(f"UPLOAD {name} -> archive.org/details/{args.identifier}")
            internetarchive.upload(
                args.identifier,
                files=[str(local)],
                metadata=metadata,
                access_key=ia_access,
                secret_key=ia_secret,
                retries=3,
                verbose=True,
            )
            uploaded += 1

    print(f"ARCHIVE_MIRROR_DONE uploaded={uploaded} skipped={skipped} total={len(objects)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
