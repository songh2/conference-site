# 호스팅 선택과 배포 절차

학회 홈페이지는 (1) 행사 2~6개월 전에 열고, (2) 행사 후에도 여비 정산·경력 증빙용으로 **몇 년씩 그대로 유지**해야 하며,
(3) 관리자가 바뀌어도 살아 있어야 한다. 이 세 조건에 비용 0원으로 맞는 선택지를 비교한다.

## 비교 (2026-10 확인)

| | **GitHub Pages** (권장) | Cloudflare Pages | Google Sites (학교 Workspace) |
|---|---|---|---|
| 비용 | 무료 (공개 저장소) | 무료 | 무료 (학교 계정) |
| 이 템플릿과의 궁합 | 그대로 올리면 됨 | 그대로 올리면 됨 | 사용 불가 (자체 편집기만 지원, 한/영 전환 버튼 구현 불가) |
| 장기 유지 | 저장소가 있는 한 유지. 조직(Organization) 계정으로 만들면 담당자 교체에도 안전 | 동일 | 만든 사람 계정에 묶임. 퇴직·계정 정리 시 소유권 이전 필요 |
| 한도 | 사이트 1 GB, 월 100 GB 전송(소프트), 시간당 빌드 10회 | 월 500회 빌드(계정 기준), 파일 2만 개, 파일당 25 MiB. 공식 한도 문서에 전송량 상한은 명시되어 있지 않음 | 파일 크기 제한 있음(드라이브 기준) |
| 비공개 저장소에서 배포 | 유료 플랜(Pro/Team/Enterprise)만 가능. **무료 계정은 공개 저장소만** | 가능 | 해당 없음 |
| 수정 방법 | GitHub 웹에서 `conference.json` 편집 → 자동 반영 | GitHub 연동 시 동일 | 편집기에서 직접 |
| 주소 | `https://<계정>.github.io/<저장소>/` + 사용자 도메인 가능 | `https://<프로젝트>.pages.dev` + 사용자 도메인 가능 | `sites.google.com/snu.ac.kr/<이름>` |

참고 자료: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits),
[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits).

### 권장안
**GitHub Organization 계정(예: `snu-math-events`) 아래에 학회마다 공개 저장소 하나씩.**
- 주소가 `https://snu-math-events.github.io/ntc2027/` 처럼 규칙적으로 나와 포스터·공문에 적기 좋다. 
- 조직 소유자(Owner)를 담당 직원 + 교수 1인 이상으로 두면 한 사람이 떠나도 사이트와 편집 권한이 남는다.
- 이 스킬 저장소(템플릿·스크립트)는 공개여도 된다(실제 행사 원본을 넣지 않는 한). 공개가 꼭 필요한 것은 "배포용 사이트 저장소"다.
- 공개 저장소이므로 **개인정보(참가자 명단, 연락처 파일 등)는 절대 올리지 않는다.** 사전등록 응답은 구글폼/시트에만 둔다.

### 사용자 도메인(선택)
- `ntc2027.snu-math.kr` 같은 주소를 쓰려면 도메인 등록비(등록업체·확장자에 따라 연 1~3만원대, 변동)가 든다. 필수는 아니다.
- 학과·학교 도메인의 하위 주소(예: `events.math.snu.ac.kr`)를 쓰고 싶으면 학교 전산 부서에 CNAME 설정을 요청해야 한다. 가능 여부와 절차는 기관마다 다르므로 먼저 문의한다.

---

## GitHub Pages 배포 절차

계정 만들기부터 Pages 켜기·수정·인수인계·문제 해결까지 클릭 단위로 적은 안내는 **`docs/manual-github-pages.md`** 에 있다. 요약:

1. (처음 한 번) GitHub 조직 만들기 → Owner 2명 이상
2. 행사마다 **공개** 저장소 `<slug>` 만들기 (Add a README 체크)
3. **Add file → Upload files** 로 `dist/<slug>/` 의 **내용물**(`index.html`, `conference.json`, `.nojekyll`, `assets/`) 올리기 — 폴더째 올리지 않는다
4. **Settings → Pages → Build and deployment → Source: Deploy from a branch → main, / (root) → Save**
5. 1~3분 뒤 "Your site is live at …" 확인
6. 이후 글 수정은 저장소의 `conference.json` 을 웹에서 편집(재빌드 불필요). 이메일은 `email_enc` 값으로(`tools/encode-email.html`)

### 자주 묻는 문제
| 증상 | 원인·해결 |
|------|-----------|
| 404 페이지 | Pages 설정의 Branch/폴더가 잘못됨, 또는 `index.html` 이 하위 폴더에 들어감(저장소 루트에 있어야 함) |
| 수정했는데 그대로임 | 캐시. 1~5분 기다린 뒤 Ctrl+F5. `conference.json` 문법 오류면 이전 내용(index.html 에 내장된 복사본)이 계속 보이므로 `validate.py` 로 확인 |
| 사진이 안 보임 | 경로 대소문자·확장자 불일치 (`Hero.JPG` ≠ `hero.jpg`) |
| "Pages 를 쓸 수 없다"는 메시지 | 저장소가 Private 임. Settings → General 맨 아래 **Change visibility → Public** |
