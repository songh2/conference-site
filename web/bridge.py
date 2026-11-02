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


def poster(data_json, layout, size, lang, theme, draft=False):
    """인쇄용 포스터 HTML. 브라우저 인쇄(PDF로 저장)로 내보낸다. draft=True 면 샘플(시안): 빈 칸이 있어도 만든다."""
    data = _loads(data_json)
    site = _site(data, "poster")
    try:
        doc, info = MP.build_poster(site, layout or None, size or None, lang or None, theme or None, draft=bool(draft))
    except SystemExit as e:
        # 화면에는 마지막 줄만 보이므로 한 줄로 합친다
        raise ValueError(" / ".join(x.strip() for x in str(e).splitlines() if x.strip()))
    info = {k: (list(v) if isinstance(v, tuple) else v) for k, v in info.items()}
    return json.dumps({"html": doc, "info": info}, ensure_ascii=False)


def opendesign_brief(data_json):
    data = _loads(data_json)
    site = _site(data, "brief")
    path, theme = EOD.brief(site, out_dir=WORK / "brief")
    return json.dumps({"md": path.read_text(encoding="utf-8"), "theme": theme}, ensure_ascii=False)


def _resolved_theme(data):
    """conference.json 의 theme(프리셋 id·변수 객체·조합) → (id, 프리셋 정보 비슷한 사전, 최종 변수)."""
    presets = T.load_presets()
    th = data.get("theme")
    final, _e, _w = T.resolve_theme(th, presets)
    if isinstance(th, str) and th in presets and not _e:
        return th, presets[th], final
    base = th.get("preset") if isinstance(th, dict) else None
    pid = (base or "default") + ("-custom" if isinstance(th, dict) and len(th) > (1 if base else 0) else "")
    p = {"name": {"ko": "이 행사 맞춤 배색", "en": "Custom event palette"}, "status": "draft",
         "source": f"conference.json 의 theme 값 (프리셋 {base or 'default'} + 사용자·AI 지정 변수)", "note": {}, "vars": final}
    if base in presets and len(th) == 1:
        p = presets[base]
    return pid, p, final


def opendesign_context(data_json, size, lang):
    """AI 디자인 시안용 자료: 사실 브리프, 이 행사 배색의 DESIGN.md·tokens.css(OpenDesign 형식), QR, 쓸 수 있는 사진 자리."""
    data = _loads(data_json)
    data.setdefault("poster", {})
    if not isinstance(data["poster"], dict):
        data["poster"] = {}
    if size:
        data["poster"]["size"] = size
    if lang:
        data["poster"]["lang"] = lang
    site = _site(data, "od")
    path, _theme = EOD.brief(site, out_dir=WORK / "od-brief")
    pid, p, final = _resolved_theme(data)
    v = EOD.full_vars(final)
    url = data["poster"].get("url") or data.get("site_url") or ""
    warnings = []
    qr = MP.qr_svg(url, warnings) if url else ""
    slots = []
    def add(slot, ref, label):
        if isinstance(ref, str) and ref.startswith("assets/") and (ASSETS / ref[len("assets/"):]).is_file() \
                and ref.lower().rsplit(".", 1)[-1] in ("png", "jpg", "jpeg", "webp", "gif", "svg"):
            slots.append({"slot": slot, "ref": ref, "label": label})
    add("hero", data["poster"].get("image") or (data.get("hero") or {}).get("image"), "대표 사진")
    add("logo", (data.get("logo") or {}).get("src") if isinstance(data.get("logo"), dict) else None, "로고(주최 측 제공)")
    for s in data.get("speakers") or []:
        if isinstance(s, dict) and s.get("id"):
            add("speaker:" + s["id"], s.get("photo"), "연사 사진: " + EOD.both(s.get("name")))
    for i, sp in enumerate(data.get("sponsors") or []):
        if isinstance(sp, dict):
            add(f"sponsor:{i}", sp.get("logo"), "후원 로고: " + EOD.both(sp.get("name")))
    w, h = MP.PAPER.get((size or "A2").upper(), MP.PAPER["A2"])
    return json.dumps({"brief": path.read_text(encoding="utf-8"), "design_md": EOD.design_md(pid, p, v),
                       "tokens_css": EOD.tokens_css(pid, p["name"].get("en", pid), v), "vars": v,
                       "qr": qr, "url": url, "slots": slots, "paper_mm": [w, h]}, ensure_ascii=False)


OD_BUNDLE_README = """OpenDesign 앱용 묶음 — {title}
====================================================

이 ZIP 은 conference-site 웹 도구(https://songh2.github.io/conference-site/)가 만든 것입니다.
OpenDesign 앱(https://open-design.ai, 맥·윈도우)에서 이 행사 포스터를 만들 때 씁니다. 자세한 설명:
https://github.com/songh2/conference-site/blob/main/open-design/README.md

들어 있는 것
- poster-brief.md        행사 사실 정보(이 글만 포스터에 씀) — 용지 {size}, 언어 {lang}
- qr.svg                 홈페이지 QR 코드(진짜 코드, 있을 때만){qr_note}
- assets/                포스터에 써도 되는 사진·로고(올린 것만, 있을 때만)
- design-system/{ds_id}/  이 행사 배색의 디자인 시스템(OpenDesign 형식)
- skill/conference-poster/SKILL.md   OpenDesign 용 포스터 스킬(인터넷 링크로 설치해도 됨)

순서 (처음 한 번)
1. 이 ZIP 을 풉니다(더블클릭).
2. OpenDesign → 설정 → 디자인 시스템 추가 → 로컬 → 프로젝트 경로에 풀린 폴더 안의
   design-system/{ds_id} 경로 → 프로젝트에서 가져오기.
3. OpenDesign 의 플러그인 화면 → 플러그인 가져오기(추가) → Skill → URL 칸에:
   https://github.com/songh2/conference-site/tree/main/open-design/skills/conference-poster
   (링크가 안 되면 같은 창의 로컬 폴더 업로드로 skill/conference-poster 폴더를 올립니다)

포스터 만들기
4. 새 프로젝트 → 디자인 시스템 "{ds_name}" 선택 → poster-brief.md, qr.svg, (있으면) assets 사진을 첨부
   → "conference-poster 스킬로 {size} 포스터를 만들어 줘. 브리프에 있는 사실만 써." 라고 요청.
5. 결과를 브리프와 한 줄씩 대조한 뒤, 브라우저 인쇄 → PDF로 저장(여백 없음, 배경 그래픽 켜기).

주의: 참가자 명단·연락처 같은 개인정보는 넣지 마세요. AI 사용료(팩트챗 크레딧 등)는 연결한 키의 계정에서 나갑니다.
"""


def opendesign_bundle(data_json, size, lang):
    """OpenDesign 앱용 묶음(ZIP): 사실 브리프, QR, 쓸 수 있는 사진, 이 행사 배색의 디자인 시스템, 포스터 스킬, 안내문."""
    data = _loads(data_json)
    data.setdefault("poster", {})
    if not isinstance(data["poster"], dict):
        data["poster"] = {}
    if size:
        data["poster"]["size"] = size
    if lang:
        data["poster"]["lang"] = lang
    ctx = json.loads(opendesign_context(json.dumps(data, ensure_ascii=False), size, lang))
    pid, p, final = _resolved_theme(data)
    if pid.endswith("-custom"):
        pid = re.sub(r"[^a-z0-9-]+", "-", (data.get("slug") or "event").lower()).strip("-") + "-custom"
    out = WORK / "od-bundle"
    if out.exists():
        shutil.rmtree(out)
    d = EOD.export_theme(pid, p, out, stamp=False)
    ds_id = d.name
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("poster-brief.md", ctx["brief"])
        if ctx["qr"]:
            z.writestr("qr.svg", '<?xml version="1.0" encoding="UTF-8"?>\n' + ctx["qr"] if not ctx["qr"].startswith("<?xml") else ctx["qr"])
        for sl in ctx["slots"]:
            src = ASSETS / sl["ref"][len("assets/"):]
            if src.is_file():
                z.write(src, sl["ref"])
        for f in sorted(d.iterdir()):
            z.write(f, f"design-system/{ds_id}/{f.name}")
        skill = ROOT / "open-design" / "skills" / "conference-poster" / "SKILL.md"
        if skill.is_file():
            z.write(skill, "skill/conference-poster/SKILL.md")
        z.writestr("README.txt", OD_BUNDLE_README.format(
            title=_title(data), size=(size or "A2").upper(), lang={"ko": "한국어", "en": "English"}.get(lang, "한국어 + 영어"),
            qr_note="" if ctx["qr"] else " — 홈페이지 주소(site_url)가 없어 이번 묶음에는 없음",
            ds_id=ds_id, ds_name=json.loads((d / "manifest.json").read_text(encoding="utf-8"))["name"]))
    return buf.getvalue()


def theme_contrast(theme_json):
    """적용하려는 theme 값(프리셋 id·변수 객체) → {"errors": [...], "issues": [[설명, 대비, 기준], ...]}.
    build.py 가 쓰는 것과 같은 검사(themes.resolve_theme·contrast_issues)."""
    final, errors, _w = T.resolve_theme(json.loads(theme_json))
    return json.dumps({"errors": errors, "issues": [list(x) for x in T.contrast_issues(final)]}, ensure_ascii=False)


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
