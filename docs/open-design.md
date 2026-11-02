# OpenDesign 과 함께 쓰기

> [OpenDesign](https://github.com/nexu-io/open-design) (nexu-io, Apache-2.0) 은 AI 코딩 에이전트와 함께 웹 시안·슬라이드·포스터·이미지·영상을 만드는 **별도의 디자인 작업 공간(앱)** 입니다.
> conference-site 는 OpenDesign 을 포함하지 않습니다. 대신 OpenDesign 에 **가져갈 수 있는 파일**을 만들어 줍니다.
> 이 문서의 OpenDesign 관련 내용은 2026-10-27·2026-11-02 에 저장소(v0.25.1, 커밋 5a0c477)의 README·문서·코드를 읽고 확인한 것입니다. OpenDesign 앱을 실제로 설치해 시험하지는 못했습니다(아래 "확인하지 못한 것").

## 0. 가장 쉬운 방법 — 웹 도구 안에서 (설치 없음, 팩트챗 크레딧 사용)

웹 도구(https://songh2.github.io/conference-site/)에는 OpenDesign 의 **디자인 규칙**을 넣은 AI 디자인 기능이 들어 있습니다. OpenDesign 앱을 설치하지 않아도 되고, "시작하기" 탭에 넣은 API 키(서울대 구성원은 팩트챗)의 크레딧을 씁니다.

| 어디서 | 하는 일 |
|---|---|
| **포스터** 탭 → "AI 디자인 시안" | 기본 포스터가 마음에 들지 않을 때 AI 가 새 시안(HTML)을 그림. "이렇게 바꿔 주세요"로 계속 고치고, 시안끼리 비교 |
| **디자인** 탭 → "AI 배색·첫 화면 그림 제안" | 홈페이지 배색(색 12가지)·제목 글꼴·모서리·첫 화면 배경 그림을 제안 → 적용·되돌리기. 적용한 배색은 포스터에도 쓰임 |

AI 에게 함께 보내는 것 (OpenDesign 이 자기 AI 에이전트에게 주는 것과 같은 종류):
- **디자인 시스템**: 이 행사 배색의 `DESIGN.md` + `tokens.css` (2절의 내보내기와 같은 내용)
- **디자인 규칙**: OpenDesign `craft/` 의 글자(typography)·글자 위계·색·"AI 티" 금지 규칙 — `web/opendesign/` 에 원문 그대로(Apache-2.0)
- **사실 브리프**: 행사 정보(2절의 포스터 브리프). AI 는 이 글만 쓰도록 지시받고, 결과에 자료에 없는 글이 있으면 화면에 경고가 뜹니다.
- 결과 형식은 OpenDesign 의 API 키 실행(BYOK)처럼 완성된 HTML 하나(`<artifact>`)입니다. 웹 도구가 스크립트·외부 주소를 지우고, 실제 QR 코드와 올린 사진을 끼워 넣습니다.

OpenDesign 앱 전체(수십 가지 스킬·템플릿, 비평 기능, 파일 작업)와 똑같지는 않습니다. 더 많은 기능이 필요하면 아래 3절처럼 OpenDesign 앱을 설치해 팩트챗 키를 연결하세요.

## 1. 언제 쓰나

| | conference-site 의 포스터 (`make_poster.py`) | OpenDesign |
|---|---|---|
| 잘하는 것 | 정확한 정보, 일정표·연사 명단, 같은 틀의 반복 제작, 무료 | 일러스트·사진 합성, 자유로운 배치, 여러 시안 비교, 슬라이드·영상 |
| 필요한 것 | 파이썬 (PDF 에는 Playwright) | Node 24 + pnpm 또는 Docker, 또는 데스크톱 앱 설치 / AI 에이전트(Claude Code, Codex 등) 연결 또는 API 키 |
| 비용 | 없음 | 소프트웨어는 무료(오픈소스). 쓰는 AI 모델 사용료는 별도(API 요금이나 OpenDesign Go 유료 크레딧) |
| 정보 정확성 | `conference.json` 을 그대로 사용 | AI 가 쓰므로 **반드시 사람이 대조** |

**권장 흐름**: conference-site 로 기본 포스터(PDF)를 먼저 만든다 → 더 눈에 띄는 시안이 필요하면 OpenDesign 에 브리프·디자인 시스템·기본 포스터를 가져가 다듬는다 → 완성본을 브리프의 사실 정보와 한 줄씩 대조한다.

## 2. 가져갈 파일 만들기

```bash
# 포스터 브리프 (행사 정보를 사실 그대로 정리한 작업 지시서) + 그 행사 테마의 디자인 시스템
python3 scripts/export_open_design.py --brief sites/<slug>
#   → dist/<slug>/open-design/poster-brief.md
#   → dist/open-design/design-systems/conference-<테마 id>/

# 테마를 지정해서, 또는 전부
python3 scripts/export_open_design.py --theme snu-science
python3 scripts/export_open_design.py --all-themes
```

### 디자인 시스템 패키지
`dist/open-design/design-systems/conference-<id>/` 에 OpenDesign 의 디자인 시스템 형식대로 세 파일이 생깁니다.

| 파일 | 내용 |
|---|---|
| `manifest.json` | OpenDesign 디자인 시스템 프로젝트 형식(`od-design-system-project/v1`)의 목록 정보 |
| `DESIGN.md` | AI 에이전트가 읽는 디자인 설명 — 배색과 근거(공식/홈페이지 추출), 글꼴, 배치 순서, 대비 기준, **사실만 쓰기·실존 인물 사진 생성 금지·로고 규정** 같은 규칙 |
| `tokens.css` | OpenDesign 토큰 이름(`--bg`, `--accent`, `--font-display` …)으로 옮긴 색·글꼴·간격 값. OpenDesign 이 필수로 요구하는 52개 토큰을 모두 채움 |

### 포스터 브리프
`poster-brief.md` 에는 용지 크기, 언어, 행사명·일시·장소·주최·등록 정보·홈페이지 주소, 프로그램 표, 연사 명단, 그리고 지켜야 할 규칙이 들어 있습니다. OpenDesign 이 아니어도 ChatGPT·Claude 의 이미지/디자인 기능이나 외부 디자이너에게 그대로 줄 수 있습니다.

## 3. OpenDesign 앱에서 쓰기

> **맥에서 설치하고 팩트챗 키로 연결하는 단계별 안내는 [`open-design/README.md`](../open-design/README.md)** 에 있습니다(2026-11-02).
> 요약: ① 데스크톱 앱 설치(맥 Apple Silicon·Intel, 윈도우 x64) → ② 팩트챗 연결 — 권장은 Claude Code + 팩트챗(`~/.claude/settings.json` 의 env 항목) → ③ 웹 도구 포스터 탭의 **"OpenDesign 앱용 묶음 받기 (ZIP)"**(브리프·QR·사진·행사 배색·포스터 스킬) → ④ 디자인 시스템은 설정 → 디자인 시스템 추가 → 로컬, 포스터 스킬은 GitHub 링크로 설치 → ⑤ 새 프로젝트에서 브리프 첨부 후 요청.
> 저장소의 `open-design/` 폴더에 디자인 시스템 22개와 OpenDesign 용 포스터 스킬(`open-design/skills/conference-poster`)을 넣어 두었습니다. OpenDesign 앱 자체는 컴퓨터에서 돌아가는 프로그램이라 GitHub Pages 에는 설치할 수 없습니다.

아래 3-1~3-3 은 처음 작성한(2026-10-27) 일반 안내입니다.

### 3-1. 설치 (처음 한 번)
OpenDesign 공식 안내를 따릅니다. 이 문서는 요약만 적습니다.
- **데스크톱 앱**: https://open-design.ai 의 Download
- **내 컴퓨터에 직접**: 저장소의 `QUICKSTART.md` (Node 24, pnpm 10 필요)
- **서버(Docker)**: 저장소의 `docs/install-guide.md` (`bash deploy/scripts/install.sh`)
- 그다음 AI 에이전트를 연결합니다. 이미 쓰는 Claude Code·Codex 가 있으면 그것을, 없으면 API 키(BYOK)를 넣습니다. 학교 ChatGPT Edu 계정이 OpenDesign 에 연결되는지는 확인하지 못했습니다.

#### 팩트챗 키를 OpenDesign 앱에 연결하기 (서울대 구성원)
OpenDesign README·QUICKSTART 에 따르면 설정(**Models & providers**)에서 API 키 실행(BYOK)을 만들 수 있고, "OpenAI 호환 주소(any OpenAI-compatible endpoint)"나 Anthropic 방식을 고르고 `baseUrl` + `apiKey` + `model` 을 넣습니다(2026-11-02 문서 확인).
- 방식 OpenAI 호환: 주소 `https://api.baze.co/v1/gateway`, 키 = 팩트챗 키, 모델 = `/models` 목록에 있는 이름
- 방식 Anthropic: 주소 `https://api.baze.co/v1/gateway/claude`, 모델 = `claude-…`
- 팩트챗 주소가 OpenDesign 이 붙이는 경로(끝에 `/` 없는 `/chat/completions`, `/v1/messages`)에도 응답하는 것은 잘못된 키로 확인했습니다(401 응답). **실제 OpenDesign 앱에서 끝까지 연결해 보지는 못했습니다.**
- OpenDesign 의 BYOK 실행은 파일 도구 없이 완성된 HTML 하나를 돌려주는 방식이라고 문서에 적혀 있습니다.

### 3-2. 디자인 시스템 가져오기
OpenDesign 화면 기준(한국어 메뉴 / 영어 메뉴):
1. **설정 → 디자인 시스템 추가** (Settings → Add design system)
2. **로컬** (Local) → **프로젝트 경로** (Project path)에 `open-design/design-systems/conference-<id>` 또는 묶음 ZIP 의 `design-system/conference-…` 폴더 경로 → **프로젝트에서 가져오기** (Import from project)
3. OpenDesign 코드 확인(2026-11-02): 이 가져오기는 폴더를 분석해 디자인 시스템을 **새로 만듭니다**. 색·글꼴 값(`tokens.css`의 CSS 변수), 이름·설명(`package.json`), 핵심 규칙(`README.md` 앞 1400자)은 들어가지만 `DESIGN.md` 글은 OpenDesign 이 새로 씁니다. "GitHub 에서 가져오기"는 저장소 맨 위 폴더만 받으므로 하위 폴더 주소는 쓸 수 없습니다.

### 3-3. 포스터 시안 만들기
1. 새 프로젝트를 열고, 위에서 가져온 디자인 시스템을 고릅니다.
2. 대화창에 `poster-brief.md` 내용을 붙여 넣거나 파일로 첨부합니다. conference-site 가 만든 `poster-*.html` 도 함께 첨부하면 "이 배치를 바탕으로"라고 요청할 수 있습니다.
3. OpenDesign 의 포스터 관련 템플릿(예: `magazine-poster`, 이미지 생성용 `image-poster`)을 쓸 수 있습니다. 이 템플릿들은 원래 영문·마케팅용이라 학술 포스터에 맞게 브리프의 규칙을 함께 주는 것이 중요합니다.
4. 결과를 PDF 로 내보낸 뒤 **브리프의 "사실 정보"와 한 줄씩 대조**합니다(이름·요일·호실).

## 4. 주의할 것

- **사실 대조는 사람 몫**: AI 가 날짜를 바꾸거나 연사를 지어낼 수 있습니다. 브리프에 금지 규칙을 넣었지만 결과는 꼭 확인하세요.
- **실존 인물**: 연사의 얼굴을 AI 로 만들지 마세요. 사진은 본인 동의를 받은 파일만.
- **로고·상표**: OpenDesign 의 디자인 시스템 목록에는 여러 기업 브랜드를 본뜬 것이 있습니다. 행사 포스터에 다른 기관·기업의 브랜드 디자인을 흉내 내지 않습니다. 서울대학교 시그니처는 학교가 준 파일을 SNU Blue·SNU Gray·검정·흰색으로만 씁니다.
- **개인정보**: 참가자 명단·연락처를 OpenDesign(또는 연결한 AI 서비스)에 넣지 마세요. 브리프에는 공개해도 되는 정보만 들어 있습니다.
- **비용**: OpenDesign 자체는 무료지만, 연결한 AI 모델 사용료가 생길 수 있습니다.
- **라이선스**: conference-site 는 OpenDesign 의 코드는 포함하지 않습니다. 웹 도구의 AI 디자인 기능을 위해 `craft/` 규칙 파일 4개만 원문 그대로 `web/opendesign/` 에 넣었고(라이선스 전문·출처 함께), 나머지는 공개된 파일 형식(`manifest.json`·`DESIGN.md`·`tokens.css` 와 토큰 이름)에 맞춘 파일입니다. OpenDesign 은 Apache-2.0 이며, 그 안의 개별 템플릿·스킬은 각자의 출처와 라이선스를 따릅니다.

## 5. 확인한 것 / 확인하지 못한 것

- 확인함(2026-11-02, 커밋 5a0c477): 맥·윈도우 데스크톱 앱, 앱 한국어 번역, 로컬 CLI·API 제공자 설정과 Claude·Codex 프록시 칸(환경 변수 이름), 스킬 GitHub 폴더 링크 설치, 디자인 시스템 가져오기 동작, 저장소 `open-design/` 의 디자인 시스템 22개가 OpenDesign 검사 코드 통과, 포스터 스킬 SKILL.md 가 OpenDesign 해석 코드로 읽힘. 서울대 팩트챗 문서의 Claude Code·Codex·OpenCode 연결 방법.
- 확인함(2026-11-02, 커밋 5a0c477, 웹 도구 관련): `craft/` 규칙 파일(Apache-2.0, 안의 일부는 refero_skill MIT 를 바탕으로 함), BYOK 설정이 OpenAI 호환·Anthropic 방식과 사용자 지정 주소(`baseUrl`)를 받는다는 문서 내용, BYOK 결과가 `<artifact>` 블록 하나라는 문서 내용, `skills/poster-hero` 포스터 스킬.
- 확인함(저장소 v0.25.1, 2026-10-27): Apache-2.0 라이선스, 디자인 시스템 패키지 형식(`manifest.json` + `DESIGN.md` + `tokens.css`, 스키마 `od-design-system-project/v1`), 필수 토큰 목록(`packages/contracts/src/design-systems/token-schema.ts`), 설정 화면의 "Add design system → Local / GitHub" 가져오기 메뉴 이름, 포스터 관련 템플릿(`poster-hero`, `magazine-poster`, `image-poster`) 존재, 설치 방법(데스크톱·소스·Docker).
- **확인하지 못함**: 실제 OpenDesign 앱에서 이 패키지를 가져왔을 때 그대로 인식되는지(Verbatim 모드 동작), GitHub 주소로 하위 폴더만 가져올 수 있는지, 학교 ChatGPT Edu 연결 가능 여부, 한국어 글꼴 렌더링 품질. 처음 써 보신 분이 결과를 이 문서에 보태 주세요.
