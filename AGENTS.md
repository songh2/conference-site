# AGENTS.md — AI 코딩 에이전트(Codex 등)용 안내

이 저장소는 학회·워크샵·세미나 홈페이지를 만드는 **스킬**입니다. 작업 지시서는 `SKILL.md` 이며, 여기 적힌 절차와 금지 사항을 그대로 따르세요.

- 홈페이지 내용은 `sites/<slug>/conference.json` 하나에 넣고, `python3 scripts/validate.py` → `python3 scripts/build.py sites/<slug> --deploy dist/<slug>` 로 만듭니다. 표준 라이브러리만 씁니다(설치 불필요).
- `template/` 은 모든 사이트가 공유하므로 사이트 하나 때문에 고치지 않습니다. 색은 `theme`(`docs/themes.md`)으로 바꿉니다.
- `index.html` 을 직접 편집하지 않습니다(다음 빌드 때 사라집니다).
- 자료에 없는 내용(영문 성명, 등록비, 마감일, 소개글)을 지어내지 않고 `_todo` 에 남깁니다.
- 이메일·연락처·참가자 명단(이름·소속 외)을 `conference.json` 이나 공개 저장소에 쓰지 않습니다. 이메일은 원본에 평문으로 두면 `build.py` 가 공개본에서 난독화합니다.
- 자체 시험: `python3 scripts/selftest.py` (예시 사이트 빌드, 빈 템플릿, 테마, 평문 이메일 검사).
- 참고 문서: `references/schema.md`(항목 설명), `docs/`(사람용 매뉴얼).
