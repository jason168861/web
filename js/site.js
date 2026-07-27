// ===================================================================
//  全站互動 — 數字 count-up、捲動進度條、浮動按鈕、導覽高亮
// ===================================================================

// ---------- 數字 count-up ----------
function easeOutCubic(p){return 1-Math.pow(1-p,3);}
function animateNum(el, to, fmt, dur){
  const myId=(el._animId||0)+1; el._animId=myId;
  if(reduce){el.textContent=fmt(to);return;}
  const from=0, t0=performance.now();
  (function tick(now){
    if(el._animId!==myId)return;            // 已被更新的數值取代,停止動畫
    const p=Math.min((now-t0)/(dur||900),1);
    el.textContent=fmt(from+(to-from)*easeOutCubic(p));
    if(p<1)requestAnimationFrame(tick);
  })(performance.now());
}

// 信任條數字進場時跑動
const cuObserver=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    const el=e.target, to=+el.dataset.count, suf=el.dataset.suffix||'';
    animateNum(el, to, v=>Math.round(v)+suf, 1100);
    cuObserver.unobserve(el);
  }
}),{threshold:.6});
document.querySelectorAll('.count-up').forEach(el=>cuObserver.observe(el));

// 試算結果首次進場時跑動(用 draw() 已算好的數值)
const calcObserver=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting && mode==='forward'){
    animateNum($('totalIn'),  window._calcPaid||0, fmtWan, 1000);
    animateNum($('totalOut'), window._calcBal ||0, fmtWan, 1100);
    calcObserver.unobserve(e.target);
  }
}),{threshold:.5});
const resFwd=$('resForward'); if(resFwd)calcObserver.observe(resFwd);

// ---------- 捲動進度條 + 浮動按鈕 + 導覽高亮 ----------
const bar=$('scrollBar'), fab=$('fab');
const heroEl=document.querySelector('.hero'), contactEl=$('contact');
function onScroll(){
  const h=document.documentElement;
  const sc=h.scrollTop||document.body.scrollTop;
  const max=h.scrollHeight-h.clientHeight;
  if(bar)bar.style.width=(max>0?(sc/max*100):0)+'%';
  if(fab){
    const heroH=heroEl?heroEl.offsetHeight:500;
    const cTop=contactEl?contactEl.getBoundingClientRect().top:9e9;
    fab.classList.toggle('show', sc>heroH*0.7 && cTop>innerHeight*0.85);
  }
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',onScroll,{passive:true});
onScroll();

// 導覽列：高亮目前所在區塊
const navMap={};
document.querySelectorAll('.nav-links a').forEach(a=>{
  const id=a.getAttribute('href'); if(id&&id.startsWith('#'))navMap[id.slice(1)]=a;
});
const spy=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    Object.values(navMap).forEach(a=>a.classList.remove('active'));
    if(navMap[e.target.id])navMap[e.target.id].classList.add('active');
  }
}),{rootMargin:'-45% 0px -50% 0px',threshold:0});
['pain','method','stories','services','tools','money-faq','about','booking-faq','contact'].forEach(id=>{const el=$(id);if(el)spy.observe(el);});

// 右上角網站架構選單：點章節或點外部時收起
const siteMapMenu=document.querySelector('.site-map-menu');
if(siteMapMenu){
  siteMapMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ siteMapMenu.open=false; }));
  document.addEventListener('click',e=>{
    if(siteMapMenu.open && !siteMapMenu.contains(e.target)) siteMapMenu.open=false;
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') siteMapMenu.open=false;
  });
}
