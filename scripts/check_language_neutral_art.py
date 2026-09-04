from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "visuals" / "nikaya"
FORBIDDEN = (
    "TRƯỜNG BỘ",
    "TRUNG BỘ",
    "TƯƠNG ƯNG BỘ",
    "TĂNG CHI BỘ",
    "TIỂU BỘ",
)

errors = []
for path in sorted(ART.glob("*-book.svg")):
    text = path.read_text(encoding="utf-8")
    found = [label for label in FORBIDDEN if label in text]
    if found:
        errors.append(f"{path.relative_to(ROOT)}: {', '.join(found)}")

if errors:
    raise SystemExit("Language-specific labels found in shared artwork:\n" + "\n".join(errors))

print("Shared Nikaya artwork is language-neutral.")
