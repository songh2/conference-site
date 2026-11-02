# SNU College of Veterinary Medicine — conference-site theme

> Category: Education & Academic Events
> Academic conference / workshop / seminar materials for SNU College of Veterinary Medicine (서울대학교 수의과대학). Exported from the conference-site theme preset `snu-vet`.

## Provenance
- Source: https://vet.snu.ac.kr/ (2026-10-27 확인, 브라우저 계산된 스타일). 관찰값: 보라 #833ca3, 자두색 #830b69, 버건디 #591f2e. 파생값: --accent-hover(강조색을 흰색과 18% 섞음), --accent-soft(강조색을 흰색과 86% 섞음)
- Status: `extracted` (홈페이지 추출(공식 아님)). `extracted` means the colours were read from the institution's public website and are **not** an official brand specification. `official` means the key colours come from a published UI guide.
- No logo, emblem, signature or typeface file is bundled. Institutional signatures must be used only as supplied by the institution and in their prescribed colours (for Seoul National University: SNU Blue, SNU Gray, black or white).

## Visual Theme & Atmosphere
Calm, credible academic event material: a deep, saturated field (#591f2e → #833ca3 → #830b69) carrying large, confident headline type, with one warm highlight colour (#ffffff) reserved for dates, labels and the key call-to-action. Information density is high (programmes, speaker lists), so structure and legibility come before decoration.

## Color
- **Hero / poster field:** `#591f2e` (start), `#833ca3` (middle), `#830b69` (end) — white text on this field (12.6:1 on the darkest stop).
- **Highlight:** `#ffffff` with `#591f2e` text when used as a background (12.6:1). Use for dates, section labels and one primary button. Never for long body text.
- **Page:** background `#faf9f6`, surface `#ffffff`, text `#1b2230`, secondary text `#4b5563`, borders `#e5e1d8`.
- Keep to these colours; do not add off-palette hues.

## Typography
- **Display:** "Noto Serif KR", "Noto Serif CJK KR", "Nanum Myeongjo", serif
- **Body:** "Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif
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
