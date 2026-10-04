import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer,root} from './server.mjs';

const server = createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
const errors = [], results = [];
const output = path.join(root,'test-results'); fs.mkdirSync(output,{recursive:true});
async function check(label,run) { await run(); results.push(label); console.log('PASS '+label); }
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/cgi-bin/luci/admin/status/tide');
  await page.waitForFunction(()=>window.fixture?.loaded);
  await check('real LuCI DOM helpers render safely; WAN v4/v6 counters are deduplicated',async()=>{
    assert.equal(await page.locator('.tide-hero-stat strong').textContent(),'1');
    assert.equal(await page.locator('.tide-device-table tbody tr').count(),3);
    assert.equal(await page.locator('.tide-device-table img').count(),0);
    assert.equal(await page.evaluate(()=>window.fixtureXss),undefined);
    await page.evaluate(()=>fixture.deviceName='家庭 NAS');
    await page.evaluate(()=>fixture.step()); await page.evaluate(()=>fixture.step());
    assert.equal(await page.locator('.tide-metric-value strong').first().textContent(),'60.8');
    assert.equal(await page.locator('.tide-chart svg').isVisible(),true);
    assert.equal(await page.locator('.tide-meter').getAttribute('aria-valuenow'),'40.6');
    assert.equal(await page.locator('.tide-meter span').evaluate(el=>getComputedStyle(el).transitionProperty),'transform');
    assert.equal(await page.locator('.tide-meter span').evaluate(el=>el.offsetWidth===el.parentElement.clientWidth),true);
  });
  await check('45 plugin entries, deep menus, ACL filtering and independent scrolling',async()=>{
    await page.getByRole('button',{name:'服务',exact:true}).click();
    assert.equal(await page.locator('.tide-nav a').count(),52);
    assert.equal(await page.getByText('Forbidden menu',{exact:true}).count(),0);
    await page.getByRole('button',{name:'三级菜单',exact:true}).click();
    assert.equal(await page.getByRole('link',{name:'第四级页面',exact:true}).isVisible(),true);
    assert.equal(await page.locator('.tide-nav a[aria-current="page"]').textContent(),'Tide Overview');
    assert.ok(await page.evaluate(()=>{const n=document.querySelector('.tide-nav');return n.scrollHeight>n.clientHeight;}));
    await page.locator('.tide-nav').evaluate(el=>el.scrollTop=400);
    assert.equal(await page.locator('.tide-sidebar-bottom').isVisible(),true);
    await page.getByRole('button',{name:'服务',exact:true}).click();
    assert.equal(await page.locator('#tide-navigation .tide-nav-children[aria-hidden="true"]').first().evaluate(el=>el.inert),true);
  });
  await check('device filter empty state and clear action',async()=>{
    await page.getByRole('searchbox',{name:'Search devices'}).fill('missing-device');
    assert.equal(await page.locator('.tide-device-table tbody tr').count(),0);
    await page.getByRole('button',{name:'Clear filter',exact:true}).click();
    assert.equal(await page.locator('.tide-device-table tbody tr').count(),3);
  });
  await check('drawer dismissal and focus survive polling',async()=>{
    const button = page.getByRole('button',{name:/工作室 MacBook/});
    await button.click();
    assert.equal(await page.locator('dialog').isVisible(),true);
    await page.evaluate(()=>fixture.step());
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('dialog'));
    assert.equal(await button.evaluate(el=>el===document.activeElement),true);
  });
  await check('failed refresh retains values and retry clears error and loading',async()=>{
    const before = await page.locator('.tide-device-table tbody').textContent();
    await page.evaluate(()=>fixture.fail=true);
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.getByRole('button',{name:'Retry',exact:true}).waitFor();
    assert.equal(await page.locator('.tide-device-table tbody').textContent(),before);
    assert.equal(await page.locator('#tide-loadline').isVisible(),false);
    await page.evaluate(()=>fixture.fail=false);
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.tide-overview>.alert-message').hidden);
    assert.equal(await page.getByRole('button',{name:'Refresh',exact:true}).isEnabled(),true);
  });
  await check('pause sampling, disconnected WAN and counter reset do not invent rates',async()=>{
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    const calls = await page.evaluate(()=>fixture.rpcCalls); await page.evaluate(()=>fixture.poll());
    assert.equal(await page.evaluate(()=>fixture.rpcCalls),calls);
    await page.getByRole('button',{name:'Resume',exact:true}).click();
    await page.evaluate(async()=>{fixture.offline=true;await fixture.step();});
    assert.equal(await page.locator('.tide-hero h2').textContent(),'No active upstream interface');
    assert.equal(await page.locator('.tide-metric-value strong').first().textContent(),'—');
    await page.evaluate(async()=>{fixture.offline=false;fixture.rx=0;fixture.tx=0;await fixture.step();});
    assert.equal(await page.locator('.tide-metric-value strong').first().textContent(),'—');
  });
  await check('theme switches preserve the same DOM, input and geometry',async()=>{
    await page.evaluate(()=>fixture.form());
    await page.locator('#fixture-name').fill('未保存的设备名称');
    await page.locator('#fixture-name').evaluate(el=>window.originalInput=el);
    const geometry = await page.locator('.cbi-section').boundingBox();
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
    await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
    assert.equal(await page.locator('#fixture-name').inputValue(),'未保存的设备名称');
    assert.equal(await page.locator('#fixture-name').evaluate(el=>el===window.originalInput),true);
    assert.deepEqual(await page.locator('.cbi-section').boundingBox(),geometry);
    await page.screenshot({path:path.join(output,'form-dark.png'),fullPage:true});
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('light');
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('light');
    await page.waitForFunction(()=>!document.documentElement.classList.contains('dark'));
  });
  await check('320–1920px overview and plugin forms contain horizontal overflow',async()=>{
    for(const width of [320,390,680,768,980,1024,1280,1440,1920]) {
      await page.setViewportSize({width,height:900});
      await page.goto(base); await page.waitForFunction(()=>fixture.loaded);
      await page.evaluate(()=>fixture.deviceName='家庭 NAS');
      await page.evaluate(()=>fixture.step()); await page.evaluate(()=>fixture.step());
      for(const mode of ['light','dark']) {
        await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);
        await page.waitForFunction(mode=>document.documentElement.classList.contains('dark')===(mode==='dark'),mode);
        await page.waitForFunction(()=>!document.getAnimations().some(a=>a.animationName==='tide-theme-reveal'));
        const sizes=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
        assert.ok(sizes.scroll<=sizes.viewport,'overview '+width+'/'+mode+': '+JSON.stringify(sizes));
        if([390,1440].includes(width)) await page.screenshot({path:path.join(output,'overview-'+mode+'-'+width+'.png'),fullPage:true});
      }
      await page.evaluate(()=>fixture.form());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'plugin form '+width);
      assert.ok(await page.locator('.cbi-section-table').evaluate(el=>el.scrollWidth>=el.clientWidth));
    }
  });
  await page.setViewportSize({width:390,height:844}); await page.goto(base); await page.waitForFunction(()=>fixture.loaded);
  await check('mobile menu traps keyboard focus and closes with Escape, mask and navigation',async()=>{
    const toggle = page.getByRole('button',{name:'Open menu',exact:true});
    await toggle.click();
    assert.equal(await page.locator('#tide-workspace').evaluate(el=>el.inert),true);
    await page.locator('.tide-nav a').filter({hasText:'原生状态总览'}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#tide-sidebar').evaluate(el=>el.contains(document.activeElement)),true);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.locator('#tide-workspace').evaluate(el=>el.inert),false);
    await toggle.click(); await page.locator('.tide-nav-overlay').click({position:{x:350,y:500}});
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await toggle.click(); await page.getByRole('link',{name:'原生状态总览',exact:true}).click();
    await page.waitForFunction(()=>fixture.loaded);
    assert.equal(await page.locator('#tide-workspace').evaluate(el=>el.inert),false);
  });
  await check('reduced motion and system preference remain operable',async()=>{
    await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('system');
    assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('dark')),true);
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    assert.equal(await page.locator('.tide-click-burst').count(),0);
    await page.emulateMedia({colorScheme:'light'});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('dark'));
    await page.getByRole('button',{name:'Pause animations',exact:true}).click();
    assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('motion-off')),true);
  });
  await check('preferences persist and login stays usable without JavaScript',async()=>{
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
    await page.reload(); await page.waitForFunction(()=>fixture.loaded);
    assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('dark')),true);
    await page.goto(base+'/login');
    assert.equal(await page.locator('input[name="luci_username"]').inputValue(),'root');
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:700}});
    const login=await context.newPage(); await login.goto(base+'/login');
    assert.equal(await login.getByRole('button',{name:'Log in',exact:true}).isVisible(),true);
    assert.ok(await login.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await context.close();
  });
  await check('restricted DHCP and association permissions remain explicit',async()=>{
    await page.goto(base); await page.waitForFunction(()=>fixture.loaded);
    await page.evaluate(async()=>{fixture.view.access={dhcp:false,wifi:false};await fixture.view.refresh(true);});
    assert.equal(await page.locator('.tide-hero-stat strong').textContent(),'—');
    assert.equal(await page.locator('.tide-device-table tbody tr').count(),0);
    assert.ok(await page.getByText('DHCP lease access is not permitted.',{exact:true}).isVisible());
    assert.equal(await page.locator('#tide-loadline').isVisible(),false);
  });
  await check('font failure and browsers without View Transition API keep theme controls usable',async()=>{
    await page.route('**/*.ttf',route=>route.abort());
    await page.goto(base); await page.waitForFunction(()=>fixture.loaded);
    await page.evaluate(()=>{document.startViewTransition=undefined;fixture.form();});
    await page.locator('#fixture-name').fill('字体回退仍能编辑');
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
    assert.equal(await page.locator('#fixture-name').inputValue(),'字体回退仍能编辑');
    assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('dark')),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  });
  assert.deepEqual(errors,[],'browser exceptions');
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({passed:results,errors},null,2));
  console.log(results.length+' browser checks passed');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
