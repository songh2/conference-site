#!/usr/bin/env python3
"""저장소 자체 시험 — 표준 라이브러리만으로 돌아간다.

    python3 scripts/selftest.py

검사 항목:
  1. 예시 사이트(sites/example-2027) 검증·빌드, 공개본에 평문 이메일 0건, _todo 제거
  2. 모든 테마 프리셋으로 빌드되고 CSS 변수가 들어감; 잘못된 테마 값은 거부됨
  3. 빈 템플릿(blank/index.html)이 생성되고 프리셋 표가 들어감; 저장된 blank/ 가 최신인지
  4. 이메일 난독화 왕복, 스킬 ZIP 생성
  5. sites/ 아래에 예시 외의 실제 사이트가 없는지(공개 저장소 점검), 문서에 실제 접수 주소가 없는지
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from build import build, build_blank, EMAIL_RE  # noqa: E402
from emailcodec import encode_email, decode_email  # noqa: E402
from themes import load_presets, resolve_theme  # noqa: E402
from validate import validate  # noqa: E402

fails = 0


def ok(cond, msg):
    global fails
    print(("  ok    " if cond else "  FAIL  ") + msg)
    if not cond:
        fails += 1


def main():
    tmp = Path(tempfile.mkdtemp(prefix="conf-selftest-"))
    try:
        example = ROOT / "sites" / "example-2027"
        data = json.loads((example / "conference.json").read_text(encoding="utf-8"))

        # 1. 예시 사이트
        errors, warnings = validate(data)
        ok(not errors, f"예시 사이트 validate 오류 0건 (경고 {len(warnings)}건)")
        work = tmp / "example"
        shutil.copytree(example, work)
        build(work, tmp / "dist-example", quiet=True)
        public = (tmp / "dist-example" / "conference.json").read_text(encoding="utf-8")
        html = (tmp / "dist-example" / "index.html").read_text(encoding="utf-8")
        ok(not EMAIL_RE.search(public) and not EMAIL_RE.search(html), "공개본(index.html, conference.json)에 평문 이메일 0건")
        ok('"_todo"' not in public and '"_todo"' not in html, "공개본에서 _todo 제거됨")
        ok('"email_enc":"v1:' in html.replace(" ", ""), "email_enc 로 난독화됨")
        ok((tmp / "dist-example" / "assets" / "poster.pdf").exists(), "assets/ 가 배포 폴더로 복사됨")

        # 2. 테마
        presets = load_presets()
        ok(len(presets) >= 2 and "default" in presets, f"테마 프리셋 로드: {', '.join(sorted(presets))}")
        for pid in presets:
            d = dict(data)
            d["theme"] = pid
            w = tmp / f"theme-{pid}"
            shutil.copytree(example, w)
            (w / "conference.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
            build(w, None, quiet=True)
            out = (w / "index.html").read_text(encoding="utf-8")
            v = presets[pid]["vars"]
            ok(all(f"{k}:{val}" in out for k, val in v.items()), f"테마 '{pid}' 빌드 — CSS 변수 {len(v)}개 포함")
        bad_vars, e1, _ = resolve_theme({"--primary": "red;}</style><script>"})
        _, e2, _ = resolve_theme("no-such-preset")
        _, e3, _ = resolve_theme({"--x": "url(http://evil)"})
        ok(e1 and e2 and e3 and not bad_vars, "잘못된 테마 값(주입·없는 프리셋·url) 거부")
        ok('"snu-engineering"' in html, "index.html 에 프리셋 표가 들어감(런타임 테마용)")

        # 3. 빈 템플릿
        blank_dir = tmp / "blank"
        build_blank(blank_dir, quiet=True)
        b = (blank_dir / "index.html").read_text(encoding="utf-8")
        ok('"snu-engineering"' in b and "행사 홈페이지" in b and "{{" not in b, "빈 템플릿 생성·자리표시자 없음")
        committed = ROOT / "blank" / "index.html"
        ok(committed.exists() and committed.read_text(encoding="utf-8") == b,
           "저장소의 blank/index.html 이 최신 (다르면 python3 scripts/build.py --blank blank 로 갱신)")

        # 4. 이메일 왕복, 패키징
        for addr in ["gildong@example.org", "한글@example.org", "a.b+c@sub.example.co.kr"]:
            enc = encode_email(addr, "example-2027")
            ok(decode_email(enc, "example-2027") == addr and "@" not in enc, f"이메일 난독화 왕복: {addr}")
        zip_path = tmp / "skill.zip"
        r = subprocess.run([sys.executable, str(ROOT / "scripts" / "package_skill.py"), "--out", str(zip_path)], capture_output=True, text=True)
        import zipfile
        with zipfile.ZipFile(zip_path) as z:
            names = z.namelist()
        ok(r.returncode == 0 and any(n.endswith("/SKILL.md") for n in names) and not any("/dist/" in n for n in names),
           f"스킬 ZIP 생성 ({len(names)}개 파일, dist 제외)")

        # 5. 공개 저장소 점검
        sites = [p.name for p in (ROOT / "sites").iterdir() if p.is_dir()]
        ok(sites == ["example-2027"], f"sites/ 에 예시만 있음: {sites}")
        leak = re.compile(r"AKfycb[A-Za-z0-9_-]{20,}")
        text_files = [p for p in ROOT.rglob("*") if p.suffix in (".md", ".json", ".gs", ".py", ".html", ".js")
                      and "dist" not in p.parts and ".git" not in p.parts and "node_modules" not in p.parts]
        leaked = [str(p.relative_to(ROOT)) for p in text_files if leak.search(p.read_text(encoding="utf-8", errors="ignore"))]
        ok(not leaked, "실제 Apps Script 접수 주소가 저장소에 없음" + (f" — 발견: {leaked}" if leaked else ""))
        plain = []
        for p in text_files:
            if p.name in ("selftest.py",):
                continue
            for m in EMAIL_RE.findall(p.read_text(encoding="utf-8", errors="ignore")):
                if not m.endswith("example.org") and not m.endswith("example.com") and "noreply" not in m:
                    plain.append(f"{p.relative_to(ROOT)}: {m}")
        ok(not plain, "example.org 외의 이메일 주소가 저장소 텍스트에 없음" + (f" — {plain[:5]}" if plain else ""))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("FAILED %d" % fails if fails else "ALL PASSED")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
