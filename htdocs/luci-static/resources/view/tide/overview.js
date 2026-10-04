'use strict';
'require view';
'require rpc';
'require network';
'require poll';
'require ui';
'require dom';

var callBoard = rpc.declare({ object:'system', method:'board' });
var callInfo = rpc.declare({ object:'system', method:'info' });
var callLeases = rpc.declare({ object:'luci-rpc', method:'getDHCPLeases', expect:{'':{}} });
var callAccess = rpc.declare({ object:'session', method:'access', params:['scope','object','function'], expect:{access:false} });

/* LuCI E() treats a bare string as HTML. Router data must remain plain text. */
function safeChildren(value) {
	if (Array.isArray(value)) return value.flat(Infinity).filter(function(item) { return item != null; }).map(safeChildren);
	return typeof value === 'string' || typeof value === 'number' ? document.createTextNode(String(value)) : value;
}
function node(tag, cls, children) { return E(tag, cls ? {'class':cls} : {}, safeChildren(children)); }
function number(value, places) { return Number.isFinite(value) ? value.toFixed(places == null ? 1 : places) : '—'; }
function bytes(value) {
	if (!Number.isFinite(value)) return '—';
	var units = ['B','KiB','MiB','GiB','TiB'], index = 0;
	while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
	return number(value, index ? 1 : 0) + ' ' + units[index];
}
function duration(value) { return Number.isFinite(value) ? '%t'.format(Math.max(0,value)) : '—'; }
function svg(tag, attrs) {
	var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
	Object.keys(attrs).forEach(function(key) { el.setAttribute(key, attrs[key]); }); return el;
}
function kv(label, value) { return node('div','tide-kv',[node('span','',label),node('span','',value == null || value === '' ? '—' : String(value))]); }

return view.extend({
	load: function() {
		this.samples = []; this.previous = null; this.range = 300; this.request = null; this.paused = false;
		return Promise.all([
			L.resolveDefault(callAccess('access-group','luci-mod-status-index-dhcp','read'),false),
			L.resolveDefault(callAccess('access-group','luci-mod-status-index-wifi','read'),false)
		]).then(L.bind(function(access) {
			this.access = {dhcp:access[0],wifi:access[1]};
			return this.fetchData();
		},this)).catch(function(error) { return {error:error}; });
	},
	fetchData: function() {
		var access = this.access || {};
		return network.flushCache().then(function() {
			return Promise.all([
				callBoard(), callInfo(), network.getWANNetworks(), network.getWAN6Networks(),
				access.dhcp ? callLeases().then(function(data) { return {data:data}; },function(error) { return {error:error}; }) : Promise.resolve({denied:true}),
				network.getWifiNetworks().then(function(nets) {
					if (!access.wifi) return {nets:nets,denied:true,associations:[]};
					return Promise.all(nets.map(function(net) {
						return net.getAssocList().then(function(list) { return {net:net,list:list}; },function(error) { return {net:net,error:error,list:[]}; });
					})).then(function(lists) { return {nets:nets,associations:lists}; });
				},function(error) { return {nets:[],associations:[],error:error}; })
			]);
		}).then(function(data) {
			return {board:data[0],info:data[1],wan:data[2],wan6:data[3],leases:data[4],wifi:data[5],time:Date.now()};
		});
	},
	panel: function(title, link, linkTitle, content) {
		return node('section','tide-panel',[
			node('div','tide-panel-head',[node('h2','',title),link ? E('a',{href:link},linkTitle) : '']),content
		]);
	},
	render: function(data) {
		var self = this;
		this.root = node('div','tide-overview');
		this.refreshButton = E('button',{type:'button','class':'btn','click':function() { self.refresh(true); }},[Tide.icon('refresh'),_('Refresh')]);
		this.pauseButton = E('button',{type:'button','class':'btn','aria-pressed':'false','click':function() {
			self.paused = !self.paused; self.previous = null;
			self.pauseButton.textContent = self.paused ? _('Resume') : _('Pause');
			self.pauseButton.setAttribute('aria-pressed',String(self.paused));
			self.sampleStatus.textContent = self.paused ? _('Sampling paused') : _('Sampling every 5 seconds');
			if (!self.paused) self.refresh(true);
		}},_('Pause'));
		this.errorBox = E('div',{'class':'alert-message error','role':'alert',hidden:''});
		this.heroTitle = node('h2','',_('Loading…')); this.heroDescription = node('p','');
		this.stationCount = node('strong','','—');
		this.sampleStatus = node('small','',_('Sampling every 5 seconds'));
		this.rxValue = node('strong','','—'); this.txValue = node('strong','','—'); this.totalValue = node('strong','','—');
		this.totalUnit = node('span','','');
		function metric(label, value, unit, note) {
			return node('div','tide-metric',[node('div','tide-metric-label',label),node('div','tide-metric-value',[value,node('span','',unit)]),node('div','tide-metric-note',note)]);
		}
		this.chart = svg('svg',{viewBox:'0 0 600 146',preserveAspectRatio:'none',role:'img','aria-label':_('WAN download and upload rates')});
		[0,48,96,145].forEach(function(y) { self.chart.appendChild(svg('line',{x1:0,x2:600,y1:y,y2:y,'class':'tide-chart-grid'})); });
		this.area = svg('path',{'class':'tide-chart-area'}); this.rxPath = svg('path',{'class':'tide-chart-line'}); this.txPath = svg('path',{'class':'tide-chart-line secondary'});
		this.chart.append(this.area,this.rxPath,this.txPath);
		this.chartEmpty = node('div','tide-chart-empty',_('Collecting real samples…'));
		this.chartScale = node('span','','—'); this.chartStart = node('span','',''); this.chartEnd = node('span','','');
		this.rangeSelect = E('select',{'aria-label':_('Traffic time range'),'change':function() { self.range = +self.rangeSelect.value; self.updateChart(true); }},[
			E('option',{value:'60'},_('1 minute')), E('option',{value:'300',selected:''},_('5 minutes')), E('option',{value:'600'},_('10 minutes'))
		]);
		this.rangeSelect.style.cssText = 'width:auto;min-height:32px;font-size:11px;padding:4px 8px';
		var trafficPanel = this.panel(_('Traffic'),null,null,[
			node('div','tide-metrics',[
				metric(_('Download'),this.rxValue,'Mbit/s',_('Current WAN rate')),
				metric(_('Upload'),this.txValue,'Mbit/s',_('Current WAN rate')),
				metric(_('Transferred'),this.totalValue,this.totalUnit,_('Interface counters'))
			]),
			node('div','tide-chart',[this.chartEmpty,this.chart,node('div','tide-chart-axis',[this.chartStart,this.chartScale,this.chartEnd])]),
			node('div','tide-chart-legend',[
				node('span','',[node('i','tide-legend-dot'),_('Download')]),node('span','',[node('i','tide-legend-dot secondary'),_('Upload')])
			])
		]);
		trafficPanel.querySelector('.tide-panel-head').appendChild(this.rangeSelect);
		trafficPanel.appendChild(this.sampleStatus);
		this.interfaceContent = node('div','');
		this.resourceContent = node('div','tide-resources');
		this.deviceBody = node('tbody','');
		this.deviceSearch = E('input',{type:'search','class':'tide-device-search',placeholder:_('Search name, IP or MAC'),'aria-label':_('Search devices'),'input':function() { self.updateDevices(); }});
		this.deviceEmpty = node('div','tide-empty');
		this.deviceNote = node('p','tide-muted'); this.deviceNote.style.fontSize = '11px';
		var deviceTable = node('table','tide-device-table',[
			node('thead','',node('tr','',[
				node('th','',_('Device')),node('th','hide-mobile',_('IP address')),node('th','',_('Status'))
			])),this.deviceBody
		]);
		this.wifiContent = node('div','');
		this.root.append(
			node('div','tide-page-heading',[
				node('div','',[node('h1','',_('Network overview')),node('p','',_('Your network, at a glance.'))]),
				node('div','tide-heading-actions',[this.pauseButton,this.refreshButton])
			]),this.errorBox,
			node('section','tide-hero',[
				node('div','tide-hero-head',[node('span','tide-hero-mark',Tide.icon('network')),node('div','',[this.heroTitle,this.heroDescription])]),
				node('div','tide-hero-stat',[this.stationCount,node('small','',_('Associated wireless stations'))])
			]),
			node('div','tide-overview-grid',[
				trafficPanel,this.panel(_('Internet & system'),L.url('admin/network/network'),_('Interfaces'),[this.interfaceContent,this.resourceContent])
			]),
			node('div','tide-lower-grid',[
				this.panel(_('Known devices'),L.url('admin/status/overview'),_('All status'),[this.deviceSearch,node('div','tide-table-wrap',deviceTable),this.deviceEmpty,this.deviceNote]),
				this.panel(_('Wireless networks'),L.url('admin/network/wireless'),_('Manage'),this.wifiContent)
			]),
			node('p','tide-muted',E('a',{href:L.url('admin/status/overview')},_('Open native status overview and plugin details')))
		);
		if (data.error) this.showError(data.error); else this.update(data);
		this.pollFn = function() { if (!self.paused && !document.hidden && self.root.isConnected) return self.refresh(false); };
		poll.add(this.pollFn,5);
		window.addEventListener('pagehide',function() { poll.remove(self.pollFn); if (self.drawer) self.drawer.remove(); },{once:true});
		return this.root;
	},
	showError: function(error) {
		this.previous = null;
		this.heroTitle.textContent = this.data ? _('Status data is stale') : _('Status unavailable');
		this.errorBox.hidden = false;
		dom.content(this.errorBox,[
			node('p','',_('Unable to refresh. Previous data is retained.') + ' ' + (error.message || String(error))),
			E('button',{type:'button','class':'btn','click':L.bind(function() { this.refresh(true); },this)},_('Retry'))
		]);
	},
	refresh: function(manual) {
		if (this.request) return this.request;
		var self = this;
		if (manual) { this.refreshButton.disabled = true; this.refreshButton.classList.add('spinning'); }
		this.request = this.fetchData().then(function(data) {
			self.errorBox.hidden = true; self.update(data);
			if (manual) Tide.announce(_('Status refreshed'));
		}).catch(function(error) { self.showError(error); }).finally(function() {
			self.refreshButton.disabled = false; self.refreshButton.classList.remove('spinning'); self.request = null;
		});
		return this.request;
	},
	update: function(data) {
		var initial = !this.data; this.data = data;
		var self = this, wans = data.wan.concat(data.wan6), devices = new Map();
		var active = Array.from(new Map(wans.filter(function(net) { return net.isUp(); }).map(function(net) { return [net.getName(),net]; })).values());
		active.forEach(function(net) { var dev = net.getL3Device(); if (dev) devices.set(dev.getName(),dev); });
		var id = Array.from(devices.keys()).sort().join(','), rx = 0, tx = 0;
		devices.forEach(function(dev) { rx += dev.getRXBytes(); tx += dev.getTXBytes(); });
		var elapsed = this.previous ? (data.time - this.previous.time) / 1000 : 0;
		var valid = id && this.previous && this.previous.id === id && elapsed > 0 && elapsed <= 15 && rx >= this.previous.rx && tx >= this.previous.tx;
		var rxRate = valid ? (rx - this.previous.rx) * 8 / elapsed / 1e6 : null;
		var txRate = valid ? (tx - this.previous.tx) * 8 / elapsed / 1e6 : null;
		this.samples.push({time:data.time,rx:rxRate,tx:txRate});
		this.samples = this.samples.filter(function(sample) { return sample.time >= data.time - 600000; });
		this.previous = id ? {id:id,time:data.time,rx:rx,tx:tx} : null;
		this.rxValue.textContent = number(rxRate); this.txValue.textContent = number(txRate);
		var total = id ? bytes(rx + tx).split(' ') : ['—',''];
		this.totalValue.textContent = total[0]; this.totalUnit.textContent = total[1];
		this.heroTitle.textContent = active.length ? _('Upstream interface connected') : _('No active upstream interface');
		this.heroDescription.textContent = _('Uptime') + ' ' + duration(data.info.uptime) + ' · ' + (data.board.hostname || 'OpenWrt') + ' · ' + _('Interface status is not an Internet reachability test.');
		var associations = data.wifi.associations || [], stations = new Set();
		associations.forEach(function(item) { item.list.forEach(function(station) { stations.add(station.mac.toUpperCase()); }); });
		this.stationCount.textContent = data.wifi.denied || data.wifi.error || associations.some(function(item) { return item.error; }) ? '—' : String(stations.size);
		dom.content(this.interfaceContent,active.length ? active.map(function(net) {
			return node('div','tide-upstream',[
				kv(_('Interface'),net.getName() + ' · ' + net.getI18n()),
				kv(_('Address'),(net.getIPAddrs() || []).concat(net.getIP6Addrs() || []).join(', ')),
				kv(_('Gateway'),net.getGatewayAddr() || net.getGateway6Addr()),
				kv(_('Connected'),duration(net.getUptime()))
			]);
		}) : node('p','tide-muted',_('No active upstream interface')));
		var memory = data.info.memory || {}, memTotal = +memory.total;
		var available = memory.available != null ? +memory.available : (+memory.free || 0) + (+memory.buffered || 0) + (+memory.cached || 0);
		var used = memTotal > 0 ? Math.max(0,Math.min(memTotal,memTotal - available)) : null;
		var load = data.info.load && Number.isFinite(data.info.load[0]) ? data.info.load[0] / 65535 : null;
		if (!this.memoryMeter) {
			this.memoryLabel = node('span',''); this.memoryFill = node('span','');
			this.memoryMeter = node('div','tide-meter' + (initial ? ' initial' : ''),this.memoryFill);
			this.resourceContent.append(kv(_('Load average'),number(load,2)),
				node('div','tide-resource',[node('div','tide-resource-label',[node('span','',_('Memory')),this.memoryLabel]),this.memoryMeter]));
		}
		this.resourceContent.firstChild.lastChild.textContent = number(load,2);
		this.memoryLabel.textContent = bytes(used) + ' / ' + bytes(memTotal);
		var percent = used != null ? used / memTotal * 100 : 0;
		this.memoryFill.style.setProperty('--value',percent.toFixed(1) + '%');
		this.memoryMeter.title = percent.toFixed(1) + '%';
		this.memoryMeter.setAttribute('role','meter'); this.memoryMeter.setAttribute('aria-label',_('Memory usage'));
		this.memoryMeter.setAttribute('aria-valuemin','0'); this.memoryMeter.setAttribute('aria-valuemax','100'); this.memoryMeter.setAttribute('aria-valuenow',percent.toFixed(1));
		if (initial) setTimeout(function() { self.memoryMeter.classList.remove('initial'); },850);
		this.updateChart(initial); this.updateDevices(); this.updateWifi();
	},
	updateChart: function(animate) {
		if (!this.data) return;
		var end = this.data.time, samples = this.samples.filter(L.bind(function(sample) { return sample.time >= end - this.range * 1000; },this));
		var valid = samples.filter(function(sample) { return sample.rx != null; });
		this.chart.style.display = valid.length < 2 ? 'none' : '';
		this.chartEmpty.hidden = valid.length >= 2;
		var max = Math.max(1,...valid.map(function(sample) { return Math.max(sample.rx,sample.tx); }));
		this.chartScale.textContent = _('Scale') + ' ' + number(max) + ' Mbit/s';
		var start = samples.length ? samples[0].time : end;
		this.chartStart.textContent = new Date(start).toLocaleTimeString(); this.chartEnd.textContent = new Date(end).toLocaleTimeString();
		function path(key) {
			var d = '', segment = false;
			samples.forEach(function(sample) {
				if (sample[key] == null) { segment = false; return; }
				var x = (sample.time - start) / Math.max(1,end - start) * 600, y = 140 - sample[key] / max * 134;
				d += (segment ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2); segment = true;
			}); return d;
		}
		this.rxPath.setAttribute('d',path('rx')); this.txPath.setAttribute('d',path('tx'));
		/* A gap remains a gap; do not shade across unavailable samples. */
		this.area.setAttribute('d',samples.every(function(sample) { return sample.rx != null; }) && valid.length >= 2 ? path('rx') + 'L600,146L0,146Z' : '');
		animate = animate || (!this.chartDrawn && valid.length >= 2);
		if (animate && Tide.motion() && valid.length >= 2) {
			this.chartDrawn = true;
			[this.rxPath,this.txPath].forEach(function(line) {
				var length = line.getTotalLength(); line.style.setProperty('--path-length',String(length));
				line.style.strokeDasharray = String(length); line.style.animation = 'none';
				requestAnimationFrame(function() { line.style.animation = 'tide-trace 1000ms var(--ease)'; });
			});
		} else {
			[this.rxPath,this.txPath].forEach(function(line) { line.style.animation = ''; line.style.strokeDasharray = ''; });
		}
	},
	updateDevices: function() {
		if (!this.data) return;
		var self = this, data = this.data, map = new Map(), associations = data.wifi.associations || [];
		var leases = data.leases.data || {};
		(leases.dhcp_leases || []).concat(leases.dhcp6_leases || []).forEach(function(lease) {
			var mac = (lease.macaddr || '').toUpperCase(), key = mac || lease.duid || lease.ipaddr;
			if (!key) return;
			var entry = map.get(key) || {mac:mac,name:lease.hostname || mac || lease.duid,addresses:[],connected:false};
			entry.addresses = Array.from(new Set(entry.addresses.concat(lease.ipaddr || [],lease.ip6addrs || lease.ip6addr || [])));
			entry.expires = lease.expires; map.set(key,entry);
		});
		associations.forEach(function(item) { item.list.forEach(function(station) {
			var mac = station.mac.toUpperCase(), entry = map.get(mac) || {mac:mac,name:mac,addresses:[]};
			entry.connected = true; entry.ssid = item.net.getActiveSSID(); entry.signal = station.signal; map.set(mac,entry);
		}); });
		var query = this.deviceSearch.value.trim().toLocaleLowerCase();
		var rows = Array.from(map.entries()).filter(function(pair) { var entry = pair[1]; return [entry.name,entry.mac,entry.addresses.join(' ')].join(' ').toLocaleLowerCase().indexOf(query) >= 0; });
		this.deviceRows = this.deviceRows || new Map();
		var keep = new Set();
		rows.forEach(function(pair,index) {
			var key = pair[0], entry = pair[1], row = self.deviceRows.get(key); keep.add(key);
			if (!row) {
				row = {name:node('strong',''),note:node('small',''),ip:node('td','hide-mobile'),badge:node('span','tide-badge')};
				row.button = E('button',{type:'button','class':'tide-device-open','click':function(event) { self.openDevice(row.entry,event.currentTarget); }},[
					node('span','tide-device-glyph',Tide.icon('device')),node('span','',[row.name,row.note])
				]);
				row.node = node('tr','',[node('td','',row.button),row.ip,node('td','',row.badge)]); self.deviceRows.set(key,row);
			}
			row.entry = entry; row.name.textContent = entry.name; row.note.textContent = entry.connected ? entry.ssid : entry.mac;
			row.ip.textContent = entry.addresses.join(', ') || '—';
			var status = entry.connected ? _('Connected') : entry.expires === false || entry.expires > 0 ? _('Lease active') : _('Lease expired');
			row.badge.className = 'tide-badge' + (entry.connected ? '' : ' off'); row.badge.textContent = status;
			if (self.deviceBody.children[index] !== row.node) self.deviceBody.insertBefore(row.node,self.deviceBody.children[index] || null);
		});
		this.deviceRows.forEach(function(row,key) { if (!keep.has(key)) { if (row.node.contains(document.activeElement)) self.deviceSearch.focus(); row.node.remove(); self.deviceRows.delete(key); } });
		this.deviceEmpty.hidden = rows.length > 0;
		dom.content(this.deviceEmpty,query ? [node('p','',_('No devices match your search.')),E('button',{type:'button','class':'btn','click':function() { self.deviceSearch.value = ''; self.updateDevices(); self.deviceSearch.focus(); }},_('Clear filter'))] : _('No device information available.'));
		this.deviceNote.textContent = data.leases.denied ? _('DHCP lease access is not permitted.') : data.leases.error ? _('Unable to load DHCP leases.') : _('A DHCP lease does not prove a device is online. Connected status comes from wireless associations.');
	},
	updateWifi: function() {
		var wifi = this.data.wifi;
		if (wifi.error) { dom.content(this.wifiContent,node('p','tide-muted',_('Wireless status unavailable.'))); return; }
		dom.content(this.wifiContent,wifi.nets.length ? wifi.nets.map(function(net) {
			var enabled = !net.isDisabled(), connected = enabled && net.isUp();
			return node('div','tide-wifi-row',[
				Tide.icon('wifi'),node('div','tide-wifi-info',[
					node('strong','',net.getActiveSSID() || net.getName()),
					node('small','',[net.getFrequency() ? net.getFrequency() + ' GHz' : '',net.getChannel() ? _('Channel') + ' ' + net.getChannel() : '',net.getActiveEncryption() || ''].filter(Boolean).join(' · '))
				]),node('span','tide-badge' + (connected ? '' : ' off'),!enabled ? _('Disabled') : connected ? _('Active') : _('Not associated'))
			]);
		}) : node('p','tide-muted',_('No wireless networks configured.')));
		if (wifi.denied || (wifi.associations || []).some(function(item) { return item.error; })) this.wifiContent.appendChild(node('p','tide-muted',_('Wireless association data unavailable.')));
	},
	openDevice: function(entry, trigger) {
		var self = this;
		if (this.drawer) return;
		var supportsDialog = typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal;
		if (!supportsDialog) {
			ui.showModal(document.createTextNode(entry.name),[kv(_('IP address'),entry.addresses.join(', ')),kv(_('MAC address'),entry.mac),kv(_('Wireless network'),entry.ssid),node('div','right',E('button',{'class':'btn','click':function() { ui.hideModal(); trigger.focus(); }},_('Close')))]); return;
		}
		this.drawer = E('dialog',{'class':'tide-device-drawer','aria-label':entry.name},[
			node('div','tide-drawer-head',[node('h2','',entry.name),E('button',{type:'button','class':'tide-icon-button','aria-label':_('Close'),'click':function() { self.closeDevice(trigger); }},Tide.icon('close'))]),
			node('p','tide-eyebrow',_('DEVICE DETAILS')),
			kv(_('IP address'),entry.addresses.join(', ')),kv(_('MAC address'),entry.mac),kv(_('Wireless network'),entry.ssid),
			kv(_('Signal'),Number.isFinite(entry.signal) ? entry.signal + ' dBm' : '—'),kv(_('Lease time remaining'),entry.expires === false ? _('unlimited') : duration(entry.expires)),
			node('p','tide-muted',_('Device information is a snapshot from the last successful refresh.'))
		]);
		this.drawer.addEventListener('cancel',function(event) { event.preventDefault(); self.closeDevice(trigger); });
		this.drawer.addEventListener('click',function(event) { if (event.target === self.drawer) { var r = self.drawer.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) self.closeDevice(trigger); } });
		this.drawer.addEventListener('close',function() { if (self.drawer) self.drawer.remove(); self.drawer = null; if (trigger.isConnected) trigger.focus(); else self.deviceSearch.focus(); });
		document.body.appendChild(this.drawer); this.drawer.showModal();
	},
	closeDevice: function() {
		var dialog = this.drawer;
		if (!dialog || dialog.classList.contains('closing')) return;
		if (!Tide.motion()) { dialog.close(); return; }
		dialog.classList.add('closing');
		setTimeout(function() { if (dialog.open) dialog.close(); },220);
	},
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
