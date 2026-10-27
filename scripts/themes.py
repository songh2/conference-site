"""테마(배색) 프리셋 로딩과 검사. build.py / validate.py / app.js 가 같은 규칙을 쓴다.

- 프리셋 파일: themes/<id>.json  (`_` 로 시작하는 파일은 견본이므로 제외)
- conference.json 의 "theme" 은 다음 셋 중 하나:
    "snu-engineering"                         프리셋 id
    {"--primary": "#..."}                     CSS 변수 직접 지정
    {"preset": "slate", "--accent": "#..."}   프리셋 + 일부 변수 덮어쓰기
- 변수 이름은 `--소문자/숫자/하이픈`, 값은 색상·글꼴 목록·px 같은 단순 문자열만 허용한다.
  (중괄호·세미콜론·꺾쇠·url( 같은 것은 CSS/HTML 주입을 막기 위해 거부한다)
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEME_DIR = ROOT / "themes"

VAR_NAME = re.compile(r"^--[a-z0-9-]{1,40}$")
VAR_VALUE = re.compile(r"^[#A-Za-z0-9 ,.()%'\"\-]{1,200}$")
PRESET_ID = re.compile(r"^[a-z0-9-]{1,40}$")
# official: 공식 UI 가이드 수치 / extracted: 기관 홈페이지 화면에서 읽은 값(공식 아님) / generic: 범용 / draft: 초안
STATUSES = ("official", "extracted", "generic", "draft")
STATUS_KO = {"official": "공식 색 기반", "extracted": "홈페이지 추출(공식 아님)", "generic": "범용", "draft": "초안"}


def load_presets():
    """{id: preset_dict}. 프리셋 파일 자체도 검사해서 잘못된 변수는 뺀다."""
    out = {}
    if not THEME_DIR.is_dir():
        return out
    for p in sorted(THEME_DIR.glob("*.json")):
        if p.name.startswith("_"):
            continue
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        pid = d.get("id") or p.stem
        if pid != p.stem or not PRESET_ID.match(pid):
            continue
        clean_vars, _bad = clean_vars_dict(d.get("vars") or {})
        out[pid] = {
            "id": pid,
            "name": d.get("name") or {"ko": pid, "en": pid},
            "group": d.get("group") or "generic",
            "status": d.get("status") if d.get("status") in STATUSES else "draft",
            "source": d.get("source") or "",
            "note": d.get("note") or {},
            "vars": clean_vars,
        }
    return out


def clean_vars_dict(vars_dict):
    """허용되는 변수만 남긴 사전과, 거부된 키 목록을 돌려준다."""
    good, bad = {}, []
    if not isinstance(vars_dict, dict):
        return good, ["(객체가 아님)"]
    for k, v in vars_dict.items():
        if not isinstance(k, str) or not VAR_NAME.match(k):
            bad.append(str(k))
            continue
        if not isinstance(v, str) or not VAR_VALUE.match(v) or "url(" in v.lower():
            bad.append(k)
            continue
        good[k] = v
    return good, bad


def resolve_theme(theme, presets=None):
    """conference.json 의 theme 값 → (최종 CSS 변수 사전, 오류 목록, 경고 목록)."""
    presets = load_presets() if presets is None else presets
    errors, warnings = [], []
    final = {}
    if theme in (None, "", {}):
        return final, errors, warnings
    preset_id = None
    overrides = {}
    if isinstance(theme, str):
        preset_id = theme
    elif isinstance(theme, dict):
        preset_id = theme.get("preset")
        overrides = {k: v for k, v in theme.items() if k != "preset"}
    else:
        errors.append("theme: 문자열(프리셋 id) 또는 객체여야 합니다")
        return final, errors, warnings
    if preset_id:
        if not isinstance(preset_id, str) or preset_id not in presets:
            errors.append(f"theme: 프리셋 '{preset_id}' 이(가) themes/ 폴더에 없습니다. 사용 가능: {', '.join(sorted(presets)) or '(없음)'}")
        else:
            final.update(presets[preset_id]["vars"])
            if presets[preset_id].get("status") == "draft":
                warnings.append(f"theme: 프리셋 '{preset_id}' 은 초안(draft)입니다. 색상 값이 공식 확인된 것이 아닙니다")
    good, bad = clean_vars_dict(overrides)
    for k in bad:
        errors.append(f"theme.{k}: 허용되지 않는 변수 이름이나 값입니다 (이름은 --소문자-하이픈, 값은 색상/글꼴/px 만)")
    final.update(good)
    return final, errors, warnings


def css_block(vars_dict):
    if not vars_dict:
        return ""
    return "\n:root{" + ";".join(f"{k}:{v}" for k, v in vars_dict.items()) + "}\n"


def presets_for_js(presets=None):
    """app.js 에 끼워 넣을 {id: vars} 맵 (런타임에 conference.json 의 theme 을 적용할 때 사용)."""
    presets = load_presets() if presets is None else presets
    return {pid: p["vars"] for pid, p in presets.items()}


# ---------------------------------------------------------------------------
# 글자 대비 검사 (WCAG 2.x 상대 휘도 공식). 테마를 추가할 때 읽기 어려운 조합을 잡아낸다.
DEFAULTS = {
    "--ink": "#1b2230", "--bg": "#faf9f6", "--surface": "#ffffff",
    "--primary": "#173a5e", "--primary-deep": "#0f2a46", "--hero-end": "#2b5a86",
    "--accent": "#b9893b", "--accent-ink": "#1b1300",
}
HEX = re.compile(r"^#([0-9a-fA-F]{6})$")


def _rgb(h):
    m = HEX.match(h or "")
    if not m:
        return None
    v = m.group(1)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def _lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    ra, rb = _rgb(a), _rgb(b)
    if not ra or not rb:
        return None
    la, lb = _lum(ra), _lum(rb)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _over(fg_rgb, alpha, bg_rgb):
    return tuple(round(alpha * f + (1 - alpha) * b) for f, b in zip(fg_rgb, bg_rgb))


def contrast_issues(vars_dict):
    """읽기 어려운 조합 목록 [(설명, 대비값, 기준)]. 색이 #rrggbb 가 아니면 그 항목은 건너뛴다."""
    v = dict(DEFAULTS)
    v.update({k: val for k, val in (vars_dict or {}).items() if isinstance(val, str)})
    if "--focus" not in (vars_dict or {}):
        v["--focus"] = v["--primary"]   # style.css 기본값과 같게
    checks = [
        ("표 머리글·언어 버튼: 흰 글자 / --primary", "#ffffff", v["--primary"], 4.5),
        ("링크 글자: --primary / 페이지 배경", v["--primary"], v["--bg"], 4.5),
        ("소제목 글자: --primary-deep / 페이지 배경", v["--primary-deep"], v["--bg"], 4.5),
        ("바닥글: 흰 글자 / --primary-deep", "#ffffff", v["--primary-deep"], 4.5),
        ("사전등록 버튼: --accent-ink / --accent", v["--accent-ink"], v["--accent"], 4.5),
        ("키보드 초점 테두리: --focus / 페이지 배경", v["--focus"], v["--bg"], 3.0),
    ]
    out = []
    for label, fg, bg, need in checks:
        c = contrast(fg, bg)
        if c is not None and c < need:
            out.append((label, round(c, 2), need))
    # 히어로: 흰 글자가 그라데이션 위에서 읽히는지 (어두운 덧칠 45% 를 감안)
    shade = (10, 22, 40)
    for key in ("--primary-deep", "--primary", "--hero-end"):
        rgb = _rgb(v[key])
        if rgb:
            mixed = "#%02x%02x%02x" % _over(shade, 0.45, rgb)
            c = contrast("#ffffff", mixed)
            if c is not None and c < 4.5:
                out.append((f"대표 영역 흰 글자 / {key}(덧칠 포함)", round(c, 2), 4.5))
    return out
