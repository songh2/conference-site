#!/usr/bin/env python3
"""사전등록 접수용 구글 Apps Script 코드를 만든다.

사용법:
    python3 scripts/make_registration_script.py sites/<slug>
    → sites/<slug>/registration-sheet.gs 생성 (구글 시트의 Apps Script 편집기에 붙여 넣는 파일)

conference.json 의 registration.attendance_options / deadline / timezone 을 읽어
스크립트 맨 위 CONFIG 에 넣는다. 참석 구분이나 마감일을 바꾸면 이 스크립트를 다시 만들어
Apps Script 에 붙여 넣고 [배포 → 배포 관리 → 편집 → 새 버전]으로 반영해야 한다.
이 파일에는 개인정보도 비밀번호도 들어 있지 않다(그래도 배포용 공개 저장소에는 올리지 않는다).
표준 라이브러리만 사용한다.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACEHOLDER = "/*__CONFIG__*/null"


def ko_text(v):
    if isinstance(v, str):
        return v
    return ((v or {}).get("ko") or (v or {}).get("en") or "").strip()


def build_config(data):
    reg = data.get("registration") or {}
    options = []
    for o in reg.get("attendance_options") or []:
        options.append({
            "id": o["id"],
            "label": ko_text(o.get("label")),
            "days": sorted(set(o.get("days") or [])),
        })
    days = sorted({d for o in options for d in o["days"]})
    return {
        "slug": data.get("slug", ""),
        "title": ko_text(data.get("title")),
        "sheetName": "등록",
        "summaryName": "집계",
        "timezone": reg.get("timezone") or "Asia/Seoul",
        "deadline": reg.get("deadline") or "",
        "options": options,
        "days": days,
        "maxRows": 3000,
        "minElapsedMs": 1500,
    }


def make(site_dir):
    data = json.loads((site_dir / "conference.json").read_text(encoding="utf-8"))
    cfg = build_config(data)
    tmpl = (ROOT / "template" / "registration.gs").read_text(encoding="utf-8")
    if PLACEHOLDER not in tmpl:
        raise SystemExit("template/registration.gs 에서 CONFIG 자리표시자를 찾지 못했습니다.")
    code = tmpl.replace(PLACEHOLDER, json.dumps(cfg, ensure_ascii=False, indent=2))
    out = site_dir / "registration-sheet.gs"
    out.write_text(code, encoding="utf-8")
    return out, cfg


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    site_dir = Path(argv[1])
    if not (site_dir / "conference.json").exists():
        print(f"ERROR: conference.json 이 없습니다: {site_dir}")
        return 1
    out, cfg = make(site_dir)
    print(f"OK    {out}")
    print(f"      참석 구분 {len(cfg['options'])}개, 날짜 열 {len(cfg['days'])}개 ({', '.join(cfg['days']) or '없음'}), 마감일 {cfg['deadline'] or '미설정'}")
    if not cfg["options"]:
        print("WARN  registration.attendance_options 가 비어 있습니다. 참석 구분 열이 비어 기록됩니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
