# OpenDesign 앱에서 conference-site 쓰기 (맥 기준, 팩트챗 키)

> [OpenDesign](https://github.com/nexu-io/open-design)(nexu-io, Apache-2.0)은 AI 와 함께 포스터·웹 시안·슬라이드를 만드는 **설치형 앱**입니다.
> 이 폴더는 OpenDesign 앱에서 학술 행사 포스터를 만들 때 쓰는 파일을 모아 둔 곳입니다.
> 아래 내용은 2026-11-02 에 OpenDesign 저장소(커밋 `5a0c477`)의 README·문서·코드와 서울대 팩트챗 개발자 문서를 읽고 확인한 것입니다.
> **OpenDesign 앱을 실제로 설치해 끝까지 써 보지는 못했습니다**(맨 아래 "확인한 것 / 확인하지 못한 것").

설치 없이 쓰려면 웹 도구(https://songh2.github.io/conference-site/)의 포스터 탭 **"AI 디자인 시안"**이 더 간단합니다. 이 기능도 OpenDesign 의 디자인 규칙을 쓰고, 팩트챗 키로 동작합니다(`docs/open-design.md` 0절).

## 이 폴더에 있는 것

| 경로 | 내용 | OpenDesign 에서 |
|---|---|---|
| `design-systems/conference-<id>/` | conference-site 테마 22개(서울대 공통·단과대학 16개·범용 5개)를 OpenDesign 디자인 시스템 형식으로 만든 것. `manifest.json`·`DESIGN.md`·`tokens.css`(필수 토큰 52개) + 가져오기용 `package.json`·`README.md` | 설정 → 디자인 시스템 추가 → **로컬** |
| `skills/conference-poster/SKILL.md` | 학술 행사 인쇄 포스터 스킬. 브리프에 있는 사실만 쓰고, 인쇄 규격(A1~A4, mm)·한글 글자 규칙·진짜 QR 을 지키게 함 | 플러그인 화면 → 가져오기 → **Skill** → **URL** |

- 디자인 시스템 22개는 모두 OpenDesign 의 검사 코드(`design-systems/_schema/manifest.schema.ts`, 필수 토큰 목록)로 확인했습니다.
- 이 폴더의 디자인 시스템은 `python3 scripts/export_open_design.py --repo` 로 다시 만듭니다(`themes/` 를 고치면 함께 갱신, `selftest.py` 가 확인).
- 행사마다 필요한 **사실 브리프·QR·사진·그 행사 배색**은 웹 도구 포스터 탭의 **"OpenDesign 앱용 묶음 받기 (ZIP)"** 로 한 번에 받습니다. 그 ZIP 에도 디자인 시스템과 이 스킬이 들어 있습니다.

## 1. 설치 (처음 한 번)

OpenDesign README 기준: **맥(Apple Silicon·Intel)과 윈도우(x64)용 데스크톱 앱**이 있고, 리눅스는 아직 소스에서 실행해야 합니다.

1. https://open-design.ai 의 **Download**, 또는 https://github.com/nexu-io/open-design/releases 에서 맥용 파일을 받습니다.
2. 받은 파일을 열어 OpenDesign 을 **응용 프로그램(Applications)** 폴더로 옮깁니다(맥 앱 설치의 일반적인 방법).
3. OpenDesign 을 실행합니다. 처음 열 때 맥이 경고를 보이면, 공식 사이트·GitHub 에서 받은 파일인지 확인한 뒤 진행하세요.
4. 앱 화면은 한국어를 지원합니다(앱에 한국어 번역 파일이 들어 있음).

> OpenDesign 앱 자체는 무료(오픈소스)입니다. AI 사용료는 연결한 키(팩트챗 크레딧 등)에서 나갑니다.

## 2. 팩트챗 키 연결하기 (세 가지 중 하나)

OpenDesign 은 AI 를 두 가지로 부릅니다. ① 컴퓨터에 설치된 코딩 도구(Claude Code·Codex 등, **"로컬 CLI"**)를 불러 쓰거나, ② **"API 제공자"**(주소 + API 키)로 직접 부릅니다. 서울대 팩트챗 개발자 문서에는 Claude Code·Codex·OpenCode 를 팩트챗에 연결하는 방법이 있습니다.

> 먼저 팩트챗에서 **이 용도 전용 API 키**를 새로 발급받으세요(웹 도구 "시작하기" 탭의 "🔑 어떤 키를 쓰나요?" 참고). 아래 방법들은 키를 컴퓨터의 설정 파일이나 OpenDesign 설정에 저장하므로, 유출이 의심되면 팩트챗 API Gateway 화면에서 그 키만 바로 해지하세요.

### 방법 A (권장) — Claude Code + 팩트챗
서울대 팩트챗 문서([Claude Code 연동](https://docs.factchat.kr/docs/snu/api-gateway/integrations/claude-code))의 방법입니다. Claude 계열 모델은 그림도 읽고 디자인 품질이 좋은 편입니다.

1. Claude Code 를 설치합니다. OpenDesign **설정 → 모델 및 제공업체 → 로컬 CLI** 에 설치할 수 있는 CLI 목록과 "설치"·"문서 보기" 안내가 있습니다. 설정 파일 설명은 Anthropic 공식 문서(한국어) https://code.claude.com/docs/ko/settings (팩트챗 문서가 안내하는 주소).
2. 맥의 홈 폴더에 `.claude/settings.json` 파일을 만들고 아래처럼 적습니다(팩트챗 문서의 "설정 파일 env 항목" 방식 — 터미널이 아닌 앱에서 실행될 때도 읽힙니다).
   ```json
   {
     "env": {
       "ANTHROPIC_BASE_URL": "https://api.baze.co/v1/gateway/claude",
       "ANTHROPIC_AUTH_TOKEN": "여기에_팩트챗_API_키",
       "ANTHROPIC_MODEL": "claude-sonnet-5"
     }
   }
   ```
   - 모델 이름은 팩트챗 모델 목록에 있는 것을 씁니다(웹 도구의 "모델 목록 불러오기"로 확인 가능). 더 정교한 결과는 `claude-opus-…` 계열(크레딧 더 듦).
   - 이 파일에는 키가 그대로 들어 있습니다. 공용 PC 에서는 하지 말고, 다 쓰면 키를 지우거나 팩트챗에서 해지하세요.
3. OpenDesign **설정 → 모델 및 제공업체 → 로컬 CLI** 에서 **↻ 다시 스캔** → **Claude Code** 를 고릅니다.
4. 팩트챗 문서의 주의: 조직이 게이트웨이 개인정보 필터를 켠 경우 이메일 주소·전화번호가 든 자료를 보내면 "Request blocked by content policy (400)" 로 거절될 수 있습니다. 포스터 브리프에는 이메일을 넣지 않습니다.

대안: OpenDesign **설정 → 모델 및 제공업체 → 고급: 프록시 및 사용자 지정 경로** 에 "Claude 프록시 Base URL"(`https://api.baze.co/v1/gateway/claude`)과 "Claude CLI API key"(팩트챗 키)를 넣는 방법도 있습니다. 이 칸은 `ANTHROPIC_API_KEY` 로 전달되는데(OpenDesign 코드 확인), 팩트챗 문서는 Claude Code 에 `ANTHROPIC_AUTH_TOKEN` 을 권하므로 위 2번 방법을 먼저 쓰세요(이 대안은 시험하지 못함).

### 방법 B — Codex + 팩트챗
서울대 팩트챗 문서([Codex CLI 연동](https://docs.factchat.kr/docs/snu/api-gateway/integrations/codex-cli))의 설정입니다. `~/.codex/config.toml`:
```toml
model = "gpt-5.6-terra"
model_provider = "factchat"

[model_providers.factchat]
name = "BAZE"
base_url = "https://api.baze.co/v1/gateway"
env_key = "BAZE_API_KEY"
wire_api = "responses"
```
그리고 키를 환경 변수 `BAZE_API_KEY` 로 설정합니다. **주의(확인하지 못함)**: 맥에서 Dock·Finder 로 실행한 앱은 터미널 설정(`~/.zshrc`)의 환경 변수를 보통 읽지 않으므로, OpenDesign 이 Codex 를 부를 때 `BAZE_API_KEY` 가 없을 수 있습니다. 그런 경우 `env_key = "OPENAI_API_KEY"` 로 바꾸고 OpenDesign **고급: 프록시 및 사용자 지정 경로 → "Codex/OpenAI CLI API key (OPENAI_API_KEY)"** 칸에 팩트챗 키를 넣는 방법을 시도해 볼 수 있습니다.

### 방법 C — API 제공자(BYOK)
OpenDesign **설정 → 모델 및 제공업체 → API 제공자** 에서 프로토콜·Base URL·API 키·모델을 넣습니다.
- Anthropic 방식: Base URL `https://api.baze.co/v1/gateway/claude`, 모델 `claude-…`
- OpenAI 호환 방식: Base URL `https://api.baze.co/v1/gateway`
- 앱 화면 안내에 따르면 이 방식은 **OpenCode** 라는 프로그램이 설치되어 있어야 합니다. 팩트챗 문서에 [OpenCode 연동](https://docs.factchat.kr/docs/snu/api-gateway/integrations/opencode) 방법도 있습니다.

## 3. conference-site 자료 가져오기

### 3-1. 디자인 시스템 (행사 배색)
1. 웹 도구 포스터 탭에서 **"OpenDesign 앱용 묶음 받기 (ZIP)"** → 압축 풀기. (또는 이 저장소를 GitHub 의 **Code → Download ZIP** 으로 받아 `open-design/design-systems/conference-<id>` 를 씁니다.)
2. OpenDesign **설정 → 디자인 시스템 추가 → 로컬** → **프로젝트 경로**에 `design-system/conference-…` 폴더 경로 → **프로젝트에서 가져오기**.
3. 알아 둘 점(OpenDesign 코드 확인):
   - 이 가져오기는 폴더를 **분석해 디자인 시스템을 새로 만드는** 방식입니다. 색·글꼴 값(`tokens.css`), 이름·설명(`package.json`), 핵심 규칙(`README.md` 앞 1400자)은 반영되지만, 우리 `DESIGN.md` 글은 OpenDesign 이 새로 씁니다. 그래서 사실 규칙은 포스터 스킬에도 넣어 두었습니다.
   - "GitHub 에서 가져오기"는 **저장소 맨 위 폴더**만 받으므로, 이 저장소 안의 하위 폴더를 주소로 가져올 수는 없습니다. 로컬 방식을 쓰세요.

### 3-2. 포스터 스킬
OpenDesign 의 플러그인 화면에서 **플러그인 가져오기**(추가) 창을 열고 **Skill** 을 고른 뒤 **URL** 칸에 아래 주소를 넣습니다(OpenDesign 코드상 GitHub 폴더 주소를 받습니다).
```
https://github.com/songh2/conference-site/tree/main/open-design/skills/conference-poster
```
- 링크가 안 되면 같은 창의 로컬 폴더 업로드로 묶음 ZIP 안의 `skill/conference-poster` 폴더를 올립니다.
- 명령어를 쓰는 경우: `od skill install https://github.com/songh2/conference-site/tree/main/open-design/skills/conference-poster`
- (선택) 홈페이지까지 만드는 전체 스킬은 `github:songh2/conference-site` 로 설치됩니다(저장소 맨 위 `SKILL.md`). 파이썬 스크립트를 실행해야 하므로 Claude Code·Codex 처럼 파일 작업이 되는 방식에서만 제대로 동작합니다.

## 4. 포스터 만들기
1. OpenDesign 에서 새 프로젝트 → 디자인 시스템 **"… (conference-site)"** 또는 가져온 행사 배색 선택.
2. 묶음의 `poster-brief.md`, `qr.svg`, (있으면) `assets/` 사진을 첨부합니다.
3. "conference-poster 스킬로 A2 포스터를 만들어 줘. 브리프에 있는 사실만 써." 처럼 요청합니다. 마음에 안 들면 "제목을 더 크게", "밝은 바탕으로" 처럼 이어서 요청합니다.
4. 스킬이 마지막에 사실 대조 결과를 알려 줍니다. **사람이 한 번 더** 브리프와 한 줄씩 대조한 뒤 브라우저 인쇄 → "PDF로 저장"(여백 없음, 배경 그래픽 켜기).

## 5. 주의
- **개인정보**: 참가자 명단·연락처를 OpenDesign 이나 연결한 AI 에 넣지 마세요. 브리프에는 공개해도 되는 정보만 들어 있습니다.
- **사실 확인**: AI 는 날짜·요일·이름을 틀릴 수 있습니다. 인쇄 전 대조는 사람 몫입니다.
- **로고·인물**: 서울대 시그니처는 학교가 준 파일을 SNU Blue·SNU Gray·검정·흰색으로만. 연사 얼굴을 AI 로 만들지 않습니다.
- **GitHub Pages 에서는 OpenDesign 앱이 돌아가지 않습니다.** OpenDesign 은 컴퓨터(또는 서버)에서 돌아가는 프로그램(데몬 + AI 도구)이 필요해, 정적 파일만 올리는 GitHub Pages 에는 설치할 수 없습니다. 그래서 저장소에는 "앱에서 가져다 쓸 파일"과 이 안내서를 둡니다.

## 확인한 것 / 확인하지 못한 것 (2026-11-02)
- **확인함 (OpenDesign 코드·문서, 커밋 5a0c477)**: 맥(Apple Silicon·Intel)·윈도우 데스크톱 앱 제공(README), 앱 한국어 번역, 설정 "모델 및 제공업체 → 로컬 CLI / API 제공자", "고급: 프록시 및 사용자 지정 경로"의 Claude·Codex 칸과 전달되는 환경 변수 이름, API 제공자 방식의 OpenCode 필요 안내, 디자인 시스템 로컬·GitHub 가져오기 동작(분석해서 새로 만듦, GitHub 은 저장소 맨 위만), 스킬 링크 설치(GitHub 폴더 주소, 50MB 제한), 우리 디자인 시스템 22개가 OpenDesign 검사 코드 통과, 두 `SKILL.md` 가 OpenDesign 의 앞부분(frontmatter) 해석 코드로 읽힘.
- **확인함 (서울대 팩트챗 개발자 문서)**: Claude Code(`ANTHROPIC_BASE_URL`·`ANTHROPIC_AUTH_TOKEN`, 설정 파일 env 항목), Codex(`config.toml`), OpenCode 연결 방법.
- **확인하지 못함**: 실제 OpenDesign 앱 설치·실행, 팩트챗 키로 OpenDesign 에서 포스터를 끝까지 만드는 과정, 메뉴의 정확한 한국어 이름(위 이름은 앱의 한국어 번역 파일에서 찾은 것), 방법 B·C 의 실제 동작, 결과 품질과 크레딧 사용량. 처음 써 보신 분의 결과를 이 문서에 보태 주세요.
