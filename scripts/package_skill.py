#!/usr/bin/env python3
"""스킬 ZIP 을 만듭니다 (claude.ai·ChatGPT Skills 업로드용).

사용법:
    python3 scripts/package_skill.py            # ../conference-site.zip 생성
    python3 scripts/package_skill.py --out /path/to/conference-site.zip

ZIP 안에는 'conference-site/' 폴더가 최상위로 들어갑니다(claude.ai 요구 사항).
dist/, .git/, __pycache__/, node_modules/ 는 제외합니다.
"""
import argparse
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {"dist", ".git", "__pycache__", "node_modules", ".DS_Store"}
EXCLUDE_SUFFIX = {".pyc", ".zip"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT.parent / f"{ROOT.name}.zip"))
    args = ap.parse_args()
    out = Path(args.out)
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob("*")):
            rel = p.relative_to(ROOT)
            if any(part in EXCLUDE_DIRS for part in rel.parts):
                continue
            if p.is_dir() or p.suffix in EXCLUDE_SUFFIX:
                continue
            z.write(p, Path(ROOT.name) / rel)
            count += 1
    print(f"OK    {out}  ({count} files)  — claude.ai(설정 → Skills) 또는 ChatGPT(Skills → Create → Upload) 에 올리세요.")


if __name__ == "__main__":
    main()
