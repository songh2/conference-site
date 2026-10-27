// 자료(공문·포스터·안내 메일)를 AI 에 보내 conference.json 초안을 받는다.
// API 키는 사용자의 것이며 이 브라우저에서 고른 AI 서비스로만 보낸다(이 웹 도구의 서버는 없다).
import { writeTemp, call } from './engine.js';

export const PROVIDERS = {
  factchat: {
    name: '팩트챗 (서울대 구성원)',
    group: '서울대 구성원',
    base: 'https://api.baze.co/v1/gateway', // 서울대 개발자 문서(docs.factchat.kr/docs/snu) 기준, 2026-10-27 확인
    model: 'claude-sonnet-5',
    slash: true, // 이 게이트웨이의 주소는 끝에 / 가 붙는다
    keyHelp: '서울대 팩트챗의 API Gateway 에서 만든 키. 사용료는 키를 만든 계정의 크레딧에서 차감됩니다.',
    modelHelp: 'Claude 계열(claude-…)은 포스터 같은 그림도 읽습니다. 다른 모델은 이 주소에서 글자만 읽으므로, 글자가 들어 있는 PDF·한글·워드 파일에 쓰세요.',
  },
  openai: {
    name: 'OpenAI (개인 계정)',
    group: '개인적으로 쓰는 LLM 서비스',
    base: 'https://api.openai.com/v1',
    model: 'gpt-6-luna',
    slash: false,
    keyHelp: '본인이 OpenAI 개발자 플랫폼(platform.openai.com)에서 만든 키. 사용료는 본인 계정에서 나갑니다. ChatGPT 요금제와 API 요금은 따로 계산될 수 있습니다.',
    modelHelp: '모델 이름은 바뀔 수 있습니다. "모델 목록 불러오기"로 확인하세요.',
  },
  custom: {
    name: '직접 입력 (다른 서비스, OpenAI 호환 주소)',
    group: '개인적으로 쓰는 LLM 서비스',
    base: '',
    model: '',
    slash: false,
    keyHelp: '본인이 쓰는 그 서비스에서 받은 키. 주소·모델 이름은 그 서비스의 개발자 문서를 확인하세요.',
    modelHelp: '그 서비스의 모델 이름',
  },
};

const SKEY = 'conf-builder:ai';
const KKEY = 'conf-builder:aikey';
// 키는 기본적으로 이 화면(메모리)에만 둔다. 새로고침하면 사라진다.
// "키 기억"을 켰을 때만 이 브라우저의 localStorage 에 남긴다(같은 주소의 다른 페이지도 읽을 수 있어 권장하지 않음).
let memoryKey = '';
export const OFFICIAL_HOSTS = ['api.baze.co', 'factchat-cloud.mindlogic.ai', 'api.openai.com'];
const OLD_FACTCHAT_BASE = 'https://factchat-cloud.mindlogic.ai/v1/gateway'; // 예전 판의 기본값 → 서울대 주소로 바꿔 준다

export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { s = {}; }
  s.provider = PROVIDERS[s.provider] ? s.provider : 'factchat';
  const p = PROVIDERS[s.provider];
  s.base = s.base || p.base;
  if (s.provider === 'factchat' && s.base.replace(/\/+$/, '') === OLD_FACTCHAT_BASE) s.base = p.base;
  s.model = s.model || p.model;
  s.remember = !!s.remember;
  let stored = '';
  try {
    sessionStorage.removeItem(KKEY); // 예전 판이 남긴 값 정리
    stored = s.remember ? (localStorage.getItem(KKEY) || '') : '';
    if (!s.remember) localStorage.removeItem(KKEY);
  } catch (e) { stored = ''; }
  s.key = memoryKey || stored;
  return s;
}
export function saveSettings(s) {
  memoryKey = s.key || '';
  try {
    localStorage.setItem(SKEY, JSON.stringify({ provider: s.provider, base: s.base, model: s.model, remember: s.remember, sendImages: s.sendImages }));
    if (s.remember && s.key) localStorage.setItem(KKEY, s.key); else localStorage.removeItem(KKEY);
    sessionStorage.removeItem(KKEY);
  } catch (e) { /* 저장할 수 없으면 이번 화면에서만 쓴다 */ }
}
export function forgetKey() {
  memoryKey = '';
  try { localStorage.removeItem(KKEY); sessionStorage.removeItem(KKEY); } catch (e) { /* ignore */ }
}

// 보낼 주소 확인: https 가 아니면 보내지 않고, 공식 주소가 아니면 화면에서 한 번 더 묻는다
export function baseStatus(base) {
  let u;
  try { u = new URL(base); } catch (e) { return { ok: false, reason: '주소 형식이 올바르지 않습니다.' }; }
  if (u.protocol !== 'https:') return { ok: false, host: u.host, reason: 'https:// 로 시작하는 주소만 쓸 수 있습니다(키가 암호화되지 않은 채 전송될 수 있음).' };
  return { ok: true, official: OFFICIAL_HOSTS.includes(u.host), host: u.host };
}
// 오탈자 확인용: 키 전체를 보이지 않고 모양만 알려 준다
export function keyShape(k) {
  const v = k || '';
  if (!v) return { ok: false, text: '키가 비어 있습니다.' };
  if (/\s/.test(v.trim())) return { ok: false, text: '키 중간에 빈칸이나 줄바꿈이 있습니다. 다시 복사해 붙여 넣으세요.' };
  if (/[^\x21-\x7e]/.test(v.trim())) return { ok: false, text: '키에 한글이나 특수 기호가 섞여 있습니다. 다시 복사해 붙여 넣으세요.' };
  const t = v.trim();
  const trimmed = t !== v ? ' · 앞뒤 빈칸은 자동으로 지웁니다' : '';
  return { ok: true, text: t.length > 10 ? `입력됨: ${t.slice(0, 4)}…${t.slice(-4)} (${t.length}자)${trimmed}` : `입력됨: ${t.length}자 — 너무 짧습니다. 끝까지 복사했는지 확인하세요.` };
}

function endpoint(s, path) {
  const base = (s.base || '').replace(/\/+$/, '');
  const slash = (PROVIDERS[s.provider] || {}).slash;
  return base + path + (slash ? '/' : '');
}
export function apiFormat(s) {
  return s.provider === 'factchat' && /^claude/i.test(s.model || '') ? 'anthropic' : 'openai';
}
export function canSendImages(s) {
  if (apiFormat(s) === 'anthropic') return true;
  if (s.provider === 'factchat') return false; // 팩트챗 Chat Completions 는 글자 전용(공식 문서)
  return s.sendImages !== false;
}

async function fetchJson(url, opts, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs || 240000);
  let res;
  try { res = await fetch(url, { ...opts, signal: ctl.signal }); }
  catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error('응답이 너무 오래 걸려 중단했습니다. 파일 수를 줄이거나 다른 모델을 써 보세요.');
    throw new Error('AI 서비스에 연결하지 못했습니다(주소·인터넷 연결 확인). ' + e.message);
  }
  clearTimeout(t);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch (e) { body = null; }
  if (!res.ok) {
    const msg = (body && (body.error && (body.error.message || body.error) || body.detail && (body.detail.message || body.detail))) || text.slice(0, 300);
    const hint = { 401: '키가 틀렸거나 만료되었습니다.', 403: '이 키로 쓸 수 없는 모델이거나 권한이 없습니다.', 404: '주소나 모델 이름을 확인하세요.', 413: '보낸 자료가 너무 큽니다. 파일 수나 쪽수를 줄이세요.', 429: '사용 한도나 크레딧을 확인하세요(잠시 뒤 다시 시도).' }[res.status] || '';
    throw new Error(`AI 서비스 오류 ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)} ${hint}`);
  }
  if (!body) throw new Error('AI 서비스가 알 수 없는 응답을 보냈습니다: ' + text.slice(0, 200));
  return body;
}

export async function listModels(s) {
  if (!s.key) throw new Error('API 키를 먼저 넣어 주세요.');
  const st = baseStatus(s.base); if (!st.ok) throw new Error(st.reason);
  const body = await fetchJson(endpoint(s, '/models'), { headers: { Authorization: 'Bearer ' + s.key } }, 30000);
  const arr = Array.isArray(body) ? body : (body.data || body.models || []);
  return arr.map((m) => (typeof m === 'string' ? { id: m } : m)).filter((m) => m && m.id && (!m.type || m.type === 'llm'));
}

// ---------- 자료 읽기 ----------
const MAX_PAGES = 8;
const MAX_IMAGES = 12;
const LONG_SIDE = 1568;
let pdfjs = null;
async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  const base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/';
  pdfjs = await import(base + 'pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
  return pdfjs;
}
function canvasToJpeg(canvas) {
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}
async function imageToJpeg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('그림을 열 수 없습니다: ' + file.name)); i.src = url; });
    const k = Math.min(1, LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return canvasToJpeg(c);
  } finally { URL.revokeObjectURL(url); }
}

export async function readFiles(files, onProgress) {
  const parts = [];
  const notes = [];
  let images = 0;
  for (const [n, f] of Array.from(files).entries()) {
    const name = f.name;
    const low = name.toLowerCase();
    onProgress && onProgress(`자료 읽는 중 (${n + 1}/${files.length}): ${name}`);
    if (low.endsWith('.pdf')) {
      const lib = await loadPdfjs();
      const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      const pages = Math.min(doc.numPages, MAX_PAGES);
      if (doc.numPages > MAX_PAGES) notes.push(`${name}: ${doc.numPages}쪽 중 앞 ${MAX_PAGES}쪽만 읽었습니다.`);
      for (let p = 1; p <= pages; p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        const text = tc.items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+\n/g, '\n').trim();
        if (text) parts.push({ kind: 'text', name: `${name} ${p}쪽`, text });
        if (text.length < 300 && images < MAX_IMAGES) {
          // 글자가 거의 없는 쪽(그림으로 된 포스터 등)은 그림으로 보낸다
          const vp1 = page.getViewport({ scale: 1 });
          const k = LONG_SIDE / Math.max(vp1.width, vp1.height);
          const vp = page.getViewport({ scale: k });
          const c = document.createElement('canvas');
          c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
          await page.render({ canvasContext: g, viewport: vp, canvas: c }).promise;
          parts.push({ kind: 'image', name: `${name} ${p}쪽`, mime: 'image/jpeg', data: canvasToJpeg(c) });
          images++;
        }
      }
    } else if (/\.(png|jpe?g|webp|gif)$/.test(low)) {
      if (images >= MAX_IMAGES) { notes.push(`${name}: 그림이 너무 많아 건너뛰었습니다(최대 ${MAX_IMAGES}장).`); continue; }
      parts.push({ kind: 'image', name, mime: 'image/jpeg', data: await imageToJpeg(f) });
      images++;
    } else if (/\.(txt|md|csv|json|hwpx|docx)$/.test(low)) {
      const p = await writeTemp(name, new Uint8Array(await f.arrayBuffer()));
      const text = await call('extract_text', p);
      if (text.trim()) parts.push({ kind: 'text', name, text: text.trim() });
      else notes.push(`${name}: 글자를 찾지 못했습니다.`);
    } else if (low.endsWith('.hwp')) {
      notes.push(`${name}: 예전 한글 형식(.hwp)은 읽을 수 없습니다. 한글에서 "다른 이름으로 저장 → PDF 또는 HWPX"로 저장해 올려 주세요.`);
    } else {
      notes.push(`${name}: 지원하지 않는 형식입니다(PDF, 그림, 한글 HWPX, 워드 DOCX, 텍스트만).`);
    }
  }
  return { parts, notes };
}

// ---------- 요청 만들기 ----------
export function systemPrompt({ schema, skeleton, themes, today }) {
  const themeIds = (themes || []).map((t) => `${t.id}(${(t.name && t.name.ko) || ''})`).join(', ');
  return `너는 학회·워크숍·세미나 홈페이지를 만드는 도구의 "자료 정리" 단계다.
사용자가 준 자료(공문, 포스터, 안내 메일 등)를 읽고, 아래 형식의 conference.json 을 JSON 객체 하나로만 출력한다.
설명 문장·마크다운·코드 블록 표시(\`\`\`)를 쓰지 않는다. 출력 전체가 JSON 이어야 한다.

[반드시 지킬 것]
1. 사실만 적는다. 자료에 없는 소개글·연사·등록비·마감일·영문 표기·이메일을 지어내지 않는다. 모르면 "" 나 [] 로 두고, "_todo" 배열에 무엇을 확인해야 하는지 한국어로 적는다.
2. 모든 문장은 {"ko": "...", "en": "..."} 쌍이다. 사람 이름의 영문 표기는 자료에 적혀 있을 때만 쓴다. 행사명·제목 등을 직접 번역했다면 _todo 에 "영문 번역 검토"를 남긴다.
3. 날짜는 YYYY-MM-DD, 시간은 "HH:MM–HH:MM" (끝이 열려 있으면 "18:00–").
4. "예정", "미정", "추후 확정"인 날·항목은 "tentative": true.
5. 등록·휴식·식사·만찬·회의 항목은 kind 를 registration / break / meal / social / meeting 으로 적는다.
6. 발표자가 있으면 speakers[] 에 id(영문 소문자·숫자·하이픈)를 붙이고, program 항목의 speaker_id 로 연결한다. 초록은 요약·윤문하지 말고 원문 그대로 옮기며 수식은 $...$ 로 쓴다.
7. 이메일·전화번호는 자료에 공개된 문의처만 contact 에 넣는다. 참가자 명단·개인 연락처는 넣지 않는다.
8. slug 는 행사명을 바탕으로 영문 소문자·숫자·하이픈으로 짓는다(예: kms-fall-2026).
9. updated 는 오늘 날짜 ${today}.
10. 신청 링크(구글폼 등)가 자료에 글자로 있으면 registration.form_url 에 넣는다. QR 코드만 있어 주소를 읽을 수 없으면 _todo 에 "신청 링크 확인"을 남긴다.
11. theme 은 사용자가 요청했을 때만 바꾼다. 쓸 수 있는 id: ${themeIds}.
12. 자료가 여럿이면 서로 맞춰 보고, 서로 다르게 적힌 곳은 임의로 고르지 말고 _todo 에 적는다.

[항목 설명 — references/schema.md]
${schema}

[빈 틀 — 이 키 구조를 따른다]
${skeleton}`;
}

function userText(parts, extra) {
  const lines = [];
  if (extra && extra.trim()) lines.push('[사용자 요청]\n' + extra.trim() + '\n');
  lines.push('[자료]');
  parts.forEach((p, i) => {
    if (p.kind === 'text') lines.push(`--- 자료 ${i + 1}: ${p.name} (글자) ---\n${p.text}`);
    else lines.push(`--- 자료 ${i + 1}: ${p.name} (그림으로 첨부) ---`);
  });
  lines.push('\n위 자료로 conference.json 을 JSON 객체 하나로 출력하세요.');
  return lines.join('\n');
}

export async function extract(s, system, parts, extra) {
  if (!s.key) throw new Error('API 키를 넣어 주세요.');
  if (!s.model) throw new Error('모델 이름을 넣어 주세요.');
  const st = baseStatus(s.base); if (!st.ok) throw new Error(st.reason);
  const fmt = apiFormat(s);
  const imgs = canSendImages(s) ? parts.filter((p) => p.kind === 'image') : [];
  const dropped = parts.filter((p) => p.kind === 'image').length - imgs.length;
  const textParts = parts.filter((p) => p.kind === 'text');
  if (!textParts.length && !imgs.length) {
    throw new Error(dropped ? '이 모델은 그림을 읽지 못하는데, 자료에 글자가 없습니다. 팩트챗이라면 claude-… 모델을 고르세요.' : '읽을 자료가 없습니다.');
  }
  const text = userText(textParts.concat(imgs.map((p) => ({ kind: 'image', name: p.name }))), extra);
  let body, url, headers;
  if (fmt === 'anthropic') {
    url = endpoint(s, '/claude/v1/messages');
    headers = { 'x-api-key': s.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
    body = {
      model: s.model, max_tokens: 16000, system,
      messages: [{ role: 'user', content: imgs.map((p) => ({ type: 'image', source: { type: 'base64', media_type: p.mime, data: p.data } })).concat([{ type: 'text', text }]) }],
    };
  } else {
    url = endpoint(s, '/chat/completions');
    headers = { Authorization: 'Bearer ' + s.key, 'content-type': 'application/json' };
    const content = imgs.length ? [{ type: 'text', text }].concat(imgs.map((p) => ({ type: 'image_url', image_url: { url: `data:${p.mime};base64,${p.data}` } }))) : text;
    body = { model: s.model, messages: [{ role: 'system', content: system }, { role: 'user', content }] };
    if (s.provider === 'openai') body.response_format = { type: 'json_object' };
  }
  const res = await fetchJson(url, { method: 'POST', headers, body: JSON.stringify(body) });
  let out = '';
  if (fmt === 'anthropic') out = (res.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  else {
    const m = res.choices && res.choices[0] && res.choices[0].message;
    out = m ? (typeof m.content === 'string' ? m.content : (m.content || []).map((c) => c.text || '').join('')) : '';
  }
  return { text: out, usage: res.usage || null, dropped, format: fmt };
}

export function parseJson(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('AI 응답에서 JSON 을 찾지 못했습니다.');
  return JSON.parse(t.slice(a, b + 1));
}

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(isEmpty));
// mode 'fill': 지금 비어 있는 칸만 채운다 / 'replace': 자료 내용으로 바꾸되 테마·로고·포스터 설정은 지금 것을 지킨다
export function merge(current, incoming, mode) {
  if (mode === 'replace') {
    const out = JSON.parse(JSON.stringify(incoming));
    for (const k of ['theme', 'logo', 'email_protection', 'poster', 'site_url']) {
      if (current[k] != null && !isEmpty(current[k]) && (isEmpty(out[k]) || (k === 'theme' && out[k] === 'default'))) out[k] = current[k];
    }
    return out;
  }
  const fill = (cur, inc) => {
    if (isEmpty(cur)) return inc === undefined ? cur : JSON.parse(JSON.stringify(inc));
    if (cur && inc && typeof cur === 'object' && typeof inc === 'object' && !Array.isArray(cur) && !Array.isArray(inc)) {
      const o = { ...cur };
      for (const k of Object.keys(inc)) o[k] = fill(cur[k], inc[k]);
      return o;
    }
    return cur;
  };
  const out = fill(current, incoming);
  const todo = [].concat(current._todo || [], incoming._todo || []);
  if (todo.length) out._todo = Array.from(new Set(todo));
  return out;
}
