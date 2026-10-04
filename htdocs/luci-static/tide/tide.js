/* SPDX-License-Identifier: Apache-2.0 */
(function() {
	'use strict';
	var root = document.documentElement;
	var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
	var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
	var mobile = window.matchMedia ? window.matchMedia('(max-width: 680px)') : null;
	var transition = null, themeSequence = 0;
	function read(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } }
	function write(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
	function listen(query, fn) { if (!query) return; if (query.addEventListener) query.addEventListener('change', fn); else if (query.addListener) query.addListener(fn); }
	function motion() { return !root.classList.contains('motion-off') && !(reduced && reduced.matches); }
	function announce(message) { var el = document.getElementById('tide-announcement'); if (el) el.textContent = message; }
	function applyTheme(mode) {
		var dark = mode === 'dark' || (mode === 'system' && media && media.matches);
		root.classList.toggle('dark', !!dark);
		root.setAttribute('data-darkmode', String(!!dark));
		root.dataset.appearance = mode;
		document.querySelectorAll('.tide-appearance').forEach(function(select) { select.value = mode; });
	}
	function setTheme(mode, event) {
		if (['system', 'light', 'dark'].indexOf(mode) < 0) return;
		write('tide.appearance', mode);
		var seq = ++themeSequence;
		if (transition) transition.skipTransition();
		var trigger = event && event.target;
		var rect = trigger && trigger.getBoundingClientRect();
		root.style.setProperty('--click-x', (event && event.clientX || rect && rect.left + rect.width / 2 || innerWidth / 2) + 'px');
		root.style.setProperty('--click-y', (event && event.clientY || rect && rect.top + rect.height / 2 || 0) + 'px');
		if (document.startViewTransition && motion()) {
			transition = document.startViewTransition(function() { if (seq === themeSequence) applyTheme(mode); });
			transition.ready.catch(function() {});
			transition.updateCallbackDone.catch(function() {});
			transition.finished.catch(function() {}).finally(function() { if (seq === themeSequence) transition = null; });
		} else applyTheme(mode);
	}
	function icon(name) {
		var paths = {
			status: 'M4 13h4l3-8 4 14 3-6h2',
			network: 'M9 3h6v6H9zM3 16h6v5H3zM15 16h6v5h-6zM12 9v4M6 16v-3h12v3',
			system: 'M9 3h6l1 4 4 1v6l-4 1-1 4H9l-1-4-4-1V8l4-1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
			services: 'M8 3v5M16 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3',
			storage: 'M4 4h16v6H4zM4 14h16v6H4zM16 7h1M16 17h1',
			wifi: 'M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01',
			device: 'M6 3h12v18H6zM10 17h4',
			chevron: 'm9 5 7 7-7 7',
			refresh: 'M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 2M19 16a8 8 0 0 1-13 3l-2-2',
			check: 'm5 12 4 4L19 6',
			close: 'm6 6 12 12M6 18 18 6'
		};
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'tide-icon'); svg.setAttribute('aria-hidden', 'true');
		var path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name] || paths.services); svg.appendChild(path); return svg;
	}
	var opener = null, menuOpen = false, fallbackTabs = [], previousInert = false;
	function setMenu(open, restoreFocus) {
		var sidebar = document.getElementById('tide-sidebar'), workspace = document.getElementById('tide-workspace');
		var toggle = document.querySelector('.tide-menu-toggle'), overlay = document.querySelector('.tide-nav-overlay');
		if (!sidebar || !workspace || !toggle || !overlay) return;
		open = !!open && !!(mobile && mobile.matches);
		if (open === menuOpen) return;
		menuOpen = open;
		if (open) {
			opener = document.activeElement;
			previousInert = workspace.inert;
			workspace.inert = true;
			/* Keyboard fallback for browsers predating inert. */
			if (!('inert' in HTMLElement.prototype)) {
				workspace.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(function(el) {
					fallbackTabs.push([el, el.getAttribute('tabindex')]); el.setAttribute('tabindex', '-1');
				});
			}
		} else {
			workspace.inert = previousInert;
			fallbackTabs.forEach(function(pair) { if (pair[1] == null) pair[0].removeAttribute('tabindex'); else pair[0].setAttribute('tabindex', pair[1]); }); fallbackTabs = [];
		}
		sidebar.classList.toggle('open', open); overlay.hidden = !open;
		document.body.classList.toggle('tide-menu-open', open);
		toggle.setAttribute('aria-expanded', String(open));
		if (mobile && mobile.matches) sidebar.inert = !open; else sidebar.inert = false;
		if (open) sidebar.querySelector('.tide-nav-close').focus();
		else if (restoreFocus !== false && opener && opener.isConnected) opener.focus();
	}
	function clickEffects(event) {
		if (!motion() || document.hidden) return;
		var btn = event.target.closest('button,.btn,.cbi-button');
		if (!btn || btn.disabled || btn.classList.contains('tide-nav-overlay')) return;
		var rect = btn.getBoundingClientRect(), size = Math.max(rect.width, rect.height) * 1.8;
		var x = event.detail ? event.clientX : rect.left + rect.width / 2;
		var y = event.detail ? event.clientY : rect.top + rect.height / 2;
		var ripple = document.createElement('span'); ripple.className = 'tide-ripple';
		ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (x - rect.left - size / 2) + 'px;top:' + (y - rect.top - size / 2) + 'px;clip-path:inset(0 round 7px)';
		btn.appendChild(ripple); setTimeout(function() { ripple.remove(); }, 580);
		if (btn.matches('.cbi-button-apply,.tide-primary')) {
			for (var i = 0; i < 5; i++) {
				var dot = document.createElement('span'), angle = i * Math.PI * 2 / 5;
				dot.className = 'tide-click-burst'; dot.style.left = x + 'px'; dot.style.top = y + 'px';
				dot.style.setProperty('--dx', Math.cos(angle) * 24 + 'px'); dot.style.setProperty('--dy', Math.sin(angle) * 24 + 'px');
				document.body.appendChild(dot); setTimeout(function(el) { el.remove(); }, 560, dot);
			}
		}
	}
	function init() {
		applyTheme(root.dataset.appearance || 'system');
		document.querySelectorAll('.tide-appearance').forEach(function(select) { select.addEventListener('change', function(event) { setTheme(select.value, event); }); });
		var motionBtn = document.querySelector('.tide-motion-toggle');
		if (motionBtn) {
			motionBtn.setAttribute('aria-pressed', String(root.classList.contains('motion-off')));
			motionBtn.addEventListener('click', function() {
				var paused = root.classList.toggle('motion-off'); write('tide.motion', paused ? 'off' : 'on');
				motionBtn.setAttribute('aria-pressed', String(paused));
				announce(window._ ? _(paused ? 'Animations paused' : 'Animations enabled') : (paused ? 'Animations paused' : 'Animations enabled'));
			});
		}
		listen(media, function() { if (root.dataset.appearance === 'system') setTheme('system'); });
		listen(reduced, function() { if (!motion() && transition) transition.skipTransition(); });
		var sidebar = document.getElementById('tide-sidebar');
		if (sidebar) {
			sidebar.inert = !!(mobile && mobile.matches);
			listen(mobile, function() { setMenu(false); sidebar.inert = !!mobile.matches; });
		}
		document.querySelectorAll('.tide-menu-toggle').forEach(function(btn) { btn.addEventListener('click', function() { setMenu(true); }); });
		document.querySelectorAll('.tide-nav-close,.tide-nav-overlay').forEach(function(btn) { btn.addEventListener('click', function() { setMenu(false); }); });
		document.addEventListener('keydown', function(event) {
			if (!menuOpen) return;
			if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
			if (event.key === 'Tab') {
				var items = Array.prototype.filter.call(sidebar.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]'), function(el) { return !el.closest('[inert]') && el.getClientRects().length; });
				var first = items[0], last = items[items.length - 1];
				if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
				else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
			}
		});
		document.addEventListener('focusin', function(event) { if (menuOpen && !sidebar.contains(event.target)) sidebar.querySelector('.tide-nav-close').focus(); });
		document.addEventListener('click', clickEffects);
		document.addEventListener('visibilitychange', function() { document.body.classList.toggle('tide-hidden', document.hidden); });
		/* Observe the busy state LuCI already sets. No request, submit or RPC interception. */
		var main = document.getElementById('maincontent'), line = document.getElementById('tide-loadline'), frame = 0;
		if (main && line && window.MutationObserver) {
			function syncBusy() {
				frame = 0;
				var busy = !!main.querySelector('.spinning,[aria-busy="true"]');
				line.hidden = !busy;
				if (main.getAttribute('aria-busy') !== String(busy)) main.setAttribute('aria-busy', String(busy));
			}
			new MutationObserver(function() { if (!frame) frame = requestAnimationFrame(syncBusy); }).observe(main, { subtree:true, childList:true, attributes:true, attributeFilter:['class','aria-busy'] });
			syncBusy();
		}
		if (main && motion()) main.classList.add('tide-page-enter');
		window.addEventListener('pageshow', function() { if (main) main.classList.remove('tide-page-leave'); });
	}
	window.Tide = { icon:icon, motion:motion, setTheme:setTheme, setMenu:setMenu, announce:announce, read:read, write:write };
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
