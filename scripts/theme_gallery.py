#!/usr/bin/env python3
"""테마(배색) 프리셋 갤러리 — 한 파일에서 프리셋을 바꿔 가며 비교한다.

사용법:
    python3 scripts/theme_gallery.py                       # 예시 사이트로 dist/theme-gallery/index.html 생성
    python3 scripts/theme_gallery.py sites/<slug>          # 내 사이트로 비교
결과 파일 하나(index.html)를 더블클릭하면 열린다. 화면 아래 막대에서 프리셋을 고른다.
이미 공개된 사이트에서는 주소 끝에 ?theme=<id> 를 붙여도 같은 미리보기를 볼 수 있다(저장되지 않음).
"""
import argparse
import html
import json
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import build  # noqa: E402
from themes import load_presets, STATUS_KO  # noqa: E402

GROUPS = [("snu", "서울대학교"), ("generic", "범용")]
# 서울대학교 홈페이지 "대학" 목록(snu.ac.kr/academics/undergraduate/colleges) 순서
SNU_ORDER = ["snu", "snu-humanities", "snu-social", "snu-science", "snu-nursing", "snu-business", "snu-engineering", "snu-cals",
             "snu-art", "snu-education", "snu-human-ecology", "snu-vet", "snu-pharmacy", "snu-music", "snu-medicine", "snu-cls", "snu-ti"]

BAR = """
<style id="gallery-css">
  .tg-bar { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); z-index: 9999; width: min(760px, calc(100vw - 20px));
    background: rgba(24,24,27,.94); color: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.35);
    font: 14px/1.45 system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; padding: 10px 12px; }
  .tg-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .tg-bar label { font-weight: 700; white-space: nowrap; }
  .tg-bar select { flex: 1 1 220px; min-width: 0; font: inherit; font-size: 16px; padding: 7px 8px; border-radius: 8px; border: 0; color: #111; background: #fff; }
  .tg-bar button { font: inherit; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; cursor: pointer; }
  .tg-bar button:focus-visible, .tg-bar select:focus-visible { outline: 2px solid #8ab4ff; outline-offset: 2px; }
  .tg-info { margin-top: 6px; font-size: 12.5px; color: #d6d6d6; overflow-wrap: anywhere; }
  .tg-info b { color: #fff; }
  .tg-info code { background: rgba(255,255,255,.12); padding: 1px 5px; border-radius: 4px; color: #fff; }
  .tg-badge { display: inline-block; padding: 0 6px; border-radius: 4px; font-size: 11.5px; margin-left: 4px; background: #3f3f46; }
  .tg-badge.official { background: #166534; } .tg-badge.extracted { background: #854d0e; }
  .tg-hide .tg-info { display: none; }
  .tg-info details { margin-top: 4px; } .tg-info summary { cursor: pointer; color: #fff; }
  body { padding-bottom: 150px; }
  @media print { .tg-bar { display: none !important; } body { padding-bottom: 0; } }
</style>
<div class="tg-bar" id="tg-bar" role="region" aria-label="테마 갤러리">
  <div class="tg-row">
    <label for="tg-select">테마</label>
    <button type="button" id="tg-prev" aria-label="이전 테마">◀</button>
    <select id="tg-select">__OPTIONS__</select>
    <button type="button" id="tg-next" aria-label="다음 테마">▶</button>
    <button type="button" id="tg-toggle" aria-expanded="true">설명 접기</button>
  </div>
  <div class="tg-info" id="tg-info" aria-live="polite"></div>
</div>
<script>
(function () {
  var META = __META__;
  var sel = document.getElementById('tg-select'), info = document.getElementById('tg-info'), bar = document.getElementById('tg-bar');
  var ids = Array.prototype.map.call(sel.options, function (o) { return o.value; });
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function show(id) {
    if (!window.confSiteSetTheme || !window.confSiteSetTheme(id)) return;
    sel.value = id;
    var m = META[id];
    info.innerHTML = '<b>' + esc(m.name) + '</b><span class="tg-badge ' + esc(m.status) + '">' + esc(m.status_ko) + '</span> · ' +
      'conference.json 에 <code>"theme": "' + esc(id) + '"</code>' + (m.note ? '<br>' + esc(m.note.split(' 로고는')[0]) : '') +
      (m.source ? '<details><summary>출처·측정값</summary>' + esc(m.source) + '</details>' : '');
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  sel.addEventListener('change', function () { show(sel.value); });
  document.getElementById('tg-prev').addEventListener('click', function () { show(ids[(ids.indexOf(sel.value) - 1 + ids.length) % ids.length]); });
  document.getElementById('tg-next').addEventListener('click', function () { show(ids[(ids.indexOf(sel.value) + 1) % ids.length]); });
  var tg = document.getElementById('tg-toggle');
  tg.addEventListener('click', function () { var h = bar.classList.toggle('tg-hide'); tg.textContent = h ? '설명 펼치기' : '설명 접기'; tg.setAttribute('aria-expanded', String(!h)); });
  function start() { if (window.innerWidth < 640) { bar.classList.add('tg-hide'); tg.textContent = '설명 펼치기'; tg.setAttribute('aria-expanded', 'false'); }
    var h = (location.hash || '').slice(1); show(META[h] ? h : ids[0]); }
  if (window.confSiteSetTheme) start(); else window.addEventListener('load', start);
})();
</script>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_dir", nargs="?", default="sites/example-2027")
    ap.add_argument("--out", default="dist/theme-gallery")
    args = ap.parse_args()
    site = Path(args.site_dir)
    out = Path(args.out)
    presets = load_presets()

    tmp = Path(tempfile.mkdtemp(prefix="theme-gallery-"))
    try:
        work = tmp / "site"
        shutil.copytree(site, work)
        data = json.loads((work / "conference.json").read_text(encoding="utf-8"))
        data["theme"] = "default"     # 미리보기 전환이 깨끗하도록 기본 배색으로 빌드한다
        (work / "conference.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        build(work, None, quiet=True)
        page = (work / "index.html").read_text(encoding="utf-8")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    meta, options = {}, []
    for gid, glabel in GROUPS:
        items = [(pid, p) for pid, p in presets.items() if p.get("group", "generic") == gid]
        if gid == "snu":
            items.sort(key=lambda x: (SNU_ORDER.index(x[0]) if x[0] in SNU_ORDER else 99, x[0]))
        if not items:
            continue
        options.append(f'<optgroup label="{html.escape(glabel)}">')
        for pid, p in items:
            name = p["name"].get("ko", pid)
            options.append(f'<option value="{html.escape(pid)}">{html.escape(name)}</option>')
            meta[pid] = {"name": name, "status": p["status"], "status_ko": STATUS_KO.get(p["status"], p["status"]),
                         "note": (p.get("note") or {}).get("ko", ""), "source": p.get("source", "")}
        options.append("</optgroup>")
    bar = BAR.replace("__OPTIONS__", "".join(options)).replace("__META__", json.dumps(meta, ensure_ascii=False).replace("</", "<\\/"))
    if "</body>" not in page:
        raise SystemExit("빌드 결과에 </body> 가 없습니다")
    page = page.replace("<title>", "<title>테마 갤러리 · ", 1).replace("</body>", bar + "</body>", 1)

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / "index.html").write_text(page, encoding="utf-8")
    if (site / "assets").is_dir():
        shutil.copytree(site / "assets", out / "assets")
    print(f"OK    {out / 'index.html'} — 프리셋 {len(meta)}개")


if __name__ == "__main__":
    main()
