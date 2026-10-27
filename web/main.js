// conference-site 웹 도구 — 화면 연결
import { TABS } from './fields.js';
import { renderFields, getPath, h } from './form.js';
import * as E from './engine.js';
import * as AI from './ai.js';

const DRAFT_KEY = 'conf-builder:draft';
const REPO = 'https://github.com/songh2/conference-site';
const state = { data: null, tab: 'start', openSet: new Set(), themes: [], check: null, savedAt: null, aiResult: null, device: 'pc' };
const $ = (sel) => document.querySelector(sel);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const tl = (o) => (o && typeof o === 'object' ? (o.ko || o.en || '') : (o || ''));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// ---------------------------------------------------------------- 시작
init();
async function init() {
  wireChrome();
  await E.loadSavedAssets();
  state.data = loadDraft() || await freshData();
  renderNav();
  renderTab();
  bootEngine();
}
function bootEngine() {
  E.start(setStatus).then(async () => {
    state.themes = await E.callJson('themes_list');
    if (['design', 'poster'].includes(state.tab)) renderTab();
    refreshPreview(); refreshCheck();
  }).catch((e) => setStatus('error', e.message));
}
function setStatus(msg, detail) {
  const el = $('#engine');
  el.className = 'engine ' + (msg === 'ready' ? 'ok' : msg === 'error' ? 'bad' : 'busy');
  el.innerHTML = '';
  if (msg === 'ready') el.textContent = '● 준비됨';
  else if (msg === 'error') {
    el.append('● 엔진을 불러오지 못했습니다 ');
    el.appendChild(h('button', { type: 'button', class: 'btn-sm', text: '다시 시도', onclick: bootEngine }));
    el.title = detail || '';
    toast('파이썬 엔진을 불러오지 못했습니다: ' + (detail || '') + ' — 인터넷 연결을 확인하고 다시 시도하세요.', 'bad');
  } else el.textContent = '◌ ' + msg;
}

async function freshData() {
  const r = await fetch('template/conference.skeleton.json', { cache: 'no-cache' });
  const d = await r.json();
  for (const k of Object.keys(d)) if (k.startsWith('_')) delete d[k];
  d.slug = '';
  d.updated = today();
  return d;
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    state.savedAt = v.savedAt || null;
    return v.data || null;
  } catch (e) { return null; }
}
function saveNow() {
  try {
    state.savedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: state.data, savedAt: state.savedAt }));
    $('#saved').textContent = '자동 저장 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { $('#saved').textContent = '자동 저장 안 됨(브라우저 저장 공간 문제) — 원본 저장을 이용하세요'; }
}
const saveDraft = debounce(saveNow, 400);

function setData(d, why) {
  state.data = d;
  state.openSet.clear();
  saveNow(); // 통째로 바뀌는 경우는 바로 저장
  renderNav(); renderTab();
  refreshPreview(); refreshCheck();
  if (why) toast(why);
}

// ---------------------------------------------------------------- 화면 틀
function wireChrome() {
  $('#dev-pc').addEventListener('click', () => setDevice('pc'));
  $('#dev-mobile').addEventListener('click', () => setDevice('mobile'));
  $('#open-preview').addEventListener('click', openPreviewWindow);
  $('#reload-preview').addEventListener('click', () => refreshPreview(true));
  $('#btn-zip').addEventListener('click', downloadZip);
  $('#btn-save').addEventListener('click', downloadOriginal);
  $('#toggle-preview').addEventListener('click', () => document.body.classList.toggle('show-preview'));
}
function setDevice(d) {
  state.device = d;
  $('#preview-frame').className = d === 'mobile' ? 'mobile' : '';
  $('#dev-pc').setAttribute('aria-pressed', d === 'pc'); $('#dev-mobile').setAttribute('aria-pressed', d === 'mobile');
}
function renderNav() {
  const nav = $('#tabs');
  nav.innerHTML = '';
  for (const t of TABS) {
    const b = h('button', { type: 'button', class: 'tab' + (t.id === state.tab ? ' on' : ''), 'aria-current': t.id === state.tab ? 'page' : null, onclick: () => { state.tab = t.id; state.openSet.clear(); renderNav(); renderTab(); $('#panel').scrollTop = 0; } }, [h('span', { class: 'ti', text: t.icon }), h('span', { text: t.title })]);
    if (t.id === 'export' && state.check) {
      const n = state.check.errors.length;
      const w = state.check.warnings.length;
      if (n) b.appendChild(h('span', { class: 'badge bad', text: String(n) }));
      else if (w) b.appendChild(h('span', { class: 'badge warn', text: String(w) }));
      else b.appendChild(h('span', { class: 'badge ok', text: '✓' }));
    }
    nav.appendChild(b);
  }
}
function ctx() {
  return { root: () => state.data, openSet: state.openSet, themes: state.themes, changed };
}
function changed(path, opts) {
  saveDraft();
  schedulePreview(); scheduleCheck();
  if (opts && opts.structure) { const p = $('#panel'); const top = p.scrollTop; renderTab(); p.scrollTop = top; }
}
function renderTab() {
  const tab = TABS.find((t) => t.id === state.tab) || TABS[0];
  const panel = $('#panel');
  panel.innerHTML = '';
  panel.appendChild(h('h2', { class: 'panel-title', text: tab.title }));
  if (tab.fields) { const box = h('div', { class: 'form' }); renderFields(box, tab.fields, ctx()); panel.appendChild(box); }
  if (tab.custom && CUSTOM[tab.custom]) panel.appendChild(CUSTOM[tab.custom]());
  const i = TABS.indexOf(tab);
  const navRow = h('div', { class: 'step-nav' });
  if (i > 0) navRow.appendChild(h('button', { type: 'button', class: 'btn ghost', text: '← ' + TABS[i - 1].title, onclick: () => { state.tab = TABS[i - 1].id; renderNav(); renderTab(); panel.scrollTop = 0; } }));
  if (i < TABS.length - 1) navRow.appendChild(h('button', { type: 'button', class: 'btn', text: TABS[i + 1].title + ' →', onclick: () => { state.tab = TABS[i + 1].id; renderNav(); renderTab(); panel.scrollTop = 0; } }));
  panel.appendChild(navRow);
}

// ---------------------------------------------------------------- 미리보기·검사
const schedulePreview = debounce(() => refreshPreview(), 700);
const scheduleCheck = debounce(() => refreshCheck(), 700);
let lastHtml = '';
async function refreshPreview() {
  if (!E.isReady()) return;
  try {
    lastHtml = await E.call('preview', JSON.stringify(state.data));
    $('#preview-frame').srcdoc = lastHtml;
    $('#preview-msg').textContent = '';
  } catch (e) { $('#preview-msg').textContent = '미리보기를 만들지 못했습니다: ' + e.message; }
}
function openPreviewWindow() {
  if (!lastHtml) return toast('미리보기가 아직 없습니다.');
  const url = URL.createObjectURL(new Blob([lastHtml], { type: 'text/html' }));
  window.open(url, '_blank', 'noopener');
}
async function refreshCheck() {
  if (!E.isReady()) return;
  try { state.check = await E.callJson('check', JSON.stringify(state.data)); }
  catch (e) { state.check = { errors: [e.message], warnings: [] }; }
  state.check.missing = missingAssets();
  if (!state.data.slug) state.check.errors.unshift('"주소용 이름(slug)"을 정해 주세요 (기본 정보 탭).');
  renderNav();
  const box = $('#check-results');
  if (box) box.replaceWith(checkResults());
}
function missingAssets() {
  const out = [];
  const walk = (o) => {
    if (typeof o === 'string') { if (o.startsWith('assets/') && !E.assets.has(o)) out.push(o); }
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk(state.data);
  return Array.from(new Set(out));
}

// ---------------------------------------------------------------- 내려받기
function save(bytesOrText, name, type) {
  const blob = bytesOrText instanceof Blob ? bytesOrText : new Blob([bytesOrText], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a); a.click(); a.remove();
}
async function downloadZip() {
  if (!E.isReady()) return toast('파이썬 엔진이 아직 준비되지 않았습니다.');
  await refreshCheck();
  if (state.check.errors.length) { state.tab = 'export'; renderNav(); renderTab(); return toast('검사 오류를 먼저 고쳐 주세요.', 'bad'); }
  try {
    const bytes = await E.call('make_zip', JSON.stringify(state.data));
    save(bytes, `${state.data.slug || 'site'}-homepage.zip`, 'application/zip');
    toast('배포용 ZIP 을 내려받았습니다. "GitHub에 올리기" 탭의 순서대로 올리세요.');
  } catch (e) { toast('ZIP 을 만들지 못했습니다: ' + e.message, 'bad'); }
}
function downloadOriginal() {
  save(JSON.stringify(state.data, null, 2) + '\n', `${state.data.slug || 'site'}-conference.json`, 'application/json');
  toast('원본 conference.json 을 저장했습니다. 이메일이 평문으로 들어 있으니 공개 저장소에 올리지 말고 보관하세요.');
}

// ---------------------------------------------------------------- 불러오기
async function startNew() {
  if (!confirm('지금 내용을 지우고 새로 시작할까요? (먼저 "원본 저장"을 해 두면 나중에 다시 불러올 수 있습니다)')) return;
  await E.clearAssets();
  setData(await freshData(), '새 행사를 시작합니다. "기본 정보"부터 채우세요.');
}
async function startExample() {
  if (!confirm('예시 행사(가상 데이터)로 바꿀까요? 지금 내용은 사라집니다.')) return;
  const m = E.getManifest() || await (await fetch('web/manifest.json', { cache: 'no-cache' })).json();
  const d = await (await fetch(m.example.conference + '?v=' + m.version)).json();
  await E.clearAssets();
  for (const a of m.example.assets) {
    const r = await fetch(m.example.base + '/' + a + '?v=' + m.version);
    if (r.ok) await E.putAsset(a, new Uint8Array(await r.arrayBuffer()), r.headers.get('content-type') || '');
  }
  setData(d, '예시 행사를 불러왔습니다. 모든 사람·기관·일정은 가상입니다.');
}
async function importFile(file) {
  const low = file.name.toLowerCase();
  try {
    if (low.endsWith('.json')) {
      const d = JSON.parse(await file.text());
      if (!d || typeof d !== 'object' || !('title' in d || 'slug' in d)) throw new Error('conference.json 형식이 아닙니다.');
      setData(d, 'conference.json 을 불러왔습니다.' + (JSON.stringify(d).includes('"email_enc"') ? ' (공개본이라 이메일은 난독화된 상태입니다)' : ''));
    } else if (low.endsWith('.zip')) {
      const p = await E.writeTemp(file.name, new Uint8Array(await file.arrayBuffer()));
      await E.clearAssets();
      const r = await E.callJson('import_zip', p);
      for (const a of r.assets) await E.syncAssetFromFs(a);
      setData(JSON.parse(r.json), `ZIP 을 불러왔습니다 (파일 ${r.assets.length}개 포함).`);
    } else throw new Error('conference.json 또는 .zip 파일을 골라 주세요.');
  } catch (e) { toast('불러오지 못했습니다: ' + e.message, 'bad'); }
}

// ---------------------------------------------------------------- 탭별 화면
const CUSTOM = {
  start() {
    const box = h('div', { class: 'custom' });
    box.appendChild(h('p', { class: 'lead', text: '행사 정보를 채우면 오른쪽에 홈페이지가 바로 보입니다. 다 되면 ZIP 을 받아 GitHub 에 올리면 끝입니다. 입력한 내용은 이 브라우저에만 자동 저장되며, 이 도구는 어떤 서버에도 내용을 보내지 않습니다(아래 AI 기능을 쓸 때만 고른 AI 서비스로 자료가 전송됩니다).' }));
    const file = h('input', { type: 'file', accept: '.json,.zip,application/json,application/zip', class: 'hidden-file', onchange: (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; } });
    box.appendChild(h('div', { class: 'start-cards' }, [
      h('button', { type: 'button', class: 'start-card', onclick: startNew }, [h('b', { text: '새로 만들기' }), h('span', { text: '빈 양식에서 시작' })]),
      h('button', { type: 'button', class: 'start-card', onclick: startExample }, [h('b', { text: '예시로 둘러보기' }), h('span', { text: '모든 칸이 채워진 가상 행사' })]),
      h('button', { type: 'button', class: 'start-card', onclick: () => file.click() }, [h('b', { text: '불러오기' }), h('span', { text: '보관한 conference.json 이나 예전 ZIP' })]),
      file,
    ]));
    const cur = state.data;
    box.appendChild(h('div', { class: 'note' }, [
      h('b', { text: '지금 작업 중: ' }), tl(cur.title) || '(행사명 없음)', cur.slug ? ` (${cur.slug})` : '',
      state.savedAt ? ` · 마지막 자동 저장 ${new Date(state.savedAt).toLocaleString('ko-KR')}` : '',
    ]));
    box.appendChild(aiPanel());
    box.appendChild(h('div', { class: 'tips' }, [
      h('h3', { text: '다른 방법' }),
      h('p', {}, ['ChatGPT Edu·Claude·Codex 에 스킬을 올려 대화로 만들 수도 있습니다. 거기서 받은 conference.json 을 위 "불러오기"로 열면 이어서 고칠 수 있습니다. → ', h('a', { href: REPO, target: '_blank', rel: 'noopener', text: '스킬 저장소' })]),
    ]));
    return box;
  },

  registration() {
    const box = h('div', { class: 'custom box' });
    box.appendChild(h('h3', { text: '구글 시트 연결 (홈페이지 안 등록 양식)' }));
    box.appendChild(h('p', { text: '등록 내용이 구글 시트에 한 줄씩 쌓이게 합니다. 처음 한 번 20~30분 걸리고, 구글 계정 작업이라 직접 하셔야 합니다.' }));
    box.appendChild(h('ol', { class: 'steps' }, [
      h('li', { text: '위의 "참석 구분"과 "개인정보 수집·이용 안내문"을 먼저 채웁니다.' }),
      h('li', {}, ['아래 ', h('b', { text: '접수 스크립트 만들기' }), '를 누르고 코드를 복사합니다.']),
      h('li', { text: '구글 드라이브 → 새로 만들기 → Google 스프레드시트. 계정은 학교·부서 공용 계정을 권장합니다(행사 뒤에도 유지·인수인계).' }),
      h('li', { text: '시트 메뉴 확장 프로그램 → Apps Script → 기본 코드를 모두 지우고 붙여 넣기 → 저장(Ctrl+S).' }),
      h('li', { text: '위쪽 함수 목록에서 setup 을 골라 ▶ 실행 → 권한 검토 → (경고가 나오면) 고급 → 이동 → 허용. 시트에 "등록", "집계" 탭이 생기면 성공.' }),
      h('li', { text: '배포 → 새 배포 → 유형 "웹 앱" → 다음 사용자로 실행: 나, 액세스: 모든 사용자 → 배포 → 웹 앱 URL(…/exec) 복사.' }),
      h('li', { text: '그 주소를 위 "홈페이지 안 등록 양식 접수 주소"에 붙여 넣습니다. 미리보기에 등록 양식이 나타납니다.' }),
      h('li', { text: '공개한 뒤 시험 등록을 한 번 하고, 시트에 줄이 생겼는지 확인한 뒤 그 줄을 지웁니다.' }),
    ]));
    const out = h('div');
    box.appendChild(h('button', {
      type: 'button', class: 'btn', text: '접수 스크립트 만들기',
      onclick: async () => {
        try {
          const r = await E.callJson('registration_code', JSON.stringify(state.data));
          const ta = h('textarea', { class: 'code', rows: 10, readonly: true });
          ta.value = r.code;
          out.innerHTML = '';
          out.append(
            h('div', { class: 'f-help', text: `참석 구분 ${r.options}개, 날짜 열 ${r.days.length}개, 마감일 ${r.deadline || '미설정'}` + (r.options ? '' : ' — 참석 구분이 비어 있습니다!') }),
            ta,
            h('div', { class: 'row' }, [
              h('button', { type: 'button', class: 'btn-sm', text: '복사', onclick: async () => { try { await navigator.clipboard.writeText(r.code); toast('복사했습니다. Apps Script 에 붙여 넣으세요.'); } catch (e) { ta.select(); toast('복사 권한이 없어 글자를 선택해 두었습니다. Ctrl+C 를 누르세요.'); } } }),
              h('button', { type: 'button', class: 'btn-sm ghost', text: '파일로 받기 (.gs)', onclick: () => save(r.code, `${state.data.slug || 'site'}-registration-sheet.gs`, 'text/plain') }),
            ]));
        } catch (e) { toast('스크립트를 만들지 못했습니다: ' + e.message, 'bad'); }
      },
    }));
    box.appendChild(out);
    box.appendChild(h('p', { class: 'f-help' }, ['참석 구분이나 마감일을 바꾸면 스크립트를 다시 만들어 Apps Script 에 붙여 넣고 "배포 → 배포 관리 → 편집 → 새 버전"을 해야 합니다. 자세한 설명: ', h('a', { href: REPO + '/blob/main/references/registration-sheet.md', target: '_blank', rel: 'noopener', text: '등록 시트 안내' }), ' · ', h('a', { href: REPO + '/blob/main/docs/manual-google-sheet.md', target: '_blank', rel: 'noopener', text: '계정 고르기' })]));
    return box;
  },

  poster() {
    const box = h('div', { class: 'custom box' });
    box.appendChild(h('h3', { text: '포스터 만들기' }));
    box.appendChild(h('p', { class: 'f-help', text: '글은 모두 위에서 입력한 행사 정보에서 가져옵니다. 만든 뒤 "새 창에서 열기"를 누르고 Ctrl+P → 대상 "PDF로 저장", 여백 "없음", "배경 그래픽" 켜기로 저장하세요.' }));
    const p = state.data.poster || {};
    const sel = (opts, v) => { const s = h('select', { class: 'f-input f-short' }, opts.map(([a, b]) => h('option', { value: a, text: b }))); s.value = v; return s; };
    const lay = sel([['auto', '자동'], ['program', '일정표형'], ['speakers', '연사형'], ['lecture', '강연형'], ['photo', '사진형']], p.layout || 'auto');
    const size = sel([['A2', 'A2'], ['A1', 'A1'], ['A3', 'A3'], ['A4', 'A4']], (p.size || 'A2').toUpperCase());
    const lang = sel([['both', '한국어 + 영어'], ['ko', '한국어'], ['en', 'English']], p.lang || 'both');
    const th = sel([['', '홈페이지와 같은 배색']].concat(state.themes.map((t) => [t.id, (t.name && t.name.ko) || t.id])), '');
    box.appendChild(h('div', { class: 'poster-controls' }, [h('label', {}, ['배치 ', lay]), h('label', {}, ['크기 ', size]), h('label', {}, ['언어 ', lang]), h('label', {}, ['배색 ', th])]));
    const out = h('div', { class: 'poster-out' });
    let html = '';
    box.appendChild(h('div', { class: 'row' }, [
      h('button', {
        type: 'button', class: 'btn', text: '포스터 만들기',
        onclick: async () => {
          try {
            const r = await E.callJson('poster', JSON.stringify(state.data), lay.value === 'auto' ? 'auto' : lay.value, size.value, lang.value, th.value);
            html = r.html;
            out.innerHTML = '';
            const fr = h('iframe', { class: 'poster-frame', title: '포스터 미리보기', sandbox: 'allow-scripts' });
            fr.srcdoc = html;
            out.append(
              h('div', { class: 'f-help', text: `배치 ${r.info.layout} · ${r.info.size} · ${r.info.lang}` + (r.info.qr ? ' · QR 코드 포함' : '') }),
              ...r.info.warnings.map((w) => h('div', { class: 'msg warn', text: w })),
              fr,
              h('div', { class: 'row' }, [
                h('button', { type: 'button', class: 'btn-sm', text: '새 창에서 열기 (인쇄·PDF 저장)', onclick: () => window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank', 'noopener') }),
                h('button', { type: 'button', class: 'btn-sm ghost', text: 'HTML 파일로 받기', onclick: () => save(html, `poster-${r.info.layout}-${r.info.size}-${r.info.lang}.html`, 'text/html') }),
              ]));
          } catch (e) { toast('포스터를 만들지 못했습니다: ' + e.message, 'bad'); }
        },
      }),
      h('button', {
        type: 'button', class: 'btn ghost', text: 'OpenDesign 브리프 받기',
        onclick: async () => { try { const r = await E.callJson('opendesign_brief', JSON.stringify(state.data)); save(r.md, `${state.data.slug || 'site'}-poster-brief.md`, 'text/markdown'); toast('브리프를 받았습니다. AI 디자인 도구(OpenDesign 등)에 붙여 넣어 쓰세요.'); } catch (e) { toast('브리프를 만들지 못했습니다: ' + e.message, 'bad'); } },
      }),
    ]));
    box.appendChild(out);
    return box;
  },

  export() {
    const box = h('div', { class: 'custom' });
    box.appendChild(checkResults());
    box.appendChild(h('div', { class: 'export-cards' }, [
      h('div', { class: 'box' }, [
        h('h3', { text: '① 배포용 ZIP' }),
        h('p', { text: '홈페이지 파일(index.html), 공개본 conference.json(이메일 난독화, 확인 필요 메모 제거), 사진·PDF. 이 ZIP 을 풀어 GitHub 저장소에 올립니다.' }),
        h('button', { type: 'button', class: 'btn', text: '배포용 ZIP 받기', onclick: downloadZip }),
      ]),
      h('div', { class: 'box' }, [
        h('h3', { text: '② 원본 conference.json (보관용)' }),
        h('p', { text: '나중에 고칠 때 "불러오기"로 여는 파일. 이메일이 평문으로 들어 있으니 공개 저장소에 올리지 말고 학과 공유 폴더 등에 보관하세요. (사진은 들어 있지 않으니 사진 원본도 함께 보관)' }),
        h('button', { type: 'button', class: 'btn ghost', text: '원본 저장', onclick: downloadOriginal }),
      ]),
    ]));
    return box;
  },

  deploy() {
    const slug = state.data.slug || '저장소이름';
    const box = h('div', { class: 'custom' });
    box.appendChild(h('p', { class: 'lead', text: 'GitHub Pages 는 무료로 홈페이지를 올려 주는 GitHub 기능입니다. 처음 한 번 10분 정도 걸립니다.' }));
    box.appendChild(h('ol', { class: 'steps big' }, [
      h('li', {}, [h('b', { text: 'ZIP 받기·풀기: ' }), '"검사·내려받기" 탭에서 배포용 ZIP 을 받고, 오른쪽 클릭 → "압축 풀기"(Mac 은 더블클릭)합니다.']),
      h('li', {}, [h('b', { text: '저장소 만들기: ' }), 'github.com 에 로그인 → 오른쪽 위 ＋ → New repository → Repository name 에 ', h('code', { text: slug }), ' → ', h('b', { text: 'Public' }), ' → Create repository.']),
      h('li', {}, [h('b', { text: '파일 올리기: ' }), '새 저장소 화면의 "uploading an existing file" 링크 → 압축 푼 폴더를 열고 ', h('b', { text: '안의 파일과 assets 폴더를 모두' }), ' 끌어다 놓기 → 아래 Commit changes. (ZIP 파일 자체를 올리면 안 됩니다)']),
      h('li', {}, [h('b', { text: 'Pages 켜기: ' }), '저장소 Settings → 왼쪽 Pages → Source "Deploy from a branch" → Branch ', h('code', { text: 'main' }), ' / ', h('code', { text: '/(root)' }), ' → Save.']),
      h('li', {}, [h('b', { text: '주소 확인: ' }), '1~2분 뒤 같은 화면 위쪽에 "Your site is live at …" 주소가 나옵니다(보통 ', h('code', { text: `https://아이디.github.io/${slug}/` }), ').']),
      h('li', {}, [h('b', { text: '주소 넣기: ' }), '그 주소를 "기본 정보 → 공개된 홈페이지 주소"에 넣으면 포스터 QR 코드가 그 주소로 만들어집니다.']),
    ]));
    box.appendChild(h('div', { class: 'box' }, [
      h('h3', { text: '나중에 고칠 때' }),
      h('ul', {}, [
        h('li', { text: '이 도구에서 "불러오기"로 보관한 원본 conference.json 을 열고(사진은 다시 올리기) 고친 뒤, 새 ZIP 을 받아 저장소에 다시 올립니다(Add file → Upload files, 같은 이름은 덮어써짐).' }),
        h('li', { text: '글자 몇 개만 바꿀 때는 GitHub 저장소의 conference.json 을 열어 연필(✎) 버튼으로 바로 고쳐도 됩니다. 저장하면 1~2분 뒤 홈페이지에 반영됩니다(이메일은 직접 넣지 말 것).' }),
      ]),
    ]));
    box.appendChild(h('div', { class: 'tips' }, [
      h('h3', { text: '도움말' }),
      h('ul', {}, [
        h('li', {}, ['더 자세한 그림 설명: ', h('a', { href: REPO + '/blob/main/docs/manual-github-pages.md', target: '_blank', rel: 'noopener', text: 'GitHub Pages 매뉴얼' })]),
        h('li', { text: '주소에 개인 아이디가 들어가지 않게 하려면 학과 이름의 GitHub 조직(Organization)을 만들어 그 아래에 저장소를 만드세요.' }),
        h('li', { text: '저장소는 공개(Public)여야 무료 Pages 가 됩니다. 원본 conference.json·참가자 명단은 올리지 마세요.' }),
      ]),
    ]));
    return box;
  },

  json() {
    const box = h('div', { class: 'custom' });
    box.appendChild(h('p', { class: 'f-help', text: '양식에 없는 항목도 여기서 고칠 수 있습니다. 고친 뒤 "적용"을 누르세요. 쉼표·따옴표가 하나만 틀려도 적용되지 않습니다.' }));
    const ta = h('textarea', { class: 'code', rows: 28, spellcheck: 'false' });
    ta.value = JSON.stringify(state.data, null, 2);
    const msg = h('div', { class: 'msg' });
    box.append(ta, msg, h('div', { class: 'row' }, [
      h('button', { type: 'button', class: 'btn', text: '적용', onclick: () => { try { const d = JSON.parse(ta.value); setData(d, 'JSON 을 적용했습니다.'); } catch (e) { msg.className = 'msg bad'; msg.textContent = 'JSON 오류: ' + e.message; } } }),
      h('button', { type: 'button', class: 'btn ghost', text: '되돌리기', onclick: () => { ta.value = JSON.stringify(state.data, null, 2); msg.textContent = ''; } }),
    ]));
    return box;
  },
};

function checkResults() {
  const box = h('div', { id: 'check-results', class: 'box' }, [h('h3', { text: '검사 결과' })]);
  const c = state.check;
  if (!c) { box.appendChild(h('p', { class: 'f-help', text: E.isReady() ? '검사 중…' : '파이썬 엔진이 준비되면 자동으로 검사합니다.' })); return box; }
  const todo = Array.isArray(state.data._todo) ? state.data._todo : [];
  const warns = c.warnings.filter((w) => !todo.some((t) => w.includes(t)));
  box.appendChild(h('p', { class: c.errors.length ? 'sum bad' : 'sum ok', text: c.errors.length ? `오류 ${c.errors.length}건 — 고쳐야 ZIP 을 만들 수 있습니다.` : `오류 없음 · 경고 ${c.warnings.length}건` }));
  c.errors.forEach((e) => box.appendChild(h('div', { class: 'msg bad', text: e })));
  if (c.missing && c.missing.length) box.appendChild(h('div', { class: 'msg warn', text: '올리지 않은 파일: ' + c.missing.join(', ') + ' — 해당 칸에서 "파일 올리기"를 하지 않으면 ZIP 에 빠집니다.' }));
  if (todo.length) {
    box.appendChild(h('h4', { text: '확인 필요 메모 (_todo) — 공개본에는 들어가지 않습니다' }));
    box.appendChild(h('ul', { class: 'todo' }, todo.map((t) => h('li', { text: t }))));
  }
  if (warns.length) {
    box.appendChild(h('h4', { text: '경고' }));
    warns.forEach((w) => box.appendChild(h('div', { class: 'msg warn', text: w })));
  }
  box.appendChild(h('button', { type: 'button', class: 'btn-sm ghost', text: '다시 검사', onclick: refreshCheck }));
  return box;
}

// ---------------------------------------------------------------- AI 로 채우기
function aiPanel() {
  const s = AI.loadSettings();
  const box = h('div', { class: 'box ai' });
  box.appendChild(h('h3', { text: '자료에서 자동으로 채우기 (AI, 선택)' }));
  box.appendChild(h('p', { class: 'f-help', text: '공문·포스터(PDF·그림)·한글(HWPX)·워드 파일을 올리면 AI 가 읽어 칸을 채웁니다. 본인의 API 키가 필요하고, 사용료는 키 주인 계정에서 나갑니다. 올린 자료는 고른 AI 서비스로 전송되므로 참가자 명단 같은 개인정보 파일은 올리지 마세요.' }));
  box.appendChild(h('div', { class: 'key-warn', role: 'note' }, [
    h('b', { text: '⚠ API 키 안내 — 꼭 읽어 주세요' }),
    h('ul', {}, [
      h('li', {}, [h('b', { text: '이 웹 도구에 쓸 키는 따로 새로 발급받으세요.' }), ' 평소 쓰는 키를 넣지 마세요. 그래야 유출이 의심될 때 발급한 곳(팩트챗·OpenAI 관리 화면)에서 그 키만 바로 삭제할 수 있습니다.']),
      h('li', {}, [h('b', { text: 'API 키의 관리와 사용 책임은 사용자 본인에게 있습니다.' }), ' 키가 새면 다른 사람이 키 주인의 크레딧(사용료)을 쓸 수 있으니 각별히 유의하세요.']),
      h('li', { text: '기본으로 키는 이 화면에만 있고 어디에도 저장되지 않습니다(새로고침하면 다시 입력). 고른 AI 서비스 주소 외의 곳으로는 보내지 않습니다.' }),
      h('li', { text: '공용 PC 에서는 "키 기억"을 켜지 말고, 다 쓰면 "키 지우기"를 누르세요. 다 쓴 키는 발급한 곳에서 삭제해 두는 것이 가장 안전합니다.' }),
    ]),
  ]));
  const prov = h('select', { class: 'f-input' }, Object.entries(AI.PROVIDERS).map(([k, p]) => h('option', { value: k, text: p.name })));
  prov.value = s.provider;
  const base = h('input', { class: 'f-input', type: 'text', value: s.base, id: 'ai-base', spellcheck: 'false' });
  const key = h('input', { class: 'f-input', type: 'password', value: s.key, autocomplete: 'off', spellcheck: 'false', placeholder: 'API 키 (가려져 보입니다)', id: 'ai-key', 'aria-describedby': 'ai-key-shape' });
  const shape = h('div', { class: 'f-help key-shape', id: 'ai-key-shape' });
  let hideTimer = null;
  const showBtn = h('button', { type: 'button', class: 'btn-sm ghost', text: '보기', 'aria-pressed': 'false', title: '오탈자 확인용으로 키를 잠깐 보여 줍니다(15초 뒤 다시 가려짐)' });
  const setShown = (on) => {
    key.type = on ? 'text' : 'password';
    showBtn.textContent = on ? '숨기기' : '보기';
    showBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    clearTimeout(hideTimer);
    if (on) hideTimer = setTimeout(() => setShown(false), 15000);
  };
  showBtn.addEventListener('click', () => setShown(key.type === 'password'));
  const updShape = () => { const r = AI.keyShape(key.value); shape.textContent = r.text; shape.className = 'f-help key-shape ' + (r.ok ? 'ok' : 'bad'); };
  key.addEventListener('input', updShape);
  updShape();
  const remember = h('input', { type: 'checkbox', id: 'ai-remember' }); remember.checked = s.remember;
  const model = h('input', { class: 'f-input', type: 'text', value: s.model, list: 'ai-models' });
  const models = h('datalist', { id: 'ai-models' });
  const keyHelp = h('div', { class: 'f-help' }); const modelHelp = h('div', { class: 'f-help' });
  const sync = () => { const p = AI.PROVIDERS[prov.value]; keyHelp.textContent = p.keyHelp; modelHelp.textContent = p.modelHelp + ' 지금 선택: ' + (AI.canSendImages({ ...s, provider: prov.value, model: model.value }) ? '그림까지 읽음' : '글자만 읽음'); };
  const persist = () => { Object.assign(s, { provider: prov.value, base: base.value.trim(), key: key.value.trim(), model: model.value.trim(), remember: remember.checked }); AI.saveSettings(s); sync(); };
  prov.addEventListener('change', () => { const p = AI.PROVIDERS[prov.value]; base.value = p.base; model.value = p.model; persist(); });
  [base, key, model].forEach((el) => el.addEventListener('change', persist));
  key.addEventListener('input', () => { s.key = key.value.trim(); AI.saveSettings(s); });
  model.addEventListener('input', sync);
  remember.addEventListener('change', () => {
    if (remember.checked && !confirm('키를 이 브라우저에 기억할까요?\n\n· 이 도구는 songh2.github.io 주소에 있어, 같은 주소의 다른 페이지도 저장된 키를 읽을 수 있습니다.\n· 이 컴퓨터를 쓰는 다른 사람도 키를 쓸 수 있습니다.\n· 공용 PC 에서는 켜지 마세요. 개인 PC 라도 다 쓰면 "키 지우기"를 누르세요.\n\n권장하지 않습니다. 그래도 켜려면 [확인]을 누르세요.')) { remember.checked = false; }
    persist();
    if (remember.checked) toast('키를 이 브라우저에 기억합니다. 다 쓰면 "키 지우기"를 누르세요.');
  });
  sync();
  const files = h('input', { type: 'file', multiple: true, accept: '.pdf,.png,.jpg,.jpeg,.webp,.gif,.hwpx,.docx,.txt,.md', class: 'f-input' });
  const extra = h('textarea', { class: 'f-input', rows: 2, placeholder: '추가 요청 (선택) 예: 테마는 자연과학대학으로, 참석 구분은 3일/2일/1일차/2일차' });
  const mode = h('select', { class: 'f-input f-short' }, [h('option', { value: 'replace', text: '자료 내용으로 새로 채우기' }), h('option', { value: 'fill', text: '지금 비어 있는 칸만 채우기' })]);
  const status = h('div', { class: 'ai-status' });
  const result = h('div', { class: 'ai-result' });
  box.append(
    h('div', { class: 'grid2' }, [
      h('label', { class: 'f-label' }, ['AI 서비스', prov]),
      h('label', { class: 'f-label' }, ['주소', base]),
      h('div', { class: 'f-label' }, [h('label', { for: 'ai-key', text: 'API 키' }), h('div', { class: 'key-row' }, [key, showBtn]), shape, keyHelp]),
      h('label', { class: 'f-label' }, ['모델', model, models, modelHelp]),
    ]),
    h('div', { class: 'row' }, [
      h('span', { class: 'chip' }, [remember, h('label', { for: 'ai-remember', text: '이 브라우저에 키 기억 (권장하지 않음)' })]),
      h('button', { type: 'button', class: 'btn-sm ghost', text: '키 지우기', onclick: () => { AI.forgetKey(); key.value = ''; remember.checked = false; persist(); updShape(); setShown(false); toast('키를 지웠습니다. (발급한 곳의 키 자체는 그곳에서 삭제해야 합니다)'); } }),
      h('button', { type: 'button', class: 'btn-sm ghost', text: '모델 목록 불러오기', onclick: async () => { persist(); if (!guardBase(s)) return; try { const ms = await AI.listModels(s); models.innerHTML = ''; ms.forEach((m) => models.appendChild(h('option', { value: m.id }))); toast(`모델 ${ms.length}개를 불러왔습니다. 모델 칸을 누르면 고를 수 있습니다.`); } catch (e) { toast(e.message, 'bad'); } } }),
    ]),
    h('label', { class: 'f-label' }, ['자료 파일 (여러 개 가능)', files]),
    h('label', { class: 'f-label' }, ['추가 요청', extra]),
    h('div', { class: 'row' }, [mode, h('button', {
      type: 'button', class: 'btn', text: '자료에서 채우기',
      onclick: async (ev) => {
        persist();
        if (!files.files.length) return toast('자료 파일을 골라 주세요.');
        if (!guardBase(s)) return;
        const btn = ev.currentTarget; btn.disabled = true; result.innerHTML = '';
        const t0 = Date.now();
        try {
          await E.start();
          const { parts, notes } = await AI.readFiles(files.files, (m) => { status.textContent = m; });
          status.textContent = 'AI 에 보내는 중… (보통 1~3분)';
          const [schema, skeleton] = await Promise.all([fetch('references/schema.md').then((r) => r.text()), fetch('template/conference.skeleton.json').then((r) => r.text())]);
          const sys = AI.systemPrompt({ schema, skeleton, themes: state.themes, today: today() });
          const r = await AI.extract(s, sys, parts, extra.value);
          const got = AI.parseJson(r.text);
          const merged = AI.merge(state.data, got, mode.value);
          const secs = Math.round((Date.now() - t0) / 1000);
          status.textContent = `완료 (${secs}초)` + usageText(r.usage);
          showAiResult(result, merged, got, notes.concat(r.dropped ? [`이 모델이 그림을 읽지 못해 그림 ${r.dropped}개를 보내지 않았습니다.`] : []));
        } catch (e) { status.textContent = ''; result.appendChild(h('div', { class: 'msg bad', text: e.message })); }
        finally { btn.disabled = false; }
      },
    })]),
    status, result,
  );
  return box;
}
function usageText(u) {
  if (!u) return '';
  const n = (x) => (typeof x === 'number' ? x.toLocaleString('ko-KR') : null);
  const inp = n(u.input_tokens ?? u.prompt_tokens);
  const out = n(u.output_tokens ?? u.completion_tokens);
  if (inp || out) return ` · 사용량: 입력 ${inp || '?'} · 출력 ${out || '?'} 토큰`;
  return u.total_tokens ? ` · 사용량: ${n(u.total_tokens)} 토큰` : '';
}
// (나) 보내기 전 주소 확인: https 가 아니면 막고, 공식 주소가 아니면 한 번 더 묻는다
function guardBase(s) {
  const st = AI.baseStatus(s.base);
  if (!st.ok) { toast(st.reason, 'bad'); return false; }
  if (!st.official) {
    return confirm(`공식 주소가 아닙니다: ${st.host}\n\n이 주소로 API 키와 자료가 전송됩니다. 직접 확인한 믿을 수 있는 주소일 때만 [확인]을 누르세요.\n(공식 주소: ${AI.OFFICIAL_HOSTS.join(', ')})`);
  }
  return true;
}
function showAiResult(box, merged, got, notes) {
  const sp = (merged.speakers || []).length;
  const days = (merged.program || []).length;
  const items = (merged.program || []).reduce((n, d) => n + ((d && d.items) || []).length, 0);
  const todo = Array.isArray(got._todo) ? got._todo : [];
  box.append(
    h('div', { class: 'box ok-box' }, [
      h('h4', { text: 'AI 가 정리한 내용 (아직 적용 전)' }),
      h('table', { class: 'kv' }, [
        ['행사명', tl(merged.title)], ['일시', tl(merged.dates && merged.dates.display) || [merged.dates && merged.dates.start, merged.dates && merged.dates.end].filter(Boolean).join(' ~ ')],
        ['장소', [tl(merged.venue && merged.venue.name), tl(merged.venue && merged.venue.room)].filter(Boolean).join(' ')], ['주최', tl(merged.host)],
        ['연사', sp + '명'], ['프로그램', `${days}일, ${items}개 항목`], ['주소용 이름', merged.slug || ''],
      ].map(([k, v]) => h('tr', {}, [h('th', { text: k }), h('td', { text: v || '(비어 있음)' })]))),
      todo.length ? h('div', {}, [h('b', { text: `확인 필요 ${todo.length}건` }), h('ul', { class: 'todo' }, todo.map((t) => h('li', { text: t })))]) : null,
      ...notes.map((n) => h('div', { class: 'msg warn', text: n })),
      h('p', { class: 'f-help', text: 'AI 는 틀릴 수 있습니다. 적용한 뒤 각 탭에서 원문과 한 줄씩 대조하세요.' }),
      h('div', { class: 'row' }, [
        h('button', { type: 'button', class: 'btn', text: '적용하기', onclick: () => { setData(merged, 'AI 가 정리한 내용을 적용했습니다. 확인 필요 항목을 꼭 확인하세요.'); } }),
        h('button', { type: 'button', class: 'btn ghost', text: '버리기', onclick: () => { box.innerHTML = ''; } }),
      ]),
    ]));
}

// ---------------------------------------------------------------- 알림
function toast(msg, kind) {
  const t = h('div', { class: 'toast ' + (kind || ''), role: 'status', text: msg });
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 9000 : 5000);
}
