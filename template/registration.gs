/**
 * 학회 사전등록 접수 스크립트 (Google Apps Script)
 * ---------------------------------------------------------------
 * 이 파일은 scripts/make_registration_script.py 가 conference.json 을 읽어 자동으로 만든 것입니다.
 * 사람이 직접 고치기보다, conference.json 의 registration 항목을 바꾼 뒤 다시 만드는 것을 권장합니다.
 *
 * 하는 일
 *   1) 홈페이지 등록 양식에서 온 내용을 이 스프레드시트의 '등록' 탭 맨 아래에 한 줄로 기록합니다.
 *   2) 홈페이지의 '참가자 명단'에 보여 줄 이름·소속만(명단 게시에 동의한 사람만) 돌려줍니다.
 *      이메일 등 다른 열은 어떤 경우에도 밖으로 나가지 않습니다.
 *
 * 처음 한 번만: 함수 선택 칸에서 setup 을 고르고 [실행] → 권한 허용 → 배포(웹 앱).
 * 자세한 순서는 references/registration-sheet.md 를 보세요.
 */

var CONFIG = /*__CONFIG__*/null;

/* ============================== 처음 설정 ============================== */

/** 처음 한 번 실행합니다. '등록'·'집계' 탭과 제목 줄을 만들고, 이 시트를 접수 대상으로 기억합니다. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  var L = layout_();

  var sh = ss.getSheetByName(CONFIG.sheetName) || ss.insertSheet(CONFIG.sheetName);
  var headers = headers_();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8eef5');
  sh.setFrozenRows(1);
  // 이름·이메일 등은 서식을 '일반 텍스트'로 고정해, 수식(=로 시작하는 값)으로 해석되지 않게 합니다.
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), headers.length).setNumberFormat('@');
  sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 110); sh.setColumnWidth(3, 220); sh.setColumnWidth(4, 220);
  sh.setColumnWidth(L.optionLabel, 260); sh.setColumnWidth(L.note, 240);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(['취소', '확인완료'], true).setAllowInvalid(true).build();
  sh.getRange(2, L.status, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(rule);

  var sum = ss.getSheetByName(CONFIG.summaryName) || ss.insertSheet(CONFIG.summaryName);
  buildSummary_(sum, sh, L);

  try { SpreadsheetApp.getUi().alert('설정이 끝났습니다. 이제 [배포 → 새 배포 → 웹 앱]으로 이어서 진행하세요.'); } catch (e) { /* 편집기에서 실행하면 알림창이 없을 수 있음 */ }
  console.log('setup 완료: ' + ss.getUrl());
}

function buildSummary_(sum, sh, L) {
  sum.clear();
  var n = CONFIG.days.length;
  var st = "'" + CONFIG.sheetName + "'!" + col_(L.status) + '2:' + col_(L.status);
  function rng(c) { return "'" + CONFIG.sheetName + "'!" + col_(c) + '2:' + col_(c); }
  var active = rng(L.name) + ',"<>",' + st + ',"<>취소"';   // COUNTIFS 공통 조건: 이름이 있고 상태가 '취소'가 아님

  sum.getRange('A1').setValue('접수 상태').setFontWeight('bold');
  sum.getRange('B1').setValue('접수중')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['접수중', '마감'], true).build())
    .setBackground('#fff4cc');
  sum.getRange('C1').setValue('← 이 칸을 "마감"으로 바꾸면 홈페이지에서 더 이상 접수되지 않습니다(재배포 불필요).');
  sum.getRange('A2').setValue('마감일(스크립트 설정)').setFontWeight('bold');
  sum.getRange('B2').setValue(CONFIG.deadline || '미설정');

  var row = 4;
  sum.getRange(row, 1).setValue('집계 (상태가 "취소"인 줄 제외)').setFontWeight('bold'); row++;
  var items = [];
  items.push(['접수 건수(같은 이메일 중복 줄 포함)', '=COUNTIFS(' + active + ')']);
  items.push(['고유 이메일 수', '=IFERROR(COUNTA(UNIQUE(FILTER(' + rng(L.email) + ',' + rng(L.email) + '<>"",' + st + '<>"취소"))),0)']);
  items.push(['참가자 명단 게시 동의', '=COUNTIFS(' + active + ',' + rng(L.consentPublic) + ',"Y")']);
  for (var i = 0; i < n; i++) {
    items.push([CONFIG.days[i] + ' 참석', '=COUNTIFS(' + active + ',' + rng(L.firstDay + i) + ',"Y")']);
  }
  CONFIG.options.forEach(function (o) {
    items.push(['참석 구분: ' + o.label, '=COUNTIFS(' + active + ',' + rng(L.optionId) + ',"' + o.id + '")']);
  });
  items.forEach(function (it) {
    sum.getRange(row, 1).setValue(it[0]);
    sum.getRange(row, 2).setFormula(it[1]);
    row++;
  });
  row++;
  sum.getRange(row, 1).setValue('※ 같은 사람이 여러 번 접수하면 줄이 여러 개 생길 수 있습니다. 중복 줄은 \'등록\' 탭의 상태 열에서 "취소"로 바꾸면 집계·명단에서 빠집니다.');
  sum.setColumnWidth(1, 320); sum.setColumnWidth(2, 120);
}

/* ============================== 요청 처리 ============================== */

function doGet(e) { return handle_((e && e.parameter) || {}); }
function doPost(e) { return handle_((e && e.parameter) || {}); }

function handle_(p) {
  var out;
  try {
    var action = String(p.action || 'ping');
    if (action === 'register') out = register_(p);
    else if (action === 'participants') out = participants_();
    else out = { ok: true, service: 'conference-registration', slug: CONFIG.slug, open: isOpen_() };
  } catch (err) {
    console.error(err);
    out = { ok: false, error: 'server' };
  }
  return respond_(out, p.cb);
}

/** cb 가 있으면 JSONP(<script> 로 읽는 방식), 없으면 JSON 으로 응답합니다. */
function respond_(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb && /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(String(cb))) {
    return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/* ============================== 접수 ============================== */

function register_(p) {
  if (!isOpen_()) return { ok: false, error: 'closed' };

  // 자동 입력 프로그램 방지: 사람 눈에 안 보이는 칸이 채워져 있으면 기록하지 않고 성공인 척 응답
  if (String(p.hp || '') !== '') return { ok: true, status: 'created' };
  if ((Number(p.elapsed) || 0) < CONFIG.minElapsedMs) return { ok: false, error: 'toofast' };

  var name = clean_(p.name, 60);
  var aff = clean_(p.affiliation, 100);
  var email = clean_(p.email, 100).toLowerCase();
  if (!name) return invalid_('name');
  if (!aff) return invalid_('affiliation');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return invalid_('email');
  var opt = null;
  if (CONFIG.options.length) {
    opt = findOption_(String(p.option || ''));
    if (!opt) return invalid_('option');
  }
  if (String(p.consent_privacy) !== 'Y') return invalid_('privacy');
  var listed = String(p.consent_public) === 'Y' ? 'Y' : 'N';
  var lang = String(p.lang) === 'en' ? 'en' : 'ko';

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    var L = layout_();
    var sh = sheet_();
    var last = sh.getLastRow();
    if (CONFIG.maxRows && last - 1 >= CONFIG.maxRows) return { ok: false, error: 'full' };

    var note = '';
    if (last > 1) {
      var rows = sh.getRange(2, 1, last - 1, L.total).getValues();
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (String(r[L.status - 1]) === '취소') continue;
        if (String(r[L.email - 1]).toLowerCase() !== email) continue;
        if (String(r[L.optionId - 1]) === (opt ? opt.id : '')) return { ok: true, status: 'duplicate' };
        note = '같은 이메일로 이전 접수 있음(' + (i + 2) + '행)';
        break;
      }
    }

    var row = [];
    for (var c = 0; c < L.total; c++) row.push('');
    row[L.time - 1] = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd HH:mm:ss');
    row[L.name - 1] = name;
    row[L.aff - 1] = aff;
    row[L.email - 1] = email;
    row[L.optionId - 1] = opt ? opt.id : '';
    row[L.optionLabel - 1] = opt ? opt.label : '';
    for (var d = 0; d < CONFIG.days.length; d++) {
      row[L.firstDay - 1 + d] = (opt && opt.days.indexOf(CONFIG.days[d]) >= 0) ? 'Y' : '';
    }
    row[L.consentPublic - 1] = listed;
    row[L.consentPrivacy - 1] = 'Y';
    row[L.lang - 1] = lang;
    row[L.note - 1] = note;

    if (last + 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);   // 시트 끝에 닿으면 줄 추가
    var target = sh.getRange(last + 1, 1, 1, L.total);
    target.setNumberFormat('@');          // 일반 텍스트로 고정: 수식으로 해석되는 것을 막음
    target.setValues([row]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  CacheService.getScriptCache().remove('participants');
  return { ok: true, status: note ? 'added_again' : 'created' };
}

function invalid_(field) { return { ok: false, error: 'invalid', field: field }; }

/* ============================== 참가자 명단 ============================== */

/** 이름·소속만 돌려줍니다. 명단 게시에 동의("Y")했고 상태가 "취소"가 아닌 줄만, 같은 이메일은 가장 최근 줄 기준. */
function participants_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('participants');
  if (hit) return JSON.parse(hit);

  var L = layout_();
  var sh = sheet_();
  var last = sh.getLastRow();
  var latest = {}, order = [];
  if (last > 1) {
    var rows = sh.getRange(2, 1, last - 1, L.total).getValues();
    rows.forEach(function (r) {
      if (String(r[L.status - 1]) === '취소') return;
      var email = String(r[L.email - 1]).toLowerCase();
      if (!String(r[L.name - 1]) || !email) return;
      if (!(email in latest)) order.push(email);
      latest[email] = r;
    });
  }
  var list = [];
  order.forEach(function (email) {
    var r = latest[email];
    if (String(r[L.consentPublic - 1]) === 'Y') list.push({ name: String(r[L.name - 1]), affiliation: String(r[L.aff - 1]) });
  });
  var out = { ok: true, participants: list, count: list.length };
  cache.put('participants', JSON.stringify(out), 60);
  return out;
}

/* ============================== 도우미 ============================== */

function isOpen_() {
  if (CONFIG.deadline) {
    var todayStr = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd');
    if (todayStr > CONFIG.deadline) return false;
  }
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
    var sum = ss.getSheetByName(CONFIG.summaryName);
    if (sum && String(sum.getRange('B1').getValue()).trim() === '마감') return false;
  } catch (e) { /* 집계 탭을 못 읽으면 접수중으로 간주 */ }
  return true;
}

function sheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('setup 을 먼저 실행하세요.');
  var sh = SpreadsheetApp.openById(id).getSheetByName(CONFIG.sheetName);
  if (!sh) throw new Error("'" + CONFIG.sheetName + "' 탭이 없습니다. setup 을 다시 실행하세요.");
  return sh;
}

function findOption_(id) {
  for (var i = 0; i < CONFIG.options.length; i++) if (CONFIG.options[i].id === id) return CONFIG.options[i];
  return null;
}

/** 제어문자 제거, 공백 정리, 길이 제한, 수식으로 오해될 수 있는 앞머리(= + - @) 제거 */
function clean_(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .replace(/^[=+\-@\s]+/, '');
}

function headers_() {
  var h = ['접수시각', '성명', '소속', '이메일', '참석구분코드', '참석구분'];
  CONFIG.days.forEach(function (d) { h.push(d); });
  return h.concat(['명단게시동의', '개인정보동의', '언어', '상태(관리용)', '비고(관리용)']);
}

/** 열 번호(1부터). 앞쪽 6칸은 고정, 그 뒤에 날짜별 열이 옵니다. */
function layout_() {
  var n = CONFIG.days.length;
  var L = { time: 1, name: 2, aff: 3, email: 4, optionId: 5, optionLabel: 6, firstDay: 7 };
  L.consentPublic = 7 + n;
  L.consentPrivacy = 8 + n;
  L.lang = 9 + n;
  L.status = 10 + n;
  L.note = 11 + n;
  L.total = 11 + n;
  return L;
}

function col_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
