from __future__ import annotations

import hashlib
import os
import sys

import boto3
from botocore.config import Config


def require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"missing required environment variable: {name}")
    return value


def main() -> int:
    access_key = require("R2_ACCESS_KEY_ID")
    secret_key = require("R2_SECRET_ACCESS_KEY")
    account_id = require("R2_ACCOUNT_ID")
    bucket = require("R2_BUCKET_NAME")

    endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
    run_id = os.environ.get("GITHUB_RUN_ID", "local")
    key = f"ops/health/r2-smoke-{run_id}.txt"
    payload = b"nikaya-r2-smoke-v1\n"
    expected_sha = hashlib.sha256(payload).hexdigest()

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(signature_version="s3v4", retries={"max_attempts": 3, "mode": "standard"}),
    )

    print(f"R2 smoke bucket={bucket} key={key}")
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=payload,
        ContentType="text/plain; charset=utf-8",
        Metadata={"sha256": expected_sha, "purpose": "credential-smoke"},
    )

    head = s3.head_object(Bucket=bucket, Key=key)
    metadata_sha = head.get("Metadata", {}).get("sha256")
    if metadata_sha != expected_sha:
        raise RuntimeError("R2 HEAD metadata checksum mismatch")

    body = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    actual_sha = hashlib.sha256(body).hexdigest()
    if body != payload or actual_sha != expected_sha:
        raise RuntimeError("R2 GET payload checksum mismatch")

    s3.delete_object(Bucket=bucket, Key=key)
    print("R2 PUT/HEAD/GET/checksum/DELETE: PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"R2 smoke: FAIL: {exc}", file=sys.stderr)
        raise
