from __future__ import annotations

import argparse
import hashlib
import mimetypes
import os
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

GIB = 1024 ** 3


def require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"missing required environment variable: {name}")
    return value


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def content_type(path: Path) -> str:
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def make_client():
    account_id = require("R2_ACCOUNT_ID")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=require("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=require("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(signature_version="s3v4", retries={"max_attempts": 5, "mode": "standard"}),
    )


def bucket_size(s3, bucket: str) -> int:
    total = 0
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        total += sum(int(obj.get("Size", 0)) for obj in page.get("Contents", []))
    return total


def existing_object(s3, bucket: str, key: str):
    try:
        head = s3.head_object(Bucket=bucket, Key=key)
        return int(head.get("ContentLength", 0)), head.get("Metadata", {}).get("sha256", "")
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        status = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if code in {"404", "NoSuchKey", "NotFound"} or status == 404:
            return None
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description="Checksum-aware private media sync to Cloudflare R2")
    parser.add_argument("source", type=Path, help="local directory to publish")
    parser.add_argument("--prefix", default="", help="R2 key prefix, e.g. audio/mn")
    parser.add_argument("--bucket", default=os.environ.get("R2_BUCKET_NAME", "nikaya-media"))
    parser.add_argument("--max-total-gib", type=float, default=9.0, help="hard safety ceiling; default 9 GiB")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    source = args.source.resolve()
    if not source.is_dir():
        raise SystemExit(f"source directory not found: {source}")

    prefix = args.prefix.strip("/")
    files = sorted(p for p in source.rglob("*") if p.is_file())
    if not files:
        print("No files to sync.")
        return 0

    s3 = make_client()
    current_total = bucket_size(s3, args.bucket)
    max_total = int(args.max_total_gib * GIB)

    plan = []
    delta = 0
    for path in files:
        rel = path.relative_to(source).as_posix()
        key = f"{prefix}/{rel}" if prefix else rel
        digest = sha256_file(path)
        size = path.stat().st_size
        existing = existing_object(s3, args.bucket, key)
        if existing and existing[1] == digest and existing[0] == size:
            plan.append(("skip", path, key, digest, size, existing[0]))
            continue
        old_size = existing[0] if existing else 0
        delta += size - old_size
        plan.append(("upload", path, key, digest, size, old_size))

    projected = current_total + delta
    print(f"R2 bucket={args.bucket} current={current_total} projected={projected} ceiling={max_total}")
    if projected > max_total:
        raise SystemExit(
            f"REFUSED: projected R2 usage {projected / GIB:.2f} GiB exceeds safety ceiling {args.max_total_gib:.2f} GiB"
        )

    uploads = skips = 0
    for action, path, key, digest, size, _old_size in plan:
        if action == "skip":
            skips += 1
            print(f"SKIP {key} sha256={digest[:12]} size={size}")
            continue
        uploads += 1
        print(f"{'DRY-RUN ' if args.dry_run else ''}UPLOAD {key} sha256={digest[:12]} size={size}")
        if args.dry_run:
            continue
        s3.upload_file(
            str(path),
            args.bucket,
            key,
            ExtraArgs={
                "ContentType": content_type(path),
                "Metadata": {"sha256": digest, "managed-by": "nikaya-r2-sync"},
            },
        )
        verify = s3.head_object(Bucket=args.bucket, Key=key)
        if verify.get("Metadata", {}).get("sha256") != digest or int(verify.get("ContentLength", -1)) != size:
            raise RuntimeError(f"post-upload verification failed: {key}")

    print(f"R2 sync PASS uploads={uploads} skips={skips} dry_run={args.dry_run}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
