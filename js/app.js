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
  checkins: DB.get('checkins', [])  // 打卡日志：['YYYY-MM-DD', ...]，仅追加；dailyReset 不触碰
};
const save = k => DB.set(k, State[k]);
const saveSettings = () => DB.set('settings', State.settings);

/* ----------------------------- 打卡日志（修复本周打卡次日消失 bug）----------------------------- */
// 一次性迁移：从历史任务的 doneDate 重建 checkins（覆盖 dailyReset 把 done=false 但 doneDate 仍保留的情况）
(function migrateCheckins(){
  const set = new Set(State.checkins);
  let dirty = false;
  State.tasks.forEach(t=>{ if(t.doneDate && !set.has(t.doneDate)){ set.add(t.doneDate); dirty = true; }});
  if(dirty){ State.checkins = Array.from(set).sort(); save('checkins'); }
})();
// 记录某一天的打卡（幂等：同日重复调用不重复添加）；打卡日志永不删除
function recordCheckin(ds){ ds = ds || todayStr();
  if(!State.checkins.includes(ds)){ State.checkins.push(ds); save('checkins'); }
}
const hasCheckin = ds => State.checkins.includes(ds);

/* ----------------------------- 工具函数 ----------------------------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pad = n => (n<10?'0':'')+n;
const todayStr = () => { const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
const nowStr  = () => { const d=new Date(); return todayStr()+' '+pad(d.getHours())+':'+pad(d.getMinutes()); };
const monthStr= () => todayStr().slice(0,7);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dayOfMonth = () => new Date().getDate();
const rand = arr => arr[Math.floor(Math.random()*arr.length)];
const fmt = n => '¥' + (Math.round(n*100)/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const daysBetween = (a,b) => { const da=new Date(a), db=new Date(b); return Math.floor((db-da)/86400000); };

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
  { key:'account',  label:'我的账本', icon:'account' },
  { key:'ai',       label:'AI+',      icon:'ai' }
];

let currentPage = 'greeting';
const filters = {};   // 各页面筛选状态
const batch   = {};   // 各页面批量选择状态 {on, sel:Set}
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
    onOk(data);
    closeModal();
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
  $('#nav').innerHTML = NAV.map(n =>
    `<div class="nav-item" data-page="${n.key}">${icon(n.icon)}<span>${n.label}</span></div>`
  ).join('');
  $$('#nav .nav-item').forEach(el=>{
    el.addEventListener('click', (e)=> { e.stopPropagation(); goto(el.dataset.page); });
  });
}

function goto(key){
  currentPage = key;
  $$('#nav .nav-item').forEach(el=> el.classList.toggle('active', el.dataset.page===key));
  $('#pageTitle').textContent = (NAV.find(n=>n.key===key)||{}).label || '';
  if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
  $('.sidebar') && $('#sidebar').classList.remove('open');
  if(!$('#modalRoot').classList.contains('show')) $('#overlay').classList.remove('show');
  openPage(key);
}

/* 打开页（含密码守卫） */
function openPage(key){
  const needPwd = (key==='quota' && State.settings.quotaPwd) || (key==='account' && State.settings.accountPwd);
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
    if(d.mode==='clear'){ setPwd(key,''); toast('已清除密码'); renderPage(key); return; }
    if(d.pwd.length < 4){ toast('密码至少4位','bad'); return; }
    if(d.pwd !== d.pwd2){ toast('两次输入不一致','bad'); return; }
    setPwd(key, d.pwd); toast('密码已保存'); renderPage(key);
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
    State.tasks.forEach(x=>{ if(x.doneDate !== t) x.done = false; });
    save('tasks');
    State.settings._lastDay = t;
    saveSettings();
  }
  if(State.rec.date !== t){
    State.rec = { date:t, movie:rand(CONFIG.movies), tv:rand(CONFIG.tvs), book:rand(CONFIG.books) };
    save('rec');
  }
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
    accounts:State.accounts, assets:State.assets, rec:State.rec, settings:State.settings
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
        save('tasks'); save('notes'); save('quotas'); save('accounts'); save('assets'); save('rec'); saveSettings();
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
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;
  const page = currentPage;
  (ACTIONS[page] && ACTIONS[page][a] ? ACTIONS[page][a] : (ACTIONS._all[a]||function(){}))(id, el);
}

/* 通用：批量选择切换 */
function toggleBatch(page){
  if(!batch[page]) batch[page] = { on:false, sel:new Set() };
  batch[page].on = !batch[page].on;
  if(!batch[page].on) batch[page].sel.clear();
  renderPage(page);
}
function toggleSel(page, id){
  if(!batch[page]) batch[page] = { on:false, sel:new Set() };
  if(batch[page].sel.has(id)) batch[page].sel.delete(id); else batch[page].sel.add(id);
  renderPage(page);
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
function getWeekStreak(){
  const today = todayStr();
  let streak = 0, weekDone = 0;
  // 连续打卡天数（基于持久化的打卡日志 dailyReset 不影响）
  for(let i=0; i<365; i++){
    const dd = new Date(); dd.setDate(dd.getDate()-i);
    const ds = dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate());
    if(hasCheckin(ds)) streak++; else break;
  }
  // 本周完成天数（周一~周日）
  const now = new Date();
  const dow = now.getDay()||7; // 1=Mon..7=Sun
  for(let i=1;i<=7;i++){
    const d=new Date(now); d.setDate(d.getDate()-dow+i);
    const ds=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    if(hasCheckin(ds)) weekDone++;
  }
  return {streak, weekDone};
}
PAGES.todo = function(){
  if(!filters.todo) filters.todo = { q:'', status:'all' };
  const f = filters.todo;
  let list = State.tasks.slice();
  if(f.status==='done') list = list.filter(t=>t.done && t.doneDate===todayStr());
  if(f.status==='undone') list = list.filter(t=>!(t.done && t.doneDate===todayStr()));
  if(f.q) list = list.filter(t=> t.text.toLowerCase().includes(f.q.toLowerCase()));
  const b = batch.todo || {on:false,sel:new Set()};
  const doneCount = State.tasks.filter(t=>t.done && t.doneDate===todayStr()).length;
  const totalCount = State.tasks.length;
  const pct = totalCount>0 ? Math.round(doneCount/totalCount*100) : 0;
  const wk = getWeekStreak();
  const d = new Date();
  const week = ['日','一','二','三','四','五','六'];
  const dateStr = pad(d.getMonth()+1)+'-'+pad(d.getDate())+' 周'+week[d.getDay()];
  const nowDow = d.getDay();

  let html = '<div class="page">';
  /* ---- 页面标题 + 批量操作 ---- */
  html += '<div class="todo-header"><h2 class="todo-title">今日清单</h2>';
  html += '<button class="btn btn-ghost btn-sm" data-action="batchToggle">'+(b.on?'退出批量':'批量操作')+'</button></div>';

  /* ---- 日期 + 打卡统计条 ---- */
  html += '<div class="todo-date">'+dateStr+'</div>';
  html += '<div class="todo-streak-bar">'+
    '<span class="ts-icon">🔥</span>'+
    '<span>已连续打卡 <b>'+wk.streak+'</b> 天</span>'+
    '<span class="ts-sep">|</span>'+
    '<span>本周完成 <b>'+wk.weekDone+' / 7</b> 天</span>'+
    '</div>';

  /* ---- 任务列表 ---- */
  html += '<div class="list todo-list">';
  if(list.length===0){
    html += '<div class="empty todo-empty"><div class="big">📝</div><p>还没有任务，添加一个吧～</p></div>';
  } else {
    list.forEach(t=>{
      const done = t.done && t.doneDate===todayStr();
      html += '<div class="item'+(done?' done':'')+'">';
      if(b.on) html += '<div class="check'+(b.sel.has(t.id)?' on':'')+'" data-action="sel" data-id="'+t.id+'">'+(b.sel.has(t.id)?'✓':'')+'</div>';
      html += '<div class="check'+(done?' on':'')+'" data-action="toggle" data-id="'+t.id+'">'+(done?'✓':'')+'</div>';
      html += '<div class="body"><div class="title">'+esc(t.text)+'</div></div>';
      if(!b.on) html += '<button class="btn btn-sm btn-ghost" data-action="editTask" data-id="'+t.id+'">编辑</button><button class="btn btn-danger btn-sm" data-action="delTask" data-id="'+t.id+'">删除</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  /* ---- 底部固定输入栏 ---- */
  html += '<div class="todo-input-bar">'+
    '<input class="input todo-input" id="todoInput" placeholder="添加新任务..." data-action="quickAddTask">'+
    '<button class="btn btn-primary todo-add-btn" data-action="addTask">＋</button>'+
    '</div>';

  /* ---- 本周打卡日历 ---- */
  html += '<div class="card"><div class="card-title">📅 本周打卡</div>';
  html += '<div class="week-cal">';
  for(let i=1;i<=7;i++){
    const cd=new Date(d); cd.setDate(d.getDate()-nowDow+i);
    const cds=cd.getFullYear()+'-'+pad(cd.getMonth()+1)+'-'+pad(cd.getDate());
    const isToday=(i===(nowDow||7));
    const isPast=i<(nowDow||7);
    const checked=hasCheckin(cds);
    const cls='wc-day'+(isToday?' wc-today':'')+(checked?' wc-done':'')+(isPast&&!checked?' wc-miss':'');
    html+='<div class="'+cls+'"><div class="wc-dow">'+['一','二','三','四','五','六','日'][i-1]+'</div><div class="wc-dot">'+(checked?'●':'○')+'</div></div>';
  }
  html += '</div></div>';

  /* 搜索筛选（折叠区域） */
  html += '<div class="todo-filters">'+
    '<input class="input" id="todoQ" placeholder="搜索事项…" value="'+esc(f.q)+'">'+
    '<select class="select" id="todoStatus"><option value="all"'+(f.status==='all'?' selected':'')+'>全部</option><option value="undone"'+(f.status==='undone'?' selected':'')+'>未完成</option><option value="done"'+(f.status==='done'?' selected':'')+'>已完成</option></select>'+
    (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中 ('+b.sel.size+')</button><button class="btn btn-sm" data-action="batchDone">标记完成</button>' : '')+
    '</div>';

  html += '</div>';
  $('#content').innerHTML = html;

  // 快捷添加：回车触发
  const ti = $('#todoInput');
  if(ti){ ti.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=ti.value.trim(); if(v){ ACTIONS.todo.quickAdd(v); ti.value=''; }} }); }
  $('#todoQ').addEventListener('input', e=>{ filters.todo.q=e.target.value; PAGES.todo(); const i=$('#todoQ'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } });
  $('#todoStatus').addEventListener('change', e=>{ filters.todo.status=e.target.value; PAGES.todo(); });
};

ACTIONS.todo = {
  quickAdd(text){ if(!text){ toast('请输入内容','bad'); return; }
    State.tasks.push({id:uid(), text:text, done:false, doneDate:''});
    save('tasks'); toast('已添加','good'); PAGES.todo(); },
  addTask(){ formModal('新增事项', [{key:'text',label:'事项内容',placeholder:'例如：晨跑30分钟'}], d=>{
    if(!d.text){ toast('请输入内容','bad'); return; }
    State.tasks.push({id:uid(), text:d.text, done:false, doneDate:''});
    save('tasks'); toast('已添加','good'); PAGES.todo();
  }); },
  editTask(id){ const t = State.tasks.find(x=>x.id===id); if(!t) return;
    formModal('编辑事项', [{key:'text',label:'事项内容',value:t.text}], d=>{
      if(!d.text){ toast('请输入内容','bad'); return; }
      t.text = d.text; save('tasks'); toast('已更新','good'); PAGES.todo();
    }); },
  delTask(id){ confirmDialog('删除事项', '确定删除该事项吗？此操作不可撤销。', ()=>{
    State.tasks = State.tasks.filter(x=>x.id!==id); save('tasks'); toast('已删除'); PAGES.todo();
  }); },
  toggle(id){ const t = State.tasks.find(x=>x.id===id); if(!t) return;
    if(t.done && t.doneDate===todayStr()){ t.done=false; t.doneDate=''; }
    else { t.done=true; t.doneDate=todayStr(); recordCheckin(); }
    save('tasks'); PAGES.todo(); },
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
    save('tasks'); toast('已标记完成','good'); PAGES.todo(); }
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
  if(!filters.quota) filters.quota = { q:'' };
  const f = filters.quota;
  let list = State.quotas.slice();
  if(f.q) list = list.filter(q=> q.name.toLowerCase().includes(f.q.toLowerCase()));
  const b = batch.quota || {on:false,sel:new Set()};
  const hasPwd = !!State.settings.quotaPwd;

  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">'+icon('quota')+'额度追踪'+
    '<span class="spacer" style="flex:1"></span>'+
    '<button class="btn btn-sm" data-action="pwdSet" title="密码设置">🔐 '+(hasPwd?'已加密':'未加密')+'</button></div>';
  html += '<div class="toolbar">'+
    '<button class="btn btn-primary btn-sm" data-action="addQuota">＋ 新增额度</button>'+
    '<button class="btn btn-sm" data-action="batchToggle">批量操作</button>'+
    (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中 ('+b.sel.size+')</button>' : '')+
    '<span class="spacer"></span><button class="btn btn-sm" data-action="resetAll">重置消耗</button>'+
    '</div>';
  html += '<div class="search"><input class="input" id="quotaQ" placeholder="搜索额度名称…" value="'+esc(f.q)+'"></div>';
  html += '<div class="list">';
  if(list.length===0){ html += '<div class="empty"><div class="big">🎯</div>还没有额度，新增一个开始追踪吧</div>'; }
  else {
    list.forEach(q=>{
      const used = Math.min(q.consumed, q.total);
      const pct = q.total>0 ? Math.round(used/q.total*100) : 0;
      const warn = pct>=85;
      const realIdx = State.quotas.findIndex(x=>x.id===q.id);
      html += '<div class="item quota-item">';
      if(b.on) html += '<div class="check'+(b.sel.has(q.id)?' on':'')+'" data-action="sel" data-id="'+q.id+'">'+(b.sel.has(q.id)?'✓':'')+'</div>';
      const openAttr = b.on ? '' : ' data-action="openQuotaDetail" data-id="'+q.id+'"';
      const arrow = b.on ? '' : '<span class="arrow">›</span>';
      html += '<div class="body"'+openAttr+'>'+
        '<div class="title">'+esc(q.name)+arrow+'</div>'+
        '<div class="sub">已用 '+fmt(q.consumed)+' / 总额 '+fmt(q.total)+' · 剩余 '+fmt(Math.max(q.total-q.consumed,0))+'</div>'+
        '<div class="bar'+(warn?' warn':'')+'" style="margin-top:8px"><i style="width:'+pct+'%"></i></div>';
      if(!b.on){
        html += '<div class="item-acts">'+
          '<button class="btn btn-sm" data-action="useQuota" data-id="'+q.id+'">记录消耗</button>'+
          '<button class="btn btn-danger btn-sm" data-action="delQuota" data-id="'+q.id+'">删除</button>';
        if(!f.q){
          if(realIdx>0) html += '<button class="btn btn-sm btn-ghost" data-action="moveQuota" data-id="'+q.id+'" data-dir="up">↑ 上移</button>';
          if(realIdx<State.quotas.length-1) html += '<button class="btn btn-sm btn-ghost" data-action="moveQuota" data-id="'+q.id+'" data-dir="down">↓ 下移</button>';
        }
        html += '</div>';
      }
      html += '</div>';
      html += '</div>';
    });
  }
  html += '</div></div></div>';
  $('#content').innerHTML = html;
  $('#quotaQ').addEventListener('input', e=>{ filters.quota.q=e.target.value; PAGES.quota(); });
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
  resetAll(){ confirmDialog('重置消耗', '确定将所有额度的「已消耗」清零吗？', ()=>{
    State.quotas.forEach(q=>{ q.consumed=0; q.records=[]; }); save('quotas'); toast('已重置','good'); PAGES.quota();
  }); },
  batchToggle(){ toggleBatch('quota'); },
  sel(id){ toggleSel('quota', id); },
  batchDel(){ const b=batch.quota; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 个额度吗？', ()=>{
      State.quotas = State.quotas.filter(x=>!b.sel.has(x.id)); save('quotas'); b.sel.clear(); b.on=false; toast('已删除'); PAGES.quota();
    }); },
  openQuotaDetail(id){ qDetailId = id; PAGES.quota(); },
  quotaBack(){ qDetailId = null; PAGES.quota(); },
  moveQuota(id, el){
    const dir = el.dataset.dir==='up' ? -1 : 1;
    const i = State.quotas.findIndex(x=>x.id===id);
    const j = i + dir;
    if(i<0 || j<0 || j>=State.quotas.length) return;
    const t = State.quotas[i]; State.quotas[i] = State.quotas[j]; State.quotas[j] = t;
    save('quotas'); PAGES.quota();
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
  html += '<div class="card"><div class="card-title">'+icon('quota')+'额度明细'+
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
  if(q.records.length===0){ html += '<div class="empty"><div class="big">🧾</div>暂无消耗记录，去列表页「记录消耗」吧</div>'; }
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
const ACCOUNT_CATS = [
  {key:'餐饮',icon:'🍜'}, {key:'交通',icon:'🚌'}, {key:'购物',icon:'🛍️'}, {key:'学习',icon:'📖'},
  {key:'娱乐',icon:'🎮'}, {key:'居家',icon:'🏠'}, {key:'医疗',icon:'💊'}, {key:'工资',icon:'💰'},
  {key:'红包',icon:'🧧'}, {key:'其他',icon:'📦'}
];
PAGES.account = function(){
  if(!filters.account) filters.account = { q:'', type:'all', cat:'all' };
  const f = filters.account;
  let list = State.accounts.slice().sort((a,b)=> b.created - a.created);
  if(f.type!=='all') list = list.filter(t=> t.type===f.type);
  if(f.cat!=='all') list = list.filter(t=> t.cat===f.cat);
  if(f.q) list = list.filter(t=> (t.note||'').toLowerCase().includes(f.q.toLowerCase()) || t.cat.includes(f.q));
  const b = batch.account || {on:false,sel:new Set()};

  // 本月概览
  const m = monthStr();
  const monthTx = State.accounts.filter(t=> (t.date||'').slice(0,7)===m);
  const exp = monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const inc = monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);

  let html = '<div class="page">';
  html += '<div class="card"><div class="card-title">'+icon('account')+'我的账本'+
    '<span style="flex:1"></span><button class="btn btn-sm" data-action="pwdSet">🔐 '+(State.settings.accountPwd?'已加密':'未加密')+'</button></div>';
  html += '<div class="stat-row">'+
    '<div class="stat expense"><div class="label">本月支出</div><div class="val">'+fmt(exp)+'</div></div>'+
    '<div class="stat income"><div class="label">本月收入</div><div class="val">'+fmt(inc)+'</div></div>'+
    '<div class="stat"><div class="label">本月结余</div><div class="val">'+fmt(inc-exp)+'</div></div>'+
    '</div></div>';

  // 快捷分类
  html += '<div class="card"><div class="card-title">⚡ 快捷记一笔</div><div class="quick-grid">';
  ACCOUNT_CATS.forEach(c=>{ html += '<div class="quick" data-action="quickAdd" data-cat="'+c.key+'"><div class="q-ic">'+c.icon+'</div>'+c.key+'</div>'; });
  html += '</div></div>';

  // 明细
  html += '<div class="card"><div class="card-title">'+icon('account')+'收支明细</div>';
  html += '<div class="toolbar">'+
    '<button class="btn btn-primary btn-sm" data-action="addTx">＋ 记一笔</button>'+
    '<button class="btn btn-sm" data-action="batchToggle">批量操作</button>'+
    (b.on ? '<button class="btn btn-danger btn-sm" data-action="batchDel">删除选中 ('+b.sel.size+')</button>' : '')+
    '</div>';
  html += '<div class="search">'+
    '<input class="input" id="accQ" placeholder="搜索备注 / 分类…" value="'+esc(f.q)+'">'+
    '<select class="select" id="accType"><option value="all"'+(f.type==='all'?' selected':'')+'>全部类型</option><option value="expense"'+(f.type==='expense'?' selected':'')+'>支出</option><option value="income"'+(f.type==='income'?' selected':'')+'>收入</option></select>'+
    '<select class="select" id="accCat"><option value="all"'+(f.cat==='all'?' selected':'')+'>全部分类</option>'+ACCOUNT_CATS.map(c=>'<option value="'+c.key+'"'+(f.cat===c.key?' selected':'')+'>'+c.key+'</option>').join('')+'</select>'+
    '</div>';
  html += '<div class="list">';
  if(list.length===0){ html += '<div class="empty"><div class="big">💰</div>还没有记录，点上面的分类快速记账</div>'; }
  else {
    list.forEach(t=>{
      const c = ACCOUNT_CATS.find(x=>x.key===t.cat)||{icon:'📦'};
      html += '<div class="item">';
      if(b.on) html += '<div class="check'+(b.sel.has(t.id)?' on':'')+'" data-action="sel" data-id="'+t.id+'">'+(b.sel.has(t.id)?'✓':'')+'</div>';
      html += '<div class="q-ic" style="width:40px;height:40px">'+c.icon+'</div>';
      html += '<div class="body"><div class="title">'+esc(t.cat)+(t.note?' · '+esc(t.note):'')+'</div><div class="sub">'+(t.date||'')+' '+(t.time||'')+'</div></div>';
      html += '<div class="title" style="color:'+(t.type==='income'?'var(--good)':'var(--bad)')+'">'+(t.type==='income'?'+':'-')+fmt(t.amount)+'</div>';
      if(!b.on) html += '<button class="btn btn-danger btn-sm" data-action="delTx" data-id="'+t.id+'">删除</button>';
      html += '</div>';
    });
  }
  html += '</div></div>';

  // 资产管家（放最后）
  const totalAsset = State.assets.reduce((s,a)=>s+(a.balance||0),0);
  html += '<div class="card"><div class="card-title">🏦 资产管家'+
    '<span style="flex:1"></span><span class="badge" style="background:rgba(54,179,126,.12);color:var(--good)">总资产 '+fmt(totalAsset)+'</span>'+
    '</div>';
  html += '<div class="toolbar">'+
    '<button class="btn btn-primary btn-sm" data-action="addAsset">＋ 添加银行卡</button>'+
    '</div>';
  if(State.assets.length===0){
    html += '<div class="empty"><div class="big">🏦</div>还没有记录，添加你的资产吧</div>';
  } else {
    html += '<div class="list">';
    State.assets.forEach(a=>{
      html += '<div class="item">'+
        '<div class="q-ic" style="width:40px;height:40px">'+(a.icon||'💳')+'</div>'+
        '<div class="body"><div class="title">'+esc(a.name)+'</div><div class="sub">'+esc(a.bank||'')+' · 更新于 '+(a.updated||'')+'</div></div>'+
        '<div class="title" style="color:var(--primary)">'+fmt(a.balance)+'</div>'+
        '<button class="btn btn-sm" data-action="editAsset" data-id="'+a.id+'">编辑</button>'+
        '<button class="btn btn-danger btn-sm" data-action="delAsset" data-id="'+a.id+'">删除</button>'+
        '</div>';
    });
    html += '</div>';
  }
  html += '</div></div></div>';
  $('#content').innerHTML = html;
  $('#accQ').addEventListener('input', e=>{ filters.account.q=e.target.value; PAGES.account(); const i=$('#accQ'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } });
  $('#accType').addEventListener('change', e=>{ filters.account.type=e.target.value; PAGES.account(); });
  $('#accCat').addEventListener('change', e=>{ filters.account.cat=e.target.value; PAGES.account(); });
};
function txForm(title, prefill, onOk){
  formModal(title, [
    {key:'type',label:'类型',type:'select',value:prefill.type||'expense',options:[{value:'expense',text:'支出'},{value:'income',text:'收入'}]},
    {key:'cat',label:'分类',type:'select',value:prefill.cat||'餐饮',options:ACCOUNT_CATS.map(c=>({value:c.key,text:c.key}))},
    {key:'amount',label:'金额',type:'number',value:prefill.amount||'',placeholder:'0.00'},
    {key:'note',label:'备注',value:prefill.note||'',placeholder:'选填'},
    {key:'date',label:'日期',type:'text',value:prefill.date||todayStr()}
  ], d=>{
    const amt = parseFloat(d.amount);
    if(isNaN(amt)||amt<=0){ toast('请输入有效金额','bad'); return; }
    onOk(d, amt);
  });
}
ACTIONS.account = {
  pwdSet(){ openPwdSettings('account'); },
  quickAdd(cat){ txForm('记一笔 · '+cat, {cat, type:'expense'}, (d,amt)=>{
    State.accounts.push({id:uid(), type:d.type, cat:d.cat, amount:amt, note:d.note, date:d.date, time:nowStr(), created:Date.now()});
    save('accounts'); toast('已记录','good'); PAGES.account();
  }); },
  addTx(){ txForm('记一笔', {}, (d,amt)=>{
    State.accounts.push({id:uid(), type:d.type, cat:d.cat, amount:amt, note:d.note, date:d.date, time:nowStr(), created:Date.now()});
    save('accounts'); toast('已记录','good'); PAGES.account();
  }); },
  delTx(id){ confirmDialog('删除记录', '确定删除这条账目吗？', ()=>{
    State.accounts = State.accounts.filter(x=>x.id!==id); save('accounts'); toast('已删除'); PAGES.account();
  }); },
  batchToggle(){ toggleBatch('account'); },
  sel(id){ toggleSel('account', id); },
  batchDel(){ const b=batch.account; if(!b||b.sel.size===0){ toast('请先选择','bad'); return; }
    confirmDialog('批量删除', '确定删除选中的 '+b.sel.size+' 条账目吗？', ()=>{
      State.accounts = State.accounts.filter(x=>!b.sel.has(x.id)); save('accounts'); b.sel.clear(); b.on=false; toast('已删除'); PAGES.account();
    }); },
  // --- 资产管家 ---
  addAsset(){ formModal('添加银行卡', [
    {key:'name',label:'卡片名称（自定义）',placeholder:'例如：工资卡'},
    {key:'bank',label:'银行名称',placeholder:'例如：招商银行'},
    {key:'balance',label:'当前余额',type:'number',placeholder:'0.00'},
    {key:'icon',label:'图标',value:'💳',placeholder:'emoji'}
  ], d=>{
    if(!d.name){ toast('请输入名称','bad'); return; }
    const bal = parseFloat(d.balance);
    if(isNaN(bal)){ toast('请输入有效余额','bad'); return; }
    State.assets.push({id:uid(), name:d.name, bank:d.bank, balance:bal, icon:d.icon||'💳', updated:nowStr()});
    save('assets'); toast('已添加','good'); PAGES.account();
  }); },
  editAsset(id){ const a = State.assets.find(x=>x.id===id); if(!a) return;
    formModal('编辑银行卡 · '+a.name, [
      {key:'name',label:'卡片名称',value:a.name},
      {key:'bank',label:'银行名称',value:a.bank},
      {key:'balance',label:'当前余额',type:'number',value:String(a.balance)},
      {key:'icon',label:'图标',value:a.icon}
    ], d=>{
      if(!d.name){ toast('请输入名称','bad'); return; }
      const bal = parseFloat(d.balance);
      if(isNaN(bal)){ toast('请输入有效余额','bad'); return; }
      a.name=d.name; a.bank=d.bank; a.balance=bal; a.icon=d.icon||'💳'; a.updated=nowStr();
      save('assets'); toast('已更新','good'); PAGES.account();
    }); },
  delAsset(id){ confirmDialog('删除银行卡', '确定删除该银行卡记录吗？', ()=>{
    State.assets = State.assets.filter(x=>x.id!==id); save('assets'); toast('已删除'); PAGES.account();
  }); }
};

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
