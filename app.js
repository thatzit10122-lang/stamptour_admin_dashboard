/**
 * app.js
 * ─────────────────────────────────────────────────────────────────
 * 앱 진입점 · 네비게이션 · UI 유틸리티 담당.
 * API 교체 시 이 파일은 수정 불필요.
 * ─────────────────────────────────────────────────────────────────
 */

/* ── 페이지 메타 ── */
const PAGE_META = {
  dashboard: { title: '대시보드' },
  gift:      { title: '선물 신청자' },
  review:    { title: '후기' },
  notice:    { title: '공지사항' },
  manual:    { title: '수동 인증 요청' },
  receipt:   { title: '영수증 이벤트' },
  store:     { title: '상점 관리' },
  report:    { title: '상세 보고서' },
  fraud:     { title: '부정사용 관리' },
  'monthly-report': { title: '월별 운영 보고서(결산)' },
};

const PAGE_BUILD = {
  gift:    Pages.buildGiftPage,
  review:  Pages.buildReviewPage,
  notice:  Pages.buildNoticePage,
  manual:  Pages.buildManualPage,
  receipt: Pages.buildReceiptPage,
  store:   Pages.buildStorePage,
  report:  Pages.buildReportPage,
  fraud:   Pages.buildFraudPage,
  'monthly-report': Pages.buildMonthlyReportPage,
};

/* 이미 렌더된 페이지 추적 */
const _rendered = new Set();


/* ════════════════════════════════════════════════
   앱 초기화
════════════════════════════════════════════════ */
async function initApp() {
  try {
    /* ── 데이터 로드 ──
     * ▼ TODO(API): 대시보드 초기 데이터 연동
     * 실제 서버 API 연동 시 `api.js`의 `fetchDashboard` 내 설정을 변경하십시오.
     * 서버에서는 다음의 형태를 포함하는 JSON을 반환해야 합니다:
     * {
     *   "summary": { "total_stamps": 12053, "total_reviews": 842, "total_gifts": 2530, "gifts_wait": 182, "conv_rate": 20.9 },
     *   "daily_stamps": [ { "date": "2026-04-24", "count": 210 }, ... ],
     *   "cumul_vals": [ 210, 540, 1050, ... ],
     *   "place_data": [ { "place": "나비생태관", "stamps": 520, "reviews": 45, "conv": 8.6 }, ... ],
     *   "gift_daily": [ { "date": "2026-04-24", "count": 12 }, ... ],
     *   "hour_dist": [ { "hour": 9, "count": 150 }, ... ],
     *   "dist": [ { "stamps": 1, "users": 1500 }, ... ],
     *   "region": [ { "name": "서울", "count": 253 }, ... ],
     *   "fraud_users": [ ... ]
     * }
     */
    const data = await API.fetchDashboard();
    /* ▲ */

    /* 데이터를 전역 캐시에 저장 (서브 페이지에서 참조) */
    window._dashData = data;

    /* charts.js에 데이터 주입 */
    Charts.setData(data);

    /* 로딩 숨기기 & 대시보드 표시 — display:block 먼저 설정해야 Plotly가 크기를 정확히 인식 */
    document.getElementById('loading').style.display = 'none';
    document.getElementById('pg-dashboard').style.display = 'block';

    /* 대시보드 HTML 구조 먼저 삽입 */
    Pages.buildDashboard(data);
    _rendered.add('dashboard');

    /* Plotly 차트는 DOM 레이아웃 완료 후 한 프레임 뒤에 그림 */
    setTimeout(() => {
      Charts.drawStampTrend();
      Charts.drawPlaceBar();
      Charts.drawDonut();
      Charts.drawMap();
      Charts.drawRegionBar();
      Charts.drawGiftDaily();
      Charts.drawUserDist();
      Charts.drawHourPattern();
    }, 100);

    /* 배지 업데이트 */
    const waitCnt = data.gifts.filter(g => g.status === '대기중').length;
    document.getElementById('badge-gift').textContent  = waitCnt;
    document.getElementById('badge-fraud').textContent = data.fraud_users.length;

  } catch (err) {
    console.error('데이터 로드 실패:', err);
    document.getElementById('loading').innerHTML = `
      <div style="color:var(--red);text-align:center">
        <div style="font-size:32px;margin-bottom:12px">⚠️</div>
        <div style="font-size:14px;font-weight:700">데이터를 불러올 수 없습니다</div>
        <div style="font-size:12px;color:var(--t3);margin-top:6px">${err.message}</div>
        <button class="btn btn-outline" style="margin-top:16px" onclick="location.reload()">다시 시도</button>
      </div>`;
  }
}


/* ════════════════════════════════════════════════
   페이지 전환
════════════════════════════════════════════════ */
async function goPage(id) {
  /* 네비 활성 */
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (navItem) navItem.classList.add('active');

  /* 탑바 제목 가운데 정렬 */
  const meta = PAGE_META[id] || { title: id };
  document.getElementById('topbar-title').textContent = meta.title;
  
  /* 월별 운영 보고서(결산) 페이지일 때만 특별 처리 */
  const monthSelector = document.getElementById('month-selector');
  const periodInfo = document.getElementById('topbar-period-info');
  const exportBtn = document.getElementById('topbar-export-btn');
  
  if (id === 'monthly-report') {
    /* 월 선택 필터 숨기기, 기간 정보만 표시 */
    monthSelector.style.display = 'none';
    periodInfo.style.display = 'block';
    /* PDF 버튼 함수 변경 */
    exportBtn.onclick = () => exportMonthlyReportPDF();
  } else {
    /* 다른 페이지일 때는 원래대로 */
    monthSelector.style.display = 'block';
    periodInfo.style.display = 'none';
    exportBtn.onclick = () => exportDashboardPDF();
  }

  /* 최초 1회 빌드 (async 완료 후 표시) */
  if (!_rendered.has(id) && PAGE_BUILD[id]) {
    _rendered.add(id);

    /* 빌드 중 로딩 표시 */
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const el = document.getElementById('pg-' + id);
    if (el) {
      el.style.display = 'block';
      el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--t3)"><div class="spinner"></div><p style="margin-top:14px;font-size:13px">데이터를 불러오는 중...</p></div>';
    }

    try {
      await PAGE_BUILD[id](el);
    } catch(err) {
      if (el) el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--red)">&#9888; 페이지 로드 실패: ' + err.message + '<br><button class="btn btn-outline" style="margin-top:16px" onclick="_rendered.delete(\'' + id + '\');goPage(\'' + id + '\')">다시 시도</button></div>';
      console.error('페이지 빌드 오류:', err);
      return;
    }
  }

  /* 페이지 전환 */
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById('pg-' + id);
  if (target) target.style.display = 'block';
}



/* ════════════════════════════════════════════════
   UI 유틸리티
════════════════════════════════════════════════ */
const UI = {
  openModal() {
    document.getElementById('modal-overlay').classList.add('open');
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  },
  toast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = (isError ? '❌ ' : '✅ ') + msg;
    t.style.background = isError ? 'var(--red)' : 'var(--green)';
    t.classList.add('show');
    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  },
  _toastTimer: null,
};


/* ════════════════════════════════════════════════
   이벤트 바인딩
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* 사이드바 네비 클릭 */
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      const page = item.dataset.page;
      if (page) await goPage(page);
    });
  });

/* 모달 바깥 클릭 닫기 */
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) UI.closeModal();
  });

  /* 앱 시작 */
  initApp();
});

/* ════════════════════════════════════════════════
   월 변경 이벤트 (대시보드 필터)
════════════════════════════════════════════════ */
window.onMonthChange = async function() {
  const sel = document.getElementById('month-selector').value;
  // 1. 대시보드 차트 갱신
  if (window._dashData && typeof Charts !== 'undefined') {
    Charts.setMonthFilter(sel); 
  }

  // 2. 다른 메뉴에도 필터 반영을 위해 기존 캐시 무효화
  _rendered.delete('gift');
  _rendered.delete('review');

  // 3. 현재 보고 있는 페이지가 선물신청자나 후기 메뉴라면 즉시 다시 렌더링
  const activeNav = document.querySelector('.nav-item.active');
  const currentPage = activeNav ? activeNav.dataset.page : 'dashboard';
  if (currentPage === 'gift' || currentPage === 'review') {
    await goPage(currentPage);
  }
};

/* ════════════════════════════════════════════════
   보고서 내보내기 (PDF 추출)
════════════════════════════════════════════════ */
window.exportDashboardPDF = function() {
  const element = document.getElementById('pg-dashboard');
  if (!element) return;
  
  UI.toast('보고서를 생성 중입니다. 잠시만 기다려주세요...');
  
  /* 보고서 캔터츠만 복사 (클론) */
  const clone = element.cloneNode(true);
  const temp = document.createElement('div');
  temp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1400px;background:#0d1117;color:#e2e8f0;padding:20px;';
  temp.appendChild(clone);
  document.body.appendChild(temp);
  
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     '스탬프투어_대시보드_보고서.pdf',
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#0d1117' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };
  
  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(temp);
    UI.toast('보고서 다운로드가 완료되었습니다.');
  }).catch(err => {
    document.body.removeChild(temp);
    UI.toast('보고서 생성 중 오류가 발생했습니다.', true);
    console.error(err);
  });
};

window.exportMonthlyReportPDF = function() {
  const element = document.getElementById('pg-monthly-report');
  if (!element) return;
  
  UI.toast('보고서를 생성 중입니다. 잠시만 기다려주세요...');
  
  /* 보고서 캔터츠만 복사 (클론) */
  const clone = element.cloneNode(true);
  const temp = document.createElement('div');
  temp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1200px;background:#0d1117;color:#e2e8f0;padding:20px;';
  temp.appendChild(clone);
  document.body.appendChild(temp);
  
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     '스탬프투어_월별운영보고서.pdf',
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#0d1117' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(temp);
    UI.toast('보고서 다운로드가 완료되었습니다.');
  }).catch(err => {
    document.body.removeChild(temp);
    UI.toast('보고서 생성 중 오류가 발생했습니다.', true);
    console.error(err);
  });
};

/* ════════════════════════════════════════════════
   테마 모드 변경 (다크 / 화이트)
════════════════════════════════════════════════ */
window.toggleTheme = function(mode) {
  const isLight = mode === 'light';
  if (isLight) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  
  if (typeof Charts !== 'undefined' && Charts.setTheme) {
    Charts.setTheme(isLight);
  }
  
  // 현재 페이지의 차트들을 다시 그리기 위해 렌더 캐시 초기화 및 페이지 리로드
  _rendered.clear();
  const activeNav = document.querySelector('.nav-item.active');
  const currentPage = activeNav ? activeNav.dataset.page : 'dashboard';
  goPage(currentPage);
};
