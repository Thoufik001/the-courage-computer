import * as THREE from 'three';
export type Surface='wood'|'leather'|'paper'|'stone';
export type SurfaceMaps={map:THREE.Texture;normalMap:THREE.Texture;roughnessMap:THREE.Texture};
function random(seed:number){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function makeSurface(kind:Surface):SurfaceMaps{
 const n=512,r=random(42),height=new Float32Array(n*n),base=document.createElement('canvas');base.width=base.height=n;const ctx=base.getContext('2d')!,img=ctx.createImageData(n,n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x,noise=r(),wave=Math.sin(y*.15+Math.sin(x*.014)*3+Math.sin(y*.025)*8),fine=Math.sin(y*1.8+Math.sin(x*.025)*6);
  let h=noise,v=0,red=0,green=0,blue=0;
  if(kind==='wood'){h=.5+wave*.19+fine*.09+(noise-.5)*.22;v=h*31;red=51+v;green=29+v*.7;blue=17+v*.45;if(y%128<2){red*=.3;green*=.3;blue*=.3;h=.1;}}
  if(kind==='leather'){const cell=Math.sin(x*1.24+Math.sin(y*.54)*2)*Math.sin(y*1.13+Math.sin(x*.43)*2);h=.45+cell*.3+noise*.18;v=h*14;red=20+v*.7;green=20+v*.75;blue=16+v*.8;}
  if(kind==='paper'){const fibre=Math.sin(x*.38+y*.23)*Math.sin(x*.11-y*.17);h=.5+(noise-.5)*.12+fibre*.025;const edge=Math.pow(Math.max(Math.abs(x/n-.5)*2,Math.abs(y/n-.5)*2),10);v=(noise-.5)*7+fibre*2-edge*8;red=239+v;green=224+v;blue=194+v*.85;}
  if(kind==='stone'){h=noise*.5+Math.sin(x*.06)*Math.sin(y*.04)*.1;v=h*17;red=37+v;green=32+v;blue=26+v;}
  height[i]=h;img.data.set([red,green,blue,255],i*4);
 }
 ctx.putImageData(img,0,0);
 if(kind==='paper'){for(let i=0;i<900;i++){const x=r()*n,y=r()*n,length=2+r()*17;ctx.strokeStyle=`rgba(112,88,57,${.012+r()*.035})`;ctx.lineWidth=.25+r()*.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+length*(r()-.2),y+length*(r()-.2));ctx.stroke();}}
 if(kind==='wood'){for(let i=0;i<180;i++){const y=r()*n;ctx.strokeStyle=`rgba(12,6,2,${r()*.27})`;ctx.lineWidth=r()*.7;ctx.beginPath();ctx.moveTo(r()*n,y);ctx.bezierCurveTo(n*.4,y+2,n*.6,y-3,n,y+1);ctx.stroke();}}
 const normal=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,h=height[i],dx=height[y*n+(x+1)%n]-height[y*n+(x+n-1)%n],dy=height[((y+1)%n)*n+x]-height[((y+n-1)%n)*n+x];normal.set([128-dx*75,128-dy*75,248,255],i*4);const v=kind==='leather'?140+h*60:190+h*50;rough.set([v,v,v,255],i*4);}
 const map=new THREE.CanvasTexture(base),normalMap=new THREE.DataTexture(normal,n,n),roughnessMap=new THREE.DataTexture(rough,n,n);map.colorSpace=THREE.SRGBColorSpace;
 for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;t.needsUpdate=true;}return{map,normalMap,roughnessMap};
}
export function makeCoverLabel(){const c=document.createElement('canvas');c.width=1024;c.height=1400;const x=c.getContext('2d')!;x.clearRect(0,0,c.width,c.height);x.strokeStyle='#947b48';x.lineWidth=2;x.strokeRect(80,75,864,1250);x.lineWidth=1;x.strokeRect(93,88,838,1224);x.fillStyle='#b39b68';x.textAlign='center';x.font='26px Georgia';x.fillText('M E M O R I A',512,1040);x.font='17px Georgia';x.fillStyle='#877142';x.fillText('PRIVATE & CONFIDENTIAL',512,1090);x.save();x.translate(512,620);x.rotate(Math.PI/4);x.strokeStyle='#8e7848';x.strokeRect(-56,-56,112,112);x.strokeRect(-43,-43,86,86);x.restore();x.font='56px Georgia';x.fillStyle='#ab9056';x.fillText('M',512,640);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function makeEndpaper(){const c=document.createElement('canvas');c.width=480;c.height=650;const x=c.getContext('2d')!;x.clearRect(0,0,480,650);x.textAlign='center';x.font='italic 21px Georgia';x.globalAlpha=.8;x.fillStyle='#c99a6e';x.shadowColor='#130904';x.shadowBlur=1;x.shadowOffsetX=1;x.shadowOffsetY=1;x.fillText('What is written',240,287);x.fillText('is never quite forgotten.',240,323);x.shadowBlur=0;x.shadowOffsetX=0;x.shadowOffsetY=0;x.font='12px Georgia';x.globalAlpha=.65;x.fillText('✦',240,370);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.center.set(.5,.5);t.rotation=Math.PI;return t;}
