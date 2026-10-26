# Claude 에서 쓰기 (claude.ai · Claude Code · GitHub 연결)

이 저장소는 그 자체가 **Claude 스킬 폴더**입니다(`SKILL.md` 가 있는 폴더). 어떤 방법이든 Claude 가 `SKILL.md` 를 읽고 그 절차대로 움직입니다.

## 방법 A — claude.ai 에 스킬로 올리기 (가장 간단)

1. ZIP 만들기: 파이썬이 있으면 `python3 scripts/package_skill.py` (→ `conference-site.zip`). 없으면 GitHub 저장소 페이지 → **Code → Download ZIP** 으로 받은 뒤, 압축을 풀고 폴더 이름을 `conference-site` 로 바꾸고 **그 폴더를** 다시 압축합니다(ZIP 을 열었을 때 `conference-site/` 폴더 하나가 보여야 합니다).
2. claude.ai → 설정 → **Skills**(화면 명칭은 바뀔 수 있음) 에서 ZIP 을 올리고 켭니다. [공식 안내](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
3. 새 대화에서:
   > "학회 홈페이지 만들어 줘. 아래 교수님 메일 내용 참고해서. (메일 붙여넣기)"
4. Claude 가 빠진 정보를 묻고 `conference.json`, `index.html`, 배포 폴더를 만들어 파일로 줍니다. 파일을 GitHub 에 올리는 것은 `docs/manual-github-pages.md`.
5. 저장소가 업데이트되면 ZIP 을 다시 만들어 **다시 올립니다**.

## 방법 B — Claude Code (터미널·데스크톱·웹)

```bash
git clone https://github.com/<계정>/conference-site.git ~/.claude/skills/conference-site
```
이후 어느 프로젝트에서나 `/conference-site` 로 부르거나 "학회 홈페이지 만들어 줘"라고만 해도 불립니다. `git pull` 로 최신화합니다. Claude Code 는 GitHub 에 직접 올리는 것(푸시)까지 할 수 있습니다. [Claude Code skills 문서](https://code.claude.com/docs/en/skills)

## 방법 C — 대화에 GitHub 저장소를 연결

claude.ai 에 **GitHub 커넥터**를 연결하면 대화에서 저장소를 열어 볼 수 있습니다.
> "GitHub 의 conference-site 저장소 SKILL.md 대로 OO워크샵 홈페이지를 만들어 줘"

공개 저장소라면 커넥터 없이 주소만 주어도 파일을 읽을 수 있는 경우가 많습니다.

## 발표자 자료를 첨부해서 반영하기

> "첨부한 PDF 두 개를 홍길동·김예시 발표자료로 연결하고, 첨부한 초록 문서의 내용을 각 발표자 초록에 넣어 줘"

Claude 는 PDF 를 `sites/<slug>/assets/slides/<id>.pdf` 로 저장하고 `speakers[].slides`·`abstract` 를 채운 뒤 다시 빌드합니다. 결과를 GitHub 에 올릴 때 `assets/slides/` 의 PDF 도 함께 올려야 링크가 열립니다. 자세한 흐름은 `references/speaker-submission.md`.

## 주의

- 참가자 명단·연락처 파일을 통째로 붙여 넣지 않습니다(이름·소속만, 게시 동의자만 반영).
- 구글 시트·Apps Script 만들기, GitHub 설정 화면 클릭은 Claude 가 대신할 수 없습니다(본인 계정 작업).
- Claude 가 만든 개인정보 안내문은 초안입니다. 기관 담당 부서 확인 후 확정하세요.
