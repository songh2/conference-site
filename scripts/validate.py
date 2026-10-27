#!/usr/bin/env python3
"""conference.json 검사 스크립트.

사용법:
    python3 scripts/validate.py sites/<slug>/conference.json

필수 항목·날짜 형식·한/영 누락을 점검하고 결과를 출력합니다.
오류(ERROR)가 있으면 종료 코드 1, 경고(WARN)만 있으면 0을 반환합니다.
표준 라이브러리만 사용하므로 별도 설치가 필요 없습니다.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from themes import resolve_theme  # noqa: E402

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME = re.compile(r"^\d{1,2}:\d{2}(\s*[–\-~]\s*\d{1,2}:\d{2})?\s*[–\-~]?$")
REQUIRED_TOP = ["slug", "title", "dates", "venue", "program", "registration"]


def is_bilingual(v):
    return isinstance(v, dict) and ("ko" in v or "en" in v)


def check_bilingual(path, v, errors, warnings, required=False):
    if v is None or v == "":
        if required:
            errors.append(f"{path}: 필수 항목인데 비어 있습니다")
        return
    if isinstance(v, str):
        warnings.append(f"{path}: 문자열 하나만 있습니다. {{\"ko\": ..., \"en\": ...}} 형태를 권장합니다")
        return
    if not is_bilingual(v):
        errors.append(f"{path}: {{\"ko\": ..., \"en\": ...}} 형태여야 합니다")
        return
    ko, en = (v.get("ko") or "").strip(), (v.get("en") or "").strip()
    if required and not ko and not en:
        errors.append(f"{path}: 한글/영문 모두 비어 있습니다")
    elif not en and ko:
        warnings.append(f"{path}: 영문(en)이 비어 있어 영어 화면에 한글이 그대로 표시됩니다")
    elif not ko and en:
        warnings.append(f"{path}: 한글(ko)이 비어 있어 한글 화면에 영문이 그대로 표시됩니다")


def check_iso(path, v, errors, allow_empty=True):
    if not v:
        if not allow_empty:
            errors.append(f"{path}: 날짜가 필요합니다 (YYYY-MM-DD)")
        return None
    if not ISO.match(str(v)):
        errors.append(f"{path}: 날짜 형식이 YYYY-MM-DD 가 아닙니다 → {v!r}")
        return None
    try:
        return date.fromisoformat(v)
    except ValueError:
        errors.append(f"{path}: 존재하지 않는 날짜입니다 → {v!r}")
        return None


def check_url(path, v, warnings):
    if not v:
        return
    if not (v.startswith("http://") or v.startswith("https://") or v.startswith("assets/") or v.startswith("./") or v.startswith("#")):
        warnings.append(f"{path}: URL 형식이 이상합니다 → {v!r}")


def validate(data):
    errors, warnings = [], []

    for k in REQUIRED_TOP:
        if k not in data:
            errors.append(f"최상위 '{k}' 항목이 없습니다")
    slug = data.get("slug", "")
    if slug and not re.match(r"^[a-z0-9][a-z0-9\-]*$", slug):
        errors.append("slug 는 소문자·숫자·하이픈만 사용합니다 (예: ntc2027)")

    check_bilingual("title", data.get("title"), errors, warnings, required=True)
    for k in ["short_title", "subtitle", "kicker", "about", "host", "footer", "accommodation"]:
        if k in data:
            check_bilingual(k, data.get(k), errors, warnings)

    d = data.get("dates") or {}
    start = check_iso("dates.start", d.get("start"), errors, allow_empty=False)
    end = check_iso("dates.end", d.get("end"), errors)
    if start and end and end < start:
        errors.append("dates.end 가 dates.start 보다 앞섭니다")
    if "display" in d:
        check_bilingual("dates.display", d.get("display"), errors, warnings)

    v = data.get("venue") or {}
    check_bilingual("venue.name", v.get("name"), errors, warnings, required=True)
    for k in ["room", "address", "directions"]:
        if k in v:
            check_bilingual(f"venue.{k}", v.get(k), errors, warnings)
    check_url("venue.map_url", v.get("map_url"), warnings)

    hero = data.get("hero") or {}
    if hero.get("image"):
        check_url("hero.image", hero.get("image"), warnings)
    else:
        warnings.append("hero.image 가 비어 있어 대표 사진 대신 기본 그라데이션 배경이 사용됩니다")

    # 좌표 (지도 삽입용)
    lat, lng = v.get("lat"), v.get("lng")
    if (lat is None) != (lng is None):
        errors.append("venue.lat 와 venue.lng 는 둘 다 넣거나 둘 다 비워야 합니다")
    if lat is not None:
        try:
            if not (-90 <= float(lat) <= 90 and -180 <= float(lng) <= 180):
                errors.append("venue.lat/lng 범위가 이상합니다 (위도 -90~90, 경도 -180~180)")
        except (TypeError, ValueError):
            errors.append("venue.lat/lng 는 숫자여야 합니다 (예: 37.4596, 126.9522)")
    if v.get("routes"):
        warnings.append("venue.routes 는 더 이상 사용되지 않는 항목입니다(출발지별 길찾기 기능 제거). 지워도 됩니다")

    # 참가자 명단
    for i, pt in enumerate(data.get("participants") or []):
        check_bilingual(f"participants[{i}].name", pt.get("name"), errors, warnings, required=True)
        if "affiliation" in pt:
            check_bilingual(f"participants[{i}].affiliation", pt.get("affiliation"), errors, warnings)
    if "participants_note" in data:
        check_bilingual("participants_note", data.get("participants_note"), errors, warnings)
    purl = data.get("participants_url")
    if purl:
        check_url("participants_url", purl, warnings)
        if "docs.google.com" in purl and "output=csv" not in purl:
            warnings.append("participants_url: 구글 시트는 '파일 → 공유 → 웹에 게시 → CSV' 로 만든 주소(…output=csv)를 넣어야 합니다")
        warnings.append("participants_url 사용 시 게시한 탭에 이름·소속(·동의) 열만 있는지 확인하세요 (이메일 등 다른 열이 함께 공개되지 않도록)")

    for i, g in enumerate(data.get("committees") or []):
        check_bilingual(f"committees[{i}].name", g.get("name"), errors, warnings, required=True)
        for j, m in enumerate(g.get("members") or []):
            p = f"committees[{i}].members[{j}]"
            check_bilingual(f"{p}.name", m.get("name"), errors, warnings, required=True)
            if "affiliation" in m:
                check_bilingual(f"{p}.affiliation", m.get("affiliation"), errors, warnings)
            check_url(f"{p}.url", m.get("url"), warnings)
            if m.get("email") and "@" not in m["email"]:
                errors.append(f"{p}.email 형식이 이상합니다 → {m['email']!r}")

    speaker_ids = {}
    for i, s in enumerate(data.get("speakers") or []):
        p = f"speakers[{i}]"
        check_bilingual(f"{p}.name", s.get("name"), errors, warnings, required=True)
        sid = s.get("id")
        if not sid:
            warnings.append(f"{p}.id 가 없어 프로그램 표에서 이 발표자를 연결(speaker_id)할 수 없습니다")
        elif not re.match(r"^[a-z0-9][a-z0-9\-]*$", sid):
            errors.append(f"{p}.id 는 소문자·숫자·하이픈만 사용합니다 → {sid!r}")
        elif sid in speaker_ids:
            errors.append(f"{p}.id {sid!r} 가 speakers[{speaker_ids[sid]}] 와 중복됩니다")
        else:
            speaker_ids[sid] = i
        for k in ("title", "abstract", "affiliation"):
            if k in s:
                check_bilingual(f"{p}.{k}", s.get(k), errors, warnings)
        if not (s.get("title") and (s["title"].get("ko") or s["title"].get("en"))):
            warnings.append(f"{p}: 강연 제목이 없어 '강연 제목 추후 공지' 로 표시됩니다")
        check_url(f"{p}.url", s.get("url"), warnings)
        if s.get("email") and "@" not in s["email"]:
            errors.append(f"{p}.email 형식이 이상합니다 → {s['email']!r}")
        slides = s.get("slides")
        if isinstance(slides, list):
            for k, sl in enumerate(slides):
                if not isinstance(sl, dict) or not sl.get("url"):
                    errors.append(f"{p}.slides[{k}] 는 {{\"label\": ko/en, \"url\": ...}} 형태여야 합니다")
                else:
                    check_url(f"{p}.slides[{k}].url", sl["url"], warnings)
        elif slides:
            check_url(f"{p}.slides", slides, warnings)

    for i, day in enumerate(data.get("program") or []):
        check_iso(f"program[{i}].date", day.get("date"), errors, allow_empty=False)
        if "label" in day:
            check_bilingual(f"program[{i}].label", day.get("label"), errors, warnings)
        for j, it in enumerate(day.get("items") or []):
            p = f"program[{i}].items[{j}]"
            check_bilingual(f"{p}.title", it.get("title"), errors, warnings, required=True)
            tm = it.get("time", "")
            if tm and not TIME.match(tm):
                warnings.append(f"{p}.time: 'HH:MM–HH:MM' 형식을 권장합니다 → {tm!r}")
            sid = it.get("speaker_id")
            if sid and sid not in speaker_ids:
                errors.append(f"{p}.speaker_id {sid!r} 에 해당하는 speakers[].id 가 없습니다")

    r = data.get("registration") or {}
    check_iso("registration.deadline", r.get("deadline"), errors)
    check_url("registration.form_url", r.get("form_url"), warnings)
    if not r.get("form_url"):
        warnings.append("registration.form_url 이 비어 있어 '사전등록 폼 준비 중'으로 표시됩니다")
    if r.get("status") not in (None, "", "auto", "open", "closed", "soon"):
        errors.append("registration.status 는 auto/open/closed/soon 중 하나여야 합니다")

    # 홈페이지 안 등록 양식 (구글 시트 + Apps Script)
    endpoint = r.get("endpoint") or ""
    options = r.get("attendance_options") or []
    if endpoint:
        if not endpoint.startswith("https://"):
            errors.append(f"registration.endpoint 는 https:// 로 시작해야 합니다 → {endpoint!r}")
        elif "script.google.com" not in endpoint or not endpoint.rstrip("/").endswith("/exec"):
            warnings.append("registration.endpoint 가 Apps Script 웹 앱 주소(https://script.google.com/macros/s/…/exec) 모양이 아닙니다. 배포 화면의 '웹 앱 URL'을 그대로 붙여 넣었는지 확인하세요")
        if not options:
            errors.append("registration.endpoint 를 쓰려면 registration.attendance_options 가 1개 이상 필요합니다")
        if not is_bilingual(r.get("privacy_notice")) or not ((r["privacy_notice"].get("ko") or "").strip() or (r["privacy_notice"].get("en") or "").strip()):
            errors.append("registration.endpoint 를 쓰려면 개인정보 수집·이용 안내문 registration.privacy_notice(ko/en)가 필요합니다")
        else:
            check_bilingual("registration.privacy_notice", r.get("privacy_notice"), errors, warnings)
        if data.get("participants_url"):
            warnings.append("registration.endpoint 가 있으면 참가자 명단은 endpoint 에서 읽으므로 participants_url 은 쓰이지 않습니다")
    elif options:
        warnings.append("registration.attendance_options 가 있지만 endpoint 가 비어 있어 등록 양식이 표시되지 않습니다 (Apps Script 배포 후 웹 앱 URL 을 넣으세요)")
    seen_opt = set()
    for i, o in enumerate(options):
        p = f"registration.attendance_options[{i}]"
        oid = o.get("id")
        if not oid or not re.match(r"^[a-z0-9][a-z0-9\-]*$", oid):
            errors.append(f"{p}.id 는 소문자·숫자·하이픈만 사용합니다 → {oid!r}")
        elif oid in seen_opt:
            errors.append(f"{p}.id {oid!r} 가 중복됩니다")
        else:
            seen_opt.add(oid)
        check_bilingual(f"{p}.label", o.get("label"), errors, warnings, required=True)
        if "note" in o:
            check_bilingual(f"{p}.note", o.get("note"), errors, warnings)
        days = o.get("days")
        if not isinstance(days, list) or not days:
            errors.append(f"{p}.days 는 참석일(YYYY-MM-DD) 목록이어야 합니다")
        else:
            for dv in days:
                check_iso(f"{p}.days", dv, errors, allow_empty=False)

    if not (data.get("contact") or []):
        warnings.append("contact 가 비어 있어 '문의처는 추후 공지' 로 표시됩니다")
    for i, c in enumerate(data.get("contact") or []):
        if c.get("email") and "@" not in c["email"]:
            errors.append(f"contact[{i}].email 형식이 이상합니다 → {c['email']!r}")

    check_iso("updated", data.get("updated"), errors)

    if data.get("email_protection") not in (None, "", "captcha", "none"):
        errors.append("email_protection 은 captcha 또는 none 이어야 합니다")
    enc_in_source = []
    for i, g in enumerate(data.get("committees") or []):
        for j, m in enumerate(g.get("members") or []):
            if m.get("email_enc"):
                enc_in_source.append(f"committees[{i}].members[{j}]")
    for i, s in enumerate(data.get("speakers") or []):
        if s.get("email_enc"):
            enc_in_source.append(f"speakers[{i}]")
    for i, c in enumerate(data.get("contact") or []):
        if c.get("email_enc"):
            enc_in_source.append(f"contact[{i}]")
    if enc_in_source:
        warnings.append("원본에는 평문 email 을 적으세요(난독화는 build.py 가 합니다). email_enc 가 있는 곳: " + ", ".join(enc_in_source))

    # 테마(배색) — 프리셋 id, CSS 변수 객체, 또는 둘의 조합
    _vars, t_err, t_warn = resolve_theme(data.get("theme"))
    errors.extend(t_err)
    warnings.extend(t_warn)

    # 기관 로고 (선택) — 파일은 사용 권한이 있는 것만. 이 템플릿은 어떤 기관의 로고도 포함하지 않는다.
    logo = data.get("logo")
    if logo not in (None, "", {}):
        if not isinstance(logo, dict):
            errors.append("logo 는 {\"src\": \"assets/logo.svg\", \"alt\": {\"ko\": ..., \"en\": ...}} 형태여야 합니다")
        else:
            src = logo.get("src") or ""
            if src:
                check_url("logo.src", src, warnings)
                if not (isinstance(logo.get("alt"), dict) and (logo["alt"].get("ko") or logo["alt"].get("en"))):
                    warnings.append("logo.alt(기관명 등 대체 텍스트)가 비어 있습니다. 화면 낭독기 사용자를 위해 채우세요")

    # 홈페이지 주소 (포스터 QR 코드에 쓰임)
    su = data.get("site_url")
    if su and not str(su).startswith(("https://", "http://")):
        errors.append(f"site_url 은 http(s):// 로 시작하는 주소여야 합니다 → {su!r}")

    # 연사 사진·구분 (포스터에서 사용)
    for i, s in enumerate(data.get("speakers") or []):
        if s.get("photo"):
            check_url(f"speakers[{i}].photo", s.get("photo"), warnings)
        if "group" in s:
            check_bilingual(f"speakers[{i}].group", s.get("group"), errors, warnings)

    # 포스터 설정 (scripts/make_poster.py)
    poster = data.get("poster")
    if poster not in (None, {}):
        if not isinstance(poster, dict):
            errors.append("poster 는 객체여야 합니다")
        else:
            if poster.get("layout") not in (None, "", "auto", "program", "speakers", "lecture", "photo"):
                errors.append("poster.layout 은 auto, program, speakers, lecture, photo 중 하나입니다")
            if str(poster.get("size") or "A2").upper() not in ("A1", "A2", "A3", "A4"):
                errors.append("poster.size 는 A1, A2, A3, A4 중 하나입니다")
            if poster.get("lang") not in (None, "", "ko", "en", "both"):
                errors.append("poster.lang 은 ko, en, both 중 하나입니다")
            for k in ("headline", "kicker", "note"):
                if k in poster:
                    check_bilingual(f"poster.{k}", poster.get(k), errors, warnings)
            for j, hl in enumerate(poster.get("highlights") or []):
                check_bilingual(f"poster.highlights[{j}]", hl, errors, warnings)
            if poster.get("image"):
                check_url("poster.image", poster.get("image"), warnings)
            if poster.get("url"):
                if not str(poster["url"]).startswith(("https://", "http://")):
                    errors.append("poster.url 은 http(s):// 로 시작해야 합니다")
            if poster.get("speaker_id") and poster["speaker_id"] not in {s.get("id") for s in data.get("speakers") or []}:
                errors.append(f"poster.speaker_id {poster['speaker_id']!r} 에 해당하는 speakers[].id 가 없습니다")
            if not (poster.get("url") or su):
                warnings.append("poster: 홈페이지 주소(site_url 또는 poster.url)가 없어 포스터에 QR 코드가 들어가지 않습니다")

    for todo in data.get("_todo") or []:
        warnings.append(f"[확인 필요] {todo}")

    return errors, warnings


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    path = Path(argv[1])
    if path.is_dir():
        path = path / "conference.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"ERROR: 파일이 없습니다: {path}")
        return 1
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON 문법 오류 ({path}) — {e.lineno}행 {e.colno}열: {e.msg}")
        return 1

    errors, warnings = validate(data)
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n검사 완료: 오류 {len(errors)}건, 경고 {len(warnings)}건 — {path}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
