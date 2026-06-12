// ===================================================================
//  複利試算機 — 狀態 & 欄位設定
// ===================================================================

// ---- 可變狀態 ----
const F = { principal:300000, monthly:10000, years:20, rate:6, stepUp:0, inflation:2, fee:0, compound:12 };
const G = { target:10000000, gyears:20, gbudget:10000, solve:'monthly' };
let mode   = 'forward';   // forward | goal
let ioMode = 'slider';    // slider | input
let events = [];
let showReal = false, showPaid = true;

// ---- 欄位設定（正向模式） ----
const FWD = [
 {k:'principal',name:'起始本金',min:0,max:5000000,step:10000,unit:'元',kind:'money',hint:'現在手上、準備一次投入的錢'},
 {k:'monthly',  name:'每月投入',min:0,max:100000, step:1000, unit:'元',kind:'money',hint:'每個月固定投入的金額(定期定額)'},
 {k:'years',    name:'投資年期',min:1,max:50,     step:1,    unit:'年',kind:'plain',hint:'這筆錢預計持續滾多少年'},
 {k:'rate',     name:'預估年化報酬率',min:0,max:20,step:0.5, unit:'%',kind:'rate', hint:'長期平均年報酬。全球股市約 6–8%,定存約 1–2%',rateHint:['定存 1%','穩健 6%','積極 15%']},
];

// ---- 進階設定欄位 ----
const ADV = [
 {k:'stepUp',   name:'每年投入增額',min:0,max:15,step:0.5,unit:'%',kind:'rate',hint:'每年調高定期定額的幅度。設 5% 代表每年投入比前一年多 5%,模擬加薪後多存'},
 {k:'inflation',name:'通膨率',     min:0,max:8, step:0.5,unit:'%',kind:'rate',hint:'用來換算「實質購買力」,長期平均約 2–3%'},
 {k:'fee',      name:'年度成本費用',min:0,max:3, step:0.1,unit:'%',kind:'rate',hint:'基金管理費、平台費等,會直接從年報酬中扣除'},
];

// ---- 欄位設定（目標模式） ----
const GOAL = [
 {k:'principal',name:'起始本金',min:0,max:5000000,step:10000,unit:'元',kind:'money',hint:'現在手上、準備一次投入的錢',store:F},
 {k:'target',   name:'我的目標金額',min:100000,max:100000000,step:100000,unit:'元',kind:'money',hint:'你想累積到的總資產',store:G},
];

// ---- 人生事件快捷鍵 ----
const EV_PRESETS = [
 {emoji:'🏠',label:'買房頭期款',type:'out',year:10, amount:2000000},
 {emoji:'🚗',label:'買車',     type:'out',year:5, amount:800000},
 {emoji:'🎓',label:'子女教育金',type:'out',year:15,amount:1000000},
 {emoji:'💍',label:'結婚',     type:'out',year:4, amount:600000},
 {emoji:'✈️',label:'圓夢旅遊',  type:'out',year:6, amount:300000},
 {emoji:'💰',label:'年終/獎金', type:'in', year:3, amount:300000},
 {emoji:'🎁',label:'繼承/餽贈', type:'in', year:10,amount:1000000},
];
