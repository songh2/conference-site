"""이메일 주소 난독화 (build.py 와 template/app.js 의 decodeEmail 이 같은 규칙을 사용).

규칙(v1): 주소를 뒤집고 → 각 바이트를 사이트 slug 의 글자 코드로 XOR → base64 → 앞에 "v1:".
자동 수집기가 페이지 소스에서 주소 모양(xxx@yyy)을 찾지 못하게 하는 것이 목적이며,
암호화는 아니다(app.js 를 읽으면 되돌릴 수 있다).
"""
import base64


def encode_email(email: str, slug: str) -> str:
    key = (slug or "site").encode("ascii", "ignore") or b"site"
    data = email.strip()[::-1].encode("utf-8")
    xored = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return "v1:" + base64.b64encode(xored).decode("ascii")


def decode_email(enc: str, slug: str) -> str:
    key = (slug or "site").encode("ascii", "ignore") or b"site"
    raw = base64.b64decode(enc.replace("v1:", "", 1))
    data = bytes(b ^ key[i % len(key)] for i, b in enumerate(raw))
    return data.decode("utf-8")[::-1]
