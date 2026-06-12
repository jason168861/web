// ===================================================================
//  複利試算機 — 人生事件（中途提領 / 投入）
// ===================================================================

// ---- 人生事件 ----
function eventRowHTML(e){
  const tCls=e.type==='out'?'out':'in';
  const tTxt=e.type==='out'?'提領':'投入';
  return '<div class="ev-row" data-id="'+e.id+'">'
    +'<span class="ev-emoji">'+e.emoji+'</span>'
    +'<input class="ev-name" value="'+e.label.replace(/"/g,'&quot;')+'" aria-label="事件名稱">'
    +'<button type="button" class="ev-type '+tCls+'" aria-label="切換提領或投入">'+tTxt+'</button>'
    +'<span class="ev-mini y"><small>第</small><input class="yr" type="text" inputmode="numeric" value="'+e.year+'"><small>年</small></span>'
    +'<span class="ev-mini a"><input class="amt" type="text" inputmode="numeric" value="'+(e.amount/10000)+'"><small>萬</small></span>'
    +'<button type="button" class="ev-del" aria-label="刪除事件">✕</button>'
  +'</div>';
}
function renderEvents(){
  // 快捷 chips
  $('eventChips').innerHTML = EV_PRESETS.map((p,i)=>
    '<button type="button" class="chip" data-i="'+i+'">'+p.emoji+' '+p.label+'</button>').join('');
  $('eventChips').querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
    const p=EV_PRESETS[+c.dataset.i];
    events.push({id:uid(),emoji:p.emoji,label:p.label,type:p.type,year:Math.min(p.year,F.years),amount:p.amount});
    renderEvents(); render();
  }));
  // 列表
  $('eventList').innerHTML = events.map(eventRowHTML).join('');
  events.forEach(e=>{
    const row=$('eventList').querySelector('[data-id="'+e.id+'"]');
    if(!row) return;
    row.querySelector('.ev-name').addEventListener('input',ev=>{ e.label=ev.target.value; });
    row.querySelector('.ev-type').addEventListener('click',()=>{
      e.type = e.type==='out'?'in':'out'; renderEvents(); render();
    });
    const yr=row.querySelector('.yr');
    yr.addEventListener('input',()=>{ const v=parseInt(yr.value.replace(/\D/g,''))||1; e.year=clamp(v,1,F.years); render(); });
    yr.addEventListener('blur',()=>{ yr.value=e.year; });
    const amt=row.querySelector('.amt');
    amt.addEventListener('input',()=>{ const v=parseFloat(amt.value.replace(/[^\d.]/g,''))||0; e.amount=Math.round(v*10000); render(); });
    row.querySelector('.ev-del').addEventListener('click',()=>{ events=events.filter(x=>x.id!==e.id); renderEvents(); render(); });
  });
}
