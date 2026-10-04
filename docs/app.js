'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
 overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 devices:'<rect x="3" y="3" width="13" height="11" rx="2"/><path d="M6 19h8m-4-5v5"/><rect x="17" y="10" width="5" height="11" rx="1"/>',
 wifi:'<path d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 3.5a6 6 0 0 1 8 0"/><circle cx="12" cy="19" r="1"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 system:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3m14-8h3m-3 8h3"/>',
 settings:'<path d="m9 3-1 3-3 1-1 4 2 2-1 3 3 3 3-1 2 2 4-1 1-3 3-1 1-4-2-2 1-3-3-3-3 1-2-2Z"/><circle cx="12" cy="12" r="3"/>',
 refresh:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m-5 0h5v5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>', down:'<path d="M12 3v16m-6-6 6 6 6-6M4 21h16"/>', up:'<path d="M12 21V5m-6 6 6-6 6 6M4 3h16"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', check:'<path d="m5 12 4 4L19 6"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10m-12 0v3m4 10h4"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',
 laptop:'<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="m4 16-2 4h20l-2-4M10 19h4"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5h4m-3 14h2"/>',
 tv:'<rect x="2" y="5" width="20" height="13" rx="2"/><path d="m8 2 4 3 4-3m-7 16-1 3m7-3 1 3"/>',
 router:'<rect x="3" y="12" width="18" height="8" rx="2"/><path d="M6 12V4m12 8V4m-5 12h4m-11 0h.1m3 0h.1"/>',
 ethernet:'<path d="M5 3h14v12l-4 3v3H9v-3l-4-3V3Z"/><path d="M8 3v5m4-5v5m4-5v5"/>',
 shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
 time:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
 power:'<path d="M12 2v9m-6-7a9 9 0 1 0 12 0"/>', server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.1m0 11h.1m4-11h6m-6 11h6"/>',
 lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
 home:'<path d="m3 10 9-8 9 8v11h-6v-7H9v7H3V10Z"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.router}</svg>`;
const themes = {
 tide:{name:'TIDE',cn:'澜',sub:'A CLEARER CONNECTION',headline:'网络，尽在眼前。',description:'轻盈的海蓝与干净的留白，让每一次管理都更从容。'},
 noct:{name:'NOCT',cn:'曜',sub:'YOUR NETWORK. IN FOCUS.',headline:'连接稳定。控制就绪。',description:'石墨黑与柔和琥珀，高密度的信息也能井然有序。'},
 grove:{name:'GROVE',cn:'庭',sub:'CONNECTED, NATURALLY',headline:'你的家，正在连接。',description:'松绿与浅鼠尾草色，把家里的每一条连接轻轻展开。'}
};
const names = {overview:'状态总览',devices:'在线设备',wireless:'无线网络',network:'网络接口',system:'系统管理'};
const demoDevices = [
 ['MacBook Pro','laptop','192.168.1.102','5 GHz','86.4','Apple','工作电脑'],
 ['iPhone 16 Pro','phone','192.168.1.108','5 GHz','12.8','Apple','我的手机'],
 ['客厅 Apple TV','tv','192.168.1.116','有线','24.6','Apple','客厅'],
 ['iPad Air','phone','192.168.1.110','5 GHz','8.1','Apple','书房'],
 ['Home NAS','server','192.168.1.120','有线','9.6','Synology','存储服务器'],
 ['小米扫地机器人','home','192.168.1.124','2.4 GHz','0.2','Xiaomi','家用设备'],
 ['客厅音箱','server','192.168.1.132','2.4 GHz','0.6','Sonos','客厅'],
 ['书房台式机','laptop','192.168.1.141','有线','18.2','PC','书房'],
 ['智能台灯','sun','192.168.1.145','2.4 GHz','0.1','Yeelight','书房'],
 ['卧室电视','tv','192.168.1.151','5 GHz','22.0','Sony','卧室'],
 ['门口摄像头','shield','192.168.1.159','2.4 GHz','1.8','Aqara','家用设备'],
 ['打印机','server','192.168.1.160','2.4 GHz','0.1','Brother','书房']
].map((a,i)=>({id:i,name:a[0],type:a[1],ip:a[2],connection:a[3],rate:a[4],vendor:a[5],note:a[6],blocked:false,mac:`A4:C3:F0:2B:8E:${(i+16).toString(16).toUpperCase()}`}));
const params = new URLSearchParams(location.search);
const selectedTide = document.body.dataset.selected === 'tide';
const state = {theme:themes[params.get('theme')]?params.get('theme'):'tide',page:names[params.get('page')]?params.get('page'):'overview',range:'5m',filter:'all',query:'',motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,offline:false,wifi5:true,wifi24:true,dirty:false,saving:false,form:{ssid:'Home · 5G',password:'myhome2026',channel:'149',bandwidth:'80 MHz',security:'WPA2 / WPA3 混合'},saved:null};
state.saved={...state.form};
if(selectedTide)state.theme='tide';
state.appearance=['light','dark','auto'].includes(params.get('appearance'))?params.get('appearance'):'light';
const isDark=()=>selectedTide&&(state.appearance==='dark'||state.appearance==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
let routeToken=0,toastTimer,activeTransition,dialogClosing=false;
const motion=()=>state.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
const online=()=>demoDevices.filter(d=>!d.blocked).length;
const wifiCount=band=>demoDevices.filter(d=>!d.blocked&&d.connection===band).length;
const collapsedGroups=new Set();
function navigation(){
 const item=(id)=>`<button data-page="${id}" ${id===state.page?'aria-current="page"':''}><span>${names[id]}</span></button>`;
 if(!selectedTide)return Object.entries(names).map(([id,name],i)=>`${i===4?'<div class="divider"></div>':''}<button data-page="${id}" ${id===state.page?'aria-current="page"':''}>${icon({overview:'overview',devices:'devices',wireless:'wifi',network:'globe',system:'system'}[id])}<span>${name}</span></button>`).join('');
 return [['status','状态与设备','overview',['overview','devices']],['network','网络','globe',['network','wireless']],['system','系统','system',['system']]].map(([id,label,glyph,pages])=>`<div class="nav-group ${collapsedGroups.has(id)?'collapsed':''}"><button class="nav-group-head" data-nav-group="${id}" aria-expanded="${!collapsedGroups.has(id)}" aria-controls="group-${id}">${icon(glyph)}<span>${label}</span>${icon('chevron','group-chevron')}</button><div class="nav-children" id="group-${id}"><div class="nav-children-inner" ${collapsedGroups.has(id)?'inert':''}>${pages.map(item).join('')}</div></div></div>`).join('');
}
function mobileMenu(open){const side=$('.sidebar'),toggle=$('[data-action=menu]');side.classList.toggle('open',open);toggle?.setAttribute('aria-expanded',open);$('.nav-mask').hidden=!open;$('.workspace').inert=open;$('.labbar').inert=open;if(open)$('.nav-close').focus();else toggle?.focus();}
const status = (s='连接正常') => `<span class="status-badge ${/离线|暂停/.test(s)?'is-paused':''}"><i class="live-dot"></i>${s}</span>`;
const button = (text, ico, action, cls='')=>`<button class="btn ${cls}" data-action="${action}">${icon(ico)}<span>${text}</span></button>`;
const more = (text,page)=>`<button class="more" data-page="${page}">${text}${icon('arrow')}</button>`;
const info = (label,value)=>`<div class="info-row"><span>${label}</span><strong>${value}</strong></div>`;
const switcher = (id,value,label)=>`<button type="button" class="switch" role="switch" aria-checked="${value}" aria-label="${label}" data-switch="${id}"><span></span></button>`;
const footer=()=>`<footer class="footer"><span>OpenWrt 24.10.2 · LuCI / ${themes[state.theme].name}</span><span>${icon('info')}交互原型 · 所有数据均为示例</span></footer>`;
function logo(){
 if(state.theme==='tide')return '<svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M3 13c6-10 10 10 17 0s11 1 13 3M3 22c6-10 10 10 17 0s11 1 13 3" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>';
 if(state.theme==='noct')return '<svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M5 28V8l13 20V8m8 0v20" stroke="currentColor" stroke-width="3"/><circle cx="28" cy="8" r="3" fill="currentColor"/></svg>';
 return '<svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M18 30V15M18 23C7 24 4 15 6 6c10 0 14 6 12 17Zm0-5C18 8 24 4 31 5c2 9-4 14-13 13Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>';
}
function render(focus=false){
 document.body.className=`theme-${state.theme}${isDark()?' dark':''}${state.motion?'':' motion-off'}`;
 $$('[data-appearance]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.appearance===state.appearance));
 document.querySelector('meta[name=theme-color]').content=isDark()?'#1b2023':'#f2f6fb';
 $$('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.theme===state.theme));
 $('#motionToggle').setAttribute('aria-pressed',state.motion);
 $('#motionToggle span:last-child').textContent=state.motion?'动效开启':'动效暂停';
 const t=themes[state.theme];
 $('#app').innerHTML=`<div class="shell"><aside class="sidebar" id="mainmenu"><div class="brand"><div class="brand-symbol">${logo()}</div><div><div class="brand-word">${t.name}<span style="font-size:12px;font-weight:500;margin-left:7px">${t.cn}</span></div><div class="brand-sub">${t.sub}</div></div></div><button class="icon-btn nav-close" data-action="closeMenu" aria-label="关闭导航">${icon("close")}</button><nav class="nav" aria-label="路由器管理">${navigation()}</nav><div class="sidebar-bottom"><div class="router-id"><i class="live-dot"></i><strong>OpenWrt · Home</strong></div><small>192.168.1.1</small><div class="version">LuCI DESIGN EXPLORATION</div></div></aside><button class="nav-mask" hidden data-action="closeMenu" aria-label="关闭导航"></button><div class="workspace"><header class="topbar"><div class="breadcrumbs"><button class="icon-btn menu-toggle" data-action="menu" aria-label="打开导航" aria-expanded="false" aria-controls="mainmenu">${icon('menu')}</button><span>Home</span>${icon('chevron')}<strong>${names[state.page]}</strong></div><div class="top-actions"><span class="clock">本地管理 · 示例环境</span><button class="icon-btn" data-action="search" aria-label="搜索设备">${icon('search')}</button><button class="icon-btn" data-page="system" aria-label="查看网络事件">${icon('bell')}</button><span class="user" title="管理员 root">R</span></div></header><main class="content page-enter" id="content" tabindex="-1">${pageContent()}${footer()}</main></div></div>`;
 if(focus){const h=$('h1');h.tabIndex=-1;h.focus({preventScroll:true});}
 if(state.page==='devices')filterDevices();if(state.saving)$$('#wirelessForm input,#wirelessForm select,#wirelessForm button').forEach(el=>el.disabled=true);
}
function heading(title,description){return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${state.page==='overview'?button('重新检测','shield','diagnose','outline'):''}${button('刷新','refresh','refresh')}</div></div>`;}
function pageContent(){
 if(state.page==='overview')return overview();
 if(state.page==='devices')return devicesPage();
 if(state.page==='wireless')return wirelessPage();
 if(state.page==='network')return networkPage();
 return systemPage();
}
function devicesPage(){return `${heading('每一台设备，都清清楚楚。','查看连接方式与活动状态，点击设备可展开详情。')}<section class="panel device-page"><div class="search-row"><label class="search">${icon('search')}<input id="deviceSearch" aria-label="搜索设备名称或 IP 地址" placeholder="搜索设备名称或 IP 地址" value="${esc(state.query)}"></label><div class="segment" role="group" aria-label="筛选设备">${[['all','全部 '+demoDevices.length],['wireless','无线 9'],['wired','有线 3']].map(([id,n])=>`<button data-filter="${id}" aria-pressed="${state.filter===id}">${n}</button>`).join('')}</div></div>${deviceTable(demoDevices,true)}<div class="empty-state">${icon('search')}<h3>没有找到这台设备</h3><p>试试设备名称或 IP 地址，或清除筛选。</p>${button('清除筛选','refresh','clearSearch')}</div><div class="device-bottom"><span id="deviceCount">共 ${demoDevices.length} 台设备</span><span>DHCP 租期 · 12 小时</span></div></section>`;}
function wirelessPage(){return `${heading('把无线网络，调成你喜欢的样子。','设置名称、密码与信道，所有改动仅在此原型中演示。')}<form id="wirelessForm" novalidate><div class="settings-layout"><section class="panel"><div class="form-head"><div class="interface-icon">${icon('wifi')}</div><div><h2>5 GHz 无线网络</h2><p>radio1 · MediaTek MT7981 · 802.11ax</p></div>${switcher('wifi5',state.wifi5,'启用 5 GHz 无线网络')}</div>${formRow('网络名称','ssid',`<input id="ssid" name="ssid" value="${esc(state.form.ssid)}" maxlength="32" required autocomplete="off">`,'设备连接时看到的 Wi-Fi 名称。','请输入 1–32 字节的网络名称。')}${formRow('无线密码','password',`<div class="password-wrap"><input id="password" name="password" value="${esc(state.form.password)}" type="password" autocomplete="off"><button class="icon-btn" type="button" data-action="password" aria-label="显示无线密码">${icon('eye')}</button></div>`,'至少 8 个字符，建议使用字母与数字组合。','请输入 8–63 位 ASCII 密码。')}${formRow('安全模式','security',select('security',['WPA2 / WPA3 混合','WPA3-SAE','WPA2-PSK']),'混合模式兼顾新设备与旧设备的连接。')}${formRow('无线信道','channel',select('channel',['自动','36','44','149','157']),'示例频段：5 GHz · 实际可用信道取决于地区。')}${formRow('信道带宽','bandwidth',select('bandwidth',['20 MHz','40 MHz','80 MHz']),'更宽的频宽适合高速连接，也更容易受到邻近网络影响。')}</section><aside><div class="settings-tip">${icon('wifi')}<h2>好连接，从合适的设置开始。</h2><p>家里的主力设备可以连接 5 GHz，距离较远的智能家居设备可以使用 2.4 GHz。</p>${info('当前连接设备',wifiCount('5 GHz')+' 台')}${info('信道使用率','18%')}${info('信号质量','良好')}</div></aside></div><div class="savebar"><p id="saveHint">${state.dirty?'<i class="dirty-indicator"></i>有未保存的示例设置':'设置已同步 · 仅用于原型演示'}</p><button type="button" class="btn outline" data-action="reset">恢复默认</button><button type="submit" class="btn primary" id="saveButton" ${state.saving?'disabled':''}>${icon(state.saving?'refresh':'check')}<span>${state.saving?'正在应用…':'保存并应用'}</span></button></div></form>`;}
function formRow(label,id,input,hint,error=''){return `<div class="form-row"><label for="${id}">${label}</label><div class="field" data-field="${id}">${input}<p id="${id}Hint">${hint}</p>${error?`<p class="field-error" id="${id}Error">${error}</p>`:''}</div></div>`;}
function select(id,options){return `<select name="${id}" id="${id}">${options.map(v=>`<option ${state.form[id]===v?'selected':''}>${v}</option>`).join('')}</select>`;}
function networkPage(){return `${heading('每条链路，各司其职。','互联网接入、局域网与 IPv6，所有接口状态集中管理。')}<div class="settings-layout"><section class="panel"><div class="panel-head"><h2>网络接口</h2>${button('检测连接','shield','diagnose','outline')}</div>${[['WAN','globe','PPPoE · eth0','203.0.113.28',state.offline?'离线':'已连接'],['LAN','ethernet','静态地址 · br-lan','192.168.1.1','已连接'],['WAN6','globe','DHCPv6 · eth0','2001:db8:10::1','已连接']].map(([n,i,desc,ip,s])=>`<div class="network-interface"><div class="interface-title"><div class="interface-icon">${icon(i)}</div><div><h3>${n}</h3><p>${desc}</p></div>${status(s)}</div>${info('地址',ip)}${info('传输速率','1000 Mbps / 全双工')}${info('累计流量','接收 18.4 GB · 发送 3.2 GB')}</div>`).join('')}</section><aside class="panel"><div class="panel-head"><h2>连接检查</h2></div><div class="diagnostic"><div class="diagnostic-node">${icon('router')}<span>你的路由器</span></div><div class="diagnostic-link"></div><div class="diagnostic-node">${icon('globe')}<span>${state.offline?'互联网连接中断':'互联网已连接'}</span></div></div>${info('DNS 解析','正常 · 12 ms')}${info('外网延迟',state.offline?'超时':'8 ms')}${info('IPv6 连通性','正常')}<p class="wifi-note">${icon('info')}文档保留地址用于演示，不对应真实公网设备。</p><div class="system-actions">${button(state.offline?'恢复演示连接':'模拟断网','power','outage','outline')}</div></aside></div>`;}
function systemPage(){return `${heading('系统的每一刻，心中有数。','资源、运行日志与主题动效设置。')}<div class="system-grid"><section class="panel"><div class="panel-head"><h2>资源使用情况</h2>${status('运行正常')}</div>${resources()}${info('设备型号','GL.iNet GL-MT3000')}${info('处理器','MediaTek MT7981 · 双核 1.3 GHz')}${info('固件版本','OpenWrt 24.10.2')}${info('运行时间','3 天 08 小时 24 分')}${info('系统温度','42°C')}<div class="system-actions">${button('导出示例日志','download','export','outline')}${button('重新加载界面','refresh','refresh','outline')}</div></section><section class="panel"><div class="panel-head"><h2>最近的网络事件</h2><span class="muted" style="font-size:10px">示例日志</span></div>${[['14:35:02','WAN','PPPoE 链路连接正常'],['14:32:18','Wi-Fi','iPhone 16 Pro 已接入 5 GHz'],['14:30:41','DHCP','为 MacBook Pro 分配 IP 地址'],['14:28:09','LAN','客厅 Apple TV 有线连接正常']].map(([time,type,msg])=>`<div class="log-line"><time>${time}</time><span><span class="log-status">${type}</span><p>${msg}</p></span></div>`).join('')}<div class="wifi-row" style="margin-top:20px"><div class="wifi-info"><strong>界面动效</strong><small>切换、点击、图表与连接反馈</small></div>${switcher('motion',state.motion,'界面动效')}</div><p class="wifi-note">${icon('info')}随时暂停动效；系统的减少动态效果偏好优先。</p></section></div>`;}
function filterDevices(){
 const q=state.query.toLowerCase().trim();let count=0;
 $$('[data-device-row]').forEach(row=>{const d=demoDevices[+row.dataset.deviceRow];const visible=(!q||`${d.name} ${d.ip} ${d.vendor}`.toLowerCase().includes(q))&&(state.filter==='all'||(state.filter==='wired'?d.connection==='有线':d.connection!=='有线'));row.hidden=!visible;if(visible)count++;});
 const empty=$('.empty-state');if(empty)empty.style.display=count?'none':'block';
 if($('.device-page .table-wrap'))$('.device-page .table-wrap').style.display=count?'block':'none';
 if($('#deviceCount'))$('#deviceCount').textContent=`显示 ${count} / ${demoDevices.length} 台设备`;
 $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===state.filter));
}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function progress(on){$('.loadline').classList.toggle('loading',on);}
function updateUrl(){try{history.replaceState(null,'',`?theme=${state.theme}&page=${state.page}${selectedTide?'&appearance='+state.appearance:''}`);}catch{}}
async function go(page){
 if(!names[page]||page===state.page)return;const token=++routeToken;
 if(motion())$('#content').classList.add('page-leave');progress(true);
 await new Promise(r=>setTimeout(r,motion()?110:0));if(token!==routeToken)return;
 state.page=page;collapsedGroups.delete(page==='overview'||page==='devices'?'status':page==='system'?'system':'network');render(true);updateUrl();$('#announcer').textContent=`已打开${names[page]}`;
 if(innerWidth<680)scrollTo({top:0,behavior:'instant'});
 setTimeout(()=>{if(token===routeToken)progress(false);},320);
}
function changeTheme(theme,event){
 if(!themes[theme]||theme===state.theme)return;activeTransition?.skipTransition();
 document.documentElement.style.setProperty('--click-x',`${event?.clientX||innerWidth/2}px`);document.documentElement.style.setProperty('--click-y',`${event?.clientY||25}px`);
 const update=()=>{state.theme=theme;render();updateUrl();$('#announcer').textContent=`${themes[theme].cn} ${themes[theme].name} 主题已打开`;};
 if(document.startViewTransition&&motion())activeTransition=document.startViewTransition(update);else update();
}
function changeAppearance(appearance,event){
 if(!selectedTide||!['light','dark','auto'].includes(appearance)||appearance===state.appearance)return;
 activeTransition?.skipTransition();
 document.documentElement.style.setProperty('--click-x',`${event?.clientX||innerWidth/2}px`);
 document.documentElement.style.setProperty('--click-y',`${event?.clientY||25}px`);
 const update=()=>{state.appearance=appearance;render();updateUrl();$('#announcer').textContent=`已切换到${isDark()?'深色':'浅色'}模式`;};
 if(document.startViewTransition&&motion())activeTransition=document.startViewTransition(update);else update();
}
function syncMotion(){document.body.classList.toggle('motion-off',!state.motion);$('#motionToggle').setAttribute('aria-pressed',state.motion);$('#motionToggle span:last-child').textContent=state.motion?'动效开启':'动效暂停';$$('[data-switch=motion]').forEach(b=>b.setAttribute('aria-checked',state.motion));activeTransition?.skipTransition();toast(state.motion?'动效已开启 · 点击主题、设备和刷新试试':'动效已暂停');}
async function refresh(diagnose=false){
 const token=++routeToken;progress(true);$$('[data-action=refresh],[data-action=diagnose]').forEach(b=>{b.disabled=true;b.classList.add('loading-button');});$('#announcer').textContent=diagnose?'正在检测演示连接':'正在加载示例数据';
 if(diagnose){await new Promise(r=>setTimeout(r,650));if(token!==routeToken)return;state.offline=false;render();toast('检查完成 · DNS、WAN 与 IPv6 均正常（演示）');}
 else{$('#content').innerHTML=`${heading(names[state.page],'正在同步示例数据…')}<div class="overview-grid"><div class="panel skeleton-panel" aria-label="正在加载"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div><div class="panel skeleton-panel"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div></div>${footer()}`;await new Promise(r=>setTimeout(r,700));if(token!==routeToken)return;render();toast('示例数据已更新');}
 progress(false);
}
function openDevice(id){
 const d=demoDevices[id];if(!d)return;const dialog=$('#deviceDialog');dialogClosing=false;dialog.classList.remove('drawer-close-animation');
 dialog.innerHTML=`<div class="drawer"><button class="icon-btn drawer-close" data-action="closeDevice" aria-label="关闭设备详情">${icon('close')}</button><div class="drawer-profile"><div class="device-glyph">${icon(d.type)}</div><h2 id="deviceTitle">${d.name}</h2><p>${d.vendor} · ${d.note}</p>${status(d.blocked?'已暂停网络':'连接正常')}</div><section class="drawer-section"><h3>连接信息</h3>${info('IP 地址',d.ip)}${info('MAC 地址',d.mac)}${info('连接方式',d.connection)}${info('连接时长','02 小时 18 分钟')}${info('信号强度',d.connection==='有线'?'1000 Mbps':'−42 dBm · 良好')}</section><section class="drawer-section"><h3>网络活动</h3>${info('实时下载',d.blocked?'0 Mbps':d.rate+' Mbps')}${info('实时上传',d.blocked?'0 Mbps':'4.2 Mbps')}${resource('今日流量占比',32,'累计接收 5.9 GB')}</section><div class="drawer-actions">${button(d.blocked?'恢复网络':'暂停网络','power','blockDevice','outline')}<button class="btn primary" data-action="closeDevice">完成${icon('check')}</button></div><p class="drawer-note">交互演示：暂停和恢复只影响此页面的示例状态。</p></div>`;
 dialog.dataset.device=id;if(!dialog.open)dialog.showModal();
}
function closeDevice(){const d=$('#deviceDialog');if(!d.open||dialogClosing)return;dialogClosing=true;if(motion()){d.classList.add('drawer-close-animation');setTimeout(()=>{d.close();d.classList.remove('drawer-close-animation');dialogClosing=false;},220);}else{d.close();dialogClosing=false;}}
function resetForm(){state.form={...state.saved};state.wifi5=state.savedWifi5??true;state.dirty=false;render();toast('已恢复上次保存的示例设置');}
async function saveForm(event){
 event.preventDefault();if(state.saving)return;const ssidSize=new TextEncoder().encode(state.form.ssid.trim()).length;const validName=ssidSize>0&&ssidSize<=32,validPass=/^[\x20-\x7e]{8,63}$/.test(state.form.password);
 [['ssid',validName],['password',validPass]].forEach(([id,valid])=>{const el=$(`[data-field=${id}]`);el.classList.toggle('invalid',!valid);$(`#${id}`).setAttribute('aria-invalid',!valid);$(`#${id}`).setAttribute('aria-describedby',valid?`${id}Hint`:`${id}Error`);});
 if(!validName||!validPass){$(`#${!validName?'ssid':'password'}`).focus();toast('还有一项设置需要检查');return;}
 const savingDraft={...state.form};const savingWifi=state.wifi5;state.saving=true;progress(true);$$('#wirelessForm input,#wirelessForm select,#wirelessForm button').forEach(el=>el.disabled=true);const btn=$('#saveButton');btn.disabled=true;btn.classList.add('loading-button');btn.innerHTML=icon('refresh')+'<span>正在校验…</span>';
 await new Promise(r=>setTimeout(r,380));if(btn.isConnected)$('span',btn).textContent='正在应用…';await new Promise(r=>setTimeout(r,480));state.saved=savingDraft;state.savedWifi5=savingWifi;state.dirty=JSON.stringify(state.form)!==JSON.stringify(savingDraft)||state.wifi5!==savingWifi;state.saving=false;progress(false);if(state.page==='wireless')render();toast('示例设置已应用 · 真实路由器未发生变化');
}
function burst(event,target){
 if(!motion())return;const rect=target.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*1.8;const r=document.createElement('span');r.className='ripple';r.style.cssText=`width:${size}px;height:${size}px;left:${event.clientX-rect.left-size/2}px;top:${event.clientY-rect.top-size/2}px`;target.style.overflow='hidden';target.append(r);setTimeout(()=>r.remove(),620);
 if(target.matches('.map-node,.btn.primary,[data-theme]'))for(let i=0;i<5;i++){const dot=document.createElement('i');dot.className='click-burst';dot.style.cssText=`left:${event.clientX}px;top:${event.clientY}px;--dx:${Math.cos(i*1.256)*24}px;--dy:${Math.sin(i*1.256)*24}px`;document.body.append(dot);setTimeout(()=>dot.remove(),560);}
}
document.addEventListener('click',async event=>{
 const target=event.target.closest('button');if(!target||target.disabled)return;burst(event,target);
 if(target.dataset.appearance){changeAppearance(target.dataset.appearance,event);return;}if(target.dataset.theme){changeTheme(target.dataset.theme,event);return;}if(target.id==='motionToggle'){state.motion=!state.motion;syncMotion();return;}if(target.dataset.page){if($('.sidebar').classList.contains('open'))mobileMenu(false);go(target.dataset.page);return;}if(target.dataset.device!==undefined){openDevice(+target.dataset.device);return;}
 if(target.dataset.range){state.range=target.dataset.range;target.closest('.panel').outerHTML=trafficPanel(state.theme==='grove');return;}if(target.dataset.filter){state.filter=target.dataset.filter;filterDevices();return;}if(target.dataset.navGroup){const id=target.dataset.navGroup,group=target.closest('.nav-group');if(collapsedGroups.has(id))collapsedGroups.delete(id);else collapsedGroups.add(id);target.setAttribute('aria-expanded',!collapsedGroups.has(id));group.classList.toggle('collapsed',collapsedGroups.has(id));$('.nav-children-inner',group).inert=collapsedGroups.has(id);return;}
 if(target.dataset.switch){const id=target.dataset.switch;state[id]=!state[id];if(id==='motion'){syncMotion();return;}target.setAttribute('aria-checked',state[id]);if(state.page==='wireless'){state.dirty=true;$('#saveHint').innerHTML='<i class="dirty-indicator"></i>有未保存的示例设置';}else{const note=target.closest('.wifi-row')?.querySelector('small');if(note)note.textContent=state[id]?(id==='wifi5'?`Wi-Fi 6 · ${wifiCount('5 GHz')} 台设备`:`Wi-Fi 6 · ${wifiCount('2.4 GHz')} 台设备`):'无线网络已关闭 · 演示';}toast(`示例 ${id==='wifi5'?'5 GHz':'2.4 GHz'} 网络${state[id]?'已开启':'已关闭'}`);return;}
 const action=target.dataset.action;
 if(action==='menu'){mobileMenu(!$('.sidebar').classList.contains('open'));return;}if(action==='closeMenu'){mobileMenu(false);return;}if(action==='refresh'||action==='diagnose'){refresh(action==='diagnose');return;}if(action==='closeDevice'){closeDevice();return;}
 if(action==='search'){await go('devices');$('#deviceSearch')?.focus();return;}if(action==='clearSearch'){state.filter='all';state.query='';$('#deviceSearch').value='';filterDevices();return;}
 if(action==='password'){const p=$('#password');p.type=p.type==='password'?'text':'password';target.setAttribute('aria-label',p.type==='password'?'显示无线密码':'隐藏无线密码');return;}if(action==='reset'){resetForm();return;}
 if(action==='outage'){state.offline=!state.offline;render();toast(state.offline?'断网状态已模拟 · 点击检测连接可恢复':'演示连接已恢复');return;}
 if(action==='blockDevice'){const d=demoDevices[+$('#deviceDialog').dataset.device];d.blocked=!d.blocked;openDevice(d.id);render();toast(d.blocked?'已暂停这台设备的示例网络':'这台设备的示例网络已恢复');return;}
 if(action==='export'){const url=URL.createObjectURL(new Blob(['OpenWrt LuCI prototype — illustrative log\n14:35:02 WAN connected\n14:32:18 iPhone connected to 5GHz\n14:30:41 DHCP lease allocated\n'],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='openwrt-demo.log';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('示例日志已导出');}
});
document.addEventListener('input',event=>{if(event.target.id==='deviceSearch'){state.query=event.target.value;filterDevices();return;}if(event.target.closest('#wirelessForm')&&event.target.name){state.form[event.target.name]=event.target.value;state.dirty=true;$('#saveHint').innerHTML='<i class="dirty-indicator"></i>有未保存的示例设置';event.target.closest('.field')?.classList.remove('invalid');}});
document.addEventListener('change',event=>{if(event.target.closest('#wirelessForm')&&event.target.name){state.form[event.target.name]=event.target.value;state.dirty=true;$('#saveHint').innerHTML='<i class="dirty-indicator"></i>有未保存的示例设置';}});
document.addEventListener('submit',event=>{if(event.target.id==='wirelessForm')saveForm(event);});
document.addEventListener('pointermove',event=>{const chart=event.target.closest('.chart');if(!chart)return;const rect=chart.getBoundingClientRect(),x=Math.max(34,Math.min(rect.width-1,event.clientX-rect.left));$('.chart-cursor',chart).style.left=x+'px';$('.chart-tooltip',chart).style.left=Math.max(0,Math.min(x+8,rect.width-160))+'px';$('.chart-tooltip',chart).textContent=`${state.range==='1h'?'14:'+String(Math.floor(x/rect.width*60)).padStart(2,'0'):'14:3'+Math.min(4,Math.floor(x/rect.width*5))} · ↓ ${state.offline?'0.0':(83+x/rect.width*67).toFixed(1)} Mbps`;});
$('#deviceDialog').addEventListener('cancel',event=>{event.preventDefault();closeDevice();});
$('#deviceDialog').addEventListener('click',event=>{if(event.target===$('#deviceDialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left)closeDevice();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)$$('.map-lines').forEach(s=>s.pauseAnimations?.());else if(state.motion)$$('.map-lines').forEach(s=>s.unpauseAnimations?.());});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{state.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;syncMotion();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(selectedTide&&state.appearance==='auto')render();});
render();updateUrl();
function hero(){return `<section class="hero"><div class="hero-head"><div class="hero-mark">${icon(state.offline?'info':'check')}</div><div><h2 class="hero-title">${state.offline?'互联网连接已中断':state.theme==='noct'?'所有链路正常运行':'网络很顺畅。'}</h2><p>${state.offline?'WAN 接口暂时离线。点击「重新检测」恢复演示连接。':'WAN 已连接 · '+(state.theme==='noct'?'延迟 8 ms · 无丢包':'运行 3 天 08 小时 · 一切就绪')}</p></div></div><div class="hero-right"><div class="device-stack">${['laptop','phone','tv'].map(i=>`<span>${icon(i)}</span>`).join('')}</div><div><strong>${online()}<span style="font-size:12px;font-weight:500;margin-left:5px">台</span></strong><small>设备在线</small></div>${state.theme==='noct'?'<div><strong>8<span style="font-size:11px;margin-left:5px">ms</span></strong><small>网络延迟</small></div>':''}</div></section>`;}
function metrics(){return `<div class="metrics">${[['实时下载','down',state.offline?'0.0':'128.6','Mbps','今日累计 18.4 GB'],['实时上传','up',state.offline?'0.0':'24.8','Mbps','今日累计 3.2 GB'],['网络延迟','time',state.offline?'—':'8','ms','丢包率 0.0%']].map(a=>`<div class="metric"><div class="metric-label">${icon(a[1])}${a[0]}</div><div class="metric-value"><strong>${a[2]}</strong><span>${a[3]}</span></div><p class="metric-note">${a[4]}</p></div>`).join('')}</div>`;}
function chart(){
 const isLong=state.range==='1h';
 const line=state.offline?'M0 146L600 146':isLong?'M0 119 C20 120 25 65 48 72S70 131 100 98S115 36 143 57S164 112 187 108S210 55 235 67S260 102 280 94S300 19 326 37S350 87 375 80S392 42 418 59S450 130 474 93S500 56 526 65S566 51 600 38':'M0 105 C20 103 24 115 41 113S67 67 83 72S103 100 123 93S145 48 164 50S183 80 200 79S224 60 243 67S271 105 288 103S306 47 326 48S350 16 371 27S390 80 410 77S440 61 461 66S483 45 503 53S525 86 547 74S573 45 600 55';
 return `<div class="chart" role="img" aria-label="示例流量曲线。下载 128.6 Mbps，上传 24.8 Mbps。可切换时间范围。"><div class="chart-y"><span>200</span><span>100</span><span>0</span></div><svg viewBox="0 0 600 150" preserveAspectRatio="none"><path class="chart-grid" d="M0 0H600M0 75H600M0 149H600"/><path class="chart-area" d="${line}L600 150H0Z"/><path class="chart-line" d="${line}"/><path class="chart-line secondary" d="${state.offline?'M0 149H600':'M0 142 C35 145 60 128 88 133S140 121 163 129S210 139 239 137S281 132 300 137S340 110 370 117S412 132 442 131S480 126 510 133S554 128 600 127'}"/></svg><div class="chart-cursor"></div><div class="chart-tooltip">14:32 · ↓ 128.6 Mbps</div><div class="chart-x">${(isLong?['13:35','13:50','14:05','14:20','14:35']:['14:30','14:31','14:32','14:33','14:34','14:35']).map(s=>`<span>${s}</span>`).join('')}</div></div><div class="chart-legend"><span><i class="legend-dot"></i>下载</span><span><i class="legend-dot up"></i>上传</span><span class="live-status"><i class="live-dot"></i>示例实时流量</span></div>`;
}
function trafficPanel(grove=false){return `<section class="panel ${grove?'grove-traffic':''}"><div class="panel-head"><h2>流量动态</h2><div class="segment" role="group" aria-label="流量时间范围">${[['5m','5 分钟'],['1h','1 小时']].map(([id,n])=>`<button data-range="${id}" aria-pressed="${state.range===id}">${n}</button>`).join('')}</div></div>${metrics()}${chart()}</section>`;}
function resource(label,value,note){return `<div class="resource"><div class="resource-head"><span>${label}</span><strong>${value}%</strong></div><div class="meter" style="--value:${value}%"><span></span></div><p>${note}</p></div>`;}
function resources(){return `<div class="resources">${resource('CPU',12,'2 核 · 42°C')}${resource('内存',36,'184 / 512 MB')}${resource('存储',21,'54 / 256 MB')}</div>`;}
function interfacePanel(){return `<section class="panel"><div class="panel-head"><h2>${state.theme==='noct'?'链路与硬件':'互联网连接'}</h2>${more('管理','network')}</div><div class="interface-title"><div class="interface-icon">${icon('globe')}</div><div><strong>WAN</strong><p>eth0 · PPPoE</p></div><span class="status-text">${state.offline?'离线':'已连接'}</span></div>${state.theme==='noct'?`<div class="port-rack">${['WAN','LAN 1','LAN 2','LAN 3'].map((p,i)=>`<div class="port ${i<3&&!state.offline?'live':''}"><div class="port-shape">${i<3?'<i></i>':''}</div><span>${p}</span></div>`).join('')}</div>`:''}${info('IPv4 地址','203.0.113.28')}${info('连接速率','1000 Mbps / 全双工')}${info('DNS 服务器','223.5.5.5')}${resources()}</section>`;}
function deviceTable(devices=demoDevices.slice(0,3),full=false){return `<div class="table-wrap"><table class="device-table"><thead><tr><th>设备</th><th class="hide-mobile">IP 地址</th><th>${full?'连接方式':'实时下载'}</th><th>${full?'状态':''}</th></tr></thead><tbody>${devices.map(d=>`<tr data-device-row="${d.id}"><td><button class="device-name device-open" data-device="${d.id}"><span class="device-glyph">${icon(d.type)}</span><span><strong>${esc(d.name)}</strong><small>${d.vendor} · ${full?d.ip:d.connection}</small></span></button></td><td class="hide-mobile">${d.ip}</td><td>${full?`<span class="connection-chip">${icon(d.connection==='有线'?'ethernet':'wifi')}${d.connection}</span>`:`<span class="rate">${d.rate} Mbps</span>`}</td><td>${full?status(d.blocked?'已暂停':'在线'):`<button class="row-link" data-device="${d.id}">详情</button>`}</td></tr>`).join('')}</tbody></table></div>`;}
function wifiPanel(){return `<section class="panel"><div class="panel-head"><h2>无线网络</h2>${more('设置','wireless')}</div>${[['wifi5','Home · 5G','5 GHz',`Wi-Fi 6 · ${wifiCount('5 GHz')} 台设备`],['wifi24','Home','2.4 GHz',`Wi-Fi 6 · ${wifiCount('2.4 GHz')} 台设备`]].map(([id,name,band,sub])=>`<div class="wifi-row">${icon('wifi')}<div class="wifi-info"><strong>${name}</strong><small>${state[id]?sub:'无线网络已关闭 · 演示'}</small></div><span class="wifi-band">${band}</span>${switcher(id,state[id],`${name} 无线网络`)}</div>`).join('')}<p class="wifi-note">${icon('shield')}WPA2 / WPA3 混合加密 · 密码已保护</p></section>`;}
function overview(){
 const t=themes[state.theme];
 if(state.theme==='grove')return `${heading(t.headline,t.description)}<div class="grove-grid">${mapPanel()}<section class="panel device-ledger"><div class="panel-head"><h2>${online()} 台设备，在家里</h2>${more('全部设备','devices')}</div>${demoDevices.slice(0,5).map(d=>`<button class="ledger-row" data-device="${d.id}"><span class="device-glyph">${icon(d.type)}</span><span class="ledger-copy"><strong>${d.name}</strong><small>${d.note} · ${d.connection}</small></span><span class="ledger-speed">${d.rate}<small> Mbps</small></span></button>`).join('')}</section></div><div class="grove-bottom">${trafficPanel(true)}${wifiPanel()}</div>`;
 return `${heading(t.headline,t.description)}${hero()}<div class="overview-grid">${trafficPanel()}${interfacePanel()}</div><div class="lower-grid"><section class="panel"><div class="panel-head"><h2>在线设备 <span class="muted" style="font-size:11px;margin-left:6px;font-weight:500">${online()}</span></h2>${more('查看全部','devices')}</div>${deviceTable()}</section>${wifiPanel()}</div>`;
}
function mapPanel(){return `<section class="panel map-panel"><div class="panel-head"><h2>${state.offline?'互联网暂时离线':'每一条连接，都在这里。'}</h2>${status(state.offline?'WAN 离线':'连接健康')}</div><div class="network-map"><svg class="map-lines" viewBox="0 0 500 264" preserveAspectRatio="none" aria-hidden="true"><path class="connection" d="M250 58V127M65 126H250M435 126H250M133 229Q190 225 250 127M367 229Q310 225 250 127"/><circle class="packet" r="3"><animateMotion dur="3.5s" repeatCount="indefinite" path="M250 58V127"/></circle><circle class="packet" r="3"><animateMotion dur="4s" repeatCount="indefinite" path="M65 126H250"/></circle><circle class="packet" r="3"><animateMotion dur="4.2s" repeatCount="indefinite" path="M250 127Q310 225 367 229"/></circle></svg><div class="router-center">${icon('router')}<strong>OpenWrt · Home</strong></div><button class="map-node top" data-page="network"><span class="node-icon">${icon('globe')}</span><span>互联网 <small>8 ms</small></span></button><button class="map-node left" data-device="0"><span class="node-icon">${icon('laptop')}</span><span>MacBook Pro</span></button><button class="map-node right" data-device="1"><span class="node-icon">${icon('phone')}</span><span>iPhone 16 Pro</span></button><button class="map-node bottom-left" data-device="2"><span class="node-icon">${icon('tv')}</span><span>客厅 Apple TV</span></button><button class="map-node bottom-right" data-page="devices"><span class="node-icon">${icon('devices')}</span><span>另外 ${online()-3} 台设备</span></button></div><div class="map-footer"><span>${state.offline?'WAN 离线':'WAN · 1000 Mbps'}</span><span>运行 3 天 08 小时</span><span>CPU 12% · 42°C</span></div></section>`;}

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.sidebar')?.classList.contains('open'))mobileMenu(false);});
