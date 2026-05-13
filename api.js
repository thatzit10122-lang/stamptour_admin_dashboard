/**
 * api.js
 * ─────────────────────────────────────────────────────────────────
 * 데이터 페칭 전담 모듈.
 *
 * 📌 현재 동작 방식 (로컬/목업):
 *    fetch() 없이 mock-data.js에 인라인된 MOCK_DATA를 직접 반환합니다.
 *    → file:// 프로토콜로 index.html을 열어도 정상 동작합니다.
 *
 * 🔌 실제 서버 API 연동 방법:
 *    1) API_CONFIG.BASE_URL을 실제 서버 주소로 설정
 *    2) API_CONFIG.ENDPOINTS를 실제 경로로 교체
 *    3) 각 함수에서 "MOCK 반환" 블록을 제거하고
 *       "🔌 실제 API" 블록의 주석을 해제
 *    4) index.html에서 <script src="mock-data.js"> 태그 제거
 * ─────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════
   ▼▼▼ 서버 API 설정 — 실제 연동 시 이 블록을 수정하세요 ▼▼▼
═══════════════════════════════════════════════════════════════ */
const API_CONFIG = {
  // 🔌 TODO: 실제 API 서버 주소로 교체
  // 예) BASE_URL: 'https://api.yourserver.com/v1/stamptour'
  BASE_URL: '',

  ENDPOINTS: {
    // 🔌 TODO: 실제 API 경로로 교체
    dashboard: '/api/dashboard',
    gifts:     '/api/gifts',
    reviews:   '/api/reviews',
    fraud:     '/api/fraud-users',
  },

  // 🔌 TODO: 인증 토큰이 필요한 경우 아래 주석 해제
  // HEADERS: {
  //   'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  //   'Content-Type': 'application/json',
  // },
};
/* ═══════════════════════════════════════════════════════════════
   ▲▲▲ 서버 API 설정 끝 ▲▲▲
═══════════════════════════════════════════════════════════════ */


/**
 * 공통 fetch 래퍼 (실제 API 연동 시 사용)
 * 🔌 각 함수의 MOCK 블록을 제거하고 이 함수를 호출하세요.
 */
async function apiFetch(endpoint, params = {}) {
  const url = new URL(API_CONFIG.BASE_URL + endpoint, location.href);

  // 🔌 쿼리 파라미터 활성화 시 아래 주석 해제
  // Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method: 'GET',
    // 🔌 인증 헤더 활성화 시 아래 주석 해제
    // headers: API_CONFIG.HEADERS,
  });

  if (!res.ok) throw new Error(`API 오류 [${res.status}]: ${endpoint}`);
  return res.json();
}


/**
 * 대시보드 전체 데이터 로드
 *
 * 예상 API 응답 구조:
 * {
 *   summary, daily_stamps, cumul_vals, place_data,
 *   gift_daily, hour_dist, dist, region,
 *   gifts, reviews, fraud_users
 * }
 */
async function fetchDashboard() {
  /* ── 📌 MOCK (로컬 파일 실행용) ── */
  return Promise.resolve(MOCK_DATA);
  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.dashboard);
  */
}


/**
 * 선물 신청자 목록 로드
 *
 * 🔌 실제 API 예시:
 *   GET /api/gifts?page=1&size=30&status=대기중&region=광주
 *   → [ { no, nick, name, phone, addr, detail, date, time,
 *         stamps, reviewCnt, review, region, status, giftType, fraud }, ... ]
 */
async function fetchGifts(params = {}) {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.gifts || []);
  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.gifts, params);
  */
}


/**
 * 여행후기 목록 로드
 *
 * 🔌 실제 API 예시:
 *   GET /api/reviews?page=1&size=20&place=군립미술관&status=공개
 */
async function fetchReviews(params = {}) {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.reviews || []);
  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.reviews, params);
  */
}


/**
 * 부정사용 의심 유저 목록 로드
 *
 * 🔌 실제 API 예시:
 *   GET /api/fraud-users
 */
async function fetchFraudUsers() {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.fraud_users || []);
  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.fraud);
  */
}


/**
 * 선물 지급 상태 업데이트 (모달 방식)
 *
 * 🔌 실제 API 연동 예시:
 *   PATCH /api/gifts/:no
 *   Body: { status: '지급완료' | '처리중' | '대기중' }
 */
async function updateGiftStatus(no, status) {
  /* ── 📌 MOCK ── */
  console.log(`[MOCK] PATCH /api/gifts/${no}`, { status });
  return { success: true };
  /* ── 🔌 실제 API 연동 시 위 두 줄 삭제 후 아래 주석 해제 ──
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/gifts/${no}`, {
    method: 'PATCH',
    headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
  return res.json();
  */
}


/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 인라인 선물지급 체크박스 → 서버 즉시 전송
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 🔌 실제 API 연동 시 이 함수 본문을 교체:
 *
 *   async function patchGiftPaid(no, paid) {
 *     const res = await fetch(`${API_CONFIG.BASE_URL}/api/gifts/${no}`, {
 *       method: 'PATCH',
 *       headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         status: paid ? '지급완료' : '대기중',
 *         paidAt: paid ? new Date().toISOString() : null,
 *       }),
 *     });
 *     if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
 *     return res.json();  // { success: true, no, status, paidAt }
 *   }
 *
 * 일괄처리(전체선택) API:
 *   PATCH /api/gifts/bulk
 *   Body: { nos: [1,2,5,...], status: '지급완료' }
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function patchGiftPaid(no, paid) {
  /* ── 📌 MOCK ── */
  console.log(`[MOCK] PATCH /api/gifts/${no}`, {
    status: paid ? '지급완료' : '대기중',
    paidAt: paid ? new Date().toISOString() : null,
  });
  return { success: true };
  /* ── 🔌 실제 API 연동 시 위 블록 삭제 후 위의 예시 코드로 교체 ── */
}


/**
 * 후기 공개/숨김 토글
 *
 * 🔌 실제 API 연동 예시:
 *   PATCH /api/reviews/:no/status
 *   Body: { status: '공개' | '숨김' }
 */
async function toggleReviewStatus(no, status) {
  /* ── 📌 MOCK ── */
  console.log(`[MOCK] PATCH /api/reviews/${no}/status`, { status });
  return { success: true };
  /* ── 🔌 실제 API 연동 시 위 두 줄 삭제 후 아래 주석 해제 ──
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/reviews/${no}/status`, {
    method: 'PATCH',
    headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
  return res.json();
  */
}


/* 외부 노출 */
const API = {
  fetchDashboard,
  fetchGifts,
  fetchReviews,
  fetchFraudUsers,
  updateGiftStatus,
  patchGiftPaid,
  toggleReviewStatus,
};
