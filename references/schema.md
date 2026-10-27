# conference.json 필드 설명

모든 사람이 읽는 문장은 `{"ko": "한국어", "en": "English"}` 형태(이하 **ko/en**)로 쓴다.
한쪽이 비어 있으면 화면에는 다른 쪽 언어가 그대로 나온다. 빈 문자열 `""` 과 빈 배열 `[]` 은 "없음"을 뜻하며
해당 섹션은 숨겨진다. 알 수 없는 키는 무시되므로 메모용 키(`_todo` 등)를 추가해도 된다.

## 최상위

| 키 | 형식 | 필수 | 설명 |
|----|------|:----:|------|
| `slug` | 문자열 | ✔ | 소문자·숫자·하이픈. 폴더 이름·저장소 이름·URL 경로에 쓰임 |
| `lang_default` | `"ko"` / `"en"` | | 처음 열었을 때 언어 (URL `?lang=`, 이전 선택이 우선) |
| `title` | ko/en | ✔ | 행사명. 브라우저 탭·히어로 제목 |
| `short_title` | ko/en | | 상단 왼쪽 로고 자리 짧은 이름 (없으면 title) |
| `subtitle` | ko/en | | 제목 아래 한 줄 |
| `kicker` | ko/en | | 제목 위 작은 라벨 (예: "서울대학교 · 2027년 2월") |
| `dates` | 객체 | ✔ | 아래 참고 |
| `venue` | 객체 | ✔ | 아래 참고 |
| `host` | ko/en | | 주최·주관. 상단 정보 카드에 표시 |
| `hero` | 객체 | | `image`(경로, 보통 `assets/hero.jpg`), `credit`(ko/en, 사진 출처) |
| `about` | ko/en | | 소개글. 빈 줄로 문단 구분. HTML 태그는 해석되지 않음 |
| `notices` | 배열 | | `{ "date": "YYYY-MM-DD", "text": ko/en }` |
| `committees` | 배열 | | `{ "name": ko/en, "members": [ { "name": ko/en, "affiliation": ko/en, "role": ko/en, "url": "홈페이지", "email": "" } ] }` — `url` 이 있으면 이름이 링크가 되고, `email` 이 있으면 봉투 아이콘이 붙는다(아래 "이메일 보호" 참고) |
| `speakers` | 배열 | | 아래 "speakers" 참고 |
| `program` | 배열 | ✔ | 아래 참고 |
| `registration` | 객체 | ✔ | 아래 참고 |
| `participants` | 배열 | | 참가자 명단 `{ "name": ko/en, "affiliation": ko/en }`. `scripts/import_participants.py` 로 등록폼 응답에서 생성. 이름·소속만 넣는다 |
| `participants_url` | 문자열 | | (선택) 구글 시트 "웹에 게시 → CSV" 주소. 있으면 페이지가 열릴 때 읽어 명단을 최신으로 표시하고, 실패하면 `participants` 를 보여 준다. `registration.endpoint` 가 있으면 명단은 endpoint 에서 읽으므로 이 값은 쓰이지 않는다 |
| `participants_note` | ko/en | | 명단 위 안내 문구 (예: "게시에 동의하신 분만 표시됩니다"). 명단이 비어 있어도 이 문구가 있으면 섹션이 "추후 게시" 안내와 함께 표시된다 |
| `accommodation` | ko/en | | 숙박 안내 (오시는 길 섹션 오른쪽) |
| `downloads` | 배열 | | `{ "label": ko/en, "url": "assets/poster.pdf" }` |
| `gallery` | 배열 | | `{ "src": "assets/group.jpg", "caption": ko/en }` |
| `sponsors` | 배열 | | `{ "name": ko/en, "logo": "assets/logo.png", "url": "" }` |
| `contact` | 배열 | | `{ "name": ko/en, "role": ko/en, "email": "", "phone": "" }` |
| `footer` | ko/en | | 푸터 왼쪽 문구 (없으면 title) |
| `footer_url` | 문자열 | | 푸터에 표시할 링크 (학과 홈페이지 등) |
| `updated` | `YYYY-MM-DD` | | 푸터 "최종 수정" |
| `theme` | 문자열 또는 객체 | | 배색. 프리셋 id(`"snu-science"` 등, 목록은 `themes/`·`docs/themes.md`), CSS 변수 객체(`{"--primary":"#0b3d91"}`), 또는 둘의 조합(`{"preset":"slate","--accent":"#..."}`). 배포 후 GitHub 웹에서 값만 바꿔도 즉시 반영되고, 주소에 `?theme=<id>` 를 붙이면 저장 없이 미리보기. 변수 이름은 `--소문자-하이픈`, 값은 색·글꼴·px 만 허용 |
| `logo` | 객체 | | 상단바 기관 로고 `{ "src": "assets/logo.svg", "alt": ko/en, "hide_text": false }`. **사용 권한이 있는 파일만.** 이 템플릿에는 어떤 로고도 포함되지 않음 |
| `site_url` | 문자열 | | 공개된 홈페이지 주소(`https://…`). 포스터의 QR 코드와 주소 표시에 쓰임 |
| `poster` | 객체 | | 인쇄용 포스터 설정(배치·크기·언어·안내 문구 등). → `docs/poster.md` 4절 |
| `email_protection` | `"captcha"`(기본) / `"none"` | | 이메일 보호 방식. `none` 이면 평문 mailto 링크로 표시(권장하지 않음) |
| `_todo` | 문자열 배열 | | 확인 필요 메모. 화면에는 안 나오고 validate.py 가 경고로 출력 |

## dates

```json
"dates": {
  "start": "2027-02-11",
  "end": "2027-02-12",
  "display": { "ko": "2027년 2월 11일(목) 오후 2시 – 12일(금) 낮 12시 30분", "en": "February 11 (Thu), 2 PM – February 12 (Fri), 12:30 PM, 2027" }
}
```
`display` 가 비어 있으면 start/end 로 자동 생성한다(시각은 표시되지 않으므로 시각이 중요하면 `display` 를 채운다).
오늘 날짜가 `end` 를 지나면 히어로에 "본 행사는 종료되었습니다" 배지가 붙고 등록 섹션이 "종료" 안내로 바뀐다.

## venue

| 키 | 설명 |
|----|------|
| `name` | ko/en, 기관명 (예: 서울대학교) |
| `room` | ko/en, 건물·호실 |
| `address` | ko/en, 우편 주소 |
| `map_url` | 지도 링크. 구글 지도 검색 링크(`https://www.google.com/maps/search/?api=1&query=...`)나 네이버 지도 공유 링크 |
| `lat`, `lng` | 숫자, 행사장 좌표. 구글 지도에서 건물을 우클릭하면 맨 위에 나오는 두 숫자(위도, 경도). 넣으면 오시는 길 카드에 지도(OpenStreetMap)가 삽입된다 |
| `directions` | ko/en, 대중교통·주차 안내 (빈 줄로 문단 구분) |

## speakers

```json
"speakers": [
  { "id": "gildong-hong",
    "name": { "ko": "홍길동", "en": "Gildong Hong" },
    "affiliation": { "ko": "예시대학교", "en": "Example University" },
    "title": { "ko": "On the rank of $J_0(N)(\\mathbb{Q})$", "en": "On the rank of $J_0(N)(\\mathbb{Q})$" },
    "abstract": { "ko": "…", "en": "…" },
    "slides": "assets/slides/gildong-hong.pdf",
    "url": "https://example.org/~gildong",
    "email": "gildong@example.org" }
]
```
| 키 | 설명 |
|----|------|
| `id` | 소문자·숫자·하이픈. 프로그램 표에서 `speaker_id` 로 참조하고, 카드의 앵커(`#spk-<id>`)가 된다 |
| `title`, `abstract` | ko/en. 수식은 `$...$`(인라인), `$$...$$`(별도 줄). 제목이 비면 "강연 제목 추후 공지" |
| `slides` | 문자열 하나 또는 `[{ "label": ko/en, "url": ... }, ...]` (여러 파일) |
| `url`, `email` | 홈페이지 링크(이름 옆 집 아이콘), 이메일(봉투 아이콘) |
| `photo` | (포스터 강연형) 연사 사진 `assets/speakers/<id>.jpg`, 세로 4:5 권장. 본인 동의를 받은 사진만 |
| `group` | (포스터 연사형) 구분 이름 ko/en, 예 `{"ko": "기조강연", "en": "Plenary Lecture"}` |

구글폼으로 받은 응답을 넣을 때는 `scripts/import_speakers.py` 를 쓴다 → `references/speaker-submission.md`.

## program

```json
"program": [
  {
    "date": "2027-02-10",
    "label": { "ko": "2월 10일(수) · 사전행사", "en": "February 10 (Wed) · Pre-event" },
    "tentative": true,
    "note": { "ko": "세부 내용은 추후 안내", "en": "Details to be announced" },
    "items": [
      { "time": "15:00–16:00", "title": { "ko": "사전 등록", "en": "Early registration" }, "kind": "registration" },
      { "time": "16:00–18:00", "title": { "ko": "강연", "en": "Talks" }, "speaker": { "ko": "홍길동 (서울대학교)", "en": "Gildong Hong (SNU)" }, "note": ko/en, "kind": "talk", "tentative": true }
    ]
  }
]
```
- `label` 이 비어 있으면 `date` 로 자동 생성.
- `speaker_id`: `speakers[].id` 를 적으면 그 줄의 제목이 발표자의 강연 제목으로 바뀌고, 발표자 이름이 초록 카드로 연결된다. 제목이 아직 없으면 `title`(예: "강연")이 그대로 보인다. `speaker`(자유 텍스트)는 `speaker_id` 가 없을 때만 쓰인다.
- `tentative: true` → "예정/Tentative" 배지 (날짜 단위, 항목 단위 모두 가능).
- `kind`: `talk`(기본) / `registration` / `break` / `meal` / `social` / `meeting` / `other`. `registration·break·meal·social` 은 표에서 연한 배경.
- `time` 은 자유 문자열이지만 `"HH:MM–HH:MM"` 또는 `"HH:MM–"` 를 권장 (validate 가 경고).

## registration

| 키 | 설명 |
|----|------|
| `form_url` | 구글폼 등 링크. 비어 있으면 "준비 중" 안내 |
| `embed` | `true` 면 폼을 페이지 안에 iframe 으로 삽입 (구글폼 "보내기 → <>" 의 주소도 사용 가능) |
| `status` | `auto`(기본) / `open` / `closed` / `soon`. `auto` 는 마감일·행사 종료일로 자동 판단 |
| `deadline` | `YYYY-MM-DD`. 지나면 자동으로 "마감" 표시 |
| `deadline_display` | ko/en, 마감 표시 문구를 직접 쓰고 싶을 때 (예: "1월 3일(일) 자정") |
| `fee` | ko/en, 등록비 (예: "무료 / Free") |
| `note` | ko/en, 안내 문구 (뱅큇 참석 여부 조사 등) |
| `endpoint` | **홈페이지 안 등록 양식**의 접수 주소 = 구글 Apps Script 웹 앱 URL(`https://script.google.com/macros/s/…/exec`). 있으면 양식이 표시되고 `form_url` 링크는 보조("작동하지 않으면") 링크로 바뀐다. 비어 있으면 양식은 숨겨진다 → `references/registration-sheet.md` |
| `attendance_options` | 양식의 "참석 구분" 선택지 배열(`endpoint` 사용 시 1개 이상 필수). `{ "id": "all3", "label": ko/en, "note": ko/en(선택), "days": ["2027-02-10", "2027-02-11", "2027-02-12"] }`. `id` 는 소문자·숫자·하이픈, `days` 는 참석일(시트의 날짜별 열 `Y` 표시와 일자별 집계에 쓰임) |
| `privacy_notice` | ko/en, 개인정보 수집·이용 안내문(`endpoint` 사용 시 필수). 수집 항목·이용 목적·보유 기간·거부권·명단 게시(선택 동의) 설명. 줄바꿈이 그대로 표시된다. **보유 기간 등은 기관 확인 후 확정** |
| `timezone` | (선택) 서버 시각·마감일 기준 시간대. 기본 `Asia/Seoul` |

```json
"registration": {
  "endpoint": "https://script.google.com/macros/s/AKfy.../exec",
  "deadline": "2027-01-31",
  "attendance_options": [
    { "id": "all3", "label": { "ko": "3일 모두 참석", "en": "All 3 days" }, "days": ["2027-02-10", "2027-02-11", "2027-02-12"] },
    { "id": "main2", "label": { "ko": "본 행사 2일", "en": "Main conference, both days" }, "days": ["2027-02-11", "2027-02-12"] },
    { "id": "day1", "label": { "ko": "본 행사 1일차만", "en": "Main conference Day 1 only" }, "days": ["2027-02-11"] },
    { "id": "day2", "label": { "ko": "본 행사 2일차만", "en": "Main conference Day 2 only" }, "days": ["2027-02-12"] }
  ],
  "privacy_notice": { "ko": "수집 항목: …", "en": "Items collected: …" }
}
```
양식은 성명·소속 기관·이메일·참석 구분·(선택)명단 게시 동의·(필수)개인정보 동의를 받는다. 접수 스크립트는 `scripts/make_registration_script.py` 로 만든다.

## 자주 하는 실수
- JSON 은 마지막 항목 뒤에 쉼표를 붙이면 오류가 난다. `validate.py` 가 몇 행인지 알려 준다.
- 따옴표는 반드시 `"` (쌍따옴표). 문장 안에 `"` 를 쓰려면 `\"`.
- 파일 경로는 `assets/파일명` 처럼 상대 경로로. 공백·한글 파일명은 피한다.

## participants

```json
"participants": [
  { "name": { "ko": "홍길동", "en": "Gildong Hong" }, "affiliation": { "ko": "예시대학교", "en": "Example University" } }
],
"participants_url": "",
"participants_note": { "ko": "사전등록 시 명단 게시에 동의하신 분만 표시됩니다.", "en": "Only registrants who agreed to be listed are shown." }
```
- 화면에는 "참가자 명단" 섹션에 인원수와 함께 3단(모바일 1단)으로 표시된다. 등록 섹션 바로 아래에 온다.
- 손으로 적지 말고 `import_participants.py`(응답 CSV → 명단)를 쓴다. 동의 열이 "예/Yes"인 사람만 들어가고, 같은 사람의 재응답은 마지막 것만 남는다.
- `participants_url` 로 시트를 직접 읽게 할 때는 **이름·소속(·동의) 열만 있는 탭**을 게시한다 → `references/registration-form.md`.

## 이메일 보호 (email → email_enc)

고등과학원(KIAS) 구성원 페이지처럼, 이메일 주소는 **확인 코드를 입력한 사람에게만** 보여 준다.

- 원본 `sites/<slug>/conference.json` 에는 위원·발표자·문의처의 `email` 을 **평문**으로 적는다. 그래서 원본은 **비공개 저장소나 로컬 폴더**에 둔다(공개된 스킬 저장소 안에 두지 않는다).
- `build.py` 가 공개본(index.html, 배포용 conference.json)을 만들 때 `email` 을 지우고 난독화한 `email_enc`("v1:…")만 남긴다. 그래서 공개 페이지 소스에는 `xxx@yyy` 모양이 전혀 없다. 빌드 로그에 "보호된 이메일 n건"이 나오고, 안내문 등에 주소가 글자로 남아 있으면 WARN 으로 알려 준다.
- 화면에서 봉투 아이콘(또는 문의처의 "이메일 확인" 버튼)을 누르면 대화창이 열린다: 그림 속 5자리 코드 입력 → [새 코드] [음성 듣기] → 맞으면 주소·[메일 보내기]·[주소 복사] 표시. 틀리면 새 코드가 나온다. 코드는 방문자 브라우저 안에서만 만들어지고 페이지 글자로는 존재하지 않는다.
- 한계: 주소를 되돌리는 규칙이 app.js 안에 있으므로 **암호화가 아니다**. 페이지 글자를 긁어 가는 일반 수집기는 막지만, 스크립트를 분석하는 공격은 막지 못한다. 이는 정적 호스팅(서버 없음)에서 가능한 최선이며, KIAS 처럼 서버가 코드를 검증하는 방식보다 약하다.
- 배포 저장소의 `conference.json` 을 GitHub 웹에서 직접 고칠 때 주소를 넣으려면 `python3 scripts/encode_email.py --slug <slug> 주소` 또는 브라우저용 `tools/encode-email.html`(파이썬 불필요) 로 만든 값을 `email_enc` 에 넣는다(평문 `email` 을 넣으면 보호되지 않는다).
- `_todo` 처럼 `_` 로 시작하는 키는 공개본에서 자동으로 제거된다.
