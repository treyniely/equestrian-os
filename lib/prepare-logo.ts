import {logoContentBounds,logoPlacement,logoOutputSize} from '../domain/logo-fit';
export type LogoResult={blob:Blob;originalWidth:number;originalHeight:number;trimmed:boolean;enlarged:boolean};
/** Yield to paint the real processing stages; no simulated AI or progress percentage. */
const paint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
export async function prepareLogo(file:File,keepSpacing:boolean,onStage:(label:string)=>void):Promise<LogoResult>{
 if(file.size>8*1024*1024)throw Error('Choose a logo smaller than 8 MB.');if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Use a PNG, JPEG or WebP logo.');
 await paint();const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>40000000)throw Error('Choose a logo with fewer than 40 megapixels.');onStage('Finding the artwork');await paint();let source={x:0,y:0,width:bitmap.width,height:bitmap.height,trimmed:false};
 if(!keepSpacing){const ratio=Math.min(1,512/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*ratio)),h=Math.max(1,Math.round(bitmap.height*ratio));const scan=document.createElement('canvas');scan.width=w;scan.height=h;const scanContext=scan.getContext('2d',{willReadFrequently:true});if(!scanContext)throw Error('Image preparation is unavailable.');scanContext.drawImage(bitmap,0,0,w,h);const b=logoContentBounds(scanContext.getImageData(0,0,w,h).data,w,h);const x=Math.floor(b.x*bitmap.width/w),y=Math.floor(b.y*bitmap.height/h),right=Math.min(bitmap.width,Math.ceil((b.x+b.width)*bitmap.width/w)),bottom=Math.min(bitmap.height,Math.ceil((b.y+b.height)*bitmap.height/h));source={x,y,width:right-x,height:bottom-y,trimmed:b.trimmed};}
 onStage('Centering on a square canvas');await paint();const fit=logoPlacement(source.width,source.height);const canvas=document.createElement('canvas');canvas.width=canvas.height=logoOutputSize;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image preparation is unavailable.');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,source.x,source.y,source.width,source.height,fit.x,fit.y,fit.width,fit.height);
 onStage('Exporting your optimized PNG');await paint();const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to prepare your logo.')),'image/png'));
 // Decode the exact output before allowing it to be saved.
 const check=await createImageBitmap(blob);try{if(check.width!==logoOutputSize||check.height!==logoOutputSize)throw Error('Unable to create a square logo. Please try again.')}finally{check.close()}
 return {blob,originalWidth:bitmap.width,originalHeight:bitmap.height,trimmed:source.trimmed,enlarged:fit.enlarged};
 }finally{bitmap.close()}}
