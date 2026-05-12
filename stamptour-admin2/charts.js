/* charts.js — 모든 Plotly 차트 렌더링 */

/* ── 공통 설정 ────────────────────────────────── */
const BG   = 'rgba(0,0,0,0)';
const FONT = { family:"'Noto Sans KR',sans-serif", color:'#64748b', size:11.5 };
const GC   = 'rgba(30,45,69,0.85)';
const CFG  = { responsive:true, displayModeBar:false };
const PAL  = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];
const BASE = {
  paper_bgcolor:BG, plot_bgcolor:BG, font:FONT,
  margin:{t:10,r:16,b:40,l:48}, showlegend:false,
};
function ax(extra={}) { return { gridcolor:GC, tickfont:FONT, zeroline:false, ...extra }; }

/* ── 공통 레이아웃 헬퍼 ─────────────────────── */
function baseLayout(extra={}) { return { ...BASE, ...extra }; }

/* ════════════════════════════════════════════════
   1. 일별 스탬프 인증 추이 (일별 / 누적 토글)
════════════════════════════════════════════════ */
let stampMode = 'daily';

function renderStampChart() {
  const dates = DATA.daily_dates.map(d => d.slice(5).replace('-','/'));
  const y     = stampMode === 'daily' ? DATA.daily_vals : DATA.cumul_vals;
  const color = stampMode === 'daily' ? '#3b82f6' : '#22d3ee';
  const fill  = stampMode === 'daily' ? 'rgba(59,130,246,0.1)' : 'rgba(34,211,238,0.1)';
  const peak  = Math.max(...y);

  Plotly.newPlot('chart-daily', [{
    x: dates, y,
    type: 'scatter', mode: 'lines+markers',
    line: { color, width: 2.5, shape: 'spline' },
    marker: {
      color: y.map(v => v === peak ? '#f97316' : color),
      size:  y.map(v => v === peak ? 9 : 6),
      line:  { width: 2, color: '#0d1117' }
    },
    fill: 'tozeroy', fillcolor: fill,
    hovertemplate: '<b>%{x}</b><br>%{y:,}건<extra></extra>',
    text: y.map((v,i) => v === peak ? `최다 ${v.toLocaleString()}건` : ''),
    textposition: 'top center',
    textfont: { size: 11, color: '#f97316' },
  }], baseLayout({
    margin: { t:20, r:20, b:40, l:52 },
    xaxis: ax({ showgrid: false }),
    yaxis: ax({ tickformat: ',' }),
    annotations: [{
      x: dates[DATA.daily_vals.indexOf(Math.max(...DATA.daily_vals))],
      y: Math.max(...y), text: '',
      showarrow: false,
    }],
  }), CFG);
}

function toggleStamp(mode, btn) {
  stampMode = mode;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStampChart();
}

/* ════════════════════════════════════════════════
   2. 장소별 스탬프 인증수 (수평 바)
════════════════════════════════════════════════ */
function renderPlaceStamp() {
  const pd     = [...DATA.place_data].sort((a,b) => a.stamps - b.stamps); // 오름차순 → 위에 큰 값
  const names  = pd.map(p => p.place
    .replace('함평추억공작소(황금박쥐전시관)', '황금박쥐전시관')
    .replace('함평 로컬푸드 직매장', '로컬푸드직매장'));
  const colors = [...PAL].reverse();

  Plotly.newPlot('chart-place-stamp', [{
    x: pd.map(p => p.stamps),
    y: names,
    type: 'bar', orientation: 'h',
    marker: { color: colors, line: { width: 0 } },
    text: pd.map(p => p.stamps.toLocaleString()),
    textposition: 'outside',
    textfont: { ...FONT, size: 11.5, color: '#94a3b8' },
    hovertemplate: '<b>%{y}</b><br>인증: %{x:,}건<extra></extra>',
    cliponaxis: false,
  }], baseLayout({
    margin: { t: 10, r: 65, b: 40, l: 115 },
    xaxis: ax({ tickformat: ',' }),
    yaxis: { tickfont: { ...FONT, size: 11 } },
  }), CFG);
}

/* ════════════════════════════════════════════════
   3. 장소별 스탬프 비중 도넛
════════════════════════════════════════════════ */
function renderDonut() {
  const pd = DATA.place_data;

  Plotly.newPlot('chart-donut', [{
    labels: pd.map(p => p.place),
    values: pd.map(p => p.stamps),
    type: 'pie', hole: 0.54,
    marker: { colors: PAL, line: { color: '#0d1117', width: 2.5 } },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b><br>%{value:,}건<br>비중: %{percent}<extra></extra>',
    rotation: 30,
    pull: pd.map((_,i) => i === 0 ? 0.04 : 0),
  }], {
    ...BASE,
    showlegend: true,
    legend: {
      font: { ...FONT, size: 10.5 },
      orientation: 'v', x: 1.02, y: 0.5,
      bgcolor: 'rgba(0,0,0,0)', itemclick: false,
    },
    margin: { t: 10, r: 150, b: 10, l: 10 },
    annotations: [{
      text: `<b>${DATA.total_stamps.toLocaleString()}</b><br><span style="font-size:12px">총 인증건</span>`,
      x: 0.36, y: 0.5, showarrow: false, align: 'center',
      font: { size: 14, color: '#e2e8f0', family: "'Noto Sans KR',sans-serif" },
    }],
  }, CFG);
}

/* ════════════════════════════════════════════════
   4. Choropleth — 한국 시도별 선물신청자 분포
════════════════════════════════════════════════ */
function renderChoropleth() {
  const el = document.getElementById('chart-choropleth');

  // 로딩 표시
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:12px;gap:8px"><span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> 지도 로드 중…</div>';

  const GEO_MAP = {
    '서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon',
    '광주':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종특별자치시':'Sejong',
    '경기':'Gyeonggi-do','강원':'Gangwon-do','충북':'Chungcheongbuk-do',
    '충남':'Chungcheongnam-do','전북특별자치도':'Jeollabuk-do','전남':'Jeollanam-do',
    '경북':'Gyeongsangbuk-do','경남':'Gyeongsangnam-do','제주':'Jeju-do',
  };

  fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json')
    .then(r => { if(!r.ok) throw new Error('fetch fail'); return r.json(); })
    .then(geo => {
      el.innerHTML = '';

      const regionIdx = {};
      DATA.region_names.forEach((n,i) => { regionIdx[n] = DATA.region_vals[i]; });

      const locations=[], zs=[], texts=[], hover=[];
      geo.features.forEach(f => {
        const eng = f.properties.name_eng;
        // reverse-lookup: eng → kor
        const kor = Object.keys(GEO_MAP).find(k => GEO_MAP[k] === eng) || '';
        const val = regionIdx[kor] || 0;
        locations.push(eng);
        zs.push(val);
        texts.push(kor ? `${kor}<br>${val}명` : eng);
        hover.push(val);
      });

      const maxVal = Math.max(...zs);

      Plotly.newPlot('chart-choropleth', [{
        type: 'choroplethmapbox',
        geojson: geo,
        locations, z: zs,
        featureidkey: 'properties.name_eng',
        colorscale: [
          [0,    '#1a2233'],
          [0.01, '#1e3a5f'],
          [0.15, 'rgba(59,130,246,0.3)'],
          [0.4,  'rgba(59,130,246,0.6)'],
          [0.7,  '#2563eb'],
          [1.0,  '#1d4ed8'],
        ],
        zmin: 0, zmax: maxVal,
        marker: { line: { color: '#0d1117', width: 1 } },
        text: texts,
        hovertemplate: '%{text}<extra></extra>',
        showscale: true,
        colorbar: {
          thickness: 12, len: 0.7,
          tickfont: { ...FONT, size: 10.5 },
          title: { text: '명', font: { ...FONT, size: 11 }, side: 'right' },
          x: 1.0, y: 0.5,
          bgcolor: 'rgba(0,0,0,0)',
          bordercolor: 'rgba(0,0,0,0)',
          tickcolor: '#64748b',
        },
      }], {
        paper_bgcolor: BG, font: FONT,
        margin: { t: 0, r: 0, b: 0, l: 0 },
        mapbox: {
          style: 'carto-darkmatter',
          center: { lat: 36.3, lon: 127.8 },
          zoom: 5.0,
        },
      }, CFG);
    })
    .catch(() => {
      // fallback: 인라인 바 차트
      el.innerHTML = '';
      renderRegionFallback('chart-choropleth');
    });
}

/* GeoJSON 로드 실패시 fallback 바 차트 */
function renderRegionFallback(elId) {
  const names = DATA.region_names;
  const vals  = DATA.region_vals;
  const colors = vals.map((_,i) => i===0?'#3b82f6':i===1?'#22d3ee':i===2?'#a78bfa':
                   i===3?'#10b981':i===4?'#f59e0b':'rgba(59,130,246,0.4)');
  Plotly.newPlot(elId, [{
    x: vals, y: names,
    type: 'bar', orientation: 'h',
    marker: { color: colors, line:{ width:0 } },
    text: vals.map(v => v+'명'),
    textposition: 'outside',
    textfont: { ...FONT, size: 11.5, color:'#94a3b8' },
    hovertemplate: '<b>%{y}</b><br>%{x}명<extra></extra>',
    cliponaxis: false,
  }], baseLayout({
    margin: { t:10, r:60, b:40, l:100 },
    xaxis: ax(),
    yaxis: { tickfont: { ...FONT, size:11 } },
  }), CFG);
}

/* ════════════════════════════════════════════════
   5. 시도별 신청자 현황 (수평 바)
════════════════════════════════════════════════ */
function renderRegionBar() {
  const names  = DATA.region_names;
  const vals   = DATA.region_vals;
  const total  = DATA.total_gifts;
  const colors = vals.map((_,i) =>
    i===0?'#3b82f6':i===1?'#22d3ee':i===2?'#a78bfa':
    i===3?'#10b981':i===4?'#f59e0b':'rgba(59,130,246,0.42)');

  Plotly.newPlot('chart-region-bar', [{
    x: vals,
    y: names,
    type: 'bar', orientation: 'h',
    marker: { color: colors, line:{ width:0 } },
    text: vals.map((v,i) => `${v}명 (${(v/total*100).toFixed(1)}%)`),
    textposition: 'outside',
    textfont: { ...FONT, size: 11, color: '#94a3b8' },
    hovertemplate: '<b>%{y}</b><br>%{x}명 (%{customdata}%)<extra></extra>',
    customdata: vals.map(v => (v/total*100).toFixed(1)),
    cliponaxis: false,
  }], baseLayout({
    margin: { t:10, r:130, b:40, l:100 },
    xaxis: ax(),
    yaxis: { tickfont: { ...FONT, size:11 } },
  }), CFG);
}

/* ════════════════════════════════════════════════
   6. 일별 선물신청 추이
════════════════════════════════════════════════ */
function renderGiftDaily(elId = 'chart-gift-daily') {
  const dates = DATA.gift_dates.map(d => d.slice(5).replace('-','/'));
  const vals  = DATA.gift_vals;
  const peak  = Math.max(...vals);
  const peakI = vals.indexOf(peak);

  Plotly.newPlot(elId, [{
    x: dates, y: vals,
    type: 'bar',
    marker: {
      color: vals.map(v => v === peak ? '#f97316' : '#3b82f6'),
      opacity: vals.map(v => v === peak ? 1 : 0.65),
      line: { width: 0 },
    },
    text: vals.map((v,i) => i === peakI ? `${v}건` : ''),
    textposition: 'outside',
    textfont: { size: 11.5, color: '#f97316' },
    hovertemplate: '<b>%{x}</b><br>신청 %{y}건<extra></extra>',
    cliponaxis: false,
  }], baseLayout({
    margin: { t:20, r:16, b:40, l:44 },
    xaxis: ax({ showgrid: false }),
    yaxis: ax({ tickformat: ',' }),
    annotations: [{
      x: dates[peakI], y: peak + 3,
      text: `최다 ${peak}건`,
      showarrow: false,
      font: { size: 10.5, color: '#f97316' },
    }],
  }), CFG);
}

/* ════════════════════════════════════════════════
   7. 유저별 스탬프 수 분포 히스토그램
════════════════════════════════════════════════ */
function renderUserDist(elId = 'chart-user-dist') {
  const keys = DATA.dist_keys;
  const vals = DATA.dist_vals;
  const peak = Math.max(...vals);
  const peakI = vals.indexOf(peak);

  Plotly.newPlot(elId, [{
    x: keys.map(k => `${k}개`),
    y: vals,
    type: 'bar',
    marker: {
      color: keys.map(k => k >= 8 ? '#10b981' : k >= 5 ? '#3b82f6' : '#475569'),
      line: { width: 0 },
    },
    text: vals.map((v,i) => v > 30 ? v : ''),
    textposition: 'outside',
    textfont: { size: 11, color: '#94a3b8' },
    hovertemplate: '스탬프 <b>%{x}</b><br>유저 <b>%{y}명</b><extra></extra>',
    cliponaxis: false,
  }], baseLayout({
    margin: { t:30, r:20, b:44, l:52 },
    xaxis: ax({ showgrid: false, title:{ text:'스탬프 개수', font:{...FONT,size:11.5} } }),
    yaxis: ax({ title:{ text:'유저 수 (명)', font:{...FONT,size:11.5} } }),
    shapes: [{
      type: 'line', x0: '8개', x1: '8개', y0: 0, y1: peak * 1.12,
      line: { color: '#10b981', width: 1.5, dash: 'dot' },
    }],
    annotations: [{
      x: '8개', y: peak * 1.14,
      text: '선물 기준 (8개)',
      showarrow: false,
      font: { size: 10.5, color: '#10b981' },
      xanchor: 'center',
    },{
      x: '8개', y: vals[keys.indexOf(8)] + peak * 0.05,
      text: `${vals[keys.indexOf(8)]}명`,
      showarrow: false,
      font: { size: 10.5, color: '#10b981', family: "'Noto Sans KR'" },
      xanchor: 'center',
    }],
  }), CFG);
}

/* ════════════════════════════════════════════════
   8. 시간대별 인증 패턴
════════════════════════════════════════════════ */
function renderHour(elId = 'chart-hour') {
  const hours = DATA.hours;
  const vals  = DATA.hour_vals;
  const peak  = Math.max(...vals);
  const peakI = vals.indexOf(peak);

  // 모든 0~23시 생성 (없는 시간 = 0)
  const allHours = Array.from({length:13}, (_,i) => 8+i).filter(h=>h!==19); // 8~20시
  const hourMap  = {};
  hours.forEach((h,i) => { hourMap[h] = vals[i]; });
  const fullHours = hours;
  const fullVals  = vals;

  Plotly.newPlot(elId, [{
    x: fullHours.map(h => `${h}시`),
    y: fullVals,
    type: 'bar',
    marker: {
      color: fullVals.map((v,i) => {
        if(i === peakI) return '#f97316';
        if(fullHours[i] >= 10 && fullHours[i] <= 14) return '#3b82f6';
        return '#2d3f5e';
      }),
      line: { width: 0 },
    },
    text: fullVals.map((v,i) => i === peakI ? `${v.toLocaleString()}건` : ''),
    textposition: 'outside',
    textfont: { size: 11, color: '#f97316' },
    hovertemplate: '<b>%{x}</b><br>인증 %{y:,}건<extra></extra>',
    cliponaxis: false,
  }], baseLayout({
    margin: { t:30, r:20, b:44, l:56 },
    xaxis: ax({ showgrid: false, title:{ text:'시간대', font:{...FONT,size:11.5} } }),
    yaxis: ax({ tickformat: ',', title:{ text:'인증 건수', font:{...FONT,size:11.5} } }),
    shapes: [{
      type: 'rect', x0: '10시', x1: '14시', y0: 0, y1: peak * 1.05,
      fillcolor: 'rgba(59,130,246,0.05)', line: { width: 0 },
      layer: 'below',
    }],
    annotations: [{
      x: `${fullHours[peakI]}시`,
      y: peak * 1.08,
      text: '🔥 피크',
      showarrow: false,
      font: { size: 11, color: '#f97316' },
      xanchor: 'center',
    }],
  }), CFG);
}

/* ════════════════════════════════════════════════
   보조 차트: 선물 도넛 (gift page)
════════════════════════════════════════════════ */
function renderGiftStatusDonut(elId) {
  Plotly.newPlot(elId, [{
    labels: ['지급완료','처리중','대기중'],
    values: [150, 150, 115],
    type: 'pie', hole: 0.55,
    marker: { colors:['#10b981','#3b82f6','#ef4444'], line:{ color:'#1a2233', width:2 } },
    textinfo: 'none',
    hovertemplate: '%{label}<br>%{value}명 (%{percent})<extra></extra>',
  }], {
    ...BASE, showlegend:true,
    legend: { font:{...FONT,size:11.5}, x:0.65, y:0.5, bgcolor:'rgba(0,0,0,0)' },
    margin: { t:10, r:90, b:10, l:10 },
    annotations: [{
      text: '415<br><span style="font-size:11px">총신청</span>',
      x:0.35, y:0.5, showarrow:false, align:'center',
      font: { size:14, color:'#e2e8f0', family:"'Noto Sans KR'" },
    }],
  }, CFG);
}

/* ════════════════════════════════════════════════
   보조 차트: 후기 장소 그룹 바 (review page)
════════════════════════════════════════════════ */
function renderReviewPlaceBar(elId) {
  const pd = DATA.place_data;
  const names = pd.map(p => p.place
    .replace('함평추억공작소(황금박쥐전시관)','황금박쥐전시관')
    .replace('함평 로컬푸드 직매장','로컬푸드직매장'));

  Plotly.newPlot(elId, [
    {
      name:'스탬프 인증', x:names, y:pd.map(p=>p.stamps),
      type:'bar', marker:{color:'rgba(59,130,246,0.55)', line:{width:0}},
      hovertemplate:'%{x}<br>인증: %{y:,}건<extra></extra>',
    },
    {
      name:'여행후기', x:names, y:pd.map(p=>p.reviews),
      type:'bar', marker:{color:'#a78bfa', line:{width:0}},
      hovertemplate:'%{x}<br>후기: %{y}건<extra></extra>',
    },
  ], {
    ...BASE, barmode:'group', showlegend:true,
    legend:{ font:{...FONT,size:11.5}, orientation:'h', x:0, y:1.12, bgcolor:'rgba(0,0,0,0)' },
    margin:{ t:30, r:16, b:52, l:44 },
    xaxis: ax({ showgrid:false, tickangle:-30, tickfont:{...FONT,size:10} }),
    yaxis: ax({ tickformat:',' }),
  }, CFG);
}

/* ════════════════════════════════════════════════
   보조 차트: 누적 (report page)
════════════════════════════════════════════════ */
function renderCumul(elId) {
  Plotly.newPlot(elId, [{
    x: DATA.daily_dates.map(d=>d.slice(5).replace('-','/')),
    y: DATA.cumul_vals,
    type:'scatter', mode:'lines',
    line:{color:'#a78bfa', width:3, shape:'spline'},
    fill:'tozeroy', fillcolor:'rgba(167,139,250,0.09)',
    hovertemplate:'<b>%{x}</b><br>누적 %{y:,}건<extra></extra>',
  }], baseLayout({
    margin:{t:10,r:20,b:40,l:60},
    xaxis: ax({ showgrid:false }),
    yaxis: ax({ tickformat:',' }),
  }), CFG);
}

/* ════════════════════════════════════════════════
   보조 차트: 산점도 (report page)
════════════════════════════════════════════════ */
function renderScatter(elId) {
  const pd = DATA.place_data;
  const cc = pd.map(p => p.conv>=12?'#10b981':p.conv>=9?'#22d3ee':p.conv>=7?'#f59e0b':'#94a3b8');
  const shortNames = pd.map(p => p.place
    .replace('함평추억공작소(황금박쥐전시관)','황금박쥐')
    .replace('함평 로컬푸드 직매장','로컬푸드')
    .slice(0,6));

  Plotly.newPlot(elId, [{
    x: pd.map(p=>p.stamps), y: pd.map(p=>p.reviews),
    mode:'markers+text',
    marker:{ color:cc, size:18, opacity:0.88, line:{color:'#0d1117',width:2} },
    text: shortNames,
    textposition:'top center',
    textfont:{ ...FONT, size:10.5, color:'#94a3b8' },
    hovertemplate:'<b>%{customdata}</b><br>인증: %{x:,}건<br>후기: %{y}건<br>전환율: %{meta}%<extra></extra>',
    customdata: pd.map(p=>p.place),
    meta: pd.map(p=>p.conv),
  }], baseLayout({
    margin:{t:20,r:20,b:52,l:58},
    xaxis: ax({ title:{text:'스탬프 인증수',font:{...FONT,size:12}}, tickformat:',' }),
    yaxis: ax({ title:{text:'여행후기 수',font:{...FONT,size:12}} }),
  }), CFG);
}
