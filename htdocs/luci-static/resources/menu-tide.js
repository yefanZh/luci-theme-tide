'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
	__init__: function() {
		ui.menu.load().then(L.bind(this.render, this)).catch(function(error) {
			var nav = document.getElementById('tide-navigation');
			if (!nav) return;
			nav.replaceChildren(E('p', { 'class':'tide-muted', 'role':'alert' }, _('Unable to load the menu.')),
				E('button', { 'class':'btn', 'click':function() { location.reload(); } }, _('Retry')));
			console.error(error);
		});
	},
	render: function(tree) {
		var nav = document.getElementById('tide-navigation');
		if (!nav) return;
		var request = L.env.requestpath || [], dispatch = L.env.dispatchpath || request;
		var modes = ui.menu.getChildren(tree);
		var mode = modes.find(function(child) { return child.name === request[0]; }) || modes[0];
		if (!mode) { nav.replaceChildren(E('p', _('No accessible menu entries.'))); return; }
		var state = {};
		try { state = JSON.parse(Tide.read('tide.navigation', '{}')); } catch (_) {}
		if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};
		var activePath = dispatch.join('/');
		var activeLink = null, activeLength = 0, count = 0;
		function isParent(path) { return activePath === path || activePath.indexOf(path + '/') === 0; }
		function link(child, path, depth) {
			var title = _(child.title), a = E('a', { href:L.url.apply(L, path.split('/')), title:title, 'style':'--depth:' + depth }, E('span', { 'class':'tide-nav-label' }, [title]));
			if (isParent(path) && path.length > activeLength) { activeLink = a; activeLength = path.length; }
			return E('li', {}, a);
		}
		function branch(node, path, depth, ancestors) {
			var ul = E('ul');
			if (depth > 16 || ancestors.indexOf(node.children) >= 0) return ul;
			var lineage = ancestors.concat([node.children]);
			ui.menu.getChildren(node).forEach(function(child) {
				var childPath = path + '/' + child.name;
				var children = ui.menu.getChildren(child);
				if (!children.length || lineage.indexOf(child.children) >= 0) { ul.appendChild(link(child, childPath, depth)); return; }
				var id = 'tide-group-' + (++count), expanded = isParent(childPath) || state[childPath] === true;
				var nested = branch(child, childPath, depth + 1, lineage);
				/* A branch can also be an actual page (e.g. interfaces with edit subpages). */
				if (child.action && ['view','template','call'].indexOf(child.action.type) >= 0) nested.prepend(link(child, childPath, depth + 1));
				var wrapper = E('div', { id:id, 'class':'tide-nav-children' }, E('div', { 'class':'tide-nav-children-inner' }, nested));
				var button = E('button', { type:'button', 'class':'tide-nav-group-button', title:_(child.title), 'aria-expanded':String(expanded), 'aria-controls':id, 'style':'--depth:' + depth }, [
					depth === 0 ? Tide.icon(child.name) : '', E('span', { 'class':'tide-nav-label' }, [_(child.title)]), Tide.icon('chevron')
				]);
				button.lastChild.classList.add('tide-nav-chevron');
				var li = E('li', { 'class':'tide-nav-group' + (expanded ? '' : ' collapsed') }, [button, wrapper]);
				wrapper.inert = !expanded;
				if (!expanded) wrapper.setAttribute('aria-hidden', 'true');
				function fallbackFocus(closed) { if ('inert' in HTMLElement.prototype) return; wrapper.querySelectorAll('a,button').forEach(function(el) { if (closed) el.setAttribute('tabindex','-1'); else if (!el.closest('.collapsed')) el.removeAttribute('tabindex'); }); }
				fallbackFocus(!expanded);
				button.addEventListener('click', function() {
					var open = button.getAttribute('aria-expanded') !== 'true';
					button.setAttribute('aria-expanded', String(open)); li.classList.toggle('collapsed', !open); wrapper.inert = !open;
					wrapper.toggleAttribute('aria-hidden', !open); if (!open) wrapper.setAttribute('aria-hidden', 'true');
					fallbackFocus(!open); state[childPath] = open; Tide.write('tide.navigation', JSON.stringify(state));
				});
				ul.appendChild(li);
			});
			return ul;
		}
		nav.replaceChildren(branch(mode, mode.name, 0, []));
		if (activeLink) activeLink.setAttribute('aria-current', 'page');
		var savedScroll = +Tide.read('tide.navigation.scroll', '0');
		nav.scrollTop = Number.isFinite(savedScroll) ? savedScroll : 0;
		if (activeLink && (activeLink.getBoundingClientRect().top < nav.getBoundingClientRect().top || activeLink.getBoundingClientRect().bottom > nav.getBoundingClientRect().bottom))
			nav.scrollTop += activeLink.getBoundingClientRect().top - nav.getBoundingClientRect().top - nav.clientHeight / 2;
		nav.addEventListener('scroll', function() { Tide.write('tide.navigation.scroll', String(nav.scrollTop)); }, {passive:true});
		nav.addEventListener('click', function(event) {
			var a = event.target.closest('a[href]');
			if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			Tide.write('tide.navigation.scroll', String(nav.scrollTop)); Tide.setMenu(false, false);
			/* Ordinary links preserve LuCI navigation and unsaved-change behavior. */
			if (Tide.motion()) document.getElementById('maincontent').classList.add('tide-page-leave');
		});
		var modeMenu = document.getElementById('modemenu');
		if (modeMenu && modes.length > 1) {
			modes.forEach(function(child) { modeMenu.appendChild(E('li', { 'class':child === mode ? 'active' : '' }, E('a', {href:L.url(child.name)}, [_(child.title)]))); });
			modeMenu.style.display = '';
		}
		var crumbs = document.getElementById('tide-breadcrumbs'), node = tree, parts = [], content = [];
		dispatch.forEach(function(name) {
			node = node && node.children && node.children[name]; parts.push(name);
			if (!node || !node.title || parts.length === 1) return;
			if (content.length) content.push(Tide.icon('chevron'));
			content.push(E(parts.length === dispatch.length ? 'span' : 'a', {href:parts.length === dispatch.length ? null : L.url.apply(L, parts)}, [_(node.title)]));
		});
		if (crumbs && content.length) crumbs.replaceChildren.apply(crumbs, content);
		/* Retain LuCI's context tabs for plugin subpages. */
		if (dispatch.length >= 3) {
			var tabNode = tree;
			for (var i = 0; i < 3 && tabNode; i++) tabNode = tabNode.children && tabNode.children[dispatch[i]];
			if (tabNode) this.renderTabs(tabNode, dispatch.slice(0,3), dispatch, 3, []);
		}
	},
	renderTabs: function(node, path, dispatch, level, ancestors) {
		var container = document.getElementById('tabmenu');
		if (!container || level > 16 || ancestors.indexOf(node.children) >= 0) return;
		var children = ui.menu.getChildren(node), active = null, ul = E('ul', {'class':'tabs'});
		children.forEach(function(child) {
			var isActive = dispatch[level] === child.name;
			ul.appendChild(E('li', { 'class':isActive ? 'active' : '' }, E('a', {href:L.url.apply(L, path.concat(child.name))}, [_(child.title)])));
			if (isActive) active = child;
		});
		if (!children.length) return;
		container.appendChild(ul); container.style.display = '';
		if (active) this.renderTabs(active, path.concat(active.name), dispatch, level + 1, ancestors.concat([node.children]));
	}
});
