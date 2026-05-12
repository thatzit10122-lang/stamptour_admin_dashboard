/* charts.js — Plotly 차트 렌더링 */

const BG   = 'rgba(0,0,0,0)';
const FONT = { family:"'Noto Sans KR',sans-serif", color:'#64748b', size:11.5 };
const GRID = { color:'rgba(30,45,69,0.8)', zeroline:false };
const CFG  = { responsive:true, displayModeBar:false };
const PAL  = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];
const BASE = { paper_bgcolor:BG, plot_bgcolor:BG, font:FONT, margin:{t:10,r:16,b:36,l:44}, showlegend:false };

let stampMode = 'daily';

/* ── 일별/누적 스탬프 ─────────────────────────── */
function renderStampChart() {
  const d = DATA;
  const y = stampMode === 'daily' ? d.daily_vals : d.cumul_vals;
  const color = stampMode === 'daily' ? '#3b82f6' : '#22d3ee';
  const fill  = stampMode === 'daily' ? 'rgba(59,130,246,0.09)' : 'rgba(34,211,238,0.09)';
  const peak  = Math.max(...y);
  Plotly.newPlot('chart-daily', [{
    x: d.daily_dates.map(dt => dt.slice(5)),
    y,
    type:'scatter', mode:'lines+markers',
    line:{ color, width:2.5, shape:'spline' },
    marker:{ color: y.map(v => v===peak ? '#f97316' : color), size:6, line:{width:2,color:'#0d1117'} },
    fill:'tozeroy', fillcolor:fill,
    hovertemplate:'<b>%{x}</b><br>%{y}건<extra></extra>',
  }], { ...BASE, xaxis:{gridcolor:GRID.color,tickfont:FONT,showgrid:false}, yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false} }, CFG);
}

function toggleStamp(mode, btn) {
  stampMode = mode;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStampChart();
}

/* ── 장소별 스탬프 바 ─────────────────────────── */
function renderPlaceStamp() {
  const pd = DATA.place_data;
  const sorted = [...pd].sort((a,b) => b.stamps - a.stamps);
  const names = sorted.map(p => p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐전시관').replace('함평 로컬푸드 직매장','로컬푸드직매장'));
  Plotly.newPlot('chart-place-stamp', [{
    x: sorted.map(p=>p.stamps),
    y: names,
    type:'bar', orientation:'h',
    marker:{ color:PAL },
    text: sorted.map(p=>p.stamps.toLocaleString()),
    textposition:'outside', textfont:{...FONT,size:11},
    hovertemplate:'%{y}<br><b>%{x}건</b><extra></extra>',
  }], { ...BASE, margin:{t:10,r:55,b:36,l:105}, xaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false}, yaxis:{tickfont:{...FONT,size:10.5}} }, CFG);
}

/* ── 도넛 ─────────────────────────────────────── */
function renderDonut() {
  const pd = DATA.place_data;
  Plotly.newPlot('chart-donut', [{
    labels: pd.map(p=>p.place),
    values: pd.map(p=>p.stamps),
    type:'pie', hole:0.55,
    marker:{ colors:PAL, line:{color:'#0d1117',width:2} },
    textinfo:'none',
    hovertemplate:'<b>%{label}</b><br>%{value}건 (%{percent})<extra></extra>',
    rotation:20,
  }], {
    ...BASE,
    showlegend:true,
    legend:{ font:{...FONT,size:10}, orientation:'v', x:1.02, y:0.5, bgcolor:'rgba(0,0,0,0)' },
    margin:{t:10,r:140,b:10,l:10},
    annotations:[{
      text:`<b style="font-size:16px">${DATA.total_stamps.toLocaleString()}</b><br>총 인증`,
      x:0.35, y:0.5, showarrow:false, align:'center',
      font:{size:13,color:'#e2e8f0',family:"'Noto Sans KR',sans-serif"},
    }],
  }, CFG);
}

/* ── Choropleth 한국 지도 ─────────────────────── */
function renderChoropleth() {
  fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json')
    .then(r => r.json())
    .then(geo => {
      const geoMap = {
        '광주':'Gwangju', '전남':'Jeollanam-do', '경기':'Gyeonggi-do',
        '전북특별자치도':'Jeollabuk-do', '서울':'Seoul', '충북':'Chungcheongbuk-do',
        '경북':'Gyeongsangbuk-do', '경남':'Gyeongsangnam-do', '충남':'Chungcheongnam-do',
        '부산':'Busan', '인천':'Incheon', '대전':'Daejeon', '울산':'Ulsan',
        '대구':'Daegu', '세종특별자치시':'Sejong',
      };
      const locs=[], zs=[], texts=[];
      geo.features.forEach(f => {
        const eng = f.properties.name_eng;
        const kor = DATA.region_names.find(k => geoMap[k]===eng);
        const val = kor ? DATA.region_vals[DATA.region_names.indexOf(kor)] : 0;
        locs.push(eng); zs.push(val);
        texts.push(kor ? `${kor}<br>${val}명` : eng);
      });
      Plotly.newPlot('chart-choropleth', [{
        type:'choroplethmapbox', geojson:geo,
        locations:locs, z:zs, text:texts,
        featureidkey:'properties.name_eng',
        colorscale:[[0,'#1a2233'],[0.15,'rgba(59,130,246,0.25)'],[0.5,'rgba(59,130,246,0.55)'],[1,'#3b82f6']],
        marker:{ line:{ color:'#1e2d45', width:1 } },
        hovertemplate:'%{text}<extra></extra>',
        showscale:false,
      }], {
        paper_bgcolor:BG, font:FONT,
        margin:{t:0,r:0,b:0,l:0},
        mapbox:{ style:'carto-darkmatter', center:{lat:36.5,lon:127.8}, zoom:5.0 },
      }, CFG);
    })
    .catch(() => {
      document.getElementById('chart-choropleth').innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:12px;flex-direction:column;gap:8px"><div style="font-size:24px">🗺️</div><div>지도 로드 실패 · 우측 바 차트를 참고하세요</div></div>';
    });
}

/* ── 지역 바 (대시보드) ───────────────────────── */
function renderRegionBar() {
  const names = DATA.region_names;
  const vals  = DATA.region_vals;
  Plotly.newPlot('chart-region-bar', [{
    x: vals, y: names,
    type:'bar', orientation:'h',
    marker:{ color: vals.map((_,i) => i===0?'#3b82f6':i===1?'#22d3ee':i===2?'#a78bfa':'rgba(59,130,246,0.38)') },
    text: vals.map(v=>v+'명'),
    textposition:'outside', textfont:{...FONT,size:11},
    hovertemplate:'<b>%{y}</b><br>%{x}명 (%{customdata}%)<extra></extra>',
    customdata: vals.map(v=>(v/DATA.total_gifts*100).toFixed(1)),
  }], { ...BASE, margin:{t:10,r:60,b:36,l:90}, xaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false}, yaxis:{tickfont:{...FONT,size:11}} }, CFG);
}

/* ── 일별 선물신청 ────────────────────────────── */
function renderGiftDaily(elId='chart-gift-daily') {
  const dates = DATA.gift_dates.map(d=>d.slice(5));
  const vals  = DATA.gift_vals;
  const peak  = Math.max(...vals);
  Plotly.newPlot(elId, [{
    x:dates, y:vals, type:'bar',
    marker:{ color: vals.map(v=>v===peak?'#f97316':'rgba(59,130,246,0.6)'), line:{width:0} },
    text: vals.map(v=>v===peak?v:''),
    textposition:'outside', textfont:{...FONT,size:11,color:'#f97316'},
    hovertemplate:'<b>%{x}</b><br>신청 %{y}건<extra></extra>',
  }], { ...BASE, xaxis:{gridcolor:GRID.color,tickfont:FONT,showgrid:false}, yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false} }, CFG);
}

/* ── 유저별 분포 ──────────────────────────────── */
function renderUserDist() {
  Plotly.newPlot('chart-user-dist', [{
    x: DATA.dist_keys.map(k=>`${k}개`),
    y: DATA.dist_vals,
    type:'bar',
    marker:{ color: DATA.dist_keys.map(k=>k>=8?'#10b981':k>=5?'#3b82f6':'#475569'), line:{width:0} },
    hovertemplate:'스탬프 %{x}<br><b>%{y}명</b><extra></extra>',
  }], {
    ...BASE,
    xaxis:{gridcolor:GRID.color,tickfont:{...FONT,size:10.5}},
    yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false},
    shapes:[{ type:'line',x0:'8개',x1:'8개',y0:0,y1:220,line:{color:'#10b981',width:1.5,dash:'dot'} }],
    annotations:[{ x:'8개',y:215,text:'선물 기준',showarrow:false,font:{size:10,color:'#10b981'},xanchor:'center' }],
  }, CFG);
}

/* ── 시간대별 ────────────────────────────────── */
function renderHour() {
  const peakI = DATA.hour_vals.indexOf(Math.max(...DATA.hour_vals));
  Plotly.newPlot('chart-hour', [{
    x: DATA.hours.map(h=>`${h}시`),
    y: DATA.hour_vals,
    type:'bar',
    marker:{ color: DATA.hour_vals.map((_,i)=>i===peakI?'#f97316':([3,4,5,6].includes(i)?'#3b82f6':'#2d3f5e')), line:{width:0} },
    hovertemplate:'<b>%{x}</b><br>%{y}건<extra></extra>',
  }], {
    ...BASE,
    margin:{t:10,r:16,b:36,l:44},
    xaxis:{gridcolor:GRID.color,tickfont:{...FONT,size:10.5},showgrid:false},
    yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false},
    annotations:[{ x:'12시',y:695,text:'🔥 피크',showarrow:false,font:{size:10.5,color:'#f97316'} }],
  }, CFG);
}

/* ── 상세보고서: 누적 ─────────────────────────── */
function renderCumul() {
  Plotly.newPlot('chart-cumul', [{
    x: DATA.daily_dates.map(d=>d.slice(5)),
    y: DATA.cumul_vals,
    type:'scatter', mode:'lines',
    line:{color:'#a78bfa',width:3,shape:'spline'},
    fill:'tozeroy', fillcolor:'rgba(167,139,250,0.08)',
    hovertemplate:'<b>%{x}</b><br>누적 %{y}건<extra></extra>',
  }], { ...BASE, margin:{t:10,r:20,b:36,l:56}, xaxis:{gridcolor:GRID.color,tickfont:FONT,showgrid:false}, yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false,tickformat:','} }, CFG);
}

/* ── 상세보고서: 산점도 ───────────────────────── */
function renderScatter() {
  const pd = DATA.place_data;
  const convColors = pd.map(p=>p.conv>=12?'#10b981':p.conv>=9?'#22d3ee':p.conv>=7?'#f59e0b':'#94a3b8');
  Plotly.newPlot('chart-scatter', [{
    x: pd.map(p=>p.stamps), y: pd.map(p=>p.reviews),
    mode:'markers+text',
    marker:{ color:convColors, size:16, opacity:0.9, line:{color:'#0d1117',width:2} },
    text: pd.map(p=>p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐').replace('함평 로컬푸드 직매장','로컬푸드').slice(0,6)),
    textposition:'top center', textfont:{...FONT,size:10.5},
    hovertemplate:'<b>%{customdata}</b><br>인증: %{x}건<br>후기: %{y}건<extra></extra>',
    customdata: pd.map(p=>p.place),
  }], {
    ...BASE,
    margin:{t:20,r:20,b:44,l:50},
    xaxis:{title:{text:'스탬프 인증수',font:{...FONT,size:11.5}},gridcolor:GRID.color,tickfont:FONT,zeroline:false},
    yaxis:{title:{text:'여행후기 수',font:{...FONT,size:11.5}},gridcolor:GRID.color,tickfont:FONT,zeroline:false},
  }, CFG);
}

/* ── 선물 도넛 ───────────────────────────────── */
function renderGiftDonut(elId) {
  Plotly.newPlot(elId, [{
    labels:['지급완료','처리중','대기중'],
    values:[150,150,115],
    type:'pie', hole:0.55,
    marker:{colors:['#10b981','#3b82f6','#ef4444'],line:{color:'#1a2233',width:2}},
    textinfo:'none',
    hovertemplate:'%{label}<br>%{value}명 (%{percent})<extra></extra>',
  }], {
    ...BASE, showlegend:true,
    legend:{font:{...FONT,size:11},x:0.65,y:0.5,bgcolor:'rgba(0,0,0,0)'},
    margin:{t:10,r:90,b:10,l:10},
    annotations:[{text:'415<br>총신청',x:0.35,y:0.5,showarrow:false,align:'center',font:{size:13,color:'#e2e8f0',family:"'Noto Sans KR'"}}],
  }, CFG);
}

/* ── 후기 장소 바 ─────────────────────────────── */
function renderReviewPlaceChart(elId) {
  const pd = DATA.place_data;
  const names = pd.map(p=>p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐전시관').replace('함평 로컬푸드 직매장','로컬푸드직매장'));
  Plotly.newPlot(elId, [
    {name:'스탬프 인증',x:names,y:pd.map(p=>p.stamps),type:'bar',marker:{color:'rgba(59,130,246,0.5)'}},
    {name:'여행후기',x:names,y:pd.map(p=>p.reviews),type:'bar',marker:{color:'#a78bfa'}},
  ], {
    ...BASE, barmode:'group', showlegend:true,
    legend:{font:{...FONT,size:11},orientation:'h',x:0,y:1.1,bgcolor:'rgba(0,0,0,0)'},
    margin:{t:30,r:16,b:48,l:44},
    xaxis:{tickfont:{...FONT,size:10},tickangle:-25,gridcolor:GRID.color},
    yaxis:{gridcolor:GRID.color,tickfont:FONT,zeroline:false},
  }, CFG);
}
