# GitHub 으로 학회 홈페이지 공개하기 — 처음부터 끝까지

> 대상: GitHub 을 한 번도 써 본 적 없는 행정 담당자·대학원생.
> 터미널(명령 프롬프트)은 쓰지 않습니다. **웹 브라우저에서 클릭만** 합니다.
> 화면의 영어 버튼 이름은 그대로 적고 괄호 안에 뜻을 달았습니다. GitHub 화면은 영어로만 제공됩니다.
> 메뉴 위치와 문구는 GitHub 이 바꾸면 조금 달라질 수 있습니다. 이 문서는 2026-10 기준 GitHub 공식 문서를 확인해 썼습니다.

## 0. 준비물

| 준비물 | 어디서 나오나 |
|---|---|
| 배포용 폴더 `dist/<slug>/` (안에 `index.html`, `conference.json`, `assets/` 폴더, `.nojekyll`) | AI 도우미(Claude·ChatGPT)에게 홈페이지를 만들어 달라고 하면 이 폴더를 줍니다. 직접 만들려면 `python3 scripts/build.py sites/<slug> --deploy dist/<slug>` |
| 또는 **빈 템플릿** `blank/index.html` + 직접 쓴 `conference.json` | 파이썬을 쓸 수 없는 경우(ChatGPT 대화창만 있는 경우 등). `docs/manual-chatgpt.md` 4절 |
| GitHub 계정 | 아래 1절 |
| 이메일 주소 (가입용) | 가능하면 **부서 공용 메일**이나 학교 메일 |

`<slug>` 는 행사 이름을 영문 소문자·숫자·하이픈으로 줄인 것입니다(예: `ntc2027`, `algebra-camp-2028`). 이 이름이 그대로 홈페이지 주소의 마지막 부분이 됩니다.

## 1. 용어 다섯 개

| 용어 | 뜻 |
|---|---|
| **GitHub** | 파일(주로 프로그램 코드)을 올려 두고 변경 이력을 관리하는 무료 웹 서비스. 여기서는 "홈페이지 파일을 올려 두는 곳"으로만 씁니다. |
| **Repository (저장소)** | GitHub 안의 폴더 하나. 행사 하나 = 저장소 하나. |
| **Public / Private (공개 / 비공개)** | 공개 저장소는 누구나 파일을 볼 수 있습니다. **무료 계정에서 홈페이지(GitHub Pages)를 쓰려면 저장소가 Public 이어야 합니다.** 홈페이지 내용은 어차피 공개되므로 문제없지만, 그래서 **개인정보 파일은 절대 넣으면 안 됩니다.** |
| **Commit (커밋)** | "이 변경을 저장한다"는 뜻의 버튼. 파일을 올리거나 고칠 때마다 누릅니다. |
| **GitHub Pages** | 저장소에 있는 `index.html` 을 그대로 웹사이트로 보여 주는 무료 기능. 주소는 `https://<계정이름>.github.io/<저장소이름>/` 이 됩니다. |

## 2. 계정 만들기

### 2-1. 개인 계정 (처음 한 번)

1. https://github.com 접속 → 오른쪽 위 **Sign up** (가입).
2. 이메일 주소 → 비밀번호 → 사용자 이름(Username) 순서로 입력합니다. 사용자 이름은 **영문 소문자·숫자·하이픈**만 되고 나중에 바꾸기 번거로우니 신중히 정합니다(예: `hong-gildong`).
3. 이메일로 온 인증 코드를 입력하면 가입이 끝납니다.
4. 가입 직후 **2단계 인증(Two-factor authentication)** 을 켜 두기를 권합니다: 오른쪽 위 프로필 사진 → **Settings** → 왼쪽 **Password and authentication** → **Two-factor authentication** → 휴대폰 인증 앱(Google Authenticator 등) 등록. 복구 코드(Recovery codes)는 인쇄해 부서 서류함에 보관합니다.

### 2-2. 조직(Organization) 계정 — 권장

홈페이지 주소에 개인 아이디(`hong-gildong.github.io/...`)가 들어가는 것을 피하고, 담당자가 바뀌어도 사이트가 남게 하려면 **조직 계정** 아래에 저장소를 만듭니다. 조직은 무료이며, 여러 사람이 공동 관리자가 될 수 있습니다.

1. 로그인한 상태에서 오른쪽 위 **+** → **New organization** (새 조직).
2. 요금제 선택 화면에서 **Create a free organization** (무료 조직 만들기)을 고릅니다. 유료 플랜이나 "Start free for 30 days"(체험) 버튼은 누르지 않습니다 — 공개 저장소의 홈페이지는 무료로 충분합니다.
3. **Organization name** (조직 이름)이 주소의 앞부분이 됩니다. 예: `snu-math-events` → 홈페이지 주소가 `https://snu-math-events.github.io/<slug>/`. 영문 소문자·숫자·하이픈만 됩니다.
4. **Contact email** 은 부서 공용 메일을 넣습니다. "This organization belongs to: My personal account" 를 고릅니다.
5. 만든 뒤 조직 페이지 → **People** → **Invite member** 로 교수님·동료를 초대하고, 초대된 사람의 역할을 **Owner** 로 올려 둡니다. **Owner 는 항상 2명 이상** 유지합니다(한 사람이 퇴직하거나 계정을 잃어도 사이트와 설정이 남도록).

> 조직을 만들지 않고 개인 계정에 만들어도 홈페이지는 똑같이 동작합니다. 주소에 개인 아이디가 들어간다는 점만 다릅니다. 나중에 조직을 만들어 저장소를 옮길 수도 있습니다(저장소 **Settings → Danger Zone → Transfer ownership**). 옮기면 주소가 바뀝니다.

## 3. 저장소 만들기 (행사마다 하나)

1. 조직 페이지(또는 내 프로필)에서 **New repository** 초록 버튼. 또는 오른쪽 위 **+** → **New repository**.
2. **Owner** 칸에서 조직 이름을 고릅니다(개인 계정이 기본으로 들어 있으니 확인).
3. **Repository name** 에 `<slug>` 를 적습니다. 예: `ntc2027`. **이 이름이 홈페이지 주소의 마지막 부분**입니다.
4. **Public** 을 선택합니다 (Private 이면 무료 계정에서 홈페이지가 켜지지 않습니다).
5. **Add a README file** 에 체크합니다 (빈 저장소보다 다음 단계가 쉬워집니다).
6. **Create repository** (저장소 만들기).

## 4. 파일 올리기

1. 저장소 화면에서 **Add file** (파일 추가) → **Upload files** (파일 업로드).
2. 컴퓨터의 탐색기(파인더)에서 `dist/<slug>/` 폴더를 열고, **그 안의 내용물**을 모두 선택해 브라우저의 점선 상자 안으로 끌어다 놓습니다.
   - 올릴 것: `index.html`, `conference.json`, `.nojekyll`, `assets` 폴더(폴더째 끌어 놓으면 안의 파일이 `assets/...` 구조로 올라갑니다).
   - **`dist/<slug>` 폴더 자체를 끌어 놓으면 안 됩니다.** 그러면 홈페이지 주소가 `.../ntc2027/ntc2027/` 처럼 되고 첫 화면이 404 가 됩니다. `index.html` 이 **저장소 맨 위**에 있어야 합니다.
   - `.nojekyll` 처럼 점(.)으로 시작하는 파일은 탐색기에서 안 보일 수 있습니다. Windows: 보기 → "숨긴 항목" 체크. Mac: Finder 에서 `Cmd+Shift+.`. 이 파일이 빠져도 대부분 동작하지만, 밑줄(_)로 시작하는 폴더가 생기면 필요하므로 넣어 두는 편이 안전합니다.
3. 아래 **Commit changes** (변경 저장) 칸에 간단한 메모를 적습니다(예: `첫 업로드`). 메모는 자유입니다.
4. **Commit directly to the main branch** 가 선택되어 있는지 확인하고 **Commit changes** 버튼을 누릅니다. (화면에 따라 버튼 이름이 **Propose changes** 로 보일 수 있습니다. 그 경우 다음 화면에서 **Create pull request** → **Merge pull request** → **Confirm merge** 까지 눌러야 반영됩니다. 처음 만드는 저장소에서는 보통 **Commit changes** 가 바로 나옵니다.)
5. 한도: 브라우저 업로드는 **한 번에 100개 파일, 파일당 25 MiB** 까지입니다(GitHub 문서). 사진이 많으면 여러 번 나눠 올리거나, 사진 용량을 줄입니다(한 장 2 MB 이하 권장).

올린 뒤 저장소 첫 화면에 `index.html`, `conference.json`, `assets` 가 보이면 성공입니다.

## 5. 홈페이지 켜기 (GitHub Pages)

1. 저장소 화면 **상단 탭**에서 **Settings** (설정)를 누릅니다. 탭은 `Code · Issues · Pull requests · … · Settings` 순서이며, 창이 좁으면 `…` 안에 숨어 있습니다. (프로필 사진을 눌러 나오는 Settings 는 **계정** 설정이라 다른 화면입니다. 반드시 **저장소 화면 안의** Settings 여야 합니다.)
2. 왼쪽 메뉴 "Code, planning, and automation" 묶음 안의 **Pages** 를 누릅니다.
3. **Build and deployment** (빌드와 배포) 아래 **Source** (원본)에서 **Deploy from a branch** (브랜치에서 배포)를 고릅니다.
4. 바로 아래 **Branch** 에서 **main** 을 고르고, 옆 폴더 칸은 **/ (root)** 로 둡니다. **Save** (저장).
5. 잠시(보통 1~3분) 기다렸다가 같은 화면을 새로고침하면 위쪽에 **"Your site is live at https://<조직>.github.io/<slug>/"** 와 **Visit site** 버튼이 나타납니다. 이 주소가 홈페이지 주소입니다. (GitHub 문서는 정확한 소요 시간을 명시하지 않습니다. 10분이 지나도 안 나오면 아래 문제 해결 표를 보세요.)
6. 같은 화면의 **Enforce HTTPS** 에 체크되어 있는지 확인합니다(보통 자동으로 켜집니다).

### 누르면 안 되는 것
- Pages 화면 아래쪽의 **Unpublish site** (게시 중단): 누르면 홈페이지가 내려갑니다. 실수로 눌렀다면 3~4번을 다시 하면 됩니다(파일은 그대로 있습니다).
- **Start free for 30 days** / Enterprise 안내: 비공개 저장소로 홈페이지를 내려는 사람에게 보이는 유료 체험 안내입니다. 공개 저장소에는 해당 없으니 무시합니다.

## 6. 확인하기

주소를 열어 다음을 확인합니다.

- [ ] 오른쪽 위 **한국어 / English** 버튼으로 바뀌는지
- [ ] 휴대폰에서도 열어 보기 (메뉴 버튼, 표, 등록 양식)
- [ ] 등록 양식이 있다면 **본인 이름으로 시험 등록** → 구글 시트에 줄이 생기는지 → 시험 줄 삭제 (`docs/manual-google-sheet.md`)
- [ ] 위원·발표자의 봉투 아이콘 → 확인 코드 입력 → 주소가 맞게 나오는지
- [ ] 인쇄 미리보기(Ctrl+P / Cmd+P)에서 제목·일정·행사장이 나오는지

## 7. 내용 고치기

### 7-1. 글 고치기 — `conference.json` 만 수정하면 됩니다

1. 저장소에서 `conference.json` 을 클릭 → 오른쪽 위 **연필 아이콘(Edit this file)**.
2. 내용을 고칩니다. 한국어는 `"ko"`, 영어는 `"en"` 에 있습니다. 따옴표·쉼표·중괄호를 지우지 않도록 주의합니다.
3. 오른쪽 위 **Commit changes…** → 메모 입력 → **Commit changes**.
4. 몇 분 뒤 홈페이지에 반영됩니다. 안 바뀌어 보이면 **Ctrl+F5**(강력 새로고침) 또는 휴대폰은 탭을 닫고 다시 엽니다.

> 홈페이지는 열릴 때 `conference.json` 을 먼저 읽습니다. 그래서 `index.html` 을 다시 만들지 않아도 글이 바뀝니다.
> **단, `conference.json` 에 문법 오류**(쉼표 빠짐 등)가 있으면 그 파일을 못 읽고 `index.html` 안에 들어 있던 이전 내용이 계속 보입니다. 고친 뒤 안 바뀌면 이 경우일 가능성이 큽니다. 고친 내용을 AI 도우미에게 붙여 넣고 "이 JSON 문법 검사해 줘"라고 하거나, 저장소의 `scripts/validate.py` 로 검사합니다.

직접 고치기 어려우면 AI 도우미에게 이렇게 요청합니다:
> "ntc2027 사이트의 conference.json 에서 2월 12일 종료 시각을 13:00 으로 바꿔 줘" → 받은 파일을 위 방법으로 덮어 올립니다(같은 이름으로 **Upload files** 하면 교체됩니다).

### 7-2. 사진·PDF 추가
1. 저장소에서 `assets` 폴더를 클릭 → **Add file → Upload files** → 파일 끌어 놓기 → **Commit changes**.
2. `conference.json` 에서 경로를 적습니다. 예: 포스터 `"downloads": [{"label": {"ko": "포스터", "en": "Poster"}, "url": "assets/poster.pdf"}]`, 대표 사진 `"hero": {"image": "assets/hero.jpg"}`.
3. 경로의 **대소문자·확장자**가 파일 이름과 정확히 같아야 합니다(`Hero.JPG` ≠ `hero.jpg`).

### 7-3. 이메일 주소 추가
공개 저장소의 `conference.json` 에는 이메일을 **평문으로 적지 않습니다**(자동 수집 대상이 됩니다). 저장소의 `tools/encode-email.html` 을 컴퓨터에서 열어(더블클릭) slug 와 주소를 넣으면 나오는 값을 `"email_enc": "v1:..."` 로 적습니다. 파이썬이 있으면 `python3 scripts/encode_email.py --slug <slug> 주소` 도 같은 값을 만듭니다.

### 7-4. 배색(테마) 바꾸기
`conference.json` 의 `"theme"` 값을 바꾸면 다시 만들 필요 없이 반영됩니다. 예: `"theme": "snu-engineering"`. 목록과 미리보기는 `docs/themes.md`.

### 7-5. 템플릿이 새로 나왔을 때 (디자인·기능 업데이트)
글이 아니라 **`index.html` 자체**를 새로 만들어 교체해야 합니다. AI 도우미에게 "최신 템플릿으로 다시 빌드해 줘"라고 하거나 `build.py` 를 다시 돌린 뒤, 새 `index.html` 을 **Upload files** 로 같은 이름으로 올립니다. `conference.json` 과 `assets` 는 그대로 둡니다.

## 8. 홈페이지 주소에 관해

- 주소 형식은 `https://<조직 또는 계정>.github.io/<저장소>/` 로 고정이며, **앞부분(계정·조직 이름)을 뺄 수는 없습니다.** 개인 아이디가 싫으면 2-2절처럼 조직 이름을 씁니다.
- 저장소 이름을 **조직이름.github.io** 로 만들면 `https://<조직>.github.io/` 가 그 저장소의 홈페이지가 됩니다(조직당 하나). 여러 행사를 운영하면 행사별 저장소가 더 깔끔합니다.
- **사용자 도메인**(예: `ntc2027.example.kr`)을 쓰려면 도메인을 등록하고(유료, 보통 연 단위 비용) Pages 설정의 **Custom domain** 에 적은 뒤 도메인 업체에서 DNS(CNAME) 설정을 합니다. 학교 하위 도메인(`events.math.snu.ac.kr` 같은)은 학교 전산 부서에 CNAME 등록을 요청해야 하며, 가능 여부는 기관마다 다릅니다. 포스터·공문에 주소를 적기 전에 결정합니다(나중에 바꾸면 인쇄물의 주소가 틀어집니다).

## 9. 인수인계 (담당자가 바뀔 때)

- [ ] 새 담당자를 조직 **Owner** 로 추가하고, 떠나는 사람은 그 뒤에 **Remove** 합니다(먼저 지우면 Owner 가 0명이 될 수 있습니다).
- [ ] 조직의 **Settings → General** 에 있는 연락 이메일을 부서 공용 메일로 둡니다.
- [ ] 2단계 인증 복구 코드, 가입 이메일 정보를 부서 인수인계 서류에 남깁니다. 비밀번호 자체를 메일로 보내지 않습니다.
- [ ] 등록 양식(구글 시트)의 소유 계정도 같이 넘깁니다 → `docs/manual-google-sheet.md` 6절.
- [ ] 홈페이지 주소, 저장소 주소, 시트 주소를 한 장에 적어 둡니다.

## 10. 행사가 끝난 뒤

- 사이트를 **지우지 않습니다.** 참석자의 경력 증빙, 여비 정산 증빙 주소로 계속 쓰입니다. 종료일이 지나면 "행사가 종료되었습니다" 표시와 등록 마감 안내가 자동으로 나옵니다.
- 발표자료 → `assets/slides/` 에 PDF 업로드 후 `speakers[].slides` 에 경로. 단체사진 → `assets/` 에 올리고 `gallery` 에 추가. 포스터·프로그램북 → `downloads`.
- 등록 양식을 썼다면 구글 시트의 개인정보는 안내문에 적은 보유 기간이 지나면 삭제합니다. 홈페이지의 참가자 명단은 시트에서 읽어 오므로 시트의 줄을 지우면 명단도 사라집니다. 명단을 기록으로 남기고 싶으면 그 전에 `conference.json` 의 `participants` 에 이름·소속만 옮겨 적고 `registration.endpoint` 를 비웁니다.

## 11. 문제 해결

| 증상 | 원인과 해결 |
|---|---|
| 주소를 열면 **404** | ① Pages 설정이 저장 안 됨 → 5절 다시. ② `index.html` 이 하위 폴더에 들어감(4절 주의) → 파일을 맨 위로 옮기거나 다시 업로드. ③ 아직 1~3분이 안 지남. ④ 주소의 대소문자·하이픈 오타 |
| 저장소 Settings 에 **Pages 메뉴가 없다** | 저장소가 **Private** → Settings → General 맨 아래 **Danger Zone → Change repository visibility → Change to public** |
| "Your site is live" 가 안 뜬다 | 몇 분 더 기다린 뒤 새로고침. 저장소 **Actions** 탭에 빨간 X 가 있으면 그 줄을 눌러 메시지를 확인(보통 `.nojekyll` 누락으로 `_` 폴더가 거부된 경우) |
| 고쳤는데 **그대로다** | 브라우저 캐시 → Ctrl+F5. 그래도 그대로면 `conference.json` 문법 오류(7-1 참고) |
| **사진이 안 보인다** | 경로 대소문자·확장자 불일치, 또는 `assets` 폴더가 아닌 곳에 올라감 |
| 등록 양식에서 **"서버에 연결하지 못했습니다"** | 구글 Apps Script 쪽 문제 → `docs/manual-google-sheet.md` 문제 해결 표 |
| 실수로 **Unpublish** 를 눌렀다 | 5절 3~4번을 다시 하면 복구됩니다 |
| 업로드 중 "**file too large**" | 파일당 25 MiB 한도. 사진 용량을 줄이거나 PDF 를 압축 |
| 다른 사람이 수정하게 하고 싶다 | 조직 **People → Invite member** (수정 권한은 **Write**, 설정까지는 **Admin/Owner**). 공개 저장소라도 **쓰기는 초대받은 사람만** 가능합니다 |

## 12. 무료 한도와 사용 제한 (GitHub 문서 기준, 2026-10 확인)

- 공개 저장소의 GitHub Pages 는 **무료**입니다. 사이트 용량 1 GB 권장, 월 100 GB 전송량(소프트 한도), 시간당 빌드 10회. 학회 홈페이지는 이 한도에 전혀 미치지 않습니다.
- GitHub Pages 는 **정적 홈페이지용**이며, 상업 거래 사이트나 대용량 파일 배포 용도로는 쓰지 못하게 되어 있습니다(GitHub Pages 사용 제한 문서). 학술 행사 안내 페이지는 전형적인 허용 용도입니다.
- 방문자 통계(접속자 수)는 제공하지 않습니다. 필요하면 별도 도구를 붙여야 하는데, 개인정보 고지가 필요할 수 있으므로 이 템플릿은 기본으로 넣지 않았습니다.

## 13. 대안

| | 언제 고려하나 |
|---|---|
| **Cloudflare Pages** | 비공개 저장소에서 배포하고 싶을 때, 또는 GitHub 접속이 제한된 환경. 저장소를 연결하거나 폴더를 직접 올리는 방식 모두 무료. `references/hosting.md` 비교표 |
| **학교·학과 웹서버** | 학교 도메인이 꼭 필요할 때. `dist/<slug>/` 폴더를 그대로 올려 달라고 전산 담당자에게 요청하면 됩니다(서버 쪽 설정이 필요 없는 정적 파일) |
| **Google Sites** | 이 템플릿을 쓸 수 없습니다(자체 편집기만 허용). |

## AI 도우미에게 시킬 수 있는 것 / 본인이 해야 하는 것

| AI 도우미가 할 수 있음 | 본인이 직접 해야 함 |
|---|---|
| `conference.json` 작성·수정·검사, `index.html` 빌드, 배포 폴더 만들기, 이메일 보호값 만들기, 등록 스크립트 만들기 | GitHub 가입·조직 만들기·저장소 만들기·파일 업로드·Pages 켜기 (계정 로그인이 필요한 화면 클릭) |
| 올릴 파일 목록과 순서 안내, 오류 메시지 해석 | 구글 계정으로 시트·Apps Script 만들고 배포하기 |
| | 개인정보 안내문 확정(기관 담당 부서 확인) |

Claude Code 처럼 GitHub 에 직접 푸시할 수 있는 도구를 쓰는 경우에는 파일 업로드까지 AI 가 대신할 수 있습니다. 그래도 **Pages 켜기와 조직·권한 설정은 저장소 Settings 화면에서 사람이** 합니다.

---
참고한 공식 문서: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Adding a file to a repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) · [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
