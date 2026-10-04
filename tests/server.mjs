import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function renderFixture(page = 'overview') {
  const executable = process.env.UCODE_BIN || 'ucode';
  const result = spawnSync(executable, ['-L', path.join(root,'tests/mocks'), '-D', `template_root=${path.join(root,'ucode/template')}`, '-D', `fixture_page=${page}`, path.join(root,'tests/render-fixture.uc')], {encoding:'utf8'});
  if (result.error || result.status !== 0) throw new Error(`Template rendering failed: ${result.error?.message || result.stderr}. Set UCODE_BIN to a native ucode executable.`);
  return page === 'login' ? result.stdout.replace('</head>','<script src="/luci-static/resources/luci.js"></script><script>window.L = LuCI.prototype; L.require = function() { return Promise.resolve({}); };</script></head>') : result.stdout;
}
export function createServer() {
  const html = renderFixture(), login = renderFixture('login');
  const reference = process.env.LUCI_REFERENCE;
  if (!reference) throw new Error('Set LUCI_REFERENCE to an official openwrt/luci openwrt-25.12 checkout.');
  return http.createServer((req,res) => {
    const url = new URL(req.url,'http://localhost');
    let file;
    if (url.pathname.startsWith('/cgi-bin/luci/admin/translations/')) { res.setHeader('Content-Type','text/javascript'); res.end(''); return; }
    if (url.pathname === '/login') { res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(login); return; }
    if (url.pathname.startsWith('/cgi-bin/') || url.pathname === '/') { res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(html); return; }
    if (url.pathname === '/fixture.js') file = path.join(root,'tests/fixture.js');
    else if (url.pathname === '/luci-static/resources/luci.js' || url.pathname === '/luci-static/resources/cbi.js') file = path.join(reference,'modules/luci-base/htdocs',url.pathname);
    else if (url.pathname.startsWith('/luci-static/')) file = path.join(root,'htdocs',url.pathname);
    if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    const types = {'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'};
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer(); server.listen(8098,'127.0.0.1',()=>console.log('Tide test fixture (synthetic data): http://127.0.0.1:8098'));
}
