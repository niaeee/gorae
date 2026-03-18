const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.COOKIE_SECRET || 'gorae-i-2026-whale-secret';
const DATA_FILE = path.join(__dirname, 'data', 'attendance.json');

// ═══════════════════════════════════════════════════════════
// 강의 설정
// month: 월 필터용, active: 출석 가능 여부
// ═══════════════════════════════════════════════════════════
const LECTURES = {
  '03AB': { name: '3월 기초반 A/B', month: '3월', active: true },
  '03C':  { name: '3월 심화반 C',   month: '3월', active: false },
  '04AB': { name: '4월 기초반 A/B', month: '4월', active: false },
  '04C':  { name: '4월 심화반 C',   month: '4월', active: false },
};

// ═══════════════════════════════════════════════════════════
// 파일 기반 출석 저장 (서버 재시작해도 유지)
// ═══════════════════════════════════════════════════════════
function loadAttendance() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[WARN] attendance.json 로드 실패, 빈 배열로 시작:', e.message);
  }
  return [];
}

function saveAttendance() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(attendanceLog, null, 2), 'utf-8');
  } catch (e) {
    console.error('[ERROR] attendance.json 저장 실패:', e.message);
  }
}

const attendanceLog = loadAttendance();
console.log(`[DATA] 기존 출석 기록 ${attendanceLog.length}건 로드됨`);

app.use(express.json());
app.use(cookieParser(SECRET));

// ── API: 출석 등록 (이름 + 부서명) ──
app.post('/api/verify', (req, res) => {
  const { lectureId, name, dept } = req.body;

  if (!lectureId || !name || !dept) {
    return res.json({ success: false, message: '이름과 부서명을 모두 입력해주세요.' });
  }

  const lecture = LECTURES[lectureId];
  if (!lecture || !lecture.active) {
    return res.json({ success: false, message: '아직 준비되지 않은 강의입니다.' });
  }

  const entry = {
    name,
    dept,
    lectureId,
    lectureName: lecture.name,
    month: lecture.month,
    timestamp: new Date().toISOString(),
  };
  attendanceLog.push(entry);
  saveAttendance();
  console.log('[ATTENDANCE]', JSON.stringify(entry));

  let access = {};
  try {
    access = req.signedCookies.gorae_access
      ? JSON.parse(req.signedCookies.gorae_access)
      : {};
  } catch { access = {}; }

  access[lectureId] = { name, dept, timestamp: entry.timestamp };

  res.cookie('gorae_access', JSON.stringify(access), {
    signed: true,
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.json({ success: true, message: `${name}님, 출석이 확인되었습니다!` });
});

// ── API: 접근 상태 확인 ──
app.get('/api/status', (req, res) => {
  let access = {};
  try {
    access = req.signedCookies.gorae_access
      ? JSON.parse(req.signedCookies.gorae_access)
      : {};
  } catch { access = {}; }
  res.json({ access });
});

// ── API: 강의별 로그아웃 ──
app.post('/api/logout', (req, res) => {
  const { lectureId } = req.body;
  let access = {};
  try {
    access = req.signedCookies.gorae_access
      ? JSON.parse(req.signedCookies.gorae_access)
      : {};
  } catch { access = {}; }

  if (lectureId) {
    delete access[lectureId];
  } else {
    access = {};
  }

  res.cookie('gorae_access', JSON.stringify(access), {
    signed: true,
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });
  res.json({ success: true });
});

// ── 관리자 인증 미들웨어 ──
function adminAuth(req, res, next) {
  const key = req.query.key;
  if (key !== (process.env.ADMIN_KEY || 'gorae-admin-2026')) {
    return res.status(403).json({ error: '관리자 인증이 필요합니다.' });
  }
  next();
}

// ── API: 강의 설정 정보 (관리자용) ──
app.get('/api/admin/lectures', adminAuth, (req, res) => {
  const result = {};
  for (const [id, lec] of Object.entries(LECTURES)) {
    const count = attendanceLog.filter(e => e.lectureId === id).length;
    result[id] = { ...lec, count };
  }
  res.json(result);
});

// ── API: 출석부 조회 (관리자용) ──
app.get('/api/admin/attendance', adminAuth, (req, res) => {
  const monthFilter = req.query.month; // optional: "3월", "4월" ...
  const lectureFilter = req.query.lecture; // optional: "03AB"

  let filtered = attendanceLog;
  if (monthFilter) filtered = filtered.filter(e => e.month === monthFilter);
  if (lectureFilter) filtered = filtered.filter(e => e.lectureId === lectureFilter);

  // 강의별 그룹화
  const grouped = {};
  for (const [id, lec] of Object.entries(LECTURES)) {
    if (monthFilter && lec.month !== monthFilter) continue;
    if (lectureFilter && id !== lectureFilter) continue;
    grouped[id] = {
      name: lec.name,
      month: lec.month,
      active: lec.active,
      total: 0,
      attendees: [],
    };
  }

  filtered.forEach(entry => {
    if (!grouped[entry.lectureId]) {
      grouped[entry.lectureId] = {
        name: entry.lectureName,
        month: entry.month || '',
        active: false,
        total: 0,
        attendees: [],
      };
    }
    grouped[entry.lectureId].total++;
    grouped[entry.lectureId].attendees.push({
      name: entry.name,
      dept: entry.dept,
      timestamp: entry.timestamp,
    });
  });

  // 월 목록
  const months = [...new Set(Object.values(LECTURES).map(l => l.month))];

  res.json({
    totalEntries: filtered.length,
    months,
    lectures: grouped,
  });
});

// ── API: 출석부 CSV 다운로드 ──
app.get('/api/admin/download', adminAuth, (req, res) => {
  const monthFilter = req.query.month;
  const lectureFilter = req.query.lecture;

  let filtered = attendanceLog;
  if (monthFilter) filtered = filtered.filter(e => e.month === monthFilter);
  if (lectureFilter) filtered = filtered.filter(e => e.lectureId === lectureFilter);

  const BOM = '\uFEFF';
  const header = '번호,이름,부서명,강의,월,일시';
  const rows = filtered.map((e, i) => {
    const dt = new Date(e.timestamp);
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    return `${i + 1},"${e.name}","${e.dept}","${e.lectureName}","${e.month || ''}","${dateStr}"`;
  });
  const csv = BOM + header + '\n' + rows.join('\n');

  let tag = '전체';
  if (lectureFilter) tag = lectureFilter;
  else if (monthFilter) tag = monthFilter;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`출석부_${tag}.csv`)}`);
  res.send(csv);
});

// ── 관리자 페이지 ──
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── 강의 페이지 접근 보호 ──
Object.keys(LECTURES).forEach(id => {
  app.use(`/${id}`, (req, res, next) => {
    let access = {};
    try {
      access = req.signedCookies.gorae_access
        ? JSON.parse(req.signedCookies.gorae_access)
        : {};
    } catch { access = {}; }

    if (access[id]) return next();
    res.redirect(`/?need=${id}`);
  });
});

// ── 정적 파일 서빙 ──
app.use(express.static(path.join(__dirname)));

// ── Fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐋 고래.I Server running on port ${PORT}`);
  const active = Object.entries(LECTURES)
    .filter(([, v]) => v.active)
    .map(([k]) => k);
  console.log(`Active lectures: ${active.join(', ') || 'none'}`);
});
