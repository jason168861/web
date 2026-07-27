// ===================================================================
//  財務健檢報告 — 表單 → 自動計算 → 產出可列印 PDF 的報告（下載前需加 LINE 解鎖）
//  依賴：simulate()（calc-engine）、clamp（utils）、window.LineGate（unlock）
// ===================================================================
(function(){
  const form=document.getElementById('reportForm');
  if(!form) return;
  const LINE='https://line.me/R/ti/p/@453ubihw';

  // ---- 小工具 ----
  const val=id=>{ const el=document.getElementById(id); return el?el.value:''; };
  const num=(id,def)=>{ const n=parseFloat(String(val(id)).replace(/[^\d.\-]/g,'')); return isFinite(n)?n:(def||0); };
  function money(n){
    n=Math.round(n||0); const w=n/10000, an=Math.abs(w);
    if(an>=10000) return 'NT$ '+(w/10000).toFixed(2)+' 億';
    if(an>=1)     return 'NT$ '+Math.round(w).toLocaleString('en-US')+' 萬';
    return 'NT$ '+n.toLocaleString('en-US');
  }
  const pct=x=>Math.round(x*100)+'%';

  // ---- 計算所有指標 ----
  function compute(){
    const age=clamp(Math.round(num('rfAge',30)),1,99);
    const retire=clamp(Math.round(num('rfRetire',65)),age+1,100);
    const years=retire-age;
    const income=Math.max(0,num('rfIncome',0));
    const expense=Math.max(0,num('rfExpense',0));
    const cash=Math.max(0,num('rfCash',0));
    const invest=Math.max(0,num('rfInvest',0));
    const realty=Math.max(0,num('rfRealty',0));
    const mortgage=Math.max(0,num('rfMortgage',0));
    const debt=Math.max(0,num('rfDebt',0));
    const rate=clamp(num('rfRate',6),0,20);
    let retireExp=num('rfRetireExp',0); if(retireExp<=0) retireExp=expense;

    const assets=cash+invest+realty;
    const liabilities=mortgage+debt;
    const netWorth=assets-liabilities;
    const monthlySave=income-expense;
    const savingsRate=income>0?monthlySave/income:0;
    const emFundMonths=expense>0?cash/expense:0;
    const debtRatio=assets>0?liabilities/assets:(liabilities>0?1:0);

    // 退休:用 4% 法則反推所需本金，並用現有可投資資產+每月結餘投影
    const investable=cash+invest;
    const sim=simulate(investable, Math.max(0,monthlySave), years, rate, 0,0,0,12, []);
    const projected=sim.finalBal;
    const needed=retireExp*12*25;             // 年支出 × 25
    const gap=needed-projected;               // >0 = 缺口
    const readiness=needed>0?projected/needed:1;

    // ---- 體質評分（4 面向，各 25 分）----
    const sSave = savingsRate>=0.3?25 : savingsRate>=0.2?20 : savingsRate>=0.1?13 : savingsRate>=0?6 : 0;
    const sEm   = emFundMonths>=6?25 : emFundMonths>=3?17 : emFundMonths>=1?9 : 3;
    const sDebt = liabilities===0?25 : debtRatio<=0.2?23 : debtRatio<=0.4?18 : debtRatio<=0.6?12 : debtRatio<=0.8?6 : 2;
    const sRet  = readiness>=1?25 : readiness>=0.7?19 : readiness>=0.4?12 : readiness>=0.2?6 : 3;
    const score = Math.round(sSave+sEm+sDebt+sRet);
    const grade = score>=80?{t:'目前較穩',c:'#2E7D5B'} : score>=60?{t:'可再確認',c:'#5C8A3A'} : score>=40?{t:'需要評估',c:'#D89436'} : {t:'優先評估',c:'#C0612A'};

    return {age,retire,years,income,expense,cash,invest,realty,mortgage,debt,rate,retireExp,
      assets,liabilities,netWorth,monthlySave,savingsRate,emFundMonths,debtRatio,
      investable,projected,needed,gap,readiness,score,grade,
      parts:{sSave,sEm,sDebt,sRet}, byYear:sim.byYear};
  }

  // ---- 退休投影面積圖 ----
  function projChart(d){
    const W=620,H=200,pl=8,pr=8,pt=14,pb=24;
    const pts=d.byYear; if(pts.length<2) return '';
    const maxV=Math.max(d.needed, pts[pts.length-1].bal, 1)*1.08;
    const x=i=>pl+(W-pl-pr)*(i/(pts.length-1));
    const y=v=>pt+(H-pt-pb)*(1-v/maxV);
    let line='', area='M '+x(0)+' '+y(pts[0].bal);
    pts.forEach((p,i)=>{ const c=x(i)+' '+y(p.bal); line+=(i?'L ':'M ')+c+' '; area+=' L '+c; });
    area+=' L '+x(pts.length-1)+' '+y(0)+' L '+x(0)+' '+y(0)+' Z';
    const ny=y(d.needed);
    return '<svg viewBox="0 0 '+W+' '+H+'" class="rproj" role="img" aria-label="退休資產成長投影">'
      +'<defs><linearGradient id="rgA" x1="0" y1="0" x2="0" y2="1">'
        +'<stop offset="0" stop-color="#7FA08A" stop-opacity=".35"/><stop offset="1" stop-color="#7FA08A" stop-opacity="0"/></linearGradient></defs>'
      +'<path d="'+area+'" fill="url(#rgA)"/>'
      +'<path d="'+line+'" fill="none" stroke="#2E7D5B" stroke-width="2.6" stroke-linejoin="round"/>'
      +'<line x1="'+pl+'" y1="'+ny+'" x2="'+(W-pr)+'" y2="'+ny+'" stroke="#C0612A" stroke-width="1.6" stroke-dasharray="5 5"/>'
      +'<text x="'+(W-pr)+'" y="'+(ny-6)+'" text-anchor="end" font-size="12" fill="#C0612A">估算參考 '+money(d.needed)+'</text>'
      +'<text x="'+pl+'" y="'+(H-7)+'" font-size="11" fill="#9AA39C">現在（'+d.age+'歲）</text>'
      +'<text x="'+(W-pr)+'" y="'+(H-7)+'" text-anchor="end" font-size="11" fill="#9AA39C">退休（'+d.retire+'歲）</text></svg>';
  }

  // ---- 初步問題清單：只指出需要評估的面向，不給個人化做法 ----
  function problemFindings(d){
    const t=[];
    if(d.income>0){
      t.push('現金流檢查：儲蓄率 '+pct(d.savingsRate)+'，需要進一步確認每月結餘是否穩定，以及年度支出是否被低估。');
    }else{
      t.push('現金流檢查：未填月收入，無法判斷儲蓄率，需帶著收支資料一起評估。');
    }
    t.push('預備金檢查：約 '+d.emFundMonths.toFixed(1)+' 個月生活費，需要評估收入中斷、醫療或家庭責任對現金流的影響。');
    if(d.gap>0){
      t.push('退休準備檢查：依簡化投影，退休準備可能有 '+money(d.gap)+' 缺口，需要進一步評估目標、通膨與提領風險。');
    }else{
      t.push('退休準備檢查：簡化投影顯示目前接近或超過估算值，但仍需評估通膨、提領順序與市場波動。');
    }
    if(d.liabilities>0){
      t.push('負債檢查：負債比 '+pct(d.debtRatio)+'，需要確認貸款是否壓縮生活、保障與退休準備。');
    }else{
      t.push('負債檢查：目前未輸入負債，但仍需確認是否有未列入的信用、房貸或家庭責任。');
    }
    return t;
  }

  // ---- 組出報告 HTML ----
  function buildDoc(d){
    const today=new Date();
    const dateStr=today.getFullYear()+'/'+String(today.getMonth()+1).padStart(2,'0')+'/'+String(today.getDate()).padStart(2,'0');
    const alloc=[['現金',d.cash,'#8FA796'],['投資',d.invest,'#D89436'],['不動產',d.realty,'#5C8A3A']].filter(a=>a[1]>0);
    const allocTotal=Math.max(d.assets,1);
    const allocBar=alloc.map(a=>'<i style="width:'+(a[1]/allocTotal*100).toFixed(1)+'%;background:'+a[2]+'"></i>').join('');
    const allocLeg=alloc.map(a=>'<span><i style="background:'+a[2]+'"></i>'+a[0]+' '+money(a[1])+'</span>').join('');
    const emPctW=Math.min(100,d.emFundMonths/6*100).toFixed(0);
    const sub=(label,v,max)=>'<div class="rsub"><span>'+label+'</span><b>'+v+'</b><i><u style="width:'+(v/max*100)+'%"></u></i></div>';

    return ''
    +'<div class="rdoc-head">'
      +'<div><div class="rdoc-brand">🌱 享退休 ・ RFC® 國際認證財務顧問師</div>'
      +'<h2>個人財務初步健檢報告</h2></div>'
      +'<div class="rdoc-meta">產出日期 '+dateStr+'<br>為 '+d.age+' 歲的你</div>'
    +'</div>'

    +'<section class="rdoc-section rscore">'
      +'<div class="rscore-side">'
        +'<div class="rscore-grade" style="color:'+d.grade.c+'">'+d.grade.t+'</div>'
        +'<p>這是依輸入資料做出的初步問題掃描，用來指出需要被進一步評估的面向，不等於完整財務規劃結論。</p>'
        +'<div class="rscore-bars">'
          +sub('儲蓄率',d.parts.sSave,25)+sub('緊急預備金',d.parts.sEm,25)
          +sub('負債控制',d.parts.sDebt,25)+sub('退休準備',d.parts.sRet,25)
        +'</div>'
      +'</div>'
    +'</section>'

    +'<section class="rdoc-section">'
      +'<h3>① 淨值總覽</h3>'
      +'<div class="rrow3">'
        +'<div class="rkpi"><span>總資產</span><b>'+money(d.assets)+'</b></div>'
        +'<div class="rkpi"><span>總負債</span><b>'+money(d.liabilities)+'</b></div>'
        +'<div class="rkpi hl"><span>淨值</span><b>'+money(d.netWorth)+'</b></div>'
      +'</div>'
      +(alloc.length?'<div class="ralloc"><div class="ralloc-bar">'+allocBar+'</div><div class="ralloc-leg">'+allocLeg+'</div></div>':'')
    +'</section>'

    +'<section class="rdoc-section">'
      +'<h3>② 現金流與儲蓄率</h3>'
      +'<div class="rrow3">'
        +'<div class="rkpi"><span>月收入</span><b>'+money(d.income)+'</b></div>'
        +'<div class="rkpi"><span>月支出</span><b>'+money(d.expense)+'</b></div>'
        +'<div class="rkpi hl"><span>月結餘</span><b>'+money(d.monthlySave)+'</b></div>'
      +'</div>'
      +'<p class="rnote">儲蓄率 <b>'+(d.income>0?pct(d.savingsRate):'—')+'</b>'+(d.income>0?'':'（請填月收入以計算）')+'</p>'
    +'</section>'

    +'<section class="rdoc-section">'
      +'<h3>③ 緊急預備金</h3>'
      +'<p class="rnote">手上現金約可支撐 <b>'+d.emFundMonths.toFixed(1)+' 個月</b>生活費，需搭配收入穩定度與家庭責任一起判斷。</p>'
      +'<div class="rprog"><u style="width:'+emPctW+'%"></u><span>'+emPctW+'% / 現金緩衝參考值</span></div>'
    +'</section>'

    +'<section class="rdoc-section">'
      +'<h3>④ 退休準備</h3>'
      +'<div class="rrow3">'
        +'<div class="rkpi"><span>退休需求估算</span><b>'+money(d.needed)+'</b></div>'
        +'<div class="rkpi"><span>退休時預估累積</span><b>'+money(d.projected)+'</b></div>'
        +'<div class="rkpi '+(d.gap>0?'warn':'good')+'"><span>'+(d.gap>0?'預估缺口':'預估超前')+'</span><b>'+money(Math.abs(d.gap))+'</b></div>'
      +'</div>'
      +projChart(d)
      +'<p class="rnote rmini">以現有可投資資產 '+money(d.investable)+' ＋ 每月結餘投入，年報酬 '+d.rate+'% 投影至 '+d.retire+' 歲；需求估算採年支出 × 25 的簡化假設，僅用來檢查是否需要進一步評估。</p>'
    +'</section>'

    +'<section class="rdoc-section">'
      +'<h3>⑤ 需要進一步評估的問題</h3>'
      +'<p class="rnote">以下只列出可能需要被評估的面向，不提供個人化處理順序。</p>'
      +'<ul class="rtake">'+problemFindings(d).map(t=>'<li>'+t+'</li>').join('')+'</ul>'
    +'</section>'

    +'<section class="rdoc-section rcta">'
      +'<h3>⑥ 下一步：帶著報告來評估</h3>'
      +'<p>這份健檢只負責把可能問題標出來，並不直接給個人化處理方案。真正該先評估哪一項，需要把你的目標、家庭責任、保障、投資與重大決策放在一起看。</p>'
      +'<a class="rcta-line" href="'+LINE+'" target="_blank" rel="noopener">＋ 帶著報告預約 30 分鐘財務健檢</a>'
    +'</section>'

    +'<p class="rdoc-disc">＊本報告由你輸入的數字自動試算，僅供教育與參考之用，不構成投資、保險或稅務建議；4% 法則與報酬率為簡化假設，未計入通膨、稅費與勞保／勞退年金。實際規劃請依個人狀況審慎評估。</p>'
    +'<div class="rdoc-foot">享退休 ・ RFC® 國際認證財務顧問師　│　LINE：@453ubihw　│　先找問題，才給工具</div>';
  }

  // ---- 報告視窗 ----
  let modal=null;
  function ensureModal(){
    if(modal) return;
    modal=document.createElement('div');
    modal.className='report-modal';
    modal.innerHTML='<div class="rm-card">'
      +'<div class="rm-actions">'
        +'<button type="button" class="rm-dl" id="rmDownload">⬇ 下載 / 列印 PDF</button>'
        +'<button type="button" class="rm-x" id="rmClose" aria-label="關閉">✕</button>'
      +'</div>'
      +'<div class="rdoc" id="rdoc"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
    modal.querySelector('#rmClose').addEventListener('click',closeModal);
    modal.querySelector('#rmDownload').addEventListener('click',()=>{
      const go=()=>{ try{ window.print(); }catch(_){} };
      if(window.LineGate){
        window.LineGate.open({
          title:'加入官方 LINE，保留你的問題清單',
          desc:'下載報告後，帶著這份初步問題清單預約評估；正式處理順序需依完整狀況判斷。',
          onSuccess:go
        });
      } else go();
    });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal.classList.contains('show')) closeModal(); });
  }
  function closeModal(){ if(modal){ modal.classList.remove('show'); document.body.style.overflow=''; } }
  function openReport(d){
    ensureModal();
    modal.querySelector('#rdoc').innerHTML=buildDoc(d);
    modal.classList.add('show');
    document.body.style.overflow='hidden';
    modal.querySelector('.rm-card').scrollTop=0;
  }

  // ---- 必填驗證 ----
  const REQUIRED=[['rfAge','目前年齡'],['rfRetire','預計退休年齡'],
                  ['rfIncome','月收入'],['rfExpense','月支出']];
  function rawFilled(id){ const v=String(val(id)).trim(); if(!v) return false;
    const n=parseFloat(v.replace(/[^\d.\-]/g,'')); return isFinite(n); }
  const errBox=document.createElement('p'); errBox.className='rf-err'; errBox.setAttribute('role','alert'); errBox.hidden=true;
  form.querySelector('.rf-foot').appendChild(errBox);
  function setInvalid(id,bad){ const el=document.getElementById(id); if(!el) return;
    el.classList.toggle('rf-invalid',bad); el.setAttribute('aria-invalid',bad?'true':'false'); }
  function showErr(msg){ errBox.textContent=msg; errBox.hidden=false; }
  function clearErr(){ errBox.hidden=true; }

  // 使用者一開始輸入就解除該欄的紅框
  form.addEventListener('input',e=>{
    if(e.target.matches('input')){ e.target.classList.remove('rf-invalid'); e.target.setAttribute('aria-invalid','false');
      if(!form.querySelector('.rf-invalid')) clearErr(); }
  });

  form.addEventListener('submit',e=>{
    e.preventDefault();
    REQUIRED.forEach(([id])=>setInvalid(id,false)); clearErr();
    const missing=REQUIRED.filter(([id])=>!rawFilled(id));
    if(missing.length){
      missing.forEach(([id])=>setInvalid(id,true));
      showErr('請先填寫：'+missing.map(m=>m[1]).join('、'));
      const first=document.getElementById(missing[0][0]); if(first) first.focus();
      return;
    }
    if(num('rfRetire',0)<=num('rfAge',0)){
      setInvalid('rfRetire',true);
      showErr('預計退休年齡需大於目前年齡。');
      const el=document.getElementById('rfRetire'); if(el){ el.focus(); el.select&&el.select(); }
      return;
    }
    openReport(compute());
  });
})();
