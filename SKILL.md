---
name: conference-site
description: 학회·워크샵·세미나·심포지엄 홈페이지(한/영 전환, 정적 HTML 1장) 제작과 수정. 행사명·기간·장소·조직위원·일정·등록 방법을 받아 conference.json 을 쓰고 build.py 로 생성하며, 발표자 초록·발표자료 반영, 구글 시트 등록 양식, 테마(단과대학 배색) 적용, GitHub Pages 공개 안내까지 다룬다. 학회/워크숍/세미나/행사 사이트·홈페이지 요청 시 사용.
---

# 학회 홈페이지 제작 스킬 (conference-site)

수학과 등 학과에서 반복되는 **학회·워크샵·세미나 홈페이지**를 같은 틀로 빠르게 만들기 위한 스킬이다.
홈페이지의 모든 내용은 `conference.json` 한 파일에 한국어/영어 쌍으로 들어가고,
`scripts/build.py`가 이를 `template/` 과 합쳐 외부 의존성 없는 **단일 index.html** 로 만든다.
결과물은 GitHub Pages 같은 무료 정적 호스팅에 그대로 올릴 수 있고, 행사가 끝난 뒤에도
발표자료·단체사진·포스터를 추가해 기록용으로 계속 유지할 수 있다.

## 작업 흐름

### 1. 정보 수집
`references/intake-questions.md` 의 **필수 항목 7가지**(행사명, 기간·시간, 장소, 조직위원, 일정, 등록 방법, 문의처)를
먼저 확인한다. 사용자가 이메일·공문 등을 붙여 넣었다면 거기서 최대한 추출하고, 빠진 것만
**한 번에 묶어서** 질문한다(여러 번 되묻지 않는다). 선택 항목(대표 사진, 소개글, 연사, 후원기관, 숙박)은
없으면 비워 두어도 해당 섹션이 자동으로 숨겨지므로 억지로 채우지 않는다.

### 2. 사이트 폴더 만들기
```bash
python3 scripts/new_site.py <slug>                    # 새로 시작
python3 scripts/new_site.py <slug> --from sites/example-2027   # 예시(또는 기존 사이트)를 복사해서 시작
```
`slug` 는 소문자·숫자·하이픈만 쓴다(예: `ntc2027`, `algebra-camp-2028`). 이 이름이 배포 저장소 이름과 URL 경로가 된다.

### 3. conference.json 채우기
필드 설명은 `references/schema.md` 에 있다. 작성 원칙:

- **모든 문장은 `{"ko": ..., "en": ...}` 쌍**으로 쓴다. 한쪽이 비면 화면에는 다른 언어가 그대로 보이므로, 빈 채로 두는 것은 "번역 미확정"을 뜻한다.
- **사실만 적는다.** 자료에 없는 소개글·연사·등록비·마감일을 지어내지 않는다. 모르면 비우고 `_todo` 에 적는다.
- **사람 이름의 영문 표기**는 소속 기관 교수 소개 페이지, 본인 홈페이지, 논문 저자 표기 등 공개 자료에서 확인한 것만 넣는다. 확인하지 못했으면 `en` 을 `""` 로 두고 `_todo` 에 "OOO 영문 성명 확인" 을 남긴다. 표준 로마자 표기법으로 임의 변환하지 않는다(본인이 쓰는 표기와 다를 수 있다).
- **행사 영문명**도 공식 명칭이 확인되지 않으면 임시 번역임을 `_todo` 에 남긴다.
- 날짜는 `YYYY-MM-DD`, 시간은 `"HH:MM–HH:MM"`(끝 시간이 열려 있으면 `"18:00–"`).
- 아직 확정되지 않은 날·세션은 `"tentative": true` 로 표시하면 화면에 "예정/Tentative" 배지가 붙는다. 자료에 "예정", "미정", "추후 확정" 이라고 적힌 항목은 반드시 이 플래그를 쓴다.
- 등록·휴식·식사·만찬 같은 비강연 항목은 `kind` 를 `registration` / `break` / `meal` / `social` / `meeting` 으로 적어 표에서 연하게 표시되게 한다.
- 사전등록 폼(구글폼 등) 링크가 아직 없으면 `registration.form_url` 을 비워 둔다. 화면에는 "준비 중" 안내가 자동으로 나온다. 폼 문항이 필요하면 `references/registration-form.md` 를 참고해 제안한다.
- **홈페이지 안 등록 양식(구글 시트 연동)**: 사용자가 "홈페이지에서 직접 등록받고 싶다"고 하면 `registration.attendance_options`(참석 구분: `id`, ko/en `label`, 참석일 `days`)와 `registration.privacy_notice`(개인정보 수집·이용 안내문, ko/en)를 채우고, `python3 scripts/make_registration_script.py sites/<slug>` 로 Apps Script 코드를 만든 뒤 `docs/manual-google-sheet.md`(계정 선택) 와 `references/registration-sheet.md`(클릭 순서) 대로 사용자가 시트 생성·권한 허용·웹 앱 배포를 하게 안내한다(이 단계는 사용자의 구글 계정 작업이라 AI 가 대신할 수 없다). 받은 웹 앱 주소(`…/exec`)를 `registration.endpoint` 에 넣고 build 한다. `endpoint` 가 비어 있으면 양식은 숨겨지고 "준비 중"이 표시된다.
  - 참석 구분은 사용자가 말한 구분(예: 사전행사 포함 3일 / 본 행사 2일 / 1일차만 / 2일차만)을 그대로 옵션으로 만든다. 말하지 않은 옵션(사전행사만 등)은 임의로 넣지 않고 `_todo` 에 "추가 필요 여부 확인"으로 남긴다. 확정되지 않은 날은 옵션 `note` 에 "예정"임을 적는다.
  - `privacy_notice` 의 **보유·이용 기간, 위탁·국외 이전 고지 등은 지어내지 않는다.** 초안을 쓰더라도 `_todo` 에 "기관(학과·개인정보 담당 부서) 확인 후 확정"을 남기고 사용자에게 초안임을 알린다. 법률 자문이 아님을 밝힌다.
  - 시트 응답에는 이메일이 있으므로 시트를 공유·웹 게시하지 않도록 안내한다. 참가자 명단은 Apps Script 가 동의자의 이름·소속만 돌려주는 방식이라 `participants_url` 이나 CSV 가 필요 없다. 이메일·연락처를 `conference.json` 이나 공개 저장소에 쓰지 않는다.
  - 참석 구분이나 마감일을 바꾸면 스크립트를 다시 만들고 Apps Script 에 반영(새 버전 배포)해야 한다는 점을 알린다.
- **위원·발표자의 홈페이지(`url`)와 이메일(`email`)** 은 해당 인물의 공개 페이지(교수 소개, 본인 홈페이지, 논문)에 실린 것만 넣는다. 이름을 누르면 홈페이지로 연결된다. 이메일은 원본 JSON 에 평문으로 적되, `build.py` 가 공개본에서는 난독화(`email_enc`)하고 방문자가 **확인 코드(그림 속 숫자)를 입력해야만** 주소가 보이게 한다(KIAS 방식). 공개 페이지에서 찾지 못했으면 비워 두고, 게시는 본인 동의를 받도록 `_todo` 에 남긴다. 안내문(`registration.note`, `about` 등)에 주소를 글자로 적으면 보호되지 않으므로 문의처는 `contact` 항목으로 넣는다.
- **참가자 명단**은 사전등록 폼 응답에서 `scripts/import_participants.py` 로 만든다(이름·소속만, 게시 동의자만). 손으로 적지 않는다. 행사장 좌표(`venue.lat/lng`)는 사용자가 구글 지도에서 확인해 주면 넣고 추측하지 않는다(지도 삽입용).
- **발표자**가 정해지면 `speakers[]` 에 `id` 를 붙여 넣고, 프로그램 표의 강연 항목에 `"speaker_id"` 로 연결한다. 제목·초록·발표자료를 구글폼으로 받는 절차와 `scripts/import_speakers.py` 사용법은 `references/speaker-submission.md` 에 있다. 초록의 수식은 `$...$` 그대로 두면 렌더링된다.
- **발표자료를 대화에 첨부해 준 경우**("이 PDF 를 홍길동 발표자료로 올려 줘"): 파일을 `sites/<slug>/assets/slides/<speaker id>.pdf` 로 복사하고 `speakers[].slides` 에 경로를 적는다. 초록·제목이 문서(워드·PDF·메일)로 왔으면 그 내용을 `title`·`abstract` 에 옮긴다(요약·윤문하지 않고 원문대로, 수식은 `$...$`). 논문·보충자료는 `slides` 배열에 라벨(`논문 / Paper`)을 붙여 추가한다. 파일을 저장소에 올리지 못하는 환경이면 사용자에게 "행사 저장소의 `assets/slides/` 에 이 이름으로 올리세요"라고 파일 이름을 알려 준다.
- **테마(배색)**: 사용자가 기관·단과대학을 말하면 `themes/` 에 그 프리셋이 있는지 확인해 `"theme": "<id>"` 로 넣는다(목록·상태는 `docs/themes.md`). 서울대학교는 공통 `snu` 와 단과대학별 `snu-humanities`, `snu-social`, `snu-science`, `snu-nursing`, `snu-business`, `snu-engineering`, `snu-cals`, `snu-art`, `snu-education`, `snu-human-ecology`, `snu-vet`, `snu-pharmacy`, `snu-music`, `snu-medicine`, `snu-cls`, `snu-ti` 가 있다. 대부분 홈페이지 화면에서 읽은 값(`status: extracted`)이므로 사용자에게 "공식 색이 아니라 홈페이지 배색을 따른 것"이라고 알린다. 사용자가 어떤 배색이 나은지 모르면 `python3 scripts/theme_gallery.py` 로 갤러리를 만들어 보여 준다. 없으면 기본값을 두고 "프리셋이 없어 기본 배색을 썼다. 공식 색상 값을 주면 프리셋을 만들 수 있다"고 알린다. 공식 색상 값을 추측해서 프리셋을 만들지 않는다. 로고는 사용자가 **사용 권한이 있는 파일**을 준 경우에만 `logo.src` 에 넣고, 기관 로고를 임의로 구해 넣지 않는다.
- `updated` 에 오늘 날짜를 넣는다(사용자가 날짜를 말하지 않았으면 시스템 날짜 사용).

### 4. 검사하고 빌드하기
```bash
python3 scripts/validate.py sites/<slug>/conference.json
python3 scripts/build.py sites/<slug> --deploy dist/<slug>
```
`validate.py` 의 `ERROR` 는 반드시 고친다. `WARN` 은 사용자에게 보고할 "확인 필요 목록"의 재료다.
빌드가 끝나면 `sites/<slug>/index.html`(미리보기용)과 `dist/<slug>/`(배포용: index.html, conference.json, assets/, .nojekyll)가 생긴다.

### 5. 결과 확인
빌드된 `index.html` 을 열어(파일을 전달할 수 있는 환경이면 전달해서) 다음을 한국어·영어 **양쪽 모두** 확인한다:
우측 상단 언어 버튼 동작, 제목·일시·장소, 프로그램 표의 날짜·시간, 조직위원 명단, 등록 안내 문구, 문의처.
`<script id="site-data">` 에 JSON이 들어 있는지, 깨진 글자가 없는지도 본다.
빌드 로그의 "보호된 이메일 n건"이 원본의 이메일 수와 같은지, "공개본에 이메일 주소가 글자로 포함" 경고가 없는지 확인한다.

### 6. 보고 형식
작업을 마치면 다음 순서로 짧게 보고한다:

1. 만든 파일과 위치 (`sites/<slug>/`, `dist/<slug>/`)
2. **확인 필요 목록** — `_todo` 와 `validate.py` 경고를 사람이 읽기 쉽게 정리 (영문명 미확인, 등록폼 링크, 사진 등)
3. 다음 단계 — 배포는 `docs/manual-github-pages.md`(공개 GitHub 저장소에 `dist/<slug>/` 내용을 올리고 Settings → Pages 활성화) 로 안내하고, 등록 양식을 쓰면 `docs/manual-google-sheet.md`, 마감일이 있으면 `references/checklist.md` 기준으로 남은 준비 업무를 한 줄씩. **파이썬을 실행할 수 없는 환경**이면 `conference.json` 만 완성해 주고 `blank/index.html` + `tools/encode-email.html` 경로(`docs/manual-chatgpt.md` 4절)를 안내한다.

### 7. 기존 사이트 수정
"일정 바꿔 줘", "연사 추가해 줘", "행사 끝났으니 발표자료 올려 줘" 같은 요청은 **`conference.json` 만 고치고 다시 빌드**한다.
`index.html` 을 직접 편집하지 않는다(다음 빌드 때 사라진다). 행사 후에는 `speakers[].slides`, `downloads`(포스터·프로그램북), `gallery`(단체사진)에 자료를 추가하면 경력 증빙·여비 정산 자료로 쓰기 좋다.
배포된 사이트는 `conference.json` 을 GitHub 웹 화면에서 직접 고쳐도 반영된다(페이지가 열릴 때 이 파일을 먼저 읽는다). `theme` 값도 마찬가지로 즉시 반영된다.

발표자 응답(CSV 또는 구글 시트)을 받았을 때:
```bash
python3 scripts/import_speakers.py sites/<slug> responses.csv --dry-run   # 어떻게 합쳐지는지 먼저 보기
python3 scripts/import_speakers.py sites/<slug> responses.csv             # 반영 → speaker_id 연결 → build
```
구글 시트를 직접 읽을 수 있는 도구가 연결되어 있으면 시트를 읽어 같은 규칙(이메일로 매칭, 비어 있는 값은 덮어쓰지 않음, 게시 동의 "아니오"면 자료 제외)으로 `speakers[]` 를 고쳐도 된다. 드라이브 링크로 들어온 발표자료는 비공개 상태일 수 있으니 PDF 를 `assets/slides/` 에 넣도록 안내한다.

참가자 명단 갱신 요청("등록자 명단 올려 줘")을 받았을 때:
```bash
python3 scripts/import_participants.py sites/<slug> responses.csv --dry-run
python3 scripts/import_participants.py sites/<slug> responses.csv            # 이름순은 --sort
```
시트를 직접 읽을 때도 같은 규칙을 지킨다: 이름·소속만 `participants` 에 넣고, 게시 동의 열이 "예/Yes"가 아닌 사람은 제외하며, 이메일·연락처·식사 정보는 conference.json 에 절대 쓰지 않는다(공개 저장소에 올라간다).

## 하지 말아야 할 것
- 자료에 없는 내용을 그럴듯하게 채우지 않는다. 특히 사람 이름 영문 표기, 등록비, 마감일, 소개글.
- 템플릿(`template/`)을 사이트 하나 때문에 고치지 않는다. 배색은 `conference.json` 의 `theme`(프리셋 id 또는 CSS 변수)으로 바꾼다.
- 기관 로고·공식 색상을 추측하거나 임의로 구해 넣지 않는다. 사용자가 준 파일·값만 쓴다.
- 실제 행사의 원본(`sites/<slug>/`)을 이 스킬 저장소가 공개 저장소일 때 그 안에 커밋하지 않는다(평문 이메일이 들어 있다). 사용자의 비공개 저장소나 로컬 폴더에 둔다.
- 이 스킬 저장소에 배포용 사이트를 올리지 않는다. 행사마다 별도의 **공개** 저장소를 만든다(GitHub Pages 는 무료 계정에서 공개 저장소에서만 동작한다).

## 참고 파일
- `references/intake-questions.md` — 사용자에게 받을 정보 목록과 질문 예시
- `references/schema.md` — conference.json 모든 필드 설명
- `docs/manual-github-pages.md` — GitHub 가입부터 Pages 공개·수정·인수인계까지 (초보자용)
- `docs/manual-google-sheet.md` — 등록 양식용 구글 계정 선택과 인수인계
- `docs/manual-chatgpt.md`, `docs/manual-claude.md` — 각 AI 도구에서 이 스킬을 쓰는 방법
- `docs/themes.md` — 테마 프리셋과 로고
- `docs/security.md` — 공개 저장소 운영 시 보안·개인정보 점검표
- `references/hosting.md` — GitHub Pages / Cloudflare Pages / Google Sites 비교
- `references/registration-sheet.md` — 홈페이지 안 등록 양식(구글 시트 + Apps Script) 설정·운영·문제 해결
- `references/registration-form.md` — (대안) 사전등록 구글폼 문항 템플릿, 응답 집계, 참가자 명단 반영 방법
- `references/speaker-submission.md` — 발표자 제목·초록·발표자료 수집 폼과 `import_speakers.py` 로 반영하는 방법
- `references/checklist.md` — 학회 준비·당일·사후 업무 체크리스트(마감일 역산표)
- `sites/example-2027/` — 가상 예시 사이트 (모든 기능 사용)
