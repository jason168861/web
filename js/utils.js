// ===================================================================
//  共用工具 — DOM 捷徑、數值格式化、偏好設定
//  （此檔最先載入，其餘 js 皆可直接使用以下函式與變數）
// ===================================================================

// ---- DOM / 數值小工具 ----
const $     = id => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid   = () => Math.random().toString(36).slice(2, 8);

// 是否偏好「減少動態效果」（無障礙設定）— count-up 與進場動畫共用
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- 數值格式 ----
// showExact：true 時所有金額改顯示完整數字（NT$ 12,345,678），false 時顯示概數（萬/億）
let showExact = false;

const fmtNT  = n => 'NT$ ' + Math.round(n).toLocaleString('zh-TW');

const fmtWan = n => {
  if (showExact) return fmtNT(n);
  const w = n / 10000;
  if (Math.abs(w) >= 10000) return 'NT$ ' + (w / 10000).toFixed(2) + ' 億';
  if (Math.abs(w) >= 1)     return 'NT$ ' + Math.round(w).toLocaleString('zh-TW') + ' 萬';
  return 'NT$ ' + Math.round(n).toLocaleString('zh-TW');
};

// 無 NT$ 前綴，給圖表座標軸用（座標軸維持概數，避免標籤過長破版）
const fmtWanShort = n => {
  const w = n / 10000;
  if (Math.abs(w) >= 10000) return (w / 10000).toFixed(1) + '億';
  return Math.round(w).toLocaleString('zh-TW') + '萬';
};

const fmtYM = months => {
  const y = Math.floor(months / 12), m = months % 12;
  return (y ? y + ' 年' : '') + (m ? ' ' + m + ' 個月' : '') || '不到 1 個月';
};
