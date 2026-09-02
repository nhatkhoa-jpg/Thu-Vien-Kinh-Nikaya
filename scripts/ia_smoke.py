from __future__ import annotations

import hashlib
import io
import json
import os
import time
from datetime import datetime, timezone

import requests
from internetarchive import get_item

access = os.environ.get('IA_ACCESS_KEY', '').strip()
secret = os.environ.get('IA_SECRET_KEY', '').strip()
identifier = os.environ.get('IA_IDENTIFIER', 'nikaya-ops-health-smoke-nhatkhoa').strip()
if not access or not secret:
    raise SystemExit('Internet Archive credentials are missing')

payload = (
    'Nikaya Internet Archive smoke test\n'
    f'utc={datetime.now(timezone.utc).isoformat()}\n'
).encode('utf-8')
expected_md5 = hashlib.md5(payload).hexdigest()

config = {'s3': {'access': access, 'secret': secret}}
item = get_item(identifier, config=config)
metadata = {
    'title': 'Nikaya Internet Archive Ops Smoke Test',
    'collection': 'test_collection',
    'mediatype': 'data',
    'description': 'Disposable automated connectivity check for the Nikaya preservation pipeline.',
    'subject': ['nikaya', 'ops-health', 'smoke-test'],
}

print(f'Uploading smoke object to test_collection item: {identifier}')
result = item.upload(
    {'health.txt': io.BytesIO(payload)},
    metadata=metadata,
    verbose=False,
    retries=2,
    retries_sleep=3,
)
if result is False:
    raise SystemExit('Internet Archive client reported upload failure')

meta_url = f'https://archive.org/metadata/{identifier}'
deadline = time.time() + 90
found = None
last_status = None
while time.time() < deadline:
    response = requests.get(meta_url, timeout=20)
    last_status = response.status_code
    if response.ok:
        data = response.json()
        for entry in data.get('files', []):
            if entry.get('name') == 'health.txt':
                found = entry
                break
        if found:
            break
    time.sleep(3)

if not found:
    raise SystemExit(f'Upload was not visible in metadata within timeout; last HTTP={last_status}')

remote_md5 = str(found.get('md5', '')).lower()
if remote_md5 and remote_md5 != expected_md5:
    raise SystemExit(f'MD5 mismatch: expected {expected_md5}, got {remote_md5}')

file_url = f'https://archive.org/download/{identifier}/health.txt'
response = requests.get(file_url, timeout=30)
response.raise_for_status()
if response.content != payload:
    raise SystemExit('Downloaded smoke object does not match uploaded bytes')

print(json.dumps({
    'status': 'PASS',
    'identifier': identifier,
    'collection': 'test_collection',
    'file': 'health.txt',
    'bytes': len(payload),
    'md5': expected_md5,
}, ensure_ascii=False))
