# 행사 포스터 만들기

> 홈페이지와 **같은 `conference.json`** 에서 인쇄용 포스터(A1·A2·A3·A4)를 만듭니다.
> 글은 전부 `conference.json` 에서 가져오므로 홈페이지와 포스터의 일시·장소·연사가 어긋나지 않습니다. 없는 내용을 지어 넣지 않습니다.
> 배색은 홈페이지 테마(`docs/themes.md`)를 그대로 따릅니다.

## 1. 가장 쉬운 방법 — AI 도우미에게 요청

> "example-2027 사이트로 A2 포스터 만들어 줘. 일정표형으로."
> "연사형으로도 하나 만들어서 비교해 줘."
> "대중강연 포스터인데 연사 사진은 첨부한 파일로 넣어 줘."

AI 도우미가 `scripts/make_poster.py` 를 실행해 **PDF(인쇄용)** 와 **PNG(미리보기)** 를 줍니다. 파이썬을 실행할 수 없는 환경(일부 ChatGPT 대화창)에서는 6절의 브리프 방식을 쓰거나, 파이썬이 되는 환경(Claude, Codex, 내 컴퓨터)에서 만듭니다.

## 2. 직접 만들기

```bash
python3 scripts/make_poster.py sites/<slug>                       # conference.json 의 poster 설정대로
python3 scripts/make_poster.py sites/<slug> --all                 # 네 가지 배치를 한꺼번에 만들어 비교
python3 scripts/make_poster.py sites/<slug> --layout speakers --size A3 --lang both
python3 scripts/make_poster.py sites/<slug> --theme snu-science   # 이 포스터만 다른 배색으로
```

결과는 `dist/<slug>/poster/` 에 생깁니다.

| 파일 | 용도 |
|---|---|
| `poster-<배치>-<크기>-<언어>.html` | 브라우저로 열어 확인. Chrome 에서 인쇄 → "PDF로 저장"으로도 PDF 를 만들 수 있음 |
| `….pdf` | 인쇄소에 보낼 파일 (글자는 이미지가 아니라 텍스트라 선명하고 검색됨) |
| `….png` | 메신저·메일에 붙일 미리보기 (가로 약 1600px) |

**PDF·PNG 자동 생성에는 Playwright 가 필요합니다.** 없으면 HTML 만 만들어지고 안내가 나옵니다. 설치: `pip install playwright` → `playwright install chromium`.
**QR 코드에는 segno 가 필요합니다** (`pip install segno`). 없으면 QR 대신 주소만 글자로 들어가고 경고가 나옵니다.

### Chrome 으로 PDF 저장하기 (Playwright 가 없을 때)
1. HTML 파일을 Chrome 으로 엽니다(더블클릭 또는 끌어다 놓기). 화면에는 축소되어 보입니다.
2. `Ctrl+P` (Mac `Cmd+P`) → 대상: **PDF로 저장**
3. **더보기 설정** → 여백: **없음**, **배경 그래픽** 체크. 용지 크기는 파일에 지정되어 있어 자동으로 A2 등으로 잡힙니다.
4. 저장. 글꼴은 인터넷에 연결되어 있으면 Noto Sans KR/Noto Serif KR 로, 아니면 컴퓨터에 있는 한글 글꼴로 나옵니다.

## 3. 네 가지 배치

| 배치 | 언제 | 들어가는 것 |
|---|---|---|
| `program` 일정표형 | 학술대회·워크숍·심포지엄 | 제목, 일시·장소, **프로그램 표 전체**(발표 제목·발표자 자동 연결) |
| `speakers` 연사형 | 연구발표회처럼 연사가 많을 때 | 기조강연 연사를 크게, 초청강연 연사를 여러 단으로 |
| `lecture` 강연형 | 대중강연·콜로키움·특강 | 연사 사진, 강연 제목, 이름·소속, **초록 전문** |
| `photo` 사진형 | 총회·축제·답사형 행사 | 대표 사진을 크게, 주요 행사 목록 |

`auto`(기본값)는 대표 사진이 있으면 사진형, 연사가 1명이면 강연형, 6명 이상이면 연사형, 그 밖에는 일정표형을 고릅니다.

글이 많으면 글자가 자동으로 작아지고, 적으면 자동으로 커집니다. 프로그램이 길면 두 단으로 바뀝니다. 그래도 넘치면 경고(`내용이 용지에 다 들어가지 않습니다`)가 나오니 용지를 키우거나(`--size A1`) 다른 배치를 고르세요.

## 4. conference.json 의 포스터 설정 (모두 선택)

```json
"site_url": "https://example.org/workshop-2027/",
"poster": {
  "layout": "program",
  "size": "A2",
  "lang": "both",
  "headline": { "ko": "예시 학술\n워크숍 2027", "en": "" },
  "kicker": { "ko": "예시대학교 예시학부", "en": "Department of Examples, Example University" },
  "note": { "ko": "누구나 참석 가능 · 사전등록 권장", "en": "Open to all · Pre-registration recommended" },
  "credits": [ { "label": { "ko": "주최", "en": "Hosted by" }, "text": { "ko": "…", "en": "…" } } ],
  "highlights": [ { "ko": "기조강연", "en": "Plenary lecture" } ],
  "image": "assets/poster-photo.jpg",
  "speaker_id": "gildong-hong",
  "qr": true,
  "show_contact": true,
  "show_talk_titles": false,
  "show_day_notes": false
}
```

| 항목 | 뜻 |
|---|---|
| `site_url` (최상위) | 홈페이지 주소. **QR 코드**가 이 주소로 만들어집니다. 포스터만 다른 주소로 보내려면 `poster.url` |
| `layout` | `program` / `speakers` / `lecture` / `photo` / `auto` |
| `size` | `A1` 594×841 · `A2` 420×594 · `A3` 297×420 · `A4` 210×297 (mm, 세로) |
| `lang` | `ko` 한국어 / `en` 영어 / `both` 한국어 중심 + 영어 병기 |
| `headline` | 포스터 제목을 행사명과 다르게 쓰거나 줄을 직접 나눌 때 (`\n` 이 줄바꿈, 짝수 줄은 강조색) |
| `kicker` | 제목 위 작은 문구 (없으면 행사의 `kicker`, 그것도 없으면 `host`) |
| `note` | 강조색 한 줄 안내 (무료·사전등록 등). 등록 마감일·등록비는 자동으로 덧붙음 |
| `credits` | 주최·주관·후원을 줄별로 직접 적을 때 (없으면 `host` 를 "주최"로) |
| `highlights` | 사진형의 주요 행사 목록 (없으면 프로그램의 날짜 제목) |
| `image` | 사진형 대표 사진 (없으면 `hero.image`) |
| `speaker_id` | 강연형에서 쓸 연사 (없으면 첫 번째 연사) |
| `show_contact` | 문의처 이름·전화번호 표시 (이메일은 수집 방지를 위해 넣지 않음) |
| `show_talk_titles` | 연사형에서 강연 제목도 표시 |

연사 쪽에 추가로 쓰는 항목:
- `speakers[].photo` — 강연형 포스터의 사진(`assets/speakers/<id>.jpg`, 세로 4:5 권장). **본인 동의를 받은 사진만** 넣습니다.
- `speakers[].group` — 연사형의 구분 (`{"ko": "기조강연", "en": "Plenary Lecture"}` 등). 첫 구분이 4명 이하이면 크게 보입니다.

후원 기관 로고는 `sponsors[].logo` 를 흰 칸에 넣어 바닥에 늘어놓습니다. **사용 권한이 있는 로고 파일만** 넣으세요(`docs/security.md` 3절).

## 5. 인쇄 전 점검표

- [ ] 일시·요일·장소·호실이 공문과 같은가 (포스터는 `conference.json` 을 그대로 쓰므로, 틀렸다면 원본을 고치고 다시 만듭니다)
- [ ] 연사 이름·영문 표기·소속을 본인 확인했는가
- [ ] 휴대폰으로 QR 코드를 찍어 홈페이지가 열리는가
- [ ] 로고·사진의 사용 허락을 받았는가
- [ ] 미리보기 화면 위쪽에 "내용이 많아…" 노란 경고가 없는가
- [ ] 인쇄소가 재단 여유(도련)를 요구하면 알려 주세요. 이 포스터는 여백 없이 용지 크기에 딱 맞게 만들어집니다

## 6. 더 개성 있는 디자인이 필요할 때 — OpenDesign 등 AI 디자인 도구

기본 포스터는 "정보가 정확하고 깔끔한" 쪽에 맞춰져 있습니다. 일러스트·사진 합성처럼 손이 많이 가는 디자인은 `docs/open-design.md` 의 방법으로 OpenDesign 같은 AI 디자인 도구에 **행사 정보(브리프)와 배색(디자인 시스템)** 을 가져가 다듬을 수 있습니다.

```bash
python3 scripts/export_open_design.py --brief sites/<slug>      # → dist/<slug>/open-design/poster-brief.md
```

브리프는 OpenDesign 이 아닌 다른 도구(ChatGPT 이미지 생성, 디자이너에게 전달하는 작업 지시서)에도 그대로 쓸 수 있습니다.

## 7. 알려진 한계

- 수식(`$...$`)은 KaTeX 를 인터넷에서 불러와 그립니다. 오프라인에서 만들면 수식이 글자 그대로 남고 안내가 나옵니다.
- 배치는 네 가지 틀 안에서 자동으로 조정됩니다. 글자 위치를 손으로 옮기는 편집 기능은 없습니다(그런 작업은 6절의 도구나 디자이너 몫).
- 인쇄 색은 화면 색(RGB)으로 지정됩니다. 기관 전용색(Pantone)과 똑같이 맞춰야 하는 인쇄물은 인쇄소에 색 견본 확인을 요청하세요.
