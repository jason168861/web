// ===================================================================
//  分享連結 — 把目前試算條件編進網址，可分享 / 還原
//  ＊載入順序需在 calc-render.js 之後（狀態 F/G/mode/events 與渲染函式皆已就緒）
// ===================================================================
(function(){
  // ---- 由目前狀態組出分享網址 ----
  function buildShareURL(){
    const q=new URLSearchParams();
    q.set('m', mode==='goal'?'g':'f');
    q.set('p',F.principal); q.set('mo',F.monthly); q.set('y',F.years); q.set('r',F.rate);
    q.set('s',F.stepUp);    q.set('i',F.inflation); q.set('fe',F.fee); q.set('c',F.compound);
    if(mode==='goal'){ q.set('t',G.target); q.set('gy',G.gyears); q.set('gb',G.gbudget); q.set('so',G.solve); }
    if(showReal)  q.set('re','1');
    if(showExact) q.set('ex','1');
    if(events.length){
      q.set('ev', JSON.stringify(events.map(e=>({t:e.type,y:e.year,a:e.amount,l:e.label,e:e.emoji}))));
    }
    const base=location.href.split(/[?#]/)[0];   // 去掉現有 query / hash，相容 file:// 與線上
    return base+'?'+q.toString()+'#calc';
  }

  // ---- 從網址還原狀態（回傳是否有套用）----
  function applyFromURL(){
    const q=new URLSearchParams(location.search);
    if(![...q.keys()].length) return false;
    const num=(k,obj,prop)=>{ if(q.has(k)){ const v=parseFloat(q.get(k)); if(isFinite(v)) obj[prop]=v; } };
    num('p',F,'principal'); num('mo',F,'monthly'); num('y',F,'years'); num('r',F,'rate');
    num('s',F,'stepUp');    num('i',F,'inflation'); num('fe',F,'fee'); num('c',F,'compound');
    num('t',G,'target');    num('gy',G,'gyears');   num('gb',G,'gbudget');
    if(q.get('so')==='time')    G.solve='time';
    else if(q.get('so')==='monthly') G.solve='monthly';
    if(q.get('m')==='g') mode='goal'; else if(q.get('m')==='f') mode='forward';
    showReal  = q.get('re')==='1';
    showExact = q.get('ex')==='1';
    if(q.has('ev')){
      try{
        const arr=JSON.parse(q.get('ev'));
        if(Array.isArray(arr)){
          events.length=0;
          arr.slice(0,20).forEach(e=>{
            events.push({
              id:uid(),
              emoji:String(e.e||'📌').slice(0,4),
              label:String(e.l||'事件').slice(0,24),
              type: e.t==='in'?'in':'out',
              year: clamp(parseInt(e.y,10)||1,1,F.years),
              amount: Math.max(0, parseInt(e.a,10)||0)
            });
          });
        }
      }catch(_){}
    }
    return true;
  }

  // ---- 套用狀態後，重建欄位與控制項的顯示 ----
  function refreshUI(){
    buildFields($('forwardFields'),FWD);
    buildFields($('advFields'),ADV);
    buildFields($('goalFields'),GOAL);
    buildGoalExtra();
    document.querySelectorAll('#compoundFreq button').forEach(b=>
      b.setAttribute('aria-pressed', (+b.dataset.cm===F.compound)?'true':'false'));
    document.querySelectorAll('.calc-tabs .tab').forEach(t=>
      t.setAttribute('aria-selected', t.dataset.mode===mode?'true':'false'));
    const ck=$('ckReal'); if(ck) ck.checked=showReal;
    const nt=$('numToggle');
    if(nt){ nt.setAttribute('aria-pressed', showExact?'true':'false');
            nt.textContent = showExact ? '🔢 概數顯示' : '🔢 精確數字'; }
    renderEvents();
    if(typeof revealCalcResults==='function') revealCalcResults();
    applyMode();   // 切換正向/目標面板並 render()
  }

  // ---- 複製到剪貼簿（含 fallback）----
  async function copyText(text){
    try{ await navigator.clipboard.writeText(text); return true; }
    catch(_){
      try{
        const ta=document.createElement('textarea');
        ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok=document.execCommand('copy'); ta.remove(); return ok;
      }catch(__){ return false; }
    }
  }

  // ---- 還原（若網址帶參數）----
  if(applyFromURL()) refreshUI();

  // ---- 綁定分享按鈕 ----
  const btn=$('shareBtn');
  if(btn){
    let timer=0;
    btn.addEventListener('click', async ()=>{
      const url=buildShareURL();
      const ok=await copyText(url);
      // 同步更新網址列，方便直接加入書籤
      try{ history.replaceState(null,'',url); }catch(_){}
      btn.textContent = ok ? '✓ 已複製連結' : '⚠ 請手動複製';
      btn.classList.toggle('copied', ok);
      if(!ok) prompt('複製這個分享連結：', url);
      clearTimeout(timer);
      timer=setTimeout(()=>{ btn.textContent='🔗 分享連結'; btn.classList.remove('copied'); }, 2000);
    });
  }
})();
