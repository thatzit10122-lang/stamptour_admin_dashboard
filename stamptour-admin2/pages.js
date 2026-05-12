/* pages.js — 각 메뉴 페이지 렌더링 */

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
function renderDashboard() {
  /* KPI */
  const kpis = [
    { icon:'👥', val:'568', label:'총 참여자', cls:'blue', tag:'스탬프 인증 유저' },
    { icon:'🔖', val:'4,261', label:'스탬프 인증', cls:'blue', tag:'인당 평균 7.5개' },
    { icon:'✍️', val:'392', label:'여행후기', cls:'purple', tag:'후기 전환율 69.0%' },
    { icon:'🎁', val:'415', label:'선물 신청자', cls:'yellow', tag:'참여자 대비 73.1%' },
  ];
  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-val" style="color:var(--accent)">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-badge ${k.cls}">${k.tag}</div>
    </div>`).join('');

  /* 퍼널 */
  const steps = [
    {num:'568',label:'앱 참여자',pct:'100%',w:100},
    {num:'568',label:'스탬프 인증자',pct:'100%',w:100},
    {num:'392',label:'후기 작성자',pct:'69.0%',w:69},
    {num:'415',label:'선물 신청자',pct:'73.1%',w:73},
    {num:'—',label:'선물 지급완료',pct:'—',w:0},
  ];
  document.getElementById('funnel-card').innerHTML = steps.map(s => `
    <div class="funnel-step">
      <div class="funnel-num" style="color:var(--accent)">${s.num}</div>
      <div class="funnel-label">${s.label}</div>
      <div class="funnel-pct">${s.pct}</div>
      <div class="funnel-bar"><div class="funnel-fill" style="width:${s.w}%"></div></div>
    </div>`).join('');

  /* 장소 성과 테이블 */
  const pd = DATA.place_data;
  const maxS = Math.max(...pd.map(p => p.stamps));
  const COLS = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];
  const rCls = i => i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n';
  const perfBadge = c => c>=12?'<span class="badge badge-green">최우수</span>':
                          c>=9 ?'<span class="badge badge-blue">우수</span>':
                          c>=7 ?'<span class="badge badge-yellow">보통</span>':
                                '<span class="badge badge-gray">관심</span>';
  document.getElementById('place-tbody').innerHTML = pd.map((p,i) => {
    const bw = (p.stamps/maxS*100).toFixed(0);
    const cc = p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--t3)';
    return `<tr>
      <td><span class="rank-num ${rCls(i)}">${i+1}</span></td>
      <td style="font-weight:600;min-width:160px">${p.place}</td>
      <td style="text-align:right;font-weight:700">${p.stamps.toLocaleString()}</td>
      <td style="text-align:right">${p.reviews}</td>
      <td style="text-align:right;font-weight:700;color:${cc}">${p.conv}%</td>
      <td style="min-width:120px">
        <div style="height:5px;background:var(--b1);border-radius:99px;overflow:hidden;margin-bottom:2px">
          <div style="width:${bw}%;height:100%;background:${COLS[i]};border-radius:99px"></div>
        </div>
        <span style="font-size:10.5px;color:var(--t3)">${(p.stamps/4261*100).toFixed(1)}%</span>
      </td>
      <td style="text-align:center">${perfBadge(p.conv)}</td>
    </tr>`;
  }).join('');

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

/* ═══════════════════════════════════════════
   GIFT PAGE
═══════════════════════════════════════════ */
let giftPage=1, giftPer=20, filteredGifts=[...DATA.gifts], giftSort='no', giftAsc=true;

function renderGiftPage() {
  document.getElementById('page-gift').innerHTML = `
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--yellow)">415</div><div class="kpi-label">총 신청자</div><div class="kpi-badge yellow">참여자 73.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">150</div><div class="kpi-label">지급 완료</div><div class="kpi-badge green">36.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--accent)">150</div><div class="kpi-label">처리 중</div><div class="kpi-badge blue">36.1%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-val" style="color:var(--red)">115</div><div class="kpi-label">대기 중</div><div class="kpi-badge red">처리 필요</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="chart-title">📅 일별 선물신청 추이</div><div class="chart-sub">전체 기간 일별 신청 건수</div><div id="g-daily" class="chart-h220"></div></div>
    <div class="card"><div class="chart-title">📊 처리 상태 현황</div><div class="chart-sub">지급 진행 현황</div><div id="g-donut" class="chart-h220"></div></div>
  </div>
  <div class="card">
    <div class="chart-title">📋 선물 신청자 목록</div>
    <div class="chart-sub">총 415명 · 클릭하여 상세 확인</div>
    <div class="filter-bar">
      <div class="search-wrap"><input id="gs-q" type="text" placeholder="닉네임·실명 검색…" oninput="gFilter()"></div>
      <select class="filter-sel" id="gs-st" onchange="gFilter()">
        <option value="">전체 상태</option><option value="지급완료">✅ 지급완료</option><option value="처리중">⏳ 처리중</option><option value="대기중">🔴 대기중</option>
      </select>
      <select class="filter-sel" id="gs-rg" onchange="gFilter()">
        <option value="">전체 지역</option>
        ${[...new Set(DATA.gifts.map(g=>g.region))].sort().map(r=>`<option value="${r}">${r}</option>`).join('')}
      </select>
      <select class="filter-sel" id="gs-rv" onchange="gFilter()">
        <option value="">후기 전체</option><option value="true">작성</option><option value="false">미작성</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="exportGiftCSV()">⬇ CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openBulkModal()">일괄 처리</button>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th>#</th>
        <th onclick="gSort('nick')" style="cursor:pointer">닉네임 ↕</th>
        <th>실명</th><th>전화번호</th>
        <th onclick="gSort('region')" style="cursor:pointer">지역 ↕</th>
        <th onclick="gSort('stamps')" style="cursor:pointer">스탬프 ↕</th>
        <th>후기</th>
        <th onclick="gSort('date')" style="cursor:pointer">신청일 ↕</th>
        <th>상태</th><th>관리</th>
      </tr></thead>
      <tbody id="gift-tbody"></tbody>
    </table></div>
    <div class="pagination">
      <div class="pgn-info" id="g-pgn-info"></div>
      <div class="pgn-btns" id="g-pgn-btns"></div>
    </div>
  </div>`;

  renderGiftTable();
  setTimeout(() => { renderGiftDaily('g-daily'); renderGiftStatusDonut('g-donut'); }, 50);
}

function gFilter() {
  const q  = document.getElementById('gs-q').value.toLowerCase();
  const st = document.getElementById('gs-st').value;
  const rg = document.getElementById('gs-rg').value;
  const rv = document.getElementById('gs-rv').value;
  filteredGifts = DATA.gifts.filter(g => {
    if(q  && !g.nick.toLowerCase().includes(q) && !g.name.includes(q)) return false;
    if(st && g.status!==st) return false;
    if(rg && g.region!==rg) return false;
    if(rv==='true'&&!g.review) return false;
    if(rv==='false'&&g.review) return false;
    return true;
  });
  giftPage=1; renderGiftTable();
}

function gSort(key) {
  if(key===giftSort) giftAsc=!giftAsc; else { giftSort=key; giftAsc=true; }
  filteredGifts.sort((a,b) => typeof a[key]==='string'
    ?(giftAsc?a[key].localeCompare(b[key],'ko'):b[key].localeCompare(a[key],'ko'))
    :(giftAsc?a[key]-b[key]:b[key]-a[key]));
  giftPage=1; renderGiftTable();
}

function renderGiftTable() {
  const start = (giftPage-1)*giftPer;
  const slice = filteredGifts.slice(start, start+giftPer);
  const sb = s => ({
    '지급완료':'<span class="badge badge-green">✅ 지급완료</span>',
    '처리중':'<span class="badge badge-blue">⏳ 처리중</span>',
    '대기중':'<span class="badge badge-red">🔴 대기중</span>',
  })[s]||s;
  document.getElementById('gift-tbody').innerHTML = slice.map(g => `<tr>
    <td class="td-muted" style="font-size:11px">${g.no}</td>
    <td style="font-weight:700">${g.nick}</td>
    <td>${g.name}</td>
    <td class="td-mono td-muted">${g.phone}</td>
    <td><span class="badge badge-blue" style="font-size:10px">${g.region}</span></td>
    <td>
      <div class="stamp-dots">${Array.from({length:10},(_,i)=>`<div class="sdot ${i<g.stamps?'sdot-on':'sdot-off'}"></div>`).join('')}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:2px">${g.stamps}개</div>
    </td>
    <td style="text-align:center">${g.review?'<span class="badge badge-green">✓</span>':'<span class="badge badge-gray">—</span>'}</td>
    <td class="td-muted" style="font-size:11px">${g.date}<br><span style="font-size:10px">${g.time}</span></td>
    <td>${sb(g.status)}</td>
    <td><button class="btn btn-outline btn-xs" onclick="openGiftModal(${g.no})">상세</button></td>
  </tr>`).join('');

  const total=filteredGifts.length, pages=Math.ceil(total/giftPer);
  document.getElementById('g-pgn-info').textContent=`총 ${total}명 중 ${start+1}–${Math.min(start+giftPer,total)}`;
  const btns = [`<button class="pg-btn" ${giftPage===1?'disabled':''} onclick="goPg(${giftPage-1})">‹</button>`];
  for(let i=1;i<=pages;i++) {
    if(i===1||i===pages||Math.abs(i-giftPage)<=1) btns.push(`<button class="pg-btn ${i===giftPage?'active':''}" onclick="goPg(${i})">${i}</button>`);
    else if(Math.abs(i-giftPage)===2) btns.push('<span style="color:var(--t3);padding:0 4px">…</span>');
  }
  btns.push(`<button class="pg-btn" ${giftPage===pages?'disabled':''} onclick="goPg(${giftPage+1})">›</button>`);
  document.getElementById('g-pgn-btns').innerHTML = btns.join('');
}
function goPg(p){giftPage=p;renderGiftTable();}

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
    <div class="modal-field" style="margin-bottom:14px"><label>배송 주소</label><div class="val">${g.addr}<br><span style="color:var(--t3);font-size:12px">${g.detail||''}</span></div></div>
    <hr class="modal-divider">
    <div class="modal-row">
      <div class="modal-field"><label>스탬프</label>
        <div style="margin-top:6px">
          <div class="stamp-dots">${Array.from({length:10},(_,i)=>`<div class="sdot" style="width:12px;height:12px;${i<g.stamps?'background:var(--accent)':'background:var(--b2)'}"></div>`).join('')}</div>
          <div style="font-size:12px;color:var(--t3);margin-top:4px">${g.stamps}개 / 10개</div>
        </div>
      </div>
      <div class="modal-field"><label>상태</label><div style="margin-top:6px">${sb(g.status)}</div></div>
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
  if(g){g.status=status;showToast(`#${no} ${g.nick} → ${status}`);closeModal();gFilter();}
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
    <p style="font-size:12.5px;color:var(--t2);margin-bottom:16px">현재 필터된 <strong>${filteredGifts.length}명</strong>에게 일괄 적용합니다.</p>
    <div class="form-group"><label class="form-label">변경할 상태</label>
      <select class="form-select" id="bulk-st"><option value="지급완료">✅ 지급완료</option><option value="처리중">⏳ 처리중</option><option value="대기중">🔴 대기중</option></select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="applyBulk()">일괄 적용</button>
      <button class="btn btn-outline" onclick="closeModal()">취소</button>
    </div>`;
  openModal();
}
function applyBulk(){
  const st=document.getElementById('bulk-st').value;
  filteredGifts.forEach(g=>g.status=st);
  showToast(`${filteredGifts.length}명 → ${st}`); closeModal(); renderGiftTable();
}

/* ═══════════════════════════════════════════
   REVIEW PAGE
═══════════════════════════════════════════ */
let revPage=1, revPer=20, filteredRevs=[...DATA.reviews], revTab='all';

const PCOL = {
  '군립미술관':'#3b82f6','나비곤충생태관':'#0ea5e9','나빛파크':'#22d3ee',
  '농특산품판매장':'#a78bfa','다육식물관':'#10b981','수생식물관':'#34d399',
  '전통놀이체험':'#f472b6','주제영상관':'#f59e0b',
  '함평 로컬푸드 직매장':'#f97316','함평추억공작소(황금박쥐전시관)':'#818cf8'
};

function renderReviewPage() {
  document.getElementById('page-review').innerHTML = `
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">✍️</div><div class="kpi-val" style="color:var(--purple)">392</div><div class="kpi-label">총 후기</div><div class="kpi-badge purple">참여자 69.0%</div></div>
    <div class="kpi-card"><div class="kpi-icon">👁</div><div class="kpi-val" style="color:var(--green)">380</div><div class="kpi-label">공개 중</div><div class="kpi-badge green">97.0%</div></div>
    <div class="kpi-card"><div class="kpi-icon">🚫</div><div class="kpi-val" style="color:var(--t3)">12</div><div class="kpi-label">숨김</div><div class="kpi-badge yellow">관리자 처리</div></div>
    <div class="kpi-card"><div class="kpi-icon">🏆</div><div class="kpi-val" style="color:var(--cyan)">13.8%</div><div class="kpi-label">최고 전환율</div><div class="kpi-badge blue">수생식물관</div></div>
  </div>
  <div class="grid2 mb20">
    <div class="card"><div class="chart-title">📅 일별 후기 추이</div><div class="chart-sub">전체 기간</div><div id="rv-daily" class="chart-h220"></div></div>
    <div class="card"><div class="chart-title">📍 장소별 인증 vs 후기</div><div class="chart-sub">그룹 바 비교</div><div id="rv-place" class="chart-h220"></div></div>
  </div>
  <div class="card mb20">
    <div class="chart-title">📊 장소별 후기 전환율</div>
    <div class="chart-sub">스탬프 인증 대비 후기 작성 비율</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>장소명</th><th style="text-align:right">스탬프</th><th style="text-align:right">후기</th><th style="text-align:right">전환율</th><th style="width:180px">비중</th></tr></thead>
      <tbody>${[...DATA.place_data].sort((a,b)=>b.conv-a.conv).map(p=>{
        const cc=p.conv>=12?'var(--green)':p.conv>=9?'var(--cyan)':p.conv>=7?'var(--yellow)':'var(--t3)';
        const bw=(p.stamps/Math.max(...DATA.place_data.map(x=>x.stamps))*100).toFixed(0);
        const col=PCOL[p.place]||'#3b82f6';
        return `<tr>
          <td style="font-weight:600">${p.place}</td>
          <td style="text-align:right">${p.stamps.toLocaleString()}</td>
          <td style="text-align:right">${p.reviews}</td>
          <td style="text-align:right;font-weight:700;color:${cc}">${p.conv}%</td>
          <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--b1);border-radius:99px;overflow:hidden"><div style="width:${bw}%;height:100%;background:${col};border-radius:99px"></div></div><span style="font-size:10.5px;color:var(--t3);width:32px;text-align:right">${bw}%</span></div></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>
  <div class="card">
    <div class="tabs">
      <div class="tab active" onclick="rvTab(this,'all')">전체 <span class="badge badge-blue" style="margin-left:4px">392</span></div>
      <div class="tab" onclick="rvTab(this,'public')">공개 <span class="badge badge-green" style="margin-left:4px">380</span></div>
      <div class="tab" onclick="rvTab(this,'hidden')">숨김 <span class="badge badge-gray" style="margin-left:4px">12</span></div>
    </div>
    <div class="filter-bar">
      <div class="search-wrap"><input id="rv-q" type="text" placeholder="유저명 검색…" oninput="rvFilter()"></div>
      <select class="filter-sel" id="rv-pl" onchange="rvFilter()">
        <option value="">전체 장소</option>
        ${Object.keys(PCOL).map(p=>`<option value="${p}">${p}</option>`).join('')}
      </select>
      <select class="filter-sel" id="rv-dt" onchange="rvFilter()">
        <option value="">전체 날짜</option>
        ${[...new Set(DATA.reviews.map(r=>r.date))].sort().reverse().map(d=>`<option value="${d}">${d.slice(5)}</option>`).join('')}
      </select>
    </div>
    <div id="rv-list"></div>
    <div class="pagination">
      <div class="pgn-info" id="rv-pgn-info"></div>
      <div class="pgn-btns" id="rv-pgn-btns"></div>
    </div>
  </div>`;

  /* 일별 후기 차트 */
  const rd={};
  DATA.reviews.forEach(r=>{rd[r.date]=(rd[r.date]||0)+1;});
  const rds=Object.entries(rd).sort();
  Plotly.newPlot('rv-daily',[{
    x:rds.map(d=>d[0].slice(5).replace('-','/')),y:rds.map(d=>d[1]),
    type:'scatter',mode:'lines+markers',
    line:{color:'#a78bfa',width:2.5,shape:'spline'},
    marker:{color:'#a78bfa',size:6,line:{width:2,color:'#1a2233'}},
    fill:'tozeroy',fillcolor:'rgba(167,139,250,0.09)',
    hovertemplate:'<b>%{x}</b><br>후기 %{y}건<extra></extra>',
  }],{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:FONT,margin:{t:10,r:16,b:40,l:44},showlegend:false,
    xaxis:{gridcolor:'rgba(30,45,69,0.85)',tickfont:FONT,zeroline:false,showgrid:false},
    yaxis:{gridcolor:'rgba(30,45,69,0.85)',tickfont:FONT,zeroline:false}
  },{responsive:true,displayModeBar:false});

  renderReviewPlaceBar('rv-place');
  rvFilter();
}

function rvTab(el,mode){
  document.querySelectorAll('#page-review .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active'); revTab=mode; revPage=1; rvFilter();
}
function rvFilter(){
  const q=document.getElementById('rv-q').value.toLowerCase();
  const pl=document.getElementById('rv-pl').value;
  const dt=document.getElementById('rv-dt').value;
  filteredRevs=DATA.reviews.filter(r=>{
    if(revTab==='public'&&r.status!=='공개') return false;
    if(revTab==='hidden'&&r.status!=='숨김') return false;
    if(q&&!r.user.toLowerCase().includes(q)) return false;
    if(pl&&r.place!==pl) return false;
    if(dt&&r.date!==dt) return false;
    return true;
  });
  revPage=1; renderRevList();
}
function renderRevList(){
  const start=(revPage-1)*revPer, slice=filteredRevs.slice(start,start+revPer);
  document.getElementById('rv-list').innerHTML=slice.map(r=>`
    <div class="review-item ${r.status==='숨김'?'hidden-item':''}">
      <span class="ri-num">${r.no}</span>
      <span class="ri-user">${r.user}</span>
      <div class="ri-place"><span class="place-tag" style="background:${PCOL[r.place]||'#3b82f6'}18;color:${PCOL[r.place]||'#3b82f6'};border:1px solid ${PCOL[r.place]||'#3b82f6'}30">${r.place}</span></div>
      <span class="ri-date">${r.date.slice(5)}<br><span style="font-size:10px">${r.time}</span></span>
      <div class="ri-actions">
        <span class="badge ${r.status==='공개'?'badge-green':'badge-gray'}">${r.status}</span>
        <button class="btn ${r.status==='공개'?'btn-danger':'btn-success'} btn-xs" onclick="toggleRev(${r.no})">${r.status==='공개'?'숨김':'공개'}</button>
      </div>
    </div>`).join('');
  const total=filteredRevs.length,pages=Math.ceil(total/revPer);
  document.getElementById('rv-pgn-info').textContent=`총 ${total}건 중 ${start+1}–${Math.min(start+revPer,total)}`;
  const btns=[`<button class="pg-btn" ${revPage===1?'disabled':''} onclick="rvPg(${revPage-1})">‹</button>`];
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-revPage)<=1) btns.push(`<button class="pg-btn ${i===revPage?'active':''}" onclick="rvPg(${i})">${i}</button>`);
    else if(Math.abs(i-revPage)===2) btns.push('<span style="color:var(--t3);padding:0 4px">…</span>');
  }
  btns.push(`<button class="pg-btn" ${revPage===pages?'disabled':''} onclick="rvPg(${revPage+1})">›</button>`);
  document.getElementById('rv-pgn-btns').innerHTML=btns.join('');
}
function rvPg(p){revPage=p;renderRevList();}
function toggleRev(no){
  const r=DATA.reviews.find(x=>x.no===no);
  if(r){r.status=r.status==='공개'?'숨김':'공개';showToast(`후기 #${no} → ${r.status}`);rvFilter();}
}

/* ═══════════════════════════════════════════
   NOTICE PAGE
═══════════════════════════════════════════ */
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
    <div class="filter-bar">
      <div class="search-wrap"><input type="text" placeholder="공지 제목 검색…"></div>
      <select class="filter-sel"><option>전체</option><option>공지</option><option>이벤트</option></select>
    </div>
    ${NOTICES.map(n=>`
    <div class="notice-item">
      <div class="notice-pin">${n.pin?'📌':'📄'}</div>
      <div class="notice-body">
        <div class="notice-ttl">${n.type} ${n.title}</div>
        <div class="notice-meta"><span>${n.date}</span><span>·</span><span>조회 ${n.views.toLocaleString()}회</span><span>·</span>
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
function showNoticeForm(){
  document.getElementById('modal-title').textContent='✏️ 새 공지 작성';
  document.getElementById('modal-body').innerHTML=`
    <div class="form-group"><label class="form-label">유형</label><select class="form-select"><option>📢 일반</option><option>🎉 이벤트</option><option>🔧 업데이트</option><option>⚠️ 긴급</option></select></div>
    <div class="form-group"><label class="form-label">제목</label><input class="form-input" type="text" placeholder="공지 제목"></div>
    <div class="form-group"><label class="form-label">내용</label><textarea class="form-textarea" placeholder="공지 내용…"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">시작일</label><input class="form-input" type="date" value="2026-05-12"></div>
      <div class="form-group"><label class="form-label">종료일</label><input class="form-input" type="date" value="2026-05-31"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="showToast('공지가 게시됐습니다');closeModal()">게시하기</button>
      <button class="btn btn-outline" onclick="closeModal()">취소</button>
    </div>`;
  openModal();
}

/* ═══════════════════════════════════════════
   MANUAL / RECEIPT / STORE 페이지
═══════════════════════════════════════════ */
function renderManualPage(){
  document.getElementById('page-manual').innerHTML=`
  <div class="grid3 mb20">
    <div class="kpi-card"><div class="kpi-icon">⏳</div><div class="kpi-val" style="color:var(--yellow)">3</div><div class="kpi-label">대기 중</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--green)">47</div><div class="kpi-label">승인 완료</div></div>
    <div class="kpi-card"><div class="kpi-icon">❌</div><div class="kpi-val" style="color:var(--red)">8</div><div class="kpi-label">거절</div></div>
  </div>
  <div class="card mb16">
    <div class="chart-title">✅ 수동 인증 대기 <span class="badge badge-yellow" style="margin-left:8px">3건</span></div>
    <div class="chart-sub" style="margin-bottom:16px">사진 인증 요청 · 검토 후 승인 또는 거절하세요</div>
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
  </div>`;
}

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
    <div style="font-size:32px;font-weight:800;color:var(--green);margin:8px 0">260,000,000<span style="font-size:16px;font-weight:500;color:var(--t3)"> 원</span></div>
    <div style="font-size:11px;color:var(--t3)">처리완료 13,000건 기준 · 건당 평균 약 20,000원</div>
  </div>`;
}

function renderStorePage(){
  const STORES=[
    {name:'나비카페',cat:'카페',ico:'☕',msg:120,coupon:'85%',status:'운영중'},
    {name:'함평한우 직판장',cat:'음식점',ico:'🥩',msg:95,coupon:'72%',status:'운영중'},
    {name:'황금박쥐 기념품샵',cat:'체험',ico:'🦇',msg:63,coupon:'90%',status:'운영중'},
    {name:'나빛파크 식당',cat:'음식점',ico:'🍱',msg:45,coupon:'60%',status:'운영중'},
    {name:'함평천지 펜션',cat:'숙박',ico:'🏡',msg:38,coupon:'40%',status:'운영중'},
    {name:'전통놀이 체험관',cat:'체험',ico:'🎮',msg:22,coupon:'55%',status:'휴무'},
  ];
  document.getElementById('page-store').innerHTML=`
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">🏪</div><div class="kpi-val" style="color:var(--accent)">1,500</div><div class="kpi-label">총 상점</div><div class="kpi-badge blue">이번달 +100</div></div>
    <div class="kpi-card"><div class="kpi-icon">💬</div><div class="kpi-val" style="color:var(--cyan)">1,000</div><div class="kpi-label">메시지 등록</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎟</div><div class="kpi-val" style="color:var(--purple)">500</div><div class="kpi-label">쿠폰 발급</div></div>
    <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-val" style="color:var(--green)">50%</div><div class="kpi-label">쿠폰 사용률</div></div>
  </div>
  <div class="card">${STORES.map(s=>`
    <div class="store-item">
      <div class="store-icon">${s.ico}</div>
      <div><div class="store-name">${s.name}</div><div class="store-meta"><span class="badge badge-blue" style="font-size:10px">${s.cat}</span><span>메시지 ${s.msg}건</span></div></div>
      <div class="store-right"><div class="store-stat">${s.coupon}</div><div class="store-stat-label">쿠폰 사용률</div></div>
      <span class="badge ${s.status==='운영중'?'badge-green':'badge-gray'}" style="margin:0 12px">${s.status}</span>
      <button class="btn btn-outline btn-sm">관리</button>
    </div>`).join('')}
  </div>`;
}

/* ═══════════════════════════════════════════
   REPORT PAGE
═══════════════════════════════════════════ */
function renderReportPage(){
  document.getElementById('page-report').innerHTML=`
  <div class="grid4 mb20">
    <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-val" style="color:var(--accent)">568</div><div class="kpi-label">총 참여 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">📊</div><div class="kpi-val" style="color:var(--green)">7.5개</div><div class="kpi-label">인당 평균 스탬프</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔝</div><div class="kpi-val" style="color:var(--orange)">602건</div><div class="kpi-label">최다 발행일 건수</div><div style="font-size:11px;color:var(--t3)">2026-05-05</div></div>
    <div class="kpi-card"><div class="kpi-icon">🎁</div><div class="kpi-val" style="color:var(--purple)">73.1%</div><div class="kpi-label">선물신청 전환율</div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="chart-title">👤 유저별 스탬프 수 분포</div><div class="chart-sub">1인당 인증 스탬프 히스토그램</div><div id="rpt-dist" class="chart-h260"></div></div>
    <div class="card"><div class="chart-title">📈 누적 스탬프 발행 추이</div><div class="chart-sub">기간 내 누적 인증 건수</div><div id="rpt-cumul" class="chart-h260"></div></div>
  </div>
  <div class="grid2 mb16">
    <div class="card"><div class="chart-title">🔗 스탬프 vs 후기 상관관계</div><div class="chart-sub">장소별 산점도</div><div id="rpt-scatter" class="chart-h280"></div></div>
    <div class="card"><div class="chart-title">⏰ 시간대별 인증 패턴</div><div class="chart-sub">0–20시 인증 분포</div><div id="rpt-hour" class="chart-h280"></div></div>
  </div>`;
  setTimeout(()=>{
    renderUserDist('rpt-dist');
    renderCumul('rpt-cumul');
    renderScatter('rpt-scatter');
    renderHour('rpt-hour');
  },50);
}

/* ═══════════════════════════════════════════
   FRAUD PAGE
═══════════════════════════════════════════ */
function renderFraudPage(){
  document.getElementById('page-fraud').innerHTML=`
  <div class="alert-bar"><span class="alert-dot"></span><strong>총 ${DATA.fraud_users.length}명</strong>에서 동일 장소 중복 인증 패턴 감지 — 즉시 검토하세요</div>
  <div class="grid3 mb20">
    <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-val" style="color:var(--red)">${DATA.fraud_users.length}</div><div class="kpi-label">의심 유저</div></div>
    <div class="kpi-card"><div class="kpi-icon">🔁</div><div class="kpi-val" style="color:var(--orange)">57</div><div class="kpi-label">중복 케이스</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-val" style="color:var(--t3)">0</div><div class="kpi-label">처리 완료</div></div>
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
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">중복 인증 장소:</div>
      <div class="fraud-places">${f.places.map(p=>`<span class="fraud-place-tag">📍 ${p}</span>`).join('')}</div>
    </div>`).join('')}
  </div>`;
}
