/* Test fixture only: RPC, menu and counters below are synthetic. Not packaged. */
window._ = function(value) { return value; };
window.L = LuCI.prototype;
Object.assign(L.env, {requestpath:['admin','status','tide'],dispatchpath:['admin','status','tide'],media:'/luci-static/tide',scriptname:'/cgi-bin/luci'});
window.E = function() { return L.dom.create.apply(L.dom,arguments); };
window.fixture = {fail:false,denied:false,offline:false,rx:10240000,tx:1200000,time:Date.now(),rpcCalls:0};
var originalNow = Date.now;
Date.now = function() { return fixture.time; };
var nativeBind = L.bind;
var dom = L.dom;
var ui = {
	menu:{getChildren:function(node) {
		return Object.entries(node.children || {}).filter(function(pair) { return pair[1].satisfied && pair[1].title != null; })
			.map(function(pair) { return Object.assign(pair[1],{name:pair[0]}); }).sort(function(a,b) { return (a.order || 0) - (b.order || 0); });
	}},
	showModal:function(title,content) { var el = E('div',{'class':'modal'},[E('h4',{},[title]),content]); document.body.appendChild(el); return el; },
	hideModal:function() { var el = document.querySelector('.modal'); if (el) el.remove(); }
};
var rpc = {declare:function(spec) { return function() {
	fixture.rpcCalls++;
	if (spec.method === 'access') return Promise.resolve(!fixture.denied);
	if (fixture.fail && spec.method === 'info') return Promise.reject(new Error('Fixture network failure'));
	if (spec.method === 'board') return Promise.resolve({hostname:'OpenWrt',model:'Fixture router'});
	if (spec.method === 'info') return Promise.resolve({uptime:92350,load:[12000,9000,6000],memory:{total:536870912,available:318767104}});
	if (spec.method === 'getDHCPLeases') return Promise.resolve({dhcp_leases:[
		{hostname:'工作室 MacBook',macaddr:'AA:BB:CC:DD:EE:01',ipaddr:'192.168.1.101',expires:1200},
		{hostname:'客厅电视',macaddr:'AA:BB:CC:DD:EE:02',ipaddr:'192.168.1.102',expires:2300},
		{hostname:fixture.deviceName || '<img src=x onerror="window.fixtureXss=true">',macaddr:'AA:BB:CC:DD:EE:03',ipaddr:'192.168.1.103',expires:false}
	]});
	return Promise.resolve({});
}; }};
var device = {getName:function(){return 'eth1';},getRXBytes:function(){return fixture.rx;},getTXBytes:function(){return fixture.tx;}};
var wan = {
	getName:function(){return 'wan';},isUp:function(){return !fixture.offline;},getL3Device:function(){return device;},
	getI18n:function(){return 'DHCP';},getIPAddrs:function(){return ['10.0.0.2/24'];},getIP6Addrs:function(){return [];},
	getGatewayAddr:function(){return '10.0.0.1';},getGateway6Addr:function(){return null;},getUptime:function(){return 2300;}
};
var wifi = {
	getName:function(){return 'radio0.network1';},getActiveSSID:function(){return 'Tide Studio';},isDisabled:function(){return false;},isUp:function(){return true;},
	getFrequency:function(){return '5.180';},getChannel:function(){return 36;},getActiveEncryption:function(){return 'WPA3 SAE';},
	getAssocList:function(){return Promise.resolve([{mac:'AA:BB:CC:DD:EE:01',signal:-42}]);}
};
var network = {flushCache:function(){return Promise.resolve();},getWANNetworks:function(){return Promise.resolve([wan]);},getWAN6Networks:function(){return Promise.resolve([wan]);},getWifiNetworks:function(){return Promise.resolve([wifi]);}};
var poll = {add:function(fn){fixture.poll = fn;},remove:function(){fixture.poll = null;}};
function page(title,children,order) { return {title:title,satisfied:true,children:children || {},order:order,action:{type:children ? 'firstchild' : 'view'}}; }
var plugins = {};
for (var i=0;i<45;i++) plugins['plugin'+i] = page('插件 '+i+' · 多级菜单与超长中文名称兼容性验证',null,i);
plugins.nested = page('三级菜单',{deep:page('第四级页面')},-1);
plugins.denied = {title:'Forbidden menu',satisfied:false};
var tree = {children:{admin:page('Administration',{
	status:page('状态',{tide:page('Tide Overview'),overview:page('原生状态总览')},0),
	network:page('网络',{network:page('接口'),wireless:page('无线')},1),
	services:page('服务',plugins,2),system:page('系统',{system:page('系统设置'),logout:page('退出')},3)
})}};
L.require = function(name) { return name === 'menu-tide' ? fixtureMenuPromise : Promise.resolve({}); };
var factory = function(source,base) { return new Function('view','rpc','network','poll','ui','dom','baseclass',source)({extend:function(value){return value;}},rpc,network,poll,ui,dom,{extend:function(value){return value;}}); };
var fixtureMenuPromise = fetch('/luci-static/resources/menu-tide.js').then(function(r){return r.text();}).then(function(source){
	var menu = factory(source); fixture.menu = menu; menu.render(tree); return menu;
});
fixture.ready = fetch('/luci-static/resources/view/tide/overview.js').then(function(r){return r.text();}).then(function(source){
	var view = factory(source); fixture.view = view;
	return view.load().then(function(data){var element = view.render(data); document.getElementById('view').replaceChildren(element); fixture.loaded = true;});
});
fixture.step = async function() { fixture.time += 5000; fixture.rx += 38000000; fixture.tx += 1100000; await fixture.view.refresh(false); };
fixture.form = function() {
	var value = E('div',{'class':'cbi-value'},[
		E('label',{'class':'cbi-value-title',for:'fixture-name'},['设备名称']),E('div',{'class':'cbi-value-field'},E('input',{id:'fixture-name',value:'OpenWrt'}))
	]);
	var table = E('table',{'class':'table cbi-section-table'},[
		E('tr',{'class':'tr'},Array.from({length:12},function(_,i){return E('th',{'class':'th'},['Column '+i]);})),
		E('tr',{'class':'tr'},Array.from({length:12},function(_,i){return E('td',{'class':'td'},['Long plugin value '+i]);}))
	]);
	var section = E('section',{'class':'cbi-section'},[value,table]);
	document.getElementById('view').replaceChildren(E('div',{'class':'cbi-map'},[E('h2',{},['系统设置']),section,E('div',{'class':'cbi-page-actions'},E('button',{'class':'cbi-button cbi-button-apply'},['保存并应用']))]));
};
