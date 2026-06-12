// ===================================================================
//  客戶回饋輪播 — scroll-snap + 箭頭/圓點 + 自動播放（環狀、可暫停）
// ===================================================================
(function(){
  const track=document.getElementById('quotesTrack');
  if(!track) return;
  const wrap=track.closest('.quotes-wrap');
  const cards=Array.from(track.children);
  const prev=wrap&&wrap.querySelector('.q-nav.prev');
  const next=wrap&&wrap.querySelector('.q-nav.next');
  const dotsBox=document.getElementById('quotesDots');
  const reduceM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTO=5000;

  // 單張卡片的位移量(含間距);只有一張時退回卡片寬
  const stride=()=> cards.length>1
    ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
    : cards[0].offsetWidth;
  const perView=()=> Math.max(1, Math.round(track.clientWidth/stride()));
  const pages=()=> Math.max(1, cards.length - perView() + 1);
  const curPage=()=> Math.max(0, Math.min(pages()-1, Math.round(track.scrollLeft/stride())));

  function goTo(i,smooth){
    const p=pages();
    i=((i%p)+p)%p;                                   // 環狀
    track.scrollTo({left:Math.round(i*stride()), behavior:(smooth&&!reduceM)?'smooth':'auto'});
  }

  // ---- 圓點 ----
  function buildDots(){
    const n=pages(), inert=n<=1;
    if(prev) prev.hidden=inert;
    if(next) next.hidden=inert;
    if(dotsBox){
      dotsBox.hidden=inert;
      dotsBox.innerHTML='';
      if(!inert) for(let i=0;i<n;i++){
        const b=document.createElement('button');
        b.type='button'; b.setAttribute('role','tab'); b.setAttribute('aria-label','第 '+(i+1)+' 組評論');
        b.addEventListener('click',()=>{ goTo(i,true); kick(); });
        dotsBox.appendChild(b);
      }
    }
    syncDots();
  }
  function syncDots(){
    if(!dotsBox||dotsBox.hidden) return;
    const c=curPage();
    Array.from(dotsBox.children).forEach((d,i)=>d.setAttribute('aria-selected', i===c?'true':'false'));
  }

  // ---- 導覽 ----
  if(prev) prev.addEventListener('click',()=>{ goTo(curPage()-1,true); kick(); });
  if(next) next.addEventListener('click',()=>{ goTo(curPage()+1,true); kick(); });

  let raf=0;
  track.addEventListener('scroll',()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; syncDots(); }); },{passive:true});

  // ---- 自動播放 ----
  let timer=0, visible=true, hovered=false;
  function sync(){
    if(timer){ clearInterval(timer); timer=0; }
    if(!reduceM && pages()>1 && visible && !hovered) timer=setInterval(()=>goTo(curPage()+1,true),AUTO);
  }
  function kick(){ sync(); }   // 手動操作後重置倒數(避免操作完馬上又跳)

  if(wrap){
    wrap.addEventListener('pointerenter',()=>{ hovered=true;  sync(); });
    wrap.addEventListener('pointerleave',()=>{ hovered=false; sync(); });
    wrap.addEventListener('focusin',()=>{ hovered=true;  sync(); });
    wrap.addEventListener('focusout',()=>{ hovered=false; sync(); });
  }
  track.addEventListener('pointerdown',kick);
  track.addEventListener('touchstart',kick,{passive:true});
  track.addEventListener('wheel',kick,{passive:true});

  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>es.forEach(e=>{ visible=e.isIntersecting; sync(); }),{threshold:.2}).observe(wrap||track);
  }

  // 鍵盤左右鍵
  track.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){ goTo(curPage()+1,true); kick(); e.preventDefault(); }
    else if(e.key==='ArrowLeft'){ goTo(curPage()-1,true); kick(); e.preventDefault(); }
  });

  let rt=0;
  addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ buildDots(); goTo(curPage(),false); sync(); },150); });

  buildDots();
  sync();
})();
