// ===================================================================
//  複利試算機 — 模擬引擎（逐月複利、事件、通膨、成本）
// ===================================================================

function simulate(P, M, Y, RATE, STEP, FEE, INFL, EVS){
  const months=Math.round(Y*12);
  const r=(RATE-FEE)/100/12;         // 月報酬(已扣成本)
  const infl=INFL/100;
  const byMonth={};
  EVS.forEach(e=>{ const mm=clamp(Math.round(e.year),1,Y)*12; (byMonth[mm]=byMonth[mm]||[]).push(e); });

  let bal=P, contributed=P, withdrawn=0;
  const series=[{m:0,bal,paid:contributed,real:bal}];
  const byYear=[{year:0,bal,paid:contributed,real:bal,gain:0,cumW:0,note:''}];
  const warnings=[];
  let yStartPaid=contributed;

  for(let m=1;m<=months;m++){
    const yIdx=Math.floor((m-1)/12);
    const thisM=M*Math.pow(1+STEP/100, yIdx);
    bal=bal*(1+r)+thisM;
    contributed+=thisM;

    let note='';
    if(byMonth[m]){
      // 事件發生前的高點(畫出缺口頂端)
      series.push({m,bal,paid:contributed,real:bal/Math.pow(1+infl,m/12),top:true});
      const labels=[];
      byMonth[m].forEach(e=>{
        if(e.type==='out'){
          if(bal < e.amount){ warnings.push({year:e.year,label:e.label,need:e.amount,have:bal});
            withdrawn+=bal; bal=0; }
          else { bal-=e.amount; withdrawn+=e.amount; }
          labels.push('−'+fmtWan(e.amount)+' '+e.label);
        } else {
          bal+=e.amount; contributed+=e.amount;
          labels.push('+'+fmtWan(e.amount)+' '+e.label);
        }
      });
      note=labels.join('、');
    }

    if(m%12===0 || m===months){
      const yr=Math.round(m/12);
      const real=bal/Math.pow(1+infl,m/12);
      series.push({m,bal,paid:contributed,real,evLabel:note});
      byYear.push({year:yr,bal,paid:contributed,real,
        gain: bal+withdrawn-contributed, cumW:withdrawn, note});
      yStartPaid=contributed;
    }
  }
  const finalBal=bal;
  const interest=finalBal+withdrawn-contributed;
  const realFinal=finalBal/Math.pow(1+infl,Y);
  return {months,series,byYear,finalBal,contributed,withdrawn,interest,realFinal,warnings};
}
