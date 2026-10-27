# conference-site — 학회·워크샵·세미나 홈페이지 제작 스킬

학과·연구소에서 반복되는 **행사 홈페이지 만들기**를 자동화하기 위한 템플릿 + 스크립트 + AI 스킬입니다.
행사 정보 몇 가지만 주면 **한국어/영어 전환 홈페이지 한 장**이 나오고, GitHub Pages 같은 무료 호스팅에 올려 **몇 년이고 유지**할 수 있습니다.

- 누구나 자유롭게 쓸 수 있습니다 (MIT 라이선스). 서울대학교 구성원(행정 담당자·대학원생·교수)을 1차 대상으로 썼지만 어느 기관이든 쓸 수 있습니다.
- **Claude · ChatGPT(Edu) · Codex** 어디서나 같은 폴더를 "스킬"로 올려 씁니다. 파이썬을 못 쓰는 환경을 위한 경로도 있습니다.
- 서울대학교 공식 서비스가 아니라 수리과학부 행정 담당자가 만든 개인 프로젝트입니다. 기관 로고·색상의 사용은 각 기관 규정을 따르세요.

## 무엇이 나오나

| 기능 | 내용 |
|---|---|
| 한/영 전환 | 우측 상단 버튼. 모든 문장은 `{"ko", "en"}` 쌍 |
| 프로그램 표 | 날짜별 시간표, "예정" 배지, 등록·휴식·식사 구분 |
| 발표자·초록 | 이름 → 초록 카드 연결, 수식(`$...$`) 렌더링, 발표자료 PDF 링크 |
| 홈페이지 안 등록 양식 | 이름·소속·이메일·참석 구분 → 구글 시트. 참가자 명단(이름·소속, 동의자만) 자동 표시 |
| 이메일 보호 | 위원·발표자 이메일은 그림 속 확인 코드를 입력해야 보임 (수집 방지) |
| 테마 | `"theme": "snu-science"` 처럼 한 줄로 배색 변경. **서울대학교 공통 + 16개 단과대학·학부 프리셋** 과 범용 5종. 공개 후 주소에 `?theme=<id>` 를 붙여 미리보기 |
| 인쇄 | 메뉴·버튼 제외, 일정·초록·위원·명단이 문서로 출력 |
| **포스터** | 같은 `conference.json` 으로 **A1~A4 인쇄용 포스터(PDF·PNG)**. 일정표형·연사형·강연형·사진형, 테마 배색, QR 코드, 글자 크기 자동 맞춤 → `docs/poster.md` |
| OpenDesign 연계 | 행사 정보 브리프와 테마를 [OpenDesign](https://github.com/nexu-io/open-design) 디자인 시스템 형식으로 내보내 AI 로 포스터 시안 다듬기 → `docs/open-design.md` |
| 유지 | 행사 후 발표자료·사진·포스터 추가 → 증빙 자료 주소로 보존. 종료 표시 자동 |

예시 사이트: `sites/example-2027/` (모든 인물·기관은 가상). 빌드하면 `sites/example-2027/index.html` 을 더블클릭해 볼 수 있습니다.

## 빨리 시작하기

### AI 도우미에게 시키기
| 도구 | 설정 방법 |
|---|---|
| **Claude** (claude.ai, Claude Code) | `docs/manual-claude.md` — ZIP 올리기 또는 `~/.claude/skills/` 에 clone |
| **ChatGPT** (Edu·Enterprise·Business 의 Skills, 또는 프로젝트) | `docs/manual-chatgpt.md` |
| **Codex** (CLI·IDE·클라우드) | `.agents/skills/conference-site` 에 clone → `$conference-site` |

그 다음 대화창에:
> "학회 홈페이지 만들어 줘. 아래 교수님 메일 내용 참고해서. (메일 붙여넣기)"

빠진 정보를 묻고 `conference.json` 과 홈페이지 파일을 만들어 줍니다. 파일을 공개하는 방법은 **`docs/manual-github-pages.md`** (계정 만들기부터 끝까지).

### 사람이 직접 (파이썬 3.8 이상, 추가 설치 없음)
```bash
python3 scripts/new_site.py my-workshop-2027 --from sites/example-2027   # 예시를 복사해 시작
#   sites/my-workshop-2027/conference.json 편집 (항목 설명: references/schema.md)
python3 scripts/validate.py sites/my-workshop-2027/conference.json       # 검사
python3 scripts/build.py sites/my-workshop-2027 --deploy dist/my-workshop-2027   # 빌드 + 배포 폴더
#   dist/my-workshop-2027/ 의 내용을 공개 GitHub 저장소에 올리고 Pages 켜기 → docs/manual-github-pages.md
```

### 파이썬 없이
`blank/index.html`(빈 틀) + 직접 쓴 `conference.json` 두 파일을 GitHub 에 올리면 됩니다. 이메일은 `tools/encode-email.html` 로 보호값을 만들어 넣습니다. → `docs/manual-chatgpt.md` 4절

## 문서 안내

| 문서 | 내용 |
|---|---|
| `docs/manual-github-pages.md` | **GitHub 가입 → 조직 → 저장소 → 업로드 → Pages 켜기 → 수정 → 인수인계** (초보자용, 클릭만) |
| `docs/manual-google-sheet.md` | 등록 양식용 **구글 계정 선택(개인/학교/부서 공용)**, 시트·Apps Script 만들기, 계정 옮기기, 개인정보 운영 |
| `docs/manual-chatgpt.md` | ChatGPT(Edu) Skills·프로젝트·Codex 에서 쓰기, 파이썬 없이 쓰기 |
| `docs/manual-claude.md` | claude.ai·Claude Code 에서 쓰기 |
| `docs/themes.md` | 테마 고르기, 서울대 단과대학 프리셋 목록·근거, 서울대 UI 규정, 프리셋 추가·로고 |
| `docs/poster.md` | 인쇄용 포스터 만들기 — 배치 4종, 크기, 설정 항목, 인쇄 점검표 |
| `docs/open-design.md` | OpenDesign 과 함께 쓰기 — 디자인 시스템·브리프 내보내기, 가져오기, 주의할 점 |
| `docs/security.md` | 무엇이 공개되는지, 공개 전 점검표, 사고 대응 |
| `docs/faq.md` | 자주 묻는 질문 (발표자 자료 접수, 주소, 명단 등) |
| `references/schema.md` | `conference.json` 모든 항목 |
| `references/speaker-submission.md` | 발표자 제목·초록·발표자료 받기 → 반영 |
| `references/registration-sheet.md` | 등록 양식 클릭 순서·운영·문제 해결 |
| `references/registration-form.md` | (대안) 구글폼으로 등록받기 |
| `references/checklist.md` | 학회 준비 체크리스트 |
| `references/hosting.md` | 호스팅 비교 (GitHub Pages / Cloudflare Pages / Google Sites) |

## 폴더 구조

```
conference-site/            ← 이 폴더 자체가 스킬 (SKILL.md 가 있는 폴더)
├── SKILL.md                AI 가 읽는 작업 지시서 (Claude·ChatGPT·Codex 공통)
├── AGENTS.md               Codex 등 코딩 에이전트용 안내
├── template/               홈페이지 틀 (index.template.html, style.css, app.js, registration.gs, conference.skeleton.json)
│                           + 포스터 틀 (poster.css, poster.js)
├── themes/                 배색 프리셋 (snu + 서울대 단과대학 16종, 범용 5종, _template)
├── scripts/                파이썬 스크립트 (new_site, validate, build, import_speakers, import_participants,
│                           make_registration_script, encode_email, theme_gallery, make_poster, export_open_design,
│                           package_skill, selftest)
├── references/             AI 와 사람이 같이 보는 참고 문서
├── docs/                   사람용 매뉴얼
├── chatgpt/                ChatGPT 프로젝트 지시문
├── tools/encode-email.html 브라우저에서 이메일 보호값 만들기 (파이썬 불필요)
├── blank/index.html        빈 템플릿 (conference.json 만 올려도 동작)
├── sites/example-2027/     가상 예시 사이트
└── dist/                   빌드 결과 (git 에 올리지 않음)
```

## 꼭 지킬 것

- **개인정보를 공개 저장소에 쓰지 않습니다.** 이메일은 원본에만 평문으로 두고 `build.py` 가 공개본에서 난독화합니다. 참가자 명단은 이름·소속만, 동의자만. 등록 응답 시트는 공유하지 않습니다. → `docs/security.md`
- **자료에 없는 것을 지어내지 않습니다.** 영문 성명·등록비·마감일·소개글이 없으면 비우고 `_todo` 에 남깁니다.
- **개인정보 안내문은 초안**입니다. 보유 기간 등은 기관 담당 부서와 확정하세요. 이 저장소는 법률 자문을 제공하지 않습니다.
- 기관 로고·사진·글꼴은 사용 권한이 있는 것만 넣습니다. 이 저장소에는 어떤 기관의 로고도 들어 있지 않습니다.

## 자체 시험
```bash
python3 scripts/selftest.py
```
예시 사이트 빌드, 모든 테마 빌드, 빈 템플릿 생성, 공개본 평문 이메일 검사, 테마 값 검증을 확인합니다. 브라우저 동작 시험(언어 전환, 등록 양식, 이메일 창, 인쇄)은 개발 중 Chromium 으로 확인했으며 저장소에는 포함하지 않았습니다.

## 개선 아이디어
- 단과대학 프리셋을 공식 색상 값으로 교체 (현재 대부분 홈페이지 화면에서 읽은 값 — 공식 수치를 아시면 기여 환영)
- 포스터: 도련(재단 여유) 옵션, SNS 정사각·세로 이미지, 현수막 비율
- 참가자 수 자동 집계 표시, 명찰 PDF 생성, 다중 페이지(초록집) 템플릿
- 영문 성명 조회 보조 (확인은 사람이)

## 라이선스와 면책
MIT — `LICENSE`. 자유롭게 수정·재배포할 수 있습니다. 이 소프트웨어는 있는 그대로 제공되며, 개인정보 처리·상표 사용·호스팅 서비스 약관의 준수는 사용자 책임입니다. 기여는 `CONTRIBUTING.md`.
