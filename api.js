/**
 * api.js — 데이터 페칭 전담 모듈
 * ═══════════════════════════════════════════════════════════════════
 *
 * 📌 [현재 상태] 모든 함수가 mock-data.js의 MOCK_DATA를 반환합니다.
 *    → file:// 로 index.html을 열어도 정상 동작하는 목업 환경입니다.
 *
 * 🔌 [실서버 연동 3단계 체크리스트]
 *    STEP 1. API_CONFIG.BASE_URL 을 실제 서버 주소로 변경
 *    STEP 2. 필요한 경우 API_CONFIG.HEADERS 에 인증 토큰 추가
 *    STEP 3. 각 함수의 "📌 MOCK 반환" 줄을 삭제하고 "🔌 실제 API" 줄의 주석 해제
 *
 * 📋 [삭제할 항목]
 *    연동 완료 후 index.html에서 아래 줄을 반드시 제거하세요:
 *    <script src="mock-data.js"></script>
 *
 * ═══════════════════════════════════════════════════════════════════
 */


/* ══════════════════════════════════════════════════════════════════
   STEP 1 ▼ 서버 API 설정 — 실제 연동 시 이 블록을 수정하세요
══════════════════════════════════════════════════════════════════ */
const API_CONFIG = {
  /**
   * 🔌 STEP 1-1: 실제 API 서버 주소로 교체
   *   - 로컬 개발: 'http://localhost:3000'
   *   - 프로덕션:  'https://api.stamptour.app' (예시)
   *   - 같은 도메인에 API가 있는 경우 빈 문자열('') 유지 가능
   */
  BASE_URL: '',

  /**
   * 🔌 STEP 1-2: 실제 API 경로로 교체
   *   각 path는 BASE_URL 뒤에 붙습니다.
   *   예: BASE_URL='https://api.stamptour.app', dashboard='/v1/dashboard'
   *   → 실제 요청 URL: https://api.stamptour.app/v1/dashboard
   */
  ENDPOINTS: {
    dashboard : '/api/dashboard',      // GET  대시보드 통계 전체
    gifts     : '/api/gifts',          // GET  선물 신청자 목록
    reviews   : '/api/reviews',        // GET  여행후기 목록
    fraud     : '/api/fraud-users',    // GET  부정사용 의심 유저
    receipts  : '/api/receipts',       // GET  영수증 이벤트 목록
    stores    : '/api/stores',         // GET  등록 상점 목록
    manuals   : '/api/manual-auth',    // GET  수동 인증 요청 목록
    notices   : '/api/notices',        // GET  공지사항 목록
    eventInfo : '/api/event-info',     // GET  행사 기본 정보 (행사명, 기간, 코스 등)
    userInfo  : '/api/users',          // GET  유저 상세 정보
  },

  /**
   * 🔌 STEP 1-3: 인증 방식에 맞게 헤더 설정
   *   아래 주석을 해제하고 실제 인증 방식에 맞게 수정하세요.
   *
   *   [방식 A] JWT Bearer 토큰 (가장 일반적):
   *     'Authorization': 'Bearer ' + localStorage.getItem('access_token')
   *
   *   [방식 B] 세션 쿠키 사용 시:
   *     헤더 불필요. fetch() 호출 시 credentials: 'include' 옵션만 추가.
   *
   *   [방식 C] API Key 방식:
   *     'X-API-Key': 'YOUR_API_KEY'
   */
  // HEADERS: {
  //   'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
  //   'Content-Type': 'application/json',
  // },
};
/* ══════════════════════════════════════════════════════════════════
   STEP 1 ▲ 서버 API 설정 끝
══════════════════════════════════════════════════════════════════ */


/* ──────────────────────────────────────────────────────────────────
   공통 fetch 래퍼
   실제 API 연동 시 각 함수에서 이 함수를 호출하세요.
   - 에러 시 Error 객체를 throw하여 호출부의 catch로 전달됩니다.
   - params 객체를 전달하면 QueryString으로 변환됩니다.
     예: apiFetch('/api/gifts', { month: '2026-05', page: 1 })
         → GET /api/gifts?month=2026-05&page=1
────────────────────────────────────────────────────────────────── */
async function apiFetch(endpoint, params = {}) {
  const url = new URL(API_CONFIG.BASE_URL + endpoint, location.href);

  // 🔌 쿼리 파라미터 추가 (연동 시 아래 주석 해제)
  // Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method: 'GET',
    // 🔌 인증 헤더 (연동 시 아래 주석 해제)
    // headers: API_CONFIG.HEADERS,
    // 🔌 세션 쿠키 방식이라면 아래 추가
    // credentials: 'include',
  });

  if (!res.ok) throw new Error(`API 오류 [${res.status}]: ${endpoint}`);
  return res.json();
}


/* ══════════════════════════════════════════════════════════════════
   ① 대시보드 전체 데이터 로드
══════════════════════════════════════════════════════════════════

  [서버 응답 JSON 구조 — 반드시 이 형태를 맞춰야 합니다]
  {
    "summary": {
      "total_users"  : 1200,     // 총 참여 유저 수
      "total_stamps" : 12053,    // 스탬프 총 인증 건수
      "total_reviews": 842,      // 여행후기 총 건수
      "total_gifts"  : 2530,     // 선물 신청자 수
      "avg_stamps"   : 5.2,      // 유저 1인당 평균 스탬프 수
      "gift_conv"    : 20.9      // 선물신청 전환율 (%)
    },
    "daily_stamps"  : [{ "date": "2026-04-24", "count": 210 }, ...],
    "cumul_vals"    : [210, 540, 1050, ...],          // 누적 스탬프 건수 배열
    "place_data"    : [{ "place": "나비생태관", "stamps": 520, "reviews": 45, "conv": 8.6 }, ...],
    "gift_daily"    : [{ "date": "2026-04-24", "count": 12 }, ...],
    "hour_dist"     : [{ "hour": 9, "count": 150 }, ...],
    "dist"          : [{ "stamps": 1, "users": 1500 }, ...],  // 유저별 스탬프 분포
    "region"        : [{ "name": "서울", "count": 253 }, ...],
    "gifts"         : [ ...선물 신청자 배열, 아래 ② 참고... ],
    "reviews"       : [ ...여행후기 배열, 아래 ③ 참고... ],
    "fraud_users"   : [ ...부정사용 배열, 아래 ⑤ 참고... ]
  }
*/
async function fetchDashboard() {
  /* ── 📌 MOCK (목업) — 실제 연동 시 이 줄을 삭제 ── */
  return Promise.resolve(MOCK_DATA);

  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.dashboard);
  */
}


/* ══════════════════════════════════════════════════════════════════
   ② 선물 신청자 목록 로드
══════════════════════════════════════════════════════════════════

  [지원 Query Parameters — 서버에서 구현 필요]
    month   : '2026-05'          // 월 필터
    status  : '대기중'|'지급완료'
    region  : '서울'
    page    : 1                  // 페이지 번호 (서버사이드 페이지네이션 시)
    size    : 30                 // 페이지당 건수

  [서버 응답 배열 항목 구조]
  {
    "no"       : 1,              // 고유 번호 (Primary Key)
    "nick"     : "나비사냥꾼",   // 앱 닉네임
    "name"     : "홍길동",       // 실명
    "phone"    : "010-1234-5678",
    "region"   : "전남",         // 시/도 단위 지역
    "addr"     : "전남 함평군 함평읍...", // 전체 배송 주소
    "detail"   : "101동 202호",  // 상세 주소
    "date"     : "2026-05-01",
    "time"     : "14:32:00",
    "stamps"   : 10,             // 획득 스탬프 수
    "course"   : "1코스",        // 완료 코스 (없으면 null)
    "grade"    : "1코스_10",     // 등급 (없으면 null)
    "status"   : "대기중",       // "대기중"|"처리중"|"지급완료"
    "giftType" : "상품권",       // 선물 유형
    "review"   : true,           // 여행후기 작성 여부
    "reviewCnt": 2,              // 작성한 후기 건수
    "fraud"    : false           // 부정사용 의심 여부
  }

  ⚠️ 데이터가 많아지면 서버사이드 페이지네이션 필수!
     현재는 전체 데이터를 프론트에서 필터링하는 구조입니다.
*/
async function fetchGifts(params = {}) {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.gifts || []);

  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.gifts, params);
  */
}


/* ══════════════════════════════════════════════════════════════════
   ③ 여행후기 목록 로드
══════════════════════════════════════════════════════════════════

  [지원 Query Parameters]
    month  : '2026-05'
    place  : '나비생태관'
    status : '공개'|'숨김'
    page, size

  [서버 응답 배열 항목 구조]
  {
    "no"      : 1,
    "user"    : "나비사냥꾼",    // 닉네임
    "place"   : "나비생태관",
    "date"    : "2026-05-01",
    "time"    : "14:32:00",
    "status"  : "공개",         // "공개"|"숨김"
    "text"    : "정말 좋았어요!", // 후기 본문
    "imageUrl": "https://...",   // 대표 이미지 URL
    "likes"   : 24,
    "comments": 5
  }
*/
async function fetchReviews(params = {}) {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.reviews || []);

  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.reviews, params);
  */
}


/* ══════════════════════════════════════════════════════════════════
   ④ 영수증 이벤트 목록 로드  (신규 API 추가 필요)
══════════════════════════════════════════════════════════════════

  [지원 Query Parameters]
    month  : '2026-05'
    status : '유효한 영수증'|'부적합 영수증'
    page, size

  [서버 응답 배열 항목 구조]
  {
    "no"    : 1,
    "date"  : "2026-05-16",
    "time"  : "14:32",
    "nick"  : "kim_user1",      // 닉네임
    "store" : "나비카페",        // 상호명
    "amount": 15000,            // 인증 금액 (원)
    "status": "유효한 영수증"   // "유효한 영수증"|"부적합 영수증"
  }

  🔌 api.js에 fetchReceipts() 함수 추가 후 연동하세요.
     (현재 pages.js buildReceiptPage() 안에 하드코딩된 더미 데이터 사용 중)
*/
// async function fetchReceipts(params = {}) {
//   return apiFetch(API_CONFIG.ENDPOINTS.receipts, params);
// }


/* ══════════════════════════════════════════════════════════════════
   ⑤ 부정사용 의심 유저 목록 로드
══════════════════════════════════════════════════════════════════

  [서버 응답 배열 항목 구조]
  {
    "user"     : "닉네임",      // 앱 닉네임
    "cnt"      : 5,             // 부정 의심 인증 건수
    "reviewCnt": 0              // 작성한 후기 건수
  }
*/
async function fetchFraudUsers() {
  /* ── 📌 MOCK ── */
  return Promise.resolve(MOCK_DATA.fraud_users || []);

  /* ── 🔌 실제 API 연동 시 위 줄 삭제 후 아래 주석 해제 ──
  return apiFetch(API_CONFIG.ENDPOINTS.fraud);
  */
}


/* ══════════════════════════════════════════════════════════════════
   ⑥ 등록 상점 목록 로드  (신규 API 추가 필요)
══════════════════════════════════════════════════════════════════

  [지원 Query Parameters]
    month  : '2026-05'
    category: '카페'|'음식점'|...

  [서버 응답 배열 항목 구조]
  {
    "date"    : "2026-05-15",
    "name"    : "나비카페",
    "category": "카페",
    "desc"    : "가게 소개글",
    "addr"    : "전남 함평군...",
    "redfoot" : "O"             // "O"|"X" (빨간발자국 등록 여부)
  }

  🔌 api.js에 fetchStores() 함수 추가 후 연동하세요.
*/
// async function fetchStores(params = {}) {
//   return apiFetch(API_CONFIG.ENDPOINTS.stores, params);
// }


/* ══════════════════════════════════════════════════════════════════
   ⑦ 수동 인증 요청 목록 로드  (신규 API 추가 필요)
══════════════════════════════════════════════════════════════════

  [서버 응답 배열 항목 구조]
  {
    "no"    : 1,
    "user"  : "닉네임",
    "place" : "나비생태관",
    "time"  : "2026-05-01 21:00",
    "img"   : "https://...",    // 인증 사진 URL
    "status": "미처리"          // "미처리"|"승인 완료"|"거절됨"
  }

  🔌 api.js에 fetchManualAuth() 함수 추가 후 연동하세요.
*/
// async function fetchManualAuth() {
//   return apiFetch(API_CONFIG.ENDPOINTS.manuals);
// }


/* ══════════════════════════════════════════════════════════════════
   ⑧ 공지사항 목록 로드  (신규 API 추가 필요)
══════════════════════════════════════════════════════════════════

  [서버 응답 배열 항목 구조]
  {
    "id"     : 1,
    "pin"    : true,            // 상단 고정 여부
    "type"   : "🚨 필독",
    "title"  : "공지 제목",
    "date"   : "2026-04-23",
    "views"  : 1240,
    "status" : "게시중",        // "게시중"|"종료"
    "author" : "함평군청 담당자",
    "content": "HTML 형식 본문...",
    "images" : ["https://...", ...] // 첨부 이미지 URL 배열 (없으면 [])
  }

  🔌 api.js에 fetchNotices() 함수 추가 후 연동하세요.
*/
// async function fetchNotices() {
//   return apiFetch(API_CONFIG.ENDPOINTS.notices);
// }


/* ══════════════════════════════════════════════════════════════════
   ⑨ 행사 기본 정보 로드  (신규 API 추가 필요)
══════════════════════════════════════════════════════════════════
   사이드바 행사명, 탑바 기간, 월 필터 옵션, 코스 목록 등을
   동적으로 생성하기 위한 API입니다.

  [서버 응답 JSON 구조]
  {
    "name"      : "함평나비대축제 스탬프투어",
    "startDate" : "2026-04-24",
    "endDate"   : "2026-05-05",
    "hasCourse" : true,         // 코스 사용 여부
    "courses"   : [             // hasCourse=true 일 때만
      { "id": "1코스", "name": "1코스", "grades": ["1코스_5","1코스_10"] },
      { "id": "2코스", "name": "2코스", "grades": ["2코스_5","2코스_9"] },
      { "id": "3코스", "name": "3코스", "grades": ["3코스_13"] }
    ],
    "months"    : ["2026-04", "2026-05"] // 월 필터 드롭다운용
  }

  🔌 api.js에 fetchEventInfo() 함수 추가 후 app.js initApp()에서 호출하세요.
     연동 후 index.html의 하드코딩된 <option> 들을 제거하세요.
*/
// async function fetchEventInfo() {
//   return apiFetch(API_CONFIG.ENDPOINTS.eventInfo);
// }


/* ══════════════════════════════════════════════════════════════════
   WRITE 계열 API (상태 변경)
══════════════════════════════════════════════════════════════════ */

/**
 * ⑩ 선물 지급 상태 단건 업데이트 (모달 방식)
 *
 * 🔌 실제 API:
 *   PATCH /api/gifts/:no
 *   Body: { "status": "지급완료"|"처리중"|"대기중" }
 *   Response: { "success": true, "no": 1, "status": "지급완료" }
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
 * ⑪ 선물 지급 체크박스 즉시 토글 (인라인)
 *
 * 🔌 실제 API:
 *   PATCH /api/gifts/:no
 *   Body: { "status": "지급완료"|"대기중", "paidAt": "2026-05-17T07:00:00Z"|null }
 *   Response: { "success": true, "no": 1, "status": "지급완료", "paidAt": "..." }
 */
async function patchGiftPaid(no, paid) {
  /* ── 📌 MOCK ── */
  console.log(`[MOCK] PATCH /api/gifts/${no}`, {
    status: paid ? '지급완료' : '대기중',
    paidAt: paid ? new Date().toISOString() : null,
  });
  return { success: true };

  /* ── 🔌 실제 API 연동 시 위 블록 삭제 후 아래 주석 해제 ──
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/gifts/${no}`, {
    method: 'PATCH',
    headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: paid ? '지급완료' : '대기중',
      paidAt: paid ? new Date().toISOString() : null,
    }),
  });
  if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
  return res.json();
  */
}


/**
 * ⑫ 선물 일괄 지급 완료 (당첨자 추첨 결과 반영)
 *
 * 🔌 실제 API:
 *   POST /api/gifts/bulk-paid
 *   Body: { "ids": [1, 5, 12, ...], "status": "지급완료" }
 *   Response: { "success": true, "updatedCount": 10 }
 *
 * 🔌 api.js에 bulkPaidGifts() 함수 추가 후
 *    pages.js의 saveDrawWinnersPaid() 안의 MOCK 부분과 교체하세요.
 */
// async function bulkPaidGifts(ids) {
//   const res = await fetch(`${API_CONFIG.BASE_URL}/api/gifts/bulk-paid`, {
//     method: 'POST',
//     headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
//     body: JSON.stringify({ ids, status: '지급완료' }),
//   });
//   if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
//   return res.json();
// }


/**
 * ⑬ 여행후기 공개/숨김 토글
 *
 * 🔌 실제 API:
 *   PATCH /api/reviews/:no/status
 *   Body: { "status": "공개"|"숨김" }
 *   Response: { "success": true }
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


/**
 * ⑭ 수동 인증 일괄 처리
 *
 * 🔌 실제 API:
 *   POST /api/manual-auth/bulk
 *   Body: { "updates": [{ "no": 1, "action": "approve"|"reject" }, ...] }
 *   Response: { "success": true, "processedCount": 3 }
 *
 * 🔌 api.js에 saveManualAuthBulk() 함수 추가 후
 *    pages.js의 saveManualAuth() 안의 MOCK 부분과 교체하세요.
 */
// async function saveManualAuthBulk(updates) {
//   const res = await fetch(`${API_CONFIG.BASE_URL}/api/manual-auth/bulk`, {
//     method: 'POST',
//     headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
//     body: JSON.stringify({ updates }),
//   });
//   if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
//   return res.json();
// }


/**
 * ⑮ 공지사항 등록
 *
 * 🔌 실제 API:
 *   POST /api/notices
 *   Body: {
 *     "type"     : "📢 일반",
 *     "title"    : "공지 제목",
 *     "content"  : "본문...",
 *     "startDate": "2026-05-12",
 *     "endDate"  : "2026-05-31",
 *     "images"   : ["data:image/jpeg;base64,..."] // Base64 or S3 URL
 *   }
 *   Response: { "success": true, "id": 6 }
 *
 * 🔌 api.js에 createNotice() 함수 추가 후
 *    pages.js의 _showNoticeForm() 모달 "게시하기" 버튼과 연결하세요.
 */
// async function createNotice(payload) {
//   const res = await fetch(`${API_CONFIG.BASE_URL}/api/notices`, {
//     method: 'POST',
//     headers: { ...API_CONFIG.HEADERS, 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
//   return res.json();
// }


/* ── 외부 노출 ── */
const API = {
  fetchDashboard,
  fetchGifts,
  fetchReviews,
  fetchFraudUsers,
  updateGiftStatus,
  patchGiftPaid,
  toggleReviewStatus,
  // 연동 후 아래 항목들 주석 해제:
  // fetchReceipts,
  // fetchStores,
  // fetchManualAuth,
  // fetchNotices,
  // fetchEventInfo,
  // bulkPaidGifts,
  // saveManualAuthBulk,
  // createNotice,
};
