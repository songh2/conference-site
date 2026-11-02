// AI 디자인 (OpenDesign 방식) — 포스터 시안과 홈페이지 배색·첫 화면 그림 제안
//
// OpenDesign(nexu-io/open-design)이 AI 에이전트에게 주는 것과 같은 재료를 사용자의 API 키(팩트챗 등)로 보낸다:
//   - 디자인 시스템: 이 행사 배색의 DESIGN.md + tokens.css (scripts/export_open_design.py 와 같은 내용)
//   - 디자인 규칙: web/opendesign/craft/*.md (OpenDesign 의 craft 규칙, Apache-2.0, 고치지 않고 복사)
//   - 결과 형식: OpenDesign 의 BYOK 실행처럼 완성된 HTML 하나를 <artifact> 블록으로
// AI 가 만든 HTML 은 그대로 믿지 않는다: 스크립트·외부 주소를 지우고(sanitize), 자료에 없는 글을 찾아 경고한다(factCheck).

export const STYLES = [
  { id: 'auto', name: '자동 — 행사 성격에 맞게 AI 가 고름', text: 'Choose the direction that best fits this academic event. Prefer a confident, typographic poster over decoration.' },
  { id: 'swiss', name: '스위스 타이포그래피 — 격자, 큰 산세리프 제목, 비대칭', text: 'International Typographic Style: a strict modular grid, a very large sans-serif title (Noto Sans KR, heavy weight), asymmetric composition, flush-left ragged-right text, thin rules, one strong accent colour, lots of structured white space.' },
  { id: 'editorial', name: '에디토리얼 — 학술지·잡지처럼 세리프 제목, 넓은 여백', text: 'Editorial / journal cover: serif display title (Noto Serif KR), calm paper-like background, generous margins, hairline rules, small-caps labels, a refined two-column information area.' },
  { id: 'geometric', name: '수학·기하 무늬 — 선·원·격자로 만든 추상 그래픽', text: 'Mathematical geometry: an abstract inline-SVG graphic built from lines, circles, lattices, curves or tilings that suggests mathematics/science (no formulas as text unless they are in the facts), high contrast, the graphic occupying 30–45% of the poster.' },
  { id: 'bold', name: '강렬한 색면 — 큰 제목이 화면을 채움', text: 'Bold poster: oversized title filling the width, large flat colour fields, a diagonal or off-axis element, strong figure-ground contrast. Still only one accent colour.' },
  { id: 'minimal', name: '미니멀 — 밝은 바탕, 넓은 여백, 강조색 하나', text: 'Minimal: light background, very generous white space, restrained type sizes except the title, one accent colour used at most twice, precise alignment.' },
  { id: 'classic', name: '단정한 학술 행사 — 중앙 정렬, 얇은 테두리', text: 'Classic academic: centred symmetric layout, thin framing border, serif title, clear date/venue block, programme in a tidy table. Dignified, institutional.' },
];

const CRAFT_FILES = ['typography', 'typography-hierarchy', 'color', 'anti-ai-slop'];
let craftCache = null;
export async function loadCraft() {
  if (craftCache) return craftCache;
  const parts = await Promise.all(CRAFT_FILES.map(async (f) => {
    const r = await fetch(`web/opendesign/craft/${f}.md`);
    if (!r.ok) throw new Error(`디자인 규칙 파일을 읽지 못했습니다 (${f}.md)`);
    return `<!-- craft/${f}.md -->\n` + (await r.text());
  }));
  craftCache = parts.join('\n\n');
  return craftCache;
}

const LABELS = ['일시', '장소', '주최', '주관', '후원', '협찬', '문의', '프로그램', '일정', '연사', '초청 연사', '기조 강연', '기조강연', '강연', '사전등록', '사전 등록', '등록', '마감', '등록비', '홈페이지', 'QR 코드', '오시는 길',
  'Date', 'Time', 'Date & Time', 'Venue', 'Place', 'Host', 'Hosted by', 'Organized by', 'Organised by', 'Sponsored by', 'Supported by', 'Program', 'Programme', 'Schedule',
  'Speakers', 'Invited Speakers', 'Keynote', 'Keynote Speakers', 'Registration', 'Deadline', 'Fee', 'Website', 'Contact', 'Scan', 'Scan for the website', 'QR'];
const PX_PER_MM = 96 / 25.4;

// ---------------------------------------------------------------- 포스터 시안
export function posterSystem({ craft, paper, size, lang, qr, slots }) {
  const [w, h] = paper;
  const langRule = lang === 'ko' ? 'Korean only (use the Korean facts; omit English versions).'
    : lang === 'en' ? 'English only where English facts exist; where a fact has no English version, use the Korean fact as given.'
      : 'Korean first with the English version (if it exists in the facts) as a smaller secondary line.';
  const slotText = slots.length ? slots.map((s) => `"${s.slot}" (${s.label})`).join(', ') : '(none)';
  return `You are a senior print designer working the way OpenDesign's design agents work: you receive a design system (DESIGN.md + tokens.css), universal craft rules and a factual brief, and you deliver ONE complete artifact.

# Deliverable
- One self-contained HTML document for a printed portrait poster, ${size} = ${w} × ${h} mm. Put the whole document inside a single <artifact type="text/html"> … </artifact> block. Outside the block write at most 3 short lines in Korean describing the design idea.
- The poster root is <main class="od-poster">, exactly width: ${w}mm; height: ${h}mm; overflow: hidden; position: relative. Size everything relative to the paper (mm, %, or a unit like --u: ${(w / 100).toFixed(2)}mm) so it prints exactly. No scrolling content.
- All CSS in one <style> in <head>. NO JavaScript: no <script>, no on* attributes, no <iframe>, no forms, no <link>, no @import, no external URLs, no CSS url() except data: URIs.
- Fonts: only "Noto Sans KR" and "Noto Serif KR" (the host loads them) with system fallbacks.
- Decoration: your own inline SVG or CSS only (abstract shapes, lines, grids, patterns, gradients used with restraint). Never draw people, faces, logos, emblems or text as images.
- Images: the only images that exist are these slots: ${slotText}. To use one write <img data-slot="SLOT" alt=""> (the host fills in the picture). Do not reference any other image.
- QR code: ${qr ? `put an empty <div data-slot="qr"></div> where the QR code goes — a white square tile at least ${Math.round(w * 0.06)} mm wide next to the website address. The host inserts the real code.` : 'there is no website address — do not add a QR code or a URL.'}

# Facts (absolute rule)
- Every word on the poster must come from the FACTS in the brief, copied exactly (same spelling, numbers and date format). You may leave facts out to keep the poster clean, but always keep the event title, the date/time and the venue.
- Never invent slogans, taglines, descriptions, speakers, fees, deadlines, numbers or translations. If an English version is not in the facts, do not write one.
- The only words you may add yourself are short section labels from this list: ${LABELS.join(', ')}.
- Language: ${langRule}

# Design quality
- Follow DESIGN.md. Copy the :root block from tokens.css into your <style> and use var(--…) instead of raw hex values.
- Apply the craft rules below. Korean (CJK) display text: line-height ≥ 1.3, letter-spacing 0, word-break: keep-all.
- Print-ready: one dominant entry point (normally the title), margins ≥ 5% of the width, nothing cut off or overlapping, body text at least ${Math.max(3, Math.round(w / 100 * 1.4))} mm high on ${size}. If the programme is long, use columns or a compact table, but keep it legible.

# Craft rules (OpenDesign craft/, Apache-2.0 — apply the ones relevant to print)
${craft}`;
}

export function posterFirstMessage({ ctx, style, extra, variant }) {
  const st = STYLES.find((s) => s.id === style) || STYLES[0];
  return `Design direction: ${st.text}
${extra ? `Additional request from the organiser (Korean): ${extra}\n` : ''}${variant ? `Variation #${variant}: explore a clearly different composition from an obvious first idea.\n` : ''}
=== FACTS / BRIEF (from conference-site; copy facts exactly) ===
${ctx.brief}

=== DESIGN.md (design system of this event) ===
${ctx.design_md}

=== tokens.css ===
${ctx.tokens_css}`;
}

export function reviseMessage(feedback) {
  return `Revise the poster above according to this request from the organiser (Korean): "${feedback}"
Keep every fact rule and the paper size. Return the complete updated HTML in one <artifact type="text/html"> block.`;
}

export function extractArtifact(text) {
  const t = String(text || '');
  let m = t.match(/<artifact\b[^>]*>([\s\S]*?)<\/artifact>/i);
  let html = m ? m[1] : '';
  if (!html) { m = t.match(/```(?:html)?\s*([\s\S]*?)```/i); if (m && /<(html|main|body)\b/i.test(m[1])) html = m[1]; }
  if (!html) { m = t.match(/<!doctype html[\s\S]*<\/html>/i) || t.match(/<html[\s\S]*<\/html>/i); if (m) html = m[0]; }
  if (!html) {
    if (/<artifact\b/i.test(t)) throw new Error('AI 응답이 중간에 끊겼습니다(시안이 너무 깁니다). "추가 요청"에 "더 간단하게"를 적거나 다시 시도해 주세요.');
    throw new Error('AI 응답에서 포스터 HTML 을 찾지 못했습니다. 다시 시도해 주세요.');
  }
  const note = t.replace(m ? m[0] : '', '').replace(/<artifact\b[\s\S]*$/i, '').trim().slice(0, 400);
  return { html: html.trim(), note };
}

const BAD_TAGS = 'script,iframe,frame,frameset,object,embed,applet,base,form,input,textarea,select,button,link,meta,noscript,template,audio,video,source,track,portal,foreignObject,foreignobject';
const URL_ATTRS = ['href', 'xlink:href', 'src', 'srcset', 'action', 'formaction', 'poster', 'background', 'data', 'ping'];
function cleanCss(css) {
  return String(css || '')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\(\s*(['"]?)(?!data:image\/|#)[^)]*\1\s*\)/gi, 'none')
    .replace(/expression\s*\(/gi, '(');
}
function cleanTree(root) {
  root.querySelectorAll(BAD_TAGS).forEach((n) => n.remove());
  root.querySelectorAll('*').forEach((el) => {
    for (const name of el.getAttributeNames()) {
      const v = el.getAttribute(name) || '';
      const low = name.toLowerCase();
      if (low.startsWith('on')) el.removeAttribute(name);
      else if (URL_ATTRS.includes(low) && !/^(data:image\/|#)/i.test(v.trim())) el.removeAttribute(name);
      else if (low === 'style') el.setAttribute('style', cleanCss(v));
      else if (/^\s*javascript:/i.test(v)) el.removeAttribute(name);
    }
    if (el.tagName.toLowerCase() === 'style') el.textContent = cleanCss(el.textContent);
    if (el.tagName.toLowerCase() === 'a') { const s = el.ownerDocument.createElement('span'); s.append(...el.childNodes); el.replaceWith(s); }
  });
}

// AI 가 만든 HTML → 인쇄용으로 안전한 HTML (스크립트·외부 주소 제거, 사진·QR 끼워 넣기, 용지 크기 고정)
export function finishPoster(rawHtml, { paper, qr, slotUrls }) {
  const [w, h] = paper;
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  cleanTree(doc.documentElement);
  doc.querySelectorAll('img').forEach((img) => {
    const slot = img.getAttribute('data-slot');
    const url = slot && slotUrls[slot];
    if (url) img.setAttribute('src', url);
    else if (!/^data:image\//i.test(img.getAttribute('src') || '')) img.remove();
  });
  doc.querySelectorAll('[data-slot="qr"]').forEach((el) => {
    if (qr) { el.innerHTML = qr; el.style.background = '#fff'; } else el.remove();
  });
  let main = doc.querySelector('.od-poster');
  if (!main) { main = doc.createElement('main'); main.className = 'od-poster'; main.append(...doc.body.childNodes); doc.body.append(main); }
  const head = doc.head;
  const csp = doc.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content', "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data:");
  const cs = doc.createElement('meta'); cs.setAttribute('charset', 'utf-8');
  const font = doc.createElement('link');
  font.setAttribute('rel', 'stylesheet');
  font.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@400;600;700;900&display=swap');
  head.prepend(cs, csp, font);
  const host = doc.createElement('style');
  host.textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }
html, body { margin: 0; padding: 0; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.od-poster { width: ${w}mm !important; height: ${h}mm !important; overflow: hidden !important; position: relative; }
[data-slot="qr"] svg { display: block; width: 100%; height: auto; }
@media screen { body { background: #5b5e66; padding: 16px 0; } .od-poster { margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,.35); } }`;
  head.append(host);
  if (!doc.querySelector('title')) { const t = doc.createElement('title'); t.textContent = 'AI 디자인 시안'; head.append(t); }
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

export function previewScale(paper, boxWidth) {
  const pw = paper[0] * PX_PER_MM, ph = paper[1] * PX_PER_MM;
  const k = Math.min(1, (boxWidth || 520) / pw);
  return { pw, ph, k };
}

// 포스터에 나온 글 중 자료(브리프)에 없는 것과, 빠진 필수 정보를 찾는다 (경고용 — 사람이 확인)
const norm = (t) => String(t || '').toLowerCase().normalize('NFC').replace(/[\s ·•|,.:;()[\]{}'"“”‘’«»\-–—~/\\!?@#&*_+=<>№]/g, '');
const DATE_WORDS = /(년|월|일|요일|오전|오후|시|분|[월화수목금토일]|am|pm|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi;
export function factCheck(finalHtml, facts, required) {
  const doc = new DOMParser().parseFromString(finalHtml, 'text/html');
  doc.querySelectorAll('style, script, [data-slot="qr"]').forEach((n) => n.remove());
  const corpus = norm(facts);
  const digits = new Set((String(facts).match(/\d+/g) || []).map((d) => String(Number(d))));
  const labels = new Set(LABELS.map(norm));
  const segs = [];
  const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    for (const part of n.textContent.split(/\n|(?<=\S)\s{2,}(?=\S)/)) { const s = part.trim(); if (s) segs.push(s); }
  }
  const unknown = [];
  for (const s of segs) {
    const n = norm(s);
    if (!n || n.length < 2 || corpus.includes(n) || labels.has(n)) continue;
    const nums = s.match(/\d+/g) || [];
    const rest = n.replace(/\d+/g, '').replace(DATE_WORDS, '');
    if (nums.length && nums.every((d) => digits.has(String(Number(d)))) && (!rest || labels.has(rest))) continue;
    unknown.push(s);
  }
  const all = norm(segs.join(' '));
  const nums = new Set((segs.join(' ').match(/\d+/g) || []).map((d) => String(Number(d))));
  const has = (r) => {
    if (r.kind === 'date') {  // 2027-02-11 → 2027·2·11 이 모두 숫자로 들어 있으면 표기 방식은 상관없음
      const m = String(r.value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return !m || [m[1], m[2], m[3]].every((x) => nums.has(String(Number(x))));
    }
    return all.includes(norm(r.value));
  };
  const missing = (required || []).filter((r) => r.value && !has(r)).map((r) => r.label);
  return { unknown: Array.from(new Set(unknown)).slice(0, 15), missing };
}

// ---------------------------------------------------------------- 홈페이지 배색·첫 화면 그림
export const THEME_KEYS = ['--primary', '--primary-deep', '--hero-end', '--accent', '--accent-ink', '--accent-hover', '--accent-soft', '--bg', '--surface', '--ink', '--line', '--soft'];
export const FONTS = {
  serif: '"Noto Serif KR", "Nanum Myeongjo", Georgia, "Times New Roman", serif',
  sans: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
};
export function themeSystem({ craft }) {
  return `You are a brand / UI designer working like OpenDesign's design-system agents. Propose a colour and type direction for an academic event website that is rendered by a FIXED template (only CSS variables and the top-banner background image can change).

Output ONLY one JSON object (no prose, no code fences):
{"name": "Korean name of the direction, ≤ 20 chars", "summary": "one Korean sentence: what changes and why", "vars": { … }, "hero_svg": "<svg …>…</svg>"}

vars — only these keys, colours as #rrggbb:
- --primary, --primary-deep, --hero-end: the top banner gradient (deep → primary → end). White text sits on it with a dark overlay: keep white text ≥ 4.5:1 on --primary-deep and --primary.
- --primary is also used for links and table headers on --bg (≥ 4.5:1 on --bg).
- --accent: highlight for dates, labels and the main button; --accent-ink: text on --accent (≥ 4.5:1); --accent-hover: slightly lighter accent; --accent-soft: very light tint of accent for soft backgrounds.
- --bg (page background, near-white or very light), --surface (cards, usually #ffffff or close), --ink (body text, ≥ 7:1 on --bg), --line (hairlines), --soft (light section background).
- --font-head: "serif" or "sans" (display font for headings). --radius: corner radius between "0px" and "24px".

hero_svg — an abstract decorative background for the top banner:
- root <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice">, ≤ 12 KB.
- shapes, lines, grids, curves, tilings only, in the palette above. The host darkens it with a 45–72 % overlay and puts white text on top, so keep it mid-to-dark with low internal contrast.
- NO text, letters, digits, people, faces, logos, <image>, <script>, <foreignObject>, <a>, external references or event handlers.

If the current palette is a university/college preset, keep its identity (same hue family for --primary-deep/--primary) unless the organiser asks otherwise.

Craft rules (OpenDesign craft/, Apache-2.0):
${craft}`;
}
export function themeMessage({ title, host, current, presetName, style, extra }) {
  const st = STYLES.find((s) => s.id === style) || STYLES[0];
  return `Event: ${title || '(untitled)'}${host ? ` — host: ${host}` : ''}
Current palette (${presetName || 'custom'}): ${JSON.stringify(current)}
Design direction: ${st.text}
${extra ? `Additional request from the organiser (Korean): ${extra}` : ''}`;
}
export function parseThemeProposal(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('AI 응답에서 제안(JSON)을 찾지 못했습니다. 다시 시도해 주세요.');
  const j = JSON.parse(t.slice(a, b + 1));
  const vars = {};
  const dropped = [];
  for (const [k, v] of Object.entries(j.vars || {})) {
    if (THEME_KEYS.includes(k) && typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())) vars[k] = v.trim().toLowerCase();
    else if (k === '--font-head' && FONTS[String(v).trim().toLowerCase()]) vars[k] = FONTS[String(v).trim().toLowerCase()];
    else if (k === '--radius' && /^\d{1,2}px$/.test(String(v).trim()) && parseInt(v, 10) <= 24) { vars['--radius'] = String(v).trim(); vars['--radius-sm'] = Math.round(parseInt(v, 10) * 0.57) + 'px'; }
    else dropped.push(k);
  }
  if (!Object.keys(vars).length) throw new Error('AI 가 쓸 수 있는 배색 값을 주지 않았습니다. 다시 시도해 주세요.');
  return { name: String(j.name || 'AI 제안').slice(0, 40), summary: String(j.summary || '').slice(0, 300), vars, svg: cleanSvg(j.hero_svg), dropped };
}
export function cleanSvg(src) {
  if (!src || typeof src !== 'string' || src.length > 60000) return '';
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return '';
  svg.querySelectorAll('script, foreignObject, image, iframe, a, text, tspan, textPath, style').forEach((n) => n.remove());
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const name of el.getAttributeNames()) {
      const v = el.getAttribute(name) || '';
      const low = name.toLowerCase();
      if (low.startsWith('on') || ((low === 'href' || low === 'xlink:href') && !v.startsWith('#')) || /url\(\s*['"]?(?!#)/i.test(v) || /javascript:/i.test(v)) el.removeAttribute(name);
    }
  }
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 1600 640');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  return new XMLSerializer().serializeToString(svg);
}
