// conference.json 입력 양식 정의 — 항목 이름·뜻은 references/schema.md 와 같다.
// type: text, textarea, number, date, select, check, bi(한/영 한 줄), bitext(한/영 여러 줄),
//       group(하위 항목), list(반복 항목), bilist(한/영 문구 목록), asset(파일 올리기),
//       speakerRef(연사 연결), days(참석일 선택), slides(발표자료), theme(배색)

const KIND = [['talk', '강연'], ['registration', '등록'], ['break', '휴식'], ['meal', '식사'], ['social', '만찬·친교'], ['meeting', '회의'], ['other', '기타']];

const tl = (o) => (o && typeof o === 'object' ? (o.ko || o.en || '') : (o || ''));

export const TABS = [
  { id: 'start', title: '시작하기', icon: '①', custom: 'start' },
  {
    id: 'basic', title: '기본 정보', icon: '②', fields: [
      { type: 'bi', key: 'title', label: '행사명', required: true, multiline: true, help: '줄을 바꾸면 화면에서도 줄이 바뀝니다.' },
      { type: 'text', key: 'slug', label: '주소용 이름 (slug)', required: true, placeholder: '예: ntc2027', help: '영문 소문자·숫자·하이픈만. GitHub 저장소 이름과 홈페이지 주소가 됩니다.' },
      { type: 'bi', key: 'short_title', label: '짧은 이름', help: '화면 왼쪽 위에 나옵니다. 비우면 행사명.' },
      { type: 'bi', key: 'subtitle', label: '부제', help: '제목 아래 한 줄' },
      { type: 'bi', key: 'kicker', label: '제목 위 작은 문구', placeholder: '서울대학교 · 2027년 2월' },
      {
        type: 'group', key: 'dates', label: '일시', fields: [
          { type: 'date', key: 'start', label: '시작일', required: true },
          { type: 'date', key: 'end', label: '종료일' },
          { type: 'bi', key: 'display', label: '화면에 보일 일시 문구', placeholder: '2027년 2월 11일(목) 오후 2시 – 12일(금) 낮 12시 30분', help: '비우면 날짜만 표시됩니다(시각이 중요하면 채우세요).' },
        ],
      },
      {
        type: 'group', key: 'venue', label: '장소', fields: [
          { type: 'bi', key: 'name', label: '기관명', placeholder: '서울대학교' },
          { type: 'bi', key: 'room', label: '건물·호실', placeholder: '129동(상산수리과학관) 101호' },
          { type: 'bi', key: 'address', label: '주소' },
          { type: 'text', key: 'map_url', label: '지도 링크', placeholder: 'https://map.naver.com/... 또는 구글 지도 링크' },
          { type: 'number', key: 'lat', label: '위도 (선택)', help: '구글 지도에서 건물을 오른쪽 클릭하면 맨 위에 나오는 두 숫자 중 앞의 것. 넣으면 지도가 삽입됩니다.' },
          { type: 'number', key: 'lng', label: '경도 (선택)' },
          { type: 'bitext', key: 'directions', label: '오시는 길 (교통·주차)' },
        ],
      },
      { type: 'bi', key: 'host', label: '주최·주관' },
      { type: 'bitext', key: 'about', label: '소개글', help: '빈 줄로 문단을 나눕니다. 자료에 없으면 비워 두세요(지어내지 않기).' },
      { type: 'select', key: 'lang_default', label: '처음 열 때 언어', options: [['ko', '한국어'], ['en', 'English']] },
      { type: 'text', key: 'site_url', label: '공개된 홈페이지 주소', placeholder: 'https://아이디.github.io/저장소이름/', help: 'GitHub Pages에 올린 뒤 생기는 주소. 포스터 QR 코드에 쓰입니다.' },
      { type: 'date', key: 'updated', label: '최종 수정일', help: '화면 맨 아래 "최종 수정"에 표시' },
    ],
  },
  {
    id: 'program', title: '프로그램', icon: '③', fields: [
      {
        type: 'list', key: 'program', label: '날짜별 일정', addLabel: '날짜 추가',
        summary: (d) => [d.date, tl(d.label)].filter(Boolean).join(' · ') || '새 날짜',
        newItem: () => ({ date: '', label: { ko: '', en: '' }, tentative: false, note: { ko: '', en: '' }, items: [] }),
        item: [
          { type: 'date', key: 'date', label: '날짜' },
          { type: 'bi', key: 'label', label: '날짜 제목', placeholder: '2월 11일(목) · 1일차', help: '비우면 날짜로 자동' },
          { type: 'check', key: 'tentative', label: '이 날은 예정(미확정)입니다' },
          { type: 'bi', key: 'note', label: '날짜 안내 문구' },
          {
            type: 'list', key: 'items', label: '시간표', addLabel: '항목 추가',
            summary: (it) => [it.time, tl(it.title)].filter(Boolean).join('  ') || '새 항목',
            newItem: () => ({ time: '', title: { ko: '', en: '' }, speaker_id: '', speaker: { ko: '', en: '' }, kind: 'talk', tentative: false }),
            item: [
              { type: 'text', key: 'time', label: '시간', placeholder: '14:00–15:00' },
              { type: 'bi', key: 'title', label: '내용', placeholder: '강연' },
              { type: 'select', key: 'kind', label: '종류', options: KIND, help: '등록·휴식·식사·만찬은 표에서 연하게 보입니다.' },
              { type: 'speakerRef', key: 'speaker_id', label: '연사 연결', help: '연결하면 강연 제목과 초록 카드가 자동으로 이어집니다.' },
              { type: 'bi', key: 'speaker', label: '발표자 (직접 입력)', help: '연사 연결이 없을 때만 보입니다.' },
              { type: 'bi', key: 'note', label: '비고' },
              { type: 'check', key: 'tentative', label: '예정(미확정)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'speakers', title: '연사·초록', icon: '④', fields: [
      {
        type: 'list', key: 'speakers', label: '연사', addLabel: '연사 추가',
        summary: (s) => [tl(s.name), tl(s.affiliation)].filter(Boolean).join(' · ') || '새 연사',
        newItem: () => ({ id: '', name: { ko: '', en: '' }, affiliation: { ko: '', en: '' }, title: { ko: '', en: '' }, abstract: { ko: '', en: '' }, slides: '', url: '', email: '' }),
        item: [
          { type: 'text', key: 'id', label: '연사 id', required: true, placeholder: 'gildong-hong', help: '영문 소문자·숫자·하이픈. 프로그램 표에서 이 연사를 연결할 때 씁니다.' },
          { type: 'bi', key: 'name', label: '이름', help: '영문 이름은 본인 홈페이지 등에서 확인한 표기만 적으세요.' },
          { type: 'bi', key: 'affiliation', label: '소속' },
          { type: 'bi', key: 'group', label: '구분 (포스터 연사형)', placeholder: '기조강연 / Plenary Lecture' },
          { type: 'bi', key: 'title', label: '강연 제목', help: '수식은 $...$ 로 씁니다.' },
          { type: 'bitext', key: 'abstract', label: '초록', help: '요약하지 말고 원문 그대로. 수식은 $...$, $$...$$' },
          { type: 'text', key: 'url', label: '홈페이지', placeholder: 'https://' },
          { type: 'text', key: 'email', label: '이메일', help: '공개 홈페이지에서는 자동으로 수집 방지 처리됩니다.' },
          { type: 'asset', key: 'photo', label: '사진 (포스터 강연형)', accept: 'image/*', dir: 'speakers', nameFrom: 'id', help: '본인 동의를 받은 사진만. 세로 4:5 권장.' },
          { type: 'slides', key: 'slides', label: '발표자료' },
        ],
      },
    ],
  },
  {
    id: 'people', title: '위원회·문의', icon: '⑤', fields: [
      {
        type: 'list', key: 'committees', label: '위원회', addLabel: '위원회 추가',
        summary: (c) => tl(c.name) || '새 위원회',
        newItem: () => ({ name: { ko: '', en: '' }, members: [] }),
        item: [
          { type: 'bi', key: 'name', label: '위원회 이름', placeholder: '조직위원회 / Organizing Committee' },
          {
            type: 'list', key: 'members', label: '위원', addLabel: '위원 추가',
            summary: (m) => [tl(m.name), tl(m.affiliation)].filter(Boolean).join(' · ') || '새 위원',
            newItem: () => ({ name: { ko: '', en: '' }, affiliation: { ko: '', en: '' }, url: '', email: '' }),
            item: [
              { type: 'bi', key: 'name', label: '이름' },
              { type: 'bi', key: 'affiliation', label: '소속' },
              { type: 'bi', key: 'role', label: '역할 (선택)', placeholder: '위원장' },
              { type: 'text', key: 'url', label: '홈페이지' },
              { type: 'text', key: 'email', label: '이메일', help: '공개 페이지에서 확인된 것만. 자동으로 수집 방지 처리됩니다.' },
            ],
          },
        ],
      },
      {
        type: 'list', key: 'contact', label: '문의처', addLabel: '문의처 추가',
        summary: (c) => [tl(c.name), tl(c.role)].filter(Boolean).join(' · ') || '새 문의처',
        newItem: () => ({ name: { ko: '', en: '' }, role: { ko: '', en: '' }, email: '', phone: '' }),
        item: [
          { type: 'bi', key: 'name', label: '이름·부서' },
          { type: 'bi', key: 'role', label: '역할', placeholder: '행사 문의' },
          { type: 'text', key: 'email', label: '이메일' },
          { type: 'text', key: 'phone', label: '전화' },
        ],
      },
    ],
  },
  {
    id: 'registration', title: '등록', icon: '⑥', custom: 'registration', fields: [
      {
        type: 'group', key: 'registration', label: '사전등록', fields: [
          { type: 'select', key: 'status', label: '접수 상태', options: [['auto', '자동 (마감일·행사일로 판단)'], ['open', '접수 중'], ['soon', '준비 중'], ['closed', '마감']] },
          { type: 'date', key: 'deadline', label: '마감일', help: '지나면 자동으로 "마감"이 표시됩니다.' },
          { type: 'bi', key: 'deadline_display', label: '마감 표시 문구 (선택)', placeholder: '1월 31일(일) 자정' },
          { type: 'bi', key: 'fee', label: '등록비', placeholder: '무료 / Free' },
          { type: 'bitext', key: 'note', label: '안내 문구' },
          { type: 'text', key: 'form_url', label: '외부 신청서 링크 (구글폼 등, 선택)', placeholder: 'https://forms.gle/...' },
          { type: 'check', key: 'embed', label: '외부 신청서를 페이지 안에 넣어 보여 주기' },
          { type: 'text', key: 'endpoint', label: '홈페이지 안 등록 양식 접수 주소', placeholder: 'https://script.google.com/macros/s/…/exec', help: '아래 "구글 시트 연결"을 마치면 받는 주소. 넣으면 홈페이지에 등록 양식이 나타납니다.' },
          {
            type: 'list', key: 'attendance_options', label: '참석 구분 (등록 양식 선택지)', addLabel: '선택지 추가',
            summary: (o) => tl(o.label) || o.id || '새 선택지',
            newItem: () => ({ id: '', label: { ko: '', en: '' }, days: [] }),
            item: [
              { type: 'text', key: 'id', label: 'id', placeholder: 'all3', help: '영문 소문자·숫자·하이픈' },
              { type: 'bi', key: 'label', label: '보이는 문구', placeholder: '3일 모두 참석 / All 3 days' },
              { type: 'bi', key: 'note', label: '보충 설명 (선택)' },
              { type: 'days', key: 'days', label: '참석하는 날' },
            ],
          },
          { type: 'bitext', key: 'privacy_notice', label: '개인정보 수집·이용 안내문', help: '홈페이지 안 등록 양식을 쓰면 필수. 보유 기간 등은 기관(개인정보 담당 부서)과 확인 후 확정하세요.' },
        ],
      },
      { type: 'bi', key: 'participants_note', label: '참가자 명단 위 안내 문구', placeholder: '명단 게시에 동의하신 분만 표시됩니다.' },
    ],
  },
  {
    id: 'design', title: '디자인', icon: '⑦', fields: [
      { type: 'theme', key: 'theme', label: '배색 (단과대학 테마)' },
      {
        type: 'group', key: 'hero', label: '대표 사진 (첫 화면 배경)', fields: [
          { type: 'asset', key: 'image', label: '사진', accept: 'image/*', fixedName: 'hero' },
          { type: 'bi', key: 'credit', label: '사진 출처' },
        ],
      },
      {
        type: 'group', key: 'logo', label: '기관 로고 (상단 왼쪽)', fields: [
          { type: 'asset', key: 'src', label: '로고 파일', accept: 'image/*', fixedName: 'logo', help: '사용 권한이 있는 파일만 올리세요.' },
          { type: 'bi', key: 'alt', label: '로고 설명 (화면 낭독용)' },
          { type: 'check', key: 'hide_text', label: '로고만 보이고 글자는 숨기기' },
        ],
      },
      { type: 'select', key: 'email_protection', label: '이메일 보호', options: [['captcha', '확인 숫자 입력 후 보이기 (권장)'], ['none', '그냥 보이기 (권장하지 않음)']] },
    ],
  },
  {
    id: 'more', title: '기타 항목', icon: '⑧', fields: [
      {
        type: 'list', key: 'notices', label: '공지', addLabel: '공지 추가',
        summary: (n) => [n.date, tl(n.text).slice(0, 30)].filter(Boolean).join(' · ') || '새 공지',
        newItem: () => ({ date: '', text: { ko: '', en: '' } }),
        item: [{ type: 'date', key: 'date', label: '날짜' }, { type: 'bitext', key: 'text', label: '내용' }],
      },
      {
        type: 'list', key: 'downloads', label: '자료 내려받기', addLabel: '자료 추가',
        summary: (x) => tl(x.label) || x.url || '새 자료',
        newItem: () => ({ label: { ko: '', en: '' }, url: '' }),
        item: [{ type: 'bi', key: 'label', label: '이름', placeholder: '포스터 (PDF)' }, { type: 'asset', key: 'url', label: '파일 또는 링크', accept: '*/*', dir: '' }],
      },
      {
        type: 'list', key: 'gallery', label: '사진', addLabel: '사진 추가',
        summary: (x) => tl(x.caption) || x.src || '새 사진',
        newItem: () => ({ src: '', caption: { ko: '', en: '' } }),
        item: [{ type: 'asset', key: 'src', label: '사진', accept: 'image/*', dir: 'gallery' }, { type: 'bi', key: 'caption', label: '설명' }],
      },
      {
        type: 'list', key: 'sponsors', label: '후원 기관', addLabel: '후원 기관 추가',
        summary: (x) => tl(x.name) || '새 기관',
        newItem: () => ({ name: { ko: '', en: '' }, logo: '', url: '' }),
        item: [{ type: 'bi', key: 'name', label: '기관명' }, { type: 'asset', key: 'logo', label: '로고 (사용 권한이 있는 파일만)', accept: 'image/*', dir: 'sponsors' }, { type: 'text', key: 'url', label: '홈페이지' }],
      },
      { type: 'bitext', key: 'accommodation', label: '숙박 안내' },
      { type: 'bi', key: 'footer', label: '맨 아래 문구', help: '비우면 행사명' },
      { type: 'text', key: 'footer_url', label: '맨 아래 링크', placeholder: '학과 홈페이지 주소' },
    ],
  },
  {
    id: 'poster', title: '포스터', icon: '⑨', custom: 'poster', fields: [
      {
        type: 'group', key: 'poster', label: '포스터 설정 (conference.json 에 저장)', fields: [
          { type: 'select', key: 'layout', label: '기본 배치', options: [['auto', '자동'], ['program', '일정표형'], ['speakers', '연사형'], ['lecture', '강연형'], ['photo', '사진형']] },
          { type: 'select', key: 'size', label: '기본 크기', options: [['A2', 'A2 (420×594mm)'], ['A1', 'A1 (594×841mm)'], ['A3', 'A3 (297×420mm)'], ['A4', 'A4 (210×297mm)']] },
          { type: 'select', key: 'lang', label: '언어', options: [['both', '한국어 + 영어'], ['ko', '한국어'], ['en', 'English']] },
          { type: 'bi', key: 'headline', label: '포스터 제목 (선택)', multiline: true, help: '행사명과 다르게 쓰거나 줄을 직접 나눌 때. 짝수 줄은 강조색.' },
          { type: 'bi', key: 'kicker', label: '제목 위 문구 (선택)' },
          { type: 'bi', key: 'note', label: '강조 안내 한 줄', placeholder: '누구나 참석 가능 · 사전등록 권장' },
          { type: 'bilist', key: 'highlights', label: '사진형: 주요 행사 목록' },
          { type: 'asset', key: 'image', label: '사진형 대표 사진 (없으면 첫 화면 사진)', accept: 'image/*', fixedName: 'poster-photo' },
          { type: 'speakerRef', key: 'speaker_id', label: '강연형에 쓸 연사' },
          { type: 'check', key: 'qr', label: '홈페이지 QR 코드 넣기' },
          { type: 'check', key: 'show_contact', label: '문의처 표시' },
          { type: 'check', key: 'show_talk_titles', label: '연사형에 강연 제목 표시' },
          { type: 'text', key: 'url', label: 'QR 주소를 따로 쓸 때 (선택)', help: '비우면 "공개된 홈페이지 주소"' },
        ],
      },
    ],
  },
  { id: 'export', title: '검사·내려받기', icon: '⑩', custom: 'export' },
  { id: 'deploy', title: 'GitHub에 올리기', icon: '⑪', custom: 'deploy' },
  { id: 'json', title: 'JSON 직접 편집', icon: '{ }', custom: 'json' },
];
