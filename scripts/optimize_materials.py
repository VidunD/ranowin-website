"""Create lightweight material previews; keep all original photos."""
from pathlib import Path
from PIL import Image, ImageOps
import re
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "materials"
PATTERN = re.compile(r"^\d+\s+D[A-Z]+\s+\d+\.(png|jpe?g|webp)$", re.I)
def optimize():
    DEST.mkdir(exist_ok=True)
    expected = set()
    for source in sorted(ROOT.iterdir()):
        if not source.is_file() or not PATTERN.fullmatch(source.name):
            continue
        target = DEST / (source.stem + ".webp")
        if target.name in expected:
            raise ValueError("Duplicate material filename: " + source.stem)
        expected.add(target.name)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            image.thumbnail((720, 720), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=82, method=6)
    for stale in DEST.glob("*.webp"):
        if stale.name not in expected:
            stale.unlink()
    print(f"Optimized {len(expected)} material photos")
if __name__ == "__main__":
    optimize()
