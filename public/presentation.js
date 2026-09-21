import * as THREE from 'three';
import {createCoil,lightProduct} from './product-model.js';

export function createPresentation(container) {
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.01,20);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  container.appendChild(renderer.domElement);
  const model=createCoil();scene.add(model);lightProduct(scene);
  const pack=new THREE.Group();
  for(let i=0;i<10;i++)pack.add(new THREE.Mesh(model.children[0].geometry,model.children[0].material));
  pack.visible=false;scene.add(pack);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active=false,dragging=false,lastX=0,lastY=0,lastTime=0,lastTouch=0,autoRotate=true;
  let storyTime=null;
  const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
  function resize(){
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height);camera.aspect=width/height;
    camera.position.z=.49/(Math.tan(THREE.MathUtils.degToRad(17.5))*Math.min(1,camera.aspect));
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);
  container.addEventListener('pointerdown',e=>{
    if(!active||storyTime!==null)return;
    dragging=true;lastX=e.clientX;lastY=e.clientY;container.setPointerCapture(e.pointerId);lastTouch=performance.now();
  });
  container.addEventListener('pointermove',e=>{
    if(!dragging)return;
    model.rotation.y+=(e.clientX-lastX)*.009;
    model.rotation.x+=(e.clientY-lastY)*.009;
    lastX=e.clientX;lastY=e.clientY;lastTouch=performance.now();
  });
  const release=()=>{dragging=false;lastTouch=performance.now();};
  container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);container.addEventListener('lostpointercapture',release);
  container.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();lastTouch=performance.now();
    if(e.key==='ArrowLeft')model.rotation.y-=.15;
    if(e.key==='ArrowRight')model.rotation.y+=.15;
    if(e.key==='ArrowUp')model.rotation.x-=.15;
    if(e.key==='ArrowDown')model.rotation.x+=.15;
  });
  return {
    start(story=false){
      storyTime=story?0:null;
      active=true;lastTime=0;autoRotate=true;model.rotation.set(-.25,-.3,-.15);resize();
      renderer.setAnimationLoop(now=>{
        const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
        if(storyTime!==null){
          const spread=smooth((storyTime-2)/.55)*(1-smooth((storyTime-4.05)/.85));
          pack.visible=storyTime>=2&&storyTime<4.9;
          model.visible=!pack.visible;
          model.scale.setScalar(.9+.1*smooth(storyTime/1.5));
          model.rotation.set(-.22,-.36+storyTime*.09,-.12);
          pack.children.forEach((item,i)=>{
            item.position.set(((i%5)-2)*.176*spread,(Math.floor(i/5)-.5)*.23*spread,(i-5)*.001*spread);
            item.scale.setScalar(1-.80*spread);item.rotation.set(-.1*spread,-.15*spread,-.12);
          });
        }else{
          pack.visible=false;model.visible=true;model.scale.setScalar(1);
          if(!reduced&&!dragging&&autoRotate&&now-lastTouch>2000)model.rotation.y+=dt*.16;
        }
        renderer.render(scene,camera);
      });
    },
    stop(){active=false;dragging=false;renderer.setAnimationLoop(null);},
    setStoryTime(seconds){storyTime=seconds;},
    finishStory(){storyTime=null;},
    toggleRotation(){autoRotate=!autoRotate;return autoRotate;},
  };
}
