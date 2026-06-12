// ===================================================================
//  複利試算機 — 模擬引擎（逐月投入、可選複利頻率、事件、通膨、成本）
// ===================================================================
//  RATE 為「有效年化報酬率」：滾滿一年剛好成長 RATE%。
//  CM 為複利頻率（每幾個月結算一次利息）：1=每月、3=每季、6=每半年、12=每年。
//  期中投入採月底投入、當期不計息（一般定期定額的保守算法）。

function simulate(P, M, Y, RATE, STEP, FEE, INFL, CM, EVS){
  const months=Math.round(Y*12);
  const annual=(RATE-FEE)/100;        // 有效年報酬(已扣成本)
  const cm=clamp(Math.round(CM||1),1,12); // 每幾個月複利一次
  const infl=INFL/100;
  const byMonth={};
  EVS.forEach(e=>{ const mm=clamp(Math.round(e.year),1,Y)*12; (byMonth[mm]=byMonth[mm]||[]).push(e); });

  let bal=P, contributed=P, withdrawn=0;
  let periodStart=bal, monthsInPeriod=0;   // 本期期初餘額 / 已過月數(期中投入不計入當期利息)
  const series=[{m:0,bal,paid:contributed,real:bal}];
  const byYear=[{year:0,bal,paid:contributed,real:bal,gain:0,cumW:0,note:''}];
  const warnings=[];

  for(let m=1;m<=months;m++){
    const yIdx=Math.floor((m-1)/12);
    const thisM=M*Math.pow(1+STEP/100, yIdx);
    bal+=thisM;                      // 本月投入(月底,當期不計息)
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

    // 利息結算:每 cm 個月一次;期末未滿一週期的零頭依比例結算
    monthsInPeriod++;
    if(monthsInPeriod===cm || m===months){
      bal += periodStart*(Math.pow(1+annual, monthsInPeriod/12)-1);
      periodStart=bal; monthsInPeriod=0;
    }

    if(m%12===0 || m===months){
      const yr=Math.round(m/12);
      const real=bal/Math.pow(1+infl,m/12);
      series.push({m,bal,paid:contributed,real,evLabel:note});
      byYear.push({year:yr,bal,paid:contributed,real,
        gain: bal+withdrawn-contributed, cumW:withdrawn, note});
    }
  }
  const finalBal=bal;
  const interest=finalBal+withdrawn-contributed;
  const realFinal=finalBal/Math.pow(1+infl,Y);
  return {months,series,byYear,finalBal,contributed,withdrawn,interest,realFinal,warnings};
}
