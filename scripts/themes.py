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
            "status": d.get("status") or "draft",
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
