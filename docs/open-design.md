# OpenDesign 과 함께 쓰기

> [OpenDesign](https://github.com/nexu-io/open-design) (nexu-io, Apache-2.0) 은 AI 코딩 에이전트와 함께 웹 시안·슬라이드·포스터·이미지·영상을 만드는 **별도의 디자인 작업 공간(앱)** 입니다.
> conference-site 는 OpenDesign 을 포함하지 않습니다. 대신 OpenDesign 에 **가져갈 수 있는 파일**을 만들어 줍니다.
> 이 문서의 OpenDesign 관련 내용은 2026-10-27 에 저장소(v0.25.1)의 README·문서·코드를 읽고 확인한 것입니다. OpenDesign 을 실제로 설치해 시험하지는 못했습니다(아래 "확인하지 못한 것").

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

## 3. OpenDesign 에서 쓰기

### 3-1. 설치 (처음 한 번)
OpenDesign 공식 안내를 따릅니다. 이 문서는 요약만 적습니다.
- **데스크톱 앱**: https://open-design.ai 의 Download
- **내 컴퓨터에 직접**: 저장소의 `QUICKSTART.md` (Node 24, pnpm 10 필요)
- **서버(Docker)**: 저장소의 `docs/install-guide.md` (`bash deploy/scripts/install.sh`)
- 그다음 AI 에이전트를 연결합니다. 이미 쓰는 Claude Code·Codex 가 있으면 그것을, 없으면 API 키(BYOK)를 넣습니다. 학교 ChatGPT Edu 계정이 OpenDesign 에 연결되는지는 확인하지 못했습니다.

### 3-2. 디자인 시스템 가져오기
OpenDesign 화면 기준(영어 메뉴):
1. **Settings → Design Systems → Add design system**
2. **Source: Local** → **Project path** 에 `dist/open-design/design-systems/conference-<id>` 폴더 경로 → **Import from project**
   - **Structure** 선택지가 나오면 **Verbatim**(파일을 그대로 사용)을 권장합니다.
3. 목록에 "… (conference-site)" 이름으로 나타나면 성공입니다.

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
- **라이선스**: conference-site 는 OpenDesign 의 코드나 파일을 포함하지 않고, 공개된 파일 형식(`manifest.json`·`DESIGN.md`·`tokens.css` 와 토큰 이름)에 맞춘 파일만 만듭니다. OpenDesign 은 Apache-2.0 이며, 그 안의 개별 템플릿·스킬은 각자의 출처와 라이선스를 따릅니다.

## 5. 확인한 것 / 확인하지 못한 것

- 확인함(저장소 v0.25.1, 2026-10-27): Apache-2.0 라이선스, 디자인 시스템 패키지 형식(`manifest.json` + `DESIGN.md` + `tokens.css`, 스키마 `od-design-system-project/v1`), 필수 토큰 목록(`packages/contracts/src/design-systems/token-schema.ts`), 설정 화면의 "Add design system → Local / GitHub" 가져오기 메뉴 이름, 포스터 관련 템플릿(`poster-hero`, `magazine-poster`, `image-poster`) 존재, 설치 방법(데스크톱·소스·Docker).
- **확인하지 못함**: 실제 OpenDesign 앱에서 이 패키지를 가져왔을 때 그대로 인식되는지(Verbatim 모드 동작), GitHub 주소로 하위 폴더만 가져올 수 있는지, 학교 ChatGPT Edu 연결 가능 여부, 한국어 글꼴 렌더링 품질. 처음 써 보신 분이 결과를 이 문서에 보태 주세요.
