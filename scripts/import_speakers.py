#!/usr/bin/env python3
"""발표자 제출 폼(구글폼) 응답 CSV 를 conference.json 의 speakers 에 반영합니다.

사용법:
    python3 scripts/import_speakers.py sites/<slug> responses.csv            # 반영
    python3 scripts/import_speakers.py sites/<slug> responses.csv --dry-run  # 결과만 미리 보기
    python3 scripts/import_speakers.py sites/<slug> responses.csv --map mapping.json
        # 열 이름을 직접 지정 (예: {"title_en": "Talk title", "abstract_en": "Abstract"})

CSV 는 구글폼 응답 시트에서 "파일 → 다운로드 → CSV" 로 받은 파일을 그대로 쓰면 됩니다.
열 이름은 아래 키워드로 자동 인식합니다 (대소문자 무관). 한 열에 한/영이 섞여 있으면
같은 값을 ko/en 양쪽에 넣습니다(수학 강연 제목은 보통 영문이므로 자연스럽습니다).

  성명/이름/name · 영문 성명/english name · 소속/affiliation · 강연 제목/발표 제목/title
  초록/abstract · 발표자료/slides/파일/file · 이메일/email · 홈페이지/homepage/website

기존 발표자와는 이메일(우선) 또는 이름으로 맞추고, CSV 에 값이 있는 항목만 덮어씁니다.
새 발표자는 영문 이름으로 id 를 만들고(없으면 spk-01 …), 프로그램 표에서 speaker_id 로 연결할 수 있습니다.
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
    "affiliation_en": ["영문 소속", "affiliation (english", "affiliation (en"],
    "affiliation_ko": ["소속", "affiliation"],
    "title_en": ["영문 제목", "title (english", "title (en"],
    "title_ko": ["강연 제목", "발표 제목", "제목", "talk title", "title"],
    "abstract_en": ["영문 초록", "abstract (english", "abstract (en"],
    "abstract_ko": ["초록", "abstract"],
    "slides": ["발표자료", "발표 자료", "슬라이드", "slides", "파일", "file", "upload"],
    "email": ["이메일", "email", "e-mail", "메일"],
    "url": ["홈페이지", "homepage", "website", "url", "웹사이트"],
    "consent": ["게시 동의", "공개 동의", "consent", "agree"],
}
ORDER = ["name_en", "name_ko", "affiliation_en", "affiliation_ko", "title_en", "title_ko",
         "abstract_en", "abstract_ko", "slides", "email", "url", "consent"]


def detect_columns(headers, explicit=None):
    mapping = dict(explicit or {})
    used = set(mapping.values())
    for field in ORDER:
        if field in mapping:
            continue
        for hdr in headers:
            if hdr in used:
                continue
            low = hdr.lower()
            if any(k in low for k in KEYWORDS[field]):
                mapping[field] = hdr
                used.add(hdr)
                break
    return mapping


def norm(s):
    return re.sub(r"\s+", "", (s or "")).lower()


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s


def bilingual(ko, en):
    ko, en = (ko or "").strip(), (en or "").strip()
    if ko and not en:
        # 값이 하나뿐이면 양쪽에 같은 값 (영문 제목을 한글 화면에도 그대로 보여 주기 위함)
        return {"ko": ko, "en": ko}
    if en and not ko:
        return {"ko": en, "en": en}
    return {"ko": ko, "en": en}


def merge_bilingual(old, new):
    old = old if isinstance(old, dict) else {"ko": old or "", "en": ""}
    out = dict(old)
    for k in ("ko", "en"):
        if new.get(k):
            out[k] = new[k]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site_dir")
    ap.add_argument("csv_path")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--map", dest="map_path", help="열 이름 지정 JSON (필드명 → CSV 열 제목)")
    args = ap.parse_args()

    site = Path(args.site_dir)
    cfg_path = site / "conference.json"
    data = json.loads(cfg_path.read_text(encoding="utf-8"))
    speakers = data.setdefault("speakers", [])

    explicit = json.loads(Path(args.map_path).read_text(encoding="utf-8")) if args.map_path else None
    with open(args.csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit("CSV 에 응답이 없습니다.")
    headers = list(rows[0].keys())
    cols = detect_columns(headers, explicit)
    print("인식한 열:")
    for k, v in cols.items():
        print(f"  {k:15s} ← {v!r}")
    missing = [k for k in ("name_ko", "name_en") if k not in cols]
    if len(missing) == 2:
        raise SystemExit("이름 열을 찾지 못했습니다. --map 으로 지정해 주세요 (예: {\"name_ko\": \"성명\"}).")

    def get(row, field):
        col = cols.get(field)
        return (row.get(col) or "").strip() if col else ""

    by_email = {s.get("email", "").lower(): s for s in speakers if s.get("email")}
    by_name = {}
    for s in speakers:
        n = s.get("name") or {}
        for k in ("ko", "en"):
            if n.get(k):
                by_name[norm(n[k])] = s

    added, updated, drive_links = 0, 0, []
    for row in rows:
        name_ko, name_en = get(row, "name_ko"), get(row, "name_en")
        email = get(row, "email").lower()
        if not (name_ko or name_en):
            continue
        target = by_email.get(email) if email else None
        if target is None:
            target = by_name.get(norm(name_ko)) or by_name.get(norm(name_en))
        is_new = target is None
        if is_new:
            target = {"id": "", "name": {"ko": "", "en": ""}, "affiliation": {"ko": "", "en": ""},
                      "title": {"ko": "", "en": ""}, "abstract": {"ko": "", "en": ""}, "slides": "", "url": "", "email": ""}
            speakers.append(target)

        # 이름은 한/영을 섞어 쓰지 않는다 (영문 이름은 추측하지 않음). 비어 있으면 기존 값을 유지한다.
        target["name"] = merge_bilingual(target.get("name"), {"ko": name_ko, "en": name_en})
        for fld in ("affiliation", "title", "abstract"):
            ko, en = get(row, fld + "_ko"), get(row, fld + "_en")
            if ko or en:
                target[fld] = merge_bilingual(target.get(fld), bilingual(ko, en))
        if email:
            target["email"] = email
        if get(row, "url"):
            target["url"] = get(row, "url")
        consent = get(row, "consent").lower()
        slides = get(row, "slides")
        if slides and not (consent and consent.startswith(("아니", "no", "n"))):
            target["slides"] = slides
            if "drive.google.com" in slides:
                drive_links.append((target["name"].get("ko") or target["name"].get("en"), slides))
        if not target.get("id"):
            base = slugify(target["name"].get("en")) or f"spk-{len(speakers):02d}"
            sid, n = base, 2
            existing = {s.get("id") for s in speakers if s is not target}
            while sid in existing:
                sid = f"{base}-{n}"
                n += 1
            target["id"] = sid
        if is_new:
            added += 1
            if email:
                by_email[email] = target
            for k in ("ko", "en"):
                if target["name"].get(k):
                    by_name[norm(target["name"][k])] = target
        else:
            updated += 1

    data["updated"] = date.today().isoformat()
    print(f"\n발표자 {added}명 추가, {updated}명 갱신 (총 {len(speakers)}명)")
    for s in speakers:
        flag = "" if (s.get("title") or {}).get("ko") or (s.get("title") or {}).get("en") else "  [제목 없음]"
        print(f"  - {s.get('id','?'):22s} {s['name'].get('ko') or s['name'].get('en')}{flag}")
    if drive_links:
        print("\n[주의] 구글 드라이브 링크로 들어온 발표자료입니다. 드라이브에서 '링크가 있는 모든 사용자 → 뷰어' 공유로 바꾸거나,"
              " PDF 를 내려받아 assets/slides/ 에 넣고 경로로 바꿔 주세요:")
        for name, link in drive_links:
            print(f"  - {name}: {link}")
    if args.dry_run:
        print("\n--dry-run: 파일은 수정하지 않았습니다.")
        return
    cfg_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nOK    {cfg_path} 갱신 완료. 프로그램 표의 해당 항목에 \"speaker_id\": \"<id>\" 를 넣고 build.py 를 실행하세요.")


if __name__ == "__main__":
    sys.exit(main())
