#!/usr/bin/env python3
"""사전등록 폼(구글폼) 응답 CSV 에서 참가자 명단(이름·소속)을 conference.json 에 반영합니다.

사용법:
    python3 scripts/import_participants.py sites/<slug> responses.csv            # 반영
    python3 scripts/import_participants.py sites/<slug> responses.csv --dry-run  # 미리 보기
    python3 scripts/import_participants.py sites/<slug> responses.csv --sort     # 이름 가나다/알파벳 순
    python3 scripts/import_participants.py sites/<slug> responses.csv --map m.json
        # 열 이름 직접 지정 (예: {"name_ko": "성명", "consent": "명단 게시 동의"})

규칙:
  - 명단은 CSV 전체로 **다시 만듭니다** (응답 시트가 원본). 삭제·수정도 시트에서 하면 됩니다.
  - '게시 동의' 열이 있으면 "예/Yes/동의" 로 시작하는 응답만 넣습니다. 열이 없으면 전원을 넣되 경고를 출력합니다.
  - 같은 사람(이메일 동일, 없으면 이름+소속 동일)이 여러 번 응답했으면 마지막 응답만 씁니다.
  - 이름·소속만 홈페이지에 올라갑니다. 이메일·연락처 등은 읽기만 하고 저장하지 않습니다.
열 이름 키워드(대소문자 무관): 성명/이름/name · 영문 성명/english name · 소속/affiliation · 영문 소속 · 동의/consent/agree · 이메일/email
표준 라이브러리만 사용합니다.
"""
import argparse
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

KEYWORDS = {
    "name_en": ["영문 성명", "영문 이름", "english name", "name (english", "name in english", "name (en"],
    "name_ko": ["성명", "이름", "name"],
    "affiliation_en": ["영문 소속", "affiliation (english", "affiliation (en", "affiliation in english"],
    "affiliation_ko": ["소속", "affiliation"],
    "consent": ["명단 게시", "게시 동의", "공개 동의", "consent", "agree", "listed"],
    "email": ["이메일", "email", "e-mail", "메일"],
}
ORDER = ["name_en", "name_ko", "affiliation_en", "affiliation_ko", "consent", "email"]
YES = ("예", "yes", "y", "동의", "agree", "네")


def detect_columns(headers, explicit=None):
    mapping = dict(explicit or {})
    used = set(mapping.values())
    for field in ORDER:
        if field in mapping:
            continue
        for hdr in headers:
            if hdr in used:
                continue
            if any(k in hdr.lower() for k in KEYWORDS[field]):
                mapping[field] = hdr
                used.add(hdr)
                break
    return mapping


def norm(s):
    return re.sub(r"\s+", "", (s or "")).lower()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_dir")
    ap.add_argument("csv_path")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sort", action="store_true", help="이름순 정렬 (기본: 등록 순)")
    ap.add_argument("--map", dest="map_path")
    args = ap.parse_args()

    site = Path(args.site_dir)
    cfg_path = site / "conference.json"
    data = json.loads(cfg_path.read_text(encoding="utf-8"))

    explicit = json.loads(Path(args.map_path).read_text(encoding="utf-8")) if args.map_path else None
    with open(args.csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit("CSV 에 응답이 없습니다.")
    cols = detect_columns(list(rows[0].keys()), explicit)
    print("인식한 열:")
    for k, v in cols.items():
        print(f"  {k:15s} ← {v!r}")
    if "name_ko" not in cols and "name_en" not in cols:
        raise SystemExit("이름 열을 찾지 못했습니다. --map 으로 지정해 주세요.")
    if "consent" not in cols:
        print("\n[주의] '명단 게시 동의' 열이 없어 응답자 전원을 명단에 넣습니다. 개인정보 게시 동의를 받았는지 확인하세요.")

    def get(row, field):
        col = cols.get(field)
        return (row.get(col) or "").strip() if col else ""

    ordered = {}  # key → record (dict 는 삽입 순서를 유지; 재응답 시 최신 값으로 교체)
    skipped = 0
    for row in rows:
        name_ko, name_en = get(row, "name_ko"), get(row, "name_en")
        if not (name_ko or name_en):
            continue
        consent = get(row, "consent").lower()
        if "consent" in cols and not consent.startswith(YES):
            skipped += 1
            continue
        aff_ko, aff_en = get(row, "affiliation_ko"), get(row, "affiliation_en")
        key = get(row, "email").lower() or (norm(name_ko or name_en) + "|" + norm(aff_ko or aff_en))
        ordered[key] = {"name": {"ko": name_ko, "en": name_en}, "affiliation": {"ko": aff_ko, "en": aff_en}}

    participants = list(ordered.values())
    if args.sort:
        participants.sort(key=lambda p: (p["name"]["ko"] or p["name"]["en"]).lower())

    data["participants"] = participants
    data["updated"] = date.today().isoformat()
    print(f"\n참가자 {len(participants)}명 (게시 미동의 {skipped}명 제외, 중복 제거 후)")
    for p in participants[:15]:
        print(f"  - {p['name']['ko'] or p['name']['en']} ({p['affiliation']['ko'] or p['affiliation']['en']})")
    if len(participants) > 15:
        print(f"  … 외 {len(participants) - 15}명")
    if args.dry_run:
        print("\n--dry-run: 파일은 수정하지 않았습니다.")
        return
    cfg_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nOK    {cfg_path} 갱신 완료. build.py 를 실행하거나, 배포 저장소의 conference.json 을 이 파일로 교체하세요.")


if __name__ == "__main__":
    sys.exit(main())
