#!/usr/bin/env python3
"""새 학회 사이트 폴더를 만듭니다.

사용법:
    python3 scripts/new_site.py <slug>                    # 빈 뼈대로 시작
    python3 scripts/new_site.py <slug> --from sites/example-2027   # 기존 사이트를 복사해서 시작

결과: sites/<slug>/conference.json, sites/<slug>/assets/, sites/<slug>/README.md
slug 는 소문자·숫자·하이픈만 사용합니다 (예: ntc2027, algebra-camp-2028).
"""
import argparse
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SITE_README = """# {slug}

이 폴더는 학회 홈페이지 한 개의 원본입니다.

- `conference.json` — 홈페이지에 표시되는 모든 내용(한/영). 이 파일만 고치면 됩니다.
- `assets/` — 대표 사진(hero.jpg), 포스터(poster.pdf), 단체사진, 후원기관 로고 등
- `index.html` — 빌드 결과물. 직접 고치지 말고 아래 명령으로 다시 만듭니다.

```bash
python3 scripts/validate.py sites/{slug}/conference.json   # 내용 검사
python3 scripts/build.py sites/{slug} --deploy dist/{slug}  # 빌드 + 배포 폴더 생성
```

배포(GitHub Pages) 방법은 저장소 루트의 `references/hosting.md` 를 참고하세요.
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--from", dest="src", help="복사할 기존 사이트 폴더 (예: sites/example-2027)")
    args = ap.parse_args()

    slug = args.slug
    if not re.match(r"^[a-z0-9][a-z0-9\-]*$", slug):
        raise SystemExit("slug 는 소문자·숫자·하이픈만 사용합니다 (예: ntc2027)")
    dest = ROOT / "sites" / slug
    if dest.exists():
        raise SystemExit(f"이미 존재합니다: {dest}")

    dest.mkdir(parents=True)
    (dest / "assets").mkdir()

    if args.src:
        src = Path(args.src)
        data = json.loads((src / "conference.json").read_text(encoding="utf-8"))
        if (src / "assets").is_dir():
            shutil.copytree(src / "assets", dest / "assets", dirs_exist_ok=True)
    else:
        data = json.loads((ROOT / "template" / "conference.skeleton.json").read_text(encoding="utf-8"))

    data["slug"] = slug
    data["updated"] = date.today().isoformat()
    (dest / "conference.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (dest / "README.md").write_text(SITE_README.format(slug=slug), encoding="utf-8")
    print(f"OK    {dest}/conference.json 을 만들었습니다. 내용을 채운 뒤 build.py 를 실행하세요.")


if __name__ == "__main__":
    main()
