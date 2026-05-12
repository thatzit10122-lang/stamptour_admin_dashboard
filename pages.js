/* pages.js — 각 메뉴 페이지 렌더링 */

/* ═══════════════════ DASHBOARD ═══════════════════ */
function renderDashboard() {
  /* KPI */
  const kpis = [
    { icon:'👥', val:'568', label:'총 참여자', badge:'green', badgeTxt:'스탬프 인증 유저' },
    { icon:'🔖', val:'4,261', label:'스탬프 인증', badge:'blue', badgeTxt:'인당 평균 7.5개' },
    { icon:'✍️', val:'392', label:'여행후기', badge:'purple', badgeTxt:'후기 전환율 69.0%' },
    { icon:'🎁', val:'415', label:'선물 신청자', badge:'yellow', badgeTxt:'참여자 73.1%' },
  ];
  document.getElementById('kpi-grid').innerHTML = kpis.map(k=>`
    <div class="kpi-card fade-in">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-val" style="color:var(--accent)">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-badge ${k.badge}">${k.badgeTxt}</div>
    </div>`).join('');

  /* 퍼널 */
  const steps = [
    {num:'568',label:'앱 참여자',pct:'100%',w:'100'},
    {num:'568',label:'스탬프 인증자',pct:'100%',w:'100'},
    {num:'392',label:'후기 작성자',pct:'69.0%',w:'69'},
    {num:'415',label:'선물 신청자',pct:'73.1%',w:'73'},
    {num:'—',label:'선물 지급완료',pct:'—',w:'0'},
  ];
  document.getElementById('funnel-card').innerHTML = steps.map(s=>`
    <div class="funnel-step">
      <div class="funnel-num" style="color:var(--accent)">${s.num}</div>
      <div class="funnel-label">${s.label}</div>
      <div class="funnel-pct">${s.pct}</div>
      <div class="funnel-bar"><div class="funnel-fill" style="width:${s.w}%"></div></div>
    </div>`).join('');

  /* 장소 성과 테이블 */
  const pd = DATA.place_data;
  const maxS = Math.max(...pd.map(p=>p.stamps));
  const rankCls = i=>i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n';
  const perfBadge = c=>c>=12?'<span class="badge badge-green">최우수</span>':c>=9?'<span class="badge badge-blue">우수</span>':c>=7?'<span class="badge badge-yellow">보통</span>':'<span class="badge badge-gray">관심</span>';
  const COLS = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];
  document.getElementById('place-perf-table').innerHTML = `
    <table>
      <thead><tr><th>순위</th><th>장소명</th><th style="text-align:right">스탬프 인증</th><th style="text-align:right">여행후기</th><th style="text-align:right">전환율</th><th>비중</th><th style="text-align:center">평가</th></tr></thead>
      <tbody>${pd.map((p,i)=>{
        const bw=(p.stamps/maxS*100).toFixed(0);
        const cc=p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--text3)';
        return `<tr>
          <td><span class="rank-num ${rankCls(i)}">${i+1}</span></td>
          <td style="font-weight:600;min-width:160px">${p.place}</td>
          <td style="text-align:right;font-weight:700">${p.stamps.toLocaleString()}</td>
          <td style="text-align:right">${p.reviews}</td>
          <td style="text-align:right;font-weight:700;color:${cc}">${p.conv}%</td>
          <td style="min-width:120px">
            <div style="height:5px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:2px">
              <div style="width:${bw}%;height:100%;background:${COLS[i]};border-radius:99px"></div>
            </div>
            <span style="font-size:10.5px;color:var(--text3)">${(p.stamps/4261*100).toFixed(1)}%</span>
          </td>
          <td style="text-align:center">${perfBadge(p.conv)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;

  /* 차트 */
  renderStampChart();
  renderPlaceStamp();
  renderDonut();
  renderChoropleth();
  renderRegionBar();
  renderGiftDaily();
  renderUserDist();
  renderHour();
}

/* ═══════════════════ GIFT PAGE ═══════════════════ */
let giftPage=1, giftPer=20, filteredGifts=[...DATA.gifts], giftSortKey='no', giftAsc=true;

function renderGiftPage() {
  const el = document.getElementById('page-gift');
  el.innerHTML = `
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--yellow)">415</div><div class="kpi-label">총 신청자</div><div class="kpi-badge yellow">참여자 73.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">150</div><div class="kpi-label">지급 완료</div><div class="kpi-badge green">36.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--accent)">150</div><div class="kpi-label">처리 중</div><div class="kpi-badge blue">36.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-val" style="color:var(--red)">115</div><div class="kpi-label">대기 중</div><div class="kpi-badge red">27.7% 미처리</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="chart-title">📅 일별 선물신청 추이</div><div class="chart-sub">전체 기간</div><div id="gift-chart-daily" class="chart-h200"></div></div>
    <div class="card"><div class="chart-title">📊 처리 상태 현황</div><div class="chart-sub">지급 진행 현황</div><div id="gift-chart-donut" class="chart-h200"></div></div>
  </div>
  <div class="card">
    <div class="chart-title">📋 선물 신청자 목록</div>
    <div class="chart-sub">총 415명 · 클릭하여 상세 확인</div>
    <div class="filter-bar">
      <div class="search-wrap"><input type="text" id="gift-search" placeholder="닉네임·실명 검색…" oninput="filterGifts()"></div>
      <select class="filter-sel" id="gift-status" onchange="filterGifts()">
        <option value="">전체 상태</option><option value="지급완료">✅ 지급완료</option><option value="처리중">⏳ 처리중</option><option value="대기중">🔴 대기중</option>
      </select>
      <select class="filter-sel" id="gift-region" onchange="filterGifts()">
        <option value="">전체 지역</option>
        ${[...new Set(DATA.gifts.map(g=>g.region))].sort().map(r=>`<option value="${r}">${r}</option>`).join('')}
      </select>
      <select class="filter-sel" id="gift-review" onchange="filterGifts()">
        <option value="">후기 전체</option><option value="true">작성</option><option value="false">미작성</option>
      </select>
      <button class="btn btn-outline" onclick="exportGiftCSV()">⬇ CSV</button>
      <button class="btn btn-primary" onclick="openBulkModal()">일괄 처리</button>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th>#</th>
        <th class="sortable" onclick="sortGifts('nick')" style="cursor:pointer">닉네임 ↕</th>
        <th>실명</th><th>전화번호</th>
        <th class="sortable" onclick="sortGifts('region')" style="cursor:pointer">지역 ↕</th>
        <th class="sortable" onclick="sortGifts('stamps')" style="cursor:pointer">스탬프 ↕</th>
        <th>후기</th>
        <th class="sortable" onclick="sortGifts('date')" style="cursor:pointer">신청일 ↕</th>
        <th>상태</th><th style="text-align:center">관리</th>
      </tr></thead>
      <tbody id="gift-tbody"></tbody>
    </table></div>
    <div class="pagination"><div class="pgn-info" id="gift-pgn-info"></div><div class="pgn-btns" id="gift-pgn-btns"></div></div>
  </div>`;

  renderGiftTable();
  renderGiftDaily('gift-chart-daily');
  renderGiftDonut('gift-chart-donut');
}

function filterGifts() {
  const q  = document.getElementById('gift-search').value.toLowerCase();
  const st = document.getElementById('gift-status').value;
  const rg = document.getElementById('gift-region').value;
  const rv = document.getElementById('gift-review').value;
  filteredGifts = DATA.gifts.filter(g=>{
    if(q && !g.nick.toLowerCase().includes(q) && !g.name.includes(q)) return false;
    if(st && g.status!==st) return false;
    if(rg && g.region!==rg) return false;
    if(rv==='true' && !g.review) return false;
    if(rv==='false' && g.review) return false;
    return true;
  });
  giftPage=1; renderGiftTable();
}

function sortGifts(key) {
  if(key===giftSortKey) giftAsc=!giftAsc; else { giftSortKey=key; giftAsc=true; }
  filteredGifts.sort((a,b)=>typeof a[key]==='string'?(giftAsc?a[key].localeCompare(b[key],'ko'):b[key].localeCompare(a[key],'ko')):(giftAsc?a[key]-b[key]:b[key]-a[key]));
  giftPage=1; renderGiftTable();
}

function renderGiftTable() {
  const start=(giftPage-1)*giftPer, slice=filteredGifts.slice(start,start+giftPer);
  const statusBadge=s=>({지급완료:'<span class="badge badge-green">✅ 지급완료</span>',처리중:'<span class="badge badge-blue">⏳ 처리중</span>',대기중:'<span class="badge badge-red">🔴 대기중</span>'})[s]||s;
  document.getElementById('gift-tbody').innerHTML = slice.map(g=>`<tr>
    <td class="td-muted" style="font-size:11px">${g.no}</td>
    <td style="font-weight:700">${g.nick}</td>
    <td>${g.name}</td>
    <td class="td-mono td-muted">${g.phone}</td>
    <td><span class="badge badge-blue" style="font-size:10px">${g.region}</span></td>
    <td>
      <div class="stamp-dots">${Array.from({length:10},(_,i)=>`<div class="sdot ${i<g.stamps?'sdot-on':'sdot-off'}"></div>`).join('')}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px">${g.stamps}개</div>
    </td>
    <td style="text-align:center">${g.review?'<span class="badge badge-green">✓</span>':'<span class="badge badge-gray">—</span>'}</td>
    <td class="td-muted" style="font-size:11px">${g.date}<br><span style="font-size:10px">${g.time}</span></td>
    <td>${statusBadge(g.status)}</td>
    <td style="text-align:center"><button class="btn btn-outline btn-xs" onclick="openGiftModal(${g.no})">상세</button></td>
  </tr>`).join('');

  const total=filteredGifts.length, pages=Math.ceil(total/giftPer);
  document.getElementById('gift-pgn-info').textContent=`총 ${total}명 중 ${start+1}–${Math.min(start+giftPer,total)}`;
  const btns=['<button class="pg-btn" '+(giftPage===1?'disabled':'')+` onclick="goGiftPg(${giftPage-1})">‹</button>`];
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-giftPage)<=1) btns.push(`<button class="pg-btn ${i===giftPage?'active':''}" onclick="goGiftPg(${i})">${i}</button>`);
    else if(Math.abs(i-giftPage)===2) btns.push('<span style="color:var(--text3);padding:0 4px">…</span>');
  }
  btns.push('<button class="pg-btn" '+(giftPage===pages?'disabled':'')+` onclick="goGiftPg(${giftPage+1})">›</button>`);
  document.getElementById('gift-pgn-btns').innerHTML=btns.join('');
}
function goGiftPg(p){giftPage=p;renderGiftTable();}

function openGiftModal(no) {
  const g=DATA.gifts.find(x=>x.no===no); if(!g) return;
  document.getElementById('modal-title').textContent=`🎁 선물 신청 상세 — ${g.nick}`;
  const sb=s=>({지급완료:'<span class="badge badge-green" style="font-size:12px;padding:4px 13px">✅ 지급완료</span>',처리중:'<span class="badge badge-blue" style="font-size:12px;padding:4px 13px">⏳ 처리중</span>',대기중:'<span class="badge badge-red" style="font-size:12px;padding:4px 13px">🔴 대기중</span>'})[s]||s;
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-row">
      <div class="modal-field"><label>닉네임</label><div class="val" style="font-weight:700">${g.nick}</div></div>
      <div class="modal-field"><label>실명</label><div class="val">${g.name}</div></div>
      <div class="modal-field"><label>전화번호</label><div class="val td-mono">${g.phone}</div></div>
      <div class="modal-field"><label>신청일시</label><div class="val">${g.date} ${g.time}</div></div>
    </div>
    <div class="modal-field" style="margin-bottom:14px"><label>배송 주소</label><div class="val">${g.addr}<br><span style="color:var(--text3);font-size:12px">${g.detail||''}</span></div></div>
    <hr class="modal-divider">
    <div class="modal-row">
      <div class="modal-field"><label>스탬프 달성</label>
        <div style="margin-top:6px">
          <div class="stamp-dots">${Array.from({length:10},(_,i)=>`<div class="sdot" style="width:12px;height:12px;${i<g.stamps?'background:var(--accent)':'background:var(--border2)'}"></div>`).join('')}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">${g.stamps}개 / 10개</div>
        </div>
      </div>
      <div class="modal-field"><label>현재 상태</label><div style="margin-top:6px">${sb(g.status)}</div></div>
      <div class="modal-field"><label>선물 유형</label><div style="margin-top:6px"><span class="badge badge-purple">${g.giftType}</span></div></div>
      <div class="modal-field"><label>여행후기</label><div style="margin-top:6px">${g.review?'<span class="badge badge-green">✓ 작성완료</span>':'<span class="badge badge-gray">미작성</span>'}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="updateGiftStatus(${g.no},'지급완료')">✅ 지급완료</button>
      <button class="btn btn-warn" onclick="updateGiftStatus(${g.no},'처리중')">⏳ 처리중</button>
      <button class="btn btn-danger" onclick="updateGiftStatus(${g.no},'대기중')">🔴 대기중</button>
      <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    </div>`;
  openModal();
}

function updateGiftStatus(no,status){
  const g=DATA.gifts.find(x=>x.no===no);
  if(g){g.status=status;showToast(`#${no} ${g.nick} → ${status}`);closeModal();filterGifts();}
}
function exportGiftCSV(){
  const rows=[['번호','닉네임','실명','전화번호','지역','신청일','상태','스탬프','후기']];
  filteredGifts.forEach(g=>rows.push([g.no,g.nick,g.name,g.phone,g.region,g.date,g.status,g.stamps,g.review?'O':'X']));
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(rows.map(r=>r.join(',')).join('\n'));
  a.download='선물신청자_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
  showToast('CSV 내보내기 완료');
}
function openBulkModal(){
  document.getElementById('modal-title').textContent='📦 일괄 처리';
  document.getElementById('modal-body').innerHTML=`
    <p style="font-size:12.5px;color:var(--text2);margin-bottom:16px">현재 필터된 ${filteredGifts.length}명에게 일괄 적용합니다.</p>
    <div class="form-group"><label class="form-label">변경할 상태</label>
      <select class="form-select" id="bulk-status"><option value="지급완료">✅ 지급완료</option><option value="처리중">⏳ 처리중</option><option value="대기중">🔴 대기중</option></select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="applyBulk()">일괄 적용</button>
      <button class="btn btn-outline" onclick="closeModal()">취소</button>
    </div>`;
  openModal();
}
function applyBulk(){
  const st=document.getElementById('bulk-status').value;
  filteredGifts.forEach(g=>g.status=st);
  showToast(`${filteredGifts.length}명 → ${st}`); closeModal(); renderGiftTable();
}

/* ═══════════════════ REVIEW PAGE ═══════════════════ */
let revPage=1, revPer=20, filteredReviews=[...DATA.reviews], revTab='all';

const PLACE_COLORS = {
  '군립미술관':'#3b82f6','나비곤충생태관':'#0ea5e9','나빛파크':'#22d3ee',
  '농특산품판매장':'#a78bfa','다육식물관':'#10b981','수생식물관':'#34d399',
  '전통놀이체험':'#f472b6','주제영상관':'#f59e0b',
  '함평 로컬푸드 직매장':'#f97316','함평추억공작소(황금박쥐전시관)':'#818cf8'
};

function renderReviewPage() {
  const el = document.getElementById('page-review');
  el.innerHTML = `
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">✍️</div><div class="kpi-val" style="color:var(--purple)">392</div><div class="kpi-label">총 후기</div><div class="kpi-badge purple">참여자 69.0%</div></div>
    <div class="kpi-card"><div class="kpi-icon">👁</div><div class="kpi-val" style="color:var(--green)">380</div><div class="kpi-label">공개 중</div><div class="kpi-badge green">97.0%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🚫</div><div class="kpi-val" style="color:var(--text3)">12</div><div class="kpi-label">숨김</div><div class="kpi-badge yellow">관리자 처리</div></div>
    <div class="kpi-card"><div class="kpi-icon">🏆</div><div class="kpi-val" style="color:var(--cyan)">13.8%</div><div class="kpi-label">최고 전환율</div><div class="kpi-badge blue">수생식물관</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="chart-title">📅 일별 후기 추이</div><div class="chart-sub">전체 기간</div><div id="review-chart-daily" class="chart-h200"></div></div>
    <div class="card"><div class="chart-title">📍 장소별 인증 vs 후기</div><div class="chart-sub">그룹 비교</div><div id="review-chart-place" class="chart-h200"></div></div>
  </div>
  <div class="card mb20">
    <div class="chart-title">📊 장소별 후기 전환율</div>
    <div class="chart-sub">스탬프 인증 대비 후기 작성 비율</div>
    <div id="review-conv-table"></div>
  </div>
  <div class="card">
    <div class="tabs">
      <div class="tab active" onclick="switchRevTab(this,'all')">전체 <span class="badge badge-blue" style="margin-left:4px">392</span></div>
      <div class="tab" onclick="switchRevTab(this,'public')">공개 <span class="badge badge-green" style="margin-left:4px">380</span></div>
      <div class="tab" onclick="switchRevTab(this,'hidden')">숨김 <span class="badge badge-gray" style="margin-left:4px">12</span></div>
    </div>
    <div class="filter-bar">
      <div class="search-wrap"><input type="text" id="rev-search" placeholder="유저명 검색…" oninput="filterReviews()"></div>
      <select class="filter-sel" id="rev-place" onchange="filterReviews()">
        <option value="">전체 장소</option>
        ${Object.keys(PLACE_COLORS).map(p=>`<option value="${p}">${p}</option>`).join('')}
      </select>
      <select class="filter-sel" id="rev-date" onchange="filterReviews()">
        <option value="">전체 날짜</option>
        ${[...new Set(DATA.reviews.map(r=>r.date))].sort().reverse().map(d=>`<option value="${d}">${d.slice(5)}</option>`).join('')}
      </select>
      <button class="btn btn-danger btn-sm" onclick="bulkRevAction('숨김')">선택 숨김</button>
      <button class="btn btn-success btn-sm" onclick="bulkRevAction('공개')">선택 공개</button>
    </div>
    <div id="review-list"></div>
    <div class="pagination"><div class="pgn-info" id="rev-pgn-info"></div><div class="pgn-btns" id="rev-pgn-btns"></div></div>
  </div>`;

  /* 일별 후기 차트 */
  const rd = {};
  DATA.reviews.forEach(r=>{rd[r.date]=(rd[r.date]||0)+1;});
  const rdSorted=Object.entries(rd).sort();
  Plotly.newPlot('review-chart-daily',[{
    x:rdSorted.map(d=>d[0].slice(5)), y:rdSorted.map(d=>d[1]),
    type:'scatter',mode:'lines+markers',
    line:{color:'#a78bfa',width:2.5,shape:'spline'},
    marker:{color:'#a78bfa',size:5,line:{width:2,color:'#1a2233'}},
    fill:'tozeroy',fillcolor:'rgba(167,139,250,0.08)',
    hovertemplate:'<b>%{x}</b><br>후기 %{y}건<extra></extra>',
  }],{...{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:"'Noto Sans KR'",color:'#64748b',size:11.5},margin:{t:10,r:16,b:36,l:40},showlegend:false},
    xaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11.5},showgrid:false},
    yaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11.5},zeroline:false}
  },{responsive:true,displayModeBar:false});

  renderReviewPlaceChart('review-chart-place');

  /* 전환율 테이블 */
  const pd=[...DATA.place_data].sort((a,b)=>b.conv-a.conv);
  const maxS=Math.max(...pd.map(p=>p.stamps));
  document.getElementById('review-conv-table').innerHTML=`<table>
    <thead><tr><th>장소명</th><th style="text-align:right">스탬프</th><th style="text-align:right">후기</th><th style="text-align:right">전환율</th><th style="width:180px">인증 비중</th></tr></thead>
    <tbody>${pd.map(p=>{
      const cc=p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--text3)';
      const bw=(p.stamps/maxS*100).toFixed(0);
      const col=PLACE_COLORS[p.place]||'#3b82f6';
      return `<tr>
        <td style="font-weight:600">${p.place}</td>
        <td style="text-align:right">${p.stamps}</td>
        <td style="text-align:right">${p.reviews}</td>
        <td style="text-align:right;font-weight:700;color:${cc}">${p.conv}%</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--border);border-radius:99px;overflow:hidden"><div style="width:${bw}%;height:100%;background:${col};border-radius:99px"></div></div><span style="font-size:10.5px;color:var(--text3);width:32px;text-align:right">${bw}%</span></div></td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;

  filterReviews();
}

function switchRevTab(el,mode){
  document.querySelectorAll('#page-review .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active'); revTab=mode; revPage=1; filterReviews();
}
function filterReviews(){
  const q=document.getElementById('rev-search').value.toLowerCase();
  const pl=document.getElementById('rev-place').value;
  const dt=document.getElementById('rev-date').value;
  filteredReviews=DATA.reviews.filter(r=>{
    if(revTab==='public'&&r.status!=='공개') return false;
    if(revTab==='hidden'&&r.status!=='숨김') return false;
    if(q&&!r.user.toLowerCase().includes(q)) return false;
    if(pl&&r.place!==pl) return false;
    if(dt&&r.date!==dt) return false;
    return true;
  });
  revPage=1; renderReviewList();
}
function renderReviewList(){
  const start=(revPage-1)*revPer, slice=filteredReviews.slice(start,start+revPer);
  const col=p=>PLACE_COLORS[p]||'#3b82f6';
  document.getElementById('review-list').innerHTML=slice.map(r=>`
    <div class="review-item ${r.status==='숨김'?'hidden':''}">
      <span class="ri-num">${r.no}</span>
      <span class="ri-user">${r.user}</span>
      <div class="ri-place"><span class="place-tag" style="background:${col(r.place)}18;color:${col(r.place)};border:1px solid ${col(r.place)}30">${r.place}</span></div>
      <span class="ri-date">${r.date.slice(5)}<br><span style="font-size:10px">${r.time}</span></span>
      <div class="ri-actions">
        <span class="badge ${r.status==='공개'?'badge-green':'badge-gray'}">${r.status}</span>
        <button class="btn ${r.status==='공개'?'btn-danger':'btn-success'} btn-xs" onclick="toggleReview(${r.no})">${r.status==='공개'?'숨김':'공개'}</button>
      </div>
    </div>`).join('');
  const total=filteredReviews.length, pages=Math.ceil(total/revPer);
  document.getElementById('rev-pgn-info').textContent=`총 ${total}건 중 ${start+1}–${Math.min(start+revPer,total)}`;
  const btns=['<button class="pg-btn" '+(revPage===1?'disabled':'')+` onclick="goRevPg(${revPage-1})">‹</button>`];
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-revPage)<=1) btns.push(`<button class="pg-btn ${i===revPage?'active':''}" onclick="goRevPg(${i})">${i}</button>`);
    else if(Math.abs(i-revPage)===2) btns.push('<span style="color:var(--text3);padding:0 4px">…</span>');
  }
  btns.push('<button class="pg-btn" '+(revPage===pages?'disabled':'')+` onclick="goRevPg(${revPage+1})">›</button>`);
  document.getElementById('rev-pgn-btns').innerHTML=btns.join('');
}
function goRevPg(p){revPage=p;renderReviewList();}
function toggleReview(no){
  const r=DATA.reviews.find(x=>x.no===no);
  if(r){r.status=r.status==='공개'?'숨김':'공개';showToast(`후기 #${no} → ${r.status}`);filterReviews();}
}
function bulkRevAction(status){showToast(`선택 항목 → ${status} 처리`);}

/* ═══════════════════ NOTICE PAGE ═══════════════════ */
const NOTICES=[
  {id:1,pin:true,type:'📢',title:'[필독] 함평나비대축제 스탬프투어 운영 안내',date:'2026-04-23',views:1240,status:'게시중'},
  {id:2,pin:false,type:'🎉',title:'스탬프 10개 완성 시 특별 경품 추첨 이벤트',date:'2026-04-24',views:890,status:'게시중'},
  {id:3,pin:false,type:'🔧',title:'앱 v2.1.3 업데이트 — 스탬프톡 기능 개선',date:'2026-04-26',views:432,status:'게시중'},
  {id:4,pin:false,type:'📢',title:'선물 신청 마감 안내 (5월 10일까지)',date:'2026-05-04',views:678,status:'게시중'},
  {id:5,pin:false,type:'⚠️',title:'일부 장소 QR코드 교체 작업 (수생식물관)',date:'2026-04-28',views:215,status:'종료'},
];

function renderNoticePage(){
  document.getElementById('page-notice').innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div style="font-size:15px;font-weight:700">📢 공지사항</div>
    <button class="btn btn-primary" onclick="showNoticeForm()">+ 새 공지 작성</button>
  </div>
  <div class="card">
    <div class="filter-bar"><div class="search-wrap"><input type="text" placeholder="공지 제목 검색…"></div>
      <select class="filter-sel"><option>전체</option><option>공지</option><option>이벤트</option><option>업데이트</option></select>
    </div>
    <div id="notice-list">${NOTICES.map(n=>`
      <div class="notice-item">
        <div class="notice-pin">${n.pin?'📌':'📄'}</div>
        <div class="notice-body">
          <div class="notice-ttl">${n.type} ${n.title}</div>
          <div class="notice-meta">
            <span>${n.date}</span><span>·</span><span>조회 ${n.views.toLocaleString()}회</span><span>·</span>
            <span class="badge ${n.status==='게시중'?'badge-green':'badge-gray'}">${n.status}</span>
          </div>
        </div>
        <div class="notice-actions">
          <button class="btn btn-outline btn-sm">수정</button>
          <button class="btn btn-danger btn-sm">삭제</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}
function showNoticeForm(){
  document.getElementById('modal-title').textContent='✏️ 새 공지 작성';
  document.getElementById('modal-body').innerHTML=`
    <div class="form-group"><label class="form-label">공지 유형</label><select class="form-select"><option>📢 일반 공지</option><option>🎉 이벤트</option><option>🔧 업데이트</option><option>⚠️ 긴급</option></select></div>
    <div class="form-group"><label class="form-label">제목</label><input class="form-input" type="text" placeholder="공지 제목을 입력하세요"></div>
    <div class="form-group"><label class="form-label">내용</label><textarea class="form-textarea" placeholder="공지 내용을 입력하세요…"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">게시 시작일</label><input class="form-input" type="date" value="2026-05-12"></div>
      <div class="form-group"><label class="form-label">게시 종료일</label><input class="form-input" type="date" value="2026-05-31"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="showToast('공지가 게시됐습니다');closeModal()">게시하기</button>
      <button class="btn btn-outline" onclick="closeModal()">취소</button>
    </div>`;
  openModal();
}

/* ═══════════════════ MANUAL PAGE ═══════════════════ */
function renderManualPage(){
  document.getElementById('page-manual').innerHTML=`
  <div class="grid3 mb20">
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--yellow)">3</div><div class="kpi-label">대기 중</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">47</div><div class="kpi-label">승인 완료</div></div>
    <div class="kpi-card"><div class="kpi-icon">❌</div><div class="kpi-val" style="color:var(--red)">8</div><div class="kpi-label">거절</div></div>
  </div>
  <div class="card mb16">
    <div class="chart-title">✅ 수동 인증 대기 <span class="badge badge-yellow" style="margin-left:8px">3건</span></div>
    <div class="chart-sub">사진 인증 요청 · 검토 후 승인 또는 거절하세요</div>
    ${[{u:'닉네임2',p:'장소명2',t:'2025-11-01 21:00',i:'🏛️'},{u:'닉네임1',p:'장소명1',t:'2025-11-01 08:30',i:'🌿'},{u:'닉네임00',p:'장소명1',t:'2025-11-01 07:15',i:'🌸'}].map(m=>`
    <div class="auth-card">
      <div class="auth-img">${m.i}</div>
      <div class="auth-info">
        <div class="auth-user">${m.u}</div>
        <div class="auth-place">📍 ${m.p}</div>
        <div class="auth-time">🕐 ${m.t}</div>
        <div class="auth-btns">
          <button class="btn btn-success">✅ 인증</button>
          <button class="btn btn-danger">❌ 거절</button>
        </div>
      </div>
      <span class="badge badge-yellow">대기중</span>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="chart-title">📋 처리 완료 이력</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>유저</th><th>장소</th><th>요청일시</th><th>처리일시</th><th>결과</th></tr></thead>
      <tbody>
        <tr><td>이내_5</td><td>군립미술관</td><td class="td-mono td-muted">2026-05-05 14:00</td><td class="td-mono td-muted">2026-05-05 15:30</td><td><span class="badge badge-green">승인</span></td></tr>
        <tr><td>윤승희</td><td>나비곤충생태관</td><td class="td-mono td-muted">2026-05-04 11:00</td><td class="td-mono td-muted">2026-05-04 13:00</td><td><span class="badge badge-green">승인</span></td></tr>
        <tr><td>abc_test</td><td>주제영상관</td><td class="td-mono td-muted">2026-05-03 09:00</td><td class="td-mono td-muted">2026-05-03 10:30</td><td><span class="badge badge-red">거절</span></td></tr>
      </tbody>
    </table></div>
  </div>`;
}

/* ═══════════════════ RECEIPT PAGE ═══════════════════ */
function renderReceiptPage(){
  document.getElementById('page-receipt').innerHTML=`
  <div class="grid4 mb20">
    <div class="receipt-kpi"><div class="receipt-num" style="color:var(--accent)">15,000</div><div class="receipt-label">총 접수건</div></div>
    <div class="receipt-kpi"><div class="receipt-num" style="color:var(--green)">13,000</div><div class="receipt-label">처리완료</div><div class="prog-bar"><div class="prog-fill" style="width:86.7%;background:var(--green)"></div></div></div>
    <div class="receipt-kpi"><div class="receipt-num" style="color:var(--yellow)">1,000</div><div class="receipt-label">처리중</div><div class="prog-bar"><div class="prog-fill" style="width:6.7%;background:var(--yellow)"></div></div></div>
    <div class="receipt-kpi"><div class="receipt-num" style="color:var(--red)">1,000</div><div class="receipt-label">부적격</div><div class="prog-bar"><div class="prog-fill" style="width:6.7%;background:var(--red)"></div></div></div>
  </div>
  <div class="card mb16">
    <div class="chart-title">💰 총 소비 인증 금액</div>
    <div style="font-size:32px;font-weight:800;color:var(--green);margin:8px 0">260,000,000<span style="font-size:16px;font-weight:500;color:var(--text3)"> 원</span></div>
    <div style="font-size:11px;color:var(--text3)">처리완료 13,000건 기준 · 건당 평균 약 20,000원</div>
  </div>
  <div class="card">
    <div class="chart-title">📋 최근 접수 내역</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>#</th><th>유저</th><th>금액</th><th>접수일</th><th>상태</th></tr></thead>
      <tbody>
        <tr><td class="td-muted">15000</td><td>이내_5</td><td style="color:var(--green);font-weight:700">32,000원</td><td class="td-muted">2026-05-05</td><td><span class="badge badge-green">처리완료</span></td></tr>
        <tr><td class="td-muted">14999</td><td>윤승희</td><td style="color:var(--green);font-weight:700">18,500원</td><td class="td-muted">2026-05-05</td><td><span class="badge badge-green">처리완료</span></td></tr>
        <tr><td class="td-muted">14998</td><td>전연경</td><td style="color:var(--green);font-weight:700">45,000원</td><td class="td-muted">2026-05-05</td><td><span class="badge badge-yellow">처리중</span></td></tr>
        <tr><td class="td-muted">14997</td><td>박수연_22</td><td style="color:var(--green);font-weight:700">8,900원</td><td class="td-muted">2026-05-05</td><td><span class="badge badge-red">부적격</span></td></tr>
      </tbody>
    </table></div>
  </div>`;
}

/* ═══════════════════ STORE PAGE ═══════════════════ */
const STORES=[
  {name:'나비카페',cat:'카페',ico:'☕',msg:120,coupon:'85%',status:'운영중'},
  {name:'함평한우 직판장',cat:'음식점',ico:'🥩',msg:95,coupon:'72%',status:'운영중'},
  {name:'황금박쥐 기념품샵',cat:'체험',ico:'🦇',msg:63,coupon:'90%',status:'운영중'},
  {name:'나빛파크 식당',cat:'음식점',ico:'🍱',msg:45,coupon:'60%',status:'운영중'},
  {name:'함평천지 펜션',cat:'숙박',ico:'🏡',msg:38,coupon:'40%',status:'운영중'},
  {name:'전통놀이 체험관',cat:'체험',ico:'🎮',msg:22,coupon:'55%',status:'휴무'},
];
function renderStorePage(){
  document.getElementById('page-store').innerHTML=`
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">🏪</div><div class="kpi-val" style="color:var(--accent)">1,500</div><div class="kpi-label">총 상점</div><div class="kpi-badge blue">이번달 +100</div></div>
    <div class="kpi-card"><div class="kpi-icon">💬</div><div class="kpi-val" style="color:var(--cyan)">1,000</div><div class="kpi-label">메시지 등록</div><div class="kpi-badge blue">조회 1,000회</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎟</div><div class="kpi-val" style="color:var(--purple)">500</div><div class="kpi-label">쿠폰 발급</div><div class="kpi-badge purple">등록 1,000건</div></div>
    <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-val" style="color:var(--green)">50%</div><div class="kpi-label">쿠폰 사용률</div><div class="kpi-badge green">발급 대비</div></div>
  </div>
  <div class="card">
    <div class="filter-bar"><div class="search-wrap"><input type="text" placeholder="상점명 검색…"></div>
      <select class="filter-sel"><option>전체 카테고리</option><option>음식점</option><option>카페</option><option>숙박</option><option>체험</option></select>
      <button class="btn btn-primary">+ 상점 등록</button>
    </div>
    ${STORES.map(s=>`
    <div class="store-item">
      <div class="store-icon">${s.ico}</div>
      <div><div class="store-name">${s.name}</div><div class="store-meta"><span class="badge badge-blue" style="font-size:10px">${s.cat}</span><span>메시지 ${s.msg}건</span></div></div>
      <div class="store-right"><div class="store-stat">${s.coupon}</div><div class="store-stat-label">쿠폰 사용률</div></div>
      <span class="badge ${s.status==='운영중'?'badge-green':'badge-gray'}" style="margin:0 12px">${s.status}</span>
      <button class="btn btn-outline btn-sm">관리</button>
    </div>`).join('')}
  </div>`;
}

/* ═══════════════════ REPORT PAGE ═══════════════════ */
function renderReportPage(){
  document.getElementById('page-report').innerHTML=`
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-val" style="color:var(--accent)">568</div><div class="kpi-label">총 참여 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">📊</div><div class="kpi-val" style="color:var(--green)">7.5개</div><div class="kpi-label">인당 평균 스탬프</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔝</div><div class="kpi-val" style="color:var(--orange)">602건</div><div class="kpi-label">최다 발행일</div><div style="font-size:11px;color:var(--text3)">2026-05-05</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--purple)">73.1%</div><div class="kpi-label">선물신청 전환율</div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="chart-title">👤 유저별 스탬프 수 분포</div><div class="chart-sub">1인당 인증 히스토그램</div><div id="rpt-dist" class="chart-h240"></div></div>
    <div class="card"><div class="chart-title">📈 누적 스탬프 발행 추이</div><div class="chart-sub">기간 내 누적 인증건수</div><div id="rpt-cumul" class="chart-h240"></div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="chart-title">🔗 스탬프 vs 후기 상관관계</div><div class="chart-sub">장소별 산점도</div><div id="rpt-scatter" class="chart-h280"></div></div>
    <div class="card"><div class="chart-title">🗺️ 선물신청자 지역 분포</div><div class="chart-sub">시도별 신청자 현황</div><div id="rpt-region" class="chart-h280"></div></div>
  </div>`;

  /* 차트 재사용 - 새 ID로 */
  setTimeout(()=>{
    renderUserDistTo('rpt-dist');
    renderCumulTo('rpt-cumul');
    renderScatterTo('rpt-scatter');
    renderRegionBarTo('rpt-region');
  },50);
}

/* 리포트용 차트 헬퍼 */
function renderUserDistTo(id){
  Plotly.newPlot(id,[{
    x:DATA.dist_keys.map(k=>`${k}개`),y:DATA.dist_vals,type:'bar',
    marker:{color:DATA.dist_keys.map(k=>k>=8?'#10b981':k>=5?'#3b82f6':'#475569'),line:{width:0}},
    hovertemplate:'스탬프 %{x}<br><b>%{y}명</b><extra></extra>',
  }],{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:"'Noto Sans KR'",color:'#64748b',size:11},margin:{t:10,r:16,b:36,l:40},showlegend:false,
    xaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:10.5},showgrid:false},
    yaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},zeroline:false}
  },{responsive:true,displayModeBar:false});
}
function renderCumulTo(id){
  Plotly.newPlot(id,[{x:DATA.daily_dates.map(d=>d.slice(5)),y:DATA.cumul_vals,type:'scatter',mode:'lines',
    line:{color:'#a78bfa',width:3,shape:'spline'},fill:'tozeroy',fillcolor:'rgba(167,139,250,0.08)',
    hovertemplate:'<b>%{x}</b><br>누적 %{y}건<extra></extra>',
  }],{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:"'Noto Sans KR'",color:'#64748b',size:11},margin:{t:10,r:20,b:36,l:52},showlegend:false,
    xaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},showgrid:false},
    yaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},zeroline:false,tickformat:','}
  },{responsive:true,displayModeBar:false});
}
function renderScatterTo(id){
  const pd=DATA.place_data;
  const cc=pd.map(p=>p.conv>=12?'#10b981':p.conv>=9?'#22d3ee':p.conv>=7?'#f59e0b':'#94a3b8');
  Plotly.newPlot(id,[{x:pd.map(p=>p.stamps),y:pd.map(p=>p.reviews),mode:'markers+text',
    marker:{color:cc,size:15,opacity:0.9,line:{color:'#0d1117',width:2}},
    text:pd.map(p=>p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐').replace('함평 로컬푸드 직매장','로컬푸드').slice(0,5)),
    textposition:'top center',textfont:{size:10.5,color:'#94a3b8'},
    hovertemplate:'<b>%{customdata}</b><br>인증: %{x}건<br>후기: %{y}건<extra></extra>',
    customdata:pd.map(p=>p.place),
  }],{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:"'Noto Sans KR'",color:'#64748b',size:11},margin:{t:20,r:20,b:44,l:50},showlegend:false,
    xaxis:{title:{text:'스탬프 인증수',font:{size:11.5}},gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},zeroline:false},
    yaxis:{title:{text:'여행후기 수',font:{size:11.5}},gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},zeroline:false}
  },{responsive:true,displayModeBar:false});
}
function renderRegionBarTo(id){
  Plotly.newPlot(id,[{x:DATA.region_vals,y:DATA.region_names,type:'bar',orientation:'h',
    marker:{color:DATA.region_vals.map((_,i)=>i===0?'#3b82f6':i===1?'#22d3ee':i===2?'#a78bfa':'rgba(59,130,246,0.38)')},
    text:DATA.region_vals.map(v=>v+'명'),textposition:'outside',textfont:{size:11,color:'#94a3b8'},
    hovertemplate:'<b>%{y}</b><br>%{x}명<extra></extra>',
  }],{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:"'Noto Sans KR'",color:'#64748b',size:11},margin:{t:10,r:55,b:36,l:90},showlegend:false,
    xaxis:{gridcolor:'rgba(30,45,69,0.8)',tickfont:{size:11},zeroline:false},
    yaxis:{tickfont:{size:11}}
  },{responsive:true,displayModeBar:false});
}

/* ═══════════════════ FRAUD PAGE ═══════════════════ */
function renderFraudPage(){
  document.getElementById('page-fraud').innerHTML=`
  <div class="alert-bar">
    <span class="alert-dot"></span>
    <strong>총 ${DATA.fraud_users.length}명</strong>에서 동일 장소 중복 인증 패턴 감지 — 즉시 검토하세요
  </div>
  <div class="grid3 mb20">
    <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-val" style="color:var(--red)">${DATA.fraud_users.length}</div><div class="kpi-label">의심 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔁</div><div class="kpi-val" style="color:var(--orange)">57</div><div class="kpi-label">중복 케이스</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--text3)">0</div><div class="kpi-label">처리 완료</div></div>
  </div>
  <div class="card">
    <div class="chart-title">⚠️ 부정사용 의심 유저 목록</div>
    <div class="chart-sub">동일 유저 + 동일 장소 2회 이상 인증 케이스</div>
    ${DATA.fraud_users.map(f=>`
    <div class="fraud-item">
      <div class="fraud-header">
        <span style="font-size:18px">⚠️</span>
        <span class="fraud-user">${f.user}</span>
        <span class="badge badge-red">${f.cnt}개 장소 중복</span>
        <div style="margin-left:auto;display:flex;gap:7px">
          <button class="btn btn-danger btn-sm">인증 취소</button>
          <button class="btn btn-outline btn-sm">정상처리</button>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px">중복 인증 장소:</div>
      <div class="fraud-places">${f.places.map(p=>`<span class="fraud-place-tag">📍 ${p}</span>`).join('')}</div>
    </div>`).join('')}
  </div>`;
}
