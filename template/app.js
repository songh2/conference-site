/* ------------------------------------------------------------------
   Conference site template — renderer
   Reads conference.json (fetched when hosted, otherwise the copy
   embedded in index.html) and renders every section in the selected
   language. All text content comes from the JSON: {ko, en} pairs.
------------------------------------------------------------------- */
(function () {
  'use strict';

  // Theme presets (themes/*.json) are inserted here by build.py so that changing
  // `theme` in conference.json on GitHub takes effect without rebuilding.
  var THEMES = /*__THEMES__*/{};
  var THEME_VAR_NAME = /^--[a-z0-9-]{1,40}$/;
  var THEME_VAR_VALUE = /^[#A-Za-z0-9 ,.()%'"\-]{1,200}$/;

  var appliedThemeVars = [];
  function applyTheme(theme) {
    var root = document.documentElement.style;
    appliedThemeVars.forEach(function (k) { root.removeProperty(k); });
    appliedThemeVars = [];
    var vars = {};
    var presetId = null, overrides = {};
    if (typeof theme === 'string') presetId = theme;
    else if (theme && typeof theme === 'object') { presetId = theme.preset || null; overrides = theme; }
    if (presetId && THEMES[presetId]) Object.keys(THEMES[presetId]).forEach(function (k) { vars[k] = THEMES[presetId][k]; });
    Object.keys(overrides).forEach(function (k) {
      var v = overrides[k];
      if (k === 'preset' || typeof v !== 'string') return;
      if (!THEME_VAR_NAME.test(k) || !THEME_VAR_VALUE.test(v) || /url\(/i.test(v)) return;
      vars[k] = v;
    });
    Object.keys(vars).forEach(function (k) { root.setProperty(k, vars[k]); appliedThemeVars.push(k); });
  }
  // 미리보기: 주소 끝에 ?theme=snu-science 처럼 붙이면 그 프리셋으로 보인다(저장되지 않음).
  // 테마 갤러리는 window.confSiteSetTheme('snu-science') 로 바꾼다. 알려진 프리셋 id 만 받는다.
  function previewTheme() {
    try { var q = new URLSearchParams(location.search).get('theme'); return (q && (q === 'default' || THEMES[q])) ? q : null; } catch (e) { return null; }
  }
  window.confSiteSetTheme = function (id) {
    if (id === 'default' || THEMES[id]) { applyTheme(id === 'default' ? {} : id); return true; }
    return false;
  };

  var UI = {
    ko: {
      menu: '메뉴',
      nav_home: '홈', nav_about: '소개', nav_notices: '공지', nav_program: '프로그램', nav_speakers: '강연',
      nav_registration: '등록', nav_venue: '오시는 길', nav_committee: '조직위원회',
      nav_downloads: '자료', nav_gallery: '사진', nav_sponsors: '후원', nav_contact: '문의',
      hero_register: '사전등록', hero_program: '프로그램 보기',
      dates: '일시', venue: '장소', host: '주최·주관', room: '강의실',
      tentative: '예정', ended: '본 행사는 종료되었습니다',
      time: '시간', session: '내용',
      reg_title: '사전등록', reg_open: '사전등록 바로가기', reg_closed: '사전등록이 마감되었습니다.',
      reg_soon: '사전등록 폼은 준비 중입니다. 곧 이 자리에 링크가 게시됩니다.',
      reg_ended: '행사가 종료되어 등록을 받지 않습니다.',
      reg_deadline: '등록 마감', reg_fee: '등록비', tba: '추후 공지',
      map: '지도에서 보기', address: '주소', directions: '찾아오시는 길', accommodation: '숙박 안내',
      map_embed: '행사장 위치 지도',
      reg_form_title: '참석 등록', reg_required_note: '* 표시는 필수 항목입니다.',
      reg_name: '성명', reg_name_ph: '예) 홍길동',
      reg_aff: '소속 기관', reg_aff_ph: '예) 서울대학교 수리과학부',
      reg_email: '이메일', reg_email_ph: '본인 이메일 주소',
      reg_email_help: '행사 안내 등 연락을 드리기 위해 사용하며, 홈페이지에는 공개되지 않습니다.',
      reg_attend: '참석 구분', reg_attend_help: '참석하시는 일정을 하나 선택해 주세요.',
      reg_consent_public: '참가자 명단에 성명과 소속을 게시하는 것에 동의합니다. (선택)',
      reg_consent_privacy: '개인정보 수집·이용에 동의합니다. (필수)',
      reg_privacy_view: '개인정보 수집·이용 안내 보기',
      reg_submit: '등록하기', reg_sending: '전송 중…',
      reg_err_name: '성명을 입력해 주세요.', reg_err_affiliation: '소속 기관을 입력해 주세요.',
      reg_err_email: '올바른 이메일 주소를 입력해 주세요.', reg_err_option: '참석 구분을 선택해 주세요.',
      reg_err_privacy: '개인정보 수집·이용에 동의하셔야 등록할 수 있습니다.',
      reg_err_check: '입력 내용을 확인해 주세요.',
      reg_err_network: '서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요. 접수되었는지 확실하지 않으면 한 번 더 제출하셔도 됩니다(같은 이메일·같은 참석 구분은 한 번만 기록됩니다).',
      reg_err_send: '등록을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      reg_err_closed: '사전등록이 마감되어 접수할 수 없습니다.',
      reg_err_fast: '너무 빨리 제출되었습니다. 잠시 후 다시 눌러 주세요.',
      reg_err_busy: '접수가 몰려 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      reg_err_full: '접수 가능 인원을 초과하여 더 이상 접수할 수 없습니다. 문의처로 연락해 주세요.',
      reg_done_title: '등록이 접수되었습니다.',
      reg_done_dup: '같은 이메일과 참석 구분으로 이미 접수되어 있어 추가로 기록하지 않았습니다.',
      reg_done_again: '같은 이메일로 이전에 접수된 내용이 있어 이번 내용이 추가로 기록되었습니다. 변경·취소는 문의처로 알려 주세요.',
      reg_done_note: '접수 확인 메일은 자동으로 발송되지 않습니다. 내용 변경이나 취소가 필요하면 문의처로 연락해 주세요.',
      reg_receipt: '접수 내용', reg_list_yes: '명단 게시에 동의', reg_list_no: '명단에 게시하지 않음',
      reg_another: '다른 분 등록하기',
      reg_fallback: '등록 양식이 작동하지 않으면', reg_fallback_link: '구글 폼으로 등록하기',
      nav_participants: '참가자', participants_title: '참가자 명단', participants_count: '{n}명',
      participants_none: '등록된 참가자 명단은 추후 게시됩니다.',
      speakers_title: '강연 및 초록', abstract: '초록 보기', slides: '발표자료', website: '홈페이지',
      talk_tba: '강연 제목 추후 공지', speaker: '발표자', email_to: '이메일 보내기',
      contact_tba: '문의처는 추후 공지됩니다.', email: '이메일', phone: '전화',
      email_check: '이메일 확인', email_modal_title: '이메일 주소 확인',
      email_instruction: '이미지에 표시된 확인 코드를 입력해 주세요.',
      email_code_alt: '확인 코드 이미지', email_refresh: '다른 코드로 바꾸기', email_audio: '코드 음성으로 듣기',
      email_audio_unsupported: '이 브라우저에서는 음성 재생을 지원하지 않습니다.',
      email_confirm: '확인', email_wrong: '코드가 일치하지 않습니다. 새 코드로 다시 입력해 주세요.',
      email_policy: '개인정보 보호를 위해 이 홈페이지는 이메일 주소의 자동 수집을 막고 있습니다. 확인 코드를 입력하면 주소가 표시됩니다.',
      email_revealed: '이메일 주소', email_send: '메일 보내기', email_copy: '주소 복사', email_copied: '복사되었습니다.', email_close: '닫기',
      email_hint: '메일 앱이 열리지 않으면 [주소 복사]를 누르거나 주소를 직접 선택해 복사하세요.',
      email_copy_blocked: '이 환경에서는 자동 복사가 막혀 있어 주소를 선택해 두었습니다. Ctrl+C(모바일은 길게 누르기)로 복사하세요.',
      updated: '최종 수정', top: '맨 위로'
    },
    en: {
      menu: 'Menu',
      nav_home: 'Home', nav_about: 'About', nav_notices: 'Notices', nav_program: 'Program', nav_speakers: 'Talks',
      nav_registration: 'Registration', nav_venue: 'Venue', nav_committee: 'Committees',
      nav_downloads: 'Downloads', nav_gallery: 'Photos', nav_sponsors: 'Sponsors', nav_contact: 'Contact',
      hero_register: 'Register', hero_program: 'View program',
      dates: 'Dates', venue: 'Venue', host: 'Organized by', room: 'Room',
      tentative: 'Tentative', ended: 'This event has concluded',
      time: 'Time', session: 'Session',
      reg_title: 'Registration', reg_open: 'Go to registration form', reg_closed: 'Registration is closed.',
      reg_soon: 'The registration form is being prepared and will be linked here soon.',
      reg_ended: 'Registration is closed as the event has concluded.',
      reg_deadline: 'Deadline', reg_fee: 'Fee', tba: 'To be announced',
      map: 'Open in maps', address: 'Address', directions: 'Getting there', accommodation: 'Accommodation',
      map_embed: 'Venue map',
      reg_form_title: 'Register to attend', reg_required_note: 'Fields marked * are required.',
      reg_name: 'Full name', reg_name_ph: 'e.g. Gildong Hong',
      reg_aff: 'Affiliation', reg_aff_ph: 'e.g. Seoul National University',
      reg_email: 'Email', reg_email_ph: 'Your e-mail address',
      reg_email_help: 'Used only to contact you about the event. It is not shown on this website.',
      reg_attend: 'Days attending', reg_attend_help: 'Please choose one option.',
      reg_consent_public: 'I agree to have my name and affiliation listed on the participant list. (optional)',
      reg_consent_privacy: 'I agree to the collection and use of my personal information. (required)',
      reg_privacy_view: 'View the privacy notice',
      reg_submit: 'Register', reg_sending: 'Sending…',
      reg_err_name: 'Please enter your name.', reg_err_affiliation: 'Please enter your affiliation.',
      reg_err_email: 'Please enter a valid e-mail address.', reg_err_option: 'Please choose the days you will attend.',
      reg_err_privacy: 'You must agree to the collection and use of personal information to register.',
      reg_err_check: 'Please check your entries.',
      reg_err_network: 'Could not reach the server. Please check your connection and try again. If you are not sure whether it was received, you may submit again (the same e-mail and option are recorded only once).',
      reg_err_send: 'Your registration could not be recorded. Please try again later.',
      reg_err_closed: 'Registration is closed.',
      reg_err_fast: 'Submitted too quickly. Please wait a moment and press the button again.',
      reg_err_busy: 'The server is busy. Please try again in a moment.',
      reg_err_full: 'The maximum number of registrations has been reached. Please contact the organizers.',
      reg_done_title: 'Your registration has been received.',
      reg_done_dup: 'This e-mail was already registered with the same option, so nothing new was recorded.',
      reg_done_again: 'An earlier registration with this e-mail exists, so this one was recorded in addition. Please tell the organizers if you need to change or cancel.',
      reg_done_note: 'A confirmation e-mail is not sent automatically. To change or cancel your registration, please contact the organizers.',
      reg_receipt: 'Your entries', reg_list_yes: 'Agreed to be listed', reg_list_no: 'Not listed',
      reg_another: 'Register another person',
      reg_fallback: 'If the form does not work,', reg_fallback_link: 'register with the Google Form',
      nav_participants: 'Participants', participants_title: 'List of Participants', participants_count: '{n} registered',
      participants_none: 'The list of registered participants will be posted later.',
      speakers_title: 'Talks and Abstracts', abstract: 'Abstract', slides: 'Slides', website: 'Website',
      talk_tba: 'Title to be announced', speaker: 'Speaker', email_to: 'Send email',
      contact_tba: 'Contact information will be announced.', email: 'Email', phone: 'Phone',
      email_check: 'Show e-mail', email_modal_title: 'Confirm e-mail address',
      email_instruction: 'Please enter the verification code shown in the image.',
      email_code_alt: 'Verification code image', email_refresh: 'Get a new code', email_audio: 'Listen to the code',
      email_audio_unsupported: 'Audio playback is not supported in this browser.',
      email_confirm: 'Confirm', email_wrong: 'The code does not match. A new code has been generated, please try again.',
      email_policy: 'To protect personal information, this website prevents automatic harvesting of e-mail addresses. Enter the verification code to reveal the address.',
      email_revealed: 'E-mail address', email_send: 'Send e-mail', email_copy: 'Copy address', email_copied: 'Copied.', email_close: 'Close',
      email_hint: 'If no mail app opens, use [Copy address] or select the address to copy it.',
      email_copy_blocked: 'Automatic copying is blocked here, so the address has been selected for you. Press Ctrl+C (long-press on mobile) to copy.',
      updated: 'Last updated', top: 'Back to top'
    }
  };

  var state = { data: null, lang: 'ko' };

  /* ---------- helpers ---------- */
  function t(key) { return (UI[state.lang] && UI[state.lang][key]) || UI.ko[key] || key; }

  // Pick the text for the current language; fall back to the other one so
  // nothing silently disappears when a translation is still missing.
  function tx(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    var v = obj[state.lang];
    if (v == null || v === '') v = obj.ko != null && obj.ko !== '' ? obj.ko : (obj.en || '');
    return v || '';
  }
  function has(obj) { return tx(obj).trim() !== ''; }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v; // only used with trusted SVG icons below
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  // Paragraph text: blank lines separate paragraphs. No HTML is interpreted.
  function paragraphs(text, cls) {
    var box = h('div', { class: cls || 'prose' });
    String(text || '').split(/\n\s*\n/).forEach(function (p) {
      p = p.trim();
      if (p) box.appendChild(h('p', { text: p }));
    });
    return box;
  }

  function parseISO(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  function fmtDate(iso, opts) {
    var d = parseISO(iso);
    if (!d) return iso || '';
    var locale = state.lang === 'ko' ? 'ko-KR' : 'en-US';
    try { return new Intl.DateTimeFormat(locale, opts || { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(d); }
    catch (e) { return iso; }
  }

  function dateRange(dates) {
    if (!dates) return '';
    if (has(dates.display)) return tx(dates.display);
    if (!dates.start) return '';
    if (!dates.end || dates.end === dates.start) return fmtDate(dates.start);
    return fmtDate(dates.start) + ' – ' + fmtDate(dates.end);
  }

  var ICONS = {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/></svg>'
  };
  function icon(name) { return h('span', { class: 'icon', 'aria-hidden': 'true', html: ICONS[name] }); }

  // Small icon links used next to people: homepage and e-mail.
  function personLinks(p) {
    var box = h('span', { class: 'person-links' });
    if (p.url) box.appendChild(h('a', { class: 'icon-link', href: p.url, target: '_blank', rel: 'noopener', title: t('website'), 'aria-label': t('website') }, [icon('home')]));
    var em = emailRef(p);
    if (em) box.appendChild(emailControl(em, 'icon'));
    return box.childNodes.length ? box : null;
  }

  /* ---------- e-mail protection ----------
     Addresses never appear as text or mailto links in the page source. build.py
     stores them obfuscated (email_enc, keyed by the site slug); the address is
     decoded only after the visitor types the verification code shown in an
     image (the same idea as the KIAS "Confirm e-mail address" popup). This
     stops address-harvesting crawlers that scan page text; it is not
     cryptographic protection against someone who reads this script. */
  function emailRef(p) {
    if (!p) return null;
    if (p.email_enc) return { enc: p.email_enc };
    if (p.email) return { plain: p.email };   // unencoded fallback (warned by build.py)
    return null;
  }
  function decodeEmail(ref) {
    if (ref.plain) return ref.plain;
    try {
      var key = String(state.data.slug || 'site');
      var raw = atob(String(ref.enc).replace(/^v1:/, ''));
      var out = '';
      for (var i = 0; i < raw.length; i++) out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      return out.split('').reverse().join('');
    } catch (e) { return ''; }
  }
  function protectionOn() { return (state.data.email_protection || 'captcha') !== 'none'; }

  // Returns either an icon button / text button that opens the verification
  // dialog, or (protection off) a plain mailto link.
  function emailControl(ref, style) {
    if (!protectionOn()) {
      var addr = decodeEmail(ref);
      return style === 'icon'
        ? h('a', { class: 'icon-link', href: 'mailto:' + addr, title: t('email_to'), 'aria-label': t('email_to') }, [icon('mail')])
        : h('a', { href: 'mailto:' + addr, text: addr });
    }
    var btn = style === 'icon'
      ? h('button', { type: 'button', class: 'icon-link', title: t('email_check'), 'aria-label': t('email_check') }, [icon('mail')])
      : h('button', { type: 'button', class: 'btn btn-outline btn-sm' }, [icon('mail'), document.createTextNode(t('email_check'))]);
    btn.addEventListener('click', function () { openEmailModal(ref, btn); });
    return btn;
  }

  var modal = null, modalCode = '', modalRef = null, modalOpener = null;
  function randomCode() { var c = ''; for (var i = 0; i < 5; i++) c += Math.floor(Math.random() * 10); return c; }

  function drawCode(canvas, code) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = canvas.width, H = canvas.height;
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#6f6f6f'); g.addColorStop(0.55, '#c9c9c9'); g.addColorStop(1, '#efefef');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var n = 0; n < 60; n++) { ctx.fillStyle = 'rgba(0,0,0,' + (0.15 + Math.random() * 0.25) + ')'; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    var step = W / (code.length + 1);
    for (var i = 0; i < code.length; i++) {
      ctx.save();
      ctx.translate(step * (i + 1), H / 2 + (Math.random() * 10 - 5));
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.font = 'italic bold ' + (H * 0.68) + 'px "Arial Black", Arial, sans-serif';
      ctx.fillStyle = '#1818e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    for (var k = 0; k < 2; k++) {
      ctx.beginPath(); ctx.moveTo(Math.random() * W * 0.2, Math.random() * H);
      ctx.bezierCurveTo(W * 0.3, Math.random() * H, W * 0.7, Math.random() * H, W - Math.random() * W * 0.2, Math.random() * H);
      ctx.stroke();
    }
  }

  function selectText(el) {
    try {
      var r = document.createRange(); r.selectNodeContents(el);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    } catch (e) { /* ignore */ }
  }

  // Copy with three fallbacks: the synchronous execCommand path first (it runs
  // inside the click gesture and works in most embedded/sandboxed views), then
  // the async Clipboard API, and finally selecting the text for manual copy.
  function copyText(text, onOk, onFail) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      ok = !!(document.execCommand && document.execCommand('copy'));
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
    if (ok) { onOk(); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk, onFail);
    } else {
      onFail();
    }
  }

  function buildModal() {
    var overlay = h('div', { class: 'modal-overlay', id: 'email-modal', hidden: true });
    var dlg = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'email-modal-title' });
    dlg.appendChild(h('button', { type: 'button', class: 'modal-close', 'aria-label': t('email_close'), text: '×' }));
    dlg.appendChild(h('h2', { id: 'email-modal-title', class: 'modal-title' }));
    var body = h('div', { class: 'modal-body' });
    body.appendChild(h('p', { class: 'modal-instruction' }));
    var row = h('div', { class: 'captcha-row' });
    row.appendChild(h('canvas', { class: 'captcha', width: '240', height: '72', role: 'img' }));
    row.appendChild(h('button', { type: 'button', class: 'captcha-btn captcha-refresh', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2"/><path d="M21 3v6h-6M3 21v-6h6"/></svg>' }));
    row.appendChild(h('button', { type: 'button', class: 'captcha-btn captcha-audio', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>' }));
    body.appendChild(row);
    // Not a <form>: embedded previews (sandboxed iframes) silently block form
    // submission, so the Confirm button and the Enter key call verify() directly.
    var form = h('div', { class: 'captcha-form' });
    form.appendChild(h('input', { type: 'text', class: 'captcha-input', inputmode: 'numeric', autocomplete: 'off', maxlength: '5', 'aria-label': t('email_instruction') }));
    form.appendChild(h('button', { type: 'button', class: 'btn btn-dark captcha-confirm' }));
    body.appendChild(form);
    body.appendChild(h('p', { class: 'captcha-msg', role: 'alert' }));
    body.appendChild(h('p', { class: 'modal-policy' }));
    var result = h('div', { class: 'email-result', hidden: true });
    result.appendChild(h('div', { class: 'label' }));
    result.appendChild(h('div', { class: 'email-text' }));
    result.appendChild(h('div', { class: 'email-actions' }));
    result.appendChild(h('p', { class: 'email-hint' }));
    body.appendChild(result);
    dlg.appendChild(body);
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    function regenerate() {
      modalCode = randomCode();
      drawCode(overlay.querySelector('.captcha'), modalCode);
      overlay.querySelector('.captcha-input').value = '';
    }
    overlay.querySelector('.captcha-refresh').addEventListener('click', function () { regenerate(); overlay.querySelector('.captcha-msg').textContent = ''; overlay.querySelector('.captcha-input').focus(); });
    overlay.querySelector('.captcha-audio').addEventListener('click', function () {
      var msg = overlay.querySelector('.captcha-msg');
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { msg.textContent = t('email_audio_unsupported'); return; }
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(modalCode.split('').join(', '));
        u.lang = state.lang === 'ko' ? 'ko-KR' : 'en-US'; u.rate = 0.75;
        window.speechSynthesis.speak(u);
      } catch (e) { msg.textContent = t('email_audio_unsupported'); }
    });
    function verify() {
      var input = overlay.querySelector('.captcha-input');
      var msg = overlay.querySelector('.captcha-msg');
      if (input.value.trim() === modalCode) {
        var addr = decodeEmail(modalRef);
        overlay.querySelector('.captcha-row').hidden = true; form.hidden = true; msg.textContent = '';
        overlay.querySelector('.modal-instruction').hidden = true;
        result.hidden = false;
        result.querySelector('.label').textContent = t('email_revealed');
        result.querySelector('.email-text').textContent = addr;
        var actions = result.querySelector('.email-actions');
        actions.innerHTML = '';
        var textEl = result.querySelector('.email-text');
        textEl.addEventListener('click', function () { selectText(textEl); });
        actions.appendChild(h('a', { class: 'btn btn-dark btn-sm', href: 'mailto:' + addr, text: t('email_send') }));
        var copy = h('button', { type: 'button', class: 'btn btn-outline btn-sm', text: t('email_copy') });
        var hint = result.querySelector('.email-hint');
        hint.textContent = t('email_hint');
        copy.addEventListener('click', function () {
          copyText(addr, function () { copy.textContent = t('email_copied'); hint.textContent = t('email_hint'); },
                         function () { selectText(textEl); hint.textContent = t('email_copy_blocked'); });
        });
        actions.appendChild(copy);
        actions.querySelector('a').focus();
      } else {
        msg.textContent = t('email_wrong');
        regenerate();
        input.focus();
      }
    }
    overlay.querySelector('.captcha-confirm').addEventListener('click', verify);
    overlay.querySelector('.captcha-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); verify(); }
    });
    overlay.querySelector('.modal-close').addEventListener('click', closeEmailModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeEmailModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) closeEmailModal(); });
    overlay._regenerate = regenerate;
    return overlay;
  }

  function openEmailModal(ref, opener) {
    if (!modal) modal = buildModal();
    modalRef = ref; modalOpener = opener || null;
    // Fresh state every time the dialog opens.
    modal.querySelector('.modal-title').textContent = t('email_modal_title');
    modal.querySelector('.modal-instruction').textContent = t('email_instruction');
    modal.querySelector('.modal-instruction').hidden = false;
    modal.querySelector('.captcha').setAttribute('aria-label', t('email_code_alt'));
    modal.querySelector('.captcha-refresh').setAttribute('title', t('email_refresh'));
    modal.querySelector('.captcha-refresh').setAttribute('aria-label', t('email_refresh'));
    modal.querySelector('.captcha-audio').setAttribute('title', t('email_audio'));
    modal.querySelector('.captcha-audio').setAttribute('aria-label', t('email_audio'));
    modal.querySelector('.captcha-input').setAttribute('aria-label', t('email_instruction'));
    modal.querySelector('.captcha-confirm').textContent = t('email_confirm');
    modal.querySelector('.modal-close').setAttribute('aria-label', t('email_close'));
    modal.querySelector('.modal-policy').textContent = t('email_policy');
    modal.querySelector('.captcha-msg').textContent = '';
    modal.querySelector('.captcha-row').hidden = false;
    modal.querySelector('.captcha-form').hidden = false;
    modal.querySelector('.email-result').hidden = true;
    modal._regenerate();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.captcha-input').focus();
  }
  function closeEmailModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    if (modalOpener && modalOpener.focus) modalOpener.focus();
  }

  function speakerIndex(d) {
    var map = {};
    (d.speakers || []).forEach(function (s) { if (s.id) map[s.id] = s; });
    return map;
  }

  // Math support: abstracts written with $...$ or \(...\) are rendered with KaTeX,
  // loaded only when the page actually contains such text (saves ~100 KB otherwise).
  var MATH_RE = /\$[^$\n]+\$|\\\(|\\\[|\$\$/;
  function needsMath(d) {
    var texts = [];
    (d.speakers || []).forEach(function (s) { texts.push(tx(s.title), tx(s.abstract)); });
    texts.push(tx(d.about));
    return MATH_RE.test(texts.join('\n'));
  }
  var katexLoading = null;
  function loadKatex() {
    if (window.renderMathInElement) return Promise.resolve();
    if (katexLoading) return katexLoading;
    var base = 'https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/';
    katexLoading = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = base + 'katex.min.css'; document.head.appendChild(css);
      var s1 = document.createElement('script'); s1.src = base + 'katex.min.js'; s1.defer = true;
      s1.onload = function () {
        var s2 = document.createElement('script'); s2.src = base + 'contrib/auto-render.min.js'; s2.defer = true;
        s2.onload = resolve; s2.onerror = reject; document.head.appendChild(s2);
      };
      s1.onerror = reject;
      document.head.appendChild(s1);
    });
    return katexLoading;
  }
  function renderMath() {
    if (!needsMath(state.data)) return;
    loadKatex().then(function () {
      var root = document.getElementById('app');
      if (!root || !window.renderMathInElement) return;
      window.renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }).catch(function () { /* math stays as plain text if the CDN is unreachable */ });
  }

  function section(id, titleKey, cls, children) {
    var sec = h('section', { class: 'section' + (cls ? ' ' + cls : ''), id: id });
    var wrap = h('div', { class: 'wrap' });
    wrap.appendChild(h('h2', { text: t(titleKey) }));
    (children || []).forEach(function (c) { if (c) wrap.appendChild(c); });
    sec.appendChild(wrap);
    return sec;
  }

  /* ---------- event status ---------- */
  function eventEnded(d) {
    var end = parseISO(d.dates && (d.dates.end || d.dates.start));
    return !!(end && today() > end);
  }
  function registrationStatus(d) {
    var r = d.registration || {};
    if (r.status === 'open' || r.status === 'closed' || r.status === 'soon') return r.status;
    if (eventEnded(d)) return 'ended';
    var dl = parseISO(r.deadline);
    if (dl && today() > dl) return 'closed';
    return (r.form_url || r.endpoint) ? 'open' : 'soon';
  }

  /* ---------- sections ---------- */
  function renderHero(d) {
    var hero = h('section', { class: 'hero' + (d.hero && d.hero.image ? ' has-image' : ''), id: 'home' });
    if (d.hero && d.hero.image) hero.style.backgroundImage = 'url("' + d.hero.image + '")';
    var inner = h('div', { class: 'hero-inner' });
    if (has(d.kicker)) inner.appendChild(h('div', { class: 'hero-kicker', text: tx(d.kicker) }));
    if (eventEnded(d)) inner.appendChild(h('div', { class: 'ended-badge', text: t('ended') }));
    inner.appendChild(h('h1', { text: tx(d.title) }));
    if (has(d.subtitle)) inner.appendChild(h('p', { class: 'hero-sub', text: tx(d.subtitle) }));

    var meta = h('div', { class: 'hero-meta' });
    var dr = dateRange(d.dates);
    if (dr) meta.appendChild(h('div', null, [icon('calendar'), h('span', { text: dr })]));
    if (d.venue && (has(d.venue.name) || has(d.venue.room))) {
      var vtxt = [tx(d.venue.name), tx(d.venue.room)].filter(Boolean).join(' · ');
      meta.appendChild(h('div', null, [icon('pin'), h('span', { text: vtxt })]));
    }
    inner.appendChild(meta);

    var actions = h('div', { class: 'hero-actions' });
    var rs = registrationStatus(d);
    if (rs === 'open' && d.registration.endpoint) actions.appendChild(h('a', { class: 'btn btn-primary', href: '#registration', text: t('hero_register') }));
    else if (rs === 'open') actions.appendChild(h('a', { class: 'btn btn-primary', href: d.registration.form_url, target: '_blank', rel: 'noopener', text: t('hero_register') }));
    else if (rs === 'soon') actions.appendChild(h('a', { class: 'btn btn-primary', href: '#registration', text: t('hero_register') }));
    if (d.program && d.program.length) actions.appendChild(h('a', { class: 'btn btn-ghost', href: '#program', text: t('hero_program') }));
    if (actions.childNodes.length) inner.appendChild(actions);
    hero.appendChild(inner);
    if (d.hero && has(d.hero.credit)) hero.appendChild(h('div', { class: 'hero-credit', text: tx(d.hero.credit) }));
    return hero;
  }

  function renderOverview(d) {
    var sec = h('section', { class: 'section', id: 'overview' });
    var wrap = h('div', { class: 'wrap' });
    var grid = h('div', { class: 'info-grid' });

    var dr = dateRange(d.dates);
    if (dr) grid.appendChild(h('div', { class: 'card' }, [h('div', { class: 'label', text: t('dates') }), h('div', { class: 'value', text: dr })]));

    if (d.venue && has(d.venue.name)) {
      var card = h('div', { class: 'card' }, [h('div', { class: 'label', text: t('venue') }), h('div', { class: 'value', text: tx(d.venue.name) })]);
      if (has(d.venue.room)) card.appendChild(h('div', { class: 'sub', text: tx(d.venue.room) }));
      if (d.venue.map_url) card.appendChild(h('div', { class: 'sub' }, [h('a', { href: d.venue.map_url, target: '_blank', rel: 'noopener', text: t('map') + ' ↗' })]));
      grid.appendChild(card);
    }
    if (has(d.host)) grid.appendChild(h('div', { class: 'card' }, [h('div', { class: 'label', text: t('host') }), h('div', { class: 'value', text: tx(d.host) })]));

    if (!grid.childNodes.length) return null;
    wrap.appendChild(grid);
    sec.appendChild(wrap);
    return sec;
  }

  function renderNotices(d) {
    var list = (d.notices || []).filter(function (n) { return has(n.text); });
    if (!list.length) return null;
    var ul = h('ul', { class: 'notice-list' });
    list.forEach(function (n) {
      ul.appendChild(h('li', null, [n.date ? h('span', { class: 'notice-date', text: fmtDate(n.date, { year: 'numeric', month: 'short', day: 'numeric' }) }) : null, h('span', { text: tx(n.text) })]));
    });
    return section('notices', 'nav_notices', null, [ul]);
  }

  function renderAbout(d) {
    if (!has(d.about)) return null;
    return section('about', 'nav_about', null, [paragraphs(tx(d.about), 'prose lead')]);
  }

  function renderProgram(d) {
    var days = d.program || [];
    if (!days.length) return null;
    var spkIndex = speakerIndex(d);
    var nodes = [];
    days.forEach(function (day) {
      var box = h('div', { class: 'day' });
      var head = h('div', { class: 'day-head' });
      var label = has(day.label) ? tx(day.label) : fmtDate(day.date);
      head.appendChild(h('h3', { text: label }));
      if (day.tentative) head.appendChild(h('span', { class: 'badge badge-tentative', text: t('tentative') }));
      box.appendChild(head);
      if (has(day.note)) box.appendChild(h('p', { class: 'day-note', text: tx(day.note) }));

      var table = h('table', { class: 'timetable' });
      table.appendChild(h('thead', null, [h('tr', null, [h('th', { text: t('time') }), h('th', { text: t('session') })])]));
      var tbody = h('tbody');
      (day.items || []).forEach(function (it) {
        var soft = ['break', 'meal', 'social', 'registration'].indexOf(it.kind) >= 0;
        var desc = h('td', { class: 'desc' });
        // A timetable row can point at an entry in `speakers` via speaker_id.
        // When that speaker's talk title is known it replaces the generic row title
        // (e.g. "강연"), and the speaker's name links to the abstract below.
        var spk = it.speaker_id ? spkIndex[it.speaker_id] : null;
        var titleText = (spk && has(spk.title)) ? tx(spk.title) : tx(it.title);
        var title = h('div', { class: 'item-title', text: titleText });
        if (it.tentative) title.appendChild(h('span', { class: 'badge badge-tentative', text: t('tentative') }));
        desc.appendChild(title);
        if (spk) {
          var who = h('div', { class: 'item-speaker' });
          who.appendChild(h('a', { href: '#spk-' + spk.id, text: tx(spk.name) }));
          if (has(spk.affiliation)) who.appendChild(document.createTextNode(' (' + tx(spk.affiliation) + ')'));
          if (has(spk.title) && has(it.title) && tx(it.title) !== titleText) who.appendChild(h('span', { class: 'muted', text: ' · ' + tx(it.title) }));
          desc.appendChild(who);
        } else if (has(it.speaker)) {
          desc.appendChild(h('div', { class: 'item-speaker', text: tx(it.speaker) }));
        }
        if (has(it.note)) desc.appendChild(h('div', { class: 'item-note', text: tx(it.note) }));
        tbody.appendChild(h('tr', { class: soft ? 'soft' : null }, [h('td', { class: 'time', text: it.time || '' }), desc]));
      });
      table.appendChild(tbody);
      box.appendChild(table);
      nodes.push(box);
    });
    return section('program', 'nav_program', 'section-alt', nodes);
  }

  function renderSpeakers(d) {
    var list = (d.speakers || []).filter(function (s) { return has(s.name); });
    if (!list.length) return null;
    var grid = h('div', { class: 'speaker-grid' });
    list.forEach(function (s) {
      var card = h('div', { class: 'speaker', id: s.id ? 'spk-' + s.id : null });
      var nameRow = h('div', { class: 'name-row' });
      nameRow.appendChild(h('span', { class: 'name', text: tx(s.name) }));
      var pl = personLinks(s);
      if (pl) nameRow.appendChild(pl);
      card.appendChild(nameRow);
      if (has(s.affiliation)) card.appendChild(h('div', { class: 'aff', text: tx(s.affiliation) }));
      card.appendChild(has(s.title) ? h('div', { class: 'talk', text: tx(s.title) }) : h('div', { class: 'talk tba', text: t('talk_tba') }));
      if (has(s.abstract)) {
        var det = h('details');
        det.appendChild(h('summary', { text: t('abstract') }));
        det.appendChild(paragraphs(tx(s.abstract), 'abstract'));
        card.appendChild(det);
      }
      var links = h('div', { class: 'links' });
      // `slides` may be one URL/path or a list of {label, url} for multi-part talks.
      var slides = Array.isArray(s.slides) ? s.slides : (s.slides ? [{ url: s.slides }] : []);
      slides.forEach(function (sl, i) {
        if (!sl.url) return;
        if (links.childNodes.length) links.appendChild(document.createTextNode(' · '));
        links.appendChild(h('a', { href: sl.url, target: '_blank', rel: 'noopener' }, [icon('file'), document.createTextNode(has(sl.label) ? tx(sl.label) : (t('slides') + (slides.length > 1 ? ' ' + (i + 1) : '')))]));
      });
      if (links.childNodes.length) card.appendChild(links);
      grid.appendChild(card);
    });
    return section('speakers', 'speakers_title', null, [grid]);
  }

  // Participant list: name + affiliation only. The list is either written into
  // conference.json (`participants`, updated from the registration sheet with
  // scripts/import_participants.py) or, optionally, read live from a published
  // Google Sheet CSV (`participants_url`) that contains only those two columns.
  function renderParticipants(d) {
    var list = (d.participants || []).filter(function (p) { return has(p.name); });
    // Shown when there is a list, a live source, or a note (placeholder before registration opens).
    var liveSource = !!(d.participants_url || (d.registration && d.registration.endpoint));
    if (!list.length && !liveSource && !has(d.participants_note)) return null;
    var nodes = [];
    if (has(d.participants_note)) nodes.push(h('p', { class: 'lead', text: tx(d.participants_note) }));
    if (!list.length) {
      nodes.push(h('p', { class: 'tba', text: t('participants_none') }));
    } else {
      nodes.push(h('p', { class: 'participants-count', text: t('participants_count').replace('{n}', String(list.length)) }));
      var ol = h('ol', { class: 'participant-list' });
      list.forEach(function (p) {
        var li = h('li');
        li.appendChild(h('span', { class: 'p-name', text: tx(p.name) }));
        if (has(p.affiliation)) li.appendChild(h('span', { class: 'p-aff', text: tx(p.affiliation) }));
        ol.appendChild(li);
      });
      nodes.push(ol);
    }
    return section('participants', 'participants_title', 'section-alt', nodes);
  }

  // Minimal CSV parser (handles quoted fields with commas/newlines/double quotes).
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
  }

  function findCol(headers, keys) {
    for (var i = 0; i < headers.length; i++) {
      var hname = headers[i].toLowerCase();
      for (var k = 0; k < keys.length; k++) if (hname.indexOf(keys[k]) >= 0) return i;
    }
    return -1;
  }

  // Convert the published sheet into participant records. Only rows whose
  // consent column (if any) says yes are shown.
  function participantsFromCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) return [];
    var head = rows[0];
    var cNameEn = findCol(head, ['영문 성명', '영문 이름', 'english name', 'name (en', 'name in english']);
    var cName = findCol(head.map(function (x, i) { return i === cNameEn ? '' : x; }), ['성명', '이름', 'name']);
    var cAffEn = findCol(head, ['영문 소속', 'affiliation (en', 'affiliation in english']);
    var cAff = findCol(head.map(function (x, i) { return i === cAffEn ? '' : x; }), ['소속', 'affiliation']);
    var cConsent = findCol(head, ['동의', 'consent', 'agree']);
    if (cName < 0 && cNameEn < 0) return [];
    var out = [];
    rows.slice(1).forEach(function (r) {
      var consent = cConsent >= 0 ? (r[cConsent] || '').trim().toLowerCase() : '';
      if (cConsent >= 0 && !(consent.indexOf('예') === 0 || consent.indexOf('yes') === 0 || consent.indexOf('동의') === 0 || consent === 'y')) return;
      var name = { ko: cName >= 0 ? (r[cName] || '').trim() : '', en: cNameEn >= 0 ? (r[cNameEn] || '').trim() : '' };
      if (!name.ko && !name.en) return;
      out.push({ name: name, affiliation: { ko: cAff >= 0 ? (r[cAff] || '').trim() : '', en: cAffEn >= 0 ? (r[cAffEn] || '').trim() : '' } });
    });
    return out;
  }

  // Replace only the participant section (keeps whatever the visitor is typing
  // in the registration form untouched); fall back to a full render when the
  // section appears or disappears.
  function refreshParticipants() {
    var old = document.getElementById('participants');
    var fresh = renderParticipants(state.data);
    if (old && fresh && old.parentNode) { old.parentNode.replaceChild(fresh, old); return; }
    render();
  }

  var liveParticipantsLoaded = false;
  function loadLiveParticipants(force) {
    var d = state.data;
    var reg = d.registration || {};
    // 1) Registration sheet through the Apps Script endpoint: it returns only
    //    name + affiliation of people who agreed to be listed.
    if (reg.endpoint) {
      if (liveParticipantsLoaded && !force) return;
      liveParticipantsLoaded = true;
      transport(reg.endpoint, { action: 'participants' }).then(function (res) {
        if (!res || !res.ok || !Array.isArray(res.participants)) return;
        state.data.participants = res.participants.map(function (p) {
          return { name: { ko: p.name, en: p.name }, affiliation: { ko: p.affiliation || '', en: p.affiliation || '' } };
        });
        refreshParticipants();
      }, function () { /* keep the list embedded in conference.json */ });
      return;
    }
    // 2) Optional: a published Google Sheet CSV.
    if (liveParticipantsLoaded || !d.participants_url || typeof fetch !== 'function') return;
    liveParticipantsLoaded = true;
    fetch(d.participants_url, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.text() : null; })
      .then(function (text) {
        if (!text) return;
        var list = participantsFromCSV(text);
        if (list.length) { state.data.participants = list; render(); }
      })
      .catch(function () { /* keep the list embedded in conference.json */ });
  }

  function renderVenue(d) {
    var v = d.venue;
    if (!v || !(has(v.name) || has(v.address))) return null;
    var grid = h('div', { class: 'venue-grid' });
    var left = h('div', { class: 'card' });
    left.appendChild(h('h3', { text: tx(v.name) }));
    var dl = h('dl', { class: 'kv' });
    if (has(v.room)) { dl.appendChild(h('dt', { text: t('room') })); dl.appendChild(h('dd', { text: tx(v.room) })); }
    if (has(v.address)) { dl.appendChild(h('dt', { text: t('address') })); dl.appendChild(h('dd', { text: tx(v.address) })); }
    left.appendChild(dl);
    if (v.map_url) left.appendChild(h('p', { style: 'margin:14px 0 0' }, [h('a', { class: 'btn btn-outline', href: v.map_url, target: '_blank', rel: 'noopener', text: t('map') + ' ↗' })]));
    if (v.lat && v.lng) {
      var dlat = 0.004, dlng = 0.006;
      var bbox = [v.lng - dlng, v.lat - dlat, v.lng + dlng, v.lat + dlat].join(',');
      left.appendChild(h('iframe', {
        class: 'map-embed', loading: 'lazy', title: t('map_embed'),
        src: 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik&marker=' + v.lat + ',' + v.lng
      }));
    }
    grid.appendChild(left);

    var right = h('div');
    if (has(v.directions)) { right.appendChild(h('h3', { text: t('directions') })); right.appendChild(paragraphs(tx(v.directions))); }
    if (has(d.accommodation)) { right.appendChild(h('h3', { text: t('accommodation'), style: 'margin-top:18px' })); right.appendChild(paragraphs(tx(d.accommodation))); }
    if (right.childNodes.length) grid.appendChild(right);

    return section('venue', 'nav_venue', 'section-alt', [grid]);
  }

  function renderCommittees(d) {
    var groups = (d.committees || []).filter(function (g) { return g.members && g.members.length; });
    if (!groups.length) return null;
    var grid = h('div', { class: 'committee-grid' });
    groups.forEach(function (g) {
      var card = h('div', { class: 'card committee' });
      card.appendChild(h('h3', { text: tx(g.name) }));
      var ul = h('ul');
      g.members.forEach(function (m) {
        var li = h('li');
        // Name opens the member's homepage when one is given; an envelope icon
        // opens their e-mail client. Both are optional and independent.
        li.appendChild(m.url ? h('a', { href: m.url, target: '_blank', rel: 'noopener', text: tx(m.name) }) : h('span', { text: tx(m.name) }));
        if (has(m.affiliation)) li.appendChild(h('span', { class: 'aff', text: ' (' + tx(m.affiliation) + ')' }));
        if (has(m.role)) li.appendChild(h('span', { class: 'role', text: tx(m.role) }));
        var pl = personLinks({ email: m.email, email_enc: m.email_enc });
        if (pl) li.appendChild(pl);
        ul.appendChild(li);
      });
      card.appendChild(ul);
      grid.appendChild(card);
    });
    return section('committee', 'nav_committee', null, [grid]);
  }

  /* ---------- registration form (writes to a Google Sheet via Apps Script) ----------
     The page has no server. The form calls a small Google Apps Script web app
     (see template/registration.gs) that appends a row to the organizer's sheet.
     Requests use JSONP (a <script> tag), the browser-access method shown in
     Google's Content Service documentation, so the answer can be read back
     without cross-origin (CORS) permissions. */
  function jsonp(base, params, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var cbName = '__confcb' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      var script = document.createElement('script');
      var finished = false;
      var timer = setTimeout(function () { finish(new Error('timeout')); }, timeoutMs || 25000);
      function finish(err, data) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        window[cbName] = function () { /* late answer after timeout: ignore */ };
        if (script.parentNode) script.parentNode.removeChild(script);
        if (err) reject(err); else resolve(data);
      }
      window[cbName] = function (data) { finish(null, data); };
      script.onerror = function () { finish(new Error('network')); };
      var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); });
      qs.push('cb=' + encodeURIComponent(cbName));
      script.src = base + (base.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
      script.async = true;
      document.head.appendChild(script);
    });
  }
  // window.__confSiteTransport exists only so tests/previews can replace the network.
  function transport(url, params) {
    if (typeof window.__confSiteTransport === 'function') return Promise.resolve(window.__confSiteTransport(url, params));
    return jsonp(url, params, 25000);
  }

  var REG_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function regState() {
    if (!state.reg) {
      state.reg = {
        values: { name: '', affiliation: '', email: '', option: '', consent_public: false, consent_privacy: false },
        errors: {}, status: 'idle', message: '', result: '', receipt: null, shownAt: 0, hp: '', paint: null
      };
    }
    return state.reg;
  }
  function regOptions(d) {
    return ((d.registration && d.registration.attendance_options) || []).filter(function (o) { return o && o.id; });
  }
  function regOption(d, id) {
    var list = regOptions(d);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function validateReg(d, v) {
    var e = {};
    if (!v.name.trim()) e.name = t('reg_err_name');
    if (!v.affiliation.trim()) e.affiliation = t('reg_err_affiliation');
    if (!REG_EMAIL_RE.test(v.email.trim())) e.email = t('reg_err_email');
    if (regOptions(d).length && !regOption(d, v.option)) e.option = t('reg_err_option');
    if (!v.consent_privacy) e.privacy = t('reg_err_privacy');
    return e;
  }

  function regServerMessage(res, st) {
    var code = res && res.error;
    if (code === 'closed') return t('reg_err_closed');
    if (code === 'toofast') return t('reg_err_fast');
    if (code === 'busy') return t('reg_err_busy');
    if (code === 'full') return t('reg_err_full');
    if (code === 'invalid') {
      var f = res.field;
      if (f === 'name' || f === 'affiliation' || f === 'email' || f === 'option' || f === 'privacy') {
        st.errors[f] = t(f === 'privacy' ? 'reg_err_privacy' : 'reg_err_' + f);
      }
      return t('reg_err_check');
    }
    return t('reg_err_send');
  }

  function submitReg(d) {
    var st = regState(), v = st.values;
    if (st.status === 'sending') return;
    st.errors = validateReg(d, v);
    st.message = '';
    if (Object.keys(st.errors).length) { st.status = 'idle'; if (st.paint) st.paint(); focusFirstRegError(); return; }
    st.status = 'sending';
    if (st.paint) st.paint();
    var params = {
      action: 'register',
      name: v.name.trim(), affiliation: v.affiliation.trim(), email: v.email.trim(),
      option: v.option || '', consent_public: v.consent_public ? 'Y' : 'N', consent_privacy: 'Y',
      lang: state.lang, hp: st.hp || '', elapsed: String(Date.now() - (st.shownAt || Date.now()))
    };
    transport(d.registration.endpoint, params).then(function (res) {
      if (res && res.ok) {
        st.receipt = { name: params.name, affiliation: params.affiliation, email: params.email, option: params.option, listed: v.consent_public };
        st.result = res.status || 'created';
        st.status = 'done';
        st.values = { name: '', affiliation: '', email: '', option: '', consent_public: false, consent_privacy: false };
        st.errors = {};
        if (st.paint) st.paint();
        loadLiveParticipants(true);
      } else {
        st.status = 'idle';
        st.message = regServerMessage(res, st);
        if (st.paint) st.paint();
      }
    }, function () {
      st.status = 'idle';
      st.message = t('reg_err_network');
      if (st.paint) st.paint();
    });
  }

  function focusFirstRegError() {
    var el = document.querySelector('.reg-form [aria-invalid="true"]');
    if (el && el.focus) el.focus();
  }

  function regField(id, key, label, attrs, help) {
    var st = regState();
    var input = h('input', Object.assign({ id: id, class: 'reg-input', value: st.values[key], 'aria-required': 'true', 'aria-describedby': id + '-err' }, attrs));
    input.value = st.values[key];
    if (st.errors[key]) input.setAttribute('aria-invalid', 'true');
    input.addEventListener('input', function () { st.values[key] = input.value; });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); submitReg(state.data); } });
    var box = h('div', { class: 'reg-field' }, [
      h('label', { for: id }, [document.createTextNode(label + ' '), h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })]),
      input
    ]);
    if (help) box.appendChild(h('p', { class: 'reg-help', text: help }));
    box.appendChild(h('p', { class: 'field-error', id: id + '-err', role: 'alert', text: st.errors[key] || '' }));
    return box;
  }

  function regForm(d) {
    var r = d.registration, st = regState();
    if (!st.shownAt) st.shownAt = Date.now();
    var sending = st.status === 'sending';
    var wrap = h('div', { class: 'reg-form', role: 'group', 'aria-label': t('reg_form_title') });
    wrap.appendChild(h('h3', { class: 'reg-form-title', text: t('reg_form_title') }));
    wrap.appendChild(h('p', { class: 'reg-help', text: t('reg_required_note') }));

    wrap.appendChild(regField('reg-name', 'name', t('reg_name'), { type: 'text', maxlength: '60', autocomplete: 'name', placeholder: t('reg_name_ph') }));
    wrap.appendChild(regField('reg-aff', 'affiliation', t('reg_aff'), { type: 'text', maxlength: '100', autocomplete: 'organization', placeholder: t('reg_aff_ph') }));
    wrap.appendChild(regField('reg-email', 'email', t('reg_email'), { type: 'email', maxlength: '100', autocomplete: 'email', inputmode: 'email', placeholder: t('reg_email_ph') }, t('reg_email_help')));

    var opts = regOptions(d);
    if (opts.length) {
      var fs = h('fieldset', { class: 'reg-attend' + (st.errors.option ? ' invalid' : '') }, [
        h('legend', null, [document.createTextNode(t('reg_attend') + ' '), h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })]),
        h('p', { class: 'reg-help', text: t('reg_attend_help') })
      ]);
      opts.forEach(function (o, i) {
        var radio = h('input', { type: 'radio', name: 'reg-option', value: o.id, id: 'reg-opt-' + i });
        if (st.values.option === o.id) radio.checked = true;
        if (i === 0 && st.errors.option) radio.setAttribute('aria-invalid', 'true');
        radio.addEventListener('change', function () { st.values.option = o.id; st.errors.option = ''; var er = document.getElementById('reg-option-err'); if (er) er.textContent = ''; fs.classList.remove('invalid'); });
        var text = h('span', { class: 'opt-text' }, [h('span', { class: 'opt-label', text: tx(o.label) })]);
        if (has(o.note)) text.appendChild(h('span', { class: 'opt-note', text: tx(o.note) }));
        fs.appendChild(h('label', { class: 'reg-opt', for: 'reg-opt-' + i }, [radio, text]));
      });
      fs.appendChild(h('p', { class: 'field-error', id: 'reg-option-err', role: 'alert', text: st.errors.option || '' }));
      wrap.appendChild(fs);
    }

    // Optional consent to be listed on the public participant list.
    var cbList = h('input', { type: 'checkbox', id: 'reg-consent-public' });
    cbList.checked = !!st.values.consent_public;
    cbList.addEventListener('change', function () { st.values.consent_public = cbList.checked; });
    wrap.appendChild(h('label', { class: 'reg-check', for: 'reg-consent-public' }, [cbList, h('span', { text: t('reg_consent_public') })]));

    // Required privacy consent with the full notice.
    if (has(r.privacy_notice)) {
      wrap.appendChild(h('details', { class: 'reg-privacy' }, [h('summary', { text: t('reg_privacy_view') }), paragraphs(tx(r.privacy_notice), 'prose small')]));
    }
    var cbPriv = h('input', { type: 'checkbox', id: 'reg-consent-privacy', 'aria-describedby': 'reg-privacy-err' });
    cbPriv.checked = !!st.values.consent_privacy;
    if (st.errors.privacy) cbPriv.setAttribute('aria-invalid', 'true');
    cbPriv.addEventListener('change', function () { st.values.consent_privacy = cbPriv.checked; if (cbPriv.checked) { st.errors.privacy = ''; var er = document.getElementById('reg-privacy-err'); if (er) er.textContent = ''; cbPriv.removeAttribute('aria-invalid'); } });
    wrap.appendChild(h('label', { class: 'reg-check', for: 'reg-consent-privacy' }, [cbPriv, h('span', { text: t('reg_consent_privacy') })]));
    wrap.appendChild(h('p', { class: 'field-error', id: 'reg-privacy-err', role: 'alert', text: st.errors.privacy || '' }));

    // Honeypot: invisible to people, tempting to form-filling bots.
    var hp = h('input', { type: 'text', name: 'reg_hp_x', id: 'reg-hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
    hp.value = st.hp || '';
    hp.addEventListener('input', function () { st.hp = hp.value; });
    wrap.appendChild(h('div', { class: 'reg-hp', 'aria-hidden': 'true' }, [hp]));

    var btn = h('button', { type: 'button', class: 'btn btn-dark reg-submit', id: 'reg-submit', text: sending ? t('reg_sending') : t('reg_submit') });
    if (sending) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    btn.addEventListener('click', function () { submitReg(state.data); });
    wrap.appendChild(h('div', { class: 'reg-actions' }, [btn]));
    wrap.appendChild(h('p', { class: 'reg-message' + (st.message ? ' error' : ''), id: 'reg-message', role: 'alert', text: st.message || '' }));
    return wrap;
  }

  function regDone(d) {
    var st = regState(), rc = st.receipt || {};
    var opt = regOption(d, rc.option);
    var box = h('div', { class: 'reg-done', role: 'status' });
    box.appendChild(h('h3', { class: 'reg-form-title', text: t('reg_done_title') }));
    if (st.result === 'duplicate') box.appendChild(h('p', { text: t('reg_done_dup') }));
    else if (st.result === 'added_again') box.appendChild(h('p', { text: t('reg_done_again') }));
    var dl = h('dl', { class: 'kv reg-receipt' });
    function row(k, vv) { dl.appendChild(h('dt', { text: k })); dl.appendChild(h('dd', { text: vv })); }
    row(t('reg_name'), rc.name || '');
    row(t('reg_aff'), rc.affiliation || '');
    row(t('reg_email'), rc.email || '');
    if (opt) row(t('reg_attend'), tx(opt.label));
    row(t('participants_title'), rc.listed ? t('reg_list_yes') : t('reg_list_no'));
    box.appendChild(h('p', { class: 'reg-help', text: t('reg_receipt') }));
    box.appendChild(dl);
    box.appendChild(h('p', { class: 'reg-help', text: t('reg_done_note') }));
    var again = h('button', { type: 'button', class: 'btn btn-ghost-dark', text: t('reg_another') });
    again.addEventListener('click', function () { st.status = 'idle'; st.receipt = null; st.result = ''; st.message = ''; st.errors = {}; st.shownAt = Date.now(); if (st.paint) st.paint(); });
    box.appendChild(h('div', { class: 'reg-actions' }, [again]));
    return box;
  }

  function renderRegForm(d) {
    var st = regState();
    var mount = h('div', { class: 'reg-form-mount' });
    st.paint = function () {
      mount.innerHTML = '';
      mount.appendChild(st.status === 'done' ? regDone(d) : regForm(d));
    };
    st.paint();
    return mount;
  }

  function renderRegistration(d) {
    var r = d.registration;
    if (!r) return null;
    var box = h('div', { class: 'reg-box' });
    var status = registrationStatus(d);

    var facts = h('div', { class: 'reg-facts' });
    var dlText = has(r.deadline_display) ? tx(r.deadline_display) : (r.deadline ? fmtDate(r.deadline) : t('tba'));
    facts.appendChild(h('div', null, [h('strong', { text: t('reg_deadline') + ': ' }), h('span', { text: dlText })]));
    if (has(r.fee)) facts.appendChild(h('div', null, [h('strong', { text: t('reg_fee') + ': ' }), h('span', { text: tx(r.fee) })]));
    box.appendChild(facts);

    if (has(r.note)) box.appendChild(paragraphs(tx(r.note)));

    if (status === 'open' && r.endpoint) {
      box.appendChild(renderRegForm(d));
      if (r.form_url) {
        box.appendChild(h('p', { class: 'reg-fallback' }, [
          document.createTextNode(t('reg_fallback') + ' '),
          h('a', { href: r.form_url, target: '_blank', rel: 'noopener', text: t('reg_fallback_link') + ' ↗' })
        ]));
      }
    } else if (status === 'open') {
      box.appendChild(h('div', null, [h('a', { class: 'btn btn-dark', href: r.form_url, target: '_blank', rel: 'noopener', text: t('reg_open') + ' ↗' })]));
      if (r.embed) box.appendChild(h('iframe', { class: 'reg-embed', src: r.form_url, title: t('reg_title'), loading: 'lazy' }));
    } else if (status === 'closed') {
      box.appendChild(h('p', { class: 'reg-status closed', text: t('reg_closed') }));
    } else if (status === 'ended') {
      box.appendChild(h('p', { class: 'reg-status closed', text: t('reg_ended') }));
    } else {
      box.appendChild(h('p', { class: 'reg-status tba', text: t('reg_soon') }));
    }
    return section('registration', 'nav_registration', null, [box]);
  }

  function renderDownloads(d) {
    var list = (d.downloads || []).filter(function (x) { return x.url; });
    if (!list.length) return null;
    var ul = h('ul', { class: 'link-list' });
    list.forEach(function (x) { ul.appendChild(h('li', null, [h('a', { href: x.url, target: '_blank', rel: 'noopener' }, [icon('file'), document.createTextNode(tx(x.label) || x.url)])])); });
    return section('downloads', 'nav_downloads', 'section-alt', [ul]);
  }

  function renderGallery(d) {
    var list = (d.gallery || []).filter(function (x) { return x.src; });
    if (!list.length) return null;
    var grid = h('div', { class: 'gallery' });
    list.forEach(function (x) {
      var fig = h('figure');
      fig.appendChild(h('img', { src: x.src, alt: tx(x.caption) || '', loading: 'lazy' }));
      if (has(x.caption)) fig.appendChild(h('figcaption', { text: tx(x.caption) }));
      grid.appendChild(fig);
    });
    return section('gallery', 'nav_gallery', null, [grid]);
  }

  function renderSponsors(d) {
    var list = (d.sponsors || []).filter(function (s) { return has(s.name) || s.logo; });
    if (!list.length) return null;
    var row = h('div', { class: 'sponsors' });
    list.forEach(function (s) {
      var item = h(s.url ? 'a' : 'div', { class: 'sponsor', href: s.url || null, target: s.url ? '_blank' : null, rel: s.url ? 'noopener' : null });
      if (s.logo) item.appendChild(h('img', { src: s.logo, alt: tx(s.name) || '' }));
      if (has(s.name)) item.appendChild(h('span', { text: tx(s.name) }));
      row.appendChild(item);
    });
    return section('sponsors', 'nav_sponsors', 'section-alt', [row]);
  }

  function renderContact(d) {
    var list = (d.contact || []).filter(function (c) { return has(c.name) || c.email || c.email_enc || c.phone; });
    var body;
    if (!list.length) body = h('p', { class: 'tba', text: t('contact_tba') });
    else {
      body = h('ul', { class: 'contact-list' });
      list.forEach(function (c) {
        var li = h('li');
        if (has(c.name)) li.appendChild(h('span', { class: 'name', text: tx(c.name) }));
        if (has(c.role)) li.appendChild(h('span', { class: 'muted', text: tx(c.role) }));
        var em = emailRef(c);
        if (em) li.appendChild(emailControl(em, 'text'));
        if (c.phone) li.appendChild(h('span', { text: c.phone }));
        body.appendChild(li);
      });
    }
    return section('contact', 'nav_contact', null, [body]);
  }

  function renderFooter(d) {
    var f = document.getElementById('site-footer');
    f.innerHTML = '';
    var wrap = h('div', { class: 'wrap' });
    var left = h('div');
    left.appendChild(h('div', { text: tx(d.footer) || tx(d.title) }));
    if (d.footer_url) left.appendChild(h('a', { href: d.footer_url, target: '_blank', rel: 'noopener', text: d.footer_url }));
    wrap.appendChild(left);
    var right = h('div');
    if (d.updated) right.appendChild(h('span', { text: t('updated') + ': ' + fmtDate(d.updated) + ' · ' }));
    right.appendChild(h('a', { href: '#top', text: t('top') + ' ↑' }));
    wrap.appendChild(right);
    f.appendChild(wrap);
  }

  function renderNav(d, sections) {
    var nav = document.getElementById('site-nav');
    nav.innerHTML = '';
    var map = { notices: 'nav_notices', about: 'nav_about', program: 'nav_program', speakers: 'nav_speakers', registration: 'nav_registration', participants: 'nav_participants', venue: 'nav_venue', committee: 'nav_committee', downloads: 'nav_downloads', gallery: 'nav_gallery', sponsors: 'nav_sponsors', contact: 'nav_contact' };
    sections.forEach(function (sec) {
      if (!sec || !map[sec.id]) return;
      nav.appendChild(h('a', { href: '#' + sec.id, text: t(map[sec.id]) }));
    });
    var brand = document.getElementById('brand');
    brand.textContent = '';
    brand.classList.remove('brand-logo-only');
    var logo = d.logo && typeof d.logo === 'object' ? d.logo : null;
    if (logo && logo.src) {
      brand.appendChild(h('img', { class: 'brand-logo', src: logo.src, alt: has(logo.alt) ? tx(logo.alt) : '' }));
      if (logo.hide_text) brand.classList.add('brand-logo-only');
    }
    brand.appendChild(h('span', { class: 'brand-text', text: has(d.short_title) ? tx(d.short_title) : tx(d.title) }));
    document.getElementById('menu-label').textContent = t('menu');
  }

  /* ---------- render all ---------- */
  function render() {
    var d = state.data;
    document.documentElement.lang = state.lang;
    document.title = tx(d.title);

    var app = document.getElementById('app');
    app.innerHTML = '';
    var sections = [
      renderHero(d), renderOverview(d), renderNotices(d), renderAbout(d), renderProgram(d), renderSpeakers(d),
      renderRegistration(d), renderParticipants(d), renderVenue(d), renderCommittees(d), renderDownloads(d), renderGallery(d),
      renderSponsors(d), renderContact(d)
    ];
    sections.forEach(function (s) { if (s) app.appendChild(s); });
    renderNav(d, sections);
    renderFooter(d);
    renderMath();

    var buttons = document.querySelectorAll('.lang-btn');
    Array.prototype.forEach.call(buttons, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false'); });
    try { localStorage.setItem('conf-lang', state.lang); } catch (e) { /* storage may be unavailable */ }
  }

  function initialLang(d) {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'ko' || q === 'en') return q;
    try { var saved = localStorage.getItem('conf-lang'); if (saved === 'ko' || saved === 'en') return saved; } catch (e) { /* ignore */ }
    if (d.lang_default === 'ko' || d.lang_default === 'en') return d.lang_default;
    return (navigator.language || '').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';
  }

  function setLang(lang) {
    state.lang = lang;
    var url = new URL(location.href);
    url.searchParams.set('lang', lang);
    try { history.replaceState(null, '', url.toString()); } catch (e) { /* ignore */ }
    render();
  }

  // When hosted (GitHub Pages etc.) prefer the live conference.json so edits
  // made directly on GitHub show up without rebuilding; otherwise use the
  // copy embedded at build time.
  function loadData() {
    var embedded = document.getElementById('site-data');
    var data = null;
    try { data = embedded ? JSON.parse(embedded.textContent) : null; } catch (e) { data = null; }
    // data-embedded-only: 웹 도구의 미리보기처럼 내장 데이터만 써야 할 때 (서버의 conference.json 을 읽지 않음)
    var embeddedOnly = embedded && embedded.hasAttribute('data-embedded-only');
    if (embeddedOnly || location.protocol === 'file:' || typeof fetch !== 'function') return Promise.resolve(data);
    return fetch('conference.json', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : data; })
      .then(function (json) { return (json && json.title) ? json : data; })
      .catch(function () { return data; });
  }

  function wireControls() {
    var buttons = document.querySelectorAll('.lang-btn');
    Array.prototype.forEach.call(buttons, function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });
    var menuBtn = document.getElementById('menu-btn');
    var nav = document.getElementById('site-nav');
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
    // Printing: open collapsed abstracts so the printed page is complete, then restore.
    var openedForPrint = [];
    window.addEventListener('beforeprint', function () {
      openedForPrint = Array.prototype.filter.call(document.querySelectorAll('details'), function (el) { return !el.open; });
      openedForPrint.forEach(function (el) { el.open = true; });
    });
    window.addEventListener('afterprint', function () {
      openedForPrint.forEach(function (el) { el.open = false; });
      openedForPrint = [];
    });
  }

  loadData().then(function (data) {
    if (!data) { document.getElementById('app').textContent = 'conference.json could not be loaded.'; return; }
    state.data = data;
    state.lang = initialLang(data);
    var pv = previewTheme();
    applyTheme(pv ? (pv === 'default' ? {} : pv) : data.theme);
    wireControls();
    render();
    loadLiveParticipants();
  });
})();
