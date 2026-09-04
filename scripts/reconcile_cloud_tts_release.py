#!/usr/bin/env python3
"""Reconcile Google Cloud TTS release checkpoints with quota and public catalogs.

A render is treated as durable only when both <ref>.mp3 and <ref>.json exist in the
GitHub release. The receipt is authoritative for model/voice/character/source
metadata. Reconciliation is idempotent: quota is charged at most once per
canonical ref per ledger month, while the public audio catalog is repaired for
all complete release checkpoints.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any

PURPOSE = "progressive final-quality scripture audio"
PROVIDER = "Google Cloud Text-to-Speech"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def asset_months(release: dict[str, Any]) -> dict[str, str]:
    out: dict[str, str] = {}
    for asset in release.get("assets", []):
        name = str(asset.get("name", ""))
        created = str(asset.get("created_at", ""))
        if name and len(created) >= 7:
            out[name] = created[:7]
    return out


def reset_month_if_needed(usage: dict[str, Any], month: str, today: str) -> bool:
    if usage.get("month") == month:
        return False
    usage["month"] = month
    for quota in usage["models"].values():
        quota["usedCharacters"] = 0
        quota["remainingProjectSafeCharacters"] = int(quota["projectSafetyLimitCharacters"])
        quota["status"] = "SAFE"
    usage.setdefault("events", []).append(
        {
            "date": today,
            "purpose": "monthly project quota ledger reset",
            "canonicalRef": None,
            "result": "reset",
        }
    )
    return True


def quota_event_exists(usage: dict[str, Any], ref: str, month: str) -> bool:
    for event in usage.get("events", []):
        if (
            event.get("result") == "success"
            and event.get("purpose") == PURPOSE
            and str(event.get("canonicalRef", "")).lower() == ref
            and str(event.get("date", "")).startswith(month)
        ):
            return True
    return False


def validate_receipt(receipt: dict[str, Any], ref: str) -> tuple[str, int, str, str]:
    receipt_ref = str(receipt.get("canonicalRef", "")).strip().lower()
    if receipt_ref != ref:
        raise ValueError(f"receipt ref mismatch: file={ref}, receipt={receipt_ref}")
    if receipt.get("provider") != PROVIDER:
        raise ValueError(f"unexpected provider for {ref}: {receipt.get('provider')!r}")
    model = str(receipt.get("model", "")).strip().lower()
    voice = str(receipt.get("voice", "")).strip()
    source = str(receipt.get("textSource", "")).strip()
    chars = int(receipt.get("characters", 0))
    if not model or not voice or not source or chars <= 0:
        raise ValueError(f"incomplete receipt for {ref}")
    return model, chars, voice, source


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release-json", type=Path, required=True)
    parser.add_argument("--receipts-dir", type=Path, required=True)
    parser.add_argument("--usage", type=Path, required=True)
    parser.add_argument("--sutta-catalog", type=Path, required=True)
    parser.add_argument("--audio-catalog", type=Path, required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--release-tag", required=True)
    args = parser.parse_args()

    release = load_json(args.release_json)
    usage = load_json(args.usage)
    suttas = load_json(args.sutta_catalog)
    audio = load_json(args.audio_catalog)

    today = dt.date.today().isoformat()
    month = today[:7]
    usage_changed = reset_month_if_needed(usage, month, today)
    audio_changed = False

    assets = asset_months(release)
    names = set(assets)
    rows = {str(row.get("canonicalRef", "")).strip().lower(): row for row in suttas}
    reconciled_quota: list[str] = []
    reconciled_catalog: list[str] = []

    complete_refs = sorted(
        name[:-5].lower()
        for name in names
        if name.endswith(".json") and f"{name[:-5]}.mp3" in names
    )

    for ref in complete_refs:
        receipt_path = args.receipts_dir / f"{ref}.json"
        if not receipt_path.is_file():
            print(f"WARN {ref}: complete release pair exists but receipt was not downloaded")
            continue
        receipt = load_json(receipt_path)
        model, chars, voice, source = validate_receipt(receipt, ref)

        # Repair the public catalog regardless of the month in which the audio was rendered.
        row = rows.get(ref)
        if row:
            desired = {
                "url": f"https://github.com/{args.repository}/releases/download/{args.release_tag}/{ref}.mp3",
                "label": f"{row.get('viCode') or row.get('code') or ref.upper()} · Google Cloud TTS",
                "provider": PROVIDER,
                "sourceUrl": source,
                "download": True,
            }
            entry = audio.setdefault(row["id"], {})
            if entry.get("vi") != desired:
                entry["vi"] = desired
                audio_changed = True
                reconciled_catalog.append(ref)

        # Only charge the current ledger for assets synthesized/uploaded this month.
        if assets.get(f"{ref}.json") != month and assets.get(f"{ref}.mp3") != month:
            continue
        if quota_event_exists(usage, ref, month):
            continue
        if model not in usage.get("models", {}):
            raise ValueError(f"unknown quota model in receipt for {ref}: {model}")

        quota = usage["models"][model]
        quota["usedCharacters"] = int(quota.get("usedCharacters", 0)) + chars
        limit = int(quota["projectSafetyLimitCharacters"])
        quota["remainingProjectSafeCharacters"] = max(0, limit - int(quota["usedCharacters"]))
        quota["status"] = "SAFE" if quota["remainingProjectSafeCharacters"] > 0 else "STOPPED"
        event_date = str(next(
            (a.get("created_at", "")[:10] for a in release.get("assets", []) if a.get("name") == f"{ref}.json"),
            today,
        ))
        usage.setdefault("events", []).append(
            {
                "date": event_date or today,
                "purpose": PURPOSE,
                "canonicalRef": ref,
                "charactersPerVoice": chars,
                "voices": [voice],
                "model": model,
                "workflowRun": "release-reconciliation",
                "result": "success",
            }
        )
        usage_changed = True
        reconciled_quota.append(ref)

    if usage_changed:
        save_json(args.usage, usage)
    if audio_changed:
        save_json(args.audio_catalog, audio)

    print(
        json.dumps(
            {
                "completeReleaseRefs": len(complete_refs),
                "quotaReconciled": reconciled_quota,
                "catalogReconciled": reconciled_catalog,
                "usageChanged": usage_changed,
                "audioChanged": audio_changed,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
