/**
 * pages.js
 * ─────────────────────────────────────────────────────────────────
 * 각 메뉴 페이지의 HTML 생성 및 인터랙션 담당.
 * API 교체 시 데이터 구조 변경이 있는 경우 각 build 함수 내
 * 데이터 참조 부분만 수정하세요.
 * ─────────────────────────────────────────────────────────────────
 */

/* 장소별 색상 매핑 */
const PLACE_COLORS = {
  '군립미술관':                    '#3b82f6',
  '나비곤충생태관':                 '#0ea5e9',
  '나빛파크':                      '#22d3ee',
  '농특산품판매장':                 '#a78bfa',
  '다육식물관':                    '#10b981',
  '수생식물관':                    '#34d399',
  '전통놀이체험':                   '#f472b6',
  '주제영상관':                    '#f59e0b',
  '함평 로컬푸드 직매장':           '#f97316',
  '함평추억공작소(황금박쥐전시관)':  '#818cf8',
};

/** 배지 HTML 생성 */
function _statusBadge(status) {
  const map = {
    '지급완료': '<span class="badge badge-green">✅ 지급완료</span>',
    '처리중':   '<span class="badge badge-blue">⏳ 처리중</span>',
    '대기중':   '<span class="badge badge-red">🔴 대기중</span>',
    '공개':     '<span class="badge badge-green">공개</span>',
    '숨김':     '<span class="badge badge-gray">숨김</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}

/** 순위 클래스 */
function _rankCls(i) {
  return i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n';
}

/** 성과 배지 */
function _perfBadge(conv) {
  if (conv >= 12) return '<span class="badge badge-green">최우수</span>';
  if (conv >= 9)  return '<span class="badge badge-blue">우수</span>';
  if (conv >= 7)  return '<span class="badge badge-yellow">보통</span>';
  return '<span class="badge badge-gray">관심</span>';
}

/** 스탬프 점 표시 */
function _stampDots(n, total = 10) {
  return Array.from({ length: total }, (_, i) =>
    `<div class="stamp-dot ${i < n ? 'on' : 'off'}"></div>`
  ).join('');
}


/* ════════════════════════════════════════════════
   대시보드 초기화
   (HTML 요소에 데이터 채우기 + 차트 호출)
════════════════════════════════════════════════ */
function buildDashboard(data) {
  /* KPI */
  const s = data.summary;
  const reviewConv = (data.reviews.length / s.total_users * 100).toFixed(1);
  document.getElementById('kpi-grid').innerHTML = [
    { ic:'👥', val:s.total_users.toLocaleString(),   lbl:'총 참여자',   tag:`스탬프 인증 유저`,          cls:'badge-blue' },
    { ic:'🔖', val:s.total_stamps.toLocaleString(),  lbl:'스탬프 인증', tag:`인당 평균 ${s.avg_stamps}개`, cls:'badge-blue' },
    { ic:'✍️', val:s.total_reviews.toLocaleString(), lbl:'여행후기',    tag:`후기 전환율 ${reviewConv}%`, cls:'badge-purple' },
    { ic:'🎁', val:s.total_gifts.toLocaleString(),   lbl:'선물 신청자', tag:`참여자 대비 ${s.gift_conv}%`, cls:'badge-yellow' },
  ].map(k => `
    <div class="kpi-card">
      <div class="kpi-icon">${k.ic}</div>
      <div class="kpi-val" style="color:var(--blue)">${k.val}</div>
      <div class="kpi-label">${k.lbl}</div>
      <div class="badge ${k.cls}" style="margin-top:7px">${k.tag}</div>
    </div>`).join('');

  /* 퍼널 */
  const steps = [
    { n: s.total_users,    l: '앱 참여자',    p: '100%', w: 100 },
    { n: s.total_users,    l: '스탬프 인증자', p: '100%', w: 100 },
    { n: s.total_reviews,  l: '후기 작성자',  p: reviewConv + '%', w: parseFloat(reviewConv) },
    { n: s.total_gifts,    l: '선물 신청자',  p: s.gift_conv + '%', w: s.gift_conv },
    { n: '—',              l: '선물 지급완료', p: '—', w: 0 },
  ];
  document.getElementById('funnel-card').innerHTML = steps.map(st => `
    <div class="funnel-step">
      <div class="funnel-num">${st.n}</div>
      <div class="funnel-label">${st.l}</div>
      <div class="funnel-pct">${st.p}</div>
      <div class="funnel-bar"><div class="funnel-fill" style="width:${st.w}%"></div></div>
    </div>`).join('');

  /* 장소 성과 테이블 */
  const maxS = Math.max(...data.place_data.map(p => p.stamps));
  const COLS = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];
  document.getElementById('place-tbody').innerHTML = data.place_data.map((p, i) => {
    const bw = (p.stamps / maxS * 100).toFixed(0);
    const cc = p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--t3)';
    return `<tr>
      <td><span class="rank ${_rankCls(i)}">${i+1}</span></td>
      <td class="bold">${p.place}</td>
      <td class="right bold">${p.stamps.toLocaleString()}</td>
      <td class="right">${p.reviews}</td>
      <td class="right bold" style="color:${cc}">${p.conv}%</td>
      <td>
        <div class="perf-bar-wrap">
          <div class="perf-bar-fill" style="width:${bw}%;background:${COLS[i]||'#3b82f6'}"></div>
        </div>
        <span class="text-xs text-muted">${(p.stamps/s.total_stamps*100).toFixed(1)}%</span>
      </td>
      <td class="center">${_perfBadge(p.conv)}</td>
    </tr>`;
  }).join('');

  /* 부정사용 배지 */
  document.getElementById('badge-fraud').textContent = data.fraud_users.length;
  document.getElementById('fraud-alert-text').textContent = `부정사용 의심 ${data.fraud_users.length}건`;

  /* 차트는 app.js의 initApp()에서 setTimeout(100)으로 DOM 렌더 후 실행 */
  /* (이중 호출 방지를 위해 여기서는 호출하지 않음) */
}


/* ════════════════════════════════════════════════
   선물 신청자 관리
════════════════════════════════════════════════ */
let _gifts = [];
let _gFiltered = [];
let _gPage = 1;
const _gPer = 30;   /* 페이지당 30건 */
let _gSort = 'no', _gAsc = true;

async function buildGiftPage(el) {
  /* ▼ TODO: API 연동 시 fetchGifts()로 서버에서 직접 수신 */
  _gifts = await API.fetchGifts();
  /* ▲ */

  const done  = _gifts.filter(g => g.status === '지급완료').length;
  const proc  = _gifts.filter(g => g.status === '처리중').length;
  const wait  = _gifts.filter(g => g.status === '대기중').length;
  const total = _gifts.length;
  const regions = [...new Set(_gifts.map(g => g.region))].sort();

  el.innerHTML = `
  <div class="kpi-grid mb20">
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--yellow)">${total}</div><div class="kpi-label">총 신청자</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">${done}</div><div class="kpi-label">지급 완료</div><div class="badge badge-green" style="margin-top:7px">${(done/total*100).toFixed(1)}%</div></div>
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--blue)">${proc}</div><div class="kpi-label">처리 중</div><div class="badge badge-blue" style="margin-top:7px">${(proc/total*100).toFixed(1)}%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-val" style="color:var(--red)">${wait}</div><div class="kpi-label">대기 중</div><div class="badge badge-red" style="margin-top:7px">처리 필요</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="card-title">📅 일별 선물신청 추이</div><div class="card-sub">전체 기간</div><div id="g-daily" class="chart h220"></div></div>
    <div class="card"><div class="card-title">📊 처리 상태 현황</div><div class="card-sub">지급 진행 현황</div><div id="g-donut" class="chart h220"></div></div>
  </div>
  <div class="card">
    <div class="card-title">📋 선물 신청자 목록</div>
    <div class="card-sub">총 ${total}명 · 닉네임 클릭 시 유저 정보 페이지로 이동 · 선물지급 체크박스로 즉시 처리</div>
    <div class="filter-bar">
      <div class="search-wrap"><input id="g-q" type="text" placeholder="닉네임·실명 검색…" oninput="Pages.filterGifts()"></div>
      <select class="filter-select" id="g-st" onchange="Pages.filterGifts()">
        <option value="">전체 상태</option>
        <option value="지급완료">✅ 지급완료</option>
        <option value="처리중">⏳ 처리중</option>
        <option value="대기중">🔴 대기중</option>
      </select>
      <select class="filter-select" id="g-rg" onchange="Pages.filterGifts()">
        <option value="">전체 지역</option>
        ${regions.map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <select class="filter-select" id="g-rv" onchange="Pages.filterGifts()">
        <option value="">후기 전체</option>
        <option value="true">작성</option>
        <option value="false">미작성</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="Pages.exportGiftCSV()">⬇ CSV</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:44px" class="center">
              <!-- 전체선택 체크박스 -->
              <input type="checkbox" id="g-chk-all" title="전체 선택"
                style="width:15px;height:15px;cursor:pointer;accent-color:var(--blue)"
                onchange="Pages._toggleAllPaid(this.checked)">
            </th>
            <th class="sortable" onclick="Pages.sortGifts('no')"># ↕</th>
            <th class="sortable" onclick="Pages.sortGifts('nick')">닉네임 ↕</th>
            <th>실명</th>
            <th>전화번호</th>
            <th class="sortable" onclick="Pages.sortGifts('region')">주소 ↕</th>
            <th class="sortable" onclick="Pages.sortGifts('stamps')">후기 ↕</th>
            <th>선물지급</th>
          </tr>
        </thead>
        <tbody id="g-tbody"></tbody>
      </table>
    </div>
    <div class="pagination">
      <div class="pgn-info" id="g-pgn-info"></div>
      <div class="pgn-btns" id="g-pgn-btns"></div>
    </div>
  </div>`;

  _gFiltered = [..._gifts];
  _renderGiftTable();

  /* 차트: DOM 삽입 후 100ms 뒤에 그려야 Plotly가 크기를 정확히 인식 */
  setTimeout(() => {
    Charts.drawGiftDaily('g-daily');
    Charts.drawGiftStatusDonut('g-donut', done, proc, wait, total);
  }, 100);
}

function filterGifts() {
  const q  = document.getElementById('g-q')?.value.toLowerCase() || '';
  const st = document.getElementById('g-st')?.value || '';
  const rg = document.getElementById('g-rg')?.value || '';
  const rv = document.getElementById('g-rv')?.value || '';
  _gFiltered = _gifts.filter(g => {
    if (q  && !g.nick.toLowerCase().includes(q) && !g.name.includes(q)) return false;
    if (st && g.status !== st) return false;
    if (rg && g.region !== rg) return false;
    if (rv === 'true'  && !g.review) return false;
    if (rv === 'false' && g.review)  return false;
    return true;
  });
  _gPage = 1;
  _renderGiftTable();
}

function sortGifts(key) {
  if (key === _gSort) _gAsc = !_gAsc;
  else { _gSort = key; _gAsc = true; }
  _gFiltered.sort((a, b) =>
    typeof a[key] === 'string'
      ? (_gAsc ? a[key].localeCompare(b[key], 'ko') : b[key].localeCompare(a[key], 'ko'))
      : (_gAsc ? a[key] - b[key] : b[key] - a[key])
  );
  _gPage = 1;
  _renderGiftTable();
}

function _renderGiftTable() {
  const start = (_gPage - 1) * _gPer;
  const slice = _gFiltered.slice(start, start + _gPer);
  const tbody = document.getElementById('g-tbody');
  if (!tbody) return;

  tbody.innerHTML = slice.map(g => {
    /* 지급완료 여부 */
    const isPaid   = g.status === '지급완료';
    const chkStyle = `width:16px;height:16px;cursor:pointer;accent-color:var(--green)`;
    /* 부정 사용자: 닉네임 강조 (fraud 필드 없으면 false 처리) */
    const isFraud  = !!g.fraud;
    const nickCls  = isFraud
      ? 'style="color:var(--red);font-weight:700;text-decoration:underline;cursor:pointer"'
      : 'style="color:var(--blue);font-weight:600;text-decoration:underline;cursor:pointer"';
    const fraudTag = isFraud ? ' <span class="badge badge-red" style="font-size:9px">부정</span>' : '';

    return `<tr id="g-row-${g.no}" class="${isPaid ? 'paid-row' : ''}">
      <td class="center">
        <!-- ──────────────────────────────────────────────────────────
          선물지급 체크박스
          변경 시 Pages._onPaidChange(no, checked) 호출 →
          서버 PATCH /api/gifts/:no { status } 전송
        ────────────────────────────────────────────────────────── -->
        <input type="checkbox" class="g-chk-row" data-no="${g.no}"
          ${isPaid ? 'checked' : ''}
          style="${chkStyle}"
          onchange="Pages._onPaidChange(${g.no}, this.checked)">
      </td>
      <td class="text-muted text-sm">${g.no}</td>
      <td>
        <span ${nickCls}
          onclick="Pages.openUserPage('${g.nick}')"
          title="${isFraud ? '⚠️ 부정사용 의심 — 클릭하여 유저 정보 확인' : '클릭하여 유저 정보 확인'}">
          ${g.nick}${fraudTag}
        </span>
      </td>
      <td>${g.name}</td>
      <td class="mono text-muted">${g.phone}</td>
      <td style="font-size:12px">${g.addr}</td>
      <td class="center">
        ${g.review
          ? `<span class="badge badge-green">✓ ${g.reviewCnt ?? ''}건</span>`
          : '<span class="badge badge-gray">—</span>'}
      </td>
      <td class="center">
        ${isPaid
          ? '<span class="badge badge-green">✅ 지급완료</span>'
          : '<span class="badge badge-red">🔴 미지급</span>'}
      </td>
    </tr>`;
  }).join('');

  /* 전체선택 체크박스 동기화 */
  _syncSelectAll();

  _renderPagination('g-pgn-info','g-pgn-btns', _gFiltered.length, _gPage, _gPer,
    p => { _gPage = p; _renderGiftTable(); });
}

/* ────────────────────────────────────────────────────────────────
   _onPaidChange — 인라인 선물지급 체크박스 변경 처리 + 서버 전송
   ────────────────────────────────────────────────────────────────
   [서버 전송 예시 코드]
   실제 운영 시 아래 API.patchGiftPaid() 함수(api.js)를 구현하세요.

   async function patchGiftPaid(no, paid) {
     const res = await fetch(`/api/gifts/${no}`, {
       method: 'PATCH',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + YOUR_AUTH_TOKEN,
       },
       body: JSON.stringify({
         status: paid ? '지급완료' : '대기중',   // 서버가 기대하는 값
         paidAt: paid ? new Date().toISOString() : null,
       }),
     });
     if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
     return res.json();   // { success: true, no, status }
   }
──────────────────────────────────────────────────────────────── */
async function _onPaidChange(no, paid) {
  const g = _gifts.find(x => x.no === no);
  if (!g) return;

  const newStatus = paid ? '지급완료' : '대기중';

  /* 낙관적 UI 업데이트 — 서버 응답 전에 먼저 화면에 반영 */
  g.status = newStatus;
  const row = document.getElementById(`g-row-${no}`);
  if (row) {
    const badgeCell = row.querySelector('td:last-child');
    if (badgeCell) {
      badgeCell.innerHTML = paid
        ? '<span class="badge badge-green">✅ 지급완료</span>'
        : '<span class="badge badge-red">🔴 미지급</span>';
    }
    row.classList.toggle('paid-row', paid);
  }
  _syncSelectAll();

  try {
    /* ▼ TODO: 실제 API 연동 — api.js의 patchGiftPaid(no, paid) 구현 후 아래 주석 해제 */
    // await API.patchGiftPaid(no, paid);
    /* ▲ */

    /* ── mock: 콘솔 출력 (실제 서버 없음) ── */
    console.log(`[API MOCK] PATCH /api/gifts/${no}`, {
      status: newStatus,
      paidAt: paid ? new Date().toISOString() : null,
    });

    UI.toast(`${g.nick} — ${newStatus}`);
  } catch (err) {
    /* 실패 시 롤백 */
    g.status = paid ? '대기중' : '지급완료';
    _renderGiftTable();
    UI.toast(`저장 실패: ${err.message}`, true);
  }
}

/* 전체선택 체크박스 토글 → 현재 페이지 행 일괄 처리 */
function _toggleAllPaid(checked) {
  const rows = document.querySelectorAll('.g-chk-row');
  rows.forEach(chk => {
    const no = parseInt(chk.dataset.no, 10);
    if (chk.checked !== checked) {
      chk.checked = checked;
      _onPaidChange(no, checked);
    }
  });
}

/* 전체선택 체크박스 상태 동기화 */
function _syncSelectAll() {
  const all     = document.querySelectorAll('.g-chk-row');
  const checked = document.querySelectorAll('.g-chk-row:checked');
  const el = document.getElementById('g-chk-all');
  if (!el || all.length === 0) return;
  el.checked       = all.length === checked.length;
  el.indeterminate = checked.length > 0 && checked.length < all.length;
}

/* 닉네임 클릭 → 유저 정보 페이지 이동 */
function openUserPage(nick) {
  const g = _gifts.find(x => x.nick === nick);
  if (!g) return;
  /* ▼ TODO: 실제 유저 정보 페이지 URL로 교체 */
  // window.location.href = `/admin/users/${encodeURIComponent(nick)}`;
  /* ▲ */

  /* 현재는 모달로 유저 정보 표시 */
  document.getElementById('modal-title').textContent = `👤 유저 정보 — ${g.nick}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-row">
      <div class="modal-field"><label>닉네임</label><div class="val bold">${g.nick}</div></div>
      <div class="modal-field"><label>실명</label><div class="val">${g.name}</div></div>
      <div class="modal-field"><label>전화번호</label><div class="val mono">${g.phone}</div></div>
      <div class="modal-field"><label>신청일시</label><div class="val">${g.date} ${g.time}</div></div>
    </div>
    <div class="modal-field-full"><label>배송 주소</label>
      <div class="val">${g.addr}<br><span class="text-muted text-sm">${g.detail}</span></div>
    </div>
    <hr class="modal-divider">
    <div class="modal-row">
      <div class="modal-field"><label>스탬프</label>
        <div style="margin-top:6px">
          <div class="stamp-dots">${_stampDots(g.stamps, 10).replace(/class="stamp-dot/g, 'class="stamp-dot big')}</div>
          <div class="text-muted text-sm" style="margin-top:4px">${g.stamps}/10개</div>
        </div>
      </div>
      <div class="modal-field"><label>현재 상태</label><div style="margin-top:6px">${_statusBadge(g.status)}</div></div>
      <div class="modal-field"><label>선물 유형</label><div style="margin-top:6px"><span class="badge badge-purple">${g.giftType}</span></div></div>
      <div class="modal-field"><label>여행후기</label><div style="margin-top:6px">${g.review ? '<span class="badge badge-green">✓ 작성완료</span>' : '<span class="badge badge-gray">미작성</span>'}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="UI.closeModal()">닫기</button>
    </div>`;
  UI.openModal();
}

/* 하위 호환 — 기존 openGiftDetail 호출부가 있을 경우를 위해 유지 */
function openGiftDetail(nick) { openUserPage(nick); }

/* _updateGiftStatus — 모달 내 상태 변경 (기존 기능 유지, 필요시 사용) */
async function _updateGiftStatus(nick, status) {
  const g = _gifts.find(x => x.nick === nick);
  if (!g) return;
  await API.updateGiftStatus(g.no, status);
  g.status = status;
  UI.toast(`${nick} → ${status}`);
  UI.closeModal();
  _renderGiftTable();
}

function exportGiftCSV() {
  const rows = [['번호','닉네임','실명','전화번호','지역','주소','신청일','상태','스탬프','후기']];
  _gFiltered.forEach(g => rows.push([
    g.no, g.nick, g.name, g.phone, g.region,
    `"${g.addr}"`, g.date, g.status, g.stamps, g.review ? 'O' : 'X',
  ]));
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'));
  a.download = '선물신청자.csv';
  a.click();
  UI.toast('CSV 내보내기 완료');
}

/* openBulkModal / _applyBulk — 이전 코드에서 제거 */
function openBulkModal() {} /* 사용하지 않음 */
function _applyBulk()    {} /* 사용하지 않음 */


/* ════════════════════════════════════════════════
   후기 관리
════════════════════════════════════════════════ */
let _reviews = [];
let _rFiltered = [];
let _rPage = 1;
const _rPer = 20;
let _rTab = 'all';

async function buildReviewPage(el) {
  /* ▼ TODO: API 연동 시 fetchReviews()로 서버에서 직접 수신 */
  _reviews = await API.fetchReviews();
  /* ▲ */

  const pd = window._dashData?.place_data || [];
  const maxS = pd.length ? Math.max(...pd.map(p=>p.stamps)) : 1;
  const pubCnt = _reviews.filter(r => r.status === '공개').length;
  const hidCnt = _reviews.filter(r => r.status === '숨김').length;
  const maxConv = pd.length ? Math.max(...pd.map(p=>p.conv)) : 0;
  const maxConvPlace = pd.find(p => p.conv === maxConv)?.place || '—';

  el.innerHTML = `
  <div class="kpi-grid mb20">
    <div class="kpi-card"><div class="kpi-icon">✍️</div><div class="kpi-val" style="color:var(--purple)">${_reviews.length}</div><div class="kpi-label">총 후기</div></div>
    <div class="kpi-card"><div class="kpi-icon">👁</div><div class="kpi-val" style="color:var(--green)">${pubCnt}</div><div class="kpi-label">공개 중</div><div class="badge badge-green" style="margin-top:7px">${(pubCnt/_reviews.length*100).toFixed(1)}%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🚫</div><div class="kpi-val" style="color:var(--t3)">${hidCnt}</div><div class="kpi-label">숨김</div></div>
    <div class="kpi-card"><div class="kpi-icon">🏆</div><div class="kpi-val" style="color:var(--cyan)">${maxConv}%</div><div class="kpi-label">최고 전환율</div><div class="badge badge-blue" style="margin-top:7px">${maxConvPlace}</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="card-title">📅 일별 후기 추이</div><div class="card-sub">전체 기간</div><div id="rv-daily" class="chart h220"></div></div>
    <div class="card"><div class="card-title">📍 장소별 인증 vs 후기</div><div class="card-sub">그룹 바 비교</div><div id="rv-place" class="chart h220"></div></div>
  </div>
  <div class="card mb20">
    <div class="card-title">📊 장소별 후기 전환율</div>
    <div class="card-sub">스탬프 인증 대비 후기 작성 비율</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>장소명</th><th class="right">스탬프</th><th class="right">후기</th><th class="right">전환율</th><th>비중</th></tr></thead>
        <tbody>${[...pd].sort((a,b)=>b.conv-a.conv).map(p => {
          const cc = p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--t3)';
          const bw = (p.stamps/maxS*100).toFixed(0);
          const col = PLACE_COLORS[p.place] || '#3b82f6';
          return `<tr>
            <td class="bold">${p.place}</td>
            <td class="right">${p.stamps.toLocaleString()}</td>
            <td class="right">${p.reviews}</td>
            <td class="right bold" style="color:${cc}">${p.conv}%</td>
            <td>
              <div class="mini-bar-wrap">
                <div class="mini-bar-fill" style="width:${bw}%;background:${col}"></div>
              </div>
              <span class="text-xs text-muted">${bw}%</span>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <div class="tab-bar">
      <div class="tab active" onclick="Pages._switchRevTab(this,'all')">전체 <span class="badge badge-blue" style="margin-left:4px">${_reviews.length}</span></div>
      <div class="tab" onclick="Pages._switchRevTab(this,'public')">공개 <span class="badge badge-green" style="margin-left:4px">${pubCnt}</span></div>
      <div class="tab" onclick="Pages._switchRevTab(this,'hidden')">숨김 <span class="badge badge-gray" style="margin-left:4px">${hidCnt}</span></div>
    </div>
    <div class="filter-bar">
      <div class="search-wrap"><input id="r-q" type="text" placeholder="유저명 검색…" oninput="Pages.filterReviews()"></div>
      <select class="filter-select" id="r-pl" onchange="Pages.filterReviews()">
        <option value="">전체 장소</option>
        ${Object.keys(PLACE_COLORS).map(p => `<option value="${p}">${p}</option>`).join('')}
      </select>
      <select class="filter-select" id="r-dt" onchange="Pages.filterReviews()">
        <option value="">전체 날짜</option>
        ${[...new Set(_reviews.map(r=>r.date))].sort().reverse().map(d=>`<option value="${d}">${d.slice(5)}</option>`).join('')}
      </select>
    </div>
    <div id="rv-list"></div>
    <div class="pagination">
      <div class="pgn-info" id="r-pgn-info"></div>
      <div class="pgn-btns" id="r-pgn-btns"></div>
    </div>
  </div>`;

  _rFiltered = [..._reviews];
  _renderReviewList();

  /* 차트: DOM 삽입 후 100ms 뒤에 렌더 */
  setTimeout(() => {
    const rdMap = {};
    _reviews.forEach(r => { rdMap[r.date] = (rdMap[r.date]||0)+1; });
    const rds = Object.entries(rdMap).sort();
    Plotly.newPlot('rv-daily', [{
      x: rds.map(([d])=>d.slice(5).replace('-','/')), y: rds.map(([,v])=>v),
      type:'scatter', mode:'lines+markers',
      line:{color:'#a78bfa',width:2.5,shape:'spline'},
      marker:{color:'#a78bfa',size:6,line:{width:2,color:'#1a2233'}},
      fill:'tozeroy', fillcolor:'rgba(167,139,250,0.09)',
      hovertemplate:'<b>%{x}</b><br>후기 %{y}건<extra></extra>',
    }], {
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)',
      font:{family:"'Noto Sans KR',sans-serif",color:'#64748b',size:12},
      margin:{t:10,r:16,b:40,l:44}, showlegend:false,
      xaxis:{gridcolor:'rgba(30,45,69,0.85)',tickfont:{size:12},zeroline:false,showgrid:false},
      yaxis:{gridcolor:'rgba(30,45,69,0.85)',tickfont:{size:12},zeroline:false},
    }, {responsive:true,displayModeBar:false});
    Charts.drawReviewPlaceBar('rv-place');
  }, 100);
}

function _switchRevTab(el, mode) {
  document.querySelectorAll('#pg-review .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  _rTab = mode; _rPage = 1; filterReviews();
}

function filterReviews() {
  const q  = document.getElementById('r-q')?.value.toLowerCase() || '';
  const pl = document.getElementById('r-pl')?.value || '';
  const dt = document.getElementById('r-dt')?.value || '';
  _rFiltered = _reviews.filter(r => {
    if (_rTab === 'public' && r.status !== '공개') return false;
    if (_rTab === 'hidden' && r.status !== '숨김') return false;
    if (q  && !r.user.toLowerCase().includes(q)) return false;
    if (pl && r.place !== pl) return false;
    if (dt && r.date  !== dt) return false;
    return true;
  });
  _rPage = 1;
  _renderReviewList();
}

function _renderReviewList() {
  const start = (_rPage - 1) * _rPer;
  const slice = _rFiltered.slice(start, start + _rPer);
  const list = document.getElementById('rv-list');
  if (!list) return;

  list.innerHTML = slice.map(r => {
    const col = PLACE_COLORS[r.place] || '#3b82f6';
    return `<div class="review-item ${r.status==='숨김'?'hidden':''}">
      <span class="rev-no">${r.no}</span>
      <span class="rev-user">${r.user}</span>
      <div class="rev-place">
        <span class="place-tag" style="background:${col}18;color:${col};border:1px solid ${col}30">${r.place}</span>
      </div>
      <span class="rev-date">${r.date.slice(5)}<br><span style="font-size:10px">${r.time}</span></span>
      <div class="rev-actions">
        ${_statusBadge(r.status)}
        <button class="btn ${r.status==='공개'?'btn-danger':'btn-success'} btn-xs" onclick="Pages._toggleReview(${r.no})">${r.status==='공개'?'숨김':'공개'}</button>
      </div>
    </div>`;
  }).join('');

  _renderPagination('r-pgn-info','r-pgn-btns', _rFiltered.length, _rPage, _rPer,
    p => { _rPage = p; _renderReviewList(); });
}

async function _toggleReview(no) {
  const r = _reviews.find(x => x.no === no);
  if (!r) return;
  const next = r.status === '공개' ? '숨김' : '공개';
  /* ▼ TODO: 실제 API 연동 시 API.toggleReviewStatus(no, next) 결과를 확인하여 처리 */
  await API.toggleReviewStatus(no, next);
  r.status = next;
  /* ▲ */
  UI.toast(`후기 #${no} → ${next}`);
  filterReviews();
}


/* ════════════════════════════════════════════════
   나머지 페이지들
════════════════════════════════════════════════ */
function buildNoticePage(el) {
  const notices = [
    {pin:true, type:'📢', title:'[필독] 함평나비대축제 스탬프투어 운영 안내', date:'2026-04-23', views:1240, status:'게시중'},
    {pin:false,type:'🎉', title:'스탬프 10개 완성 시 특별 경품 추첨 이벤트', date:'2026-04-24', views:890,  status:'게시중'},
    {pin:false,type:'🔧', title:'앱 v2.1.3 업데이트 — 스탬프톡 기능 개선',  date:'2026-04-26', views:432,  status:'게시중'},
    {pin:false,type:'📢', title:'선물 신청 마감 안내 (5월 10일까지)',         date:'2026-05-04', views:678,  status:'게시중'},
    {pin:false,type:'⚠️', title:'일부 장소 QR코드 교체 작업 (수생식물관)',   date:'2026-04-28', views:215,  status:'종료'},
  ];
  el.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div style="font-size:15px;font-weight:700">📢 공지사항</div>
    <button class="btn btn-primary btn-sm" onclick="Pages._showNoticeForm()">+ 새 공지 작성</button>
  </div>
  <div class="card">
    <div class="filter-bar">
      <div class="search-wrap"><input type="text" placeholder="공지 제목 검색…"></div>
      <select class="filter-select"><option>전체</option><option>공지</option><option>이벤트</option></select>
    </div>
    ${notices.map(n => `
    <div class="notice-item">
      <div class="notice-pin">${n.pin ? '📌' : '📄'}</div>
      <div class="notice-body">
        <div class="notice-title">${n.type} ${n.title}</div>
        <div class="notice-meta">
          <span>${n.date}</span> · <span>조회 ${n.views.toLocaleString()}회</span> ·
          <span class="badge ${n.status==='게시중'?'badge-green':'badge-gray'}">${n.status}</span>
        </div>
      </div>
      <div class="notice-actions">
        <button class="btn btn-outline btn-sm">수정</button>
        <button class="btn btn-danger btn-sm">삭제</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function _showNoticeForm() {
  document.getElementById('modal-title').textContent = '✏️ 새 공지 작성';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label class="form-label">유형</label><select class="form-input"><option>📢 일반</option><option>🎉 이벤트</option><option>🔧 업데이트</option><option>⚠️ 긴급</option></select></div>
    <div class="form-group"><label class="form-label">제목</label><input class="form-input" type="text" placeholder="공지 제목"></div>
    <div class="form-group"><label class="form-label">내용</label><textarea class="form-textarea" placeholder="공지 내용…"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">시작일</label><input class="form-input" type="date" value="2026-05-12"></div>
      <div class="form-group"><label class="form-label">종료일</label><input class="form-input" type="date" value="2026-05-31"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="UI.toast('공지가 게시됐습니다');UI.closeModal()">게시하기</button>
      <button class="btn btn-outline" onclick="UI.closeModal()">취소</button>
    </div>`;
  UI.openModal();
}

function buildManualPage(el) {
  const pendings = [
    {user:'닉네임2', place:'장소명2', time:'2025-11-01 21:00', icon:'🏛️'},
    {user:'닉네임1', place:'장소명1', time:'2025-11-01 08:30', icon:'🌿'},
    {user:'닉네임00',place:'장소명1', time:'2025-11-01 07:15', icon:'🌸'},
  ];
  el.innerHTML = `
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--yellow)">3</div><div class="kpi-label">대기 중</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">47</div><div class="kpi-label">승인 완료</div></div>
    <div class="kpi-card"><div class="kpi-icon">❌</div><div class="kpi-val" style="color:var(--red)">8</div><div class="kpi-label">거절</div></div>
  </div>
  <div class="card">
    <div class="card-title">✅ 수동 인증 대기 <span class="badge badge-yellow" style="margin-left:8px">3건</span></div>
    <div class="card-sub">사진 인증 요청 · 검토 후 승인 또는 거절하세요</div>
    ${pendings.map(p => `
    <div class="auth-card">
      <div class="auth-img">${p.icon}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${p.user}</div>
        <div style="font-size:12px;color:var(--t2);margin-top:3px">📍 ${p.place}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:3px">🕐 ${p.time}</div>
        <div style="display:flex;gap:7px;margin-top:10px">
          <button class="btn btn-success btn-sm" onclick="UI.toast('인증 처리됐습니다')">✅ 인증</button>
          <button class="btn btn-danger btn-sm"  onclick="UI.toast('거절 처리됐습니다')">❌ 거절</button>
        </div>
      </div>
      <span class="badge badge-yellow">대기중</span>
    </div>`).join('')}
  </div>`;
}

function buildReceiptPage(el) {
  el.innerHTML = `
  <div class="kpi-grid mb20">
    <div class="kpi-card" style="text-align:center"><div class="kpi-val" style="color:var(--blue)">15,000</div><div class="kpi-label">총 접수건</div></div>
    <div class="kpi-card"><div class="kpi-val" style="color:var(--green)">13,000</div><div class="kpi-label">처리완료</div><div class="prog-bar"><div class="prog-fill" style="width:86.7%;background:var(--green)"></div></div></div>
    <div class="kpi-card"><div class="kpi-val" style="color:var(--yellow)">1,000</div><div class="kpi-label">처리중</div><div class="prog-bar"><div class="prog-fill" style="width:6.7%;background:var(--yellow)"></div></div></div>
    <div class="kpi-card"><div class="kpi-val" style="color:var(--red)">1,000</div><div class="kpi-label">부적격</div><div class="prog-bar"><div class="prog-fill" style="width:6.7%;background:var(--red)"></div></div></div>
  </div>
  <div class="card">
    <div class="card-title">💰 총 소비 인증 금액</div>
    <div style="font-size:32px;font-weight:800;color:var(--green);margin:10px 0">260,000,000<span style="font-size:16px;font-weight:500;color:var(--t3)"> 원</span></div>
    <div style="font-size:11px;color:var(--t3)">처리완료 13,000건 기준 · 건당 평균 약 20,000원</div>
  </div>`;
}

function buildStorePage(el) {
  const stores = [
    {n:'나비카페',c:'카페',i:'☕',m:120,k:'85%',s:'운영중'},
    {n:'함평한우 직판장',c:'음식점',i:'🥩',m:95,k:'72%',s:'운영중'},
    {n:'황금박쥐 기념품샵',c:'체험',i:'🦇',m:63,k:'90%',s:'운영중'},
    {n:'나빛파크 식당',c:'음식점',i:'🍱',m:45,k:'60%',s:'운영중'},
    {n:'전통놀이 체험관',c:'체험',i:'🎮',m:22,k:'55%',s:'휴무'},
  ];
  el.innerHTML = `
  <div class="kpi-grid mb20">
    <div class="kpi-card"><div class="kpi-icon">🏪</div><div class="kpi-val" style="color:var(--blue)">1,500</div><div class="kpi-label">총 상점</div></div>
    <div class="kpi-card"><div class="kpi-icon">💬</div><div class="kpi-val" style="color:var(--cyan)">1,000</div><div class="kpi-label">메시지 등록</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎟</div><div class="kpi-val" style="color:var(--purple)">500</div><div class="kpi-label">쿠폰 발급</div></div>
    <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-val" style="color:var(--green)">50%</div><div class="kpi-label">쿠폰 사용률</div></div>
  </div>
  <div class="card">
    ${stores.map(s => `
    <div class="store-item">
      <div class="store-icon">${s.i}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${s.n}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">
          <span class="badge badge-blue" style="font-size:10px">${s.c}</span> 메시지 ${s.m}건
        </div>
      </div>
      <div style="text-align:right;margin-right:12px">
        <div style="font-size:13px;font-weight:700">${s.k}</div>
        <div style="font-size:10.5px;color:var(--t3)">쿠폰 사용률</div>
      </div>
      <span class="badge ${s.s==='운영중'?'badge-green':'badge-gray'}" style="margin-right:10px">${s.s}</span>
      <button class="btn btn-outline btn-xs">관리</button>
    </div>`).join('')}
  </div>`;
}

function buildReportPage(el) {
  const s = window._dashData?.summary || {};
  const peakDay = window._dashData?.daily_stamps?.reduce((a,b)=>a.count>b.count?a:b,{date:'—',count:0});
  el.innerHTML = `
  <div class="kpi-grid mb20">
    <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-val" style="color:var(--blue)">${s.total_users||'—'}</div><div class="kpi-label">총 참여 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">📊</div><div class="kpi-val" style="color:var(--green)">${s.avg_stamps||'—'}개</div><div class="kpi-label">인당 평균 스탬프</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔝</div><div class="kpi-val" style="color:var(--orange)">${peakDay?.count?.toLocaleString()||'—'}건</div><div class="kpi-label">최다 발행일</div><div style="font-size:11px;color:var(--t3)">${peakDay?.date||'—'}</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--purple)">${s.gift_conv||'—'}%</div><div class="kpi-label">선물신청 전환율</div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="card-title">👤 유저별 스탬프 수 분포</div><div class="card-sub">히스토그램</div><div id="rpt-dist" class="chart h260"></div></div>
    <div class="card"><div class="card-title">📈 누적 스탬프 발행 추이</div><div class="card-sub">기간 내 누적 인증 건수</div><div id="rpt-cumul" class="chart h260"></div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="card-title">🔗 스탬프 vs 후기 상관관계</div><div class="card-sub">장소별 산점도</div><div id="rpt-scatter" class="chart h280"></div></div>
    <div class="card"><div class="card-title">⏰ 시간대별 인증 패턴</div><div class="card-sub">시간대별 분포</div><div id="rpt-hour" class="chart h280"></div></div>
  </div>`;
  setTimeout(() => {
    Charts.drawUserDist('rpt-dist');
    Charts.drawCumul('rpt-cumul');
    Charts.drawScatter('rpt-scatter');
    Charts.drawHourPattern('rpt-hour');
  }, 100);
}

async function buildFraudPage(el) {
  /* ▼ TODO: API 연동 시 fetchFraudUsers()로 서버에서 직접 수신 */
  const fraudUsers = await API.fetchFraudUsers();
  /* ▲ */
  const totalCases = fraudUsers.reduce((s, f) => s + f.cnt, 0);
  el.innerHTML = `
  <div class="alert-bar"><span class="alert-dot"></span><strong>총 ${fraudUsers.length}명</strong>에서 동일 장소 중복 인증 패턴 감지</div>
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
    <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-val" style="color:var(--red)">${fraudUsers.length}</div><div class="kpi-label">의심 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔁</div><div class="kpi-val" style="color:var(--orange)">${totalCases}</div><div class="kpi-label">중복 케이스</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--t3)">0</div><div class="kpi-label">처리 완료</div></div>
  </div>
  <div class="card">
    <div class="card-title">⚠️ 부정사용 의심 유저 목록</div>
    <div class="card-sub">동일 유저 + 동일 장소 2회 이상 인증 케이스</div>
    ${fraudUsers.map(f => `
    <div class="fraud-item">
      <div class="fraud-header">
        <span style="font-size:17px">⚠️</span>
        <span style="font-size:13.5px;font-weight:800">${f.user}</span>
        <span class="badge badge-red">${f.cnt}개 장소 중복</span>
        <div style="margin-left:auto;display:flex;gap:7px">
          <button class="btn btn-danger btn-xs" onclick="UI.toast('인증 취소 처리됐습니다')">인증 취소</button>
          <button class="btn btn-outline btn-xs" onclick="UI.toast('정상 처리됐습니다')">정상처리</button>
        </div>
      </div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:5px">중복 인증 장소:</div>
      <div>${f.places.map(p => `<span class="fraud-tag">📍 ${p}</span>`).join('')}</div>
    </div>`).join('')}
  </div>`;
}


/* ── 공통 페이지네이션 렌더 ── */
function _renderPagination(infoId, btnsId, total, page, perPage, onPageClick) {
  const pages = Math.ceil(total / perPage) || 1;
  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, total);
  const info  = document.getElementById(infoId);
  const btns  = document.getElementById(btnsId);
  if (!info || !btns) return;
  info.textContent = `총 ${total}건 중 ${start}–${end}`;
  const html = [];
  html.push(`<button class="pgn-btn" ${page<=1?'disabled':''} onclick="(${onPageClick.toString()})(${page-1})">‹</button>`);
  for (let i = 1; i <= pages; i++) {
    if (i===1 || i===pages || Math.abs(i-page)<=1)
      html.push(`<button class="pgn-btn ${i===page?'active':''}" onclick="(${onPageClick.toString()})(${i})">${i}</button>`);
    else if (Math.abs(i-page)===2)
      html.push('<span style="color:var(--t3);padding:0 3px">…</span>');
  }
  html.push(`<button class="pgn-btn" ${page>=pages?'disabled':''} onclick="(${onPageClick.toString()})(${page+1})">›</button>`);
  btns.innerHTML = html.join('');
}


/* ── 외부 노출 ── */
const Pages = {
  buildDashboard,
  buildGiftPage, filterGifts, sortGifts,
  openGiftDetail, openUserPage, exportGiftCSV,
  openBulkModal, _applyBulk,
  _onPaidChange, _toggleAllPaid, _syncSelectAll,
  _updateGiftStatus,
  buildReviewPage, filterReviews, _switchRevTab, _toggleReview,
  buildNoticePage, _showNoticeForm,
  buildManualPage, buildReceiptPage, buildStorePage, buildReportPage, buildFraudPage,
};
