#!/usr/bin/env python3
"""학회 홈페이지 빌드 스크립트.

사용법:
    python3 scripts/build.py sites/<slug>                 # sites/<slug>/index.html 생성
    python3 scripts/build.py sites/<slug> --deploy dist/<slug>
        # 배포용 폴더(index.html, conference.json, assets/, .nojekyll, README.md)까지 생성
    python3 scripts/build.py --blank blank        # 빈 템플릿(blank/index.html) 생성 — 파이썬 없이 쓰는 경로용

동작:
  1. conference.json 을 읽고 validate.py 로 검사합니다 (오류가 있으면 중단).
  2. template/index.template.html 에 style.css, app.js, JSON 데이터를 끼워 넣어
     외부 파일 없이도 열리는 단일 index.html 을 만듭니다.
  3. --deploy 를 주면 GitHub Pages 등에 그대로 올릴 수 있는 폴더를 만듭니다.
표준 라이브러리만 사용합니다.
"""
import argparse
import copy
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = ROOT / "template"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate import validate  # noqa: E402
from emailcodec import encode_email  # noqa: E402
from themes import resolve_theme, css_block, presets_for_js, load_presets  # noqa: E402

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")


def protect_emails(data):
    """평문 email 을 email_enc 로 바꾼 사본을 돌려준다 (원본 sites/<slug>/conference.json 은 그대로).

    공개되는 index.html 과 배포용 conference.json 에는 주소가 글자로 남지 않고,
    방문자가 확인 코드를 입력했을 때 app.js 가 되돌린다 (email_protection: "none" 이면 평문 유지)."""
    out = copy.deepcopy(data)
    for k in [k for k in out if k.startswith("_")]:   # _todo 같은 내부 메모는 공개본에서 제외
        del out[k]
    if (out.get("email_protection") or "captcha") == "none":
        return out, 0
    slug = out.get("slug", "site")
    count = 0

    def conv(obj):
        nonlocal count
        if isinstance(obj, dict) and obj.get("email"):
            obj["email_enc"] = encode_email(obj["email"], slug)
            del obj["email"]
            count += 1

    for group in out.get("committees") or []:
        for m in group.get("members") or []:
            conv(m)
    for s_ in out.get("speakers") or []:
        conv(s_)
    for c in out.get("contact") or []:
        conv(c)
    return out, count


def tx(obj, lang):
    """{ko, en} 객체에서 lang 텍스트를 꺼내고, 없으면 다른 언어로 대체."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    v = obj.get(lang) or obj.get("ko") or obj.get("en") or ""
    return v


def date_range(data, lang):
    d = data.get("dates") or {}
    disp = tx(d.get("display"), lang)
    if disp:
        return disp
    if d.get("start") and d.get("end") and d["start"] != d["end"]:
        return f"{d['start']} – {d['end']}"
    return d.get("start", "")


def inject_presets(js, presets):
    """app.js 의 `var THEMES = /*__THEMES__*/{};` 자리에 프리셋 표를 넣는다."""
    table = json.dumps(presets_for_js(presets), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    marker = "/*__THEMES__*/{}"
    if marker not in js:
        raise SystemExit("template/app.js 에 /*__THEMES__*/ 표시가 없습니다")
    return js.replace(marker, table, 1)


def build_blank(out_dir, quiet=False):
    """내용이 비어 있는 '빈 템플릿' index.html 을 만든다.

    파이썬을 쓸 수 없는 환경(예: ChatGPT 대화창만 있는 경우)에서는 이 파일과 conference.json 두 개만
    GitHub 에 올리면 홈페이지가 된다. 페이지가 열릴 때 같은 폴더의 conference.json 을 읽어 그리기 때문이다.
    (컴퓨터에서 파일을 더블클릭해 열면 브라우저 보안 정책 때문에 conference.json 을 읽지 못해 비어 보인다 —
    GitHub Pages 처럼 웹 서버에 올렸을 때만 동작한다.)"""
    template = (TEMPLATE_DIR / "index.template.html").read_text(encoding="utf-8")
    css = (TEMPLATE_DIR / "style.css").read_text(encoding="utf-8")
    js = inject_presets((TEMPLATE_DIR / "app.js").read_text(encoding="utf-8"), load_presets())
    skeleton = json.loads((TEMPLATE_DIR / "conference.skeleton.json").read_text(encoding="utf-8"))
    skeleton["slug"] = "site"
    skeleton["title"] = {"ko": "행사 홈페이지", "en": "Event website"}
    skeleton = {k: v for k, v in skeleton.items() if not k.startswith("_")}
    data_json = json.dumps(skeleton, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    out = (template
           .replace("{{LANG}}", "ko")
           .replace("{{TITLE}}", "행사 홈페이지 / Event website")
           .replace("{{DESCRIPTION}}", "")
           .replace("{{NOSCRIPT_INFO}}", "")
           .replace("{{CSS}}", css)
           .replace("{{JS}}", js)
           .replace("{{DATA_JSON}}", data_json))
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "index.html"
    path.write_text(out, encoding="utf-8")
    (out_dir / ".nojekyll").write_text("", encoding="utf-8")
    if not quiet:
        print(f"OK    빈 템플릿: {path} — conference.json 과 함께 올리면 동작합니다")
    return path


def build(site_dir, deploy_dir=None, quiet=False):
    cfg_path = site_dir / "conference.json"
    data = json.loads(cfg_path.read_text(encoding="utf-8"))

    errors, warnings = validate(data)
    if not quiet:
        for w in warnings:
            print(f"WARN  {w}")
    if errors:
        for e in errors:
            print(f"ERROR {e}")
        raise SystemExit(f"conference.json 에 오류 {len(errors)}건이 있어 빌드를 중단합니다.")

    lang = data.get("lang_default", "ko")
    template = (TEMPLATE_DIR / "index.template.html").read_text(encoding="utf-8")
    css = (TEMPLATE_DIR / "style.css").read_text(encoding="utf-8")
    js = (TEMPLATE_DIR / "app.js").read_text(encoding="utf-8")

    # 사이트별 테마 (선택): "theme": "snu-engineering" | {"--primary": "#..."} | {"preset": ..., "--x": ...}
    # validate() 가 이미 검사했으므로 여기서는 값만 합친다. app.js 에도 프리셋 표를 넣어
    # 배포 후 conference.json 의 theme 을 바꿔도 다시 빌드 없이 반영되게 한다.
    presets = load_presets()
    theme_vars, _e, _w = resolve_theme(data.get("theme"), presets)
    css += css_block(theme_vars)
    js = inject_presets(js, presets)

    title = tx(data.get("title"), lang)
    venue = data.get("venue") or {}
    venue_txt = " · ".join(x for x in [tx(venue.get("name"), lang), tx(venue.get("room"), lang)] if x)
    desc = " | ".join(x for x in [title, date_range(data, lang), venue_txt] if x)

    # 이메일 보호: 공개본에는 난독화된 email_enc 만 남긴다
    public, n_protected = protect_emails(data)

    # JSON 을 <script> 안에 넣을 때 '</' 가 태그 종료로 해석되지 않도록 이스케이프
    data_json = json.dumps(public, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    out = (template
           .replace("{{LANG}}", lang)
           .replace("{{TITLE}}", html.escape(title))
           .replace("{{DESCRIPTION}}", html.escape(desc))
           .replace("{{NOSCRIPT_INFO}}", html.escape(" · ".join(x for x in [date_range(data, lang), venue_txt] if x)))
           .replace("{{CSS}}", css)
           .replace("{{JS}}", js)
           .replace("{{DATA_JSON}}", data_json))

    index_path = site_dir / "index.html"
    index_path.write_text(out, encoding="utf-8")
    if not quiet:
        print(f"OK    {index_path} ({len(out.encode('utf-8'))/1024:.1f} KB) — 보호된 이메일 {n_protected}건")

    # 공개본에 주소가 글자로 남아 있으면 알린다 (안내문 등에 적힌 경우). 이름·소속 등 다른 항목은 검사하지 않는다.
    leaked = sorted(set(EMAIL_RE.findall(data_json)))
    if leaked and not quiet:
        print("WARN  공개본에 이메일 주소가 글자로 포함되어 있습니다 (자동 수집 대상이 됩니다): " + ", ".join(leaked))

    if deploy_dir:
        deploy_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(index_path, deploy_dir / "index.html")
        (deploy_dir / "conference.json").write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        assets = site_dir / "assets"
        if assets.is_dir():
            shutil.copytree(assets, deploy_dir / "assets", dirs_exist_ok=True)
        (deploy_dir / ".nojekyll").write_text("", encoding="utf-8")
        readme = site_dir / "README.md"
        if readme.exists():
            shutil.copy2(readme, deploy_dir / "README.md")
        if not quiet:
            print(f"OK    배포 폴더: {deploy_dir}  (이 폴더의 내용을 공개 저장소에 그대로 올리면 됩니다)")
    return index_path


def main():
    ap = argparse.ArgumentParser(description="conference.json → index.html")
    ap.add_argument("site_dir", nargs="?", help="conference.json 이 있는 폴더 (예: sites/example-2027)")
    ap.add_argument("--deploy", help="배포용 폴더 경로 (예: dist/example-2027)")
    ap.add_argument("--blank", help="내용 없는 빈 템플릿 index.html 을 이 폴더에 만든다 (예: blank)")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()
    if args.blank:
        build_blank(args.blank, quiet=args.quiet)
        if not args.site_dir:
            return
    if not args.site_dir:
        ap.error("site_dir 또는 --blank 가 필요합니다")
    site_dir = Path(args.site_dir)
    if not (site_dir / "conference.json").exists():
        raise SystemExit(f"conference.json 이 없습니다: {site_dir}")
    build(site_dir, Path(args.deploy) if args.deploy else None, quiet=args.quiet)


if __name__ == "__main__":
    main()
