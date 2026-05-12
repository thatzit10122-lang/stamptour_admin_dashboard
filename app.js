/* app.js — 네비게이션, 모달, 토스트, 초기화 */

/* ── 페이지 타이틀 맵 ───────────────────────────── */
const PAGE_TITLES = {
  dashboard: '대시보드',
  gift: '선물 신청자 관리',
  review: '후기 관리',
  notice: '공지사항',
  manual: '수동 인증 요청',
  receipt: '영수증 이벤트',
  store: '상점 관리',
  report: '상세 보고서',
  fraud: '부정사용 관리',
};

const PAGE_ACTIONS = {
  dashboard: '<button class="btn btn-outline" onclick="alert(\'보고서 다운로드\')">⬇ 보고서 다운로드</button>',
  gift: '<button class="btn btn-outline" onclick="exportGiftCSV()">⬇ CSV 내보내기</button><button class="btn btn-primary" onclick="openBulkModal()" style="margin-left:8px">일괄 처리</button>',
  review: '<button class="btn btn-outline">⬇ 후기 내보내기</button>',
  notice: '',
  manual: '',
  receipt: '',
  store: '<button class="btn btn-primary">+ 상점 등록</button>',
  report: '<button class="btn btn-outline">⬇ 보고서 다운로드</button>',
  fraud: '',
};

/* ── 렌더 추적 ──────────────────────────────────── */
const rendered = {};

/* ── 페이지 전환 ────────────────────────────────── */
function showPage(id, navEl) {
  /* 페이지 전환 */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  /* 네비 활성 */
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    const el = document.querySelector(`[data-page="${id}"]`);
    if (el) el.classList.add('active');
  }

  /* 탑바 업데이트 */
  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;
  document.getElementById('topbar-actions').innerHTML = PAGE_ACTIONS[id] || '';

  /* 페이지별 렌더 (최초 1회) */
  if (!rendered[id]) {
    rendered[id] = true;
    switch (id) {
      case 'dashboard': renderDashboard(); break;
      case 'gift':      renderGiftPage(); break;
      case 'review':    renderReviewPage(); break;
      case 'notice':    renderNoticePage(); break;
      case 'manual':    renderManualPage(); break;
      case 'receipt':   renderReceiptPage(); break;
      case 'store':     renderStorePage(); break;
      case 'report':    renderReportPage(); break;
      case 'fraud':     renderFraudPage(); break;
    }
  }
}

/* ── MODAL ──────────────────────────────────────── */
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* ── TOAST ──────────────────────────────────────── */
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = (isError ? '❌ ' : '✅ ') + msg;
  t.style.background = isError ? 'var(--red)' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── INIT ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* 대시보드 초기 로드 */
  showPage('dashboard', document.querySelector('[data-page="dashboard"]'));

  /* 모달 바깥 클릭 닫기 */
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  /* 선물 신청 배지 동적 업데이트 */
  const pendingCnt = DATA.gifts.filter(g => g.status === '대기중').length;
  const badgeEl = document.getElementById('badge-gift');
  if (badgeEl) badgeEl.textContent = pendingCnt;
});
