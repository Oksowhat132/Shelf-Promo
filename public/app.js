import {createSound} from './sound.js';
import {createPromo} from './promo.js';
const $=selector=>document.querySelector(selector);
const sound=createSound(({enabled,ready})=>{
  if(document.body.dataset.mode==='promo')return;
  $('#sound').textContent=!enabled?'Sound off':ready?'Sound on':'Enable sound';
  $('#sound').setAttribute('aria-pressed',String(enabled&&ready));
});
let ar,coil,presentation,busy=false,mode='home',session=0;
let resources;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const promoVideo=$('#promo-video');
const promo=createPromo(promoVideo,(state,message)=>{
  document.body.dataset.promoState=state;
  $('#promo-loader').hidden=['playing','ended'].includes(state);
  $('#promo-message').textContent=message;
  $('#promo-play').hidden=state!=='blocked';
  $('#promo-retry').hidden=!['error','slow'].includes(state);
  $('#promo-replay').hidden=state!=='ended';
});
promoVideo.addEventListener('volumechange',()=>{
  if(mode!=='promo')return;
  sound.setEnabled(!promoVideo.muted);
  $('#sound').textContent=promoVideo.muted?'Sound off':'Sound on';
  $('#sound').setAttribute('aria-pressed',String(!promoVideo.muted));
});
function setMode(value){mode=value;document.body.dataset.mode=value;}
async function load(){
  resources ||= Promise.all([import('/vendor/mindar-image-three.prod.js'),import('./product-model.js'),import('./presentation.js')]);
  const [{MindARThree},{createCoil,lightProduct},{createPresentation}]=await resources;
  if(!ar){
    ar=new MindARThree({container:$('#ar'),imageTargetSrc:'/target.mind',uiLoading:'no',uiScanning:'no',uiError:'no',filterMinCF:.001,filterBeta:.01});
    ar.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    coil=createCoil();coil.scale.setScalar(.75);coil.position.z=.24;coil.rotation.x=.18;
    const anchor=ar.addAnchor(0);anchor.group.add(coil);lightProduct(ar.scene);
    anchor.onTargetFound=()=>{
      document.body.dataset.tracked='true';
      if(mode==='ar'){$('#status').textContent='Move around to explore';$('#hint').textContent='Keep the packaging in view.';}
    };
    anchor.onTargetLost=()=>{
      document.body.dataset.tracked='false';
      if(mode==='ar'){$('#status').textContent='Point back at the box';$('#hint').textContent='Your product will appear above the artwork.';}
    };
    presentation=createPresentation($('#viewer'));
  }
}
function stopCamera(){
  if(ar){ar.renderer.setAnimationLoop(null);try{ar.stop();}catch{}}
  document.querySelectorAll('#ar video').forEach(video=>{video.srcObject?.getTracks().forEach(track=>track.stop());video.remove();});
  document.body.dataset.tracked='false';
}
async function startCamera(targetMode='scan'){
  if(busy)return;
  busy=true;const token=++session;$('#start').disabled=true;$('#see-ar').disabled=true;$('#error').hidden=true;
  try{
    if(targetMode==='scan')promo.prepare();
    // Unlock optional interface cues; the promo uses its original audio.
    if(await sound.unlock())sound.play('tap');
    if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('Open the secure phone link in Safari or Chrome to use the camera.');
    $('#start').firstChild.textContent='Opening camera… ';
    await load();if(token!==session)return;
    presentation.stop();promo.stop();
    $('#promo').hidden=true;$('#cinema').hidden=true;$('#intro').hidden=true;$('#hud').hidden=false;
    $('#info').hidden=true;$('#details').setAttribute('aria-expanded','false');
    $('#details').hidden=targetMode!=='ar';$('#back-viewer').hidden=targetMode!=='ar';
    setMode(targetMode);$('#status').textContent='Opening camera…';$('#hint').textContent='Allow camera access when asked.';
    // MindAR preserves anchor visibility when stopped; clear it so a fresh
    // camera session emits target-found even if it sees the same box immediately.
    ar.anchors.forEach(anchor=>{anchor.visible=false;anchor.group.visible=false;});
    await ar.start();
    if(token!==session){stopCamera();return;}
    $('#status').textContent=targetMode==='ar'?'Point at the SMASH box':'Find the SMASH artwork';
    $('#hint').textContent=targetMode==='ar'?'The product will float above it.':'Hold steady to begin your product reveal.';
    ar.renderer.setAnimationLoop(()=>{
      // Intro detection does not expose the model until the customer chooses AR.
      coil.visible=mode==='ar';
      ar.renderer.render(ar.scene,ar.camera);
      if(mode==='scan'&&document.body.dataset.tracked==='true'){
        setMode('transition');requestAnimationFrame(()=>{if(mode==='transition')beginPromo();});
      }
    });
  }catch(error){
    if(token!==session)return;
    stopCamera();$('#hud').hidden=true;
    if(targetMode==='ar'&&presentation)showViewer();else{$('#intro').hidden=false;setMode('home');}
    $('#error').textContent=error?.name==='NotAllowedError'?'Camera access was blocked. Allow the camera in your browser’s site settings, then try again.':error?.message||'Could not start the camera. Close other camera apps and try again.';
    $('#error').hidden=false;
  }finally{busy=false;$('#start').disabled=false;$('#see-ar').disabled=false;$('#start').firstChild.textContent='Scan to discover ';}
}
function beginPromo(){
  stopCamera();presentation?.stop();setMode('promo');
  $('#intro').hidden=true;$('#hud').hidden=true;$('#cinema').hidden=true;$('#promo').hidden=false;
  $('#error').hidden=true;
  promo.start(!sound.enabled);
  $('#sound').textContent=sound.enabled?'Sound on':'Sound off';
  $('#sound').setAttribute('aria-pressed',String(sound.enabled));
}
function showViewer(){
  promo.stop();$('#promo').hidden=true;stopCamera();setMode('viewer');
  $('#intro').hidden=true;$('#hud').hidden=true;$('#cinema').hidden=false;
  $('#film-copy').hidden=true;$('#film-footer').hidden=true;$('#skip').hidden=true;
  $('#viewer').hidden=false;$('#viewer-heading').hidden=true;$('#viewer-controls').hidden=false;
  $('#rotation').hidden=reduced;$('#rotation').textContent='Pause rotation';$('#rotation').setAttribute('aria-pressed','true');
  presentation.start();
  sound.play('product');
}
function close(){
  ++session;promo.stop();presentation?.stop();stopCamera();setMode('home');
  $('#promo').hidden=true;$('#cinema').hidden=true;$('#hud').hidden=true;$('#intro').hidden=false;$('#error').hidden=true;
}
$('#start').addEventListener('click',()=>startCamera());
$('#see-ar').addEventListener('click',()=>startCamera('ar'));
$('#skip').addEventListener('click',showViewer);
$('#back-viewer').addEventListener('click',showViewer);
$('#replay').addEventListener('click',beginPromo);
$('#stop').addEventListener('click',close);$('#exit-film').addEventListener('click',close);
$('#details').addEventListener('click',()=>{$('#info').hidden=!$('#info').hidden;$('#details').setAttribute('aria-expanded',String(!$('#info').hidden));});
$('#rotation').addEventListener('click',()=>{const enabled=presentation.toggleRotation();$('#rotation').textContent=enabled?'Pause rotation':'Resume rotation';$('#rotation').setAttribute('aria-pressed',String(enabled));});
$('#sound').addEventListener('click',async()=>{
  if(mode==='promo'){promoVideo.muted=!promoVideo.muted;if(!promoVideo.muted&&promoVideo.paused)promo.play();return;}
  if(sound.enabled&&sound.ready){sound.setEnabled(false);return;}
  sound.setEnabled(true);
  if(await sound.unlock())sound.play('tap');
});
window.addEventListener('pagehide',close);
// Release the camera and animation loops when the browser is put in the background.
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});

$('#promo-3d').addEventListener('click',showViewer);
$('#promo-close').addEventListener('click',close);
$('#promo-play').addEventListener('click',()=>{promoVideo.muted=false;promo.play();});
$('#promo-retry').addEventListener('click',()=>promo.retry());
$('#promo-replay').addEventListener('click',beginPromo);
