"""웹 도구(index.html)와 저장소 스크립트를 잇는 연결 모듈 — 브라우저 안 파이썬(Pyodide)에서 실행된다.

새 계산 로직을 넣지 않는다. 홈페이지·검사·포스터·등록 스크립트는 모두 scripts/*.py 를 그대로 불러 쓰므로
웹 도구의 결과물은 컴퓨터에서 `python3 scripts/build.py` 로 만든 것과 같다.

파일 위치(Pyodide 가상 디스크):
  /repo/...          저장소 파일(web/manifest.json 에 적힌 것만 내려받아 둔다)
  /work/assets/...   사용자가 올린 사진·PDF (웹 도구가 올릴 때마다 여기에 써 둔다)
"""
import base64
import contextlib
import copy
import io
import json
import mimetypes
import re
import shutil
import sys
import zipfile
from pathlib import Path

import os
ROOT = Path(os.environ.get("CONF_SITE_ROOT", "/repo"))   # 컴퓨터에서 시험할 때는 저장소 경로를 준다
WORK = Path(os.environ.get("CONF_SITE_WORK", "/work"))
ASSETS = WORK / "assets"
sys.path.insert(0, str(ROOT / "scripts"))

import build as B  # noqa: E402
import validate as V  # noqa: E402
import make_poster as MP  # noqa: E402
import make_registration_script as MR  # noqa: E402
import export_open_design as EOD  # noqa: E402
import themes as T  # noqa: E402

SITE_README = """# {title}

이 저장소는 [conference-site 웹 도구](https://songh2.github.io/conference-site/)로 만든 행사 홈페이지입니다.

- 홈페이지 주소: 저장소 **Settings → Pages** 에 표시됩니다.
- 내용을 고칠 때: 웹 도구에서 보관해 둔 **원본 conference.json** 을 불러와 고친 뒤, 새 ZIP 의 파일을 이 저장소에 다시 올립니다(같은 이름은 덮어쓰기).
- 이 저장소의 `conference.json` 은 공개본입니다. 이메일은 수집 방지 처리(`email_enc`)되어 있습니다. 평문 이메일이 든 원본은 여기에 올리지 마세요.
"""


def _loads(data_json):
    return json.loads(data_json)


def _asset_refs(obj, found):
    if isinstance(obj, dict):
        for v in obj.values():
            _asset_refs(v, found)
    elif isinstance(obj, list):
        for v in obj:
            _asset_refs(v, found)
    elif isinstance(obj, str) and obj.startswith("assets/") and ".." not in obj.split("/"):
        found.add(obj[len("assets/"):])
    return found


def _site(data, name="site"):
    """사용자 데이터와 자산으로 임시 사이트 폴더를 만든다. 자산은 conference.json 이 실제로 가리키는 파일만 넣는다."""
    site = WORK / name
    if site.exists():
        shutil.rmtree(site)
    site.mkdir(parents=True)
    (site / "conference.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for rel in sorted(_asset_refs(data, set())):
        src = ASSETS / rel
        if src.is_file():
            dst = site / "assets" / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    return site


def _title(data):
    t = data.get("title") or {}
    return (t.get("ko") or t.get("en") or data.get("slug") or "행사 홈페이지").replace("\n", " ") if isinstance(t, dict) else str(t)


@contextlib.contextmanager
def _quiet():
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        yield buf
    finally:
        sys.stdout = old


def check(data_json):
    """validate.py 결과. JSON 문법 오류도 몇째 줄인지 알려 준다."""
    try:
        data = _loads(data_json)
    except json.JSONDecodeError as e:
        return json.dumps({"errors": [f"JSON 문법 오류: {e.lineno}번째 줄 {e.colno}번째 글자 — {e.msg}"], "warnings": []}, ensure_ascii=False)
    errors, warnings = V.validate(data)
    return json.dumps({"errors": errors, "warnings": warnings}, ensure_ascii=False)


def _inline_assets(obj):
    """미리보기 전용: 'assets/...' 경로 문자열을 실제 파일 내용(data URI)으로 바꾼다."""
    if isinstance(obj, dict):
        return {k: _inline_assets(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_inline_assets(v) for v in obj]
    if isinstance(obj, str) and obj.startswith("assets/"):
        p = ASSETS / obj[len("assets/"):]
        if p.is_file():
            mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
            return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")
    return obj


def preview(data_json):
    """미리보기용 index.html. 검사 오류가 있어도 보이는 데까지 그린다(배포용 ZIP 은 오류가 있으면 만들지 않는다)."""
    data = _inline_assets(_loads(data_json))
    site = _site(data, "preview")
    saved = B.validate
    B.validate = lambda d: ([], [])
    try:
        with _quiet():
            path = B.build(site, None, quiet=True)
        html = path.read_text(encoding="utf-8")
        # 미리보기 창은 웹 도구 주소에서 열리므로, 서버의 conference.json 대신 내장 데이터만 쓰게 한다
        return html.replace('<script id="site-data" type="application/json">', '<script id="site-data" type="application/json" data-embedded-only>', 1)
    finally:
        B.validate = saved


def make_zip(data_json):
    """배포용 ZIP(bytes). index.html, 공개본 conference.json(이메일 난독화·_todo 제거), assets/, .nojekyll, README.md."""
    data = _loads(data_json)
    errors, _w = V.validate(data)
    if errors:
        raise ValueError("검사 오류 " + str(len(errors)) + "건을 먼저 고쳐 주세요")
    site = _site(data, "deploy-src")
    (site / "README.md").write_text(SITE_README.format(title=_title(data)), encoding="utf-8")
    out = WORK / "deploy"
    if out.exists():
        shutil.rmtree(out)
    with _quiet():
        B.build(site, out, quiet=True)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(out.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(out).as_posix())
    return buf.getvalue()


def public_json(data_json):
    """배포 저장소에 올라가는 공개본 conference.json (확인용)."""
    pub, n = B.protect_emails(_loads(data_json))
    return json.dumps({"json": json.dumps(pub, ensure_ascii=False, indent=2) + "\n", "protected": n}, ensure_ascii=False)


def registration_code(data_json):
    """구글 Apps Script 코드(template/registration.gs + 설정)."""
    data = _loads(data_json)
    site = _site(data, "reg")
    out, cfg = MR.make(site)
    return json.dumps({"code": out.read_text(encoding="utf-8"), "options": len(cfg["options"]), "days": cfg["days"],
                       "deadline": cfg["deadline"]}, ensure_ascii=False)


def poster(data_json, layout, size, lang, theme):
    """인쇄용 포스터 HTML. 브라우저 인쇄(PDF로 저장)로 내보낸다."""
    data = _loads(data_json)
    site = _site(data, "poster")
    try:
        doc, info = MP.build_poster(site, layout or None, size or None, lang or None, theme or None)
    except SystemExit as e:
        raise ValueError(str(e))
    info = {k: (list(v) if isinstance(v, tuple) else v) for k, v in info.items()}
    return json.dumps({"html": doc, "info": info}, ensure_ascii=False)


def opendesign_brief(data_json):
    data = _loads(data_json)
    site = _site(data, "brief")
    path, theme = EOD.brief(site, out_dir=WORK / "brief")
    return json.dumps({"md": path.read_text(encoding="utf-8"), "theme": theme}, ensure_ascii=False)


def themes_list():
    """테마 선택 화면용: id, 이름, 상태, 대표 색."""
    out = []
    for pid, p in T.load_presets().items():
        v = p["vars"]
        out.append({"id": pid, "name": p["name"], "status": p["status"], "group": p.get("group", ""),
                    "primary": v.get("--primary", ""), "deep": v.get("--primary-deep", ""), "accent": v.get("--accent", "")})
    return json.dumps(out, ensure_ascii=False)


def extract_text(path):
    """한글(hwpx)·워드(docx)·텍스트 파일에서 글자만 뽑는다(AI 자료 읽기용). hwp(옛 형식)는 지원하지 않는다."""
    p = Path(path)
    name = p.name.lower()
    if name.endswith((".txt", ".md", ".csv", ".json")):
        return p.read_bytes().decode("utf-8", errors="replace")
    if name.endswith(".hwpx"):
        parts = []
        with zipfile.ZipFile(p) as z:
            secs = sorted(n for n in z.namelist() if re.match(r"Contents/section\d+\.xml$", n))
            for n in secs:
                xml = z.read(n).decode("utf-8", errors="replace")
                for para in re.findall(r"<hp:p[ >].*?</hp:p>", xml, flags=re.S):
                    t = "".join(re.findall(r"<hp:t>(.*?)</hp:t>", para, flags=re.S))
                    parts.append(re.sub(r"<[^>]+>", "", t))
        return _unescape("\n".join(parts))
    if name.endswith(".docx"):
        with zipfile.ZipFile(p) as z:
            xml = z.read("word/document.xml").decode("utf-8", errors="replace")
        paras = re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S)
        return _unescape("\n".join("".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", x, flags=re.S)) for x in paras))
    raise ValueError("글자를 뽑을 수 없는 파일 형식입니다: " + p.name)


def _unescape(s):
    import html
    return html.unescape(s)


def import_zip(path):
    """예전에 받은 ZIP(이 도구의 배포 ZIP, 또는 GitHub 의 'Download ZIP')에서 conference.json 과 assets/ 를 꺼낸다."""
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if not n.endswith("/")]
        cands = sorted((n for n in names if n.endswith("conference.json")), key=lambda n: n.count("/"))
        if not cands:
            raise ValueError("ZIP 안에 conference.json 이 없습니다")
        cj = cands[0]
        base = cj[: -len("conference.json")]
        text = z.read(cj).decode("utf-8")
        got = []
        for n in names:
            if n.startswith(base + "assets/"):
                rel = n[len(base + "assets/"):]
                if not rel or ".." in rel.split("/"):
                    continue
                dst = ASSETS / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(z.read(n))
                got.append("assets/" + rel)
    return json.dumps({"json": text, "assets": got}, ensure_ascii=False)
