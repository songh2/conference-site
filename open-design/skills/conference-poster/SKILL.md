---
name: conference-poster
en_name: "Academic Event Poster (conference-site)"
description: |
  학술 행사(학회·워크숍·세미나·강연) 인쇄 포스터(A1~A4)를 conference-site 의 사실 브리프(poster-brief.md)와
  행사 배색(디자인 시스템)으로 만든다. 브리프에 없는 글은 쓰지 않는다.
  Trigger keywords: 학회 포스터, 학술 행사 포스터, 워크숍 포스터, 세미나 포스터, conference poster, academic poster.
en_description: |
  Print poster (ISO A1–A4) for an academic event, built from a conference-site fact brief (poster-brief.md)
  and the event's design system. Uses only facts from the brief.
triggers:
  - "학회 포스터"
  - "학술 행사 포스터"
  - "conference poster"
  - "academic event poster"
od:
  mode: prototype
  surface: web
  scenario: education
  category: poster
  preview:
    type: html
  example_prompt: "Make an A2 print poster from the attached conference-site brief (poster-brief.md). Use only its facts."
  example_prompt_i18n:
    ko: "첨부한 conference-site 브리프(poster-brief.md)로 A2 인쇄 포스터를 만들어 줘. 브리프에 있는 사실만 써."
  design_system:
    requires: true
  craft:
    requires: [typography, typography-hierarchy, color, anti-ai-slop]
---

# Academic event poster (conference-site)

You design a **printed portrait poster** for an academic event. The facts come from a brief exported by
conference-site (https://github.com/songh2/conference-site). This skill is part of that repository.

## Inputs — collect before designing
1. **`poster-brief.md`** (required): the fact brief. In conference-site's web tool it comes in the
   "OpenDesign 앱용 묶음" ZIP (포스터 탭 → OpenDesign 앱용 묶음 받기), or from
   `python3 scripts/export_open_design.py --brief sites/<slug>`.
   If the user has no brief, ask them to export it. **Do not reconstruct facts from memory or the web.**
2. **`qr.svg`** (optional, in the same ZIP): the real QR code for the event website. Never draw or fake a QR code.
3. **Photos/logos** (optional, `assets/…` in the ZIP): use only these, only where the brief allows.
4. Paper size and language: from the brief (section 1) unless the user says otherwise.

## Output
- One self-contained `index.html` (with file tools) or one complete HTML document in a single `<artifact>` block (API mode).
- Root element `<main class="poster">` exactly the paper size in **mm** (A1 594×841, A2 420×594, A3 297×420, A4 210×297),
  `overflow: hidden`; add `@page { size: <W>mm <H>mm; margin: 0 }` and `print-color-adjust: exact`.
- No JavaScript. Fonts: "Noto Sans KR" / "Noto Serif KR" (Google Fonts link allowed) with system fallbacks.
- Decoration: your own inline SVG/CSS (abstract shapes, lines, grids). No people, faces, logos or text as images.
- QR: inline the contents of `qr.svg` (or `<img src="qr.svg">` when files are available) on a white tile, at least 25 mm wide on A2
  (scale with paper size), next to the website address from the brief. If there is no `qr.svg`, leave the QR out.

## Facts (absolute rules)
- Every word on the poster comes from the brief's **사실 정보 / 프로그램 / 연사** sections, copied exactly
  (spelling, numbers, date format, room names). You may omit facts to keep the poster clean, but always keep the
  **event title, date/time and venue**.
- Never invent slogans, taglines, descriptions, speakers, fees, deadlines, statistics or English translations.
  If an English version is not in the brief, do not write one. Korean names stay in Korean unless the brief gives the English.
- The only words you may add are short section labels: 일시, 장소, 주최, 후원, 문의, 프로그램, 연사, 기조 강연, 사전등록, 마감, 등록비, 홈페이지,
  Date, Venue, Host, Program, Speakers, Keynote, Registration, Deadline, Fee, Website.
- Respect the brief's section 5 (반드시 지킬 것): no generated photos of real people, logos only as supplied
  (Seoul National University signature only in SNU Blue, SNU Gray, black or white).

## Design
- Follow the active design system (DESIGN.md + tokens). If none is active, use the colours listed in the brief.
- Apply the injected craft rules. For Korean: `word-break: keep-all`, headline `line-height` ≥ 1.3, letter-spacing 0 on Korean display text.
- One dominant entry point (normally the title), then date/venue, then programme or speakers, then host/QR strip.
- Margins ≥ 5 % of the paper width. Body text legible from 1–2 m (≥ 3 mm cap height on A2). Nothing cut off or overlapping.
- Long programmes: compact table or two columns; mark tentative items with the brief's "예정 / tentative" label.

## Self-check before you finish (write the result in Korean, 3–6 lines)
1. Compare every line on the poster with the brief: title, each date and weekday, times, venue and room, every name and affiliation.
2. List any text you added that is not in the brief (should be only the allowed labels).
3. Confirm paper size, nothing overflowing, QR present only if `qr.svg` was given.
4. Tell the user to export with the browser's print → "PDF로 저장" (margins: none, background graphics: on) and to check the facts once more.
