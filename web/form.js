// fields.js 의 정의대로 입력 양식을 그리고, 입력하면 데이터(conference.json 객체)를 바로 고친다.
import { putAsset, assetUrl, assets } from './engine.js';

export function getPath(obj, path) {
  let o = obj;
  for (const k of path) { if (o == null) return undefined; o = o[k]; }
  return o;
}
export function setPath(obj, path, val) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (o[k] == null || typeof o[k] !== 'object') o[k] = typeof path[i + 1] === 'number' ? [] : {};
    o = o[k];
  }
  o[path[path.length - 1]] = val;
}
export function h(tag, attrs, children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // 고정 문구에만 쓴다(사용자 입력에는 쓰지 않음)
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of [].concat(children || [])) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

let uid = 0;
const nextId = () => 'f' + (++uid);
const tl = (o) => (o && typeof o === 'object' ? (o.ko || o.en || '') : (o || ''));
export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function label(f, id) {
  return h('label', { class: 'f-label', for: id }, [f.label, f.required ? h('span', { class: 'req', title: '필수', text: ' *' }) : null]);
}
function help(f) { return f.help ? h('div', { class: 'f-help', text: f.help }) : null; }

// ---------------------------------------------------------------------------
export function renderFields(container, fields, ctx, basePath) {
  for (const f of fields) container.appendChild(renderField(f, ctx, basePath || []));
}

function renderField(f, ctx, base) {
  const path = base.concat([f.key]);
  const R = RENDER[f.type];
  if (!R) return h('div', { class: 'f-error', text: '알 수 없는 항목 형식: ' + f.type });
  return R(f, ctx, path, base);
}

function onEdit(ctx, path, el) {
  ctx.changed(path);
  // 이 입력이 들어 있는 카드들의 제목(요약)을 다시 쓴다
  let n = el;
  while (n) { if (n._updateSummary) n._updateSummary(); n = n.parentElement; }
}

const RENDER = {
  text(f, ctx, path) {
    const id = nextId();
    const input = h('input', { id, type: 'text', class: 'f-input', placeholder: f.placeholder || '', value: getPath(ctx.root(), path) ?? '' });
    input.addEventListener('input', () => { setPath(ctx.root(), path, input.value); onEdit(ctx, path, input); });
    return h('div', { class: 'field' }, [label(f, id), input, help(f)]);
  },
  textarea(f, ctx, path) {
    const id = nextId();
    const ta = h('textarea', { id, class: 'f-input', rows: 4 });
    ta.value = getPath(ctx.root(), path) ?? '';
    ta.addEventListener('input', () => { setPath(ctx.root(), path, ta.value); onEdit(ctx, path, ta); });
    return h('div', { class: 'field' }, [label(f, id), ta, help(f)]);
  },
  number(f, ctx, path) {
    const id = nextId();
    const v = getPath(ctx.root(), path);
    const input = h('input', { id, type: 'number', step: 'any', class: 'f-input f-short', value: v == null ? '' : v });
    input.addEventListener('input', () => { setPath(ctx.root(), path, input.value === '' ? null : Number(input.value)); onEdit(ctx, path, input); });
    return h('div', { class: 'field' }, [label(f, id), input, help(f)]);
  },
  date(f, ctx, path) {
    const id = nextId();
    const v = getPath(ctx.root(), path) ?? '';
    const useDate = !v || ISO.test(v);
    const input = h('input', { id, type: useDate ? 'date' : 'text', class: 'f-input f-short', value: v, placeholder: 'YYYY-MM-DD' });
    input.addEventListener('input', () => { setPath(ctx.root(), path, input.value); onEdit(ctx, path, input); });
    return h('div', { class: 'field' }, [label(f, id), input, help(f)]);
  },
  select(f, ctx, path) {
    const id = nextId();
    const v = getPath(ctx.root(), path);
    const opts = f.options.slice();
    if (v != null && v !== '' && !opts.some((o) => o[0] === v)) opts.push([v, String(v)]);
    const sel = h('select', { id, class: 'f-input f-short' }, opts.map(([val, lab]) => h('option', { value: val, text: lab })));
    sel.value = v == null || v === '' ? opts[0][0] : v;
    sel.addEventListener('change', () => { setPath(ctx.root(), path, sel.value); onEdit(ctx, path, sel); });
    return h('div', { class: 'field' }, [label(f, id), sel, help(f)]);
  },
  check(f, ctx, path) {
    const id = nextId();
    const cb = h('input', { id, type: 'checkbox' });
    cb.checked = !!getPath(ctx.root(), path);
    cb.addEventListener('change', () => { setPath(ctx.root(), path, cb.checked); onEdit(ctx, path, cb); });
    return h('div', { class: 'field field-check' }, [cb, h('label', { for: id, text: f.label }), help(f)]);
  },
  bi(f, ctx, path) { return biField(f, ctx, path, !!f.multiline); },
  bitext(f, ctx, path) { return biField(f, ctx, path, true, 5); },

  group(f, ctx, path) {
    const box = h('fieldset', { class: 'f-group' }, [h('legend', { text: f.label })]);
    renderFields(box, f.fields, ctx, path);
    return box;
  },

  list(f, ctx, path) {
    const wrap = h('div', { class: 'f-list' });
    const items = getPath(ctx.root(), path);
    const arr = Array.isArray(items) ? items : [];
    const head = h('div', { class: 'f-list-head' }, [h('h3', { text: f.label }), h('span', { class: 'count', text: arr.length + '개' })]);
    wrap.appendChild(head);
    arr.forEach((item, i) => {
      const ip = path.concat([i]);
      const key = ip.join('.');
      const det = h('details', { class: 'card' });
      if (ctx.openSet.has(key)) det.open = true;
      det.addEventListener('toggle', () => { if (det.open) ctx.openSet.add(key); else ctx.openSet.delete(key); });
      const sum = h('summary', {}, [h('span', { class: 'card-no', text: String(i + 1) }), h('span', { class: 'card-title' })]);
      const titleEl = sum.querySelector('.card-title');
      det._updateSummary = () => { titleEl.textContent = f.summary ? f.summary(getPath(ctx.root(), ip) || {}) : '항목 ' + (i + 1); };
      det._updateSummary();
      const tools = h('div', { class: 'card-tools' }, [
        h('button', { type: 'button', class: 'mini', title: '위로', 'aria-label': '위로', text: '↑', disabled: i === 0 ? true : null, onclick: (e) => { e.preventDefault(); move(ctx, path, i, i - 1); } }),
        h('button', { type: 'button', class: 'mini', title: '아래로', 'aria-label': '아래로', text: '↓', disabled: i === arr.length - 1 ? true : null, onclick: (e) => { e.preventDefault(); move(ctx, path, i, i + 1); } }),
        h('button', { type: 'button', class: 'mini', title: '복제', text: '복제', onclick: (e) => { e.preventDefault(); const list = getPath(ctx.root(), path); list.splice(i + 1, 0, JSON.parse(JSON.stringify(list[i]))); ctx.openSet.add(path.concat([i + 1]).join('.')); ctx.changed(path, { structure: true }); } }),
        h('button', { type: 'button', class: 'mini danger', title: '삭제', text: '삭제', onclick: (e) => { e.preventDefault(); if (confirm('이 항목을 지울까요?')) { getPath(ctx.root(), path).splice(i, 1); ctx.openSet.clear(); ctx.changed(path, { structure: true }); } } }),
      ]);
      sum.appendChild(tools);
      det.appendChild(sum);
      const body = h('div', { class: 'card-body' });
      renderFields(body, f.item, ctx, ip);
      det.appendChild(body);
      wrap.appendChild(det);
    });
    wrap.appendChild(h('button', {
      type: 'button', class: 'btn-add', text: '+ ' + (f.addLabel || '추가'),
      onclick: () => {
        let list = getPath(ctx.root(), path);
        if (!Array.isArray(list)) { list = []; setPath(ctx.root(), path, list); }
        list.push(f.newItem ? f.newItem() : {});
        ctx.openSet.add(path.concat([list.length - 1]).join('.'));
        ctx.changed(path, { structure: true });
      },
    }));
    if (f.help) wrap.appendChild(help(f));
    return wrap;
  },

  bilist(f, ctx, path) {
    const wrap = h('div', { class: 'f-list' }, [h('div', { class: 'f-list-head' }, [h('h3', { text: f.label })])]);
    const arr = Array.isArray(getPath(ctx.root(), path)) ? getPath(ctx.root(), path) : [];
    arr.forEach((v, i) => {
      const row = h('div', { class: 'bilist-row' });
      row.appendChild(biField({ label: (i + 1) + '.' }, ctx, path.concat([i]), false));
      row.appendChild(h('button', { type: 'button', class: 'mini danger', text: '삭제', onclick: () => { getPath(ctx.root(), path).splice(i, 1); ctx.changed(path, { structure: true }); } }));
      wrap.appendChild(row);
    });
    wrap.appendChild(h('button', { type: 'button', class: 'btn-add', text: '+ 문구 추가', onclick: () => { let a = getPath(ctx.root(), path); if (!Array.isArray(a)) { a = []; setPath(ctx.root(), path, a); } a.push({ ko: '', en: '' }); ctx.changed(path, { structure: true }); } }));
    return wrap;
  },

  asset(f, ctx, path, base) { return assetField(f, ctx, path, base); },

  speakerRef(f, ctx, path) {
    const id = nextId();
    const v = getPath(ctx.root(), path) || '';
    const sp = (ctx.root().speakers || []).filter((s) => s && s.id);
    const opts = [['', '(연결 안 함)']].concat(sp.map((s) => [s.id, `${tl(s.name) || s.id} (${s.id})`]));
    if (v && !sp.some((s) => s.id === v)) opts.push([v, v + ' (연사 목록에 없음)']);
    const sel = h('select', { id, class: 'f-input' }, opts.map(([val, lab]) => h('option', { value: val, text: lab })));
    sel.value = v;
    sel.addEventListener('change', () => { setPath(ctx.root(), path, sel.value); onEdit(ctx, path, sel); });
    return h('div', { class: 'field' }, [label(f, id), sel, help(f)]);
  },

  days(f, ctx, path) {
    const cur = Array.isArray(getPath(ctx.root(), path)) ? getPath(ctx.root(), path) : [];
    const progDays = (ctx.root().program || []).map((d) => d && d.date).filter((d) => d && ISO.test(d));
    const all = Array.from(new Set(progDays.concat(cur))).sort();
    const box = h('div', { class: 'field' }, [h('div', { class: 'f-label', text: f.label })]);
    if (!all.length) box.appendChild(h('div', { class: 'f-help', text: '먼저 "프로그램" 탭에서 날짜를 넣으면 여기에서 고를 수 있습니다.' }));
    const row = h('div', { class: 'chips' });
    all.forEach((d) => {
      const id = nextId();
      const cb = h('input', { id, type: 'checkbox' });
      cb.checked = cur.includes(d);
      cb.addEventListener('change', () => {
        const now = new Set(Array.isArray(getPath(ctx.root(), path)) ? getPath(ctx.root(), path) : []);
        if (cb.checked) now.add(d); else now.delete(d);
        setPath(ctx.root(), path, Array.from(now).sort());
        onEdit(ctx, path, cb);
      });
      row.appendChild(h('span', { class: 'chip' }, [cb, h('label', { for: id, text: d })]));
    });
    box.appendChild(row);
    return box;
  },

  slides(f, ctx, path, base) {
    const raw = getPath(ctx.root(), path);
    const list = Array.isArray(raw) ? raw.map((x) => (typeof x === 'string' ? { url: x } : x)) : (raw ? [{ url: raw }] : []);
    const wrap = h('div', { class: 'f-list' }, [h('div', { class: 'f-list-head' }, [h('h3', { text: f.label })])]);
    const save = (arr) => {
      // 라벨 없는 파일 하나면 원래처럼 문자열로 둔다
      if (arr.length === 1 && !tl(arr[0].label)) setPath(ctx.root(), path, arr[0].url || '');
      else if (!arr.length) setPath(ctx.root(), path, '');
      else setPath(ctx.root(), path, arr);
    };
    const tmp = { _slides: list }; // 모든 줄이 같은 목록을 고친다
    const tctx = { ...ctx, root: () => tmp, changed: () => { save(tmp._slides); ctx.changed(path); } };
    list.forEach((sl, i) => {
      const row = h('div', { class: 'slide-row' });
      row.appendChild(biField({ label: '이름 (비우면 "발표자료")' }, tctx, ['_slides', i, 'label'], false));
      const speakerId = (getPath(ctx.root(), base) || {}).id;
      row.appendChild(assetField({ label: '파일 또는 링크', accept: '.pdf,application/pdf,*/*', dir: 'slides', fixedName: speakerId ? speakerId + (i ? '-' + (i + 1) : '') : null }, tctx, ['_slides', i, 'url'], ['_slides', i]));
      row.appendChild(h('button', { type: 'button', class: 'mini danger', text: '삭제', onclick: () => { list.splice(i, 1); save(list); ctx.changed(path, { structure: true }); } }));
      wrap.appendChild(row);
    });
    wrap.appendChild(h('button', { type: 'button', class: 'btn-add', text: '+ 발표자료 추가', onclick: () => { list.push({ label: { ko: '', en: '' }, url: '' }); setPath(ctx.root(), path, list); ctx.changed(path, { structure: true }); } }));
    return wrap;
  },

  theme(f, ctx, path) {
    const box = h('div', { class: 'field' }, [h('div', { class: 'f-label', text: f.label })]);
    const cur = getPath(ctx.root(), path);
    const curId = typeof cur === 'string' ? cur : (cur && cur.preset) || '';
    if (cur && typeof cur === 'object') box.appendChild(h('div', { class: 'note', text: '지금은 색을 직접 지정한 테마입니다(JSON 직접 편집 탭에서 보기). 아래에서 고르면 프리셋으로 바뀝니다.' }));
    const themes = ctx.themes || [];
    if (!themes.length) { box.appendChild(h('div', { class: 'f-help', text: '테마 목록은 파이썬 엔진이 준비되면 나타납니다.' })); return box; }
    const groups = [['snu', '서울대학교'], ['generic', '일반']];
    const ST = { official: '공식값', extracted: '홈페이지 배색', generic: '일반', draft: '초안' };
    for (const [g, gl] of groups) {
      const list = themes.filter((t) => (t.group || 'generic') === g || (g === 'generic' && !['snu'].includes(t.group)));
      if (!list.length) continue;
      box.appendChild(h('div', { class: 'theme-group', text: gl }));
      const grid = h('div', { class: 'theme-grid' });
      list.forEach((t) => {
        const name = (t.name && (t.name.ko || t.name.en)) || t.id;
        const b = h('button', { type: 'button', class: 'theme-card' + (t.id === curId || (!curId && t.id === 'default') ? ' on' : ''), title: t.id, 'aria-pressed': t.id === curId ? 'true' : 'false' }, [
          h('span', { class: 'sw' }, [h('i', { style: `background:${t.deep || t.primary}` }), h('i', { style: `background:${t.primary}` }), h('i', { style: `background:${t.accent}` })]),
          h('span', { class: 'tn', text: /^서울대학교\s*\(/.test(name) ? '서울대학교 공통' : (name.replace(/^서울대학교\s*/, '') || name) }),
          h('span', { class: 'ts', text: ST[t.status] || t.status }),
        ]);
        b.addEventListener('click', () => { setPath(ctx.root(), path, t.id); ctx.changed(path, { structure: true }); });
        grid.appendChild(b);
      });
      box.appendChild(grid);
    }
    box.appendChild(h('div', { class: 'f-help', text: '"홈페이지 배색"은 각 단과대학 홈페이지 화면에서 읽은 색이며 공식 색이 아닙니다. 서울대 공통·공과대학은 UI 가이드의 공식값입니다.' }));
    return box;
  },
};

function biField(f, ctx, path, multi, rows) {
  const v = getPath(ctx.root(), path);
  const cur = v && typeof v === 'object' ? v : { ko: v || '', en: '' };
  const wrap = h('div', { class: 'field field-bi' }, [h('div', { class: 'f-label' }, [f.label, f.required ? h('span', { class: 'req', text: ' *' }) : null])]);
  const cols = h('div', { class: 'bi-cols' });
  for (const lang of ['ko', 'en']) {
    const id = nextId();
    const el = multi ? h('textarea', { id, class: 'f-input', rows: rows || 2, placeholder: lang === 'ko' ? (f.placeholder || '') : '' }) : h('input', { id, type: 'text', class: 'f-input', placeholder: lang === 'ko' ? (f.placeholder || '') : '' });
    el.value = cur[lang] || '';
    el.addEventListener('input', () => {
      const now = getPath(ctx.root(), path);
      const obj = now && typeof now === 'object' ? now : { ko: now || '', en: '' };
      obj[lang] = el.value;
      setPath(ctx.root(), path, obj);
      onEdit(ctx, path, el);
    });
    cols.appendChild(h('div', { class: 'bi-col' }, [h('label', { class: 'lang', for: id, text: lang === 'ko' ? '한국어' : 'English' }), el]));
  }
  wrap.appendChild(cols);
  if (f.help) wrap.appendChild(help(f));
  return wrap;
}

function assetField(f, ctx, path, base) {
  const id = nextId();
  const v = getPath(ctx.root(), path) || '';
  const input = h('input', { id, type: 'text', class: 'f-input', value: v, placeholder: 'assets/파일이름 또는 https://…' });
  const thumb = h('span', { class: 'thumb' });
  const showThumb = () => {
    thumb.innerHTML = '';
    const p = input.value;
    const a = assets.get(p);
    if (a && /^image\//.test(a.type)) thumb.appendChild(h('img', { src: assetUrl(p), alt: '' }));
    else if (a) thumb.appendChild(h('span', { class: 'file-tag', text: '파일 있음' }));
    else if (p.startsWith('assets/')) thumb.appendChild(h('span', { class: 'file-tag warn', text: '파일 없음 — 올려 주세요' }));
  };
  showThumb();
  input.addEventListener('input', () => { setPath(ctx.root(), path, input.value); showThumb(); onEdit(ctx, path, input); });
  const file = h('input', { type: 'file', accept: f.accept || '*/*', class: 'hidden-file' });
  file.addEventListener('change', async () => {
    const fl = file.files && file.files[0];
    if (!fl) return;
    const ext = (fl.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const item = base ? getPath(ctx.root(), base) || {} : {};
    let stem = f.fixedName || (f.nameFrom && slugify(item[f.nameFrom])) || slugify(fl.name.replace(/\.[^.]+$/, '')) || 'file';
    const dir = f.dir ? f.dir + '/' : '';
    const p = `assets/${dir}${stem}.${ext}`;
    await putAsset(p, new Uint8Array(await fl.arrayBuffer()), fl.type, fl.name);
    input.value = p;
    setPath(ctx.root(), path, p);
    showThumb();
    onEdit(ctx, path, input);
    file.value = '';
  });
  const pick = h('button', { type: 'button', class: 'btn-sm', text: '파일 올리기', onclick: () => file.click() });
  const clear = h('button', { type: 'button', class: 'btn-sm ghost', text: '비우기', onclick: () => { input.value = ''; setPath(ctx.root(), path, ''); showThumb(); onEdit(ctx, path, input); } });
  return h('div', { class: 'field field-asset' }, [label(f, id), h('div', { class: 'asset-row' }, [input, pick, clear, file]), thumb, help(f)]);
}

function move(ctx, path, i, j) {
  const list = getPath(ctx.root(), path);
  if (j < 0 || j >= list.length) return;
  const [x] = list.splice(i, 1);
  list.splice(j, 0, x);
  ctx.openSet.clear();
  ctx.openSet.add(path.concat([j]).join('.'));
  ctx.changed(path, { structure: true });
}
