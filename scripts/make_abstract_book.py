#!/usr/bin/env python3
"""초록집(Book of abstracts) 만들기 — conference.json 의 연사 제목·초록으로 A4 PDF 한 권을 만든다.

사용법:
    python3 scripts/make_abstract_book.py sites/<slug>               # 한국어/영어 중 사이트 기본 언어
    python3 scripts/make_abstract_book.py sites/<slug> --lang en     # 영어판
    python3 scripts/make_abstract_book.py sites/<slug> --out dist/x  # 저장 위치 지정

결과: dist/<slug>/abstract-book/ 에
    abstract-book.html   브라우저에서 열어 확인 → 인쇄 → "PDF로 저장" (수식은 인터넷이 연결되어 있어야 바뀜)
    abstract-book.pdf    (Playwright 가 설치되어 있으면 자동 생성, 쪽 번호 포함)

차례: 표지 → 전체 시간표(연사 이름은 초록 쪽으로 연결) → 연사별 제목·소속·초록(프로그램 순서).
홈페이지에 올리려면 PDF 를 sites/<slug>/assets/abstract-book.pdf 로 복사하고 conference.json 에
"abstract_book": {"file": "assets/abstract-book.pdf"} 를 적습니다 (프로그램 탭에 "초록집" 카드가 생깁니다).

원칙: 글은 전부 conference.json 에서 가져옵니다. 없는 제목·초록을 지어내지 않고 "추후 공지" 로 둡니다.
수식($…$, $$…$$)은 홈페이지와 같은 KaTeX 로 바꿉니다. 표준 라이브러리만 쓰고, PDF 에만 Playwright 가 필요합니다.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/"
UI = {
    "ko": {"schedule": "시간표", "abstracts": "초록", "tba_title": "강연 제목 추후 공지", "tba_abs": "초록은 추후 공지됩니다.",
           "venue": "장소", "date": "일시", "org": "조직위원회", "book": "초록집", "tentative": "예정"},
    "en": {"schedule": "Schedule", "abstracts": "Abstracts", "tba_title": "Title to be announced", "tba_abs": "The abstract will be announced.",
           "venue": "Venue", "date": "Date", "org": "Organizers", "book": "Book of abstracts", "tentative": "Tentative"},
}


def esc(x):
    return html.escape(str(x or ""), quote=True)


def make_tx(lang):
    other = "en" if lang == "ko" else "ko"

    def tx(o):
        if o is None:
            return ""
        if isinstance(o, str):
            return o
        return (o.get(lang) or o.get(other) or "").strip()
    return tx


def paragraphs(text):
    parts = [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]
    return "".join(f"<p>{esc(p).replace(chr(10), '<br>')}</p>" for p in parts)


def build(data, lang):
    tx, ui = make_tx(lang), UI[lang]
    speakers = {s["id"]: s for s in data.get("speakers") or [] if s.get("id")}
    order, seen = [], set()
    for day in data.get("program") or []:
        for it in day.get("items") or []:
            sid = it.get("speaker_id")
            if sid in speakers and sid not in seen:
                order.append(sid)
                seen.add(sid)
    for sid in speakers:
        if sid not in seen:
            order.append(sid)

    # 표지
    d = data.get("dates") or {}
    v = data.get("venue") or {}
    cover = ['<section class="cover">']
    if tx(data.get("kicker")):
        cover.append(f'<p class="kicker">{esc(tx(data.get("kicker")))}</p>')
    cover.append(f'<h1>{esc(tx(data.get("title")))}</h1>')
    cover.append(f'<p class="book">{esc(ui["book"])}</p>')
    meta = []
    if tx(d.get("display")) or d.get("start"):
        meta.append(f'<dt>{esc(ui["date"])}</dt><dd>{esc(tx(d.get("display")) or d.get("start"))}</dd>')
    place = " ".join(x for x in [tx(v.get("name")), tx(v.get("room"))] if x)
    if place:
        meta.append(f'<dt>{esc(ui["venue"])}</dt><dd>{esc(place)}</dd>')
    cover.append(f'<dl class="meta">{"".join(meta)}</dl>')
    for c in data.get("committees") or []:
        names = ", ".join(tx(m.get("name")) for m in c.get("members") or [] if tx(m.get("name")))
        if names:
            cover.append(f'<p class="org"><b>{esc(tx(c.get("name")))}</b><br>{esc(names)}</p>')
    cover.append("</section>")

    # 시간표
    sched = [f'<section class="schedule"><h2>{esc(ui["schedule"])}</h2>']
    for day in data.get("program") or []:
        label = tx(day.get("label")) or day.get("date") or ""
        sched.append(f'<h3>{esc(label)}</h3><table>')
        for it in day.get("items") or []:
            spk = speakers.get(it.get("speaker_id"))
            title = tx(it.get("title"))
            who = ""
            if spk:
                title = tx(spk.get("title")) or title
                aff = tx(spk.get("affiliation"))
                who = f'<a href="#{esc(spk["id"])}">{esc(tx(spk.get("name")))}</a>' + (f' <span class="aff">{"· " + esc(aff) if "(" in aff else "(" + esc(aff) + ")"}</span>' if aff else "")
            elif tx(it.get("speaker")):
                who = esc(tx(it.get("speaker")))
            sched.append(f'<tr><td class="t">{esc(it.get("time"))}</td><td>{esc(title)}' + (f'<div class="who">{who}</div>' if who else "") + "</td></tr>")
        sched.append("</table>")
    sched.append("</section>")

    # 초록
    abstracts = [f'<section class="abstracts"><h2>{esc(ui["abstracts"])}</h2>']
    missing = 0
    for sid in order:
        s = speakers[sid]
        title, abstract = tx(s.get("title")), tx(s.get("abstract"))
        if not abstract:
            missing += 1
        aff = tx(s.get("affiliation"))
        abstracts.append(f'<article id="{esc(sid)}"><h3>{esc(title) if title else f"<span class=tba>{esc(ui["tba_title"])}</span>"}</h3>'
                         f'<p class="by"><b>{esc(tx(s.get("name")))}</b>' + (f' — {esc(aff)}' if aff else "") + "</p>"
                         + (paragraphs(abstract) if abstract else f'<p class="tba">{esc(ui["tba_abs"])}</p>') + "</article>")
    abstracts.append("</section>")

    css = """
@page { size: A4; margin: 22mm 20mm 22mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #1b2230; font: 10.5pt/1.65 "Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",Georgia,serif; word-break: keep-all; }
h1,h2,h3,.kicker,.book,.t,.by { font-family: "Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif; }
.cover { min-height: 235mm; display: flex; flex-direction: column; justify-content: center; border-left: 3mm solid #173a5e; padding-left: 10mm; page-break-after: always; }
.kicker { color: #6b7280; letter-spacing: .12em; text-transform: uppercase; font-size: 10pt; margin: 0 0 6mm; }
.cover h1 { font-size: 30pt; line-height: 1.25; margin: 0 0 4mm; color: #0f2a46; }
.book { font-size: 16pt; margin: 0 0 14mm; color: #173a5e; }
.meta { display: grid; grid-template-columns: 22mm 1fr; gap: 2mm 4mm; margin: 0 0 12mm; font-family: "Noto Sans KR","Noto Sans CJK KR",sans-serif; }
.meta dt { color: #6b7280; } .meta dd { margin: 0; font-weight: 700; }
.org { font-size: 10pt; margin: 0 0 4mm; } .org b { font-family: "Noto Sans KR",sans-serif; }
h2 { font-size: 18pt; color: #0f2a46; border-bottom: .5mm solid #173a5e; padding-bottom: 2mm; margin: 0 0 6mm; }
.schedule { page-break-after: always; }
.schedule h3 { font-size: 11.5pt; margin: 6mm 0 2mm; color: #173a5e; }
table { border-collapse: collapse; width: 100%; font-size: 10pt; }
td { padding: 1.6mm 2mm; border-bottom: .2mm solid #d7d2c7; vertical-align: top; }
td.t { white-space: nowrap; width: 30mm; font-variant-numeric: tabular-nums; color: #173a5e; font-weight: 700; }
.who { color: #4b5563; font-size: 9.5pt; } .who a { color: inherit; text-decoration: none; font-weight: 700; } .aff { color: #6b7280; }
article { break-inside: avoid; margin: 0 0 9mm; }
article h3 { font-size: 12.5pt; line-height: 1.4; margin: 0 0 1.5mm; color: #0f2a46; }
.by { margin: 0 0 3mm; color: #4b5563; font-size: 10pt; }
article p { margin: 0 0 2.4mm; text-align: justify; }
.tba { color: #6b7280; font-style: italic; }
@media screen { body { max-width: 190mm; margin: 0 auto; padding: 10mm; background: #fff; } }
"""
    doc = f"""<!DOCTYPE html>
<html lang="{lang}"><head><meta charset="utf-8"><title>{esc(tx(data.get("title")))} — {esc(ui["book"])}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{KATEX}katex.min.css">
<style>{css}</style></head><body>
{"".join(cover)}
{"".join(sched)}
{"".join(abstracts)}
<script src="{KATEX}katex.min.js"></script>
<script src="{KATEX}contrib/auto-render.min.js"></script>
<script>
window.addEventListener('load', function () {{
  try {{ renderMathInElement(document.body, {{ delimiters: [{{left:'$$',right:'$$',display:true}},{{left:'$',right:'$',display:false}},{{left:'\\\\(',right:'\\\\)',display:false}},{{left:'\\\\[',right:'\\\\]',display:true}}], throwOnError: false }}); document.body.setAttribute('data-math', 'done'); }}
  catch (e) {{ document.body.setAttribute('data-math', 'failed'); }}
}});
</script></body></html>"""
    return doc, {"talks": len(order), "missing_abstracts": missing, "has_math": bool(re.search(r"\$", json.dumps(data.get("speakers") or [])))}


def export_pdf(html_path, pdf_path, wait_math):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return False, "Playwright 가 없어 PDF 는 만들지 못했습니다. HTML 을 브라우저로 열어 인쇄 → PDF로 저장 하세요."
    note = ""
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto(html_path.resolve().as_uri(), wait_until="load")
        pg.wait_for_timeout(1500)
        if wait_math and pg.evaluate("document.body.getAttribute('data-math')") != "done":
            note = "수식 변환(KaTeX)을 불러오지 못해 $…$ 가 글자 그대로 남았을 수 있습니다. 인터넷이 되는 환경에서 다시 만드세요."
        pg.pdf(path=str(pdf_path), format="A4", print_background=True, display_header_footer=True, margin={"top": "22mm", "bottom": "22mm", "left": "20mm", "right": "20mm"},
               header_template="<span></span>",
               footer_template='<div style="font:8pt sans-serif;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>')
        b.close()
    return True, note


def main():
    ap = argparse.ArgumentParser(description="초록집 PDF 만들기")
    ap.add_argument("site_dir")
    ap.add_argument("--lang", choices=["ko", "en"])
    ap.add_argument("--out")
    args = ap.parse_args()
    site = Path(args.site_dir)
    data = json.loads((site / "conference.json").read_text(encoding="utf-8"))
    lang = args.lang or ("en" if data.get("lang_default") == "en" else "ko")
    doc, info = build(data, lang)
    out = Path(args.out) if args.out else ROOT / "dist" / (data.get("slug") or site.name) / "abstract-book"
    out.mkdir(parents=True, exist_ok=True)
    html_path = out / "abstract-book.html"
    html_path.write_text(doc, encoding="utf-8")
    print(f"OK    {html_path}")
    if info["missing_abstracts"]:
        print(f"WARN  초록이 없는 연사 {info['missing_abstracts']}명 — '추후 공지' 로 표시됩니다 (총 {info['talks']}명)")
    ok, note = export_pdf(html_path, out / "abstract-book.pdf", info["has_math"])
    print(("OK    " + str(out / "abstract-book.pdf")) if ok else "WARN  " + note)
    if ok and note:
        print("WARN  " + note)


if __name__ == "__main__":
    main()
