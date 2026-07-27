// ===================================================================
//  功能解鎖 — 加入官方 LINE 取得解鎖碼後，開放進階設定 / 複利頻率 / 人生事件
//  ＊純前端軟性門檻：用來引導加 LINE，非真正權限控管。
// ===================================================================
(function(){
  // ┌─────────────────────────────────────────────────────────────┐
  // │ 總開關：true = 啟用鎖定（加 LINE 才開放）｜false = 全部開放      │
  // │ LINE 解鎖碼還沒設定好前，先設 false。設好後改 true 即啟用。      │
  // └─────────────────────────────────────────────────────────────┘
  const LOCK_ENABLED=true;

  const KEY='calcFeatUnlocked';
  const CODE='0304';   // ← 解鎖碼：請與 LINE 官方帳號「歡迎訊息」中的代碼一致
  const LINE='https://line.me/R/ti/p/@453ubihw';

  const norm=s=>String(s||'').trim().toUpperCase();
  let unlocked=false;
  try{ unlocked=localStorage.getItem(KEY)==='1'; }catch(_){}
  let pending=null;   // 解鎖成功後要執行的回呼（例如:下載報告）

  // 要鎖的區塊：[選擇器, 顯示標題, 遮罩放法]
  //  wrap  = 外層包裹（<details> 收合時子層不繪製，需用包裹層）
  //  child = 直接當子層（隨容器一起隱藏，如事件區在目標模式會消失）
  const targets=[
    ['.adv',       '進階設定・複利頻率','wrap'],
    ['#eventsWrap','人生事件試算',      'child'],
  ];

  const veils=[];
  function lock(el,label,strategy){
    let host=el;
    if(strategy==='wrap'){
      if(el.tagName==='DETAILS') el.open=true;   // 展開讓內容露出，讓人看到能解鎖什麼
      const wrap=document.createElement('div');
      wrap.className='lock-wrap';
      el.parentNode.insertBefore(wrap,el);
      wrap.appendChild(el);
      host=wrap;
    }
    if(getComputedStyle(host).position==='static') host.style.position='relative';
    const v=document.createElement('div');
    v.className='lock-veil';
    v.innerHTML='<div class="lv-in"><span class="lv-ico" aria-hidden="true">🔒</span>'
      +'<span class="lv-txt"><b>加入官方 LINE 解鎖</b><span class="lv-sub">'+label+'</span></span></div>';
    v.addEventListener('click',e=>{ e.preventDefault(); openModal(); });
    host.appendChild(v);
    veils.push(v);
  }
  function applyLocks(){
    targets.forEach(([sel,label,strategy])=>{ const el=document.querySelector(sel); if(el) lock(el,label,strategy); });
  }
  function removeLocks(){ veils.forEach(v=>v.remove()); veils.length=0; }

  // ---- 解鎖視窗 ----
  let modal=null;
  function buildModal(){
    modal=document.createElement('div');
    modal.className='unlock-modal';
    modal.innerHTML=
      '<div class="um-card" role="dialog" aria-modal="true" aria-label="解鎖完整功能">'
      +'<button class="um-x" type="button" aria-label="關閉">✕</button>'
      +'<div class="um-ico" aria-hidden="true">🔓</div>'
      +'<h3 id="umTitle">加入官方 LINE，解鎖完整試算</h3>'
      +'<p class="um-desc" id="umDesc">進階設定、複利頻率與人生事件，加入官方 LINE 後立即開放。</p>'
      +'<a class="um-line" href="'+LINE+'" target="_blank" rel="noopener">① 加入官方 LINE（取得解鎖碼）</a>'
      +'<div class="um-code">'
        +'<input type="text" id="umInput" placeholder="② 輸入歡迎訊息中的解鎖碼" autocomplete="off" aria-label="解鎖碼">'
        +'<button type="button" id="umGo">解鎖</button>'
      +'</div>'
      +'<p class="um-err" id="umErr" role="alert"></p>'
      +'</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
    modal.querySelector('.um-x').addEventListener('click',closeModal);
    const input=modal.querySelector('#umInput');
    const err=modal.querySelector('#umErr');
    const submit=()=>{
      if(norm(input.value)===norm(CODE)) doUnlock();
      else { err.textContent='解鎖碼不正確，請確認 LINE 歡迎訊息中的代碼。'; input.focus(); input.select(); }
    };
    modal.querySelector('#umGo').addEventListener('click',submit);
    input.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
  }
  function escClose(e){ if(e.key==='Escape') closeModal(); }
  const DEF={title:'加入官方 LINE，解鎖完整試算',
             desc:'進階設定、複利頻率與人生事件，加入官方 LINE 後立即開放。'};
  function openModal(opts){
    opts=opts||{};
    if(unlocked){ if(opts.onSuccess) opts.onSuccess(); return; }  // 已解鎖直接放行
    if(!modal) buildModal();
    pending=opts.onSuccess||null;
    modal.querySelector('#umTitle').textContent=opts.title||DEF.title;
    modal.querySelector('#umDesc').textContent =opts.desc ||DEF.desc;
    modal.classList.add('show');
    const i=modal.querySelector('#umInput'), er=modal.querySelector('#umErr');
    if(i) i.value=''; if(er) er.textContent='';
    document.addEventListener('keydown',escClose);
    setTimeout(()=>{ if(i) i.focus(); },50);
  }
  function closeModal(){ if(modal) modal.classList.remove('show'); document.removeEventListener('keydown',escClose); }

  function doUnlock(){
    unlocked=true; try{ localStorage.setItem(KEY,'1'); }catch(_){}
    removeLocks(); closeModal();
    const cb=pending; pending=null; if(cb) cb();
  }

  if(LOCK_ENABLED && !unlocked) applyLocks();

  // 提供主控台手動鎖回（測試用）：unlockReset()
  window.unlockReset=function(){ try{ localStorage.removeItem(KEY); }catch(_){} location.reload(); };

  // ---- 對外共用的 LINE 解鎖閘門（計算機與財務報告共用同一把鎖）----
  //  LineGate.open({title, desc, onSuccess}) — 未解鎖則跳視窗，解鎖後執行 onSuccess
  //  LineGate.isUnlocked() — 是否已解鎖
  window.LineGate={ open:openModal, isUnlocked:()=>unlocked };
})();
