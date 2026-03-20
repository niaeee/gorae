const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.COOKIE_SECRET || 'gorae-i-2026-whale-secret';

// ═══════════════════════════════════════════════════════════
// PostgreSQL 연결 (Railway 환경변수 DATABASE_URL 자동 주입)
// ═══════════════════════════════════════════════════════════
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      dept VARCHAR(200) NOT NULL,
      lecture_id VARCHAR(50) NOT NULL,
      lecture_name VARCHAR(200) NOT NULL,
      month VARCHAR(20),
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(name, dept, lecture_id)
    )
  `);
  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM attendance');
  console.log(`[DB] PostgreSQL 연결 완료, 기존 출석 기록 ${rows[0].cnt}건`);
}

// ═══════════════════════════════════════════════════════════
// 강의 설정
// month: 월 필터용, active: 출석 가능 여부
// ═══════════════════════════════════════════════════════════
const LECTURES = {
  // 교육청
  '03AB':  { name: '3월 기초반 A/B', month: '3월', group: '교육청', active: true },
  '03C':   { name: '3월 심화반 C',   month: '3월', group: '교육청', active: false },
  '04AB':  { name: '4월 기초반 A/B', month: '4월', group: '교육청', active: false },
  '04C':   { name: '4월 심화반 C',   month: '4월', group: '교육청', active: false },
  // 지자체 (관리자 전용)
  'gov03': { name: '3월 북구청 AI직무역량강화', month: '3월', group: '지자체', active: true, adminOnly: true },
};

app.use(express.json());
app.use(cookieParser(SECRET));

// ── API: 출석 등록 (이름 + 부서명) ──
app.post('/api/verify', async (req, res) => {
  const { lectureId, name, dept } = req.body;

  if (!lectureId || !name || !dept) {
    return res.json({ success: false, message: '이름과 부서명을 모두 입력해주세요.' });
  }

  const lecture = LECTURES[lectureId];
  if (!lecture || !lecture.active) {
    return res.json({ success: false, message: '아직 준비되지 않은 강의입니다.' });
  }

  try {
    // UPSERT: 중복이면 무시, 없으면 삽입
    const { rows } = await pool.query(
      `INSERT INTO attendance (name, dept, lecture_id, lecture_name, month)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name, dept, lecture_id) DO NOTHING
       RETURNING timestamp`,
      [name, dept, lectureId, lecture.name, lecture.month]
    );

    let ts;
    if (rows.length > 0) {
      ts = rows[0].timestamp;
      console.log('[ATTENDANCE]', JSON.stringify({ name, dept, lectureId }));
    } else {
      // 이미 존재하는 경우 timestamp 조회
      const existing = await pool.query(
        'SELECT timestamp FROM attendance WHERE name=$1 AND dept=$2 AND lecture_id=$3',
        [name, dept, lectureId]
      );
      ts = existing.rows[0].timestamp;
    }

    let access = {};
    try {
      access = req.signedCookies.gorae_access
        ? JSON.parse(req.signedCookies.gorae_access)
        : {};
    } catch { access = {}; }

    access[lectureId] = { name, dept, timestamp: ts };

    res.cookie('gorae_access', JSON.stringify(access), {
      signed: true,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({ success: true, message: `${name}님, 출석이 확인되었습니다!` });
  } catch (e) {
    console.error('[ERROR] 출석 등록 실패:', e.message);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
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
app.get('/api/admin/lectures', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT lecture_id, COUNT(*) as cnt FROM attendance GROUP BY lecture_id'
    );
    const counts = {};
    rows.forEach(r => { counts[r.lecture_id] = parseInt(r.cnt); });

    const result = {};
    for (const [id, lec] of Object.entries(LECTURES)) {
      result[id] = { ...lec, count: counts[id] || 0 };
    }
    res.json(result);
  } catch (e) {
    console.error('[ERROR] lectures 조회 실패:', e.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── API: 출석부 조회 (관리자용) ──
app.get('/api/admin/attendance', adminAuth, async (req, res) => {
  const monthFilter = req.query.month;
  const lectureFilter = req.query.lecture;

  try {
    let query = 'SELECT name, dept, lecture_id, lecture_name, month, timestamp FROM attendance WHERE 1=1';
    const params = [];
    if (monthFilter) { params.push(monthFilter); query += ` AND month=$${params.length}`; }
    if (lectureFilter) { params.push(lectureFilter); query += ` AND lecture_id=$${params.length}`; }
    query += ' ORDER BY timestamp ASC';

    const { rows } = await pool.query(query, params);

    // 강의별 그룹화
    const grouped = {};
    for (const [id, lec] of Object.entries(LECTURES)) {
      if (monthFilter && lec.month !== monthFilter) continue;
      if (lectureFilter && id !== lectureFilter) continue;
      grouped[id] = {
        name: lec.name, month: lec.month, active: lec.active,
        adminOnly: lec.adminOnly || false, total: 0, attendees: [],
      };
    }

    rows.forEach(entry => {
      if (!grouped[entry.lecture_id]) {
        grouped[entry.lecture_id] = {
          name: entry.lecture_name, month: entry.month || '',
          active: false, total: 0, attendees: [],
        };
      }
      grouped[entry.lecture_id].total++;
      grouped[entry.lecture_id].attendees.push({
        name: entry.name, dept: entry.dept, timestamp: entry.timestamp,
      });
    });

    const months = [...new Set(Object.values(LECTURES).map(l => l.month))];
    res.json({ totalEntries: rows.length, months, lectures: grouped });
  } catch (e) {
    console.error('[ERROR] attendance 조회 실패:', e.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── API: 출석부 CSV 다운로드 ──
app.get('/api/admin/download', adminAuth, async (req, res) => {
  const monthFilter = req.query.month;
  const lectureFilter = req.query.lecture;

  try {
    let query = 'SELECT name, dept, lecture_name, month, timestamp FROM attendance WHERE 1=1';
    const params = [];
    if (monthFilter) { params.push(monthFilter); query += ` AND month=$${params.length}`; }
    if (lectureFilter) { params.push(lectureFilter); query += ` AND lecture_id=$${params.length}`; }
    query += ' ORDER BY timestamp ASC';

    const { rows } = await pool.query(query, params);

    const BOM = '\uFEFF';
    const header = '번호,이름,부서명,강의,월,일시';
    const csvRows = rows.map((e, i) => {
      const dt = new Date(e.timestamp);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
      return `${i + 1},"${e.name}","${e.dept}","${e.lecture_name}","${e.month || ''}","${dateStr}"`;
    });
    const csv = BOM + header + '\n' + csvRows.join('\n');

    let tag = '전체';
    if (lectureFilter) tag = lectureFilter;
    else if (monthFilter) tag = monthFilter;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`출석부_${tag}.csv`)}`);
    res.send(csv);
  } catch (e) {
    console.error('[ERROR] CSV 다운로드 실패:', e.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 관리자 페이지 ──
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── 강의 페이지 접근 보호 ──
Object.keys(LECTURES).forEach(id => {
  const lec = LECTURES[id];

  if (lec.adminOnly) {
    // 지자체 등 관리자 전용: 관리자 키 쿼리로만 접근 (정적 파일은 허용)
    app.use(`/${id}`, (req, res, next) => {
      // 이미지, CSS, JS 등 정적 파일은 통과
      if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|eot)$/i.test(req.path)) return next();
      const key = req.query.key;
      if (key === (process.env.ADMIN_KEY || 'gorae-admin-2026')) return next();
      res.status(403).send('관리자 전용 강의입니다.');
    });
  } else {
    // 일반 강의: 출석 쿠키로 접근
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
  }
});

// ── 정적 파일 서빙 ──
app.use(express.static(path.join(__dirname)));

// ── Fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🐋 고래.I Server running on port ${PORT}`);
      const active = Object.entries(LECTURES)
        .filter(([, v]) => v.active)
        .map(([k]) => k);
      console.log(`Active lectures: ${active.join(', ') || 'none'}`);
    });
  })
  .catch(e => {
    console.error('[FATAL] DB 초기화 실패:', e.message);
    process.exit(1);
  });
