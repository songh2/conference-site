#!/usr/bin/env python3
"""이메일 주소 ↔ 난독화 값 변환 (배포 저장소의 conference.json 을 손으로 고칠 때 사용).

사용법:
    python3 scripts/encode_email.py --slug ntc2027 someone@example.org        # → "email_enc" 에 넣을 값
    python3 scripts/encode_email.py --slug ntc2027 --decode v1:AbCd...     # 되돌리기

보통은 sites/<slug>/conference.json 에 평문 "email" 을 적고 build.py 를 돌리면 자동으로 변환되므로
이 스크립트는 GitHub 웹 화면에서 배포본을 직접 고칠 때만 필요합니다.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from emailcodec import decode_email, encode_email  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True, help="사이트 slug (conference.json 의 slug 와 같아야 함)")
    ap.add_argument("--decode", action="store_true")
    ap.add_argument("values", nargs="+")
    args = ap.parse_args()
    for v in args.values:
        print(decode_email(v, args.slug) if args.decode else encode_email(v, args.slug))


if __name__ == "__main__":
    main()
