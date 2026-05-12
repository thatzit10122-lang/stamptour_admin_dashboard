/* app.js — 네비게이션, 모달, 토스트, 초기화 */

/* ── 페이지 메타 ──────────────────────────────── */
const PAGE_META = {
  dashboard: { title:'대시보드',       actions:'' },
  gift:      { title:'선물 신청자 관리', actions:'<button class="btn btn-outline btn-sm" onclick="exportGiftCSV()">⬇ CSV 내보내기</button><button class="btn btn-primary btn-sm" onclick="openBulkModal()" style="margin-left:8px">일괄 처리</button>' },
  review:    { title:'후기 관리',       actions:'<button class="btn btn-outline btn-sm">⬇ 후기 내보내기</button>' },
  notice:    { title:'공지사항',         actions:'<button class="btn btn-primary btn-sm" onclick="showNoticeForm()">+ 새 공지 작성</button>' },
  manual:    { title:'수동 인증 요청',   actions:'' },
  receipt:   { title:'영수증 이벤트',    actions:'' },
  store:     { title:'상점 관리',        actions:'<button class="btn btn-primary btn-sm">+ 상점 등록</button>' },
  report:    { title:'상세 보고서',      actions:'<button class="btn btn-outline btn-sm">⬇ 보고서 다운로드</button>' },
  fraud:     { title:'부정사용 관리',    actions:'' },
};

const PAGE_RENDER = {
  dashboard: renderDashboard,
  gift:      renderGiftPage,
  review:    renderReviewPage,
  notice:    renderNoticePage,
  manual:    renderManualPage,
  receipt:   renderReceiptPage,
  store:     renderStorePage,
  report:    renderReportPage,
  fraud:     renderFraudPage,
};

const rendered = {};

/* ── 페이지 전환 ──────────────────────────────── */
function showPage(id, navEl) {
  /* 페이지 전환 */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + id);
  if (pageEl) pageEl.classList.add('active');

  /* 네비 활성 */
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = navEl || document.querySelector(`[data-page="${id}"]`);
  if (target) target.classList.add('active');

  /* 탑바 업데이트 */
  const meta = PAGE_META[id] || { title: id, actions: '' };
  document.getElementById('topbar-title').textContent  = meta.title;
  document.getElementById('topbar-actions').innerHTML  = meta.actions;

  /* 최초 1회 렌더 */
  if (!rendered[id] && PAGE_RENDER[id]) {
    rendered[id] = true;
    PAGE_RENDER[id]();
  }
}

/* ── MODAL ────────────────────────────────────── */
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* ── TOAST ────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = (isError ? '❌ ' : '✅ ') + msg;
  t.style.background = isError ? 'var(--red)' : 'var(--green)';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* 대시보드 초기 로드 */
  showPage('dashboard', document.querySelector('[data-page="dashboard"]'));

  /* 모달 바깥 클릭 닫기 */
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  /* 선물 대기 배지 카운트 */
  const pending = DATA.gifts.filter(g => g.status === '대기중').length;
  const badgeEl = document.getElementById('badge-gift');
  if (badgeEl) badgeEl.textContent = pending;
});
