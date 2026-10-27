#!/usr/bin/env python3
"""OpenDesign(https://github.com/nexu-io/open-design, Apache-2.0) 연결 파일 만들기.

OpenDesign 은 AI 에이전트로 포스터·슬라이드·이미지를 만드는 별도 작업 공간(앱)이다. 이 스크립트는
OpenDesign 을 설치하지 않아도 돌아가며, OpenDesign 에 가져갈 파일 두 종류를 만든다.

1) 디자인 시스템 패키지 — 우리 테마(themes/*.json)를 OpenDesign 형식(manifest.json + DESIGN.md + tokens.css)으로
       python3 scripts/export_open_design.py --theme snu-science           # 하나
       python3 scripts/export_open_design.py --all-themes                  # 전부
   → dist/open-design/design-systems/conference-<id>/
   OpenDesign 의 Settings → Design Systems → Add design system → Local(Project path) 로 이 폴더를 가져온다.

2) 포스터 브리프 — 행사 정보를 사실 그대로 정리한 작업 지시서(Markdown)
       python3 scripts/export_open_design.py --brief sites/<slug>
   → dist/<slug>/open-design/poster-brief.md
   OpenDesign(또는 다른 AI 디자인 도구) 대화창에 붙여 넣거나 첨부한다.

표준 라이브러리만 쓴다.
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from themes import load_presets, DEFAULTS, STATUS_KO, contrast  # noqa: E402

SANS = '"Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
SERIF = '"Noto Serif KR", "Noto Serif CJK KR", "Nanum Myeongjo", serif'
PAPER = {"A1": (594, 841), "A2": (420, 594), "A3": (297, 420), "A4": (210, 297)}


def full_vars(preset_vars):
    v = dict(DEFAULTS)
    v.update({"--font-head": SERIF, "--font-body": SANS, "--accent-soft": "#f6ecd8", "--accent-hover": "#c99a4e",
              "--muted": "#6b7280", "--ink-soft": "#4b5563", "--line": "#e5e1d8", "--soft": "#f2eee6"})
    v.update(preset_vars)
    return v


def tokens_css(pid, name, v):
    """OpenDesign token contract(packages/contracts/src/design-systems/token-schema.ts)의 이름으로 옮긴다."""
    t = {
        "--bg": v["--bg"], "--surface": v["--surface"], "--surface-warm": v["--soft"],
        "--fg": v["--ink"], "--fg-2": v["--ink-soft"], "--muted": v["--muted"], "--meta": v["--primary"],
        "--border": v["--line"], "--border-soft": v["--soft"],
        "--accent": v["--primary"], "--accent-on": "#ffffff", "--accent-hover": v["--primary-deep"], "--accent-active": v["--primary-deep"],
        "--success": "#2f6f4e", "--warn": "#b26b00", "--danger": "#b3261e",
        "--font-display": v["--font-head"], "--font-body": v["--font-body"],
        "--font-mono": 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
        "--text-xs": "12px", "--text-sm": "14px", "--text-base": "16px", "--text-lg": "18px", "--text-xl": "24px",
        "--text-2xl": "32px", "--text-3xl": "44px", "--text-4xl": "64px",
        "--leading-body": "1.65", "--leading-tight": "1.15", "--tracking-display": "-0.015em",
        "--space-1": "4px", "--space-2": "8px", "--space-3": "12px", "--space-4": "16px", "--space-5": "20px",
        "--space-6": "24px", "--space-8": "32px", "--space-12": "48px",
        "--section-y-desktop": "64px", "--section-y-tablet": "48px", "--section-y-phone": "36px",
        "--radius-sm": v.get("--radius-sm", "8px"), "--radius-md": v.get("--radius", "14px"), "--radius-lg": "20px", "--radius-pill": "999px",
        "--elev-flat": "none", "--elev-ring": f"0 0 0 1px {v['--line']}",
        "--elev-raised": "0 1px 2px rgba(20, 30, 50, .06), 0 8px 24px rgba(20, 30, 50, .06)",
        "--focus-ring": f"0 0 0 3px {v['--primary']}",
        "--motion-fast": "120ms", "--motion-base": "200ms", "--ease-standard": "cubic-bezier(.2, 0, 0, 1)",
        "--container-max": "1080px", "--container-gutter-desktop": "20px", "--container-gutter-tablet": "20px", "--container-gutter-phone": "16px",
        # conference-site 확장 토큰(포스터·대표 영역용)
        "--cs-hero-start": v["--primary-deep"], "--cs-hero-mid": v["--primary"], "--cs-hero-end": v["--hero-end"],
        "--cs-highlight": v["--accent"], "--cs-highlight-on": v["--accent-ink"], "--cs-highlight-soft": v["--accent-soft"],
    }
    body = "\n".join(f"  {k}: {val};" for k, val in t.items())
    return f"/* {pid} — {name} (conference-site 테마에서 내보냄, {date.today().isoformat()}) */\n:root {{\n{body}\n}}\n"


def design_md(pid, p, v):
    name_ko, name_en = p["name"].get("ko", pid), p["name"].get("en", pid)
    c_hero = contrast("#ffffff", v["--primary-deep"])
    c_btn = contrast(v["--accent-ink"], v["--accent"])
    return f"""# {name_en} — conference-site theme

> Category: Education & Academic Events
> Academic conference / workshop / seminar materials for {name_en} ({name_ko}). Exported from the conference-site theme preset `{pid}`.

## Provenance
- Source: {p.get('source') or 'conference-site generic preset'}
- Status: `{p['status']}` ({STATUS_KO.get(p['status'], p['status'])}). `extracted` means the colours were read from the institution's public website and are **not** an official brand specification. `official` means the key colours come from a published UI guide.
- No logo, emblem, signature or typeface file is bundled. Institutional signatures must be used only as supplied by the institution and in their prescribed colours (for Seoul National University: SNU Blue, SNU Gray, black or white).

## Visual Theme & Atmosphere
Calm, credible academic event material: a deep, saturated field ({v['--primary-deep']} → {v['--primary']} → {v['--hero-end']}) carrying large, confident headline type, with one warm highlight colour ({v['--accent']}) reserved for dates, labels and the key call-to-action. Information density is high (programmes, speaker lists), so structure and legibility come before decoration.

## Color
- **Hero / poster field:** `{v['--primary-deep']}` (start), `{v['--primary']}` (middle), `{v['--hero-end']}` (end) — white text on this field ({c_hero:.1f}:1 on the darkest stop).
- **Highlight:** `{v['--accent']}` with `{v['--accent-ink']}` text when used as a background ({c_btn:.1f}:1). Use for dates, section labels and one primary button. Never for long body text.
- **Page:** background `{v['--bg']}`, surface `{v['--surface']}`, text `{v['--ink']}`, secondary text `{v['--ink-soft']}`, borders `{v['--line']}`.
- Keep to these colours; do not add off-palette hues.

## Typography
- **Display:** {v['--font-head']}
- **Body:** {v['--font-body']}
- Korean text uses `word-break: keep-all` (break at spaces, never inside a word). Headlines tight leading (1.1–1.2) and slight negative tracking; body 1.45–1.65.
- Names: Korean name followed by the person's own English spelling. Never romanise names automatically.

## Layout & Composition
- Print posters use ISO A sizes (A1 594×841, A2 420×594, A3 297×420, A4 210×297 mm), portrait, no margins/bleed unless the printer asks.
- Order of information: series/host line → title (2–3 lines) → date & venue band → programme or speakers → host/sponsor strip, website and QR code at the bottom.
- Generous outer margin (~6.5% of the width). One accent rule under the title block.

## Components
- **Date/venue band:** label column (small caps, highlight colour) + value column (bold, large).
- **Programme table:** time column in highlight colour with tabular figures; day headers as tinted bars with a highlight left edge; breaks/meals dimmed.
- **Speaker list:** keynote speakers enlarged in a row; invited speakers flowing in 2–3 columns (name, English name, affiliation).
- **QR code:** black on a white tile, at least 25 mm on A2.

## Accessibility
- Normal text ≥ 4.5:1, large text ≥ 3:1 against its actual background; all pairs above were checked by conference-site's selftest.
- Do not convey information by colour alone (tentative items also carry a "예정 / tentative" label).

## Content Rules (important)
- Every fact (title, date, time, venue, room, names, affiliations, talk titles) must come verbatim from the event's `conference.json` / brief. Do not invent speakers, fees, deadlines or slogans.
- Do not generate photographs or likenesses of real people. Background imagery may be abstract or a photo supplied by the organiser.
- Do not add institutional logos that were not supplied.

## Anti-patterns
- Rainbow gradients, neon glows, stock "AI brain" imagery.
- Body copy in the highlight colour; more than two type families.
- Text over busy photo areas without a darkening scrim.
"""


def export_theme(pid, p, out_root):
    v = full_vars(p["vars"])
    d = out_root / "design-systems" / f"conference-{pid}"
    d.mkdir(parents=True, exist_ok=True)
    name_en = p["name"].get("en", pid)
    manifest = {
        "schemaVersion": "od-design-system-project/v1",
        "id": f"conference-{pid}",
        "name": f"{name_en} (conference-site)",
        "category": "Education & Academic Events",
        "description": f"Academic event theme exported from conference-site preset '{pid}' ({STATUS_KO.get(p['status'], p['status'])}). No logos bundled.",
        "source": {"type": "github", "url": "https://github.com/songh2/conference-site", "branch": "main"},
        "files": {"design": "DESIGN.md", "tokens": "tokens.css"},
    }
    (d / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (d / "DESIGN.md").write_text(design_md(pid, p, v), encoding="utf-8")
    (d / "tokens.css").write_text(tokens_css(pid, name_en, v), encoding="utf-8")
    return d


def tx(obj, lang="ko"):
    if not obj:
        return ""
    if isinstance(obj, str):
        return obj
    return (obj.get(lang) or "").strip()


def both(obj):
    ko, en = tx(obj, "ko"), tx(obj, "en")
    if ko and en and ko != en:
        return f"{ko} / {en}"
    return ko or en


def brief(site_dir, out_dir=None):
    data = json.loads((site_dir / "conference.json").read_text(encoding="utf-8"))
    poster = data.get("poster") or {}
    size = (poster.get("size") or "A2").upper()
    w, h = PAPER.get(size, PAPER["A2"])
    theme = data.get("theme") if isinstance(data.get("theme"), str) else (data.get("theme") or {}).get("preset", "default")
    speakers = {s.get("id"): s for s in data.get("speakers") or []}
    L = []
    L.append(f"# 포스터 제작 브리프 — {tx(data.get('title')).replace(chr(10), ' ')}")
    L.append("")
    L.append(f"> conference-site 의 `conference.json` 에서 {date.today().isoformat()} 에 자동으로 만든 문서입니다. 아래 **사실 정보**는 그대로 써야 하며, 바꾸거나 보태지 마세요.")
    L.append("")
    L.append("## 1. 만들 것")
    L.append(f"- 인쇄용 세로 포스터 1장, **{size} ({w}×{h} mm)**, 여백 없음. 최종 결과는 PDF(글자는 벡터 텍스트)와 미리보기 PNG.")
    L.append(f"- 디자인 시스템: `conference-{theme}` (conference-site 테마 `{theme}`). 이 패키지가 없으면 아래 색을 쓰세요.")
    L.append(f"- 언어: {'한국어 중심 + 영어 병기' if (poster.get('lang') or 'both') == 'both' else ('한국어' if poster.get('lang') == 'ko' else 'English')}.")
    L.append("- 출발점: 함께 첨부한 `poster-*.html`(conference-site 가 만든 기본 포스터)을 참고해 배치를 다듬어도 됩니다.")
    L.append("")
    L.append("## 2. 사실 정보 (그대로 사용)")
    L.append(f"- 행사명: {both(data.get('title')).replace(chr(10), ' ')}")
    if tx(data.get("subtitle")):
        L.append(f"- 부제: {both(data.get('subtitle'))}")
    if both(data.get("kicker")):
        L.append(f"- 상단 문구: {both(data.get('kicker'))}")
    d = data.get("dates") or {}
    L.append(f"- 일시: {both(d.get('display')) or (d.get('start', '') + (' – ' + d['end'] if d.get('end') and d.get('end') != d.get('start') else ''))}")
    v = data.get("venue") or {}
    v_ko = " ".join(x for x in [tx(v.get("name"), "ko"), tx(v.get("room"), "ko")] if x)
    v_en = ", ".join(x for x in [tx(v.get("name"), "en"), tx(v.get("room"), "en")] if x)
    L.append(f"- 장소: {v_ko}" + (f" ({v_en})" if v_en and v_en != v_ko else ""))
    if tx(v.get("address")):
        L.append(f"- 주소: {both(v.get('address'))}")
    if both(data.get("host")):
        L.append(f"- 주최: {both(data.get('host'))}")
    for c in poster.get("credits") or []:
        L.append(f"- {both(c.get('label'))}: {both(c.get('text'))}")
    sp = [both(s.get("name")) for s in data.get("sponsors") or [] if s.get("name")]
    if sp:
        L.append(f"- 후원: {', '.join(sp)} (로고는 제공된 파일만 사용)")
    reg = data.get("registration") or {}
    if both(reg.get("deadline_display")) or reg.get("deadline"):
        L.append(f"- 사전등록 마감: {both(reg.get('deadline_display')) or reg.get('deadline')}")
    if both(reg.get("fee")):
        L.append(f"- 등록비: {both(reg.get('fee'))}")
    if both(poster.get("note")):
        L.append(f"- 안내 문구: {both(poster.get('note'))}")
    url = poster.get("url") or data.get("site_url")
    if url:
        L.append(f"- 홈페이지(QR 코드 대상): {url}")
    L.append("")
    prog = data.get("program") or []
    if prog:
        L.append("## 3. 프로그램")
        for day in prog:
            L.append(f"### {both(day.get('label')) or day.get('date', '')}{' (예정 / tentative)' if day.get('tentative') else ''}")
            L.append("| 시간 | 내용 | 발표자·비고 |")
            L.append("|---|---|---|")
            for it in day.get("items") or []:
                s = speakers.get(it.get("speaker_id")) if it.get("speaker_id") else None
                title = (both(s.get("title")) if s else "") or both(it.get("title"))
                who = (both(s.get("name")) + (f" ({both(s.get('affiliation'))})" if s and both(s.get("affiliation")) else "")) if s else both(it.get("speaker"))
                extra = " · ".join(x for x in [who, both(it.get("note")), "예정" if it.get("tentative") else ""] if x)
                L.append(f"| {it.get('time', '')} | {title.replace('|', '/')} | {extra.replace('|', '/')} |")
            L.append("")
    spk = [s for s in data.get("speakers") or [] if s.get("name")]
    if spk:
        L.append("## 4. 연사")
        for s in spk:
            g = both(s.get("group"))
            L.append(f"- {both(s.get('name'))} — {both(s.get('affiliation'))}" + (f" · [{g}]" if g else "") + (f" · 강연: {both(s.get('title'))}" if both(s.get('title')) else ""))
        L.append("")
    L.append("## 5. 반드시 지킬 것")
    L.append("- 위 사실 정보 외의 내용(연사, 등록비, 마감일, 구호, 영문 표기)을 만들지 않는다. 비어 있는 항목은 비워 둔다.")
    L.append("- 사람 이름의 영문 표기는 위에 적힌 것만 쓴다. 없으면 한글만.")
    L.append("- 실제 인물의 얼굴·사진을 AI 로 생성하지 않는다. 사진은 주최 측이 준 파일만 쓴다.")
    L.append("- 기관 로고·엠블럼은 주최 측이 준 파일만, 규정된 색 그대로 쓴다. 서울대학교 시그니처는 SNU Blue·SNU Gray·검정·흰색만 허용된다.")
    L.append("- 글자 대비: 일반 글자 4.5:1 이상. 사진 위 글자에는 어둡게 깔리는 막을 둔다.")
    L.append("- QR 코드는 흰 바탕에 검정, A2 기준 한 변 25 mm 이상.")
    L.append("- 완성 후 위 사실 정보와 한 줄씩 대조해 오탈자를 확인한다.")
    L.append("")
    out = Path(out_dir) if out_dir else ROOT / "dist" / data.get("slug", site_dir.name) / "open-design"
    out.mkdir(parents=True, exist_ok=True)
    path = out / "poster-brief.md"
    path.write_text("\n".join(L) + "\n", encoding="utf-8")
    return path, theme


def main():
    ap = argparse.ArgumentParser(description="OpenDesign 연결 파일 만들기")
    ap.add_argument("--theme", help="내보낼 테마 id (예: snu-science)")
    ap.add_argument("--all-themes", action="store_true")
    ap.add_argument("--brief", metavar="SITE_DIR", help="포스터 브리프를 만들 사이트 폴더 (예: sites/example-2027)")
    ap.add_argument("--out", default=str(ROOT / "dist" / "open-design"))
    args = ap.parse_args()
    presets = load_presets()
    out_root = Path(args.out)
    ids = []
    if args.all_themes:
        ids = list(presets)
    elif args.theme:
        if args.theme not in presets:
            raise SystemExit(f"테마 '{args.theme}' 이(가) 없습니다. 사용 가능: {', '.join(presets)}")
        ids = [args.theme]
    if args.brief:
        path, theme = brief(Path(args.brief))
        print(f"OK    {path}")
        if not ids and theme in presets:
            ids = [theme]
    if not ids and not args.brief:
        ap.error("--theme, --all-themes, --brief 중 하나가 필요합니다")
    for pid in ids:
        d = export_theme(pid, presets[pid], out_root)
        print(f"OK    {d}  (manifest.json, DESIGN.md, tokens.css)")


if __name__ == "__main__":
    main()
