#!/usr/bin/env python3
"""행사 포스터(인쇄용) 만들기 — conference.json 의 내용만으로 A1~A4 포스터를 만든다.

사용법:
    python3 scripts/make_poster.py sites/<slug>                          # conference.json 의 poster 설정대로
    python3 scripts/make_poster.py sites/<slug> --layout speakers --size A3 --lang both
    python3 scripts/make_poster.py sites/<slug> --all                    # 네 가지 배치를 모두 만들어 비교
    python3 scripts/make_poster.py sites/<slug> --theme snu-science      # 다른 배색으로

배치(layout):
    program   일정표형 — 제목·일시·장소 + 프로그램 표 (학술대회·워크숍)
    speakers  연사형   — 기조·초청 연사 명단 중심 (연구발표회)
    lecture   강연형   — 연사 한 명의 사진·강연 제목·초록 (대중강연·콜로키움)
    photo     사진형   — 대표 사진을 크게, 주요 행사 목록 (총회·축제형)
    auto      자동 선택 (기본값)

결과: dist/<slug>/poster/ 에
    poster-<layout>-<size>-<lang>.html   브라우저에서 열어 확인 → Chrome 인쇄 → "PDF로 저장"
    poster-<layout>-<size>-<lang>.pdf    (Playwright 가 설치되어 있으면 자동 생성)
    poster-<layout>-<size>-<lang>.png    (미리보기 이미지, Playwright 필요)

원칙: 포스터에 들어가는 글은 전부 conference.json 에서 가져온다. 없는 내용을 지어내지 않는다.
QR 코드는 segno 가 설치되어 있을 때 만든다 (pip install segno). 없으면 주소만 글자로 넣는다.
"""
import argparse
import base64
import hashlib
import html
import json
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = ROOT / "template"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from themes import resolve_theme, DEFAULTS  # noqa: E402
from validate import validate  # noqa: E402

PAPER = {"A1": (594, 841), "A2": (420, 594), "A3": (297, 420), "A4": (210, 297)}
LAYOUTS = ("program", "speakers", "lecture", "photo")
SANS = '"Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
SERIF = '"Noto Serif KR", "Noto Serif CJK KR", "Nanum Myeongjo", serif'

UI = {
    "ko": {"date": "일시", "venue": "장소", "program": "프로그램", "speakers": "연사", "host": "주최", "support": "후원",
           "tentative": "예정", "site": "홈페이지", "deadline": "사전등록 마감", "fee": "등록비", "highlights": "주요 행사",
           "abstract": "강연 요지", "contact": "문의", "scan": "QR 코드로 홈페이지 바로가기"},
    "en": {"date": "Date", "venue": "Venue", "program": "Programme", "speakers": "Speakers", "host": "Hosted by", "support": "Supported by",
           "tentative": "tentative", "site": "Website", "deadline": "Registration deadline", "fee": "Fee", "highlights": "Highlights",
           "abstract": "Abstract", "contact": "Contact", "scan": "Scan for the website"},
}


def esc(s):
    return html.escape(s or "", quote=True)


class Text:
    """언어 선택: ko / en / both(주 언어 한국어 + 보조 영어)."""

    def __init__(self, lang):
        self.mode = lang
        self.p = "en" if lang == "en" else "ko"
        self.s = "en" if lang == "both" else None

    def t(self, obj):
        if obj is None:
            return ""
        if isinstance(obj, str):
            return obj
        v = obj.get(self.p) or obj.get("ko") or obj.get("en") or ""
        return v.strip()

    def t2(self, obj):
        """both 일 때만 영어 보조 문구 (주 문구와 같으면 생략)."""
        if not self.s or not isinstance(obj, dict):
            return ""
        v = (obj.get(self.s) or "").strip()
        return "" if not v or v == self.t(obj) else v

    def ui(self, key):
        return UI[self.p][key]


def data_uri(site_dir, ref, warnings, what):
    """assets/ 의 이미지를 포스터 HTML 안에 넣는다(파일 하나로 완결되도록)."""
    if not ref:
        return ""
    if ref.startswith(("http://", "https://")):
        warnings.append(f"{what}: 인터넷 주소 이미지({ref})는 인쇄할 때 연결이 없으면 빠집니다. assets/ 에 파일로 넣기를 권장합니다")
        return ref
    p = (site_dir / ref).resolve()
    if not str(p).startswith(str(site_dir.resolve())) or not p.is_file():
        warnings.append(f"{what}: 파일을 찾지 못했습니다 → {ref}")
        return ""
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    if not mime.startswith("image/"):
        warnings.append(f"{what}: 이미지 파일이 아닙니다 → {ref}")
        return ""
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")


def qr_svg(url, warnings):
    if not url:
        return ""
    try:
        import segno  # noqa: WPS433 (선택 의존성)
    except ImportError:
        warnings.append("QR 코드: segno 가 없어 생략했습니다 (pip install segno 후 다시 실행하면 들어갑니다). 주소는 글자로 들어갑니다")
        return ""
    q = segno.make(url, error="m")
    return q.svg_inline(dark="#111111", light=None, border=0, omitsize=True)


def background_svg(seed):
    """테마 강조색으로 그리는 추상 무늬(동심원). 슬러그로 위치가 정해져 행사마다 조금씩 다르다.
    색은 CSS 의 color(=강조색)를 따른다(currentColor)."""
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    cx = 78 + h[0] % 22
    cy = 10 + h[1] % 22
    rings = []
    for i in range(34):
        r = 5 + i * 2.6
        op = max(0.05, 0.34 - i * 0.009)
        rings.append(f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" stroke-opacity="{op:.3f}" />')
    return ('<svg viewBox="0 0 100 141.42" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
            f'<circle cx="{cx}" cy="{cy}" r="16" fill="currentColor" fill-opacity=".10" />'
            f'<g fill="none" stroke="currentColor" stroke-width=".22">{"".join(rings)}</g></svg>')


def theme_vars(data, theme_override):
    v = dict(DEFAULTS)
    v.update({"--font-head": SERIF, "--font-body": SANS})
    tv, errors, _ = resolve_theme(theme_override if theme_override else data.get("theme"))
    if errors:
        raise SystemExit("테마 오류: " + "; ".join(errors))
    v.update(tv)
    # 사이트 CSS 의 글꼴 이름(웹폰트)을 인쇄용 대체 글꼴과 함께 쓴다
    head = v.get("--font-head", SERIF)
    body = v.get("--font-body", SANS)
    if "Serif" in head and "CJK" not in head:
        head = head.replace('"Noto Serif KR"', '"Noto Serif KR", "Noto Serif CJK KR"')
    if "Noto Sans KR" in head and "CJK" not in head:
        head = head.replace('"Noto Sans KR"', '"Noto Sans KR", "Noto Sans CJK KR"')
    if "CJK" not in body:
        body = body.replace('"Noto Sans KR"', '"Noto Sans KR", "Noto Sans CJK KR"') if "Noto Sans KR" in body else SANS
    return {
        "--p-deep": v["--primary-deep"], "--p-mid": v["--primary"], "--p-end": v["--hero-end"],
        "--p-accent": v["--accent"], "--p-accent-ink": v["--accent-ink"],
        "--p-font-head": head, "--p-font-body": body,
    }


def pick_layout(data):
    poster = data.get("poster") or {}
    lay = poster.get("layout") or "auto"
    if lay != "auto":
        return lay
    speakers = [s for s in data.get("speakers") or [] if s.get("name")]
    if (data.get("hero") or {}).get("image") or poster.get("image"):
        return "photo"
    if len(speakers) == 1:
        return "lecture"
    if len(speakers) >= 6:
        return "speakers"
    return "program"


def paragraphs(text):
    parts = [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]
    return "".join(f"<p>{esc(p)}</p>" for p in parts)


def build_poster(site_dir, layout=None, size=None, lang=None, theme=None):
    data = json.loads((site_dir / "conference.json").read_text(encoding="utf-8"))
    errors, _w = validate(data)
    if errors:
        raise SystemExit("conference.json 오류 — 먼저 고치세요:\n  " + "\n  ".join(errors))
    poster = data.get("poster") or {}
    warnings = []
    if not layout:
        layout = pick_layout(data)
    elif layout == "auto":
        layout = pick_layout({**data, "poster": {**poster, "layout": "auto"}})
    size = (size or poster.get("size") or "A2").upper()
    lang = lang or poster.get("lang") or "both"
    if layout not in LAYOUTS:
        raise SystemExit(f"layout 은 {', '.join(LAYOUTS)}, auto 중 하나입니다 → {layout}")
    if size not in PAPER:
        raise SystemExit(f"size 는 {', '.join(PAPER)} 중 하나입니다 → {size}")
    if lang not in ("ko", "en", "both"):
        raise SystemExit("lang 은 ko, en, both 중 하나입니다")
    T = Text(lang)
    w_mm, h_mm = PAPER[size]
    speakers = {s.get("id"): s for s in data.get("speakers") or [] if s.get("id")}

    # ---- 공통 조각 ----
    title_src = poster.get("headline") or data.get("title") or {}
    title = T.t(title_src)
    lines = [ln.strip() for ln in title.split("\n") if ln.strip()] or [title]
    title_html = "".join(f'<span class="line">{esc(ln)}</span>' for ln in lines)
    title_en = T.t2(data.get("title"))
    subtitle = T.t(data.get("subtitle"))
    kicker = T.t(poster.get("kicker") or data.get("kicker") or data.get("host"))

    d = data.get("dates") or {}
    start, end = d.get("start") or "", d.get("end") or ""
    date_txt = T.t(d.get("display")) or (f"{start} – {end}" if end and end != start else start)
    date_en = T.t2(d.get("display"))
    v = data.get("venue") or {}
    venue_txt = " ".join(x for x in [T.t(v.get("name")), T.t(v.get("room"))] if x)
    venue_en = " ".join(x for x in [T.t2(v.get("name")), T.t2(v.get("room"))] if x)
    when_where = (
        '<dl class="when-where">'
        f'<dt>{esc(T.ui("date"))}</dt><dd>{esc(date_txt)}{f"<small>{esc(date_en)}</small>" if date_en else ""}</dd>'
        f'<dt>{esc(T.ui("venue"))}</dt><dd>{esc(venue_txt)}{f"<small>{esc(venue_en)}</small>" if venue_en else ""}</dd>'
        "</dl>")

    reg = data.get("registration") or {}
    notes = []
    if T.t(poster.get("note")):
        notes.append(T.t(poster.get("note")))
    if T.t(reg.get("deadline_display")) or reg.get("deadline"):
        notes.append(f'{T.ui("deadline")} {T.t(reg.get("deadline_display")) or reg.get("deadline")}')
    if T.t(reg.get("fee")):
        notes.append(f'{T.ui("fee")} {T.t(reg.get("fee"))}')
    note_html = f'<p class="note-line">{" · ".join(esc(n) for n in notes)}</p>' if notes else ""

    # ---- 바닥글: 주최·후원·문의·QR ----
    credits = []
    if poster.get("credits"):
        for c in poster["credits"]:
            credits.append(f'<div class="row"><span class="lbl">{esc(T.t(c.get("label")))}</span><span>{esc(T.t(c.get("text")))}</span></div>')
    elif T.t(data.get("host")):
        credits.append(f'<div class="row"><span class="lbl">{esc(T.ui("host"))}</span><span>{esc(T.t(data.get("host")))}</span></div>')
    chips = []
    for i, s in enumerate(data.get("sponsors") or []):
        src = data_uri(site_dir, s.get("logo"), warnings, f"sponsors[{i}].logo") if s.get("logo") else ""
        name = T.t(s.get("name"))
        chips.append(f'<span class="logo-chip"><img src="{esc(src)}" alt="{esc(name)}"></span>' if src else f"<span>{esc(name)}</span>")
    if chips:
        credits.append(f'<div class="row"><span class="lbl">{esc(T.ui("support"))}</span>{"".join(chips)}</div>')
    if poster.get("show_contact", True):
        for c in (data.get("contact") or [])[:1]:
            bits = [x for x in [T.t(c.get("name")), c.get("phone") or ""] if x]
            if c.get("phone") and bits:
                credits.append(f'<div class="row contact-line"><span class="lbl">{esc(T.ui("contact"))}</span><span>{esc(" · ".join(bits))}</span></div>')
    url = poster.get("url") or data.get("site_url") or ""
    if not url:
        warnings.append("홈페이지 주소가 없어 QR 코드와 주소를 넣지 못했습니다 (conference.json 의 site_url 또는 poster.url)")
    qr = qr_svg(url, warnings) if url and poster.get("qr", True) else ""
    url_label = re.sub(r"^https?://", "", url).rstrip("/")
    qr_html = ""
    if url:
        qr_html = (f'<div class="qr-box"><div class="url"><small>{esc(T.ui("scan") if qr else T.ui("site"))}</small>{esc(url_label)}</div>'
                   + (f'<div class="qr" role="img" aria-label="QR {esc(url)}">{qr}</div>' if qr else "") + "</div>")
    foot = f'<footer class="poster-foot"><div class="credits">{"".join(credits)}</div>{qr_html}</footer>'

    # ---- 배치별 본문 ----
    head_block = (f'<p class="kicker">{esc(kicker)}</p>' if kicker else "") + f'<h1 class="title">{title_html}</h1>' \
        + (f'<p class="title-en">{esc(title_en)}</p>' if title_en else "") + (f'<p class="subtitle">{esc(subtitle)}</p>' if subtitle else "")
    body = ""
    extra_class = ""
    photo_html = ""

    if layout == "program":
        days = []
        for day in data.get("program") or []:
            rows = []
            for it in day.get("items") or []:
                soft = it.get("kind") in ("registration", "break", "meal", "social", "meeting")
                spk = speakers.get(it.get("speaker_id")) if it.get("speaker_id") else None
                ttl = (T.t(spk.get("title")) if spk else "") or T.t(it.get("title"))
                who = ""
                if spk:
                    aff = T.t(spk.get("affiliation"))
                    who = T.t(spk.get("name")) + (f" ({aff})" if aff else "")
                elif T.t(it.get("speaker")):
                    who = T.t(it.get("speaker"))
                badge = f'<span class="badge">{esc(T.ui("tentative"))}</span>' if it.get("tentative") else ""
                cls = " soft" if soft else ""
                rows.append(f'<div class="t{cls}">{esc(it.get("time", ""))}</div>'
                            f'<div class="c{cls}"><div class="it">{esc(ttl)}{badge}</div>'
                            + (f'<div class="sp">{esc(who)}</div>' if who else "")
                            + (f'<div class="nt">{esc(T.t(it.get("note")))}</div>' if T.t(it.get("note")) else "") + "</div>")
            badge = f'<span class="badge">{esc(T.ui("tentative"))}</span>' if day.get("tentative") else ""
            note = T.t(day.get("note"))
            days.append(f'<div class="day"><div class="day-head">{esc(T.t(day.get("label")) or day.get("date", ""))}{badge}</div>'
                        + (f'<div class="day-note">{esc(note)}</div>' if note and poster.get("show_day_notes", False) else "")
                        + f'<div class="rows">{"".join(rows)}</div></div>')
        if not days:
            warnings.append("program 이 비어 있어 일정표형 포스터에 표가 없습니다. 다른 배치(--layout speakers/lecture/photo)를 쓰세요")
        body = (head_block + when_where + note_html
                + f'<section class="fit" data-try-cols="2"><div class="fit-body"><h2 class="section-label">{esc(T.ui("program"))}</h2><div class="days">{"".join(days)}</div></div></section>')

    elif layout == "speakers":
        groups, order = {}, []
        for s in data.get("speakers") or []:
            if not s.get("name"):
                continue
            g = T.t(s.get("group")) or T.ui("speakers")
            if g not in groups:
                groups[g] = []
                order.append(g)
            name, name_en = T.t(s.get("name")), T.t2(s.get("name"))
            talk = T.t(s.get("title")) if poster.get("show_talk_titles", False) else ""
            groups[g].append('<div class="person">'
                             f'<span class="n">{esc(name)}</span>' + (f'<span class="n-en">{esc(name_en)}</span>' if name_en else "")
                             + (f'<span class="a">{esc(T.t(s.get("affiliation")))}</span>' if T.t(s.get("affiliation")) else "")
                             + (f'<span class="tt">{esc(talk)}</span>' if talk else "") + "</div>")
        n = sum(len(x) for x in groups.values())
        if not n:
            warnings.append("speakers 가 비어 있어 연사형 포스터에 명단이 없습니다")
        # 그룹이 둘 이상이면 첫 그룹(보통 기조강연)을 크게, 나머지는 여러 단으로 흐르게 한다
        featured = ""
        rest = order
        if len(order) >= 2 and len(groups[order[0]]) <= 4:
            g0 = order[0]
            featured = f'<div class="featured"><h3>{esc(g0)}</h3><div class="featured-list">{"".join(groups[g0])}</div></div>'
            rest = order[1:]
        m_rest = sum(len(groups[g]) for g in rest)
        cols = "cols-1" if m_rest <= 4 else ("cols-3" if m_rest >= 12 and size in ("A1", "A2", "A3") else "cols-2")
        blocks = "".join(f'<div class="group"><h3>{esc(g)}</h3>{"".join(groups[g])}</div>' for g in rest)
        body = head_block + when_where + note_html + f'<section class="fit"><div class="fit-body">{featured}<div class="groups {cols}">{blocks}</div></div></section>'

    elif layout == "lecture":
        sid = poster.get("speaker_id")
        cand = [s for s in data.get("speakers") or [] if s.get("name")]
        spk = speakers.get(sid) if sid else (cand[0] if cand else None)
        if not spk:
            warnings.append("lecture 배치에는 speakers 가 1명 이상 필요합니다")
            spk = {}
        photo = data_uri(site_dir, spk.get("photo"), warnings, "speakers.photo") if spk.get("photo") else ""
        talk, talk_en = T.t(spk.get("title")), T.t2(spk.get("title"))
        aff = T.t(spk.get("affiliation"))
        abstract = T.t(spk.get("abstract"))
        body = (head_block
                + '<div class="lecture-main"><div>'
                + (f'<p class="talk">{esc(talk)}</p>' if talk else "")
                + (f'<p class="talk-en">{esc(talk_en)}</p>' if talk_en else "")
                + f'<div class="who">{esc(T.t(spk.get("name")))}' + (f"<small>{esc(aff)}</small>" if aff else "") + "</div></div>"
                + (f'<img class="portrait" src="{esc(photo)}" alt="{esc(T.t(spk.get("name")))}">' if photo else "")
                + "</div>" + when_where + note_html
                + (f'<section class="fit" data-max-k="1.7"><div class="fit-body abstract"><h2 class="section-label">{esc(T.ui("abstract"))}</h2>{paragraphs(abstract)}</div></section>' if abstract else '<div style="flex:1"></div>'))
        if not photo:
            warnings.append("강연형: 연사 사진(speakers[].photo)이 없어 사진 없이 만들었습니다")

    elif layout == "photo":
        extra_class = " layout-photo"
        img_ref = poster.get("image") or (data.get("hero") or {}).get("image")
        img = data_uri(site_dir, img_ref, warnings, "대표 사진") if img_ref else ""
        if img:
            credit = T.t((data.get("hero") or {}).get("credit"))
            photo_html = f'<div class="photo"><img src="{esc(img)}" alt=""></div>' + (f'<div class="credit">{esc(credit)}</div>' if credit else "")
        else:
            warnings.append("사진형: 대표 사진(hero.image 또는 poster.image)이 없어 배경 무늬로 대신했습니다")
        hl = [T.t(x) for x in poster.get("highlights") or [] if T.t(x)]
        if not hl:
            hl = [T.t(day.get("label")) for day in data.get("program") or [] if T.t(day.get("label"))]
        hl_html = f'<section class="fit" data-max-k="1.6"><div class="fit-body"><h2 class="section-label">{esc(T.ui("highlights"))}</h2><ul class="highlights">' \
                  + "".join(f"<li>{esc(x)}</li>" for x in hl) + "</ul></div></section>" if hl else ""
        body = f'<div class="title-box">{head_block}</div>' + when_where + note_html + hl_html

    vars_css = ";".join(f"{k}:{val}" for k, val in theme_vars(data, theme).items())
    css = (TEMPLATE_DIR / "poster.css").read_text(encoding="utf-8")
    js = (TEMPLATE_DIR / "poster.js").read_text(encoding="utf-8")
    page_title = f'{title.replace(chr(10), " ")} — 포스터 {size}'
    doc = f"""<!DOCTYPE html>
<html lang="{"en" if lang == "en" else "ko"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(page_title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Noto+Serif+KR:wght@600;800&display=swap" rel="stylesheet">
<style>
@page {{ size: {w_mm}mm {h_mm}mm; margin: 0; }}
:root {{ --paper-w: {w_mm}mm; --paper-h: {h_mm}mm; {vars_css}; }}
{css}
</style>
</head>
<body>
<div class="fit-warning">내용이 많아 포스터에 다 들어가지 않습니다. 글자를 줄여도 넘치는 부분이 있으니, 프로그램을 줄이거나 다른 배치(--layout)나 더 큰 용지(--size)를 쓰세요.</div>
<main class="poster layout-{layout}{extra_class}" data-layout="{layout}" data-size="{size}">
<div class="poster-bg"><div class="grad"></div>{background_svg(data.get("slug", "site"))}</div>
{photo_html}
<div class="inner">{body}</div>
{foot}
</main>
<script>
{js}
</script>
</body>
</html>
"""
    return doc, {"layout": layout, "size": size, "lang": lang, "warnings": warnings, "paper_mm": (w_mm, h_mm), "url": url, "qr": bool(qr)}


def export(html_path, info, want_pdf=True, want_png=True):
    """Playwright(Chromium)로 PDF·PNG 를 만든다. 설치되어 있지 않으면 HTML 만 남긴다."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"pdf": None, "png": None, "overflow": None, "note": "Playwright 가 없어 PDF 는 만들지 않았습니다. HTML 을 Chrome 으로 열고 인쇄 → PDF로 저장(여백 없음, 배경 그래픽 켜기)하세요"}
    w_mm, h_mm = info["paper_mm"]
    out = {"pdf": None, "png": None, "overflow": None, "math": None, "note": ""}
    with sync_playwright() as p:
        b = p.chromium.launch()
        px_w = round(w_mm / 25.4 * 96)
        page = b.new_page(viewport={"width": px_w + 60, "height": 900}, device_scale_factor=max(1, round(1600 / px_w, 2)))
        page.goto(html_path.resolve().as_uri())
        try:
            page.wait_for_selector("body[data-fitted='1']", timeout=20000)
        except Exception:  # noqa: BLE001
            out["note"] = "자동 글자 맞춤이 끝나지 않았습니다"
        out["overflow"] = page.evaluate("document.body.getAttribute('data-overflow') === '1'")
        out["math"] = page.evaluate("document.body.getAttribute('data-math') === '1'")
        has_math = page.evaluate(r"/\$[^$]+\$/.test(document.querySelector('.poster').textContent)")
        if has_math and not out["math"]:
            out["note"] = (out["note"] + " " if out["note"] else "") + "수식($...$)을 그리는 KaTeX 를 불러오지 못해 수식이 글자 그대로 남았습니다(인터넷 연결 필요)"
        page.evaluate("document.querySelector('.poster').style.zoom = 1")
        if want_png:
            png = html_path.with_suffix(".png")
            page.locator(".poster").screenshot(path=str(png))
            out["png"] = png
        if want_pdf:
            pdf = html_path.with_suffix(".pdf")
            page.emulate_media(media="print")
            page.pdf(path=str(pdf), prefer_css_page_size=True, print_background=True)
            out["pdf"] = pdf
        b.close()
    return out


def main():
    ap = argparse.ArgumentParser(description="conference.json → 인쇄용 포스터")
    ap.add_argument("site_dir")
    ap.add_argument("--layout", choices=list(LAYOUTS) + ["auto"])
    ap.add_argument("--size", choices=list(PAPER) + [s.lower() for s in PAPER])
    ap.add_argument("--lang", choices=["ko", "en", "both"])
    ap.add_argument("--theme", help="이 포스터만 다른 배색으로 (예: snu-science)")
    ap.add_argument("--all", action="store_true", help="네 가지 배치를 모두 만든다")
    ap.add_argument("--out", help="결과 폴더 (기본 dist/<slug>/poster)")
    ap.add_argument("--no-pdf", action="store_true")
    args = ap.parse_args()
    site = Path(args.site_dir)
    data = json.loads((site / "conference.json").read_text(encoding="utf-8"))
    out_dir = Path(args.out) if args.out else ROOT / "dist" / data.get("slug", site.name) / "poster"
    out_dir.mkdir(parents=True, exist_ok=True)
    layouts = list(LAYOUTS) if args.all else [args.layout or None]
    for lay in layouts:
        doc, info = build_poster(site, lay, args.size, args.lang, args.theme)
        name = f"poster-{info['layout']}-{info['size']}-{info['lang']}.html"
        path = out_dir / name
        path.write_text(doc, encoding="utf-8")
        res = {"pdf": None, "png": None, "overflow": None, "note": ""} if args.no_pdf else export(path, info)
        print(f"OK    {path}" + (f"  + {res['pdf'].name}" if res.get("pdf") else "") + (f"  + {res['png'].name}" if res.get("png") else ""))
        for w in info["warnings"]:
            print(f"WARN  {w}")
        if res.get("overflow"):
            print("WARN  내용이 용지에 다 들어가지 않습니다. 프로그램을 줄이거나 --size 를 키우거나 다른 --layout 을 쓰세요")
        if res.get("note"):
            print(f"NOTE  {res['note']}")


if __name__ == "__main__":
    main()
