# ChatGPT(Edu) · Codex 에서 쓰기

> 이 저장소는 **폴더 + `SKILL.md`** 형식의 "스킬"입니다. 같은 형식을 Claude 와 ChatGPT·Codex 가 모두 읽습니다.
> 아래 내용 중 "확인함"은 2026-10-27 에 OpenAI 공식 문서에서 확인한 것이고, "확인 못 함"은 실제 서울대 ChatGPT Edu 환경에서 시험하지 못한 것입니다. 처음 쓰실 때 다른 점이 있으면 이 문서를 고쳐 주세요.

## 0. 먼저 알아 둘 것

| 항목 | 내용 | 근거 |
|---|---|---|
| ChatGPT 의 "Skills" 기능 | **Business · Enterprise · Healthcare · Edu** 워크스페이스에서 제공 (워크스페이스 설정과 제품 제공 범위에 따름). 무료·Plus·Pro 는 공식 도움말의 제공 목록에 없음 | 확인함 — [OpenAI 도움말: Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt) |
| 관리자 설정 | Enterprise·Edu 관리자가 **Permissions & roles** 에서 "Enable skills", "Enable skill uploading", "Share skills", "Publish skills to workspace", "Enable skills installing" 을 역할별로 켜고 끔. **꺼져 있으면 아래 1절 방법을 쓸 수 없으니 학교 ChatGPT 관리 부서에 문의** | 확인함 (같은 문서) |
| 스킬 형식 | 폴더 안에 `SKILL.md`(이름·설명 머리말 + 지시문) + 선택 폴더 `scripts/`, `references/`, `assets/`, `agents/` | 확인함 — [OpenAI 개발자 문서: Build skills](https://learn.chatgpt.com/docs/build-skills) |
| 올리는 방법 | ChatGPT 에서 **Skills → Create → "Upload from your computer"**. 올리면 ChatGPT 가 검사하고 "Needs Review"/"Blocked" 로 표시될 수 있음 | 확인함 (도움말). **파일 형식(ZIP 인지 폴더인지)과 크기 한도는 문서에 없음 — 확인 못 함** |
| 쓰는 방법 | 대화창에서 `@` 를 치고 스킬을 고르거나, 요청 내용이 스킬 설명과 맞으면 자동으로 선택됨 | 확인함 (개발자 문서) |
| 지원 화면 | 단독 스킬: ChatGPT **데스크톱 앱**, Codex CLI, IDE 확장. 웹·모바일은 "플러그인에 묶인 스킬"만 | 확인함 (개발자 문서). 변할 수 있음 |
| 스킬 안의 파이썬 스크립트가 ChatGPT 대화에서 실행되는지 | 공식 문서에 명시 없음 | **확인 못 함** → 안 되면 4절(파이썬 없이 쓰기) |

## 1. 방법 1 — ChatGPT 에 스킬로 올리기 (Edu 워크스페이스에서 Skills 가 켜져 있을 때)

1. 이 저장소를 내려받습니다: GitHub 저장소 페이지 → 초록 **Code** 버튼 → **Download ZIP**. 압축을 풀면 `conference-site-main` 같은 폴더가 나옵니다. 폴더 이름을 **`conference-site`** 로 바꿉니다(스킬 이름과 폴더 이름이 같아야 하는 규칙이 있습니다).
   - 파이썬이 있으면 `python3 scripts/package_skill.py` 가 올리기 좋은 ZIP(`conference-site.zip`, 최상위가 `conference-site/` 폴더)을 만들어 줍니다.
2. ChatGPT(데스크톱 앱 권장) → 사이드바의 **Skills** → **Create** → **Upload from your computer** → ZIP 또는 폴더를 선택합니다. (둘 중 무엇을 받는지는 화면에서 확인하세요. ZIP 이 안 되면 폴더, 폴더가 안 되면 ZIP.)
3. 올린 뒤 스킬 목록에 `conference-site` 가 보이고 상태가 정상이면 완료입니다. "Needs Review" 면 관리자 승인이 필요할 수 있습니다.
4. 새 대화에서 `@conference-site` 를 고르고 요청합니다:
   > @conference-site 아래 메일 내용으로 학회 홈페이지 만들어 줘. (교수님 메일 붙여 넣기)
5. ChatGPT 가 빠진 정보를 묻고, `conference.json` 과 빌드 결과(`index.html`, 배포 폴더)를 만들어 내려받게 해 줍니다. **빌드 결과를 못 만들면(파이썬 실행이 안 되는 환경)** `conference.json` 만 받아 4절로 진행합니다.
6. 워크스페이스 전체에 공유하려면 관리자가 **Publish skills to workspace** 를 허용한 뒤 스킬 메뉴에서 공유/게시합니다. 그러면 다른 구성원이 올릴 필요 없이 바로 씁니다.

## 2. 방법 2 — ChatGPT "프로젝트"에 넣기 (Skills 가 꺼져 있거나 다른 플랜일 때)

프로젝트(Projects)는 지시문과 파일을 묶어 두는 기능입니다. 스킬처럼 자동으로 불리지는 않지만, 같은 효과를 냅니다.

1. ChatGPT 사이드바 → **프로젝트 만들기** → 이름 `학회 홈페이지 제작`.
2. **지시문(Instructions)** 칸에 `chatgpt/project-instructions.md` 의 내용을 붙여 넣습니다(SKILL.md 를 프로젝트 지시문 길이에 맞게 줄인 것).
3. **파일 추가**에 다음을 올립니다: `SKILL.md`, `references/` 안의 `.md` 전부, `template/conference.skeleton.json`, `sites/example-2027/conference.json`(작성 예시). 코드 실행이 되는 환경이면 `conference-site.zip` 전체를 올려도 됩니다.
4. 그 프로젝트 안에서 새 대화를 열고 요청합니다. ChatGPT 는 `references/schema.md` 를 보고 `conference.json` 을 작성합니다.
5. 빌드(파이썬)가 되는 환경이면 "zip 을 풀고 `scripts/build.py` 로 빌드해서 dist 폴더를 압축해 줘"라고 하고, 안 되면 4절.

## 3. 방법 3 — Codex (OpenAI 의 코딩 에이전트: CLI·IDE 확장·클라우드)

Codex 는 저장소 안의 `.agents/skills/` 또는 사용자 홈의 `~/.agents/skills/` 폴더에서 스킬을 읽습니다.

```bash
# 사용자 전역 (어느 프로젝트에서나)
git clone https://github.com/<계정>/conference-site.git ~/.agents/skills/conference-site
# 또는 작업 중인 저장소 안에만
git clone https://github.com/<계정>/conference-site.git .agents/skills/conference-site
```
대화에서 `$conference-site` 로 부르거나, "학회 홈페이지 만들어 줘"라고 하면 설명(description)과 맞아 자동으로 불립니다.
이 저장소 최상위의 `AGENTS.md` 는 Codex 가 저장소를 열었을 때 읽는 안내문으로, `SKILL.md` 를 가리킵니다.

> 경로·호출 방식은 Agent Skills 공개 표준과 Codex 문서를 정리한 글(2026-05)에서 확인했습니다. OpenAI 문서 원문 주소: https://developers.openai.com/codex/skills (이 문서 작성 환경에서는 직접 열지 못해 2차 자료로 확인했습니다.)

## 4. 방법 4 — 파이썬 없이 쓰기 (대화창만 있을 때)

ChatGPT 가 코드를 실행하지 못하는 환경이라도 홈페이지를 만들 수 있습니다. 홈페이지는 열릴 때 같은 폴더의 `conference.json` 을 읽어 그리기 때문입니다.

1. ChatGPT(방법 1 또는 2)에게 **`conference.json` 만** 작성하게 합니다. 형식은 `references/schema.md`, 예시는 `sites/example-2027/conference.json`.
2. 저장소의 **`blank/index.html`** 을 내려받습니다(내용이 비어 있는 홈페이지 틀. GitHub 에서 파일을 열고 오른쪽 위 **Download raw file** 아이콘).
3. 위원·발표자 이메일을 넣으려면 `tools/encode-email.html` 을 컴퓨터에서 열어(더블클릭) 보호값을 만들고, `conference.json` 에 `"email"` 대신 `"email_enc": "v1:..."` 로 적습니다. 평문 `"email"` 은 공개 저장소에서 그대로 노출됩니다.
4. `index.html`, `conference.json`, (사진·PDF 가 있으면) `assets/` 폴더를 GitHub 저장소에 올리고 Pages 를 켭니다 → `docs/manual-github-pages.md`.
5. 올리기 전 `conference.json` 문법 검사는 ChatGPT 에게 "이 JSON 문법 오류 있는지 검사해 줘"라고 시킵니다. 문법 오류가 있으면 홈페이지가 비어 보입니다.

> `blank/index.html` 은 컴퓨터에서 더블클릭하면 비어 보입니다(브라우저가 로컬 파일의 `conference.json` 읽기를 막음). GitHub Pages 에 올린 뒤에 확인하세요. 미리보기가 꼭 필요하면 방법 1·2 의 빌드(파이썬)를 쓰거나 Claude 에게 빌드를 맡깁니다.

## 5. ChatGPT 와 Claude 의 차이 (이 저장소 기준)

| | Claude (claude.ai / Claude Code) | ChatGPT (Skills / 프로젝트) | Codex |
|---|---|---|---|
| 스킬 올리기 | 설정 → Skills 에 ZIP | Skills → Create → Upload (Edu 설정에 따름) | `.agents/skills/` 폴더 |
| 파이썬 빌드 실행 | 됨 (파일 반환) | 환경에 따라 다름 (확인 못 함) | 됨 |
| GitHub 에 올리기 | Claude Code 는 가능, claude.ai 는 파일 전달까지 | 파일 전달까지 (업로드는 사람이) | 가능 (저장소 접근 설정 시) |
| 구글 시트 만들기·배포 | 안 됨 (사람이) | 안 됨 (사람이) | 안 됨 |

어느 도구를 쓰든 **SKILL.md 의 규칙은 같습니다**: 자료에 없는 내용(영문 성명, 등록비, 마감일, 소개글)을 지어내지 않고 `_todo` 에 남기며, 개인정보(이메일·연락처·참가자 명단)를 공개 저장소에 쓰지 않습니다.

## 6. 개인정보 주의 (ChatGPT 에 붙여 넣기 전에)

- 참가자 명단·연락처·등록 응답(시트)을 통째로 대화창에 붙여 넣지 않습니다. 명단 반영은 "이름·소속만, 게시 동의자만" 추려서 넣거나, 스크립트(`import_participants.py`)로 처리합니다.
- 교수님 메일을 붙여 넣을 때 불필요한 개인정보(휴대폰 번호 등)는 지우고 넣습니다.
- 학교 ChatGPT Edu 의 데이터 처리 정책(대화 내용이 학습에 쓰이는지 등)은 학교 안내를 따릅니다. 이 문서는 그 정책을 확인하지 않았습니다.

## 7. 요청 문장 예시

```
@conference-site 2027년 2월 11~12일 서울대 129동 101호에서 열리는 "정수론 워크숍" 홈페이지 만들어 줘.
조직위원은 홍길동(서울대), 김예시(예시대). 등록은 홈페이지 안 양식으로 받고 싶고
참석 구분은 "2일 모두 / 1일차만 / 2일차만". 영문 행사명은 아직 없음.
```
```
이 사이트(conference.json 첨부)의 2월 12일 종료 시각을 13:00 으로 바꾸고, 첨부한 PDF 를 홍길동 발표자료로 연결해 줘.
```
```
이 conference.json 의 테마를 snu-engineering 으로 바꾸고 문법 검사해 줘.
```
