const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  fs.mkdirSync('test-results',{recursive:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.testStreams=[];
   navigator.mediaDevices.getUserMedia=async()=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1280;
    const ctx=canvas.getContext('2d'),img=new Image(),qr=new Image();img.src='/target.png';qr.src='/phone-qr.png';await Promise.all([img.decode(),qr.decode()]);
    window.testTargetVisible=true;
    const draw=()=>{ctx.fillStyle='#ddd';ctx.fillRect(0,0,960,1280);if(window.testTargetVisible){ctx.drawImage(img,120,280,715,700);ctx.fillStyle='white';ctx.fillRect(639,297,178,197);ctx.drawImage(qr,645,303,166,166);}};
    draw();const timer=setInterval(draw,33);const stream=canvas.captureStream(30);window.testStreams.push(stream);
    const originalStop=stream.getVideoTracks()[0].stop.bind(stream.getVideoTracks()[0]);
    stream.getVideoTracks()[0].stop=()=>{clearInterval(timer);originalStop();};return stream;
   };
  });
  let releaseVideo;
  const videoGate=new Promise(resolve=>{releaseVideo=resolve;});
  await page.route('**/video/smash-promo.mp4',async route=>{await videoGate;await route.continue();});
  await page.addInitScript(()=>{
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      if(this.id==='promo-video'&&window.blockPromoOnce){window.blockPromoOnce=false;return Promise.reject(new DOMException('User gesture required','NotAllowedError'));}
      return play.call(this);
    };
  });
  await page.goto('http://localhost:3000');
  await page.locator('#start').click();
  await page.waitForFunction(()=>document.body.dataset.mode==='promo',{},{timeout:90000});
  if(await page.locator('#promo-play').isVisible())await page.locator('#promo-play').click();
  assert.equal(await page.locator('#promo-loader').isVisible(),true,'Loader visible while video bytes are delayed');
  await page.screenshot({path:'test-results/promo-loading.png'});
  releaseVideo();
  await page.waitForFunction(()=>['playing','blocked'].includes(document.body.dataset.promoState),{},{timeout:30000});
  if(await page.locator('#promo-play').isVisible())await page.locator('#promo-play').click();
  await page.waitForFunction(()=>document.querySelector('#promo-video').currentTime>.4,{},{timeout:30000});
  const media=await page.locator('#promo-video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,audio:v.webkitAudioDecodedByteCount}));
  assert.equal(media.width,720);assert.equal(media.height,1280);assert.ok(media.duration>9&&media.audio>0);
  assert.equal(await page.evaluate(()=>window.testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);
  await page.screenshot({path:'test-results/promo-playing.png'});
  await page.locator('#sound').click();assert.equal(await page.locator('#promo-video').evaluate(v=>v.muted),true);
  await page.locator('#sound').click();assert.equal(await page.locator('#promo-video').evaluate(v=>v.muted),false);
  await page.locator('#promo-video').evaluate(v=>{v.currentTime=v.duration-.3;});
  await page.waitForFunction(()=>document.body.dataset.promoState==='ended',{},{timeout:10000});
  assert.equal(await page.locator('#promo-replay').isVisible(),true);
  await page.locator('#promo-3d').click();
  await page.waitForFunction(()=>document.body.dataset.mode==='viewer');
  assert.equal(await page.locator('#promo-video').evaluate(v=>v.paused),true);
  await page.waitForTimeout(1000);await page.screenshot({path:'test-results/mobile-viewer.png'});
  const view=await page.locator('#viewer').boundingBox();
  await page.mouse.move(view.x+view.width*.4,view.y+view.height*.5);await page.mouse.down();await page.mouse.move(view.x+view.width*.7,view.y+view.height*.6,{steps:8});await page.mouse.up();
  await page.locator('#see-ar').click();
  await page.waitForFunction(()=>document.body.dataset.mode==='ar'&&document.body.dataset.tracked==='true',{},{timeout:30000});
  await page.locator('#details').click();assert.equal(await page.locator('#info').isVisible(),true);
  await page.evaluate(()=>{window.testTargetVisible=false;});
  await page.waitForFunction(()=>document.body.dataset.tracked==='false',{},{timeout:20000});
  await page.evaluate(()=>{window.testTargetVisible=true;});
  await page.waitForFunction(()=>document.body.dataset.tracked==='true',{},{timeout:20000});
  await page.locator('#back-viewer').click();
  await page.evaluate(()=>{window.blockPromoOnce=true;});
  await page.locator('#replay').click();
  await page.locator('#promo-play').waitFor({state:'visible'});
  await page.locator('#promo-play').click();
  await page.waitForFunction(()=>document.body.dataset.promoState==='playing');
  await page.locator('#promo-close').click();
  assert.equal(await page.locator('#promo-video').evaluate(v=>v.paused),true);
  // A failed video request must leave a retry and the 3D fallback available.
  await page.unroute('**/video/smash-promo.mp4');
  await page.route('**/video/smash-promo.mp4',route=>route.abort());
  await page.locator('#promo-video').evaluate(v=>{v.removeAttribute('src');v.load();});
  await page.locator('#start').click();
  await page.waitForFunction(()=>document.body.dataset.promoState==='error'&&document.body.dataset.mode==='promo',{},{timeout:30000});
  assert.equal(await page.locator('#promo-retry').isVisible(),true);
  await page.unroute('**/video/smash-promo.mp4');await page.locator('#promo-retry').click();
  await page.waitForFunction(()=>['playing','blocked'].includes(document.body.dataset.promoState),{},{timeout:30000});
  if(await page.locator('#promo-play').isVisible())await page.locator('#promo-play').click();
  await page.waitForFunction(()=>document.body.dataset.promoState==='playing');
  await page.locator('#promo-3d').click();await page.locator('#exit-film').click();
  await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError');};});
  await page.locator('#start').click();await page.waitForFunction(()=>!document.querySelector('#error').hidden);
  assert.match(await page.locator('#error').textContent(),/Camera access was blocked/);
  const range=await page.request.get('http://localhost:3000/video/smash-promo.mp4',{headers:{Range:'bytes=0-99'}});
  assert.equal(range.status(),206);assert.equal((await range.body()).length,100);assert.match(range.headers()['content-type'],/video\/mp4/);
  const invalid=await page.request.get('http://localhost:3000/video/smash-promo.mp4',{headers:{Range:'bytes=99999999-'}});assert.equal(invalid.status(),416);
  assert.deepEqual(errors,[]);
  console.log('PASS: promo preload, portrait playback/audio, mute, end/seek, 3D/AR flow, autoplay fallback, failed-video retry, camera cleanup/denial, byte-range delivery.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
