// Render the actual theme templates with explicit test-only board data.
global.media = '/luci-static/tide';
global.resource = '/luci-static/resources';
global.theme = 'tide';
global.blank_page = false;
global.css = null;
global.node = {title:'Tide Overview'};
global.dispatched = {title:'Tide Overview'};
global.ctx = {request_path:['admin','status','tide']};
global.dispatcher = {lang:'en',build_url:(...args)=>'/cgi-bin/luci/'+join('/',args),lookup:()=>true};
global.ubus = {call:()=>({hostname:'OpenWrt',model:'Fixture router',release:{description:'OpenWrt 25.12 (test fixture)'}})};
global.http = {prepare_content:()=>{}};
global.version = {luciname:'LuCI',luciversion:'25.12',distname:'OpenWrt',distversion:'25.12',distrevision:'fixture',disturl:'https://openwrt.org'};
global.lua_active = false;
global.duser = 'root';
global.fuser = null;
global._ = (s)=>s;
global.striptags = (s)=>replace(s, /<[^>]*>/g, '');
global.entityencode = (s)=>replace(replace(replace(replace(`${s}`, '&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;');
global.include = function(path, scope) {
	let template = path in ['header','footer'] ? `themes/tide/${path}` : path;
	call(loadfile(`${template_root}/${template}.ut`,{raw_mode:false}),null,scope ?? {});
};
if (fixture_page == 'login') {
	include('themes/tide/sysauth');
} else {
	include('header');
	print('<div id="view"><div class="spinning">Loading view…</div></div>');
	print('<script src="/luci-static/resources/luci.js"></script><script src="/fixture.js"></script>');
	include('footer');
}
