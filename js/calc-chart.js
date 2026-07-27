// ===================================================================
//  複利試算機 — 圖表繪製、Hover 互動、匯出圖片
// ===================================================================

// 圖表座標系（viewBox 640×300）。padding 放大以容納較大的座標軸文字。
// 左側留白（padL）會在 buildChartInner 內依最寬的 Y 軸標籤動態加大，
// 避免金額很大時（千萬位）座標軸數字被切掉。
const VBW = 640, VBH = 300, BASE_PADL = 60, padR = 18, padT = 30, padB = 36;
const PH = VBH - padT - padB;

// 圖表 hover 用的資料點（drawChart 會重新填入）
let hoverPts = [];

// 字級設定（集中管理，方便日後調整大小）
const CHART_FS = { axis:17, legend:16, target:16, emoji:20 };
const AXIS_COLOR = '#AECABE';

// -------------------------------------------------------------------
//  產生圖表內容（純函式，回傳 SVG 內部標記與 hover 點）
//  live 圖表與「匯出圖片」共用同一份繪圖邏輯。
// -------------------------------------------------------------------
function buildChartInner(d, targetVal){
  const months = d.months;
  let maxV = Math.max(targetVal || 0, 1);
  d.series.forEach(p => {
    maxV = Math.max(maxV, p.bal);
    if (showPaid) maxV = Math.max(maxV, p.paid);
    if (showReal) maxV = Math.max(maxV, p.real);
  });
  maxV *= 1.1;

  // 依最寬的 Y 軸標籤動態加大左側留白，避免大金額（千萬位）被切掉。
  let maxLabelW = 0;
  for (let i = 0; i <= 2; i++) maxLabelW = Math.max(maxLabelW, estTextW(fmtWanShort(maxV * i / 2), CHART_FS.axis));
  const padL = Math.max(BASE_PADL, Math.ceil(maxLabelW) + 14);
  const PW = VBW - padL - padR;

  const X = m => padL + PW * (m / (months || 1));
  const Yv = v => padT + PH * (1 - v / maxV);
  const path = key => {
    let dd = '';
    d.series.forEach((p, i) => { dd += (i ? 'L' : 'M') + X(p.m).toFixed(1) + ',' + Yv(p[key]).toFixed(1) + ' '; });
    return dd;
  };
  const balP  = path('bal');
  const areaP = balP + 'L' + X(months).toFixed(1) + ',' + (padT + PH) + ' L' + padL + ',' + (padT + PH) + ' Z';

  // 格線 + Y 軸標籤
  let grid = '';
  for (let i = 0; i <= 2; i++) {
    const v = maxV * i / 2, y = Yv(v);
    grid += '<line x1="' + padL + '" y1="' + y + '" x2="' + (VBW - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,.08)" stroke-width="1"/>';
    grid += '<text x="' + (padL - 8) + '" y="' + (y + 5) + '" fill="' + AXIS_COLOR + '" font-size="' + CHART_FS.axis + '" font-weight="600" font-family="Noto Sans TC" text-anchor="end">' + fmtWanShort(v) + '</text>';
  }

  // X 軸年份
  let xticks = '';
  const tickN = Math.min(months / 12, 6) || 1;
  const stepY = Math.max(1, Math.round((months / 12) / tickN));
  for (let yy = 0; yy <= months / 12; yy += stepY) {
    const x = X(yy * 12);
    xticks += '<text x="' + x + '" y="' + (VBH - 10) + '" fill="' + AXIS_COLOR + '" font-size="' + CHART_FS.axis + '" font-weight="600" font-family="Noto Sans TC" text-anchor="middle">' + yy + '年</text>';
  }

  // 事件標記（僅正向模式）
  let evMarks = '';
  if (mode === 'forward') {
    events.forEach(e => {
      const yr = clamp(Math.round(e.year), 1, F.years), x = X(yr * 12);
      evMarks += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (padT + PH) + '" stroke="' + (e.type === 'out' ? 'rgba(242,150,110,.45)' : 'rgba(150,220,150,.45)') + '" stroke-width="1.4" stroke-dasharray="3 4"/>';
      evMarks += '<text x="' + x + '" y="' + (padT - 9) + '" font-size="' + CHART_FS.emoji + '" text-anchor="middle">' + e.emoji + '</text>';
    });
  }

  // 目標線
  let tLine = '';
  if (targetVal) {
    const y = Yv(targetVal);
    tLine = '<line x1="' + padL + '" y1="' + y + '" x2="' + (VBW - padR) + '" y2="' + y + '" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 6" opacity=".75"/>'
      + '<text x="' + (VBW - padR - 2) + '" y="' + (y - 8) + '" fill="#fff" font-size="' + CHART_FS.target + '" font-family="Noto Sans TC" text-anchor="end" opacity=".95">🎯 ' + fmtWan(targetVal) + '</text>';
  }

  // 輔助線
  const paidLine = showPaid ? '<path d="' + path('paid') + '" fill="none" stroke="#8FA796" stroke-width="2.2" stroke-dasharray="6 6"/>' : '';
  const realLine = showReal ? '<path d="' + path('real') + '" fill="none" stroke="#C9B98C" stroke-width="2" stroke-dasharray="2 5"/>' : '';
  const last = d.series[d.series.length - 1];

  // 圖例
  const lh = CHART_FS.legend + 4;
  let ly = padT + CHART_FS.legend;
  let legend = '<text x="' + (padL + 2) + '" y="' + ly + '" fill="#F2C778" font-size="' + CHART_FS.legend + '" font-family="Noto Sans TC">── 資產(名目)</text>';
  if (showPaid) { ly += lh; legend += '<text x="' + (padL + 2) + '" y="' + ly + '" fill="#9FB3A4" font-size="' + CHART_FS.legend + '" font-family="Noto Sans TC">─ ─ 投入本金</text>'; }
  if (showReal) { ly += lh; legend += '<text x="' + (padL + 2) + '" y="' + ly + '" fill="#C9B98C" font-size="' + CHART_FS.legend + '" font-family="Noto Sans TC">··· 實質購買力</text>'; }

  const inner =
    '<defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#D89436" stop-opacity=".42"/>'
      + '<stop offset="1" stop-color="#D89436" stop-opacity="0"/></linearGradient></defs>'
    + grid + xticks + evMarks
    + '<path d="' + areaP + '" fill="url(#gArea)"/>'
    + paidLine + realLine
    + '<path d="' + balP + '" fill="none" stroke="#D89436" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + tLine
    + '<circle cx="' + X(months) + '" cy="' + Yv(last.bal) + '" r="5.5" fill="#fff" stroke="#D89436" stroke-width="3"/>'
    + legend;

  const points = d.byYear.map(p => ({ year:p.year, x:X(p.year * 12), y:Yv(p.bal), bal:p.bal, paid:p.paid, real:p.real, note:p.note }));
  return { inner, points };
}

// -------------------------------------------------------------------
//  畫到頁面上的 #chart
// -------------------------------------------------------------------
function drawChart(d, targetVal){
  const svg = $('chart'); if (!svg) return;
  const { inner, points } = buildChartInner(d, targetVal);
  svg.innerHTML = inner
    + '<line id="hovLine" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-dasharray="3 4" style="display:none"/>'
    + '<circle id="hovDot" r="6" fill="#fff" stroke="#D89436" stroke-width="3" style="display:none"/>';
  hoverPts = points;
}

// ---- 圖表 hover ----
(function initHover(){
  const host = $('chartHost'); if (!host) return;
  const tip = $('chartTip');
  function move(e){
    if (!hoverPts.length) return;
    const rect = host.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const vx = cx / rect.width * VBW;
    let best = hoverPts[0], bd = 1e9;
    hoverPts.forEach(p => { const dd = Math.abs(p.x - vx); if (dd < bd) { bd = dd; best = p; } });
    const line = $('hovLine'), dot = $('hovDot');
    if (line) { line.setAttribute('x1', best.x); line.setAttribute('x2', best.x); line.setAttribute('y1', padT); line.setAttribute('y2', padT + PH); line.style.display = 'block'; }
    if (dot) { dot.setAttribute('cx', best.x); dot.setAttribute('cy', best.y); dot.style.display = 'block'; }
    let html = '<span class="yr">第 ' + best.year + ' 年</span>'
      + '<span class="li"><span>資產</span><b>' + fmtWan(best.bal) + '</b></span>';
    if (showPaid) html += '<span class="li"><span>投入</span><b>' + fmtWan(best.paid) + '</b></span>';
    if (showReal) html += '<span class="li"><span>實質</span><b>' + fmtWan(best.real) + '</b></span>';
    if (best.note) html += '<span class="li" style="color:#F2C778">' + best.note + '</span>';
    tip.innerHTML = html;
    tip.style.left = (best.x / VBW * rect.width) + 'px';
    tip.style.top  = (best.y / VBH * rect.height) + 'px';
    tip.classList.remove('hide');
  }
  function leave(){ tip.classList.add('hide'); const l = $('hovLine'), d = $('hovDot'); if (l) l.style.display = 'none'; if (d) d.style.display = 'none'; }
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
})();

// ===================================================================
//  匯出圖片 —— 把目前的圖表 + 試算條件 + 結果合成一張 PNG
// ===================================================================
const escXml = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// 粗估文字寬度（CJK ≈ 1em、emoji ≈ 1.25em、數字 ≈ 0.58em、其餘 ASCII ≈ 0.56em）
function estTextW(str, fs){
  let w = 0;
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x1F000)            w += fs * 1.25;
    else if (cp > 0x2E7F)         w += fs * 1.0;
    else if (ch >= '0' && ch <= '9') w += fs * 0.58;
    else if (ch === ' ')         w += fs * 0.32;
    else                         w += fs * 0.56;
  }
  return w;
}

// 種子 logo（縮放到 size）
function seedIconSVG(x, y, size){
  return '<g transform="translate(' + x + ',' + y + ') scale(' + (size / 24) + ')">'
    + '<path d="M12 21V11" stroke="#16382E" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M12 11C12 6 8 4 4 4c0 5 3 8 8 7Z" fill="#7FA08A"/>'
    + '<path d="M12 11c0-5 4-7 8-7 0 5-3 8-8 7Z" fill="#D89436"/></g>';
}

// 把一排「藥丸標籤」排版（自動換行），回傳標記與底部 y
function layoutChips(chips, x0, y0, maxW, o){
  const fs = o.fs, h = o.h, padX = o.padX, gx = o.gx, gy = o.gy;
  let x = x0, y = y0, out = '';
  chips.forEach(c => {
    const full = c.value != null ? (c.label + ' ' + c.value) : c.label;
    const w = estTextW(full, fs) + padX * 2;
    if (x + w > x0 + maxW && x > x0) { x = x0; y += h + gy; }
    out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="' + (h / 2) + '" fill="' + (c.accent ? '#F6E3C2' : '#FFFFFF') + '" stroke="#E3DAC6"/>';
    const ty = (y + h / 2 + fs * 0.35).toFixed(1);
    if (c.value != null) {
      out += '<text x="' + (x + padX).toFixed(1) + '" y="' + ty + '" font-size="' + fs + '" fill="#5B6760">' + escXml(c.label) + '</text>';
      const lw = estTextW(c.label + ' ', fs);
      out += '<text x="' + (x + padX + lw).toFixed(1) + '" y="' + ty + '" font-size="' + fs + '" font-weight="700" fill="#16382E">' + escXml(c.value) + '</text>';
    } else {
      out += '<text x="' + (x + padX).toFixed(1) + '" y="' + ty + '" font-size="' + fs + '" fill="#23553F">' + escXml(c.label) + '</text>';
    }
    x += w + gx;
  });
  return { markup: out, bottomY: y + h };
}

// 組出整張匯出用 SVG（回傳 {svg, W, H} 或 null）
function buildExportSVG(){
  const rawInner = $('chart') ? $('chart').innerHTML : '';
  if (!rawInner || !/<path/.test(rawInner)) return null;     // 還沒算出圖表
  const chartInner = rawInner
    .replace(/<line id="hovLine"[\s\S]*?\/>/, '')
    .replace(/<circle id="hovDot"[\s\S]*?\/>/, '');

  const W = 1120, M = 48, innerW = W - 2 * M;
  const isFwd = mode === 'forward';
  const today = new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' });

  // ---- 試算條件 ----
  const cond = [{ label:'起始本金', value:fmtWan(F.principal) }];
  if (isFwd) {
    cond.push({ label:'每月投入', value:fmtWan(F.monthly) });
    cond.push({ label:'投資年期', value:F.years + ' 年' });
    cond.push({ label:'年化報酬', value:F.rate + '%' });
    if (F.stepUp > 0)    cond.push({ label:'每年增額', value:F.stepUp + '%' });
    if (F.inflation > 0) cond.push({ label:'通膨率',   value:F.inflation + '%' });
    if (F.fee > 0)       cond.push({ label:'成本費用', value:F.fee + '%' });
  } else {
    cond.push({ label:'目標金額', value:fmtWan(G.target) });
    cond.push({ label:'年化報酬', value:F.rate + '%' });
    if (G.solve === 'monthly') cond.push({ label:'預計年期',   value:G.gyears + ' 年' });
    else                       cond.push({ label:'每月可投入', value:fmtWan(G.gbudget) });
  }
  const evChips = (isFwd ? events : []).map(e => ({
    accent: true,
    label: e.emoji + ' ' + e.label,
    value: '第' + clamp(Math.round(e.year), 1, F.years) + '年 ' + (e.type === 'out' ? '−' : '+') + fmtWan(e.amount).replace('NT$ ', '')
  }));

  let body = '';

  // ---- 頁首 ----
  body += seedIconSVG(M, 36, 30);
  body += '<text x="' + (M + 42) + '" y="62" font-size="24" font-weight="700" fill="#16382E">享退休｜你的家庭財務夥伴</text>';
  body += '<text x="' + (W - M) + '" y="58" font-size="15" fill="#74807A" text-anchor="end">' + escXml(today) + '</text>';
  body += '<text x="' + M + '" y="118" font-size="40" font-weight="700" fill="#16382E">' + (isFwd ? '複利試算結果' : '目標試算結果') + '</text>';
  body += '<text x="' + M + '" y="150" font-size="19" fill="#74807A">' + (isFwd ? '我能滾出多少？' : '目標怎麼達成？') + '</text>';
  body += '<line x1="' + M + '" y1="176" x2="' + (W - M) + '" y2="176" stroke="#E3DAC6" stroke-width="1.5"/>';

  // ---- 結果 ----
  let yResBottom;
  if (isFwd) {
    const cards = [
      { lab:'資產終值（名目）', val:$('totalOut').textContent, hot:true },
      { lab:'你總共投入',       val:$('totalIn').textContent },
      { lab:'複利為你賺進',     val:$('totalGain').textContent, gain:true }
    ];
    const gap = 16, cw = (innerW - 2 * gap) / 3, ch = 104, yT = 200;
    cards.forEach((c, i) => {
      const x = M + i * (cw + gap);
      body += '<rect x="' + x + '" y="' + yT + '" width="' + cw.toFixed(1) + '" height="' + ch + '" rx="16" fill="' + (c.hot ? '#FBF3E2' : '#FFFFFF') + '" stroke="' + (c.hot ? '#E8CC9A' : '#E3DAC6') + '"/>';
      body += '<text x="' + (x + 22) + '" y="' + (yT + 38) + '" font-size="16" fill="#5B6760">' + c.lab + '</text>';
      const vColor = c.gain ? '#D89436' : '#16382E';
      body += '<text x="' + (x + 22) + '" y="' + (yT + 80) + '" font-size="30" font-weight="700" fill="' + vColor + '">' + escXml(c.val) + '</text>';
    });
    yResBottom = yT + ch;
  } else {
    const yT = 200, ch = 124;
    body += '<rect x="' + M + '" y="' + yT + '" width="' + innerW + '" height="' + ch + '" rx="16" fill="#FBF3E2" stroke="#E8CC9A"/>';
    body += '<text x="' + (M + 26) + '" y="' + (yT + 36) + '" font-size="16" fill="#5B6760">' + escXml($('ansLabel').textContent) + '</text>';
    body += '<text x="' + (M + 26) + '" y="' + (yT + 82) + '" font-size="36" font-weight="700" fill="#D89436">' + escXml($('ansValue').textContent) + '</text>';
    body += '<text x="' + (M + 26) + '" y="' + (yT + 110) + '" font-size="15" fill="#5B6760">' + escXml($('ansSub').textContent) + '</text>';
    yResBottom = yT + ch;
  }

  // ---- 條件區 ----
  let y = yResBottom + 46;
  body += '<text x="' + M + '" y="' + y + '" font-size="17" font-weight="700" fill="#16382E">試算條件</text>';
  const chipOpt = { fs:16, h:38, padX:16, gx:10, gy:10 };
  const condLayout = layoutChips(cond, M, y + 16, innerW, chipOpt);
  body += condLayout.markup;
  let bottom = condLayout.bottomY;

  if (evChips.length) {
    y = bottom + 40;
    body += '<text x="' + M + '" y="' + y + '" font-size="17" font-weight="700" fill="#16382E">人生事件</text>';
    const evLayout = layoutChips(evChips, M, y + 16, innerW, chipOpt);
    body += evLayout.markup;
    bottom = evLayout.bottomY;
  }

  // ---- 圖表面板（深綠底） ----
  const panelTop = bottom + 32, P = 22;
  const CW = innerW - 2 * P, CH = Math.round(CW * VBH / VBW);
  const panelH = CH + 2 * P;
  body += '<rect x="' + M + '" y="' + panelTop + '" width="' + innerW + '" height="' + panelH + '" rx="18" fill="#16382E"/>';
  body += '<svg x="' + (M + P) + '" y="' + (panelTop + P) + '" width="' + CW + '" height="' + CH + '" viewBox="0 0 ' + VBW + ' ' + VBH + '" preserveAspectRatio="xMidYMid meet">' + chartInner + '</svg>';
  const panelBottom = panelTop + panelH;

  // ---- 頁尾 ----
  let fy = panelBottom + 30;
  body += '<line x1="' + M + '" y1="' + fy + '" x2="' + (W - M) + '" y2="' + fy + '" stroke="#E3DAC6" stroke-width="1.5"/>';
  fy += 30;
  body += '<text x="' + M + '" y="' + fy + '" font-size="13" fill="#9AA39C">＊本圖為月複利數學試算，僅供參考，不代表任何商品之實際報酬，投資必有風險。</text>';
  fy += 26;
  body += '<text x="' + M + '" y="' + fy + '" font-size="14" fill="#23553F">享退休 ・ RFC® 國際認證財務顧問師　│　LINE：@453ubihw　│　先找問題，才給工具</text>';
  const H = fy + 30;

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'
    + '<style>text{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif;}</style>'
    + '<rect width="' + W + '" height="' + H + '" fill="#FAF6EE"/>'
    + '<rect x="6" y="6" width="' + (W - 12) + '" height="' + (H - 12) + '" rx="22" fill="none" stroke="#EAE1CE" stroke-width="2"/>'
    + body
    + '</svg>';
  return { svg, W, H };
}

// 把 SVG 字串轉成 PNG 並下載
function svgToPng(svgString, W, H, filename, scale){
  scale = scale || 2;
  const blob = new Blob([svgString], { type:'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FAF6EE';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert('圖片產生失敗，請再試一次。'); };
  img.src = url;
}

function exportChartImage(){
  const out = buildExportSVG();
  if (!out) { alert('請先完成試算，圖表出現後再匯出。'); return; }
  const stamp = new Date().toISOString().slice(0, 10);
  svgToPng(out.svg, out.W, out.H, '複利試算_' + stamp + '.png', 2);
}

// 綁定「匯出圖片」按鈕
(function(){ const b = $('exportBtn'); if (b) b.addEventListener('click', exportChartImage); })();
