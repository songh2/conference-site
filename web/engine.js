// 브라우저 안 파이썬(Pyodide) 준비와 저장소 스크립트 호출, 사용자가 올린 파일(assets) 보관.
// 파이썬 쪽은 web/bridge.py 가 scripts/*.py 를 그대로 불러 쓴다.

export const PYODIDE_VERSION = '0.29.5';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let py = null;
let bridge = null;
let manifest = null;
let booting = null;

// ---------- 올린 파일(assets): 메모리 + IndexedDB(이 브라우저에만) ----------
export const assets = new Map(); // 'assets/hero.jpg' -> { bytes: Uint8Array, type, name }

const DB_NAME = 'conf-builder';
function idb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('assets');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}
async function idbDo(mode, fn) {
  try {
    const db = await idb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('assets', mode);
      const store = tx.objectStore('assets');
      const r = fn(store);
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { return undefined; } // 사생활 보호 모드 등에서는 저장하지 않고 넘어간다
}
export async function loadSavedAssets() {
  try {
    const db = await idb();
    await new Promise((resolve) => {
      const tx = db.transaction('assets', 'readonly');
      const req = tx.objectStore('assets').openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (c) { assets.set(c.key, c.value); c.continue(); } else resolve();
      };
      req.onerror = () => resolve();
    });
  } catch (e) { /* 저장소를 쓸 수 없으면 비어 있는 채로 시작 */ }
  return assets;
}
export async function putAsset(path, bytes, type, name) {
  const rec = { bytes, type: type || '', name: name || path.split('/').pop() };
  assets.set(path, rec);
  if (py) writeAssetToFs(path, bytes);
  await idbDo('readwrite', (s) => s.put(rec, path));
}
export async function deleteAsset(path) {
  assets.delete(path);
  if (py) { try { py.FS.unlink('/work/' + path); } catch (e) { /* 없으면 무시 */ } }
  await idbDo('readwrite', (s) => s.delete(path));
}
export async function clearAssets() {
  for (const p of Array.from(assets.keys())) await deleteAsset(p);
}
export function assetUrl(path) {
  const a = assets.get(path);
  if (!a) return '';
  if (!a._url) a._url = URL.createObjectURL(new Blob([a.bytes], { type: a.type || 'application/octet-stream' }));
  return a._url;
}
function writeAssetToFs(path, bytes) {
  const full = '/work/' + path; // path 는 'assets/...'
  py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
  py.FS.writeFile(full, bytes);
}

// ---------- 파이썬 준비 ----------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('스크립트를 불러오지 못했습니다: ' + src));
    document.head.appendChild(s);
  });
}

export function getManifest() { return manifest; }
export function isReady() { return !!bridge; }

export function start(onStatus) {
  if (!booting) booting = boot(onStatus || (() => {})).catch((e) => { booting = null; throw e; });
  return booting;
}

async function boot(onStatus) {
  onStatus('도구 목록 확인 중…');
  manifest = await (await fetch('web/manifest.json', { cache: 'no-cache' })).json();
  onStatus('파이썬 엔진 내려받는 중… (처음 한 번 수십 초 걸릴 수 있습니다)');
  if (!window.loadPyodide) await loadScript(PYODIDE_URL + 'pyodide.js');
  py = await window.loadPyodide({ indexURL: PYODIDE_URL });
  onStatus('도구 파일 준비 중…');
  const v = manifest.version;
  await Promise.all(manifest.files.map(async (f) => {
    const r = await fetch(f + '?v=' + v);
    if (!r.ok) throw new Error(`${f} 를 불러오지 못했습니다 (${r.status})`);
    const full = '/repo/' + f;
    py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
    py.FS.writeFile(full, new Uint8Array(await r.arrayBuffer()));
  }));
  // QR 코드용 segno (없어도 포스터는 만들어지고 QR 대신 주소가 글자로 들어간다)
  try {
    const r = await fetch(manifest.vendor.segno + '?v=' + v);
    if (r.ok) {
      py.FS.mkdirTree('/work/vendor');
      py.FS.writeFile('/work/vendor/segno.whl', new Uint8Array(await r.arrayBuffer()));
      py.runPython("import zipfile, sys\nzipfile.ZipFile('/work/vendor/segno.whl').extractall('/work/vendor/site')\nsys.path.insert(0, '/work/vendor/site')");
    }
  } catch (e) { console.warn('segno 준비 실패 — QR 없이 진행', e); }
  py.FS.mkdirTree('/work/assets');
  for (const [p, a] of assets) writeAssetToFs(p, a.bytes);
  py.runPython("import sys\nsys.path.insert(0, '/repo/web')\nimport bridge");
  bridge = py.pyimport('bridge');
  onStatus('ready');
  return true;
}

function pyMessage(e) {
  const s = String((e && e.message) || e);
  const lines = s.trim().split('\n').filter(Boolean);
  const last = lines[lines.length - 1] || s;
  return last.replace(/^(\w+Error|SystemExit|Exception):\s*/, '');
}

// bridge 함수 호출. 문자열은 그대로, bytes 는 Uint8Array 로 돌려준다.
export async function call(name, ...args) {
  await start();
  let r;
  try { r = bridge[name](...args); } catch (e) { throw new Error(pyMessage(e)); }
  if (r && typeof r.toJs === 'function') { const v = r.toJs(); if (r.destroy) r.destroy(); return v; }
  return r;
}
export async function callJson(name, ...args) {
  return JSON.parse(await call(name, ...args));
}
// 파일 하나를 가상 디스크에 써 두고 경로를 돌려준다 (zip 불러오기·글자 뽑기용)
export async function writeTemp(name, bytes) {
  await start();
  const safe = name.replace(/[^A-Za-z0-9._-]/g, '_');
  const p = '/work/upload/' + Date.now() + '-' + safe;
  py.FS.mkdirTree('/work/upload');
  py.FS.writeFile(p, bytes);
  return p;
}
export async function syncAssetFromFs(path) {
  // import_zip 이 가상 디스크에 풀어 놓은 파일을 메모리·IndexedDB 에도 넣는다
  const bytes = py.FS.readFile('/work/' + path);
  const ext = path.split('.').pop().toLowerCase();
  const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf' }[ext] || '';
  await putAsset(path, new Uint8Array(bytes), type);
}
