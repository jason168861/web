// ===================================================================
//  手機/平板 — 即時檢視卡片可拖動定位 + 側邊收納（子母畫面）
// ===================================================================

/* ===================== 即時檢視:手機版可拖動定位 + 側邊收納(子母畫面) ===================== */
(function(){
  const stage=document.querySelector('.result-stage');
  const handle=document.getElementById('stageDrag');
  if(!stage||!handle) return;
  const isMobile=()=>matchMedia('(max-width:640px)').matches;
  const resultsReady=()=>!stage.closest('.calc-grid')?.classList.contains('result-pending');
  const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const PEEK=42;            // 收到側邊時保留可見的寬度
  const dockTop=()=>window.innerWidth<=560 ? 60 : 64;
  let dragging=false, moved=false, sx=0, sy=0, ox=0, oy=0, pid=null, startedOnGrip=false, lastTap=0, didDefaultPeek=false;
  const W=()=>stage.offsetWidth;

  // sticky -> fixed:直接脫離文件流,不補佔位,避免輸入區上方留下空白
  function ensureFloat(r){
    if(stage.classList.contains('is-floating')) return;
    stage.classList.add('is-floating');
    stage.style.position='fixed';
    stage.style.left=Math.round(r.left)+'px';
    stage.style.top =Math.round(r.top)+'px';
    stage.style.width=Math.round(r.width)+'px';
    stage.style.margin='0';
  }
  function moveTo(left,top){
    const w=W();
    // 拖曳時允許滑出兩側(最多只留 PEEK),垂直保持在畫面內
    stage.style.left=cl(left, -(w-PEEK), window.innerWidth-PEEK)+'px';
    stage.style.top =cl(top, 8, window.innerHeight-56)+'px';
  }
  function clearPeek(){ stage.classList.remove('is-peek','peek-left','peek-right'); }
  function tuck(side){
    clearPeek();
    stage.classList.add('is-peek','peek-'+side);
    stage.style.left=(side==='left' ? -(W()-PEEK) : window.innerWidth-PEEK)+'px';
  }
  function defaultPeekRight(){
    if(!isMobile() || !resultsReady() || didDefaultPeek || stage.classList.contains('is-floating') || stage.classList.contains('is-zoomed')) return;
    ensureFloat(stage.getBoundingClientRect());
    stage.style.top=dockTop()+'px';
    tuck('right');
    didDefaultPeek=true;
  }
  function settle(){
    const r=stage.getBoundingClientRect(), vw=window.innerWidth, w=r.width;
    if(-r.left > w*0.3){ tuck('left'); return; }         // 滑出左側夠多 → 收到左邊
    if(r.right-vw > w*0.3){ tuck('right'); return; }      // 滑出右側夠多 → 收到右邊
    if(r.top < 74){ resetFloat(); return; }              // 靠近頂端 → 回到吸附
    clearPeek(); stage.style.left=cl(r.left, 8, vw-w-8)+'px'; // 否則完整顯示
  }
  function expandFromPeek(){                              // 點一下收起的卡片 → 完整滑出
    const w=W(), vw=window.innerWidth;
    const left=stage.classList.contains('peek-left') ? 8 : vw-w-8;
    clearPeek();
    stage.style.left=left+'px';
  }
  function resetFloat(){
    clearPeek();
    stage.classList.remove('is-floating','is-hidden');
    stage.style.position=stage.style.left=stage.style.top=stage.style.width=stage.style.margin='';
  }

  function onMove(e){
    if(!dragging || e.pointerId!==pid) return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(!moved && (Math.abs(dx)>3||Math.abs(dy)>3)){
      moved=true;
      const r=stage.getBoundingClientRect();
      ensureFloat(r);          // sticky → 浮動(若尚未)
      clearPeek();             // 一開始拖就解除收納
      ox=r.left; oy=r.top;     // 以目前實際位置為基準
    }
    if(moved){ moveTo(ox+dx, oy+dy); if(e.cancelable) e.preventDefault(); }
  }
  function onUp(e){
    if(!dragging || (e && e.pointerId!==pid)) return;
    dragging=false; pid=null; stage.classList.remove('dragging');
    document.removeEventListener('pointermove',onMove);
    document.removeEventListener('pointerup',onUp);
    document.removeEventListener('pointercancel',onUp);
    if(moved){ settle(); return; }
    // 沒有移動 = 點一下
    if(stage.classList.contains('is-peek')){ expandFromPeek(); return; }  // 點收起的卡片 → 展開
    if(startedOnGrip){                                                    // 連點兩下把手 → 回頂端
      const n=Date.now();
      if(n-lastTap<350){ resetFloat(); lastTap=0; } else lastTap=n;
    }
  }
  stage.addEventListener('pointerdown',e=>{
    if(!isMobile()) return;
    if(stage.classList.contains('is-zoomed')) return;   // 放大模式不拖曳(留給捲動看圖)
    const peeking = stage.classList.contains('is-peek');
    const inChart = !!(e.target.closest && e.target.closest('.chart-box'));
    if(inChart && !peeking) return;   // 完整顯示時,圖表區留給圖表互動;其餘 result-stage 內皆可拖曳
    const onGrip = !!(e.target.closest && e.target.closest('#stageDrag'));
    dragging=true; moved=false; pid=e.pointerId; startedOnGrip=onGrip;
    const r=stage.getBoundingClientRect();
    ox=r.left; oy=r.top; sx=e.clientX; sy=e.clientY;
    try{ stage.setPointerCapture(e.pointerId); }catch(_){}
    stage.classList.add('dragging');
    // 在 document 上監聽,避免卡片滑離指標後失去追蹤
    document.addEventListener('pointermove',onMove,{passive:false});
    document.addEventListener('pointerup',onUp);
    document.addEventListener('pointercancel',onUp);
    e.preventDefault();
  });

  // 鍵盤 Enter/Space 也能重置
  handle.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); resetFloat(); }});

  // 打叉:收到右側(子母畫面,點一下可再展開);桌機版維持回到原位
  const closeBtn=document.getElementById('stageClose');
  if(closeBtn){
    closeBtn.addEventListener('pointerdown',e=>e.stopPropagation());  // 不要觸發卡片拖曳
    closeBtn.addEventListener('click',e=>{
      e.stopPropagation();
      if(stage.classList.contains('is-zoomed')) exitZoom();
      if(!isMobile()){ resetFloat(); return; }
      ensureFloat(stage.getBoundingClientRect());   // 若還在吸附狀態,先脫離為浮動
      tuck('right');                                 // 收到畫面右側,留 PEEK 可點回
    });
  }

  // ---- 放大 / 縮小 浮動視窗 ----
  const zoomBtn=document.getElementById('stageZoom');
  let backdrop=null, prevBodyOverflow='';
  function enterZoom(){
    resetFloat();                       // 先回到乾淨的吸附狀態,避免行內定位與放大樣式打架
    if(!backdrop){
      backdrop=document.createElement('div');
      backdrop.className='stage-backdrop';
      backdrop.addEventListener('click',exitZoom);
      document.body.appendChild(backdrop);
    }
    requestAnimationFrame(()=>backdrop.classList.add('show'));
    prevBodyOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';            // 鎖住背景捲動
    stage.classList.add('is-zoomed');
    stage.scrollTop=0;
    if(zoomBtn){ zoomBtn.setAttribute('aria-pressed','true'); zoomBtn.setAttribute('aria-label','縮小即時檢視'); zoomBtn.title='縮小'; }
  }
  function exitZoom(){
    if(!stage.classList.contains('is-zoomed')) return;
    stage.classList.remove('is-zoomed');
    if(backdrop){ backdrop.classList.remove('show'); const b=backdrop; backdrop=null; setTimeout(()=>b.remove(),200); }
    document.body.style.overflow=prevBodyOverflow;
    if(zoomBtn){ zoomBtn.setAttribute('aria-pressed','false'); zoomBtn.setAttribute('aria-label','放大即時檢視'); zoomBtn.title='放大檢視'; }
  }
  if(zoomBtn){
    zoomBtn.addEventListener('pointerdown',e=>e.stopPropagation());   // 不要觸發卡片拖曳
    zoomBtn.addEventListener('click',e=>{
      e.stopPropagation();
      stage.classList.contains('is-zoomed') ? exitZoom() : enterZoom();
    });
  }

  // 浮動時,只要捲離「你的條件」輸入面板就先隱藏
  const watch=document.getElementById('calcPanel');
  if(watch){
    new IntersectionObserver(es=>es.forEach(en=>{
      if(en.isIntersecting) defaultPeekRight();
      if(!stage.classList.contains('is-floating')) return;
      stage.classList.toggle('is-hidden', !en.isIntersecting);
    }),{threshold:0}).observe(watch);
  }
  window.addEventListener('calc-results-revealed',()=>requestAnimationFrame(defaultPeekRight));
  // 切回桌機版時清除浮動/放大狀態
  window.addEventListener('resize',()=>{ if(!isMobile()){ exitZoom(); resetFloat(); } });
})();
