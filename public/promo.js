export function createPromo(video,onState) {
  let active=false,attempt=0,timer;
  function state(kind,message=''){
    if(!active)return;
    clearTimeout(timer);onState(kind,message);
    if(kind==='loading')timer=setTimeout(()=>onState('slow','Still loading. You can retry or explore in 3D.'),15000);
  }
  function prepare(){
    if(!video.getAttribute('src')){video.src='/video/smash-promo.mp4';video.load();}
  }
  async function play(){
    if(!active)return;
    const id=++attempt;state('loading','Loading your promo…');
    try{
      await video.play();
      if(!active){video.pause();return;}
      if(id!==attempt)return;
      state('playing');
    }catch(error){
      if(!active||id!==attempt)return;
      if(error.name==='NotAllowedError')state('blocked','Your promo is ready.');
      else if(error.name!=='AbortError')state('error','The video couldn’t play. Retry or explore in 3D.');
    }
  }
  video.addEventListener('playing',()=>state('playing'));
  video.addEventListener('waiting',()=>state('loading','Buffering your promo…'));
  video.addEventListener('stalled',()=>{if(video.readyState<3)state('loading','Loading your promo…');});
  video.addEventListener('ended',()=>state('ended'));
  video.addEventListener('error',()=>state('error','The video couldn’t load. Retry or explore in 3D.'));
  return {
    prepare,play,
    start(muted=false){active=true;prepare();video.muted=muted;video.currentTime=0;play();},
    retry(){if(!active)return;video.load();play();},
    stop(){active=false;++attempt;clearTimeout(timer);video.pause();},
  };
}
