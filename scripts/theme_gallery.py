#!/usr/bin/env python3
"""테마(배색) 프리셋 갤러리를 만든다 — 같은 사이트를 프리셋마다 빌드해 한 화면에서 비교.

사용법:
    python3 scripts/theme_gallery.py                       # 예시 사이트로 dist/theme-gallery/ 생성
    python3 scripts/theme_gallery.py sites/<slug>          # 내 사이트로 비교
결과: dist/theme-gallery/index.html 을 브라우저에서 연다 (파일을 더블클릭해도 열린다).
"""
import argparse
import html
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import build  # noqa: E402
from themes import load_presets  # noqa: E402

PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>테마 갤러리 — {site}</title>
<style>
  body {{ margin: 0; font: 14px/1.5 system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #222; background: #eee; }}
  .bar {{ display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 10px 14px; background: #fff; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 2; }}
  .bar strong {{ margin-right: 8px; }}
  .bar button {{ font: inherit; padding: 6px 12px; border: 1px solid #bbb; border-radius: 999px; background: #f7f7f7; cursor: pointer; }}
  .bar button[aria-pressed="true"] {{ background: #222; color: #fff; border-color: #222; }}
  .info {{ padding: 8px 14px; background: #fffbe6; border-bottom: 1px solid #f0e0a0; font-size: 13px; }}
  .info code {{ background: #fff; padding: 1px 5px; border: 1px solid #e6d9a6; border-radius: 4px; }}
  iframe {{ width: 100%; height: calc(100vh - 110px); border: 0; background: #fff; }}
  .status-draft {{ color: #a05a00; }}
</style>
</head>
<body>
<div class="bar"><strong>테마 고르기</strong>{buttons}</div>
<div class="info" id="info"></div>
<iframe id="frame" title="미리보기"></iframe>
<script>
var PRESETS = {presets};
var frame = document.getElementById('frame'), info = document.getElementById('info');
function pick(id) {{
  frame.src = id + '/index.html';
  var p = PRESETS[id];
  var st = p.status === 'verified' ? '확인됨' : '<span class="status-draft">초안 — 색상 값이 공식 확인된 것이 아님</span>';
  info.innerHTML = '<b>' + p.name_ko + '</b> (' + p.name_en + ') · 상태: ' + st +
    (p.note_ko ? ' · ' + p.note_ko : '') +
    (p.source ? ' · 출처: ' + p.source : '') +
    ' · 적용 방법: conference.json 에 <code>"theme": "' + id + '"</code>';
  Array.prototype.forEach.call(document.querySelectorAll('.bar button'), function (b) {{ b.setAttribute('aria-pressed', String(b.dataset.id === id)); }});
  try {{ history.replaceState(null, '', '#' + id); }} catch (e) {{}}
}}
Array.prototype.forEach.call(document.querySelectorAll('.bar button'), function (b) {{ b.addEventListener('click', function () {{ pick(b.dataset.id); }}); }});
pick((location.hash || '#default').slice(1) in PRESETS ? (location.hash || '#default').slice(1) : Object.keys(PRESETS)[0]);
</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_dir", nargs="?", default="sites/example-2027")
    ap.add_argument("--out", default="dist/theme-gallery")
    args = ap.parse_args()
    site = Path(args.site_dir)
    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    presets = load_presets()
    src = json.loads((site / "conference.json").read_text(encoding="utf-8"))
    meta = {}
    buttons = []
    for pid, p in presets.items():
        work = out / "_work" / pid
        work.mkdir(parents=True, exist_ok=True)
        data = dict(src)
        data["theme"] = pid
        (work / "conference.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        if (site / "assets").is_dir():
            shutil.copytree(site / "assets", work / "assets", dirs_exist_ok=True)
        build(work, out / pid, quiet=True)
        meta[pid] = {
            "name_ko": p["name"].get("ko", pid), "name_en": p["name"].get("en", pid),
            "status": p["status"], "source": p["source"], "note_ko": (p.get("note") or {}).get("ko", ""),
        }
        label = p["name"].get("ko", pid) + ("" if p["status"] == "verified" else " (초안)")
        buttons.append(f'<button type="button" data-id="{html.escape(pid)}">{html.escape(label)}</button>')
    shutil.rmtree(out / "_work")
    page = PAGE.format(site=html.escape(site.name), buttons="".join(buttons),
                       presets=json.dumps(meta, ensure_ascii=False))
    (out / "index.html").write_text(page, encoding="utf-8")
    print(f"OK    {out / 'index.html'} — 프리셋 {len(presets)}개: {', '.join(presets)}")


if __name__ == "__main__":
    main()
