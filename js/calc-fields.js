// ===================================================================
//  複利試算機 — 輸入欄位渲染（滑桿 / 輸入框 兩種模式）
// ===================================================================

// ---- 欄位格式化 / 解析 ----
function fmtFieldVal(f,v){
  if(f.kind==='money') return Math.round(v).toLocaleString('en-US');
  if(f.kind==='rate')  return (Math.round(v*10)/10).toString();
  return Math.round(v).toString();
}
function parseFieldVal(f,s){
  const n=parseFloat(String(s).replace(/[^\d.\-]/g,''));
  return n;
}

// ---- 渲染單一欄位 ----
function fieldHTML(f,v){
  const pre = f.kind==='money' ? '<span class="pre">NT$</span>' : '';
  const im  = f.kind==='money' ? 'inputmode="numeric"' : 'inputmode="decimal"';
  const hint = f.hint ? '<span class="info" tabindex="0" role="img" aria-label="'+f.hint+'" data-tip="'+f.hint+'">?</span>' : '';
  // 提示標籤依「實際數值」對齊滑桿位置(translateX 隨百分比平移,邊緣不溢出、中段置中)
  const rh = (f.rateHint)
    ? '<div class="rate-hint">'+f.rateHint.map(t=>{
        const mm=String(t).match(/([\d.]+)\s*%/);
        const val=mm?parseFloat(mm[1]):null;
        const pct=val!=null?clamp((val-f.min)/(f.max-f.min)*100,0,100):0;
        return '<span style="left:'+pct.toFixed(1)+'%;transform:translateX(-'+pct.toFixed(1)+'%)">'+t+'</span>';
      }).join('')+'</div>' : '';
  return '<div class="field field-'+f.kind+'" data-k="'+f.k+'">'
    +'<div class="field-top">'
      +'<span class="field-name">'+f.name+hint+'</span>'
      +'<div class="field-box">'+pre
        +'<input class="field-val" type="text" '+im+' value="'+fmtFieldVal(f,v)+'" aria-label="'+f.name+'">'
        +'<span class="unit">'+f.unit+'</span>'
        +'<span class="stepper"><button type="button" data-d="-1" tabindex="-1">−</button><button type="button" data-d="1" tabindex="-1">＋</button></span>'
      +'</div>'
    +'</div>'
    +'<input class="field-slider" type="range" min="'+f.min+'" max="'+f.max+'" step="'+f.step+'" value="'+v+'" aria-label="'+f.name+'滑桿">'
    +rh
  +'</div>';
}

function fitNumInput(inp){
  // 輸入模式整列滿版,不需調整;滑桿模式依字數自動加寬,避免大數字被截斷
  const panel=document.getElementById('calcPanel');
  if(panel && panel.getAttribute('data-io')==='input'){ inp.style.width=''; return; }
  const len=(inp.value||'').length;
  // 上限放寬，確保大數字（如 100,000,000）在電腦版滑桿模式不會被截斷
  inp.style.width=Math.min(16,Math.max(5,len+1.2)).toFixed(1)+'ch';
}
function refitAllInputs(){
  document.querySelectorAll('#calcPanel .field-val').forEach(fitNumInput);
}
function buildFields(container, list){
  container.innerHTML = list.map(f=>fieldHTML(f, (f.store||F)[f.k])).join('');
  list.forEach(f=>{
    const store=f.store||F;
    const row=container.querySelector('[data-k="'+f.k+'"]');
    const slider=row.querySelector('.field-slider');
    const input =row.querySelector('.field-val');
    fitNumInput(input);
    const reveal=()=>{ if(typeof revealCalcResults==='function') revealCalcResults(); };
    const commit=(v,syncInput)=>{
      reveal();
      v=clamp(v,f.min,f.max); store[f.k]=v;
      slider.value=v;
      if(syncInput) input.value=fmtFieldVal(f,v);
      fitNumInput(input);
      render();
    };
    slider.addEventListener('input',()=>commit(parseFloat(slider.value),true));
    input.addEventListener('input',()=>{
      reveal();
      fitNumInput(input);
      const v=parseFieldVal(f,input.value);
      if(!isNaN(v)){ store[f.k]=clamp(v,f.min,f.max); slider.value=store[f.k]; render(); }
    });
    input.addEventListener('blur',()=>{
      let v=parseFieldVal(f,input.value); if(isNaN(v)) v=f.min;
      commit(v,true);
    });
    input.addEventListener('keydown',e=>{ if(e.key==='Enter') input.blur(); });
    row.querySelectorAll('.stepper button').forEach(b=>
      b.addEventListener('click',()=>commit((store[f.k]||0)+f.step*(+b.dataset.d),true)));
  });
}

// ---- 渲染目標模式的 solve 控制 ----
function buildGoalExtra(){
  const host=$('goalFields');
  // solve 切換
  const seg=document.createElement('div');
  seg.innerHTML='<label style="display:block;font-size:.92rem;color:#DCE4DA;margin:4px 0 9px">我想知道⋯</label>'
   +'<div class="seg" role="group" aria-label="回推方式" style="display:flex;gap:8px;margin-bottom:16px">'
   +'<button type="button" data-solve="monthly" '+(G.solve==='monthly'?'aria-pressed="true"':'aria-pressed="false"')+'>每月該存多少?</button>'
   +'<button type="button" data-solve="time" '+(G.solve==='time'?'aria-pressed="true"':'aria-pressed="false"')+'>要存多久?</button></div>'
   +'<div id="goalCond"></div>';
  host.appendChild(seg);
  host.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
    if(typeof revealCalcResults==='function') revealCalcResults();
    host.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true'); G.solve=b.dataset.solve; buildGoalCond(); render();
  }));
  buildGoalCond();
  // 報酬率(共用 F.rate)
  const rateWrap=document.createElement('div');
  host.appendChild(rateWrap);
  buildFields(rateWrap,[FWD[3]]); // rate
}
function buildGoalCond(){
  const c=$('goalCond'); c.innerHTML='';
  if(G.solve==='monthly') buildFields(c,[{k:'gyears',name:'預計達成年期',min:1,max:50,step:1,unit:'年',kind:'plain',hint:'你希望幾年內達成目標',store:G}]);
  else buildFields(c,[{k:'gbudget',name:'每月可投入',min:0,max:200000,step:1000,unit:'元',kind:'money',hint:'每月固定能拿出來投入的金額',store:G}]);
}
