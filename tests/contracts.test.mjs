import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {root,renderFixture} from './server.mjs';

const read = name=>fs.readFileSync(path.join(root,name),'utf8');
test('LuCI module factories parse with their required bindings',()=>{
  for(const name of ['menu-tide.js','view/tide/overview.js']) {
    assert.doesNotThrow(()=>new Function('view','rpc','network','poll','ui','dom','baseclass',read('htdocs/luci-static/resources/'+name)));
  }
});
test('dashboard keeps the native status route and existing ACL boundaries',()=>{
  const menu=JSON.parse(read('root/usr/share/luci/menu.d/luci-theme-tide.json'));
  assert.deepEqual(Object.keys(menu),['admin/status/tide']);
  assert.equal(menu['admin/status/tide'].depends.uci,undefined,'theme changes must not depend on cached UCI predicates');
  assert.equal(menu['admin/status/tide'].title,undefined,'other themes must not show the Tide entry');
  assert.equal(menu['admin/status/tide'].firstchild_ineligible,true);
  assert.deepEqual(menu['admin/status/tide'].depends.acl,['luci-mod-status-index']);
  assert.equal(menu['admin/status/tide'].action.path,'themes/tide/overview');
  assert.ok(read('ucode/template/themes/tide/overview.ut').includes("include('admin_status/index')"));
  assert.equal(fs.existsSync(path.join(root,'root/usr/share/rpcd/acl.d')),false);
});
test('installation registers Tide idempotently without switching an existing theme',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tide-uci-'));
  try {
    const mock=path.join(temp,'uci'), log=path.join(temp,'log');
    fs.writeFileSync(mock,'#!/bin/sh\ncase "$*" in\n  "-q get luci.themes.Tide") [ "$TIDE_REGISTERED" = 1 ] && printf "/luci-static/tide"; exit 0 ;;\n  *) printf "%s\\n" "$*" >> "$TIDE_UCI_LOG" ;;\nesac\n');
    fs.chmodSync(mock,0o755);
    const script=path.join(root,'root/etc/uci-defaults/30_luci-theme-tide');
    for(const registered of ['0','1']) {
      fs.writeFileSync(log,'');
      const result=spawnSync('sh',[script],{env:{...process.env,PATH:temp+path.delimiter+process.env.PATH,TIDE_REGISTERED:registered,TIDE_UCI_LOG:log},encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
      assert.equal(fs.readFileSync(log,'utf8'),registered==='1' ? '' : 'set luci.themes.Tide=/luci-static/tide\ncommit luci\n');
    }
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
test('Makefile includes one LuCI rule set and invokes package generation once',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tide-make-'));
  try {
    fs.mkdirSync(path.join(temp,'feeds/luci'),{recursive:true});
    fs.writeFileSync(path.join(temp,'rules.mk'),'');
    fs.writeFileSync(path.join(temp,'feeds/luci/luci.mk'),'define BuildPackage\n$$(info PACKAGE:$(1))\nendef\n$(eval $(call BuildPackage,$(PKG_NAME)))\nall:\n\t@true\n');
    const result=spawnSync('make',['-f',path.join(root,'Makefile'),'TOPDIR='+temp,'-n'],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.equal((result.stdout.match(/PACKAGE:luci-theme-tide/g)||[]).length,1);
    assert.ok(read('Makefile').includes('LUCI_PKGARCH:=all'));
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
test('official SDK feed scan discovers the nested theme package',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tide-feed-'));
  try {
    const prepared=spawnSync('bash',[path.join(root,'.github/scripts/prepare-sdk-feed.sh'),temp],{cwd:root,encoding:'utf8'});
    assert.equal(prepared.status,0,prepared.stderr);
    assert.equal(fs.existsSync(path.join(temp,'Makefile')),false);
    assert.ok(fs.existsSync(path.join(temp,'luci-theme-tide/Makefile')));
    // Same discovery and pathname rewriting as OpenWrt 25.12 include/scan.mk.
    const scan=spawnSync('bash',['-o','pipefail','-c',
      'find -L "$1" -mindepth 1 -maxdepth 5 -name Makefile | xargs grep -aHE "call (Build/DefaultTargets|BuildPackage|KernelPackage)" | sed -e "s#^$1/##" -e "s#/Makefile:.*##" | uniq',
      'scan',temp],{encoding:'utf8'});
    assert.equal(scan.status,0,scan.stderr);
    assert.equal(scan.stdout.trim(),'luci-theme-tide');
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
test('native ucode compiles and renders shell and login templates',{skip:!process.env.UCODE_BIN},()=>{
  const html=renderFixture(), login=renderFixture('login');
  assert.ok(html.includes('href="/cgi-bin/luci/admin/status/tide"'));
  assert.ok(html.includes('id="maincontent"'));
  assert.ok(html.includes('id="indicators"'));
  assert.ok(html.includes("L.require('menu-tide')"));
  assert.ok(!html.includes('class="labbar"'));
  assert.ok(login.includes('name="luci_password"'));
  assert.ok(login.includes('method="post"'));
  assert.ok(renderFixture('route').includes("ui.instantiateView('tide/overview')"));
  assert.ok(renderFixture('fallback').includes('id="native-status"'));
  assert.ok(!renderFixture('fallback').includes("ui.instantiateView('tide/overview')"));
});
function luminance(hex) {
  const rgb=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('approved foreground and status tokens meet contrast requirements',()=>{
  for(const colors of [
    {bg:'#f2f6fb',panel:'#ffffff',ink:'#172a43',muted:'#5e7087',accent:'#245fce',on:'#ffffff',success:'#217660',soft:'#e9f0fc',hero:'#dce9fa',heroMuted:'#4e627a',error:'#a7463d',warning:'#995b3f',chart:'#668aaa'},
    {bg:'#1b2023',panel:'#242b2f',ink:'#ecefe9',muted:'#adb7ba',accent:'#e3b779',on:'#282521',success:'#a6c8ac',soft:'#37342e',hero:'#303532',heroMuted:'#a6b0b2',error:'#eea29a',warning:'#e3b779',chart:'#9eaab4'}
  ]) {
    for(const foreground of ['ink','muted','error','warning']) for(const background of ['bg','panel']) assert.ok(contrast(colors[foreground],colors[background])>=4.5,foreground+'/'+background);
    assert.ok(contrast(colors.on,colors.accent)>=4.5,'primary button');
    assert.ok(contrast(colors.heroMuted,colors.hero)>=4.5,'hero caption');
    assert.ok(contrast(colors.success,colors.soft)>=4.5,'status badge');
    for(const background of ['panel','soft']) assert.ok(contrast(colors.chart,colors[background])>=3,'chart/'+background);
  }
});
