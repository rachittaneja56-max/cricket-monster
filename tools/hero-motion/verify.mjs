import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:8080';
const out=path.resolve(process.env.ARTIFACT_DIR||'out/verification');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,widths:[],checks:[],errors:[]};
const check=(name,condition)=>{assert.ok(condition,name);report.checks.push(name);};
try {
  for(const width of [1440,1024,768,390,320]) {
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
    const page=await context.newPage();
    const requests=[];
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('request',r=>{if(r.url().endsWith('.mp4')) requests.push(r.url());});
    await page.addInitScript(()=>{
      window.__cls=0;
      new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__cls+=e.value;})).observe({type:'layout-shift',buffered:true});
    });
    await page.goto(base,{waitUntil:'networkidle'});
    const video=page.locator('#stadiumVideo');
    if(width>850) {
      await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.readyState>=3;});
      const before=await video.evaluate(v=>v.currentTime);
      await page.waitForTimeout(400);
      check(`${width}: actual video time advances`,await video.evaluate(v=>v.currentTime)>before);
      const boxes=await page.evaluate(()=>({copy:document.querySelector('.hero-copy').getBoundingClientRect().toJSON(),card:document.querySelector('.home-match').getBoundingClientRect().toJSON()}));
      check(`${width}: prediction card stays right`,boxes.card.x>=boxes.copy.right);
      await page.locator('#heroMotionControl').click();
      check(`${width}: pause works`,await video.evaluate(v=>v.paused));
      await video.evaluate(v=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=4.5;}));
      await page.locator('#heroMotionControl').click();
      await page.waitForFunction(()=>!document.querySelector('video').paused);
      check(`${width}: resume works`,await video.evaluate(v=>!v.paused));
    } else {
      check(`${width}: no mobile MP4 request`,requests.length===0);
      check(`${width}: mobile source stays detached`,!(await video.getAttribute('src')));
    }
    const cls=await page.evaluate(()=>window.__cls);
    check(`${width}: hero has no substantial layout shift`,cls<.02);
    await page.screenshot({path:path.join(out,`home-${width}.jpg`),fullPage:true});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    check(`${width}: homepage fits viewport`,!overflow);
    await page.locator('[data-team="RCB"]').click();
    check(`${width}: winner selection works`,await page.locator('[data-team="RCB"]').getAttribute('aria-pressed')==='true');
    await page.locator('#continuePicks').click();
    await page.waitForURL(/match-monster/);
    check(`${width}: Match CTA transfers winner`,(await page.locator('#slipList').textContent()).includes('RCB'));
    await page.locator('[data-q="toss_winner"] [data-option="CSK"]').click();
    await page.locator('#savePicks').click();
    check(`${width}: Match Monster saves picks`,(await page.locator('#savedState').textContent()).includes('Saved'));
    check(`${width}: Match Monster fits viewport`,!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    await page.screenshot({path:path.join(out,`match-${width}.jpg`),fullPage:true});
    await page.goto(base);
    await page.locator('.daily-hero-link').click();
    await page.waitForURL(/daily-monster/);
    await page.locator('#startQuiz').click();
    for(let i=0;i<10;i++) {
      await page.locator('.quiz-option').first().click();
      await page.locator('#nextQuestion').click();
    }
    check(`${width}: Daily Monster finishes ten questions`,await page.locator('#quizComplete').isVisible());
    check(`${width}: Daily Monster fits viewport`,!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    await page.screenshot({path:path.join(out,`daily-${width}.jpg`),fullPage:true});
    report.widths.push({width,cls,videoRequests:requests.length});
    await context.close();
  }

  for(const mode of ['reduced-motion','save-data','autoplay-blocked','video-error','no-javascript']) {
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:mode==='reduced-motion'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-javascript'});
    if(mode==='save-data') await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g',addEventListener(){}}}));
    if(mode==='autoplay-blocked') await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked for test','NotAllowedError'));};});
    const page=await context.newPage();const requests=[];
    page.on('request',r=>{if(r.url().endsWith('.mp4'))requests.push(r.url());});
    if(mode==='video-error')await page.route('**/stadium-hero.mp4',route=>route.abort());
    await page.goto(base,{waitUntil:'networkidle'});
    check(`${mode}: fallback preserves headline`,await page.locator('h1').isVisible());
    check(`${mode}: fallback poster remains`,!(await page.locator('.stadium-scene').getAttribute('class')).includes('is-video-ready'));
    if(['reduced-motion','save-data','no-javascript'].includes(mode))check(`${mode}: no MP4 transferred`,requests.length===0);
    await page.screenshot({path:path.join(out,`${mode}.jpg`)});
    await context.close();
  }

  const context=await browser.newContext({viewport:{width:1440,height:600},reducedMotion:'no-preference'});
  const page=await context.newPage();await page.goto(base);
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  await page.locator('.page-footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('video').paused);
  check('out-of-view video pauses',true);
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  check('returning hero resumes',true);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(()=>document.querySelector('video').paused);
  check('hidden-document policy pauses video (simulated visibility event)',true);
  await page.evaluate(()=>{
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  check('visible-document policy resumes video',true);
  await page.locator('video').evaluate(v=>{v.currentTime=8.8;});
  await page.waitForFunction(()=>document.querySelector('video').currentTime<1);
  check('video wraps from final second to start',true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.querySelector('video').hasAttribute('src'));
  check('live reduced-motion change unloads video',true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  await page.setViewportSize({width:390,height:900});
  await page.waitForFunction(()=>!document.querySelector('video').hasAttribute('src'));
  check('resizing to mobile unloads video',true);
  await context.close();
  check('no uncaught browser errors',report.errors.length===0);
  console.log(JSON.stringify({checks:report.checks.length,widths:report.widths,errors:report.errors},null,2));
} finally {
  writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
}
