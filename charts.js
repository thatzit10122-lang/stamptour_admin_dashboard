/**
 * charts.js
 * ─────────────────────────────────────────────────────────────────
 * Plotly.js 기반 차트 렌더링 전담 모듈.
 * API 교체 시 이 파일은 수정 불필요.
 * 데이터 구조가 변경된 경우에만 각 draw 함수 내부 매핑을 수정하세요.
 * ─────────────────────────────────────────────────────────────────
 */

/* ── Plotly 공통 설정 ── */
const _BG   = 'rgba(0,0,0,0)';
const _FONT = { family: "'Noto Sans KR', system-ui, sans-serif", color: '#64748b', size: 12 };
const _GC   = 'rgba(30,45,69,0.85)';
const _CFG  = { responsive: true, displayModeBar: false };
const _PAL  = ['#3b82f6','#22d3ee','#a78bfa','#10b981','#f97316','#f59e0b','#ec4899','#6366f1','#14b8a6','#84cc16'];

/** 기본 레이아웃 생성 */
function _layout(margin, extra) {
  return Object.assign({
    paper_bgcolor: _BG,
    plot_bgcolor:  _BG,
    font:          _FONT,
    margin:        margin || { t: 10, r: 20, b: 44, l: 52 },
    showlegend:    false,
  }, extra || {});
}

/** 기본 축 설정 */
function _ax(extra) {
  return Object.assign({ gridcolor: _GC, tickfont: _FONT, zeroline: false }, extra || {});
}

/* 일별/누적 토글 상태 */
let _stampMode = 'daily';

/* 대시보드 데이터 캐시 */
let _data = null;

/**
 * 데이터 주입 (app.js에서 API 응답 후 호출)
 * @param {object} data - fetchDashboard() 응답
 */
function setData(data) {
  _data = data;
}


/* ════════════════════════════════════════════════
   1. 일별 / 누적 스탬프 인증 추이
════════════════════════════════════════════════ */
function drawStampTrend() {
  if (!_data) return;

  const labels = _data.daily_stamps.map(d => d.date.slice(5).replace('-', '/'));
  const daily  = _data.daily_stamps.map(d => d.count);
  const cumul  = _data.cumul_vals;

  const vals  = _stampMode === 'daily' ? daily : cumul;
  const color = _stampMode === 'daily' ? '#3b82f6' : '#22d3ee';
  const fill  = _stampMode === 'daily' ? 'rgba(59,130,246,0.1)' : 'rgba(34,211,238,0.1)';
  const peak  = Math.max(...vals);

  Plotly.newPlot('chart-daily', [{
    x: labels, y: vals,
    type: 'scatter', mode: 'lines+markers',
    line:   { color, width: 2.5, shape: 'spline' },
    marker: {
      color: vals.map(v => v === peak ? '#f97316' : color),
      size:  vals.map(v => v === peak ? 10 : 6),
      line:  { width: 2, color: '#0d1117' },
    },
    fill: 'tozeroy', fillcolor: fill,
    hovertemplate: '<b>%{x}</b><br>%{y:,}건<extra></extra>',
  }], _layout(
    { t: 10, r: 20, b: 40, l: 52 },
    { xaxis: _ax({ showgrid: false }), yaxis: _ax({ tickformat: ',' }) }
  ), _CFG);
}

/** 일별/누적 토글 */
function toggleStamp(mode) {
  _stampMode = mode;
  document.getElementById('btn-daily').classList.toggle('on', mode === 'daily');
  document.getElementById('btn-cumul').classList.toggle('on', mode === 'cumul');
  drawStampTrend();
}


/* ════════════════════════════════════════════════
   2. 장소별 스탬프 인증수 (수평 바)
════════════════════════════════════════════════ */
function drawPlaceBar() {
  if (!_data) return;

  /* 오름차순 정렬 → 위에 큰 값 표시 */
  const sorted = [..._data.place_data].sort((a, b) => a.stamps - b.stamps);
  const names  = sorted.map(p =>
    p.place.replace('함평추억공작소(황금박쥐전시관)', '황금박쥐전시관')
           .replace('함평 로컬푸드 직매장', '로컬푸드직매장')
  );
  const vals = sorted.map(p => p.stamps);

  Plotly.newPlot('chart-place-bar', [{
    x: vals, y: names,
    type: 'bar', orientation: 'h',
    marker: { color: [..._PAL].reverse().slice(0, vals.length), line: { width: 0 } },
    text: vals.map(v => v.toLocaleString()),
    textposition: 'outside',
    textfont: { size: 11.5, color: '#94a3b8' },
    hovertemplate: '<b>%{y}</b><br>%{x:,}건<extra></extra>',
    cliponaxis: false,
  }], _layout(
    { t: 10, r: 70, b: 40, l: 125 },
    { xaxis: _ax({ tickformat: ',' }), yaxis: { tickfont: { ..._FONT, size: 11 } } }
  ), _CFG);
}


/* ════════════════════════════════════════════════
   3. 장소별 스탬프 비중 (도넛)
════════════════════════════════════════════════ */
function drawDonut() {
  if (!_data) return;

  const pd = _data.place_data;

  Plotly.newPlot('chart-donut', [{
    labels: pd.map(p => p.place),
    values: pd.map(p => p.stamps),
    type: 'pie', hole: 0.54,
    marker: { colors: _PAL, line: { color: '#0d1117', width: 2.5 } },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b><br>%{value:,}건 (%{percent})<extra></extra>',
    rotation: 30,
  }], Object.assign(_layout({ t: 10, r: 145, b: 10, l: 10 }), {
    showlegend: true,
    legend: { font: { ..._FONT, size: 10.5 }, orientation: 'v', x: 1.02, y: 0.5, bgcolor: 'rgba(0,0,0,0)' },
    annotations: [{
      text: `<b>${_data.summary.total_stamps.toLocaleString()}</b><br>총 인증`,
      x: 0.36, y: 0.5, showarrow: false, align: 'center',
      font: { size: 13, color: '#e2e8f0', family: "'Noto Sans KR'" },
    }],
  }), _CFG);
}


/* ════════════════════════════════════════════════
   4. 선물신청자 지역 분포 (버블 지도 · scattergeo)
   Mapbox 토큰 불필요
════════════════════════════════════════════════ */
const _REGION_COORDS = {
  '서울':[37.56,126.97],'부산':[35.18,129.08],'대구':[35.87,128.60],'인천':[37.46,126.70],
  '광주':[35.16,126.85],'대전':[36.35,127.38],'울산':[35.54,129.31],'세종특별자치시':[36.48,127.29],
  '경기':[37.41,127.52],'강원':[37.88,128.00],'충북':[36.63,127.49],'충남':[36.66,126.67],
  '전북특별자치도':[35.71,127.15],'전남':[34.82,126.46],'경북':[36.49,128.89],
  '경남':[35.46,128.21],'제주':[33.49,126.53],
};

function drawMap() {
  if (!_data) return;

  const total = _data.summary.total_gifts;
  const maxV  = Math.max(..._data.region.map(r => r.count));
  const items = _data.region.filter(r => _REGION_COORDS[r.name]);

  Plotly.newPlot('chart-map', [{
    type: 'scattergeo',
    lat:  items.map(r => _REGION_COORDS[r.name][0]),
    lon:  items.map(r => _REGION_COORDS[r.name][1]),
    text: items.map(r => `<b>${r.name}</b><br>${r.count}명 (${(r.count/total*100).toFixed(1)}%)`),
    mode: 'markers+text',
    marker: {
      size:  items.map(r => Math.max(12, r.count / maxV * 65)),
      color: items.map(r => r.count),
      colorscale: [[0,'#1e3a5f'],[0.3,'rgba(59,130,246,0.5)'],[1,'#3b82f6']],
      cmin: 0, cmax: maxV,
      line: { color: 'rgba(255,255,255,0.3)', width: 1 },
      showscale: true,
      colorbar: {
        thickness: 12, len: 0.6,
        tickfont: { ..._FONT, size: 10 },
        title: { text: '명', font: _FONT, side: 'right' },
        x: 1.0, bgcolor: 'rgba(0,0,0,0)', bordercolor: 'rgba(0,0,0,0)',
      },
    },
    textposition: items.map(r => ['광주','전남'].includes(r.name) ? 'top center' : 'top right'),
    textfont: { ..._FONT, size: 10.5, color: '#e2e8f0' },
    hovertemplate: '%{text}<extra></extra>',
  }], {
    paper_bgcolor: _BG,
    font: _FONT,
    geo: {
      scope: 'asia', resolution: 50,
      center: { lat: 36.5, lon: 127.5 },
      projection: { type: 'mercator', scale: 5 },
      lataxis: { range: [33, 39] },
      lonaxis: { range: [124, 131] },
      showland: true, landcolor: '#1a2233',
      showcoastlines: true, coastlinecolor: '#253352', coastlinewidth: 1,
      showocean: true, oceancolor: '#0d1117',
      showcountries: true, countrycolor: '#1e2d45', countrywidth: 1,
      bgcolor: _BG, framecolor: 'rgba(0,0,0,0)',
    },
    margin: { t: 0, r: 60, b: 0, l: 0 },
    showlegend: false,
  }, _CFG);
}


/* ════════════════════════════════════════════════
   5. 시도별 신청자 현황 (수평 바)
════════════════════════════════════════════════ */
function drawRegionBar() {
  if (!_data) return;

  const total = _data.summary.total_gifts;
  const items = _data.region;

  Plotly.newPlot('chart-region', [{
    x: items.map(r => r.count),
    y: items.map(r => r.name),
    type: 'bar', orientation: 'h',
    marker: {
      color: items.map((_, i) =>
        i===0?'#3b82f6':i===1?'#22d3ee':i===2?'#a78bfa':i===3?'#10b981':i===4?'#f59e0b':'rgba(59,130,246,0.42)'
      ),
      line: { width: 0 },
    },
    text: items.map(r => `${r.count}명 (${(r.count/total*100).toFixed(1)}%)`),
    textposition: 'outside',
    textfont: { size: 11, color: '#94a3b8' },
    hovertemplate: '<b>%{y}</b><br>%{x}명<extra></extra>',
    cliponaxis: false,
  }], _layout(
    { t: 10, r: 150, b: 40, l: 115 },
    { xaxis: _ax(), yaxis: { tickfont: { ..._FONT, size: 11 } } }
  ), _CFG);
}


/* ════════════════════════════════════════════════
   6. 일별 선물신청 추이 (바)
════════════════════════════════════════════════ */
function drawGiftDaily(elId) {
  if (!_data) return;
  elId = elId || 'chart-gift-daily';

  const labels = _data.gift_daily.map(d => d.date.slice(5).replace('-', '/'));
  const vals   = _data.gift_daily.map(d => d.count);
  const peak   = Math.max(...vals);
  const peakI  = vals.indexOf(peak);

  Plotly.newPlot(elId, [{
    x: labels, y: vals,
    type: 'bar',
    marker: {
      color: vals.map((_, i) => i === peakI ? '#f97316' : '#3b82f6'),
      opacity: vals.map((_, i) => i === peakI ? 1 : 0.65),
      line: { width: 0 },
    },
    text: vals.map((_, i) => i === peakI ? peak + '' : ''),
    textposition: 'outside',
    textfont: { size: 11, color: '#f97316' },
    hovertemplate: '<b>%{x}</b><br>%{y}건<extra></extra>',
    cliponaxis: false,
  }], _layout(
    { t: 22, r: 16, b: 40, l: 44 },
    {
      xaxis: _ax({ showgrid: false }),
      yaxis: _ax(),
      annotations: [{
        x: labels[peakI], y: peak + 0.5,
        text: `최다 ${peak}건`, showarrow: false,
        font: { size: 10.5, color: '#f97316' },
      }],
    }
  ), _CFG);
}


/* ════════════════════════════════════════════════
   7. 유저별 스탬프 수 분포 히스토그램
════════════════════════════════════════════════ */
function drawUserDist(elId) {
  if (!_data) return;
  elId = elId || 'chart-dist';

  const keys = _data.dist.map(d => d.stamps + '개');
  const vals = _data.dist.map(d => d.users);
  const peak = Math.max(...vals);

  Plotly.newPlot(elId, [{
    x: keys, y: vals,
    type: 'bar',
    marker: {
      color: _data.dist.map(d => d.stamps >= 8 ? '#10b981' : d.stamps >= 5 ? '#3b82f6' : '#475569'),
      line: { width: 0 },
    },
    hovertemplate: '스탬프 <b>%{x}</b><br>%{y}명<extra></extra>',
    cliponaxis: false,
  }], _layout(
    { t: 30, r: 16, b: 44, l: 52 },
    {
      xaxis: _ax({ showgrid: false, title: { text: '스탬프 개수', font: { ..._FONT, size: 11.5 } } }),
      yaxis: _ax({ title: { text: '유저 수(명)', font: { ..._FONT, size: 11.5 } } }),
      shapes: [{
        type: 'line', x0: '8개', x1: '8개', y0: 0, y1: peak * 1.15,
        line: { color: '#10b981', width: 1.5, dash: 'dot' },
      }],
      annotations: [{
        x: '8개', y: peak * 1.18,
        text: '선물 기준(8개)', showarrow: false,
        font: { size: 10, color: '#10b981' }, xanchor: 'center',
      }],
    }
  ), _CFG);
}


/* ════════════════════════════════════════════════
   8. 시간대별 인증 패턴 (바)
════════════════════════════════════════════════ */
function drawHourPattern(elId) {
  if (!_data) return;
  elId = elId || 'chart-hour';

  const labels = _data.hour_dist.map(h => h.hour + '시');
  const vals   = _data.hour_dist.map(h => h.count);
  const peak   = Math.max(...vals);
  const peakI  = vals.indexOf(peak);
  const peakHours = [10, 11, 12, 13, 14];

  Plotly.newPlot(elId, [{
    x: labels, y: vals,
    type: 'bar',
    marker: {
      color: _data.hour_dist.map((h, i) =>
        i === peakI ? '#f97316' : peakHours.includes(h.hour) ? '#3b82f6' : '#2d3f5e'
      ),
      line: { width: 0 },
    },
    text: vals.map((_, i) => i === peakI ? vals[i].toLocaleString() + '건' : ''),
    textposition: 'outside',
    textfont: { size: 11, color: '#f97316' },
    hovertemplate: '<b>%{x}</b><br>%{y:,}건<extra></extra>',
    cliponaxis: false,
  }], _layout(
    { t: 22, r: 16, b: 44, l: 56 },
    {
      xaxis: _ax({ showgrid: false, title: { text: '시간대', font: { ..._FONT, size: 11.5 } } }),
      yaxis: _ax({ tickformat: ',', title: { text: '인증 건수', font: { ..._FONT, size: 11.5 } } }),
      shapes: [{
        type: 'rect', x0: '10시', x1: '14시', y0: 0, y1: peak * 1.05,
        fillcolor: 'rgba(59,130,246,0.05)', line: { width: 0 }, layer: 'below',
      }],
      annotations: [{
        x: labels[peakI], y: peak * 1.1,
        text: '🔥 피크', showarrow: false,
        font: { size: 11, color: '#f97316' }, xanchor: 'center',
      }],
    }
  ), _CFG);
}


/* ════════════════════════════════════════════════
   보조 차트 (서브 페이지용)
════════════════════════════════════════════════ */

/** 선물 처리 상태 도넛 */
function drawGiftStatusDonut(elId, done, proc, wait, total) {
  Plotly.newPlot(elId, [{
    labels: ['지급완료','처리중','대기중'], values: [done, proc, wait],
    type: 'pie', hole: 0.55,
    marker: { colors: ['#10b981','#3b82f6','#ef4444'], line: { color: '#1a2233', width: 2 } },
    textinfo: 'none',
    hovertemplate: '%{label}<br>%{value}명 (%{percent})<extra></extra>',
  }], Object.assign(_layout({ t: 10, r: 90, b: 10, l: 10 }), {
    showlegend: true,
    legend: { font: { ..._FONT, size: 11.5 }, x: 0.66, y: 0.5, bgcolor: 'rgba(0,0,0,0)' },
    annotations: [{
      text: `${total}<br><span style="font-size:11px">총신청</span>`,
      x: 0.35, y: 0.5, showarrow: false, align: 'center',
      font: { size: 14, color: '#e2e8f0', family: "'Noto Sans KR'" },
    }],
  }), _CFG);
}

/** 장소별 인증 vs 후기 그룹 바 */
function drawReviewPlaceBar(elId) {
  if (!_data) return;
  const pd = _data.place_data;
  const names = pd.map(p =>
    p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐').replace('함평 로컬푸드 직매장','로컬푸드')
  );
  Plotly.newPlot(elId, [
    { name: '스탬프', x: names, y: pd.map(p => p.stamps), type: 'bar', marker: { color: 'rgba(59,130,246,0.55)', line: { width: 0 } } },
    { name: '후기',   x: names, y: pd.map(p => p.reviews), type: 'bar', marker: { color: '#a78bfa', line: { width: 0 } } },
  ], Object.assign(_layout({ t: 30, r: 16, b: 52, l: 44 }), {
    barmode: 'group', showlegend: true,
    legend: { font: { ..._FONT, size: 11 }, orientation: 'h', x: 0, y: 1.1, bgcolor: 'rgba(0,0,0,0)' },
    xaxis: _ax({ showgrid: false, tickangle: -30, tickfont: { ..._FONT, size: 10 } }),
    yaxis: _ax({ tickformat: ',' }),
  }), _CFG);
}

/** 누적 스탬프 추이 */
function drawCumul(elId) {
  if (!_data) return;
  const labels = _data.daily_stamps.map(d => d.date.slice(5).replace('-', '/'));
  Plotly.newPlot(elId, [{
    x: labels, y: _data.cumul_vals,
    type: 'scatter', mode: 'lines',
    line: { color: '#a78bfa', width: 3, shape: 'spline' },
    fill: 'tozeroy', fillcolor: 'rgba(167,139,250,0.09)',
    hovertemplate: '<b>%{x}</b><br>누적 %{y:,}건<extra></extra>',
  }], _layout(
    { t: 10, r: 20, b: 40, l: 60 },
    { xaxis: _ax({ showgrid: false }), yaxis: _ax({ tickformat: ',' }) }
  ), _CFG);
}

/** 스탬프 vs 후기 산점도 */
function drawScatter(elId) {
  if (!_data) return;
  const pd = _data.place_data;
  const cc = pd.map(p => p.conv >= 12 ? '#10b981' : p.conv >= 9 ? '#22d3ee' : p.conv >= 7 ? '#f59e0b' : '#94a3b8');
  Plotly.newPlot(elId, [{
    x: pd.map(p => p.stamps), y: pd.map(p => p.reviews),
    mode: 'markers+text',
    marker: { color: cc, size: 17, opacity: 0.88, line: { color: '#0d1117', width: 2 } },
    text: pd.map(p => p.place.replace('함평추억공작소(황금박쥐전시관)','황금박쥐').replace('함평 로컬푸드 직매장','로컬푸드').slice(0,5)),
    textposition: 'top center',
    textfont: { ..._FONT, size: 10.5, color: '#94a3b8' },
    hovertemplate: '<b>%{customdata}</b><br>인증: %{x:,}건<br>후기: %{y}건<br>전환율: %{meta}%<extra></extra>',
    customdata: pd.map(p => p.place),
    meta: pd.map(p => p.conv),
  }], _layout(
    { t: 20, r: 20, b: 52, l: 56 },
    {
      xaxis: _ax({ title: { text: '스탬프 인증수', font: { ..._FONT, size: 12 } }, tickformat: ',' }),
      yaxis: _ax({ title: { text: '여행후기 수',   font: { ..._FONT, size: 12 } } }),
    }
  ), _CFG);
}


/* ── 외부 노출 ── */
const Charts = {
  setData,
  drawStampTrend,
  drawPlaceBar,
  drawDonut,
  drawMap,
  drawRegionBar,
  drawGiftDaily,
  drawUserDist,
  drawHourPattern,
  drawGiftStatusDonut,
  drawReviewPlaceBar,
  drawCumul,
  drawScatter,
  toggleStamp,
};
