#!/usr/bin/env python3
"""웹 도구(index.html)가 브라우저 안 파이썬으로 내려받을 저장소 파일 목록(web/manifest.json)을 만든다.

    python3 scripts/make_web_manifest.py          # web/manifest.json 갱신
    python3 scripts/make_web_manifest.py --check  # 최신인지 확인만 (selftest 가 사용)

scripts/·template/·themes/ 를 고친 뒤에는 이 스크립트를 다시 실행해 커밋한다.
version 은 파일 내용으로 만든 값이라, 파일이 바뀌면 브라우저가 옛 파일을 쓰지 않는다.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "manifest.json"

FILES = [
    "scripts/build.py", "scripts/validate.py", "scripts/themes.py", "scripts/emailcodec.py",
    "scripts/make_poster.py", "scripts/make_registration_script.py", "scripts/export_open_design.py",
    "template/index.template.html", "template/style.css", "template/app.js", "template/poster.css",
    "template/poster.js", "template/registration.gs", "template/conference.skeleton.json",
    "references/schema.md", "web/bridge.py",
]
EXAMPLE = "sites/example-2027"


def build_manifest():
    files = list(FILES) + sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "themes").glob("*.json"))
    example_assets = sorted(p.relative_to(ROOT / EXAMPLE).as_posix() for p in (ROOT / EXAMPLE / "assets").rglob("*")
                            if p.is_file() and p.name != "README.txt")
    h = hashlib.sha256()
    for f in files + [EXAMPLE + "/conference.json"] + [EXAMPLE + "/" + a for a in example_assets]:
        h.update(f.encode())
        h.update((ROOT / f).read_bytes())
    return {
        "version": h.hexdigest()[:12],
        "files": files,
        "example": {"conference": EXAMPLE + "/conference.json", "assets": example_assets, "base": EXAMPLE},
        "vendor": {"segno": "web/vendor/segno-1.6.6-py3-none-any.whl"},
    }


def main():
    m = build_manifest()
    text = json.dumps(m, ensure_ascii=False, indent=2) + "\n"
    if "--check" in sys.argv:
        ok = OUT.exists() and OUT.read_text(encoding="utf-8") == text
        print("OK" if ok else "web/manifest.json 이 최신이 아닙니다 — python3 scripts/make_web_manifest.py")
        return 0 if ok else 1
    OUT.write_text(text, encoding="utf-8")
    print(f"OK    {OUT.relative_to(ROOT)}  (파일 {len(m['files'])}개, version {m['version']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
