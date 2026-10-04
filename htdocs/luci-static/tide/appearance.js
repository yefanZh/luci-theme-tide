/* SPDX-License-Identifier: Apache-2.0 */
/* Runs before CSS to avoid a light flash. Preferences are browser-local. */
(function() {
	'use strict';
	var mode = 'system', paused = false;
	try {
		mode = localStorage.getItem('tide.appearance') || mode;
		paused = localStorage.getItem('tide.motion') === 'off';
	} catch (_) {}
	if (['light', 'dark', 'system'].indexOf(mode) < 0) mode = 'system';
	var dark = mode === 'dark' || (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', !!dark);
	document.documentElement.classList.toggle('motion-off', paused);
	document.documentElement.setAttribute('data-darkmode', String(!!dark));
	document.documentElement.dataset.appearance = mode;
})();
