// ===================================================================
//  複利試算機 — 逐年明細表、主渲染、模式切換、初始化
// ===================================================================

// ---- 逐年明細表 ----
function renderTable(d){
  const t=$('yearTable'); if(!t) return;
  let head='<thead><tr><th>年</th><th>累計投入</th><th>期末餘額</th><th>累計獲利</th>'
    +(showReal?'<th>實質購買力</th>':'')+'<th>事件</th></tr></thead>';
  let body='<tbody>';
  d.byYear.forEach(p=>{ if(p.year===0) return;
    body+='<tr class="'+(p.note?'ev':'')+'">'
      +'<td>'+p.year+'</td>'
      +'<td>'+fmtWan(p.paid)+'</td>'
      +'<td>'+fmtWan(p.bal)+'</td>'
      +'<td>'+fmtWan(p.gain)+'</td>'
      +(showReal?'<td>'+fmtWan(p.real)+'</td>':'')
      +'<td class="note">'+(p.note||'')+'</td></tr>';
  });
  body+='</tbody>';
  t.innerHTML=head+body;
}


// ---- 主渲染 ----
function render(){
  if(mode==='forward') renderForward();
  else                 renderGoal();
}

function renderForward(){
  const d=simulate(F.principal,F.monthly,F.years,F.rate,F.stepUp,F.fee,F.inflation,events);

  // 大數字
  $('totalOut').textContent=fmtWan(d.finalBal);
  $('totalIn').textContent =fmtWan(d.contributed);
  $('totalOut')._animId=($('totalOut')._animId||0)+1;   // 讓任何進場跑動動畫停止,以即時數值為準
  $('totalIn')._animId =($('totalIn')._animId||0)+1;
  $('totalGain').textContent=fmtWan(Math.max(0,d.interest));
  const mk=$('miniKpi'); if(mk) mk.innerHTML='投入 <b>'+fmtWan(d.contributed)+'</b> ・ 獲利 <b>'+fmtWan(Math.max(0,d.interest))+'</b>';
  window._calcPaid=d.contributed; window._calcBal=d.finalBal;

  // 實質購買力副標
  const rs=$('realSub');
  if(showReal && F.inflation>0){
    rs.innerHTML='扣掉通膨後,等於今天的 <b>'+fmtWan(d.realFinal)+'</b> 購買力';
    rs.classList.remove('hide');
  } else rs.classList.add('hide');

  // 組成條(本金 vs 複利)
  const netPrincipal=Math.max(0,d.contributed-d.withdrawn);
  const base=Math.max(d.finalBal,1);
  const pPct=clamp(netPrincipal/base*100,0,100);
  const gPct=clamp(100-pPct,0,100);
  $('compoBar').innerHTML=
    '<div class="bar"><i class="p" style="width:'+pPct.toFixed(1)+'%"></i><i class="g" style="width:'+gPct.toFixed(1)+'%"></i></div>'
    +'<div class="leg">'
      +'<span><i class="sw" style="background:#8FA796"></i>本金留存 '+fmtWan(netPrincipal)+'</span>'
      +'<span><i class="sw" style="background:#D89436"></i>複利獲利 '+fmtWan(Math.max(0,d.finalBal-netPrincipal))+'</span>'
    +'</div>';

  // 期中提領統計
  const ev=$('evStat');
  if(d.withdrawn>0){ ev.innerHTML='🧭 期間你為人生大事領出了 <b>'+fmtWan(d.withdrawn)+'</b>,剩下的錢繼續幫你滾'; ev.classList.remove('hide'); }
  else ev.classList.add('hide');

  // 提領超額警告
  const wb=$('warnBox');
  if(d.warnings.length){
    const w=d.warnings[0];
    wb.innerHTML='<span class="ic">⚠️</span><div>第 <b>'+w.year+'</b> 年想領出 <b>'+fmtWan(w.need)+'</b>('+w.label+'),但屆時帳上只有約 <b>'+fmtWan(w.have)+'</b>,差 <b>'+fmtWan(w.need-w.have)+'</b>。可以提高每月投入、延後這筆支出,或調整金額再看看。</div>';
    wb.classList.remove('hide');
  } else wb.classList.add('hide');

  // 拖延的代價
  const dc=$('delayCost');
  if(F.years>5){
    const late=simulate(F.principal,F.monthly,F.years-5,F.rate,F.stepUp,F.fee,F.inflation,[]);
    const now =simulate(F.principal,F.monthly,F.years,  F.rate,F.stepUp,F.fee,F.inflation,[]);
    const gap=now.finalBal-late.finalBal;
    if(gap>0){
      $('delayText').innerHTML='同樣的計畫,<b>晚 5 年</b>才開始,最後會少滾出 <b>'+fmtWan(gap)+'</b>。對複利來說,時間比金額更值錢。';
      dc.classList.remove('hide');
    } else dc.classList.add('hide');
  } else dc.classList.add('hide');

  drawChart(d,0);
  renderTable(d);
}

function renderGoal(){
  const L=F.principal, T=G.target;
  const r=(F.rate-F.fee)/100/12;
  let series, P=0, months=0, txtLabel='', txtValue='', txtSub='';

  if(G.solve==='monthly'){
    months=Math.round(G.gyears*12);
    if(r===0){ P=(T-L)/months; }
    else { const g=Math.pow(1+r,months); P=(T-L*g)*r/(g-1); }
    if(P<=0){
      const fl=r===0? L : L*Math.pow(1+r,months);
      txtLabel='好消息:不用再定期定額!'; txtValue='NT$ 0 / 月';
      txtSub='你的單筆 '+fmtWan(L)+' 在 '+G.gyears+' 年後約滾成 '+fmtWan(fl)+',已超過目標 🎉';
      P=0;
    } else {
      P=Math.ceil(P/100)*100;
      txtLabel='要在 '+G.gyears+' 年內達成 '+fmtWan(T)+',你每月需投入';
      txtValue=fmtNT(P)+' / 月';
      txtSub = L>0 ? ('其中起始本金 '+fmtWan(L)+' 先幫你打底') : '從零開始也沒問題,時間會是你最好的隊友';
    }
    series=buildGoalSeries(L,P,months,r);
  } else {
    P=G.gbudget;
    if(L<=0 && P<=0){
      txtLabel='嗯⋯這樣算不出來 😅'; txtValue='請先投入一點點';
      txtSub='把起始本金或每月金額拉高,複利才有東西可以滾';
      $('chart').innerHTML=''; hoverPts=[];
      setGoalText(txtLabel,txtValue,txtSub); $('yearTable').innerHTML=''; return;
    }
    let bal=L, m=0; const MAX=100*12;
    while(bal<T && m<MAX){ m++; bal=bal*(1+r)+P; }
    months=Math.max(m,12);
    if(m>=MAX && bal<T){
      txtLabel='以目前的投入,100 年內達不到目標'; txtValue='> 100 年';
      txtSub='試著提高每月金額、起始本金,或調整目標看看';
      series=buildGoalSeries(L,P,40*12,r);
    } else {
      txtLabel='達成 '+fmtWan(T)+' 的目標,大約需要'; txtValue=fmtYM(m);
      const tot=L+P*m;
      txtSub='屆時總投入約 '+fmtWan(tot)+',複利幫你補上其餘的 '+fmtWan(Math.max(0,T-tot));
      series=buildGoalSeries(L,P,m,r);
    }
  }
  setGoalText(txtLabel,txtValue,txtSub);
  const d={months, series, byYear:goalByYear(series), finalBal:series[series.length-1].bal};
  drawChart(d,T);
  renderTable(d);
}
function setGoalText(l,v,s){ $('ansLabel').textContent=l; $('ansValue').textContent=v; $('ansSub').textContent=s; }
function buildGoalSeries(L,P,months,r){
  const infl=F.inflation/100;
  const s=[{m:0,bal:L,paid:L,real:L}]; let bal=L;
  for(let m=1;m<=months;m++){ bal=bal*(1+r)+P;
    if(m%12===0||m===months) s.push({m,bal,paid:L+P*m,real:bal/Math.pow(1+infl,m/12),evLabel:''});
  } return s;
}
function goalByYear(series){ return series.map(p=>({year:Math.round(p.m/12),bal:p.bal,paid:p.paid,real:p.real,gain:p.bal-p.paid,cumW:0,note:''})); }

// ===================================================================
//  模式 / IO 切換
// ===================================================================
function applyMode(){
  $('forwardFields').classList.toggle('hide', mode!=='forward');
  $('goalFields').classList.toggle('hide', mode!=='goal');
  $('eventsWrap').classList.toggle('hide', mode!=='forward');
  $('resForward').classList.toggle('hide', mode!=='forward');
  $('fwdDetail').classList.toggle('hide', mode!=='forward');
  $('resGoal').classList.toggle('hide', mode!=='goal');
  render();
}
document.querySelectorAll('.calc-tabs .tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.calc-tabs .tab').forEach(x=>x.setAttribute('aria-selected','false'));
  t.setAttribute('aria-selected','true'); mode=t.dataset.mode; applyMode();
}));
document.querySelectorAll('.io-toggle button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.io-toggle button').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true'); ioMode=b.dataset.io; $('calcPanel').setAttribute('data-io',ioMode);
  refitAllInputs();
}));
$('ckReal').addEventListener('change',e=>{ showReal=e.target.checked; render(); });
$('ckPaid').addEventListener('change',e=>{ showPaid=e.target.checked; render(); });
$('addEvent').addEventListener('click',()=>{
  events.push({id:uid(),emoji:'📌',label:'自訂事件',type:'out',year:Math.min(5,F.years),amount:500000});
  renderEvents(); render();
});

// ---- 初始化 ----
buildFields($('forwardFields'),FWD);
buildFields($('advFields'),ADV);
buildFields($('goalFields'),GOAL);
buildGoalExtra();
renderEvents();
applyMode();
// ---------- 捲動進場 ----------
if(reduce){
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
}else{
  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

