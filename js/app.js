/* =============================================================================
 * app.js —— 日富一日·钱途光明 工作台（纯前端 / localStorage）
 * -----------------------------------------------------------------------------
 * 扩展点（预留迭代空间）：
 *   1) 新增菜单页：在 NAV 数组追加一项 {key,label,icon}，并在 PAGES 注册渲染函数。
 *   2) 新增 AI 工具：直接编辑 config.js 的 aiTools，无需改逻辑。
 *   3) 所有数据存于 localStorage（键前缀 wb_），便于导入/导出与备份。
 * =========================================================================== */
'use strict';

/* ----------------------------- 存储层 ----------------------------- */
const DB = {
  get(k, d){ try{ const v = localStorage.getItem('wb_'+k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('wb_'+k, JSON.stringify(v)); }catch(e){ toast('本地存储不可用，请检查浏览器设置', 'bad'); } }
};

const State = {
  tasks:    DB.get('tasks', []),
  notes:    DB.get('notes', []),
  quotas:   DB.get('quotas', []),
  accounts: DB.get('accounts', []),
  assets:   DB.get('assets', []),   // 资产管家：银行卡余额记录
  rec:      DB.get('rec', {date:'', movie:'', tv:'', book:''}),
  settings: DB.get('settings', { theme:'light', avatar:'', quotaPwd:'', accountPwd:'', lastExport:'', aiUsage:{} }),
  checkins: DB.get('checkins', []),  // 打卡日志：['YYYY-MM-DD', ...]，仅追加；dailyReset 不触碰
  checkinItems: DB.get('checkinItems', {}), // 打卡具体事项：{date: {items: ['任务名',...], at: timestamp}}；超过 90 天 items 自动清空，date 保留
  budgets:   DB.get('budgets', {}),   // 月度预算：{ 'YYYY-MM': { '餐饮': 1000, ... } }；可为部分分类设置
  recurring: DB.get('recurring', []), // 固定收支：[{ id, name, type, cat, amount, cycle:'monthly', day, lastAdded, paused, note }]
};
const save = k => DB.set(k, State[k]);
const saveSettings = () => DB.set('settings', State.settings);
let quickKind='long'; // 底部快捷添加栏当前选中的任务类型（long 长期 / short 短期）

/* ----------------------------- 打卡日志（修复本周打卡次日消失 bug）----------------------------- */
// 一次性迁移：从历史任务的 doneDate 重建 checkins（覆盖 dailyReset 把 done=false 但 doneDate 仍保留的情况）
(function migrateCheckins(){
  const set = new Set(State.checkins);
  let dirty = false;
  State.tasks.forEach(t=>{ if(t.doneDate && !set.has(t.doneDate)){ set.add(t.doneDate); dirty = true; }});
  if(dirty){ State.checkins = Array.from(set).sort(); save('checkins'); }
})();
// 记录某一天的打卡（幂等：同日重复调用不重复添加）；打卡日志永不删除
// 同时把当天完成的任务快照存进 checkinItems（如果还没有），便于事后查看
function recordCheckin(ds){
  ds = ds || todayStr();
  // 1. 打卡日期入栈（保留原有行为）
  if(!State.checkins.includes(ds)){ State.checkins.push(ds); save('checkins'); }
  // 2. 同步记录当天已办事项快照（仅首次）
  if(!State.checkinItems[ds] || !Array.isArray(State.checkinItems[ds].items)){
    const items = State.tasks
      .filter(t => t.done && t.doneDate===ds)
      .map(t => ({ text:t.text, kind: t.kind==='short'?'week':(t.kind||'long') }));
    State.checkinItems[ds] = { items: items, at: Date.now() };
    save('checkinItems');
  }
}
const hasCheckin = ds => State.checkins.includes(ds);
// 获取某日打卡事项（可能因 3 个月清理返回空数组）
const getCheckinItems = ds => {
  const o = State.checkinItems[ds];
  return (o && Array.isArray(o.items)) ? o.items : [];
};

/* 3 个月清理：超过 90 天的 items 清空但保留 date（打卡状态不动）
 * 运行时机：① 启动时（紧跟工具函数定义后立即调用）② 每次调用 recordCheckin 前
 */
function pruneOldCheckinItems(){
  const today = new Date(todayStr()+'T00:00:00');
  let dirty = false;
  Object.keys(State.checkinItems).forEach(ds=>{
    const d = new Date(ds+'T00:00:00');
    const diff = Math.floor((today - d)/86400000);
    if(diff > 90){
      const o = State.checkinItems[ds];
      if(o && Array.isArray(o.items) && o.items.length>0){
        State.checkinItems[ds] = { items: [], at: o.at || 0, pruned: true };
        dirty = true;
      }
    }
  });
  if(dirty) save('checkinItems');
}

/* ----------------------------- 工具函数 ----------------------------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pad = n => (n<10?'0':'')+n;
const todayStr = () => { const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
const nowStr  = () => { const d=new Date(); return todayStr()+' '+pad(d.getHours())+':'+pad(d.getMinutes()); };
// 启动时清理 3 个月前打卡事项（仅清 items，保留 date）
pruneOldCheckinItems();
const monthStr= () => todayStr().slice(0,7);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dayOfMonth = () => new Date().getDate();
const rand = arr => arr[Math.floor(Math.random()*arr.length)];
const fmt = n => '¥' + (Math.round(n*100)/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const daysBetween = (a,b) => { const da=new Date(a), db=new Date(b); return Math.floor((db-da)/86400000); };

const round2 = n => Math.round((Number(n)||0)*100)/100;

/* ---- 账本联动工具：默认卡 / 负债卡余额自动增减（不绑卡则不联动） ---- */
function findDefault(kind){ // 'pay' 默认支出卡 | 'income' 默认收入卡
  return State.assets.find(a=> kind==='pay' ? a.isDefaultPay : a.isDefaultIncome) || null;
}
function setDefault(kind, cardId, on){
  State.assets.forEach(x=>{
    if(kind==='pay') x.isDefaultPay    = (x.id===cardId && on);
    else             x.isDefaultIncome = (x.id===cardId && on);
  });
}
function applyTxToAsset(tx, sign){ // sign:+1 记账 / -1 撤销
  if(!tx.accountId) return;
  const a = State.assets.find(x=>x.id===tx.accountId);
  if(!a) return; // 卡已删 → 静默跳过（失败安全）
  const delta = (tx.type==='income' ? tx.amount : -tx.amount) * sign;
  a.balance = Math.round((a.balance + delta)*100)/100;
  a.updated = nowStr();
}
/* 表单里的「归属卡片」值 → 真实卡 id（'__def__' 表示跟随默认卡，'' 表示不绑卡） */
function resolveTxCard(d){
  if(d.accountId === undefined || d.accountId === '__def__'){
    const c = findDefault(d.type==='income' ? 'income' : 'pay');
    return c ? c.id : '';
  }
  return d.accountId || '';
}
/* 金额缩写（日格子空间小）：1234 → 1.2k / 12345 → 1.2w */
function shortNum(n){
  n = Math.abs(n);
  if(n >= 10000) return (Math.round(n/1000)/10) + 'w';
  if(n >= 1000)  return (Math.round(n/100)/10) + 'k';
  return String(Math.round(n));
}
/* 'YYYY-MM-DD' → '周三' */
function dowCN(ds){
  const d = new Date(ds + 'T00:00:00');
  if(isNaN(d.getTime())) return '';
  return '周' + ['日','一','二','三','四','五','六'][d.getDay()];
}

/* ----------------------------- 图标（钝感圆角 + 微阴影） ----------------------------- */
const GLYPHS = {
  greeting:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
  todo:'<rect x="3.5" y="4.5" width="6.5" height="3" rx="1.2"/><rect x="3.5" y="10.5" width="6.5" height="3" rx="1.2"/><rect x="3.5" y="16.5" width="6.5" height="3" rx="1.2"/><path d="M13.5 5.2l1.8 1.8 3-3.2M13.5 11.2l1.8 1.8 3-3.2M13.5 17.2l1.8 1.8 3-3.2"/>',
  notes:'<path d="M4 19.5l3.5-.9L18 8.1a2 2 0 0 0-2.8-2.8L4.9 16 4 19.5z"/><path d="M14.5 7.5l2 2"/>',
  quota:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18"/><circle cx="17" cy="14.8" r="1.6"/>',
  account:'<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ai:'<path d="M12 2.5l2.2 5.6L20 10l-5.8 2.4L12 18l-2.2-5.6L4 10l5.8-1.9z"/>'
};
function icon(name, cls){ return `<span class="${cls||'mi'}">${GLYPHS[name]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+GLYPHS[name]+'</svg>':''}</span>`; }

/* ----------------------------- 导航定义 ----------------------------- */
const NAV = [
  { key:'greeting', label:'今日问候', icon:'greeting' },
  { key:'todo',     label:'今日待办', icon:'todo' },
  { key:'notes',    label:'灵感随记', icon:'notes' },
  { key:'quota',    label:'额度追踪', icon:'quota' },
  { key:'account',  label:'我的账本', icon:'account', children:[
    {key:'accountMonth',  label:'本月账单'},
    {key:'accountYearly', label:'年月概况'},
    {key:'accountAsset',  label:'资产管家'} ]},
  { key:'ai',       label:'AI+',      icon:'ai' }
];

let currentPage = 'greeting';
const filters = {};   // 各页面筛选状态
const batch   = {};   // 各页面批量选择状态 {on, sel:Set}

/* ---- 我的账本 · 各页视图状态（懒初始化，避免加载顺序问题） ---- */
let acctMonthCursor = '';         // 本月账单游标 'YYYY-MM'（空 = 用当月）
let mAccountSubView = 'overview'; // 本月账单视图：'overview' 总览 | 'detail' 详情
let acctJumpDay     = '';         // 总览点格跳详情：定位到该日（渲染后滚动+高亮）
let acctQuickType   = 'expense';  // 快速记一笔：'expense' 支出 | 'income' 收入
/* 顶部 · 原「年月账单」（月账单/年账单切换 + 年度补录） */
let acctBillView       = 'month';    // 'month' 月账单 | 'year' 年账单
let acctBillYearCursor = 0;          // 月账单/年账单查看的年份（0 = 用今年）
/* 底部 · 新「趋势查询」（支出/收入 + 周/月/年 + 折线图 + 排行） */
let acctTrendType         = 'expense';  // 'expense' 支出 | 'income' 收入
let acctTrendView         = 'month';    // 'week' | 'month' | 'year'
let acctTrendYearCursor   = 0;          // 趋势年份游标（0 = 用今年）
let acctTrendMonthCursor  = 0;          // 趋势月份游标 1-12（0 = 用当月）
let acctWeekMon           = '';         // 趋势周游标：该周周一 'YYYY-MM-DD'（空 = 本周）
/* 账本游标工具 */
function acctYM(){ return acctMonthCursor || monthStr(); }
function acctBillYear(){ return acctBillYearCursor || (new Date()).getFullYear(); }
function acctTrendYear(){ return acctTrendYearCursor || (new Date()).getFullYear(); }
function acctTrendMonth(){ return acctTrendMonthCursor || (new Date()).getMonth()+1; }
function acctYear(){ return acctBillYear(); }
function shiftYM(ym, delta){
  const y = parseInt(ym.slice(0,4),10), m = parseInt(ym.slice(5,7),10);
  const d = new Date(y, m-1+delta, 1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
/* 周游标工具（以周一为周首） */
function acctWeekMonday(){
  if(acctWeekMon) return new Date(acctWeekMon+'T00:00:00');
  const t = new Date(); const dw = t.getDay(); const diff = (dw===0? -6 : 1-dw);
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()+diff);
}
function fmtYMD(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
/* 账本任意页刷新（四页共用 ACTIONS，需按当前页重绘） */
function refreshAcct(){
  if(currentPage==='accountQuick')   PAGES.accountQuick();
  else if(currentPage==='accountYearly') PAGES.accountYearly();
  else if(currentPage==='accountAsset')  PAGES.accountAsset();
  else PAGES.accountMonth();
}
let clockTimer = null;
let greetingCache = { date:'', text:'' };

/* 页面渲染注册表 & 动作注册表 */
const PAGES   = {};
const ACTIONS = { _all:{} };

/* =============================================================================
 * 全局 UI：toast / 弹窗 / 确认
 * =========================================================================== */
function toast(msg, type){
  const root = $('#toastRoot');
  const t = document.createElement('div');
  t.className = 'toast' + (type? ' '+type : '');
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 2200);
}

function openModal(html){
  $('#modalRoot').innerHTML = '<div class="modal">'+html+'</div>';
  $('#modalRoot').classList.add('show');
  $('#overlay').classList.add('show');
}
function closeModal(){
  $('#modalRoot').classList.remove('show');
  $('#modalRoot').innerHTML = '';
  $('#overlay').classList.remove('show');
}
$('#overlay').addEventListener('click', ()=>{ /* 仅遮罩点击不关闭密码/重要弹窗由各自控制，这里默认关闭通用弹窗 */ if(!$('#modalRoot').dataset.lock) closeModal(); });

/* 通用表单弹窗：fields=[{key,label,type,value,placeholder,options}] */
function formModal(title, fields, onOk, opts){
  opts = opts || {};
  let body = '<h3>'+esc(title)+'</h3>';
  fields.forEach(f=>{
    body += '<div class="field">';
    body += '<label>'+esc(f.label)+'</label>';
    if(f.type==='select'){
      body += '<select class="select" data-k="'+f.key+'">'+ f.options.map(o=>'<option value="'+esc(o.value)+'"'+(o.value===f.value?' selected':'')+'>'+esc(o.text)+'</option>').join('') +'</select>';
    } else if(f.type==='textarea'){
      body += '<textarea class="input" data-k="'+f.key+'" rows="3" placeholder="'+esc(f.placeholder||'')+'">'+esc(f.value||'')+'</textarea>';
    } else {
      body += '<input class="input" data-k="'+f.key+'" type="'+(f.type||'text')+'" value="'+esc(f.value||'')+'" placeholder="'+esc(f.placeholder||'')+'">';
    }
    body += '</div>';
  });
  body += '<div class="modal-actions"><button class="btn" data-x="cancel">取消</button><button class="btn btn-primary" data-x="ok">'+ (opts.okText||'确定') +'</button></div>';
  openModal(body);
  $('#modalRoot').querySelector('[data-x="cancel"]').onclick = closeModal;
  $('#modalRoot').querySelector('[data-x="ok"]').onclick = ()=>{
    const data = {};
    $('#modalRoot').querySelectorAll('[data-k]').forEach(el=> data[el.dataset.k] = el.value.trim());
    const err = opts.validate ? opts.validate(data) : null;
    if(err){ toast(err,'bad'); return; }
    /* 如果 onOk 返回 false，保留弹窗不自动关闭（用于回调里 close+open 重开弹窗的场景） */
    const keepOpen = onOk(data) === false;
    if(!keepOpen) closeModal();
  };
}

/* 二次确认弹窗（防误删） */
function confirmDialog(title, message, onYes, okText){
  const html = '<div class="confirm"><div class="c-ic">⚠️</div><h3 style="margin-bottom:6px">'+esc(title)+'</h3><p>'+esc(message)+'</p>'+
    '<div class="modal-actions"><button class="btn" data-x="no">取消</button><button class="btn btn-danger" data-x="yes">'+(okText||'确认删除')+'</button></div></div>';
  openModal(html);
  $('#modalRoot').dataset.lock = '1';
  $('#modalRoot').querySelector('[data-x="no"]').onclick = ()=>{ delete $('#modalRoot').dataset.lock; closeModal(); };
  $('#modalRoot').querySelector('[data-x="yes"]').onclick = ()=>{ delete $('#modalRoot').dataset.lock; closeModal(); onYes(); };
}

/* =============================================================================
 * 启动
 * =========================================================================== */
function init(){
  renderNav();
  applyTheme();
  updateAvatar();
  checkExportReminder();
  dailyReset();
  $('#hamburger').addEventListener('click', toggleDrawer);
  $('#overlay').addEventListener('click', (e)=>{
    // 如果点击的是 sidebar 内部的元素（菜单项等），不关闭抽屉（移动端兼容）
    if(e.target.closest('#sidebar')) return;
    $('#sidebar').classList.remove('open');
    if(!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show');
  });
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#userChip').addEventListener('click', openAvatarModal);
  $('#exportBtn').addEventListener('click', exportData);
  $('#importBtn').addEventListener('click', ()=> $('#importInput').click());
  $('#importInput').addEventListener('change', importData);
  $('#avatarInput').addEventListener('change', handleAvatarUpload);
  $('#content').addEventListener('click', onContentClick);
  goto('greeting');
}

/* ----------------------------- 导航渲染 ----------------------------- */
function renderNav(){
  let html = '';
  NAV.forEach(n=>{
    html += `<div class="nav-item" data-page="${n.key}">${icon(n.icon)}<span>${n.label}</span></div>`;
    if(n.children) html += '<div class="subnav">'+ n.children.map(c=>
      `<div class="subnav-item" data-page="${c.key}">${esc(c.label)}</div>`).join('') +'</div>';
  });
  $('#nav').innerHTML = html;
  $$('#nav .nav-item').forEach(el=>{
    el.addEventListener('click', (e)=> { e.stopPropagation(); goto(el.dataset.page); });
  });
  $$('#nav .subnav-item').forEach(el=>{
    el.addEventListener('click', (e)=> { e.stopPropagation(); goto(el.dataset.page); });
  });
}

function navLabel(key){
  for(const n of NAV){
    if(n.key===key) return n.label;
    if(n.children) for(const c of n.children) if(c.key===key) return c.label;
  }
  return '';
}
function goto(key){
  // 父项【我的账本】有 children，但默认渲染【快速记一笔】而非首个子项【本月账单】
  const navItem = NAV.find(n=>n.key===key);
  if(navItem && navItem.children){
    if(key==='account'){
      currentPage = 'accountQuick';
      $$('#nav .nav-item').forEach(el=>{
        el.classList.toggle('active', el.dataset.page==='account');
        el.classList.toggle('open', el.dataset.page==='account');
      });
      $$('#nav .subnav-item').forEach(el=> el.classList.remove('active'));
      $('#pageTitle').textContent = '我的账本';
      if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
      $('#sidebar').classList.remove('open');
      if(!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show');
      openPage('accountQuick');
      return;
    }
    key = navItem.children[0].key;
  }
  currentPage = key;
  const parentKey = (NAV.find(n=>n.children && n.children.some(c=>c.key===key))||{}).key;
  $$('#nav .nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.page===key || el.dataset.page===parentKey);
    el.classList.toggle('open', el.dataset.page===parentKey);
  });
  $$('#nav .subnav-item').forEach(el=> el.classList.toggle('active', el.dataset.page===key));
  $('#pageTitle').textContent = navLabel(key) || (NAV.find(n=>n.key===key)||{}).label || '';
  if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
  $('.sidebar') && $('#sidebar').classList.remove('open');
  if(!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show');
  openPage(key);
}

/* 打开页（含密码守卫） */
function openPage(key){
  const needPwd = (key==='quota' && State.settings.quotaPwd) || (key.startsWith('account') && State.settings.accountPwd);
  if(needPwd){
    promptPassword(key, ()=> renderPage(key));
  } else {
    renderPage(key);
  }
}

function renderPage(key){
  (PAGES[key] || PAGES.greeting)();
  $('#content').scrollTop = 0;
}

/* ----------------------------- 主题 / 头像 ----------------------------- */
function applyTheme(){
  document.body.classList.toggle('dark', State.settings.theme==='dark');
}
function toggleTheme(){
  State.settings.theme = State.settings.theme==='dark' ? 'light' : 'dark';
  saveSettings(); applyTheme(); toast('已切换为'+(State.settings.theme==='dark'?'深色':'浅色')+'模式');
}
function updateAvatar(){
  const box = $('#avatarBox');
  const a = State.settings.avatar;
  if(!a){ box.textContent = '🙂'; }
  else if(a.startsWith('data:')){ box.innerHTML = '<img src="'+a+'">'; }
  else { box.textContent = a; }
}
function openAvatarModal(){
  const presets = ['🙂','😎','🐱','🐰','🦊','🐼','🌟','🌈','🍀','🔥','💡','🐬'];
  let body = '<h3>更换头像</h3><div class="field"><label>选择一个表情</label><div class="quick-grid">';
  body += presets.map(p=>'<div class="quick" data-av="'+p+'"><span style="font-size:22px">'+p+'</span></div>').join('');
  body += '</div></div>';
  body += '<div class="field"><label>或上传图片</label><button class="btn btn-primary" data-x="upload" style="width:100%;justify-content:center">从设备选择图片</button></div>';
  body += '<div class="modal-actions"><button class="btn" data-x="cancel">完成</button></div>';
  openModal(body);
  $('#modalRoot').querySelector('[data-x="cancel"]').onclick = closeModal;
  $('#modalRoot').querySelector('[data-x="upload"]').onclick = ()=> $('#avatarInput').click();
  $$('#modalRoot [data-av]').forEach(el=> el.onclick = ()=>{
    State.settings.avatar = el.dataset.av; saveSettings(); updateAvatar(); toast('头像已更新');
  });
}
function handleAvatarUpload(e){
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = ()=>{ State.settings.avatar = r.result; saveSettings(); updateAvatar(); toast('头像已更新'); closeModal(); };
  r.readAsDataURL(file);
  e.target.value = '';
}

/* ----------------------------- 密码守卫 ----------------------------- */
function promptPassword(key, onOk){
  const title = key==='quota' ? '额度追踪' : '我的账本';
  const html = '<h3>🔐 '+esc(title)+'（已加密）</h3>'+
    '<div class="field"><label>请输入打开密码</label><input class="input" id="pwdInput" type="password" placeholder="输入密码"></div>'+
    '<div class="modal-actions"><button class="btn" data-x="cancel">取消</button><button class="btn btn-primary" data-x="ok">进入</button></div>';
  openModal(html);
  $('#modalRoot').dataset.lock = '1';
  const input = $('#pwdInput');
  setTimeout(()=>input.focus(), 50);
  const tryOk = ()=>{
    const v = input.value;
    const stored = key==='quota' ? State.settings.quotaPwd : State.settings.accountPwd;
    if(v === stored){ delete $('#modalRoot').dataset.lock; closeModal(); onOk(); }
    else { toast('密码错误','bad'); input.value=''; input.focus(); }
  };
  $('#modalRoot').querySelector('[data-x="ok"]').onclick = tryOk;
  $('#modalRoot').querySelector('[data-x="cancel"]').onclick = ()=>{ delete $('#modalRoot').dataset.lock; closeModal(); goto('greeting'); };
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') tryOk(); });
}
function openPwdSettings(key){
  const cur = key==='quota' ? State.settings.quotaPwd : State.settings.accountPwd;
  const title = key==='quota' ? '额度追踪' : '我的账本';
  formModal('🔐 '+title+' 密码设置', [
    { key:'mode', label:'操作', type:'select', value: cur?'change':'set',
      options:[ {value:'set',text: cur?'修改密码':'设置密码'}, {value:'clear',text:'清除密码（不再加密）'} ] },
    { key:'old', label:'当前密码（如已设置）', type:'password', placeholder:'留空表示未设置' },
    { key:'pwd', label:'新密码', type:'password', placeholder:'输入新密码' },
    { key:'pwd2', label:'确认新密码', type:'password', placeholder:'再次输入' }
  ], (d)=>{
    if(cur && d.old !== cur){ toast('当前密码不正确','bad'); return; }
    const back = PAGES[key] ? key : currentPage;   // 'account' 已拆成三个二级页，回到当前页
    if(d.mode==='clear'){ setPwd(key,''); toast('已清除密码'); renderPage(back); return; }
    if(d.pwd.length < 4){ toast('密码至少4位','bad'); return; }
    if(d.pwd !== d.pwd2){ toast('两次输入不一致','bad'); return; }
    setPwd(key, d.pwd); toast('密码已保存'); renderPage(back);
  });
}
function setPwd(key, val){
  if(key==='quota') State.settings.quotaPwd = val; else State.settings.accountPwd = val;
  saveSettings();
}

/* ----------------------------- 每日重置 ----------------------------- */
function dailyReset(){
  const t = todayStr();
  if(State.settings._lastDay !== t){
    let changed = false;
    State.tasks.forEach(x=>{ if(x.doneDate !== t){ x.done = false; changed = true; } });
    // 过期任务清理（按自然日，非精确168h）：临时=仅当天；一周=当天起7日内（第8天自动取消）；旧'short'兼容按一周；长期永久
    const base = new Date(t+'T00:00:00');
    const kept = State.tasks.filter(x=>{
      const k = x.kind==='short' ? 'week' : (x.kind||'long');
      if(k==='temp') return x.createdDate===t;
      if(k==='week'){ const diff = Math.round((base - new Date(x.createdDate+'T00:00:00'))/86400000); return diff>=0 && diff<7; }
      return true; // long 永久
    });
    if(kept.length !== State.tasks.length){ State.tasks = kept; changed = true; }
    if(changed) save('tasks');
    State.settings._lastDay = t;
    saveSettings();
  }
  if(State.rec.date !== t){
    State.rec = { date:t, movie:rand(CONFIG.movies), tv:rand(CONFIG.tvs), book:rand(CONFIG.books) };
    save('rec');
  }
  // 固定收支：检查今日是否需要入账
  const added = addRecurringToday(t);
  if(added>0) toast('已自动入账 '+added+' 笔固定收支','good');
}

/* ----------------------------- 导出 / 导入 / 红点 ----------------------------- */
function checkExportReminder(){
  const last = State.settings.lastExport;
  if(!last){ State.settings.lastExport = todayStr(); saveSettings(); return; }
  if(daysBetween(last, todayStr()) >= 15){
    $('#exportDot').hidden = false;
    toast('距离上次导出已超 15 天，记得备份数据 💾','bad');
  } else {
    $('#exportDot').hidden = true;
  }
}
function exportData(){
  const data = {
    _app:'日富一日·钱途光明', _exportedAt: nowStr(),
    tasks:State.tasks, notes:State.notes, quotas:State.quotas,
    accounts:State.accounts, assets:State.assets, rec:State.rec, settings:State.settings,
    budgets:State.budgets, recurring:State.recurring,
    checkins:State.checkins, checkinItems:State.checkinItems
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '钱途光明备份_'+todayStr()+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  State.settings.lastExport = todayStr(); saveSettings();
  $('#exportDot').hidden = true;
  toast('数据已导出','good');
}
function importData(e){
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      confirmDialog('导入数据', '导入将覆盖当前所有本地数据，确定继续吗？', ()=>{
        State.tasks    = d.tasks    || [];
        State.notes    = d.notes    || [];
        State.quotas   = d.quotas   || [];
        State.accounts = d.accounts || [];
        State.assets   = d.assets   || [];
        State.rec      = d.rec      || State.rec;
        State.settings = Object.assign(State.settings, d.settings || {});
        if(d.budgets)      State.budgets      = d.budgets;
        if(d.recurring)    State.recurring    = d.recurring;
        if(d.checkins)     State.checkins     = d.checkins;
        if(d.checkinItems) State.checkinItems = d.checkinItems;
        save('tasks'); save('notes'); save('quotas'); save('accounts'); save('assets'); save('rec'); saveSettings();
        save('budgets'); save('recurring'); save('checkins'); save('checkinItems');
        updateAvatar(); applyTheme(); checkExportReminder();
        toast('导入成功','good'); renderPage(currentPage);
      });
    }catch(err){ toast('文件解析失败','bad'); }
  };
  r.readAsText(file);
  e.target.value = '';
}

/* =============================================================================
 * 交互路由（事件委托）
 * =========================================================================== */
function onContentClick(e){
  if(window.__justDragged){ window.__justDragged = false; return; } // 拖拽松手后的 click 忽略
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;
  const page = currentPage;
  (ACTIONS[page] && ACTIONS[page][a] ? ACTIONS[page][a] : (ACTIONS._all[a]||function(){}))(id, el);
}

/* ---- 任务拖拽：同类型内自由重排（PointerEvent 兼容手机） ---- */
let __drag = null;
function bindTodoDrag(){
  $$('#content .drag-handle').forEach(h=>{
    h.addEventListener('pointerdown', e=>{
      const item = h.closest('.item');
      if(!item || !item.dataset.id) return;
      e.preventDefault();
      __drag = { item, kind:item.dataset.kind, sx:e.clientX, sy:e.clientY, moved:false };
      window.addEventListener('pointermove', __onDragMove);
      window.addEventListener('pointerup', __onDragUp);
    });
  });
}
function __onDragMove(e){
  if(!__drag) return;
  const dx = Math.abs(e.clientX-__drag.sx), dy = Math.abs(e.clientY-__drag.sy);
  if(!__drag.moved){ if(dx+dy < 6) return; __drag.moved = true; __drag.item.classList.add('dragging'); }
  const sibs = [...$$( '#content .item[data-kind="'+__drag.kind+'"]' )].filter(x=> x!==__drag.item);
  let target = null;
  for(const s of sibs){ const r = s.getBoundingClientRect(); if(e.clientY < r.top + r.height/2){ target = s; break; } }
  const parent = __drag.item.parentNode;
  if(target) parent.insertBefore(__drag.item, target); else parent.appendChild(__drag.item);
}
function __onDragUp(){
  if(!__drag) return;
  window.removeEventListener('pointermove', __onDragMove);
  window.removeEventListener('pointerup', __onDragUp);
  if(__drag.moved){
    __drag.item.classList.remove('dragging');
    const ids = [...$$( '#content .item[data-kind="'+__drag.kind+'"]' )].map(x=> x.dataset.id);
    const orderMap = {}; ids.forEach((id, idx)=> orderMap[id] = idx);
    State.tasks.forEach(t=>{ if((t.kind==='short'?'week':(t.kind||'long'))===__drag.kind){ t.order = orderMap[t.id]; } });
    save('tasks');
    window.__justDragged = true;
    PAGES.todo();
  }
  __drag = null;
}

/* ---- 额度拖拽：整行自由重排（PointerEvent 兼容手机，不分 kind 桶） ---- */
let __qDrag = null;
function bindQuotaDrag(){
  $$('#content .quota-drag-handle').forEach(h=>{
    h.addEventListener('pointerdown', e=>{
      const item = h.closest('.quota-item');
      if(!item || !item.dataset.id) return;
      e.preventDefault();
      __qDrag = { item, sx:e.clientX, sy:e.clientY, moved:false };
      window.addEventListener('pointermove', __onQDragMove);
      window.addEventListener('pointerup', __onQDragUp);
    });
  });
}
function __onQDragMove(e){
  if(!__qDrag) return;
  const dx = Math.abs(e.clientX-__qDrag.sx), dy = Math.abs(e.clientY-__qDrag.sy);
  if(!__qDrag.moved){ if(dx+dy < 6) return; __qDrag.moved = true; __qDrag.item.classList.add('dragging'); }
  const sibs = [...$$( '#content .quota-item' )].filter(x=> x!==__qDrag.item);
  let target = null;
  for(const s of sibs){ const r = s.getBoundingClientRect(); if(e.clientY < r.top + r.height/2){ target = s; break; } }
  const parent = __qDrag.item.parentNode;
  if(target) parent.insertBefore(__qDrag.item, target); else parent.appendChild(__qDrag.item);
}
function __onQDragUp(){
  if(!__qDrag) return;
  window.removeEventListener('pointermove', __onQDragMove);
  window.removeEventListener('pointerup', __onQDragUp);
  if(__qDrag.moved){
    __qDrag.item.classList.remove('dragging');
    const ids = [...$$( '#content .quota-item' )].map(x=> x.dataset.id);
    const orderMap = {}; ids.forEach((id, idx)=> orderMap[id] = idx);
    State.quotas.sort((a,b)=> (orderMap[a.id]??1e9) - (orderMap[b.id]??1e9));
    save('quotas');
    window.__justDragged = true;
    PAGES.quota();
  }
  __qDrag = null;
}

/* 通用：批量选择切换 */
function toggleBatch(page){
  if(!batch[page]) batch[page] = { on:false, sel:new Set() };
  batch[page].on = !batch[page].on;
  if(!batch[page].on) batch[page].sel.clear();
  renderPage(PAGES[page] ? page : currentPage);   // 账本共用 batch key 'account'，需按当前二级页重绘
}
function toggleSel(page, id){
  if(!batch[page]) batch[page] = { on:false, sel:new Set() };
  if(batch[page].sel.has(id)) batch[page].sel.delete(id); else batch[page].sel.add(id);
  renderPage(PAGES[page] ? page : currentPage);
}

/* =============================================================================
 * 页面 0：今日问候（句子在上 · 时间单独一行显眼 · 年月日周几一行）
 * =========================================================================== */
function getGreeting(){
  const t = todayStr();
  if(greetingCache.date !== t){ greetingCache = { date:t, text:'' }; }
  if(!greetingCache.text){
    greetingCache.text = (dayOfMonth()%2===1) ? rand(CONFIG.enQuotes) : rand(CONFIG.cnQuotes);
  }
  return greetingCache;
}
PAGES.greeting = function(){
  const g = getGreeting();
  const d = new Date();
  const week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()];
  const dateStr = d.getFullYear()+'年'+pad(d.getMonth()+1)+'月'+pad(d.getDate())+'日  '+week;
  $('#content').innerHTML =
    '<div class="page"><div class="card greet-card">'+
      /* 左上引号装饰 */
      '<div class="g-quote-mark">"</div>'+
      /* 句子 */
      '<div class="g-text">'+esc(g.text)+'</div>'+
      /* 时间：单独一行，大字渐变 */
      '<div class="clock" id="clock">--:--:--</div>'+
      /* 年月日+周几：小字浅灰 */
      '<div class="date-line" id="dateline">'+dateStr+'</div>'+
      /* 换一句按钮 */
      '<button class="btn btn-primary g-refresh" data-action="reGreeting">换一句</button>'+
    '</div></div>';
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
};
function updateClock(){
  const el = $('#clock'); if(!el) return;
  const d = new Date();
  el.textContent = pad(d.getHours())+' : '+pad(d.getMinutes())+' : '+pad(d.getSeconds());
}

ACTIONS.greeting = {
  reGreeting(){ greetingCache.text=''; PAGES.greeting(); }
};

/* =============================================================================
 * 页面 1：今日待办（参照截图：日期头 · 打卡统计 · 进度条 · 底部输入栏 · 本周打卡日历）
 * =========================================================================== */
function getVitalityStats(){
  // 当前连续打卡天数（基于持久化的打卡日志 dailyReset 不影响）
  let streak = 0;
  for(let i=0; i<365; i++){
    const dd = new Date(); dd.setDate(dd.getDate()-i);
    const ds = dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate());
    if(hasCheckin(ds)) streak++; else break;
  }
  // 本月已活跃天数（按当月 1..lastDay 统计打卡日志）
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const lastDay = new Date(y, m+1, 0).getDate();
  let monthDone = 0;
  for(let d=1; d<=lastDay; d++){
    const ds = y+'-'+pad(m+1)+'-'+pad(d);
    if(hasCheckin(ds)) monthDone++;
  }
  return {streak, monthDone};
}
PAGES.todo = function(){
  if(!filters.todo) filters.todo = { q:'', status:'all', kind:'all' };
  const f = filters.todo;
  // 渲染前再清一次过期任务（兜底：跨天未 reload 时 dailyReset 可能未跑）
  const t0 = todayStr(); const base0 = new Date(t0+'T00:00:00');
  const kept0 = State.tasks.filter(x=>{
    const k = x.kind==='short' ? 'week' : (x.kind||'long');
    if(k==='temp') return x.createdDate===t0;
    if(k==='week'){ const diff = Math.round((base0 - new Date(x.createdDate+'T00:00:00'))/86400000); return diff>=0 && diff<7; }
    return true;
  });
  if(kept0.length !== State.tasks.length){ State.tasks = kept0; save('tasks'); }
  let list = State.tasks.slice();
  if(f.status==='done') list = list.filter(t=>t.done && t.doneDate===todayStr());
  if(f.status==='undone') list = list.filter(t=>!(t.done && t.doneDate===todayStr()));
  if(f.q) list = list.filter(t=> t.text.toLowerCase().includes(f.q.toLowerCase()));
  if(f.kind==='long')  list = list.filter(t=> (t.kind||'long')==='long');
  if(f.kind==='short') list = list.filter(t=> (t.kind||'long')==='short');
  const b = batch.todo || {on:false,sel:new Set()};
  const doneCount = State.tasks.filter(t=>t.done && t.doneDate===todayStr()).length;
  const totalCount = State.tasks.length;
  const pct = totalCount>0 ? Math.round(doneCount/totalCount*100) : 0;
  const vs = getVitalityStats();
  const d = new Date();
  const week = ['日','一','二','三','四','五','六'];
  const dateStr = pad(d.getMonth()+1)+'-'+pad(d.getDate())+' 周'+week[d.getDay()];
  const nowDow = d.getDay();

  let html = '<div class="page">';
  /* ---- 页面标题 + 批量操作工具栏（批量时显示删除选中/标记完成/退出，普通时仅显示批量入口） ---- */
  html += '<div class="todo-header"><h2 class="todo-title">今日清单</h2><div class="todo-header-acts">';
  if(b.on){
    html += '<button class="btn btn-danger btn-sm" data-action="batchDel">🗑 删除选中 ('+b.sel.size+')</button>';
    html += '<button class="btn btn-sm" data-action="batchDone">✓ 标记完成 ('+b.sel.size+')</button>';
    html += '<button class="btn btn-ghost btn-sm" data-action="batchToggle">退出批量</button>';
  } else {
    html += '<button class="btn btn-ghost btn-sm" data-action="batchToggle">批量操作</button>';
  }
  html += '</div></div>';

  /* ---- 日期 + 打卡统计条 ---- */
  html += '<div class="todo-date">'+dateStr+'</div>';
  html += '<div class="todo-streak-bar">'+
    '<span class="ts-icon">🔥</span>'+
    '<span>已连续打卡 <b>'+vs.streak+'</b> 天</span>'+
    '<span class="ts-sep">|</span>'+
    '<span>本月已活跃 <b>'+vs.monthDone+'</b> 天</span>'+
    '</div>';

  /* ---- 任务列表（按 临时→一周→长期 顺序出，组内可拖拽重排；不再显示分组小标题，颜色/徽章已自带区分） ---- */
  const GROUPS = [
    {key:'temp'}, {key:'week'}, {key:'long'}
  ];
  const normKind = t => (t.kind==='short') ? 'week' : (t.kind||'long');
  const KTAG = { long:'长期（永久保留）', week:'一周（7天有效，第8天自动取消）', temp:'临时（仅当天，次日消失）' };
  html += '<div class="list todo-list">';
  if(list.length===0){
    html += '<div class="empty todo-empty"><div class="big">📝</div><p>还没有任务，添加一个吧～</p></div>';
  } else {
    GROUPS.forEach(g=>{
      const items = list.filter(t=> normKind(t)===g.key ).sort((a,b)=> (a.order??1e9)-(b.order??1e9));
      if(items.length===0) return;
      items.forEach(t=>{
        const done = t.done && t.doneDate===todayStr();
        const k = normKind(t);
        const kcls = k==='long'?'item-long':(k==='week'?'item-week':'item-temp');
        const klabel = k==='long'?'长期':(k==='week'?'一周':'临时');
        // 重复周期徽章
        const rep = t.repeat||'none';
        const repBadge = rep==='daily' ? '<span class="meta-badge rep-daily" title="每天重复">🔁 日</span>'
                       : rep==='weekly' ? '<span class="meta-badge rep-weekly" title="每周重复">🔁 周</span>'
                       : rep==='monthly' ? '<span class="meta-badge rep-monthly" title="每月重复">🔁 月</span>' : '';
        // 截止时间 + 逾期判断（仅今天有效，过期即逾期）
        let dueBadge = '';
        let overdue = false;
        if(t.dueTime && /^\d{2}:\d{2}$/.test(t.dueTime)){
          const nowM = nowStr(); // 'YYYY-MM-DD HH:MM:SS'
          const todayTime = nowM.slice(0,10) + ' ' + t.dueTime + ':00';
          if(!done && nowM > todayTime) overdue = true;
          dueBadge = '<span class="meta-badge '+(overdue?'due-overdue':'due-ok')+'" title="截止时间">'+(overdue?'⏰ 已逾期 ':'⏰ ')+t.dueTime+'</span>';
        }
        html += '<div class="item '+kcls+(done?' done':'')+(overdue?' overdue':'')+'" data-id="'+t.id+'" data-kind="'+k+'">';
        if(b.on) html += '<div class="check'+(b.sel.has(t.id)?' on':'')+'" data-action="sel" data-id="'+t.id+'">'+(b.sel.has(t.id)?'✓':'')+'</div>';
        if(!b.on) html += '<div class="drag-handle" title="拖动排序">⠿</div>';
        if(!b.on) html += '<div class="check'+(done?' on':'')+'" data-action="toggle" data-id="'+t.id+'">'+(done?'✓':'')+'</div>';
        html += '<div class="body"><div class="title">'+esc(t.text)+'<span class="kind-badge '+k+'">'+klabel+'</span>'+repBadge+dueBadge+'</div></div>';
        if(!b.on) html += '<button class="btn btn-sm btn-ghost" data-action="editTask" data-id="'+t.id+'">编辑</button><button class="btn btn-danger btn-sm" data-action="delTask" data-id="'+t.id+'">删除</button>';
        html += '</div>';
      });
    });
  }
  html += '</div>';

  /* ---- 底部固定输入栏 + 规则说明 ---- */
  html += '<div class="todo-input-bar">'+
    '<div class="kind-toggle">'+
      '<button class="kt-btn'+(quickKind==='long'?' on':'')+'" data-action="setKind" data-kind="long">长期</button>'+
      '<button class="kt-btn'+(quickKind==='week'?' on':'')+'" data-action="setKind" data-kind="week">一周</button>'+
      '<button class="kt-btn'+(quickKind==='temp'?' on':'')+'" data-action="setKind" data-kind="temp">临时</button>'+
    '</div>'+
    '<input class="input todo-input" id="todoInput" placeholder="任务内容（当前：'+(quickKind==='long'?'长期=永久保留':(quickKind==='week'?'一周=7天后自动取消':'临时=次日消失'))+'）">'+
    '<button class="btn btn-primary todo-add-btn" data-action="quickAddTask">＋</button>'+
    '</div>';

  /* ---- 本月活力图（年月合并到卡片标题行，节省垂直空间） ---- */
  html += '<div class="card"><div class="card-title">📅 本月活力图'+
    '<span class="mc-title-inline">'+d.getFullYear()+' 年 '+pad(d.getMonth()+1)+' 月</span>'+
    '<span class="spacer" style="flex:1"></span>'+
    '<span class="mc-stat-inline">🔥 '+vs.streak+' 天 · ✨ '+vs.monthDone+' 天</span>'+
    '</div>';
  html += '<div class="mc-weekrow"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>';
  html += '<div class="mc-grid">';
  const todayDStr = todayStr();
  const monthLast = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const firstDow = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0=Sun..6=Sat
  for(let i=0; i<firstDow; i++) html += '<div class="mc-day mc-blank"></div>';
  for(let day=1; day<=monthLast; day++){
    const ds = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(day);
    const isToday = ds===todayDStr;
    const isFuture = ds>todayDStr;
    const checked = hasCheckin(ds);
    let cls = 'mc-day';
    if(isToday) cls += ' mc-today';
    else if(checked) cls += ' mc-done';
    else if(isFuture) cls += ' mc-future';
    else cls += ' mc-empty';
    html += '<div class="'+cls+'" data-action="openDay" data-day="'+ds+'">';
    html += '<div class="mc-num">'+day+'</div>';
    if(isToday){ /* 今日格只用紫底高亮区分，不再重复显示文字"今天" */ }
    else if(checked) html += '<div class="mc-tick">✓</div>';
    html += '</div>';
  }
  html += '</div></div>';

  /* （底部搜索筛选栏已删除：批量按钮已迁至顶部 toolbar；用户反馈该区域作用不明确） */

  html += '</div>';
  $('#content').innerHTML = html;
  bindTodoDrag();

  // 快捷添加：回车触发
  const ti = $('#todoInput');
  if(ti){ ti.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=ti.value.trim(); if(v){ ACTIONS.todo.quickAdd(v); ti.value=''; }} }); }
};

ACTIONS.todo = {
  quickAdd(text){ if(!text){ toast('请输入内容','bad'); return; }
    State.tasks.push({id:uid(), text:text, done:false, doneDate:'', kind:quickKind, createdDate:todayStr()});
    save('tasks'); toast(quickKind==='long'?'已添加·长期（永久保留）':(quickKind==='week'?'已添加·一周（7天后自动取消）':'已添加·临时（次日消失）'),'good'); PAGES.todo(); },
  setKind(_id, el){ quickKind = el.dataset.kind;
    $$('#content .kt-btn').forEach(b=> b.classList.toggle('on', b.dataset.kind===quickKind));
    const ti = $('#todoInput');
    if(ti){ ti.placeholder = '任务内容（当前：'+(quickKind==='long'?'长期=永久保留':(quickKind==='week'?'一周=7天后自动取消':'临时=次日消失'))+'）'; } },
  quickAddTask(_id, _el){
    const ti = $('#todoInput');
    const text = (ti?ti.value:'').trim();
    if(!text){ toast('请输入任务内容','bad'); ti && ti.focus(); return; }
    State.tasks.push({id:uid(), text:text, done:false, doneDate:'', kind:quickKind, createdDate:todayStr()});
    save('tasks');
    if(ti) ti.value='';
    toast(quickKind==='long'?'已添加·长期（永久保留）':(quickKind==='week'?'已添加·一周（7天后自动取消）':'已添加·临时（次日消失）'),'good');
    PAGES.todo();
  },
  addTask(){ formModal('新增事项', [
    {key:'text',label:'事项内容',placeholder:'例如：晨跑30分钟'},
    {key:'kind',label:'任务类型',type:'select',value:'long',options:[
      {value:'long',text:'长期（永久保留，不会自动消失）'},
      {value:'week',text:'一周（当天~第7天有效，第8天自动取消）'},
      {value:'temp',text:'临时（仅当天，次日消失）'}
    ]},
    {key:'repeat',label:'重复周期（⭐必加）',type:'select',value:'none',options:[
      {value:'none',text:'不重复（仅一次）'},
      {value:'daily',text:'每天（完成后自动生成明天的）'},
      {value:'weekly',text:'每周（完成后自动生成下周同一天的）'},
      {value:'monthly',text:'每月（完成后自动生成下月同一天的）'}
    ]},
    {key:'dueTime',label:'截止时间（⭐必加·可选）',type:'time',value:'',placeholder:'不填则不限时'}
  ], d=>{
    if(!d.text){ toast('请输入内容','bad'); return; }
    State.tasks.push({id:uid(), text:d.text, done:false, doneDate:'', kind:d.kind||'long', createdDate:todayStr(), repeat:d.repeat||'none', dueTime:d.dueTime||''});
    save('tasks'); toast('已添加','good'); PAGES.todo();
  }); },
  editTask(id){ const t = State.tasks.find(x=>x.id===id); if(!t) return;
    formModal('编辑事项', [
      {key:'text',label:'事项内容',value:t.text},
      {key:'kind',label:'任务类型',type:'select',value:(t.kind==='short'?'week':(t.kind||'long')),options:[
        {value:'long',text:'长期（永久保留，不会自动消失）'},
        {value:'week',text:'一周（当天~第7天有效，第8天自动取消）'},
        {value:'temp',text:'临时（仅当天，次日消失）'}
      ]},
      {key:'repeat',label:'重复周期',type:'select',value:(t.repeat||'none'),options:[
        {value:'none',text:'不重复（仅一次）'},
        {value:'daily',text:'每天（完成后自动生成明天的）'},
        {value:'weekly',text:'每周（完成后自动生成下周同一天的）'},
        {value:'monthly',text:'每月（完成后自动生成下月同一天的）'}
      ]},
      {key:'dueTime',label:'截止时间（可选）',type:'time',value:(t.dueTime||'')}
    ], d=>{
      if(!d.text){ toast('请输入内容','bad'); return; }
      t.text = d.text; t.kind = d.kind||'long'; t.repeat = d.repeat||'none'; t.dueTime = d.dueTime||'';
      save('tasks'); toast('已更新','good'); PAGES.todo();
    }); },
  delTask(id){ confirmDialog('删除事项', '确定删除该事项吗？此操作不可撤销。', ()=>{
    State.tasks = State.tasks.filter(x=>x.id!==id); save('tasks'); toast('已删除'); PAGES.todo();
  }); },
  toggle(id){ const t = State.tasks.find(x=>x.id===id); if(!t) return;
    if(t.done && t.doneDate===todayStr()){ t.done=false; t.doneDate=''; }
    else {
      t.done=true; t.doneDate=todayStr(); recordCheckin();
      const rep = t.repeat || 'none';
      if(rep !== 'none'){
        const cur = new Date(todayStr()+'T00:00:00');
        let next;
        if(rep === 'daily'){ next = new Date(cur.getTime() + 86400000); }
        else if(rep === 'weekly'){ next = new Date(cur.getTime() + 7*86400000); }
        else if(rep === 'monthly'){
          // 下个月同日（无同日则自动截到下月最后一天：1/31→2/28、3/31→4/30、12/15→次年1/15）
          const targetMonthIdx = (cur.getMonth() + 1) % 12;
          const targetYear = cur.getFullYear() + (cur.getMonth()===11 ? 1 : 0);
          const lastDay = new Date(targetYear, targetMonthIdx + 1, 0).getDate();
          next = new Date(targetYear, targetMonthIdx, Math.min(cur.getDate(), lastDay));
        }
        const nextDs = next.getFullYear()+'-'+pad(next.getMonth()+1)+'-'+pad(next.getDate());
        const dupExists = State.tasks.some(x => x.text===t.text && (x.repeat||'none')===rep && (x.dueTime||'')===(t.dueTime||'') && x.doneDate===nextDs);
        if(!dupExists){
          State.tasks.push({ id:uid(), text:t.text, done:false, doneDate:'', kind:t.kind||'long', createdDate:todayStr(), repeat:rep, dueTime:t.dueTime||'' });
          toast(rep==='daily'?'🌅 已生成明天任务':(rep==='weekly'?'📅 已生成下周任务':'📆 已生成下月任务'), 'good', 1500);
        }
      }
    }
    save('tasks'); PAGES.todo();
  },
  batchToggle(){ toggleBatch('todo'); },
  sel(id){ toggleSel('todo', id); },
  batchDel(){ const b=batch.todo; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 项吗？', ()=>{
      State.tasks = State.tasks.filter(x=>!b.sel.has(x.id)); save('tasks');
      b.sel.clear(); b.on=false; toast('已删除'); PAGES.todo();
    }); },
  batchDone(){ const b=batch.todo; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    State.tasks.forEach(x=>{ if(b.sel.has(x.id)){ x.done=true; x.doneDate=todayStr(); } });
    recordCheckin();
    save('tasks'); toast('已标记完成','good'); PAGES.todo(); },
  resetOrder(){ confirmDialog('恢复默认排序','确定清除当前自定义顺序、恢复「临时 → 一周 → 长期」默认排列吗？', ()=>{
    State.tasks.forEach(t=>{ t.order = undefined; }); save('tasks'); toast('已恢复默认排序','good'); PAGES.todo();
  }); },
  openDay(_id, el){
    const ds = el.dataset.day;
    const wd = ['日','一','二','三','四','五','六'];
    const dt = new Date(ds+'T00:00:00');
    const isToday = ds===todayStr();
    const isFuture = ds>todayStr();
    const checked = hasCheckin(ds);
    const doneList   = State.tasks.filter(t => t.done && t.doneDate===ds);
    const undoneList = State.tasks.filter(t => !t.done || t.doneDate!==ds);
    const dow = wd[dt.getDay()]; const m=dt.getMonth()+1, day=dt.getDate();
    let body = '<h3>'+m+'月'+day+'日 · 周'+dow+'</h3>';
    if(isToday){
      body += '<div class="day-stat">今日已办 <b>'+doneList.length+'</b> 项 · 还剩 <b>'+undoneList.length+'</b> 项</div>';
      body += '<div class="day-section"><div class="day-label">✅ 已办</div>';
      if(doneList.length===0) body += '<div class="day-empty">暂无已完成事项</div>';
      else doneList.forEach(t => body += '<div class="day-row">'+esc(t.text)+'</div>');
      body += '</div>';
      body += '<div class="day-section"><div class="day-label">⏳ 未办</div>';
      if(undoneList.length===0) body += '<div class="day-empty">🎉 今日全部完成</div>';
      else undoneList.forEach(t => body += '<div class="day-row">'+esc(t.text)+'</div>');
      body += '</div>';
    } else if(isFuture){
      body += '<div class="day-stat">🔮 这天尚未到来</div>';
      body += '<div class="day-section"><div class="day-empty">该日尚无任务计划</div></div>';
    } else {
      // 过去
      if(checked){
        const ci = State.checkinItems[ds];
        const isPruned = ci && ci.pruned;
        const items = isPruned ? [] : (ci && Array.isArray(ci.items) ? ci.items : []);
        if(items.length>0){
          body += '<div class="day-stat">🔥 这天已打卡 · 已完成 <b>'+items.length+'</b> 项</div>';
          body += '<div class="day-section"><div class="day-label">✅ 当天已完成</div>';
          items.forEach(it => {
            const kind = it.kind || 'long';
            body += '<div class="day-row day-row-kind-'+kind+'">'+
              '<span class="day-row-text">'+esc(it.text)+'</span>'+
              '<span class="day-row-kind-badge kb-'+kind+'">'+(kind==='long'?'长期':kind==='week'?'一周':'临时')+'</span>'+
              '</div>';
          });
          body += '</div>';
          // 距离今天多少天
          const diff = Math.floor((new Date(todayStr()+'T00:00:00') - new Date(ds+'T00:00:00'))/86400000);
          if(diff > 30){
            body += '<div class="day-tip">⏳ 距今 '+diff+' 天 · 详情保留至 90 天</div>';
          }
        } else {
          body += '<div class="day-stat">🔥 这天已打卡'+(isPruned?' · 具体事项已自动清理（保留 3 个月）':'')+'</div>';
          body += '<div class="day-section"><div class="day-empty">'+
            (isPruned?'详情已清理，如需追记可在「便签」加一条':'历史记录只记日期，不记具体事项（此日打卡在新功能上线前）')+
            '</div></div>';
        }
      } else {
        body += '<div class="day-stat">😴 这天未打卡</div>';
        body += '<div class="day-section"><div class="day-empty">无记录</div></div>';
      }
    }
    body += '<div class="modal-actions"><button class="btn btn-primary" data-x="cancel">关闭</button></div>';
    openModal(body);
    $('#modalRoot').querySelector('[data-x="cancel"]').onclick = closeModal;
  }
};

/* =============================================================================
 * 页面 2：灵感随记（参照截图：大卡片推荐 · 图标+类型+名称+副标题 · 便签区）
 * =========================================================================== */
PAGES.notes = function(){
  if(!filters.notes) filters.notes = { q:'' };
  const f = filters.notes;
  let list = State.notes.slice().sort((a,b)=> b.created - a.created);
  if(f.q) list = list.filter(n=> n.text.toLowerCase().includes(f.q.toLowerCase()));
  const b = batch.notes || {on:false,sel:new Set()};

  let html = '<div class="page">';
  /* ---- 页面标题 ---- */
  html += '<div class="notes-header"><h2>灵感随记</h2></div>';

  /* ---- 今日推荐（大卡片纵向布局） ---- */
  html += '<div class="rec-section">'+
    '<div class="rec-label">✦ 今日推荐</div>';
  // 电影
  html += '<div class="rec-card-big">'+
    '<div class="rcb-icon">🎬</div>'+
    '<div class="rcb-type">电影</div>'+
    '<div class="rcb-name">'+esc(State.rec.movie.n || State.rec.movie)+'</div>'+
    '<div class="rcb-sub">'+esc(State.rec.movie.s || '')+'</div>'+
    '</div>';
  // 电视剧
  html += '<div class="rec-card-big">'+
    '<div class="rcb-icon">📺</div>'+
    '<div class="rcb-type">电视剧</div>'+
    '<div class="rcb-name">'+esc(State.rec.tv.n || State.rec.tv)+'</div>'+
    '<div class="rcb-sub">'+esc(State.rec.tv.s || '')+'</div>'+
    '</div>';
  // 读物
  html += '<div class="rec-card-big">'+
    '<div class="rcb-icon">📖</div>'+
    '<div class="rcb-type">读物</div>'+
    '<div class="rcb-name">'+esc(State.rec.book.n || State.rec.book)+'</div>'+
    '<div class="rcb-sub">'+esc(State.rec.book.s || '')+'</div>'+
    '</div>';
  html += '<button class="btn btn-ghost btn-sm rec-refresh" data-action="recChange">🔄 换一批</button>';
  html += '</div>';

  /* ---- 随手记便签区 ---- */
  html += '<div class="notes-section">'+
    '<div class="notes-head"><span>📝 随手记</span><button class="btn btn-ghost btn-sm" data-action="batchToggle">'+(b.on?'退出批量':'批量操作')+'</button></div>';
  html += '<div class="toolbar" style="margin-bottom:10px">'+
    '<button class="btn btn-primary btn-sm" data-action="addNote">＋ 新增便签</button>'+
    (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中 ('+b.sel.size+')</button>' : '')+
    '</div>';
  html += '<div class="search"><input class="input" id="noteQ" placeholder="搜索便签…" value="'+esc(f.q)+'"></div>';
  html += '<div class="note-grid">';
  if(list.length===0){ html += '<div class="empty" style="grid-column:1/-1"><div class="big">💡</div>还没有便签，记下此刻的灵感吧</div>'; }
  else {
    list.forEach((n,i)=>{
      html += '<div class="note c'+(i%3)+'">';
      if(b.on) html += '<div class="check'+(b.sel.has(n.id)?' on':'')+'" data-action="sel" data-id="'+n.id+'" style="position:absolute;top:10px;right:10px"> '+(b.sel.has(n.id)?'✓':'')+'</div>';
      html += '<div class="n-text">'+esc(n.text)+'</div>'+
              '<div class="n-time">'+n.time+'</div>'+
              (b.on?'':'<div style="margin-top:8px;text-align:right"><button class="btn btn-danger btn-sm" data-action="delNote" data-id="'+n.id+'">删除</button></div>')+
              '</div>';
    });
  }
  html += '</div></div></div>';
  $('#content').innerHTML = html;
  $('#noteQ').addEventListener('input', e=>{ filters.notes.q=e.target.value; PAGES.notes(); const i=$('#noteQ'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } });
};
ACTIONS.notes = {
  recChange(){ State.rec = { date:todayStr(), movie:rand(CONFIG.movies), tv:rand(CONFIG.tvs), book:rand(CONFIG.books) }; save('rec'); toast('已换一批推荐','good'); PAGES.notes(); },
  addNote(){ formModal('新增便签', [{key:'text',label:'内容',type:'textarea',placeholder:'写点什么…'}], d=>{
    if(!d.text){ toast('请输入内容','bad'); return; }
    State.notes.push({id:uid(), text:d.text, time:nowStr(), created:Date.now()});
    save('notes'); toast('已保存','good'); PAGES.notes();
  }); },
  delNote(id){ confirmDialog('删除便签', '确定删除这条随手记吗？', ()=>{
    State.notes = State.notes.filter(x=>x.id!==id); save('notes'); toast('已删除'); PAGES.notes();
  }); },
  batchToggle(){ toggleBatch('notes'); },
  sel(id){ toggleSel('notes', id); },
  batchDel(){ const b=batch.notes; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 条便签吗？', ()=>{
      State.notes = State.notes.filter(x=>!b.sel.has(x.id)); save('notes'); b.sel.clear(); b.on=false; toast('已删除'); PAGES.notes();
    }); }
};

/* =============================================================================
 * 页面 3：额度追踪
 * =========================================================================== */
PAGES.quota = function(){
  if(qDetailId){ const q = State.quotas.find(x=>x.id===qDetailId); if(q) return renderQuotaDetail(q); qDetailId=null; }
  if(!filters.quota) filters.quota = { q:'', _view:'active' };
  const f = filters.quota;
  const view = f._view || 'active';
  let list = State.quotas.slice();
  if(view==='active') list = list.filter(q=> !q.archived);
  else list = list.filter(q=>  q.archived);
  if(f.q) list = list.filter(q=> q.name.toLowerCase().includes(f.q.toLowerCase()));
  const b = batch.quota || {on:false,sel:new Set()};
  const hasPwd = !!State.settings.quotaPwd;
  const archivedCount = State.quotas.filter(q=>q.archived).length;

  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">'+icon('quota')+'额度追踪'+
    '<span class="spacer" style="flex:1"></span>'+
    '<button class="btn btn-sm" data-action="pwdSet" title="密码设置">🔐 '+(hasPwd?'已加密':'未加密')+'</button></div>';
  if(view==='active'){
    html += '<div class="toolbar">'+
      '<button class="btn btn-primary btn-sm" data-action="addQuota">＋ 新增</button>'+
      '<button class="btn btn-sm" data-action="batchToggle">批量</button>'+
      (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中</button>' : '')+
      '<span class="spacer"></span>'+
      '<button class="btn btn-sm'+(archivedCount?' btn-ghost':'')+'" data-action="viewArchivedQuota"'+(archivedCount?'':' disabled')+' title="查看已归档的额度">🗄️ 已归档'+(archivedCount?' ('+archivedCount+')':'')+'</button>'+
      '<button class="btn btn-sm" data-action="resetAll">重置</button>'+
      '</div>';
  } else {
    // 归档视图：禁止批量/消耗/重置，只允许恢复/删除
    html += '<div class="toolbar">'+
      '<button class="btn btn-primary btn-sm" data-action="viewActiveQuota">↩ 返回额度追踪</button>'+
      '<span class="spacer"></span>'+
      '<span class="muted" style="font-size:13px;align-self:center">归档视图 · 共 '+archivedCount+' 项</span>'+
      '</div>';
  }
  html += '<div class="search"><input class="input" id="quotaQ" placeholder="'+(view==='active'?'搜索额度名称…':'在已归档中搜索…')+'" value="'+esc(f.q)+'"></div>';
  html += '<div class="list">';
  if(list.length===0){
    if(view==='active'){
      html += '<div class="empty"><div class="big">🎯</div>还没有额度，新增一个开始追踪吧</div>';
    } else {
      html += '<div class="empty"><div class="big">🗄️</div><p>已归档里是空的</p><p style="color:var(--muted);font-size:13px">把不再需要追踪的额度归档，主页就看不见了。需要时还能在这里恢复</p></div>';
    }
  }
  else {
    list.forEach(q=>{
      const used = Math.min(q.consumed, q.total);
      const pct = q.total>0 ? Math.round(used/q.total*100) : 0;
      const warn = pct>=85;
      const canDrag = (view==='active') && !b.on && !f.q;
      html += '<div class="item quota-item'+(q.archived?' archived':'')+(canDrag?' draggable':'')+'" data-id="'+q.id+'">';
      if(b.on && view==='active') html += '<div class="check'+(b.sel.has(q.id)?' on':'')+'" data-action="sel" data-id="'+q.id+'">'+(b.sel.has(q.id)?'✓':'')+'</div>';
      const openAttr = (b.on || view==='archived') ? '' : ' data-action="openQuotaDetail" data-id="'+q.id+'"';
      const arrow = (b.on || view==='archived') ? '' : '<span class="arrow">›</span>';
      html += '<div class="body"'+openAttr+'>'+
        '<div class="title">'+esc(q.name)+arrow+(q.archived?'<span class="badge badge-archived" style="margin-left:6px">已归档</span>':'')+'</div>'+
        '<div class="sub">已用 '+fmt(q.consumed)+' / 总额 '+fmt(q.total)+' · 剩余 '+fmt(Math.max(q.total-q.consumed,0))+(q.archived&&q.archivedAt?' · 归档于 '+q.archivedAt.slice(0,10):'')+'</div>'+
        '<div class="bar'+(warn?' warn':'')+'" style="margin-top:8px"><i style="width:'+pct+'%"></i></div>';
      if(!b.on){
        if(view==='active'){
          html += '<div class="item-acts">'+
            '<button class="btn btn-sm" data-action="useQuota" data-id="'+q.id+'">记录</button>'+
            '<button class="btn btn-sm" data-action="archiveQuota" data-id="'+q.id+'" title="归档：从主页隐藏，进「已归档」查看">📦 归档</button>'+
            '<button class="btn btn-sm" data-action="delQuota" data-id="'+q.id+'">删除</button>';
          html += '</div>';
        } else {
          // 归档视图：恢复 + 删除（不动 lock 字段，密码设置在 toolbar 里仍然生效）
          html += '<div class="item-acts">'+
            '<button class="btn btn-sm" data-action="unarchiveQuota" data-id="'+q.id+'" title="恢复到主页追踪">♻️ 恢复</button>'+
            '<button class="btn btn-sm" data-action="delQuota" data-id="'+q.id+'">🗑️ 删除</button>'+
            '</div>';
        }
      }
      html += '</div>';
      if(canDrag) html += '<div class="quota-drag-handle" title="拖动排序">⠿</div>';
      html += '</div>';
    });
  }
  html += '</div></div></div>';
  $('#content').innerHTML = html;
  $('#quotaQ').addEventListener('input', e=>{ filters.quota.q=e.target.value; PAGES.quota(); });
  if(!b.on && view==='active') bindQuotaDrag();
};
ACTIONS.quota = {
  pwdSet(){ openPwdSettings('quota'); },
  addQuota(){ formModal('新增额度', [
    {key:'name',label:'额度名称',placeholder:'例如：本月外卖预算'},
    {key:'total',label:'总额度（数值）',type:'number',placeholder:'例如：500'}
  ], d=>{
    const total = parseFloat(d.total);
    if(!d.name){ toast('请输入名称','bad'); return; }
    if(isNaN(total) || total<0){ toast('请输入有效数值','bad'); return; }
    State.quotas.push({id:uid(), name:d.name, total, consumed:0, records:[]});
    save('quotas'); toast('已新增','good'); PAGES.quota();
  }); },
  useQuota(id){ const q = State.quotas.find(x=>x.id===id); if(!q) return;
    formModal('记录消耗 · '+q.name, [
      {key:'amount',label:'消耗金额',type:'number',placeholder:'本次消耗'},
      {key:'note',label:'备注',placeholder:'例如：午餐'}
    ], d=>{
      const amt = parseFloat(d.amount);
      if(isNaN(amt)||amt<=0){ toast('请输入有效金额','bad'); return; }
      q.consumed += amt;
      q.records.push({amount:amt, note:d.note, time:nowStr()});
      save('quotas'); toast('已记录','good'); PAGES.quota();
    }); },
  delQuota(id){ confirmDialog('删除额度', '确定删除该额度吗？相关消耗记录也会清除。', ()=>{
    State.quotas = State.quotas.filter(x=>x.id!==id); save('quotas'); toast('已删除'); PAGES.quota();
  }); },
  resetAll(){
    const b = batch.quota || { on:false, sel:new Set() };
    // 仅作用于「活跃」额度（已归档额度不受重置消耗影响；归档视图也无此按钮）
    if(b.on && b.sel.size===0){ toast('请先选择要重置的额度','bad'); return; }
    const targets = b.on
      ? State.quotas.filter(q => !q.archived && b.sel.has(q.id))
      : State.quotas.filter(q => !q.archived);
    if(targets.length===0){ toast('没有可重置的额度','bad'); return; }
    const names = targets.map(q=>q.name).join('、');
    confirmDialog('重置消耗', '确定将「'+names+'」的已消耗清零吗？', ()=>{
      targets.forEach(q=>{ q.consumed=0; q.records=[]; });
      save('quotas');
      if(b.on){ b.sel.clear(); b.on=false; }
      toast('已重置 '+targets.length+' 个额度','good');
      PAGES.quota();
    });
  },
  batchToggle(){ toggleBatch('quota'); },
  sel(id){ toggleSel('quota', id); },
  batchDel(){ const b=batch.quota; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 个额度吗？', ()=>{
      State.quotas = State.quotas.filter(x=>!b.sel.has(x.id)); save('quotas'); b.sel.clear(); b.on=false; toast('已删除'); PAGES.quota();
    }); },
  viewArchivedQuota(){ filters.quota._view = 'archived'; PAGES.quota(); },
  viewActiveQuota(){ filters.quota._view = 'active'; PAGES.quota(); },
  archiveQuota(id){ const q = State.quotas.find(x=>x.id===id); if(!q) return;
    confirmDialog('归档额度', '确定归档「'+q.name+'」吗？归档后主页不可见，可在「已归档」里恢复。', ()=>{
      q.archived = true; q.archivedAt = nowStr();
      save('quotas'); toast('已归档 · '+(q.locked?'上锁状态已保留':'未上锁'),'good'); PAGES.quota();
    }); },
  unarchiveQuota(id){ const q = State.quotas.find(x=>x.id===id); if(!q) return;
    confirmDialog('恢复额度', '确定把「'+q.name+'」恢复到主页追踪吗？', ()=>{
      q.archived = false; q.archivedAt = '';
      save('quotas'); toast('已恢复','good'); PAGES.quota();
    }); },
  openQuotaDetail(id){ qDetailId = id; PAGES.quota(); },
  quotaBack(){ qDetailId = null; PAGES.quota(); },
  renameQuota(id){ const q = State.quotas.find(x=>x.id===id); if(!q) return;
    formModal('改名 · '+q.name, [
      {key:'name',label:'新名称',placeholder:'新的额度名称'}
    ], d=>{
      const v = (d.name||'').trim();
      if(!v){ toast('名称不能为空','bad'); return; }
      q.name = v; save('quotas'); toast('已改名','good'); PAGES.quota();
    }, { prefill:{ name:q.name } });
  },
  delQuotaRecord(id, el){ const rid = parseInt(el.dataset.rid,10); const q = State.quotas.find(x=>x.id===id); if(!q||isNaN(rid)||!q.records[rid]) return;
    confirmDialog('删除记录', '确定删除这条消耗记录吗？该额度的已消耗将同步扣减。', ()=>{
      q.consumed = Math.max(0, Math.round((q.consumed - q.records[rid].amount)*100)/100);
      q.records.splice(rid, 1); save('quotas'); toast('已删除','good'); PAGES.quota();
    }); }
};

/* ----------------------------- 额度明细详情 ----------------------------- */
let qDetailId = null;
function renderQuotaDetail(q){
  const used = Math.min(q.consumed, q.total);
  const pct = q.total>0 ? Math.round(used/q.total*100) : 0;
  const remaining = Math.max(q.total - q.consumed, 0);
  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">'+icon('quota')+
    '<span class="qd-name">'+esc(q.name)+'</span>'+
    '<button class="btn btn-sm btn-soft" data-action="renameQuota" data-id="'+q.id+'" title="修改名称">✏️ 更名</button>'+
    '<span class="spacer" style="flex:1"></span>'+
    '<button class="btn btn-sm" data-action="quotaBack">‹ 返回</button></div>';
  html += '<div class="stat-row">'+
    '<div class="stat"><div class="label">剩余额度</div><div class="val">'+fmt(remaining)+'</div></div>'+
    '<div class="stat"><div class="label">已消耗</div><div class="val">'+fmt(q.consumed)+'</div></div>'+
    '<div class="stat"><div class="label">总额度</div><div class="val">'+fmt(q.total)+'</div></div>'+
    '</div>';
  html += '<div class="bar'+(pct>=85?' warn':'')+'" style="margin-top:12px"><i style="width:'+pct+'%"></i></div>';
  html += '<div class="sub" style="margin:6px 2px 16px">消耗进度 '+pct+'%</div>';
  html += '<div class="card-title" style="margin-top:2px">消耗记录'+(q.records.length?('（'+q.records.length+' 笔）'):'')+'</div>';
  html += '<div class="list">';
  if(q.records.length===0){ html += '<div class="empty"><div class="big">🧾</div>暂无消耗记录</div>'; }
  else {
    q.records.slice().reverse().forEach((r, i)=>{
      const ridx = q.records.length - 1 - i;
      html += '<div class="item rec-item">';
      html += '<div class="body"><div class="title">'+fmt(r.amount)+' <span class="sub" style="font-weight:400;margin-left:6px">'+esc(r.time||'')+'</span></div>';
      if(r.note) html += '<div class="sub">备注：'+esc(r.note)+'</div>';
      html += '</div>';
      html += '<button class="btn btn-danger btn-sm" data-action="delQuotaRecord" data-id="'+q.id+'" data-rid="'+ridx+'">删除</button>';
      html += '</div>';
    });
  }
  html += '</div></div></div>';
  $('#content').innerHTML = html;
}

/* =============================================================================
 * 页面 4：我的账本（参照鲨鱼记账）
 * =========================================================================== */
/* 支出分类（按参考图扩充为 26 个，含 emoji 图标） */
const ACCOUNT_CATS_EXP = [
  {key:'餐饮',icon:'🍜'}, {key:'娱乐',icon:'🎮'}, {key:'购物',icon:'🛍️'}, {key:'红包',icon:'🧧'},
  {key:'日用',icon:'🧹'}, {key:'交通',icon:'🚌'}, {key:'住房',icon:'🏠'}, {key:'社交',icon:'🍻'},
  {key:'蔬菜',icon:'🥬'}, {key:'水果',icon:'🍎'}, {key:'零食',icon:'🍪'}, {key:'运动',icon:'🏃'},
  {key:'通讯',icon:'📱'}, {key:'服饰',icon:'👕'}, {key:'美容',icon:'💄'}, {key:'居家',icon:'🛋️'},
  {key:'旅行',icon:'✈️'}, {key:'数码',icon:'💻'}, {key:'医疗',icon:'💊'}, {key:'书籍',icon:'📚'},
  {key:'学习',icon:'📖'}, {key:'办公',icon:'🗂️'}, {key:'维修',icon:'🔧'}, {key:'快递',icon:'📦'},
  {key:'消费',icon:'💸'}, {key:'设置',icon:'⚙️'}
];
/* 收入分类 */
const ACCOUNT_CATS_INC = [
  {key:'工资',icon:'💰'}, {key:'理财',icon:'📈'}, {key:'其他',icon:'📦'}, {key:'收礼',icon:'🎁'}
];
/* 合并（去重 key，支出优先） */
const ACCOUNT_ALL = ACCOUNT_CATS_EXP.concat(ACCOUNT_CATS_INC.filter(c=>!ACCOUNT_CATS_EXP.find(x=>x.key===c.key)));
function catMeta(c){
  return ACCOUNT_CATS_EXP.find(x=>x.key===c) || ACCOUNT_CATS_INC.find(x=>x.key===c)
    || (getUserCats().expense.find(x=>x.key===c)) || (getUserCats().income.find(x=>x.key===c))
    || {icon:'📦', key:c};
}
function catIcon(c){ return catMeta(c).icon; }
function catType(c){ return ACCOUNT_CATS_INC.find(x=>x.key===c) ? 'income' : 'expense'; }

/* 用户自定义分类（持久化到 localStorage）· 与内置合并后返回完整分类列表 */
const DEFAULT_USER_CATS = { expense: [], income: [] };
function getUserCats(){
  let u;
  try { u = JSON.parse(localStorage.getItem('wb_userCats')||'null'); } catch(e){ u = null; }
  if(!u || typeof u!=='object') u = JSON.parse(JSON.stringify(DEFAULT_USER_CATS));
  if(!Array.isArray(u.expense)) u.expense = [];
  if(!Array.isArray(u.income))   u.income   = [];
  return u;
}
function saveUserCats(u){ localStorage.setItem('wb_userCats', JSON.stringify(u)); }
/* 分类显示顺序持久化（内置+自定义合并排序，存 key 数组；拖拽/↑↓ 时写入） */
function loadCatOrder(type){
  try { const o = JSON.parse(localStorage.getItem('wb_catOrder')||'null'); if(o && Array.isArray(o[type])) return o[type]; } catch(e){}
  return null;
}
function saveCatOrder(type, keys){
  let o; try { o = JSON.parse(localStorage.getItem('wb_catOrder')||'{}')||{}; } catch(e){ o = {}; }
  o[type] = keys;
  localStorage.setItem('wb_catOrder', JSON.stringify(o));
}
function isBuiltinCat(type, key){
  const b = type==='income' ? ACCOUNT_CATS_INC : ACCOUNT_CATS_EXP;
  return b.some(x=>x.key===key);
}
function allCatsOfType(type){
  const builtin = type==='income' ? ACCOUNT_CATS_INC : ACCOUNT_CATS_EXP;
  const user    = (getUserCats()[type] || []).filter(c=> c && c.key && !builtin.find(x=>x.key===c.key));
  return builtin.concat(user);
}
function getCats(type){
  const all = allCatsOfType(type);
  const order = loadCatOrder(type);
  if(!order || !order.length) return all;
  const map = {}; all.forEach(c=> map[c.key] = c);
  const out = [];
  order.forEach(k=>{ if(map[k]){ out.push(map[k]); delete map[k]; } });
  Object.keys(map).forEach(k=> out.push(map[k]));  // 补录未在顺序里的（新加的）分类
  return out;
}
/* 拖拽/↑↓ 通用：把 fromKey 移动到 toKey 之前（按当前显示顺序数组） */
function reorderCatsInOrder(type, fromKey, toKey){
  const order = getCats(type).map(c=>c.key);
  const from = order.indexOf(fromKey), to = order.indexOf(toKey);
  if(from<0 || to<0 || from===to) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  saveCatOrder(type, order);
}

/* 快速记一笔 · 主网格分类拖拽排序（PointerEvent，电脑/手机双端可用；点格仍为记一笔） */
function bindCatDrag(){
  const grid = document.querySelector('#content .quick-grid');
  if(!grid) return;
  const cells = [...grid.querySelectorAll('.quick[data-cat]')];
  cells.forEach(cell=>{
    cell.addEventListener('pointerdown', e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      const startX = e.clientX, startY = e.clientY;
      let dragging = false;
      const begin = ()=>{
        dragging = true;
        cell.classList.add('dragging');
        cell.style.userSelect = 'none';
        cell.style.pointerEvents = 'none';   // 让 elementFromPoint 命中下方格子
      };
      const onMove = (ev)=>{
        const dx = ev.clientX-startX, dy = ev.clientY-startY;
        if(!dragging){ if(Math.hypot(dx,dy) < 6) return; begin(); }
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const target = under && under.closest('.quick[data-cat]');
        if(target && target!==cell){
          const r = target.getBoundingClientRect();
          const before = (ev.clientY < r.top + r.height/2) || (ev.clientY === r.top + r.height/2 && ev.clientX < r.left + r.width/2);
          if(before) grid.insertBefore(cell, target);
          else grid.insertBefore(cell, target.nextSibling);
        }
      };
      const onUp = ()=>{
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if(dragging){
          cell.classList.remove('dragging');
          cell.style.userSelect=''; cell.style.pointerEvents='';
          const order = [...grid.querySelectorAll('.quick[data-cat]')].map(x=> x.dataset.cat);
          saveCatOrder(cell.dataset.type, order);
          window.__justDragged = true;     // 忽略松手后误触的 click
          PAGES.accountQuick();            // 重渲染并重新绑定拖拽
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  });
}

/* =============================================================================
 * 我的账本 · 一级默认页：快速记一笔（支出/收入切换 + 分类快捷 + 智能输入）
 * =========================================================================== */
PAGES.accountQuick = function(){
  const type = acctQuickType;
  const cats = getCats(type);
  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">⚡ 快速记一笔'+
    '<span style="flex:1"></span><button class="btn btn-sm" data-action="smartAdd">➕ 智能输入</button></div>';

  // 支出 / 收入 切换
  html += '<div class="ai-tabs" style="margin-bottom:14px">'+
    '<div class="ai-tab'+(type==='expense'?' active':'')+'" data-action="setQuickType" data-t="expense">支出 ▾</div>'+
    '<div class="ai-tab'+(type==='income'?' active':'')+'" data-action="setQuickType" data-t="income">收入</div>'+
    '</div>';

  // 分类网格（4 列）· 全部可拖拽排序；末位「其他」管理自定义分类
  html += '<div class="quick-grid qgrid4">';
  cats.forEach(c=>{
    html += '<div class="quick" data-action="quickAdd" data-cat="'+c.key+'" data-type="'+type+'">'+
      '<div class="q-ic">'+c.icon+'</div>'+c.key+'</div>';
  });
  html += '<div class="quick q-other" data-action="openCatManager" title="管理「其他」自定义分类 / 在此排序所有分类">'+
    '<div class="q-ic">🗂️</div>其他</div>';
  html += '</div>';

  html += '<div class="mstat-legend">点分类直接记一笔（默认'+ (type==='income'?'收入':'支出') +'）· 长按/拖动可排序 · 也可「智能输入」一次性录多笔</div>';
  html += '</div></div>';
  $('#content').innerHTML = html;
  bindCatDrag();
};

/* 分类管理弹窗（用户自定义 + 排序）· 不做明显拖拽标识，仅提供功能 */
const CAT_ICONS = ['🍴','🍜','🍱','🍣','🍰','🍻','🎮','🎵','🎬','�','🛍️','🎁','🧧','💄','💊','�','✏️','🎓','🏠','🚗','🚌','✈️','🚲','📱','💻','🖥️','🐶','🐱','🌳','⚽','🏃','💼','💰','📈','💳','🏦','📦','⚙️','🔧','🧹'];
let catManagerType = 'expense';  // 分类管理弹窗持久类型（避免重开闭包丢失）
function openCatManager(){
  catManagerType = catManagerType || acctQuickType;
  const viewType = catManagerType;
  const cats  = getCats(viewType);          // 已按 wb_catOrder 排序（内置+自定义合并）
  const order = cats.map(c=>c.key);

  let body = '<h3>🗂️ 其他分类</h3>'+
    '<div class="ai-tabs" style="margin-bottom:14px">'+
      '<div class="ai-tab'+(viewType==='expense'?' active':'')+'" data-cm-type="expense">支出</div>'+
      '<div class="ai-tab'+(viewType==='income'?' active':'')+'" data-cm-type="income">收入</div>'+
    '</div>'+
    '<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">电脑端可直接在「快速记一笔」主网格拖动分类排序；手机端用下方 <span style="opacity:.85">↑↓</span> 调整顺序。所有分类（内置 / 自定义）均可排序，自定义分类还能删除或添加</div>'+
    '<div id="cmList" class="cm-list">'+
      cats.map((c,i)=>{
        const builtin = isBuiltinCat(viewType, c.key);
        return '<div class="cm-row'+(builtin?' cm-builtin':'')+'" draggable="true" data-ckey="'+esc(c.key)+'">'+
          '<div class="cm-rank">'+(i+1)+'</div>'+
          '<div class="cm-icon">'+c.icon+'</div>'+
          '<div class="cm-name">'+esc(c.key)+'</div>'+
          '<div class="cm-acts">'+
            '<button class="cm-btn" data-cm-act="up"   data-ckey="'+esc(c.key)+'" '+(i===0?'disabled':'')+' title="上移">↑</button>'+
            '<button class="cm-btn" data-cm-act="down" data-ckey="'+esc(c.key)+'" '+(i===order.length-1?'disabled':'')+' title="下移">↓</button>'+
            (builtin ? '<span class="cm-tag">内置</span>' : '<button class="cm-btn cm-btn-danger" data-cm-act="del" data-ckey="'+esc(c.key)+'" title="删除">✕</button>')+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>'+
    '<div class="cm-add">'+
      '<button class="btn btn-primary btn-sm" data-cm-act="add">＋ 添加新分类</button>'+
      '<button class="btn btn-sm" data-cm-act="reset" title="清空所有自定义分类">清空自定义</button>'+
    '</div>'+
    '<div class="modal-actions"><button class="btn" data-x="cancel">关闭</button></div>';
  openModal(body);
  $('#modalRoot').dataset.lock = '1';  // 锁定，遮罩不关
  $$('#modalRoot [data-cm-type]').forEach(el=> el.onclick = ()=>{
    catManagerType = el.dataset.cmType;
    closeModal(); openCatManager();
  });
  $('#modalRoot').querySelector('[data-x="cancel"]').onclick = ()=>{ delete $('#modalRoot').dataset.lock; closeModal(); };
  /* 拖拽排序（内置+自定义通用） */
  let dragKey = null;
  $$('#modalRoot .cm-row[draggable]').forEach(el=>{
    el.addEventListener('dragstart', e=>{ dragKey = el.dataset.ckey; el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; try{ e.dataTransfer.setData('text/plain', dragKey); }catch(_){} });
    el.addEventListener('dragend', ()=>{ el.classList.remove('dragging'); $$('#modalRoot .cm-row').forEach(r=> r.classList.remove('drag-over')); });
    el.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; if(el.dataset.ckey!==dragKey) el.classList.add('drag-over'); });
    el.addEventListener('dragleave', ()=>{ el.classList.remove('drag-over'); });
    el.addEventListener('drop', e=>{ e.preventDefault(); el.classList.remove('drag-over');
      const tk = el.dataset.ckey;
      if(dragKey && tk && dragKey!==tk){ reorderCatsInOrder(viewType, dragKey, tk); closeModal(); openCatManager(); }
    });
  });
  /* 上下移（作用于合并顺序数组） */
  $$('#modalRoot [data-cm-act="up"], #modalRoot [data-cm-act="down"]').forEach(el=> el.onclick = (e)=>{
    e.stopPropagation();
    const key = el.dataset.ckey;
    const ord = getCats(viewType).map(c=>c.key);
    const idx = ord.indexOf(key); if(idx<0) return;
    const j = el.dataset.cmAct==='up' ? idx-1 : idx+1;
    if(j<0 || j>=ord.length) return;
    reorderCatsInOrder(viewType, key, ord[j]);
    closeModal(); openCatManager();
  });
  /* 删除自定义分类 */
  $$('#modalRoot [data-cm-act="del"]').forEach(el=> el.onclick = (e)=>{
    e.stopPropagation();
    const key = el.dataset.ckey;
    const u = getUserCats();
    const used = State.accounts.some(t=> t && t.cat===key);
    const goDel = ()=>{
      u[viewType] = (u[viewType]||[]).filter(c=> c.key !== key);
      saveUserCats(u);
      const ord = loadCatOrder(viewType);
      if(ord){ const i = ord.indexOf(key); if(i>=0){ ord.splice(i,1); saveCatOrder(viewType, ord); } }
      closeModal(); openCatManager();
    };
    if(used){
      confirmDialog('删除分类', '该分类已有 '+State.accounts.filter(t=>t.cat===key).length+' 笔账目记录。删除后历史记录的分类名仍会保留，但不再出现在快捷分类里。确认删除？', goDel);
    } else {
      goDel();
    }
  });
  /* 添加 */
  const addBtn = $('#modalRoot').querySelector('[data-cm-act="add"]');
  if(addBtn) addBtn.onclick = (e)=>{ e.stopPropagation(); openAddCatForm(viewType); };
  /* 清空自定义 */
  const resetBtn = $('#modalRoot').querySelector('[data-cm-act="reset"]');
  if(resetBtn) resetBtn.onclick = (e)=>{
    e.stopPropagation();
    confirmDialog('清空自定义分类', '将清空所有【'+ (viewType==='income'?'收入':'支出') +'】自定义分类（不影响内置）。确认？', ()=>{
      const u = getUserCats();
      u[viewType] = [];
      saveUserCats(u);
      closeModal(); openCatManager();
    });
  };
}

/* 新增分类表单（emoji + 名称） */
function openAddCatForm(viewType){
  const builtin = viewType==='income' ? ACCOUNT_CATS_INC : ACCOUNT_CATS_EXP;
  const fields = [
    { key:'name', label:'分类名', type:'text', value:'', placeholder:'如：宠物、咖啡' },
    { key:'icon', label:'图标', type:'text', value:'📦', placeholder:'点击下方选择' }
  ];
  formModal('＋ 添加'+ (viewType==='income'?'收入':'支出') +'分类', fields, d=>{
    const name = (d.name||'').trim();
    if(!name){ toast('请输入分类名','bad'); return; }
    if(builtin.find(x=>x.key===name) || (getUserCats()[viewType]||[]).some(x=>x.key===name)){ toast('已存在同名分类','bad'); return; }
    const u = getUserCats();
    u[viewType] = u[viewType] || [];
    u[viewType].push({ key:name, icon:d.icon||'📦' });
    saveUserCats(u);
    const ord = loadCatOrder(viewType);   // 新分类默认排到末尾（仅在已有自定义顺序时）
    if(ord){ ord.push(name); saveCatOrder(viewType, ord); }
    closeModal();
    openCatManager();  // 回到管理页看到刚加的分类
    toast('已添加：'+name,'good');
    return false;  // 阻止 formModal 自动 closeModal（已手动 close+open）
  }, { validate:(d)=> (d.name||'').trim() ? null : '请输入分类名' });
  /* 在 formModal 后注入 emoji 选择网格 */
  const grid = document.createElement('div');
  grid.className = 'cm-emoji-grid';
  grid.innerHTML = CAT_ICONS.map(e=>'<span class="cm-emoji" data-e="'+e+'">'+e+'</span>').join('');
  const insert = $('#modalRoot').querySelector('[data-k="icon"]');
  if(insert){ insert.parentNode.appendChild(grid); }
  $$('#modalRoot .cm-emoji').forEach(el=> el.onclick = ()=>{
    const inp = $('#modalRoot').querySelector('[data-k="icon"]');
    if(inp){ inp.value = el.dataset.e; }
  });
}

PAGES.accountMonth = function(){
  const ym = acctYM();
  const monthTx = State.accounts.filter(t=> (t.date||'').slice(0,7)===ym && t.source!=='yearly-backfill');
  const exp = monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const inc = monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const [cy, cm] = ym.split('-');
  const isCur = ym===monthStr();

  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">'+icon('account')+'本月账单'+
    '<span style="flex:1"></span><button class="btn btn-sm" data-action="pwdSet">🔐 '+(State.settings.accountPwd?'已加密':'未加密')+'</button></div>';
  html += '<div class="month-switch">'+
    '<button class="btn btn-sm btn-soft" data-action="prevMonth">‹ 上月</button>'+
    '<div class="month-title">'+cy+' 年 '+parseInt(cm,10)+' 月'+(isCur?'<span class="mcur">本月</span>':'')+'</div>'+
    '<button class="btn btn-sm btn-soft" data-action="nextMonth">下月 ›</button>'+
    '</div>';
  html += '<div class="stat-row">'+
    '<div class="stat income"><div class="label">收入</div><div class="val">'+fmt(inc)+'</div></div>'+
    '<div class="stat expense"><div class="label">支出</div><div class="val">'+fmt(exp)+'</div></div>'+
    '<div class="stat'+((inc-exp)<0?' expense':'')+'"><div class="label">剩余</div><div class="val">'+fmt(inc-exp)+'</div></div>'+
    '</div>';
  if(!isCur) html += '<div style="text-align:center;margin-top:10px"><button class="btn btn-sm btn-primary" data-action="backToCur">↩ 回到本月</button></div>';
  html += '</div>';

  /* ---- 总览 / 详情 切换 ---- */
  html += '<div class="card"><div class="card-title">📋 账单视图</div>';
  html += '<div class="ai-tabs" style="margin-bottom:12px">'+
    '<div class="ai-tab'+(mAccountSubView==='overview'?' active':'')+'" data-action="setMView" data-v="overview">总览</div>'+
    '<div class="ai-tab'+(mAccountSubView==='detail'?' active':'')+'" data-action="setMView" data-v="detail">详情</div>'+
    '</div>';
  html += (mAccountSubView==='overview') ? renderMonthOverview(ym) : renderAccountDetail(ym);
  html += '</div>';

  /* ---- 月预算（按分类限额 + 超支警告） ---- */
  const prog = computeBudgetProgress(ym);
  const overList = prog.filter(p=> p.over>0);
  html += '<div class="card"><div class="card-title">📊 月预算 <span class="mc-title-inline">'+ym+'</span>'+
    '<span style="flex:1"></span><button class="btn btn-sm" data-action="openBudget">⚙️ 设置</button></div>';
  if(prog.length===0){
    html += '<div class="empty" style="padding:14px">还没有设置本月预算，点右上「⚙️ 设置」按分类设定限额</div>';
  } else {
    if(overList.length>0){
      html += '<div class="budget-warn">⚠️ '+esc(overList.map(p=> p.cat+' 超 '+fmt(p.over)).join(' · '))+'</div>';
    }
    html += '<div class="budget-list">';
    prog.forEach(p=>{
      const over = p.over>0;
      html += '<div class="budget-row'+(over?' over':'')+'">'+
        '<div class="b-name">'+esc(p.cat)+'</div>'+
        '<div class="b-num">已花 <b>'+fmt(p.used)+'</b> / <span>预算 '+fmt(p.budget)+'</span>'+(over?' <em>· 超 '+fmt(p.over)+'</em>':'')+'</div>'+
        '<div class="bar'+(over?' warn':'')+'"><i style="width:'+p.pct+'%"></i></div>'+
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  /* ---- 月度分类占比（饼图） ---- */
  html += '<div class="card"><div class="card-title">🥧 月度分类</div>'+renderExpenseDonut(ym)+'</div>';

  /* ---- 固定收支（周期入账） ---- */
  html += '<div class="card"><div class="card-title">📅 固定收支'+
    '<span style="flex:1"></span><button class="btn btn-sm btn-primary" data-action="addRecurring">＋ 新增</button></div>';
  if(State.recurring.length===0){
    html += '<div class="empty"><div class="big">📅</div>添加房租、订阅、工资等周期性账目，到期自动入账，省心</div>';
  } else {
    html += '<div class="list">';
    State.recurring.forEach(r=>{
      const c = catMeta(r.cat);
      html += '<div class="item'+(r.paused?' muted':'')+'">'+
        '<div class="q-ic" style="width:40px;height:40px">'+c.icon+'</div>'+
        '<div class="body"><div class="title">'+esc(r.name)+(r.paused?' <span class="badge" style="background:#e2e8f0;color:#64748b">已暂停</span>':'')+'</div>'+
        '<div class="sub">'+(r.type==='income'?'收入':'支出')+' · '+esc(r.cat)+' · '+(r.cycle==='monthly'?'每月'+(r.day?r.day+'号':''):r.cycle==='weekly'?'每周':r.cycle)+(r.lastAdded?' · 上次入账 '+r.lastAdded:'')+'</div></div>'+
        '<div class="title" style="color:'+(r.type==='income'?'var(--good)':'var(--bad)')+'">'+(r.type==='income'?'+':'-')+fmt(r.amount)+'</div>'+
        '<button class="btn btn-sm" data-action="toggleRecurring" data-id="'+r.id+'">'+(r.paused?'恢复':'暂停')+'</button>'+
        '<button class="btn btn-sm" data-action="editRecurring" data-id="'+r.id+'">编辑</button>'+
        '<button class="btn btn-danger btn-sm" data-action="delRecurring" data-id="'+r.id+'">删除</button>'+
        '</div>';
    });
    html += '</div>';
  }
  html += '</div></div>';

  $('#content').innerHTML = html;
};

/* ---- 本月账单：总览（日格子，点开看当日流水） ---- */
function renderMonthOverview(ym){
  const y = parseInt(ym.slice(0,4),10), m = parseInt(ym.slice(5,7),10);
  const byDay = {};
  State.accounts.forEach(t=>{
    if(t.source==='yearly-backfill') return;
    if((t.date||'').slice(0,7)!==ym) return;
    const d = t.date;
    if(!byDay[d]) byDay[d] = { inc:0, exp:0, n:0 };
    if(t.type==='income') byDay[d].inc += t.amount; else byDay[d].exp += t.amount;
    byDay[d].n++;
  });
  const expList = Object.keys(byDay).map(k=> byDay[k].exp).filter(v=> v>0);
  const maxExp = expList.length ? Math.max.apply(null, expList) : 0;
  const todayD = todayStr();
  const firstDow = new Date(y, m-1, 1).getDay();
  const lastDay  = new Date(y, m, 0).getDate();

  let html = '<div class="mc-weekrow"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>';
  html += '<div class="mc-grid">';
  for(let i=0;i<firstDow;i++) html += '<div class="mc-day mc-blank"></div>';
  for(let day=1; day<=lastDay; day++){
    const ds = y+'-'+pad(m)+'-'+pad(day);
    const v = byDay[ds];
    const isToday  = ds===todayD;
    const isFuture = ds>todayD;
    let cls = 'mc-day acct-day';
    if(isToday) cls += ' mc-today';
    if(v){
      const r = maxExp>0 ? v.exp/maxExp : 0;
      cls += r>=0.66 ? ' acct-h3' : r>=0.33 ? ' acct-h2' : r>0 ? ' acct-h1' : ' acct-h0';
    } else if(isFuture) cls += ' mc-future';
    else cls += ' mc-empty';
    html += '<div class="'+cls+'"'+(v?' data-action="openAcctDay" data-day="'+ds+'"':'')+'>';
    html += '<div class="mc-num">'+day+'</div>';
    if(v){
      const net = Math.round((v.inc - v.exp)*100)/100;
      html += '<div class="acct-net'+(net<0?' neg':(net>0?' pos':''))+'">'+shortAmt(net)+'</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="mstat-legend">格内为当日净收支（收入−支出）· 颜色越深当日支出越高 · 点格跳到「详情」中当天记录</div>';
  return html;
}
function shortAmt(n){
  if(n===0) return '0';
  return (n<0?'-':'+')+shortNum(n);
}
/* 点开某日：当日流水弹窗 */
function openAcctDay(ds){
  const list = State.accounts.filter(t=> t.date===ds && t.source!=='yearly-backfill')
    .sort((a,b)=> (b.created||0)-(a.created||0));
  const inc = list.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp = list.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  let html = '<div class="day-stat">收 <b style="color:var(--good)">'+fmt(inc)+'</b> · 支 <b style="color:var(--bad)">'+fmt(exp)+'</b> · 净 <b>'+fmt(inc-exp)+'</b></div>';
  if(list.length===0){
    html += '<div class="day-empty">当日没有账目</div>';
  } else {
    html += '<div class="day-section">';
    list.forEach(t=>{
      const c = catMeta(t.cat);
      const a = t.accountId ? (State.assets.find(x=>x.id===t.accountId)||{}).name : '';
      html += '<div class="day-row">'+
        '<span class="day-row-text">'+c.icon+' '+esc(t.cat)+(t.note?' · '+esc(t.note):'')+(a?' <span class="badge">'+esc(a)+'</span>':'')+'</span>'+
        '<b style="float:right;color:'+(t.type==='income'?'var(--good)':'var(--bad)')+'">'+(t.type==='income'?'+':'-')+fmt(t.amount)+'</b>'+
        '</div>';
    });
    html += '</div>';
  }
  const body = '<h3>'+ds+' 当日流水</h3>'+html+
    '<div class="modal-actions"><button class="btn btn-primary" data-x="close">关闭</button></div>';
  openModal(body);
  $('#modalRoot').querySelector('[data-x="close"]').onclick = closeModal;
}

/* ---- 本月账单：详情（按日分组，日期由新到旧） ---- */
function renderAccountDetail(ym){
  if(!batch.account) batch.account = { on:false, sel:new Set() };
  const b = batch.account;
  const list = State.accounts.filter(t=> (t.date||'').slice(0,7)===ym && t.source!=='yearly-backfill')
    .sort((x,y2)=> x.date===y2.date ? (y2.created||0)-(x.created||0) : (x.date<y2.date?1:-1));

  let html = '<div class="toolbar">'+
    '<button class="btn btn-sm'+(b.on?' btn-primary':'')+'" data-action="batchToggle">'+(b.on?'退出批量':'批量')+'</button>'+
    (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中 ('+b.sel.size+')</button>' : '')+
    '</div>';

  if(list.length===0){
    html += '<div class="empty"><div class="big">💰</div>本月还没有记录，去「快速记一笔」开始记账吧</div>';
    return html;
  }
  // 按日分组
  const days = [];
  const map = {};
  list.forEach(t=>{ if(!map[t.date]){ map[t.date]=[]; days.push(t.date); } map[t.date].push(t); });
  days.forEach(d=>{
    const arr = map[d];
    const inc = arr.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = arr.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    html += '<div class="d-grp'+(d===acctJumpDay?' flash':'')+'" data-day="'+d+'"><span class="d-date">'+d.slice(5)+' '+dowCN(d)+(d===todayStr()?' · 今天':'')+'</span>'+
      '<span class="d-sum">'+(inc>0?'收 '+fmt(inc)+' · ':'')+'支 '+fmt(exp)+'</span></div>';
    html += '<div class="list" style="margin-bottom:12px">';
    arr.forEach(t=>{
      const c = catMeta(t.cat);
      const cardName = t.accountId ? (State.assets.find(x=>x.id===t.accountId)||{}).name : '';
      html += '<div class="item">';
      if(b.on) html += '<div class="check'+(b.sel.has(t.id)?' on':'')+'" data-action="sel" data-id="'+t.id+'">'+(b.sel.has(t.id)?'✓':'')+'</div>';
      html += '<div class="q-ic" style="width:40px;height:40px">'+c.icon+'</div>';
      html += '<div class="body"><div class="title">'+esc(t.cat)+(t.note?' · '+esc(t.note):'')+'</div>'+
        '<div class="sub">'+(t.time||'')+(cardName?' · '+esc(cardName):' · 未绑卡')+'</div></div>';
      html += '<div class="title" style="color:'+(t.type==='income'?'var(--good)':'var(--bad)')+'">'+(t.type==='income'?'+':'-')+fmt(t.amount)+'</div>';
      if(!b.on) html += '<div class="item-acts">'+
        '<button class="btn btn-sm" data-action="editTx" data-id="'+t.id+'">编辑</button>'+
        '<button class="btn btn-danger btn-sm" data-action="delTx" data-id="'+t.id+'">删除</button></div>';
      html += '</div>';
    });
    html += '</div>';
  });
  return html;
}
/* =============================================================================
 * 我的账本 · 二级页 2：年月概况（月账单 / 年账单）
 * =========================================================================== */
/* 某年 12 个月的收入/支出/结余（不含年度补录笔，补录只体现在年账单） */
function computeMonthlyStats(year){
  const months = [];
  for(let m=1;m<=12;m++) months.push({ m, inc:0, exp:0 });
  let inc=0, exp=0;
  State.accounts.forEach(t=>{
    if(t.source==='yearly-backfill') return;
    if(!t.date || t.date.length<7) return;
    if(parseInt(t.date.slice(0,4),10)!==year) return;
    const mi = parseInt(t.date.slice(5,7),10)-1;
    if(mi<0||mi>11) return;
    if(t.type==='income'){ months[mi].inc += t.amount; inc += t.amount; }
    else if(t.type==='expense'){ months[mi].exp += t.amount; exp += t.amount; }
  });
  return { months, inc:round2(inc), exp:round2(exp), bal:round2(inc-exp), year };
}
/* 历年汇总（含年度补录笔） */
function computeYearlyStats(){
  const map = {};
  State.accounts.forEach(t=>{
    if(!t.date || t.date.length<4) return;
    const y = parseInt(t.date.slice(0,4),10);
    if(isNaN(y)) return;
    if(!map[y]) map[y] = { year:y, inc:0, exp:0, backfill:false };
    if(t.source==='yearly-backfill') map[y].backfill = true;
    if(t.type==='income') map[y].inc += t.amount;
    else if(t.type==='expense') map[y].exp += t.amount;
  });
  const years = Object.keys(map).map(k=> map[k]).sort((a,b)=> b.year-a.year);
  years.forEach(y=>{ y.inc=round2(y.inc); y.exp=round2(y.exp); y.bal=round2(y.inc-y.exp); });
  const totInc = round2(years.reduce((s,y)=>s+y.inc,0));
  const totExp = round2(years.reduce((s,y)=>s+y.exp,0));
  return { years, totInc, totExp, totBal: round2(totInc-totExp) };
}
/* 某周一是一年的第几周（以周一为周首） */
function weekIndexOf(d){
  const y = d.getFullYear();
  const jan1 = new Date(y,0,1); const dow = jan1.getDay();
  const w1 = new Date(y,0,1+(dow===0? -6 : 1-dow));
  const days = Math.round((d - w1)/86400000);
  return Math.floor(days/7)+1;
}
/* 取当前趋势视图/类型下的流水（已按类型筛选、排除年度补录 lump） */
function trendTxList(sign){
  if(acctTrendView==='year'){
    const yr = acctTrendYear();
    return State.accounts.filter(t=> t.type===sign && t.source!=='yearly-backfill' && (t.date||'').length>=7 && parseInt(t.date.slice(0,4),10)===yr);
  } else if(acctTrendView==='month'){
    const pk = acctTrendYear()+'-'+pad(acctTrendMonth());
    return State.accounts.filter(t=> t.type===sign && t.source!=='yearly-backfill' && (t.date||'').slice(0,7)===pk);
  } else {
    const mon = acctWeekMonday(); const sun = new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);
    const s=fmtYMD(mon), e=fmtYMD(sun);
    return State.accounts.filter(t=> t.type===sign && t.source!=='yearly-backfill' && (t.date||'')>=s && (t.date||'')<=e);
  }
}
/* 聚合：分桶 + 总计 + 均值 + 区间文案 + 分类排行 */
function computeTrendQuery(){
  const sign = acctTrendType==='income' ? 'income' : 'expense';
  const txs = trendTxList(sign);
  let buckets = [], rangeLabel = '';
  if(acctTrendView==='year'){
    const yr = acctTrendYear();
    for(let m=1;m<=12;m++) buckets.push({label:m+'月', val:0, key:pad(m)});
    rangeLabel = yr+' 年 · 月走势';
    txs.forEach(t=>{ const mi=parseInt((t.date||'').slice(5,7),10)-1; if(mi>=0&&mi<12) buckets[mi].val += t.amount; });
  } else if(acctTrendView==='month'){
    const yr=acctTrendYear(), mo=acctTrendMonth();
    const last = new Date(yr, mo, 0).getDate();
    for(let d=1;d<=last;d++) buckets.push({label:String(d), val:0, key:pad(d)});
    rangeLabel = yr+' 年 '+mo+' 月 · 日走势';
    txs.forEach(t=>{ const di=parseInt((t.date||'').slice(8,10),10); if(di>=1&&di<=last) buckets[di-1].val += t.amount; });
  } else {
    const mon = acctWeekMonday(); const sun = new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);
    const labels=['一','二','三','四','五','六','日'];
    for(let i=0;i<7;i++){ const dd=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+i); buckets.push({label:labels[i], val:0, key:fmtYMD(dd), ds:fmtYMD(dd)}); }
    rangeLabel = mon.getFullYear()+' 年第'+weekIndexOf(mon)+'周 · '+fmtYMD(mon).slice(5)+'~'+fmtYMD(sun).slice(5);
    txs.forEach(t=>{ const bi=buckets.findIndex(b=> b.ds===t.date); if(bi>=0) buckets[bi].val += t.amount; });
  }
  buckets.forEach(b=> b.val = round2(b.val));
  const total = round2(buckets.reduce((s,b)=> s+b.val, 0));
  const avg = round2(total / Math.max(buckets.length,1));
  const cmap = {};
  txs.forEach(t=>{ cmap[t.cat] = (cmap[t.cat]||0) + t.amount; });
  const ranking = Object.keys(cmap).map(k=>({cat:k, val:round2(cmap[k])})).sort((a,b)=> b.val-a.val).slice(0,8);
  return { sign, buckets, total, avg, rangeLabel, ranking };
}
/* 折线图（内联 SVG） */
function renderLineChart(q){
  const vals = q.buckets.map(b=>b.val);
  const max = Math.max.apply(null, vals.concat([0]));
  const W=320,H=150,padL=10,padR=10,padT=16,padB=24;
  const n = q.buckets.length;
  if(n===0) return '<div class="empty" style="padding:14px">该区间暂无'+(q.sign==='income'?'收入':'支出')+'记录</div>';
  const x = i => padL + (W-padL-padR)*(n===1?0.5:i/(n-1));
  const y = v => padT + (H-padT-padB)*(max>0?(1-v/max):1);
  const col = q.sign==='income' ? '#3aa76d' : '#e8606b';
  const pts = q.buckets.map((b,i)=> x(i).toFixed(1)+','+y(b.val).toFixed(1));
  const area = 'M'+x(0).toFixed(1)+','+(H-padB)+' L'+pts.join(' L')+' L'+x(n-1).toFixed(1)+','+(H-padB)+' Z';
  const line = 'M'+pts.join(' L');
  let xl = '';
  q.buckets.forEach((b,i)=>{
    const show = (n<=12) || (i%5===0) || (i===n-1);
    if(show) xl += '<text x="'+x(i).toFixed(1)+'" y="'+(H-7)+'" text-anchor="middle" class="line-xl">'+b.label+'</text>';
  });
  const dots = q.buckets.map((b,i)=> '<circle cx="'+x(i).toFixed(1)+'" cy="'+y(b.val).toFixed(1)+'" r="'+(b.val>0?2.6:1.6)+'" fill="'+col+'"/>').join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="line-svg">'+
    '<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'" stroke="var(--line,#e5e7eb)" stroke-width="1"/>'+
    '<path d="'+area+'" fill="'+col+'" fill-opacity="0.12"/>'+
    '<path d="'+line+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'+
    dots + xl + '</svg>';
}
/* 分类排行（带进度条） */
function renderRankList(q){
  if(q.ranking.length===0) return '<div class="empty" style="padding:12px">该区间暂无分类数据</div>';
  const max = q.ranking[0].val;
  return '<div class="rank-list">'+ q.ranking.map(r=>{
    const pct = max>0 ? Math.min(100, r.val/max*100) : 0;
    return '<div class="rank-row">'+
      '<span class="rank-ic">'+catIcon(r.cat)+'</span>'+
      '<span class="rank-n">'+esc(r.cat)+'</span>'+
      '<span class="rank-v">'+fmt(r.val)+'</span>'+
      '<div class="rank-bar"><i style="width:'+pct+'%"></i></div>'+
    '</div>';
  }).join('') + '</div>';
}

PAGES.accountYearly = function(){
  const billView = acctBillView;
  const trendType = acctTrendType;
  let html = '<div class="page">';

  /* ======== 顶部【原】年月账单（月/年切换 + 12月明细 + 年度补录）· 保留原功能 ======== */
  html += '<div class="card"><div class="card-title">📊 年月账单'+
    '<span style="flex:1"></span></div>'+
    '<div class="ai-tabs" style="margin-bottom:0">'+
    '<div class="ai-tab'+(billView==='month'?' active':'')+'" data-action="setBillView" data-v="month">月账单</div>'+
    '<div class="ai-tab'+(billView==='year'?' active':'')+'" data-action="setBillView" data-v="year">年账单</div>'+
    '</div></div>';

  if(billView==='month'){
    const yr = acctBillYear();
    const st = computeMonthlyStats(yr);
    html += '<div class="card">';
    html += '<div class="month-switch">'+
      '<button class="btn btn-sm btn-soft" data-action="prevBillYear">‹ '+(yr-1)+'</button>'+
      '<div class="month-title">'+yr+' 年'+(yr===(new Date()).getFullYear()?'<span class="mcur">今年</span>':'')+'</div>'+
      '<button class="btn btn-sm btn-soft" data-action="nextBillYear">'+(yr+1)+' ›</button>'+
      '</div>';
    html += '<div class="stat-row">'+
      '<div class="stat income"><div class="label">年收入</div><div class="val">'+fmt(st.inc)+'</div></div>'+
      '<div class="stat expense"><div class="label">年支出</div><div class="val">'+fmt(st.exp)+'</div></div>'+
      '<div class="stat'+(st.bal<0?' expense':'')+'"><div class="label">年结余</div><div class="val">'+fmt(st.bal)+'</div></div>'+
      '</div></div>';
    html += '<div class="card"><div class="card-title">🗓 '+yr+' 年 · 每月明细</div>';
    if(st.inc===0 && st.exp===0){
      html += '<div class="empty" style="padding:14px">'+yr+' 年还没有账目记录</div>';
    } else {
      const curM = (yr===(new Date()).getFullYear()) ? (new Date()).getMonth()+1 : 0;
      html += '<div class="ystat-list">';
      st.months.forEach(m=>{
        const bal = round2(m.inc-m.exp);
        const empty = (m.inc===0 && m.exp===0);
        html += '<div class="ystat-row'+(m.m===curM?' on':'')+(empty?' dim':'')+'" data-action="jumpBillMonth" data-ym="'+yr+'-'+pad(m.m)+'">'+
          '<div class="ystat-y">'+m.m+' 月'+(m.m===curM?' <span class="mcur">本月</span>':'')+'</div>'+
          '<div class="ystat-i">收 '+fmt(m.inc)+'</div>'+
          '<div class="ystat-e">支 '+fmt(m.exp)+'</div>'+
          '<div class="ystat-b'+(bal<0?' neg':'')+'">结余 '+fmt(bal)+'</div>'+
          '</div>';
      });
      html += '</div><div class="mstat-legend">点任意月份可跳到「本月账单」查看该月明细</div>';
    }
    html += '</div>';
  } else {
    const st = computeYearlyStats();
    html += '<div class="card"><div class="card-title">🏁 历年总计'+
      '<span style="flex:1"></span><button class="btn btn-sm btn-primary" data-action="backfillYear">＋ 补录年度</button></div>';
    html += '<div class="stat-row">'+
      '<div class="stat income"><div class="label">总收入</div><div class="val">'+fmt(st.totInc)+'</div></div>'+
      '<div class="stat expense"><div class="label">总支出</div><div class="val">'+fmt(st.totExp)+'</div></div>'+
      '<div class="stat'+(st.totBal<0?' expense':'')+'"><div class="label">总结余</div><div class="val">'+fmt(st.totBal)+'</div></div>'+
      '</div></div>';
    html += '<div class="card"><div class="card-title">📅 各年度明细</div>';
    if(st.years.length===0){
      html += '<div class="empty"><div class="big">📅</div>还没有任何年份数据。往年数据可点右上「＋ 补录年度」一次性录入</div>';
    } else {
      html += '<div class="ystat-list">';
      st.years.forEach(y=>{
        html += '<div class="ystat-row" data-action="jumpBillYear" data-y="'+y.year+'">'+
          '<div class="ystat-y">'+y.year+' 年'+(y.backfill?' <span class="badge">含补录</span>':'')+'</div>'+
          '<div class="ystat-i">收 '+fmt(y.inc)+'</div>'+
          '<div class="ystat-e">支 '+fmt(y.exp)+'</div>'+
          '<div class="ystat-b'+(y.bal<0?' neg':'')+'">结余 '+fmt(y.bal)+'</div>'+
          '</div>';
      });
      html += '</div><div class="mstat-legend">点任意年份可切到「月账单」查看该年 12 个月明细</div>';
    }
    html += '</div>';
    const bf = State.accounts.filter(t=> t.source==='yearly-backfill').sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    if(bf.length>0){
      html += '<div class="card"><div class="card-title">🗂 补录记录<span style="flex:1"></span><span class="mc-stat-inline">'+bf.length+' 笔</span></div><div class="list">';
      bf.forEach(t=>{
        html += '<div class="item">'+
          '<div class="q-ic" style="width:40px;height:40px">🗂</div>'+
          '<div class="body"><div class="title">'+t.date.slice(0,4)+' 年补录 · '+(t.type==='income'?'收入':'支出')+'</div>'+
          '<div class="sub">'+esc(t.note||'历史补录')+'</div></div>'+
          '<div class="title" style="color:'+(t.type==='income'?'var(--good)':'var(--bad)')+'">'+(t.type==='income'?'+':'-')+fmt(t.amount)+'</div>'+
          '<button class="btn btn-danger btn-sm" data-action="delBackfill" data-id="'+t.id+'">删除</button>'+
          '</div>';
      });
      html += '</div></div>';
    }
  }

  /* ======== 底部【新】趋势查询（支出/收入 + 周/月/年 + 折线图 + 排行） ======== */
  const q = computeTrendQuery();
  html += '<div class="card"><div class="card-title">📈 趋势查询<span style="flex:1"></span><span class="mc-stat-inline">新增</span></div>';
  /* 支出 / 收入 */
  html += '<div class="seg" style="margin-bottom:12px">'+
    '<div class="seg-btn'+(trendType==='expense'?' active':'')+'" data-action="setTrendType" data-t="expense">支出 ▾</div>'+
    '<div class="seg-btn'+(trendType==='income'?' active':'')+'" data-action="setTrendType" data-t="income">收入</div>'+
    '</div>';
  /* 周 / 月 / 年 */
  html += '<div class="ai-tabs" style="margin-bottom:12px">'+
    '<div class="ai-tab'+(acctTrendView==='week'?' active':'')+'" data-action="setTrendView" data-v="week">周</div>'+
    '<div class="ai-tab'+(acctTrendView==='month'?' active':'')+'" data-action="setTrendView" data-v="month">月</div>'+
    '<div class="ai-tab'+(acctTrendView==='year'?' active':'')+'" data-action="setTrendView" data-v="year">年</div>'+
    '</div>';
  /* 时间导航 */
  if(acctTrendView==='week'){
    const mon=acctWeekMonday(), sun=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);
    html += '<div class="month-switch">'+
      '<button class="btn btn-sm btn-soft" data-action="prevTrendWeek">‹ 上周</button>'+
      '<div class="month-title">'+q.rangeLabel+'</div>'+
      '<button class="btn btn-sm btn-soft" data-action="nextTrendWeek">下周 ›</button></div>'+
      (acctWeekMon? '<div style="text-align:center"><button class="btn btn-sm" data-action="backTrendWeek">↩ 回到本周</button></div>':'');
  } else if(acctTrendView==='month'){
    const yr=acctTrendYear(), mo=acctTrendMonth();
    html += '<div class="month-switch">'+
      '<button class="btn btn-sm btn-soft" data-action="prevTrendMonth">‹ '+mo+'月</button>'+
      '<div class="month-title">'+yr+' 年'+(yr===(new Date()).getFullYear()&&mo===(new Date()).getMonth()+1?'<span class="mcur">本月</span>':'')+'</div>'+
      '<button class="btn btn-sm btn-soft" data-action="nextTrendMonth">'+mo+'月 ›</button></div>'+
      ((acctTrendMonthCursor||acctTrendYearCursor)? '<div style="text-align:center"><button class="btn btn-sm" data-action="backTrendMonth">↩ 回到本月</button></div>':'');
  } else {
    const yr=acctTrendYear();
    html += '<div class="month-switch">'+
      '<button class="btn btn-sm btn-soft" data-action="prevTrendYear">‹ '+yr+'</button>'+
      '<div class="month-title">'+yr+' 年'+(yr===(new Date()).getFullYear()?'<span class="mcur">今年</span>':'')+'</div>'+
      '<button class="btn btn-sm btn-soft" data-action="nextTrendYear">'+yr+' ›</button></div>'+
      (acctTrendYearCursor? '<div style="text-align:center"><button class="btn btn-sm" data-action="backTrendYear">↩ 回到今年</button></div>':'');
  }
  /* 总额 + 均值 */
  const totLabel = trendType==='income'?'总收入':'总支出';
  html += '<div class="stat-row">'+
    '<div class="stat'+(trendType==='income'?' income':' expense')+'"><div class="label">'+totLabel+'</div><div class="val">'+fmt(q.total)+'</div></div>'+
    '<div class="stat"><div class="label">日均</div><div class="val">'+fmt(q.avg)+'</div></div>'+
    '</div>';
  html += '<div style="margin-top:8px"><div class="card-title" style="margin:0 0 6px;font-size:13px">📉 '+(trendType==='income'?'收入':'支出')+'走势 · '+q.rangeLabel+'</div>'+
    renderLineChart(q)+'</div>';
  html += '<div style="margin-top:8px"><div class="card-title" style="margin:0 0 6px;font-size:13px">🏆 '+(trendType==='income'?'收入来源':'支出')+'排行</div>'+
    renderRankList(q)+'</div>';
  html += '</div>';

  html += '</div>';
  $('#content').innerHTML = html;
};
/* 补录年度数据：写 source:'yearly-backfill'，日期用 YYYY-12-31 */
function openBackfillForm(){
  const thisY = (new Date()).getFullYear();
  formModal('＋ 补录年度数据', [
    {key:'year',label:'年份',type:'number',value:String(thisY-1),placeholder:'例如 2025'},
    {key:'inc',label:'年收入（可留空）',type:'number',value:'',placeholder:'0.00'},
    {key:'exp',label:'年支出（可留空）',type:'number',value:'',placeholder:'0.00'},
    {key:'note',label:'备注',value:'历史补录',placeholder:'选填'}
  ], d=>{
    const y = parseInt(d.year,10);
    if(isNaN(y) || y<1970 || y>2200){ toast('请输入有效年份','bad'); return; }
    const inc = parseFloat(d.inc), exp = parseFloat(d.exp);
    const hasInc = !isNaN(inc) && inc>0, hasExp = !isNaN(exp) && exp>0;
    if(!hasInc && !hasExp){ toast('至少填写年收入或年支出','bad'); return; }
    const date = y+'-12-31';
    if(hasInc) State.accounts.push({ id:uid(), type:'income', cat:'其他', amount:round2(inc),
      note:(d.note||'历史补录')+' · '+y+'年收入', date, time:'23:59', created:Date.now(), source:'yearly-backfill', accountId:'' });
    if(hasExp) State.accounts.push({ id:uid(), type:'expense', cat:'其他', amount:round2(exp),
      note:(d.note||'历史补录')+' · '+y+'年支出', date, time:'23:59', created:Date.now(), source:'yearly-backfill', accountId:'' });
    save('accounts');
    toast(y+' 年数据已补录','good');
    refreshAcct();
  });
}

/* =============================================================================
 * 我的账本 · 二级页 3：资产管家（资产卡 + 负债卡 + 默认收支卡）
 * =========================================================================== */
PAGES.accountAsset = function(){
  const assets = State.assets.filter(a=> a.kind!=='liability');
  const liabs  = State.assets.filter(a=> a.kind==='liability');
  const totalAsset = round2(assets.reduce((s,a)=>s+(a.balance||0),0));
  const totalLiab  = round2(liabs.reduce((s,a)=>s+Math.abs(a.balance||0),0));
  const net = round2(totalAsset - totalLiab);
  const dPay = findDefault('pay'), dInc = findDefault('income');

  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">🏦 资产管家'+
    '<span style="flex:1"></span><button class="btn btn-sm" data-action="pwdSet">🔐 '+(State.settings.accountPwd?'已加密':'未加密')+'</button></div>';
  html += '<div class="stat-row">'+
    '<div class="stat income"><div class="label">总资产</div><div class="val">'+fmt(totalAsset)+'</div></div>'+
    '<div class="stat expense"><div class="label">总负债</div><div class="val">'+fmt(totalLiab)+'</div></div>'+
    '<div class="stat'+(net<0?' expense':'')+'"><div class="label">净资产</div><div class="val">'+fmt(net)+'</div></div>'+
    '</div>';
  html += '<div class="acct-bind">💳 默认支出：<b>'+(dPay?esc(dPay.name):'未绑定')+'</b> ｜ 💰 默认收入：<b>'+(dInc?esc(dInc.name):'未绑定')+'</b>'+
    '<div class="acct-bind-tip">未绑定时，记账不影响任何卡片余额</div></div>';
  html += '</div>';

  html += '<div class="card"><div class="card-title">💳 我的卡片</div>';
  html += '<div class="toolbar">'+
    '<button class="btn btn-primary btn-sm" data-action="addAsset">＋ 资产</button>'+
    '<button class="btn btn-sm btn-soft" data-action="addLiability">＋ 负债</button>'+
    '</div>';
  if(State.assets.length===0){
    html += '<div class="empty"><div class="big">🏦</div>还没有卡片。添加资产（储蓄卡/现金/理财）或负债（信用卡/花呗/贷款）</div>';
  } else {
    html += '<div class="acct-list">';
    const order = assets.concat(liabs);
    order.forEach(a=>{
      const isLiab = a.kind==='liability';
      const defTag = a.isDefaultPay?' <span class="acct-tag-pay">已设默认支出</span>'
                  : a.isDefaultIncome?' <span class="acct-tag-inc">已设默认收入</span>' : '';
      html += '<div class="acct-card'+(isLiab?' acct-liab':'')+'">'+
        '<div class="acct-ic">'+(a.icon||(isLiab?'🧾':'💳'))+'</div>'+
        '<div class="acct-body">'+
          '<div class="acct-name">'+esc(a.name)+(isLiab?' <span class="badge liab">负债</span>':'')+defTag+'</div>'+
          '<div class="acct-sub">'+esc(a.bank||'—')+' · 更新于 '+(a.updated||'—')+
            ((a.log && a.log[0]) ? ' · 上次'+(a.log[0].d>0?'+':'')+fmt(a.log[0].d) : '')+'</div>'+
        '</div>'+
        '<div class="acct-bal" style="color:'+(isLiab?'var(--bad)':'var(--primary)')+'">'+fmt(a.balance)+'</div>'+
        '<div class="acct-acts">'+
          '<button class="btn btn-sm'+(a.isDefaultPay?' btn-primary':' btn-soft')+'" data-action="setPay" data-id="'+a.id+'" title="'+(a.isDefaultPay?'取消默认支出卡':'设为默认支出卡')+'">💳 支</button>'+
          '<button class="btn btn-sm'+(a.isDefaultIncome?' btn-primary':' btn-soft')+'" data-action="setInc" data-id="'+a.id+'" title="'+(a.isDefaultIncome?'取消默认收入卡':'设为默认收入卡')+'">💰 收</button>'+
          '<button class="btn btn-sm btn-soft" data-action="adjustAsset" data-id="'+a.id+'" title="增减卡片余额（每次变动记录时间）">🔧 调整</button>'+
          '<button class="btn btn-sm" data-action="editAsset" data-id="'+a.id+'">编辑</button>'+
          '<button class="btn btn-danger btn-sm" data-action="delAsset" data-id="'+a.id+'">删除</button>'+
        '</div>'+
      '</div>';
    });
    html += '</div>';
  }
  html += '<div class="mstat-legend">「💳 支」「💰 收」可随时切换默认卡；负债卡余额以负数记账，支出会加深负债</div>';
  html += '</div></div>';
  $('#content').innerHTML = html;
};

function txForm(title, prefill, onOk){
  const dPay = findDefault('pay'), dInc = findDefault('income');
  const defLabel = '跟随默认卡'+(dPay||dInc ? '（支出→'+(dPay?dPay.name:'无')+' / 收入→'+(dInc?dInc.name:'无')+'）' : '（暂未设默认卡）');
  const cardOpts = [{value:'__def__',text:defLabel},{value:'',text:'不绑卡（不影响资产）'}]
    .concat(State.assets.map(a=>({ value:a.id, text:(a.kind==='liability'?'🧾 ':'💳 ')+a.name })));
  formModal(title, [
    {key:'type',label:'类型',type:'select',value:prefill.type||'expense',options:[{value:'expense',text:'支出'},{value:'income',text:'收入'}]},
    {key:'cat',label:'分类',type:'select',value:prefill.cat||'餐饮',options:ACCOUNT_ALL.map(c=>({value:c.key,text:c.key}))},
    {key:'amount',label:'金额',type:'number',value:prefill.amount||'',placeholder:'0.00'},
    {key:'note',label:'备注',value:prefill.note||'',placeholder:'选填'},
    {key:'date',label:'日期',type:'text',value:prefill.date||todayStr()},
    {key:'accountId',label:'归属卡片',type:'select',value:(prefill.accountId!==undefined?prefill.accountId:'__def__'),options:cardOpts}
  ], d=>{
    const amt = parseFloat(d.amount);
    if(isNaN(amt)||amt<=0){ toast('请输入有效金额','bad'); return; }
    onOk(d, round2(amt));
  });
}
/* 卡片表单（资产/负债共用）。isLiab=true 时余额以负数存储 */
function assetForm(a, isLiab){
  const isEdit = !!a;
  const kindLiab = isEdit ? (a.kind==='liability') : !!isLiab;
  const title = (isEdit?'编辑':'添加')+(kindLiab?'负债':'资产')+'卡片'+(isEdit?' · '+a.name:'');
  const balLabel = kindLiab ? '当前欠款金额（正数填写）' : '当前余额';
  formModal(title, [
    {key:'name',label:'卡片名称（自定义）',value:isEdit?a.name:'',placeholder:kindLiab?'例如：招行信用卡 / 花呗':'例如：工资卡 / 现金'},
    {key:'bank',label:'机构名称',value:isEdit?(a.bank||''):'',placeholder:kindLiab?'例如：招商银行':'例如：招商银行'},
    {key:'balance',label:balLabel,type:'number',value:isEdit?String(Math.abs(a.balance||0)):'',placeholder:'0.00'},
    {key:'icon',label:'图标',value:isEdit?(a.icon||''):(kindLiab?'🧾':'💳'),placeholder:'emoji'},
    {key:'isDefaultPay',label:'设为默认支出卡',type:'select',value:(isEdit&&a.isDefaultPay)?'1':'0',options:[{value:'0',text:'否'},{value:'1',text:'是'}]},
    {key:'isDefaultIncome',label:'设为默认收入卡',type:'select',value:(isEdit&&a.isDefaultIncome)?'1':'0',options:[{value:'0',text:'否'},{value:'1',text:'是'}]}
  ], d=>{
    if(!d.name){ toast('请输入名称','bad'); return; }
    const raw = parseFloat(d.balance);
    if(isNaN(raw)){ toast('请输入有效金额','bad'); return; }
    const bal = kindLiab ? -Math.abs(round2(raw)) : round2(raw);
    let card;
    if(isEdit){
      a.name=d.name; a.bank=d.bank; a.balance=bal; a.icon=d.icon||(kindLiab?'🧾':'💳'); a.updated=nowStr();
      card = a;
    } else {
      card = { id:uid(), name:d.name, bank:d.bank, balance:bal, icon:d.icon||(kindLiab?'🧾':'💳'),
               kind: kindLiab?'liability':'asset', isDefaultPay:false, isDefaultIncome:false, updated:nowStr() };
      State.assets.push(card);
    }
    if(d.isDefaultPay==='1') setDefault('pay', card.id, true); else if(card.isDefaultPay) setDefault('pay','',false);
    if(d.isDefaultIncome==='1') setDefault('income', card.id, true); else if(card.isDefaultIncome) setDefault('income','',false);
    save('assets'); toast(isEdit?'已更新':'已添加','good'); refreshAcct();
  });
}

const ACCOUNT_ACTIONS = {
  pwdSet(){ openPwdSettings('account'); },
  /* ---- 月份 / 视图切换 ---- */
  prevMonth(){ acctMonthCursor = shiftYM(acctYM(), -1); PAGES.accountMonth(); },
  nextMonth(){ acctMonthCursor = shiftYM(acctYM(),  1); PAGES.accountMonth(); },
  backToCur(){ acctMonthCursor = ''; PAGES.accountMonth(); },
  setMView(id, el){ mAccountSubView = el.dataset.v || 'overview'; PAGES.accountMonth(); },
  openAcctDay(id, el){
    mAccountSubView = 'detail';
    acctJumpDay = el.dataset.day;
    PAGES.accountMonth();
    setTimeout(()=>{
      const tgt = document.querySelector('.d-grp[data-day="'+acctJumpDay+'"]');
      if(tgt) tgt.scrollIntoView({behavior:'smooth', block:'center'});
      acctJumpDay = '';
    }, 40);
  },
  /* ---- 快速记一笔 ---- */
  setQuickType(id, el){ acctQuickType = el.dataset.t || 'expense'; PAGES.accountQuick(); },
  openCatManager(){ openCatManager(); },
  /* ---- 年月概况 · 顶部 · 账单（月/年 + 12月明细 + 年度补录） ---- */
  setBillView(id, el){ acctBillView = el.dataset.v || 'month'; PAGES.accountYearly(); },
  prevBillYear(){ acctBillYearCursor = acctBillYear()-1; PAGES.accountYearly(); },
  nextBillYear(){ acctBillYearCursor = acctBillYear()+1; PAGES.accountYearly(); },
  jumpBillMonth(id, el){ acctMonthCursor = el.dataset.ym; goto('accountMonth'); },
  jumpBillYear(id, el){ acctBillYearCursor = parseInt(el.dataset.y,10); acctBillView='month'; PAGES.accountYearly(); },
  /* ---- 年月概况 · 底部 · 趋势（支出/收入 + 周/月/年 + 折线图 + 排行） ---- */
  setTrendView(id, el){ acctTrendView = el.dataset.v || 'month'; PAGES.accountYearly(); },
  setTrendType(id, el){ acctTrendType = el.dataset.t || 'expense'; PAGES.accountYearly(); },
  prevTrendWeek(){ const m = acctWeekMonday(); acctWeekMon = fmtYMD(new Date(m.getFullYear(), m.getMonth(), m.getDate()-7)); PAGES.accountYearly(); },
  nextTrendWeek(){ const m = acctWeekMonday(); acctWeekMon = fmtYMD(new Date(m.getFullYear(), m.getMonth(), m.getDate()+7)); PAGES.accountYearly(); },
  backTrendWeek(){ acctWeekMon = ''; PAGES.accountYearly(); },
  prevTrendMonth(){ acctTrendMonthCursor = acctTrendMonth()-1; if(acctTrendMonthCursor<1){ acctTrendMonthCursor=12; acctTrendYearCursor = acctTrendYear()-1; } PAGES.accountYearly(); },
  nextTrendMonth(){ acctTrendMonthCursor = acctTrendMonth()+1; if(acctTrendMonthCursor>12){ acctTrendMonthCursor=1; acctTrendYearCursor = acctTrendYear()+1; } PAGES.accountYearly(); },
  backTrendMonth(){ acctTrendMonthCursor = 0; acctTrendYearCursor = 0; PAGES.accountYearly(); },
  prevTrendYear(){ acctTrendYearCursor = acctTrendYear()-1; PAGES.accountYearly(); },
  nextTrendYear(){ acctTrendYearCursor = acctTrendYear()+1; PAGES.accountYearly(); },
  backTrendYear(){ acctTrendYearCursor = 0; PAGES.accountYearly(); },
  /* ---- 年度补录 ---- */
  backfillYear(){ openBackfillForm(); },
  delBackfill(id){ confirmDialog('删除补录', '确定删除这条年度补录数据吗？', ()=>{
    const t = State.accounts.find(x=>x.id===id);
    if(t) applyTxToAsset(t, -1);
    State.accounts = State.accounts.filter(x=>x.id!==id);
    save('accounts'); save('assets'); toast('已删除'); refreshAcct();
  }); },
  /* ---- 交易 ---- */
  quickAdd(cat, el){ const c = (el && el.dataset.cat) || cat;
    const type = (el && el.dataset.type) || catType(c) || 'expense';
    txForm('记一笔 · '+c, {cat:c, type}, (d,amt)=>{
      const tx = {id:uid(), type:d.type, cat:d.cat, amount:amt, note:d.note, date:d.date, time:nowStr().slice(11,16),
                  created:Date.now(), accountId:resolveTxCard(d), source:'normal'};
      State.accounts.push(tx); applyTxToAsset(tx, +1);
      save('accounts'); save('assets'); toast('已记录','good'); refreshAcct();
    }); },
  addTx(){ txForm('记一笔', {date:acctYM()===monthStr()?todayStr():acctYM()+'-01'}, (d,amt)=>{
    const tx = {id:uid(), type:d.type, cat:d.cat, amount:amt, note:d.note, date:d.date, time:nowStr().slice(11,16),
                created:Date.now(), accountId:resolveTxCard(d), source:'normal'};
    State.accounts.push(tx); applyTxToAsset(tx, +1);
    save('accounts'); save('assets'); toast('已记录','good'); refreshAcct();
  }); },
  editTx(id){
    const t = State.accounts.find(x=>x.id===id); if(!t) return;
    txForm('编辑账目', {type:t.type, cat:t.cat, amount:t.amount, note:t.note, date:t.date, accountId:(t.accountId||'')}, (d,amt)=>{
      applyTxToAsset(t, -1);                      // 先撤销旧影响
      t.type=d.type; t.cat=d.cat; t.amount=amt; t.note=d.note; t.date=d.date;
      t.accountId = resolveTxCard(d);
      applyTxToAsset(t, +1);                      // 再应用新影响
      save('accounts'); save('assets'); toast('已更新','good'); refreshAcct();
    });
  },
  delTx(id){ confirmDialog('删除记录', '确定删除这条账目吗？（若已绑卡，卡片余额会同步回补）', ()=>{
    const t = State.accounts.find(x=>x.id===id);
    if(t) applyTxToAsset(t, -1);
    State.accounts = State.accounts.filter(x=>x.id!==id);
    save('accounts'); save('assets'); toast('已删除'); refreshAcct();
  }); },
  batchToggle(){ toggleBatch('account'); },
  sel(id){ toggleSel('account', id); },
  batchDel(){ const b=batch.account; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 条账目吗？（绑卡的会同步回补余额）', ()=>{
      State.accounts.forEach(t=>{ if(b.sel.has(t.id)) applyTxToAsset(t, -1); });
      State.accounts = State.accounts.filter(x=>!b.sel.has(x.id));
      save('accounts'); save('assets'); b.sel.clear(); b.on=false; toast('已删除'); refreshAcct();
    }); },
  /* ---- 月预算 ---- */
  openBudget(){ openBudgetModal(acctYM()); },
  /* ---- 固定收支 ---- */
  addRecurring(){ openRecurringForm(null); },
  editRecurring(id){ const r = State.recurring.find(x=>x.id===id); if(r) openRecurringForm(r); },
  delRecurring(id){ confirmDialog('删除固定收支', '确定删除该固定收支条目吗？（已自动入账的账目不会被删除）', ()=>{
    State.recurring = State.recurring.filter(x=>x.id!==id); save('recurring'); toast('已删除'); refreshAcct();
  }); },
  toggleRecurring(id){ const r = State.recurring.find(x=>x.id===id); if(!r) return;
    r.paused = !r.paused; save('recurring'); toast(r.paused?'已暂停':'已恢复'); refreshAcct();
  },
  /* ---- 资产管家 ---- */
  addAsset(){ assetForm(null, false); },
  addLiability(){ assetForm(null, true); },
  editAsset(id){ const a = State.assets.find(x=>x.id===id); if(a) assetForm(a); },
  setPay(id){ const a = State.assets.find(x=>x.id===id); if(!a) return;
    const on = !a.isDefaultPay; setDefault('pay', id, on);
    save('assets'); toast(on?('默认支出卡 → '+a.name):'已取消默认支出卡','good'); refreshAcct();
  },
  setInc(id){ const a = State.assets.find(x=>x.id===id); if(!a) return;
    const on = !a.isDefaultIncome; setDefault('income', id, on);
    save('assets'); toast(on?('默认收入卡 → '+a.name):'已取消默认收入卡','good'); refreshAcct();
  },
  delAsset(id){ const a = State.assets.find(x=>x.id===id); if(!a) return;
    const bound = State.accounts.filter(t=> t.accountId===id).length;
    const extra = (a.isDefaultPay||a.isDefaultIncome) ? '该卡是默认卡，删除后将自动解绑。' : '';
    confirmDialog('删除卡片', '确定删除「'+a.name+'」吗？'+extra+(bound>0?('已有 '+bound+' 笔账目绑定此卡，账目会保留但不再联动余额。'):''), ()=>{
      State.assets = State.assets.filter(x=>x.id!==id);
      save('assets'); toast('已删除'); refreshAcct();
    }); },
  /* 单卡余额调整（增 / 减，每次变动写入时间 + 变动记录） */
  adjustAsset(id){
    const a = State.assets.find(x=>x.id===id); if(!a) return;
    const isLiab = a.kind==='liability';
    formModal('🔧 调整余额 · '+a.name, [
      { key:'amount', label:'变动金额', type:'number', value:'', placeholder:'0.00' },
      { key:'dir', label:'方向', type:'select', value:'add', options:[{value:'add',text:'＋ 增加余额'}, {value:'sub',text:'− 减少余额'}] },
      { key:'note', label:'备注', value:'', placeholder:'选填（如：工资到账 / 还款 / 利息）' }
    ], d=>{
      const amt = round2(parseFloat(d.amount));
      if(isNaN(amt) || amt<=0){ toast('请输入有效金额','bad'); return; }
      const sign = d.dir==='sub' ? -1 : 1;
      a.balance = round2(a.balance + sign*amt);
      a.updated = nowStr();
      a.log = a.log || [];
      a.log.unshift({ t: nowStr(), d: sign*amt, note:(d.note||'').trim() });
      if(a.log.length>50) a.log.length = 50;
      save('assets');
      toast((sign>0?'已增加 ':'已减少 ')+fmt(amt)+(isLiab?'（负债变动）':''), 'good');
      refreshAcct();
    });
  },
  smartAdd(){ openSmartModal(); },
  ocrAdd(){ startOcrImport(); }
};
ACTIONS.account       = ACCOUNT_ACTIONS;  // 兼容旧 key
ACTIONS.accountQuick  = ACCOUNT_ACTIONS;
ACTIONS.accountMonth  = ACCOUNT_ACTIONS;
ACTIONS.accountYearly = ACCOUNT_ACTIONS;
ACTIONS.accountAsset  = ACCOUNT_ACTIONS;

/* =============================================================================
 * 自然语言记账解析引擎（智能输入）
 * =========================================================================== */

/* 账本页统计聚合：按年 + 今年按月 */
function computeAccountStats(){
  const curY = (new Date()).getFullYear();
  // 初始化今年12月（0支出+0收入）
  const thisYearMonths = [];
  for(let m=1; m<=12; m++){
    thisYearMonths.push({ m, exp:0, inc:0 });
  }
  const yearMap = {};
  State.accounts.forEach(t=>{
    if(!t.date || t.date.length<7) return;
    const y = parseInt(t.date.slice(0,4),10);
    const m = parseInt(t.date.slice(5,7),10);
    if(isNaN(y) || isNaN(m)) return;
    if(!yearMap[y]) yearMap[y] = { year:y, exp:0, inc:0 };
    if(t.type==='expense'){
      yearMap[y].exp += t.amount;
      if(y===curY) thisYearMonths[m-1].exp += t.amount;
    } else if(t.type==='income'){
      yearMap[y].inc += t.amount;
      if(y===curY) thisYearMonths[m-1].inc += t.amount;
    }
  });
  const years = Object.values(yearMap).sort((a,b)=> b.year-a.year);
  return { thisYearMonths, years, curYear:curY };
}

/* ----------------------------- 预算（按分类设月度上限） ----------------------------- */
// 月份格式：YYYY-MM
const curYM = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
};
// 计算某月各分类实际支出（含转账过滤？当前实现：仅支出；不计入固定收支生成的）
function computeMonthExpenseByCat(yyyyMM){
  const map = {};
  State.accounts.forEach(t=>{
    if(t.type!=='expense') return;
    if((t.date||'').slice(0,7) !== yyyyMM) return;
    map[t.cat] = (map[t.cat]||0) + t.amount;
  });
  return map;
}
// 计算预算进度（已花 / 预算 / 超支额）
function computeBudgetProgress(yyyyMM){
  const budgets = State.budgets[yyyyMM] || {};
  const exp = computeMonthExpenseByCat(yyyyMM);
  return Object.keys(budgets).map(cat=>{
    const budget = budgets[cat]||0;
    const used = exp[cat]||0;
    return { cat, budget, used, over: used - budget, pct: budget>0 ? Math.min(100, Math.round(used/budget*100)) : 0 };
  }).sort((a,b)=> b.used-a.used);
}
// 打开预算管理弹窗：逐分类设置金额
function openBudgetModal(ym){
  const yyyyMM = ym || curYM();
  if(!State.budgets[yyyyMM]) State.budgets[yyyyMM] = {};
  const cur = State.budgets[yyyyMM];
  const fields = ACCOUNT_ALL.map(c=>({
    key:c.key, label:c.icon+' '+c.key, type:'number',
    value: (cur[c.key]!=null ? cur[c.key] : ''),
    placeholder:'不设则留空'
  }));
  fields.push({key:'_tip', label:'💡 留空表示该分类不设限额；按分类设预算可防止某类超支。', type:'text', value:'', placeholder:''});
  formModal('📊 月度预算 · '+yyyyMM, fields, d=>{
    ACCOUNT_ALL.forEach(c=>{
      const v = parseFloat(d[c.key]);
      if(isNaN(v) || v<=0){ delete cur[c.key]; }
      else cur[c.key] = v;
    });
    State.budgets[yyyyMM] = cur;
    save('budgets');
    toast('预算已保存','good');
    refreshAcct();
  });
}

/* ----------------------------- 饼图（纯 SVG） ----------------------------- */
const PIE_COLORS = ['#ff8a8a','#ffb878','#fdd55c','#82d4a6','#6cc4d1','#9a8cf0','#cf8ce0','#f48fb1','#a0aec0','#5a8dee'];
function renderExpenseDonut(yyyyMM){
  const exp = computeMonthExpenseByCat(yyyyMM);
  const cats = Object.keys(exp).filter(k=> exp[k]>0).sort((a,b)=> exp[b]-exp[a]);
  const total = cats.reduce((s,k)=> s+exp[k], 0);
  if(total===0){
    return '<div class="empty" style="padding:14px">本月还没有支出，记账后这里会出现分类占比</div>';
  }
  // SVG 圆环：r=70, cx/cy=100
  let segments = '';
  let acc = 0;
  cats.forEach((c, i)=>{
    const v = exp[c];
    const frac = v/total;
    const startA = acc * Math.PI * 2 - Math.PI/2;
    const endA = (acc + frac) * Math.PI * 2 - Math.PI/2;
    acc += frac;
    const x1 = 100 + 70*Math.cos(startA), y1 = 100 + 70*Math.sin(startA);
    const x2 = 100 + 70*Math.cos(endA), y2 = 100 + 70*Math.sin(endA);
    const large = frac > 0.5 ? 1 : 0;
    const fill = PIE_COLORS[i % PIE_COLORS.length];
    segments += '<path d="M100,100 L'+x1.toFixed(1)+','+y1.toFixed(1)+' A70,70 0 '+large+' 1 '+x2.toFixed(1)+','+y2.toFixed(1)+' Z" fill="'+fill+'" stroke="#fff" stroke-width="1.5"/>';
  });
  // 图例
  const legend = cats.map((c, i)=>{
    const fill = PIE_COLORS[i % PIE_COLORS.length];
    return '<div class="pie-leg"><span class="pie-dot" style="background:'+fill+'"></span><span class="pie-c">'+esc(c)+'</span><span class="pie-v">'+fmt(exp[c])+'</span><span class="pie-p">'+Math.round(exp[c]/total*100)+'%</span></div>';
  }).join('');
  return '<div class="pie-wrap"><svg viewBox="0 0 200 200" class="pie-svg">'+segments+'<circle cx="100" cy="100" r="42" fill="var(--card)"/><text x="100" y="96" text-anchor="middle" class="pie-tot">总支出</text><text x="100" y="118" text-anchor="middle" class="pie-amo">'+fmt(total)+'</text></svg><div class="pie-legend">'+legend+'</div></div>';
}

/* ----------------------------- 固定收支（周期入账） ----------------------------- */
// 判断今日是否应入账（与 lastAdded 比较；cycle='monthly'：同月不入；'weekly'：同周不入；'day'：同日不入）
function shouldAddRecurring(r, today){
  if(r.paused) return false;
  if(!r.lastAdded){ return true; }
  const last = r.lastAdded;
  if(r.cycle==='monthly'){
    return today.slice(0,7) !== last.slice(0,7); // 跨月入账
  }
  if(r.cycle==='weekly'){
    // 周一为周首；同周不入账
    const w = d => { const day = (new Date(d+'T00:00:00')).getDay(); return new Date(d+'T00:00:00').getTime() - (day===0?6:day-1)*86400000; };
    return Math.abs(w(today) - w(last)) >= 7*86400000;
  }
  return today !== last;
}
function addRecurringToday(today){
  let added = 0;
  State.recurring.forEach(r=>{
    if(!shouldAddRecurring(r, today)) return;
    const dc = findDefault(r.type==='income' ? 'income' : 'pay');
    const tx = {
      id: uid(), type:r.type, cat:r.cat, amount:round2(r.amount),
      note:(r.note?r.note:'')+' · [固定]', date:today, time: nowStr().slice(11,16),
      created: Date.now(), recurringId:r.id, source:'recurring',
      accountId: dc ? dc.id : ''
    };
    State.accounts.unshift(tx);
    applyTxToAsset(tx, +1);
    r.lastAdded = today;
    added++;
  });
  if(added>0){ save('recurring'); save('assets'); }
  return added;
}
function openRecurringForm(r){
  const isEdit = !!r;
  const pre = r || { type:'expense', cat:'居家', amount:'', cycle:'monthly', day:1, name:'', note:'', paused:false };
  formModal((isEdit?'编辑':'新增')+'固定收支', [
    {key:'name',label:'名称',value:pre.name,placeholder:'例如：房租 / 工资 / Netflix'},
    {key:'type',label:'类型',type:'select',value:pre.type,options:[{value:'expense',text:'支出'},{value:'income',text:'收入'}]},
    {key:'cat',label:'分类',type:'select',value:pre.cat,options:ACCOUNT_ALL.map(c=>({value:c.key,text:c.key}))},
    {key:'amount',label:'金额',type:'number',value:String(pre.amount||''),placeholder:'0.00'},
    {key:'cycle',label:'周期',type:'select',value:pre.cycle,options:[{value:'monthly',text:'每月'},{value:'weekly',text:'每周'},{value:'day',text:'每天'}]},
    {key:'day',label:'每月几号（仅每月）',type:'number',value:String(pre.day||1),placeholder:'1-31'},
    {key:'note',label:'备注',value:pre.note||'',placeholder:'选填'}
  ], d=>{
    const amt = parseFloat(d.amount);
    if(isNaN(amt)||amt<=0){ toast('请输入有效金额','bad'); return; }
    if(!d.name){ toast('请输入名称','bad'); return; }
    const obj = {
      id: pre.id || uid(),
      name: d.name,
      type: d.type,
      cat: d.cat,
      amount: amt,
      cycle: d.cycle,
      day: parseInt(d.day,10)||1,
      note: d.note||'',
      paused: pre.paused||false,
      lastAdded: pre.lastAdded||''
    };
    if(isEdit){
      const i = State.recurring.findIndex(x=>x.id===pre.id);
      if(i>=0) State.recurring[i] = obj;
    } else {
      State.recurring.push(obj);
    }
    save('recurring');
    toast(isEdit?'已更新':'已新增','good');
    refreshAcct();
  });
}

const CAT_DICT = [
  [/(工资|薪水|薪酬|月薪|底薪|提成|奖金|绩效|年终|分红|补贴|社保返|公积金)/, '工资'],
  [/(红包|份子|随礼|礼金)/, '红包'],
  // 餐饮：含早午晚餐、宵夜、吃喝类启发式（吃XX/喝XX 默认餐饮，除非是吃药/吃亏 等非饮食场景）
  [/(早饭|早茶|早餐|午饭|午餐|晚饭|晚餐|夜宵|宵夜|吃饭|就餐|聚餐|外卖|食堂|餐厅|饭馆|火锅|烧烤|麻辣|面馆|米饭|面食|面条|包子|饺子|粥|零食|水果|奶茶|咖啡|饮料|酒|菜|餐饮|食|糖水|甜品|蛋糕|面包|点心)/, '餐饮'],
  // 吃喝启发式：「吃」+ 1~2字非医非亏；「喝」+ 1~2字非医（水/汤/茶/奶/酒等统统算餐饮；吃药/吃亏不算）
  [/^吃[^药亏损字\d]{1,3}/, '餐饮'],
  [/^喝[^药液剂\d]{1,3}/, '餐饮'],
  [/(打车|出租|滴滴|网约车|地铁|公交|客车|高铁|火车|动车|机票|飞机|油费|加油|停车|过路|高速|骑行|单车|摩的|出行|交通)/, '交通'],
  [/(买|购|下单|京东|淘宝|天猫|拼多多|超市|便利店|商店|商场|衣服|服饰|鞋|包|数码|手机|电脑|家电|日用品|化妆品|护肤|百货)/, '购物'],
  [/(书|课本|教材|课|培训|学费|网课|辅导|考试|资料|文具|学习|进修)/, '学习'],
  [/(电影|游戏|会员|视频|小说|漫画|追星|演唱会|演出|游乐|游乐园|旅游|景点|门票|KTV|酒吧|娱乐)/, '娱乐'],
  [/(水费|电费|燃气|煤气|物业|房租|网费|宽带|家具|装修|清洁|家政|维修|居家)/, '居家'],
  [/(药|医院|挂号|看诊|门诊|急诊|体检|牙|口腔|眼镜|医疗)/, '医疗']
];
function cnNumToNum(s){
  const d = {'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000,'亿':1e8};
  if(/[零一二两三四五六七八九十百千万亿]/.test(s)===false) return NaN;
  let total=0, sec=0, num=0;
  for(const ch of s){ if(d[ch]===undefined) continue; const v=d[ch];
    if(v<10){ num = (num===0 && ch!=='零')? v : (num*10+v); }
    else if(v<10000){ sec += (num||1)*v; num=0; }
    else { total += (sec||0)*v; sec=0; num=0; }
  }
  return total + sec + num;
}
function parseAmount(s){
  const m = s.match(/([0-9]+(?:[.][0-9]+)?)/);
  if(m) return parseFloat(m[1]);
  const cn = s.match(/[零一二两三四五六七八九十百千万亿]+/);
  if(cn) return cnNumToNum(cn[0]);
  return NaN;
}
function parseDate(s){
  const today = new Date(); const y=today.getFullYear(), m=today.getMonth(), d=today.getDate();
  // 1) 8 位连续数字 YYYYMMDD（如 20260817）
  const m8 = /(20[0-9]{2}|19[0-9]{2})([0-9]{2})([0-9]{2})/.exec(s.replace(/\s/g,''));
  if(m8){ const yy=+m8[1], mm=+m8[2], dd=+m8[3]; if(mm>=1&&mm<=12&&dd>=1&&dd<=31) return yy+'-'+pad(mm)+'-'+pad(dd); }
  // 2) 中文 年+月+日（如 2026年8月17日）
  let c = /([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})[日号]?/.exec(s);
  if(c){ const yy=+c[1], mm=+c[2], dd=+c[3]; if(mm>=1&&mm<=12&&dd>=1&&dd<=31) return yy+'-'+pad(mm)+'-'+pad(dd); }
  // 3) 中文 年+月（无日）→ 日=当日
  c = /([0-9]{4})年([0-9]{1,2})月/.exec(s);
  if(c){ const yy=+c[1], mm=+c[2]; if(mm>=1&&mm<=12) return yy+'-'+pad(mm)+'-'+pad(d); }
  // 4) 仅年（如 2026年）→ 月日=当日
  c = /([0-9]{4})年/.exec(s);
  if(c){ const yy=+c[1]; return yy+'-'+pad(m+1)+'-'+pad(d); }
  // 5) 横线/点 年+月+日（如 2026-8-17）
  c = /([0-9]{4})[-/.]([0-9]{1,2})[-/.]([0-9]{1,2})/.exec(s);
  if(c){ const yy=+c[1], mm=+c[2], dd=+c[3]; if(mm>=1&&mm<=12&&dd>=1&&dd<=31) return yy+'-'+pad(mm)+'-'+pad(dd); }
  // 6) 横线/点 年+月（无日）→ 日=当日
  c = /([0-9]{4})[-/.]([0-9]{1,2})/.exec(s);
  if(c){ const yy=+c[1], mm=+c[2]; if(mm>=1&&mm<=12) return yy+'-'+pad(mm)+'-'+pad(d); }
  // 7) 月+日（无年）→ 年=当年
  c = /([0-9]{1,2})月([0-9]{1,2})[日号]?/.exec(s);
  if(c){ const mm=+c[1], dd=+c[2]; if(mm>=1&&mm<=12&&dd>=1&&dd<=31) return y+'-'+pad(mm)+'-'+pad(dd); }
  // 8) 仅月（如 8月）→ 年=当年, 日=当日
  c = /([0-9]{1,2})月/.exec(s);
  if(c){ const mm=+c[1]; if(mm>=1&&mm<=12) return y+'-'+pad(mm)+'-'+pad(d); }
  // 9) 仅日（如 17日）→ 年月=当日
  c = /([0-9]{1,2})[日号]/.exec(s);
  if(c){ const dd=+c[1]; if(dd>=1&&dd<=31) return y+'-'+pad(m+1)+'-'+pad(dd); }
  // 10) 相对词：今天/昨天/前天/大前天
  if(/今天/.test(s)) return todayStr();
  let dt = new Date(y,m,d);
  if(/昨天|昨日/.test(s)) dt=new Date(y,m,d-1);
  else if(/前天/.test(s)) dt=new Date(y,m,d-2);
  else if(/大前天/.test(s)) dt=new Date(y,m,d-3);
  else {
    const wk = /(?:周|星期)([一二三四五六日天])/.exec(s);
    if(wk){ const map={'日':0,'天':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6}; const target=map[wk[1]];
      let diff=(target - today.getDay()+7)%7; if(diff===0) diff=7; dt=new Date(y,m,d-diff); }
    else return todayStr(); // 无日期信息 → 当日
  }
  return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
}
function parseType(s){
  if(/(收|到账|薪资|工资|薪|提成|奖金|绩效|分红|返现|返利|退款|报销|转入|盈利|赚|进账|红包收入|收红包|收到红包)/.test(s)) return 'income';
  if(/(发红包|支出|花费|花了|消费|付款|支付|购买|买|付了)/.test(s)) return 'expense';
  return 'expense';
}
function parseOne(s){
  s = (s||'').trim(); if(!s) return null;
  const date = parseDate(s);
  const noDate = s.replace(/(今天|昨天|昨日|前天|大前天|周[一二三四五六日天]|星期[一二三四五六日天]|[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}[日号]?|[0-9]{4}年[0-9]{1,2}月|[0-9]{1,2}月[0-9]{1,2}[日号]?|[0-9]{1,2}月|[0-9]{1,2}[日号]|[0-9]{8}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2})/g, ' ');
  const amount = parseAmount(noDate);
  if(isNaN(amount)||amount<=0) return null;
  const type = parseType(noDate);
  let cat = '其他';
  for(const kv of CAT_DICT){ if(kv[0].test(noDate)){ cat=kv[1]; break; } }
  const CAT_WORDS = CAT_DICT.map(kv=>kv[1]).join('|');
  let note = noDate
    .replace(/[0-9]+(?:[.][0-9]+)?/g,'')
    .replace(/[元块毛角分￥$]/g,'')
    .replace(/(收|到账|薪资|工资|薪|提成|奖金|绩效|分红|返现|返利|退款|报销|转入|盈利|赚|进账|红包收入|收红包|收到红包|发红包|支出|花费|花了|消费|付款|支付|购买|买|付了)/g,'')
    .replace(new RegExp(CAT_WORDS,'g'),'')
    .replace(/[　 \t]+/g,'')
    .slice(0,20);
  return {type, cat, amount: Math.round(amount*100)/100, date, note};
}
function parseBulk(text){
  const segsRaw = [];
  const anchorRe = /今天|昨天|昨日|前天|大前天|周[一二三四五六日天]|星期[一二三四五六日天]|[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}[日号]?|[0-9]{4}年[0-9]{1,2}月|[0-9]{1,2}月[0-9]{1,2}[日号]?|[0-9]{1,2}月|[0-9]{8}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2]/g;
  const anchors = [...(text||'').matchAll(anchorRe)];
  if(anchors.length>=2){
    for(let i=0;i<anchors.length;i++){
      const start = anchors[i].index;
      const end = (i+1<anchors.length)? anchors[i+1].index : (text||'').length;
      const seg = (text||'').slice(start,end).trim();
      if(seg) segsRaw.push(seg);
    }
  } else {
    const norm = (text||'').replace(/[　 \t]+/g,' ').replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n');
    const bySep = norm.split(/[；;，,\\n、]+/).map(x=>x.trim()).filter(Boolean);
    if(bySep.length>=2){ segsRaw.push(...bySep); }
    else if((text||'').trim()){ segsRaw.push((text||'').trim()); }
  }
  const recs = [];
  segsRaw.forEach(seg=>{ const r = parseOne(seg); if(r) recs.push(r); });
  return recs;
}
function openSmartModal(prefill){
  const tip = '支持一次录入多笔：用分隔符（； ; ， , 、 换行）或日期词（今天 / 昨天 / 前天）隔开。金额请使用阿拉伯数字，例如 100、10.5。点击每条左侧分类标签可改分类。';
  const body =
    '<h3>🪄 智能记账</h3>'+
    '<div class="smart-tip">'+esc(tip)+'</div>'+
    '<textarea id="smartInput" class="input smart-area" rows="5" placeholder="例如：\n今天早餐10；打车20；晚餐20\n或：\n今天早餐10 今天打车20 今天发红包100"></textarea>'+
    '<div class="smart-preview-title">实时解析（<span id="smartCount">0</span> 笔）</div>'+
    '<div id="smartPreview" class="smart-preview"><div class="smart-empty">在上方输入，这里会实时显示解析结果</div></div>'+
    '<div class="modal-actions">'+
      '<button class="btn" data-x="cancel">取消</button>'+
      '<button class="btn btn-primary" id="smartOk" data-x="ok">录入 0 笔</button>'+
    '</div>';
  openModal(body);
  const ta = $('#smartInput');
  if(prefill){ ta.value = prefill; }
  // 解析结果存这里（含用户手动改的 cat）
  let parsed = [];
  const render = ()=>{
    parsed = parseBulk(ta.value);
    const pv = $('#smartPreview'); const cnt = $('#smartCount'); const ok = $('#smartOk');
    cnt.textContent = parsed.length; ok.textContent = '录入 '+parsed.length+' 笔';
    if(parsed.length===0){ pv.innerHTML = '<div class="smart-empty">没有可解析的记录，请检查格式（金额用阿拉伯数字）</div>'; return; }
    pv.innerHTML = parsed.map((r,i)=> '<div class="smart-row '+(r.type==='income'?'income':'')+'" data-i="'+i+'">'+
      '<span class="smart-cat" data-action="changeCat" data-i="'+i+'" title="点击更改分类">'+esc(r.cat)+'</span>'+
      '<span class="smart-note">'+esc(r.note||'—')+'</span>'+
      '<span class="smart-date">'+esc(r.date)+'</span>'+
      '<span class="smart-amt">'+(r.type==='income'?'+':'-')+fmt(r.amount)+'</span>'+
    '</div>').join('');
  };
  ta.addEventListener('input', render);
  render();
  // ============== 分类切换 ==============
  const onPvClick = (e)=>{
    const tg = e.target.closest('[data-action="changeCat"]');
    if(!tg) return;
    const i = parseInt(tg.dataset.i,10);
    const r = parsed[i]; if(!r) return;
    const opts = ACCOUNT_ALL.map(c=> '<span class="cat-pick '+(c.key===r.cat?'on':'')+'" data-c="'+esc(c.key)+'">'+c.icon+' '+esc(c.key)+'</span>').join('');
    openModal('<h3>📂 选择分类</h3>'+
      '<div class="cat-grid">'+opts+'</div>'+
      '<div class="modal-actions"><button class="btn" data-x="cancel">取消</button></div>');
    $('#modalRoot').querySelectorAll('.cat-pick').forEach(el=>{
      el.addEventListener('click', ()=>{
        parsed[i].cat = el.dataset.c;
        closeModal();
        render();
      });
    });
    $('#modalRoot').querySelector('[data-x="cancel"]').onclick = closeModal;
  };
  $('#smartPreview').addEventListener('click', onPvClick);
  $('#modalRoot').querySelector('[data-x="cancel"]').onclick = closeModal;
  $('#modalRoot').querySelector('[data-x="ok"]').onclick = ()=>{
    if(parsed.length===0){ toast('没有可解析的记录','bad'); return; }
    parsed.forEach(r=>{
      const dc = findDefault(r.type==='income' ? 'income' : 'pay');
      const tx = {id:uid(), type:r.type, cat:r.cat, amount:round2(r.amount), note:r.note, date:r.date,
                  time:nowStr().slice(11,16), created:Date.now(), source:'normal', accountId: dc?dc.id:''};
      State.accounts.push(tx); applyTxToAsset(tx, +1);
    });
    save('accounts'); save('assets'); closeModal(); toast('已录入 '+parsed.length+' 笔','good'); refreshAcct();
  };
}

/* ============== 图片 OCR 记账（独立入口，不并入 + 填表） ============== */
let _ocrEngineReady = false;
function startOcrImport(){
  const pick = ()=>{
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
    inp.onchange = async (e)=>{
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      if(!window.Tesseract){ toast('OCR 引擎未就绪，请稍候重试','bad'); return; }
      toast('⏳ 正在识别图片（首次较慢，请稍候）…','');
      try{
        const { data } = await window.Tesseract.recognize(f, 'chi_sim+eng', { logger: ()=>{} });
        const text = (data && data.text) ? data.text : '';
        const cleaned = text.split(/\n+/).map(x=>x.trim()).filter(Boolean).join('\n');
        openSmartModal(cleaned);  // 识别文字送进智能记账弹窗解析
        toast('已识别 '+cleaned.split(/\n+/).filter(Boolean).length+' 行，请核对分类','good');
      } catch(err){
        toast('识别失败：'+(err.message||err),'bad');
      }
    };
    inp.click();
  };
  if(_ocrEngineReady){ pick(); return; }
  toast('⏳ 正在加载识别引擎…','');
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
  s.onload = ()=>{ _ocrEngineReady = true; pick(); };
  s.onerror = ()=>{ toast('OCR 引擎加载失败，请检查网络','bad'); };
  document.head.appendChild(s);
  setTimeout(()=>{ if(!_ocrEngineReady) toast('引擎加载较慢，请重试','bad'); }, 15000);
}

/* =============================================================================
 * 页面 5：AI+ 工具网络（参照截图：Tab筛选 · 分类分组 · 更新时间）
 * =========================================================================== */
function aiColor(name){
  let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))%360;
  return 'linear-gradient(135deg,hsl('+h+',70%,68%),hsl('+((h+40)%360)+',70%,72%))';
}
function topUsed(){
  const u = State.settings.aiUsage||{};
  return Object.entries(u).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
}
function aiCard(t, showRegion){
  const top = topUsed();
  const hot = top.includes(t.name);
  const regionTag = t.region==='cn' ? '<span class="ai-tag cn">国内</span>' : '<span class="ai-tag foreign">国外</span>';
  return '<div class="ai-card" data-action="openAi" data-name="'+esc(t.name)+'" data-url="'+esc(t.url)+'">'+
    '<div class="ai-logo" style="background:'+aiColor(t.name)+'">'+(t.name[0]||'?')+'</div>'+
    '<div class="ai-name">'+esc(t.name)+(hot?' 🔥':'')+'</div>'+
    (showRegion ? regionTag : '')+
    '</div>';
}

// AI 分类列表（用于分组展示）
const AI_CATS = ['对话','做图','视频','音乐','写作','编程','日常'];

PAGES.ai = function(){
  // Tab 筛选状态
  if(!filters.ai) filters.ai = { tab:'all' };
  const ft = filters.ai.tab;
  const top = topUsed();
  let html = '<div class="page">';

  /* ---- 头部：标题 + 更新时间 ---- */
  html += '<div class="ai-header"><h2>AI+</h2><span class="ai-updated">数据更新：'+esc(CONFIG.lastUpdated)+'</span></div>';

  /* ---- 副标题 ---- */
  html += '<div class="ai-sub">国内外 AI 工具网络 · 点击直达官网</div>';

  /* ---- Tab 筛选 ---- */
  html += '<div class="ai-tabs">'+
    '<button class="ai-tab'+(ft==='all'?' active':'')+'" data-action="aiTab" data-tab="all">全部</button>'+
    '<button class="ai-tab'+(ft==='cn'?' active':'')+'" data-action="aiTab" data-tab="cn">国内</button>'+
    '<button class="ai-tab'+(ft==='foreign'?' active':'')+'" data-action="aiTab" data-tab="foreign">国外</button>'+
    '</div>';

  /* ---- 最常使用 TOP 3 ---- */
  if(top.length && (ft==='all')){
    html += '<div class="card"><div class="section-label">最常使用 <span class="tag-hot">TOP 3</span></div>';
    html += '<p style="color:var(--muted);font-size:12.5px;margin:-8px 0 12px">点击任意工具后会在这里显示最常使用的 3 个</p>';
    html += '<div class="ai-grid">';
    top.forEach(name=>{ const t = CONFIG.aiTools.find(x=>x.name===name); if(t) html += aiCard(t, false); });
    html += '</div></div>';
  }

  /* ---- 按分类分组展示 ---- */
  let tools = CONFIG.aiTools;
  if(ft==='cn') tools = tools.filter(t=>t.region==='cn');
  if(ft==='foreign') tools = tools.filter(t=>t.region==='foreign');

  AI_CATS.forEach(cat => {
    const catTools = tools.filter(t => t.cat === cat);
    if(catTools.length === 0) return;
    html += '<div class="card"><div class="section-label ai-cat-head">'+cat+' / '+cat+'</div><div class="ai-grid">';
    catTools.forEach(t => html += aiCard(t, ft==='all'));
    html += '</div></div>';
  });

  html += '<div class="empty" style="padding:16px;color:var(--muted)">💡 数据可在 config.js 中按月更新 · 记录你的点击习惯，常用工具自动置顶</div>';
  html += '</div>';
  $('#content').innerHTML = html;
};
ACTIONS.ai = {
  aiTab(_, el){ filters.ai.tab = el.dataset.tab; PAGES.ai(); },
  openAi(_, el){
    const name = el.dataset.name;
    const url  = el.dataset.url;
    const u = State.settings.aiUsage||{}; u[name]=(u[name]||0)+1; State.settings.aiUsage=u; saveSettings();
    window.open(url, '_blank', 'noopener');
  }
};

/* ----------------------------- 抽屉（移动端） ----------------------------- */
function toggleDrawer(){ const s=$('#sidebar'); const open=s.classList.toggle('open'); $('#overlay').classList.toggle('show', open); }

/* ----------------------------- 启动 ----------------------------- */
document.addEventListener('DOMContentLoaded', init);
