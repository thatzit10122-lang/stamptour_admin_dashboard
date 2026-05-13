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
  gift:      { title: '선물 신청자 관리' },
  review:    { title: '후기 관리' },
  notice:    { title: '공지사항' },
  manual:    { title: '수동 인증 요청' },
  receipt:   { title: '영수증 이벤트' },
  store:     { title: '상점 관리' },
  report:    { title: '상세 보고서' },
  fraud:     { title: '부정사용 관리' },
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
};

/* 이미 렌더된 페이지 추적 */
const _rendered = new Set();


/* ════════════════════════════════════════════════
   앱 초기화
════════════════════════════════════════════════ */
async function initApp() {
  try {
    /* ── 데이터 로드 ──
     * ▼ TODO: API 연동 시 fetchDashboard()는 api.js의 설정만 변경하면 됨
     *         이 코드는 수정 불필요
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

  /* 탑바 제목 */
  const meta = PAGE_META[id] || { title: id };
  document.getElementById('topbar-title').textContent = meta.title;

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
