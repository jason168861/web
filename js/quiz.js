// ===================================================================
//  理財原型測驗
// ===================================================================

// ---------- 理財原型測驗 ----------
const TYPES={
  sprint:{emoji:'🚀',tag:'攻擊手',name:'衝刺型',
    desc:'你相信報酬、討厭錢閒著，行動力是你最大的武器。但火力全開的人，最怕的不是賺不到，而是一次黑天鵝就把多年戰果打回原點。',
    blind:'容易低估「突然不能賺錢」的風險，防護網常常是最後才補的那一塊。',
    next:'先確認緊急預備金與保障到位，再讓進攻的部位盡情衝——進攻和防守從來不衝突。'},
  guard:{emoji:'🛡️',tag:'守城者',name:'守城型',
    desc:'你睡得著覺比什麼都重要，現金與穩定讓你安心。這是很珍貴的紀律，只是有個隱形對手正在慢慢搬走你的錢——通膨。',
    blind:'過度保守，讓資產的購買力被通膨一年一年稀釋而不自覺。',
    next:'在不犧牲安全感的前提下，讓一小部分錢「動起來」、跑贏物價就好，不用變賭徒。'},
  plan:{emoji:'🧭',tag:'規劃者',name:'規劃型',
    desc:'你懂配置、會分艙，每筆錢心裡都有個位置。你離「財務從容」其實只差臨門一腳：把腦中的計畫，變成一份會定期檢視、扛得住風浪的系統。',
    blind:'計畫多半在腦袋裡，缺一套「黑天鵝來了也照走」的書面規則與檢視節奏。',
    next:'把配置與再平衡規則寫下來、訂好檢視週期，讓計畫不靠心情、靠系統運轉。'},
  start:{emoji:'🌱',tag:'起步者',name:'起步型',
    desc:'你還站在起點，有點迷惘很正常——大部分人都是這樣開始的。好消息是：你最大的本錢「時間」，現在最充足。',
    blind:'最大的風險不是做錯，而是一直沒開始，白白浪費複利最值錢的前幾年。',
    next:'從一個小決定起步：先把這個月的結餘理清楚、存下第一筆預備金，地基穩了再談投資。'}
};
const QS=[
 {q:'每個月底有結餘時，你通常會…',opts:[
   {t:'放著不動，看到帳戶數字變大最安心',k:'guard'},
   {t:'趕快找標的投進去，閒著就是浪費',k:'sprint'},
   {t:'照比例分配:預備金、投資、生活開銷',k:'plan'},
   {t:'老實說…常常月底就差不多見底了',k:'start'}]},
 {q:'假設你的資產一天之內帳面跌了 15%，第一反應是？',opts:[
   {t:'機會來了，加碼！',k:'sprint'},
   {t:'先換成現金，抱著才睡得著',k:'guard'},
   {t:'回頭看配置有沒有走鐘，再決定動不動',k:'plan'},
   {t:'心慌到不行，但其實不知道該怎麼辦',k:'start'}]},
 {q:'對你來說，「理財很成功」比較像哪一句？',opts:[
   {t:'資產翻倍，提早達成財富自由',k:'sprint'},
   {t:'不管發生什麼，生活都不會被錢卡住',k:'guard'},
   {t:'每一塊錢都有它的任務，清清楚楚',k:'plan'},
   {t:'至少先順利存到我的第一桶金',k:'start'}]},
 {q:'目前你的緊急預備金和保障狀況是？',opts:[
   {t:'有半年以上預備金，保單也定期檢視',k:'plan'},
   {t:'錢都拿去投資了，留現金太可惜',k:'sprint'},
   {t:'保單買了一堆，但其實看不太懂',k:'guard'},
   {t:'預備金？呃…應該有一點點吧',k:'start'}]},
 {q:'如果現在多了一筆閒錢，你最想拿去？',opts:[
   {t:'找報酬率最高的標的，押下去',k:'sprint'},
   {t:'放定存或還房貸，穩穩的最好',k:'guard'},
   {t:'先看自己哪裡有缺口，補起來再說',k:'plan'},
   {t:'不知道…所以才需要有人陪我一起看',k:'start'}]}
];
const qBody=$('quizBody'), qProg=$('quizProgress');
let qIdx=0; const picks=[]; const scores={sprint:0,guard:0,plan:0,start:0};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(qProg){QS.forEach(()=>qProg.appendChild(document.createElement('i')));}
function renderProgress(){[...qProg.children].forEach((c,i)=>c.classList.toggle('done',i<qIdx));}
function renderQ(){
  const Q=QS[qIdx]; renderProgress();
  qBody.innerHTML='<div class="quiz-step">'
    +'<div class="quiz-qnum">問題 '+(qIdx+1)+' / '+QS.length+'</div>'
    +'<div class="quiz-q">'+esc(Q.q)+'</div>'
    +'<div class="quiz-opts">'+Q.opts.map(o=>'<button class="quiz-opt" data-k="'+o.k+'"><span class="dot"></span>'+esc(o.t)+'</button>').join('')+'</div>'
    +'<button class="quiz-back"'+(qIdx===0?' disabled':'')+'>← 上一題</button></div>';
  qBody.querySelectorAll('.quiz-opt').forEach(b=>b.addEventListener('click',()=>{
    scores[b.dataset.k]++; picks[qIdx]=b.dataset.k; qIdx++;
    qIdx<QS.length?renderQ():renderResult();
  }));
  const back=qBody.querySelector('.quiz-back');
  if(back)back.addEventListener('click',()=>{
    if(qIdx>0){qIdx--; if(picks[qIdx]){scores[picks[qIdx]]--; picks[qIdx]=null;} renderQ();}
  });
}
function renderResult(){
  [...qProg.children].forEach(c=>c.classList.add('done'));
  const mx=Math.max(...Object.values(scores));
  const best=['plan','guard','sprint','start'].find(k=>scores[k]===mx);
  const T=TYPES[best];
  qBody.innerHTML='<div class="quiz-result">'
    +'<div class="emoji">'+T.emoji+'</div>'
    +'<span class="rtag">你的理財原型</span>'
    +'<h3>'+T.name+'・'+T.tag+'</h3>'
    +'<p class="desc">'+T.desc+'</p>'
    +'<div class="quiz-detail">'
      +'<div class="blk"><b>🔍 你的盲點</b><p>'+T.blind+'</p></div>'
      +'<div class="blk"><b>👣 建議的下一步</b><p>'+T.next+'</p></div>'
    +'</div>'
    +'<div class="r-cta">'
      +'<a class="btn" href="#contact">把這個結果，聊成一份計畫 →</a>'
      +'<button class="quiz-export">🖼 匯出結果</button>'
      +'<button class="quiz-retry">重新測一次</button>'
    +'</div></div>';
  const rt=qBody.querySelector('.quiz-retry');
  if(rt)rt.addEventListener('click',()=>{qIdx=0;picks.length=0;Object.keys(scores).forEach(k=>scores[k]=0);renderQ();});
  const ex=qBody.querySelector('.quiz-export');
  if(ex)ex.addEventListener('click',()=>exportQuizResult(best, {...scores}, picks.slice()));
}
if(qBody)renderQ();

// ===================================================================
//  匯出測驗結果為圖片（與圖表匯出共用 escXml / estTextW / seedIconSVG / svgToPng）
// ===================================================================
// 文字自動換行（CJK 可逐字斷行）
function wrapCJK(str, maxW, fs){
  const lines = []; let cur = '';
  for (const ch of String(str)) {
    if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (estTextW(cur + ch, fs) > maxW && cur) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
function textLines(lines, x, y, lh, attrs){
  return lines.map((ln, i) => '<text x="' + x + '" y="' + (y + i * lh) + '" ' + attrs + '>' + escXml(ln) + '</text>').join('');
}

function buildQuizSVG(best, scoreMap, picks){
  const T = TYPES[best];
  const order = ['sprint','guard','plan','start'];
  const total = order.reduce((s,k)=>s + (scoreMap[k]||0), 0) || 1;

  const W = 1000, M = 44, innerW = W - 2 * M;
  const today = new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' });
  let body = '';

  // ---- 頁首 ----
  body += seedIconSVG(M, 32, 28);
  body += '<text x="' + (M + 40) + '" y="56" font-size="22" font-weight="700" fill="#16382E">享退休｜你的家庭財務夥伴</text>';
  body += '<text x="' + (W - M) + '" y="53" font-size="14" fill="#74807A" text-anchor="end">' + escXml(today) + '</text>';
  body += '<text x="' + M + '" y="112" font-size="34" font-weight="700" fill="#16382E">理財原型測驗結果</text>';
  body += '<text x="' + M + '" y="142" font-size="16" fill="#74807A">你的理財性格 × 下一步建議</text>';
  body += '<line x1="' + M + '" y1="166" x2="' + (W - M) + '" y2="166" stroke="#E3DAC6" stroke-width="1.5"/>';

  // ---- 原型主面板（深綠底） ----
  const heroTop = 188, heroPadX = 30, descX = M + heroPadX;
  const descLines = wrapCJK(T.desc, innerW - heroPadX * 2, 17);
  const heroH = 116 + descLines.length * 27 + 22;
  body += '<rect x="' + M + '" y="' + heroTop + '" width="' + innerW + '" height="' + heroH + '" rx="18" fill="#16382E"/>';
  body += '<text x="' + descX + '" y="' + (heroTop + 70) + '" font-size="50">' + T.emoji + '</text>';
  body += '<text x="' + (descX + 74) + '" y="' + (heroTop + 40) + '" font-size="14" letter-spacing="3" fill="#E7B864" font-weight="700">你的理財原型</text>';
  body += '<text x="' + (descX + 74) + '" y="' + (heroTop + 76) + '" font-size="30" font-weight="700" fill="#FFFFFF">' + escXml(T.name + '・' + T.tag) + '</text>';
  body += textLines(descLines, descX, heroTop + 122, 27, 'font-size="17" fill="#DCE7DF"');

  // ---- 盲點 / 下一步 兩張卡 ----
  const gap = 16, cardW = (innerW - gap) / 2, cardPadX = 22, cardTextW = cardW - cardPadX * 2;
  const blindLines = wrapCJK(T.blind, cardTextW, 15);
  const nextLines  = wrapCJK(T.next,  cardTextW, 15);
  const cardLineN = Math.max(blindLines.length, nextLines.length);
  const cardTop = heroTop + heroH + 28, cardH = 56 + cardLineN * 24 + 16;
  const card = (x, icon, title, lines) => {
    let s = '<rect x="' + x + '" y="' + cardTop + '" width="' + cardW + '" height="' + cardH + '" rx="14" fill="#FFFFFF" stroke="#E3DAC6"/>';
    s += '<text x="' + (x + cardPadX) + '" y="' + (cardTop + 36) + '" font-size="17" font-weight="700" fill="#23553F">' + icon + ' ' + escXml(title) + '</text>';
    s += textLines(lines, x + cardPadX, cardTop + 64, 24, 'font-size="15" fill="#4A554E"');
    return s;
  };
  body += card(M, '🔍', '你的盲點', blindLines);
  body += card(M + cardW + gap, '👣', '建議的下一步', nextLines);

  // ---- 測驗分數分布 ----
  let y = cardTop + cardH + 44;
  body += '<text x="' + M + '" y="' + y + '" font-size="17" font-weight="700" fill="#16382E">測驗分數分布</text>';
  body += '<text x="' + (W - M) + '" y="' + y + '" font-size="13" fill="#9AA39C" text-anchor="end">共 ' + total + ' 題</text>';
  y += 18;
  const labelW = 96, numW = 30, barX = M + labelW, barMaxW = innerW - labelW - numW, rowH = 34;
  order.forEach(k => {
    const sc = scoreMap[k] || 0, frac = sc / total, isBest = k === best;
    const cy = y + rowH / 2;
    body += '<text x="' + M + '" y="' + (cy + 6) + '" font-size="15" fill="#3C4842">' + TYPES[k].emoji + ' ' + escXml(TYPES[k].name) + '</text>';
    body += '<rect x="' + barX + '" y="' + (cy - 9) + '" width="' + barMaxW + '" height="18" rx="9" fill="#EFE7D6"/>';
    if (sc > 0) body += '<rect x="' + barX + '" y="' + (cy - 9) + '" width="' + Math.max(18, barMaxW * frac).toFixed(1) + '" height="18" rx="9" fill="' + (isBest ? '#D89436' : '#9FB6A4') + '"/>';
    body += '<text x="' + (W - M) + '" y="' + (cy + 6) + '" font-size="15" font-weight="700" fill="' + (isBest ? '#D89436' : '#5B6760') + '" text-anchor="end">' + sc + '</text>';
    y += rowH;
  });

  // ---- 作答紀錄（供顧問判讀；字級小、低調） ----
  if (picks && picks.length) {
    y += 14;
    body += '<text x="' + M + '" y="' + y + '" font-size="13" font-weight="700" fill="#8A9389">作答紀錄</text>';
    body += '<text x="' + (W - M) + '" y="' + y + '" font-size="11.5" fill="#B7BFB6" text-anchor="end">供顧問判讀參考</text>';
    y += 4;
    QS.forEach((Q, i) => {
      const k = picks[i];
      const opt = k ? (Q.opts.find(o => o.k === k) || {}) : {};
      const line = '第' + (i + 1) + '題　' + (opt.t || '—') + '　（' + (k ? TYPES[k].name : '未作答') + '）';
      const wrapped = wrapCJK(line, innerW, 12.5);
      body += textLines(wrapped, M, y + 16, 18, 'font-size="12.5" fill="#AEB6AC"');
      y += 16 + (wrapped.length - 1) * 18 + 5;
    });
    y += 6;
  }

  // ---- 頁尾 ----
  let fy = y + 22;
  body += '<line x1="' + M + '" y1="' + fy + '" x2="' + (W - M) + '" y2="' + fy + '" stroke="#E3DAC6" stroke-width="1.5"/>';
  fy += 28;
  body += '<text x="' + M + '" y="' + fy + '" font-size="13" fill="#9AA39C">＊本測驗為理財性格的方向性自我檢視，非投資建議；實際規劃仍需依個人狀況綜合評估。</text>';
  fy += 26;
  body += '<text x="' + M + '" y="' + fy + '" font-size="14" fill="#23553F">享退休 ・ RFC® 國際認證財務顧問師　│　LINE：@453ubihw　│　先找問題，才給工具</text>';
  const H = fy + 28;

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'
    + '<style>text{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif;}</style>'
    + '<rect width="' + W + '" height="' + H + '" fill="#FAF6EE"/>'
    + '<rect x="6" y="6" width="' + (W - 12) + '" height="' + (H - 12) + '" rx="22" fill="none" stroke="#EAE1CE" stroke-width="2"/>'
    + body + '</svg>';
  return { svg, W, H, name: T.name };
}

function exportQuizResult(best, scoreMap, picks){
  const { svg, W, H, name } = buildQuizSVG(best, scoreMap, picks);
  const dstr = new Date().toLocaleDateString('zh-TW').replace(/\//g, '-');
  svgToPng(svg, W, H, '理財原型_' + name + '_' + dstr + '.png');
}
