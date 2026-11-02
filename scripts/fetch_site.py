#!/usr/bin/env python3
"""공개된 행사 홈페이지 주소에서 정보를 가져와 sites/<slug>/ 를 만든다 — 샘플 포스터용.

사용법:
    python3 scripts/fetch_site.py https://계정이름.github.io/ntc2027/
    python3 scripts/fetch_site.py https://계정이름.github.io/ntc2027/ --out sites/ntc2027-sample
    python3 scripts/make_poster.py sites/<slug> --draft          # 이어서 샘플(시안) 포스터

동작:
  1. 이 스킬로 만든 홈페이지면: 공개본 conference.json(없으면 index.html 에 내장된 자료)과
     그것이 가리키는 assets/ 파일(사진·PDF)을 내려받는다. AI 가 필요 없다.
  2. 다른 홈페이지면: 페이지의 글만 뽑아 sites/<slug>/_source/page.txt 로 저장하고 종료 코드 2 로 끝낸다.
     → AI 도우미가 page.txt 를 읽어 conference.json 을 채운다(SKILL.md "자료에서 만들기"와 같은 규칙: 없는 내용은 비움).

주의:
  - 가져온 conference.json 은 공개본이라 이메일이 난독화(email_enc)되어 있다. 포스터에는 이메일이 쓰이지 않는다.
  - 인터넷이 막힌 환경(ChatGPT 의 코드 실행 등)에서는 실패한다. 그때는 사용자에게 홈페이지 저장소의
    conference.json 이나 홈페이지를 PDF로 저장한 파일을 올려 달라고 한다.
  - 표준 라이브러리만 쓴다. 파일 하나 25MB, 합계 120MB 를 넘는 파일은 내려받지 않는다.
"""
import argparse
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ONE, TOTAL, TEXT = 25 * 1024 * 1024, 120 * 1024 * 1024, 60000
UA = "conference-site/fetch_site (+https://github.com/songh2/conference-site)"


def site_base(url):
    """https://a.b/x/index.html#p → https://a.b/x/ , https://a.b/x → https://a.b/x/"""
    u = urllib.parse.urlsplit(url.strip() if "://" in url else "https://" + url.strip())
    if u.scheme not in ("https", "http"):
        raise SystemExit("http(s) 주소를 넣어 주세요 → " + url)
    path = u.path or "/"
    if not path.endswith("/"):
        last = path.rsplit("/", 1)[-1]
        path = path[: -len(last)] if "." in last else path + "/"
    return urllib.parse.urlunsplit((u.scheme, u.netloc, path, "", ""))


def get(url, limit=ONE):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:  # noqa: S310 — 사용자가 준 http(s) 주소만
        n = int(r.headers.get("Content-Length") or 0)
        if n > limit:
            raise ValueError(f"파일이 너무 큽니다 ({n} bytes)")
        data = r.read(limit + 1)
        if len(data) > limit:
            raise ValueError("파일이 너무 큽니다")
        return data, r.headers.get_content_charset() or "utf-8"


def looks_like_conf(d):
    return isinstance(d, dict) and ("title" in d or "slug" in d) and any(k in d for k in ("dates", "venue", "program", "speakers"))


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "template", "svg", "iframe"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.depth, self.title, self._in_title = [], 0, "", False
        self.site_data, self._in_data = None, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and a.get("id") == "site-data":
            self._in_data, self.site_data = True, ""
        if tag in self.SKIP:
            self.depth += 1
        if tag == "title":
            self._in_title = True
        if tag in ("p", "div", "li", "tr", "h1", "h2", "h3", "h4", "br", "section", "dd", "dt"):
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.depth:
            self.depth -= 1
        if tag == "script":
            self._in_data = False
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_data:
            self.site_data += data
        elif self._in_title:
            self.title += data
        elif not self.depth:
            self.out.append(data)

    def text(self):
        t = re.sub(r"[ \t ]+", " ", "".join(self.out))
        return re.sub(r"\s*\n\s*", "\n", t).strip()


def asset_refs(obj, found):
    if isinstance(obj, dict):
        for v in obj.values():
            asset_refs(v, found)
    elif isinstance(obj, list):
        for v in obj:
            asset_refs(v, found)
    elif isinstance(obj, str) and obj.startswith("assets/") and ".." not in obj.split("/") and "\\" not in obj:
        found.add(obj)
    return found


def fetch(url, out=None, with_assets=True, quiet=False):
    """반환: (사이트 폴더, 출처) — 출처는 json / embedded / text(AI 가 채워야 함)."""
    say = (lambda *a: None) if quiet else print
    base = site_base(url)
    page = url.strip().split("#")[0] if "://" in url else "https://" + url.strip().split("#")[0]
    data, source = None, None
    try:
        raw, _ = get(urllib.parse.urljoin(base, "conference.json"))
        d = json.loads(raw.decode("utf-8"))
        if looks_like_conf(d):
            data, source = d, "json"
    except (urllib.error.URLError, ValueError, json.JSONDecodeError, OSError):
        pass
    parser = None
    if data is None:
        raw, cs = get(page)
        parser = _Text()
        parser.feed(raw.decode(cs, errors="replace"))
        if parser.site_data:
            try:
                d = json.loads(html.unescape(parser.site_data) if "&quot;" in parser.site_data else parser.site_data)
                if looks_like_conf(d):
                    data, source = d, "embedded"
            except json.JSONDecodeError:
                pass
    slug_src = (data or {}).get("slug") or urllib.parse.urlsplit(base).path.strip("/").split("/")[-1] or urllib.parse.urlsplit(base).netloc.split(".")[0]
    slug = re.sub(r"[^a-z0-9-]+", "-", slug_src.lower()).strip("-") or "site"
    site = Path(out) if out else ROOT / "sites" / f"{slug}-from-web"
    site.mkdir(parents=True, exist_ok=True)
    if data is None:
        text = (("페이지 제목: " + parser.title.strip() + "\n\n") if parser.title.strip() else "") + parser.text()
        (site / "_source").mkdir(exist_ok=True)
        (site / "_source" / "page.txt").write_text(f"출처: {page}\n\n{text[:TEXT]}\n", encoding="utf-8")
        say(f"NOTE  이 스킬로 만든 홈페이지가 아닙니다. 글을 {site / '_source' / 'page.txt'} 에 저장했습니다.")
        say("      → AI 가 이 글을 읽어 conference.json 을 채우세요(없는 내용은 비움). site_url 에는 " + page)
        return site, "text"
    data.setdefault("site_url", base)
    (site / "conference.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    say(f"OK    {site / 'conference.json'}  ({'공개본 conference.json' if source == 'json' else 'index.html 에 내장된 자료'})")
    if with_assets:
        total = 0
        for ref in sorted(asset_refs(data, set())):
            dst = (site / ref).resolve()
            if site.resolve() not in dst.parents:
                continue
            try:
                b, _ = get(urllib.parse.urljoin(base, urllib.parse.quote(ref)))
                if total + len(b) > TOTAL:
                    raise ValueError("합계 용량 초과")
                total += len(b)
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(b)
                say(f"OK    {ref}")
            except (urllib.error.URLError, ValueError, OSError) as e:
                say(f"WARN  {ref} 를 가져오지 못했습니다 ({e})")
    return site, source


def main():
    ap = argparse.ArgumentParser(description="공개된 행사 홈페이지 주소 → sites/<slug>/ (샘플 포스터용)")
    ap.add_argument("url")
    ap.add_argument("--out", help="만들 폴더 (기본 sites/<slug>-from-web)")
    ap.add_argument("--no-assets", action="store_true", help="사진·PDF 는 내려받지 않음")
    args = ap.parse_args()
    try:
        site, source = fetch(args.url, args.out, not args.no_assets)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"홈페이지를 읽지 못했습니다: {e.code} {e.reason} — 주소를 확인하세요")
    except (urllib.error.URLError, OSError) as e:
        raise SystemExit(f"홈페이지에 접속하지 못했습니다: {e} — 인터넷이 막힌 환경이면 conference.json 이나 홈페이지 PDF 를 받아 쓰세요")
    if source == "text":
        sys.exit(2)
    print(f"다음: python3 scripts/make_poster.py {site} --draft")


if __name__ == "__main__":
    main()
