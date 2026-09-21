import * as THREE from 'three';

export function createCoil() {
  const shape=new THREE.Shape();
  const point=(i,offset)=>{
    const t=i/500,a=t*Math.PI*7,r=.055+.32*t+offset;
    return [Math.cos(a)*r,Math.sin(a)*r];
  };
  shape.moveTo(...point(0,.026));
  for(let i=1;i<=500;i++)shape.lineTo(...point(i,.026));
  for(let i=500;i>=0;i--)shape.lineTo(...point(i,-.026));
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.034,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.004,bevelThickness:.004});
  geometry.translate(0,0,-.017);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');const pixels=ctx.createImageData(128,128);
  let seed=71;
  for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=100+(seed%95);pixels.data.set([v,v,v,255],i);}
  ctx.putImageData(pixels,0,0);
  const grain=new THREE.CanvasTexture(canvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(5,5);
  const material=new THREE.MeshStandardMaterial({color:0x789775,roughness:.87,metalness:0,bumpMap:grain,bumpScale:.0016});
  const model=new THREE.Group();model.add(new THREE.Mesh(geometry,material));
  return model;
}

export function lightProduct(scene) {
  scene.add(new THREE.HemisphereLight(0xecf4e7,0x28392e,1.5));
  for(const [color,intensity,x,y,z] of [[0xfff0d5,3,-1,2,3],[0xb3cfca,1.1,2,-1,2],[0xd9ed9a,2,0,1,-2]]){
    const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
  }
}
