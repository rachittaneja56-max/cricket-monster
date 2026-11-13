import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const out=path.resolve('out/realism-comparison');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report=[];
for(const item of [
  {name:'previous-cgi',video:'out/previous-cgi/stadium-hero.mp4',poster:'out/previous-cgi/stadium-hero-poster.webp',time:4.4,position:'center 55%'},
  {name:'live-stadium',video:'out/live-stadium-candidate.mp4',poster:'out/live-stadium-poster.webp',time:3,position:'center top'},
  {name:'batting-moment',video:'out/real-batting-candidate.mp4',poster:'out/real-batting-poster.webp',time:2.5,position:'center 55%'}
]) {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage();
  await page.route('**/assets/stadium-hero.mp4',route=>route.fulfill({path:path.resolve(item.video),contentType:'video/mp4'}));
  await page.route('**/assets/stadium-hero-poster.webp',route=>route.fulfill({path:path.resolve(item.poster),contentType:'image/webp'}));
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'load'});
  await page.addStyleTag({content:`.stadium-video{object-position:${item.position}}.stadium-scene{background-position:${item.position}}`});
  await page.waitForFunction(t=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>t&&v.currentTime<t+.4;},item.time);
  const before=await page.locator('video').evaluate(v=>({time:v.currentTime,paused:v.paused,frames:v.getVideoPlaybackQuality().totalVideoFrames}));
  await page.screenshot({path:path.join(out,`${item.name}-desktop.jpg`)});
  await page.waitForTimeout(500);
  const after=await page.locator('video').evaluate(v=>({time:v.currentTime,paused:v.paused,frames:v.getVideoPlaybackQuality().totalVideoFrames}));
  report.push({name:item.name,before,after});
  await context.close();
}
await browser.close();
writeFileSync(path.join(out,'playback-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
