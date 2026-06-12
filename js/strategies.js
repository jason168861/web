// ===================================================================
//  金融策略圖鑑 — 點卡片開啟閱讀彈窗（內容取自卡片內隱藏的 .strat-body）
// ===================================================================
(function(){
  const grid=document.getElementById('stratGrid');
  if(!grid) return;
  const LINE='https://line.me/R/ti/p/@453ubihw';

  // 共用彈窗
  let modal=null, lastFocus=null;
  function build(){
    modal=document.createElement('div');
    modal.className='strat-modal';
    modal.innerHTML=
      '<div class="sm-card" role="dialog" aria-modal="true" aria-labelledby="smTitle" tabindex="-1">'
      +'<button class="sm-x" type="button" aria-label="關閉">✕</button>'
      +'<div class="sm-head"><span class="sm-emoji" id="smEmoji" aria-hidden="true"></span><span class="sm-tag" id="smTag"></span></div>'
      +'<h3 id="smTitle"></h3>'
      +'<div class="sm-body" id="smBody"></div>'
      +'<div class="sm-cta"><span>想知道這套放在你身上怎麼做？</span>'
        +'<a href="'+LINE+'" target="_blank" rel="noopener">加 LINE 聊聊 →</a></div>'
      +'</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{ if(e.target===modal) close(); });
    modal.querySelector('.sm-x').addEventListener('click',close);
  }
  function open(card){
    if(!modal) build();
    const emoji=card.querySelector('.strat-emoji');
    const tag=card.querySelector('.strat-tag');
    const title=card.querySelector('h3');
    const body=card.querySelector('.strat-body');
    modal.querySelector('#smEmoji').textContent=emoji?emoji.textContent:'';
    modal.querySelector('#smTag').textContent=tag?tag.textContent:'';
    modal.querySelector('#smTitle').textContent=title?title.textContent:'';
    modal.querySelector('#smBody').innerHTML=body?body.innerHTML:'';
    lastFocus=document.activeElement;
    modal.classList.add('show');
    document.body.style.overflow='hidden';
    document.addEventListener('keydown',onKey);
    modal.querySelector('.sm-card').scrollTop=0;
    modal.querySelector('.sm-card').focus();
  }
  function close(){
    if(!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow='';
    document.removeEventListener('keydown',onKey);
    if(lastFocus&&lastFocus.focus) lastFocus.focus();
  }
  function onKey(e){ if(e.key==='Escape') close(); }

  grid.querySelectorAll('.strat-card').forEach(card=>{
    card.addEventListener('click',()=>open(card));
    card.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(card); } });
  });
})();
