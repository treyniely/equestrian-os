import {logoContentBounds,logoBackgroundColor,logoPlacement,logoOutputSize} from '../domain/logo-fit';
export type LogoResult={blob:Blob;originalWidth:number;originalHeight:number;trimmed:boolean;enlarged:boolean;backgroundColor:string|null;backgroundExtended:boolean};
/** Yield to paint the real processing stages; no simulated AI or progress percentage. */
const paint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
export async function prepareLogo(file:File,keepSpacing:boolean,onStage:(label:string)=>void,extendBackground=true):Promise<LogoResult>{
 if(file.size>8*1024*1024)throw Error('Choose a logo smaller than 8 MB.');if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Use a PNG, JPEG or WebP logo.');
 await paint();const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>40000000)throw Error('Choose a logo with fewer than 40 megapixels.');onStage('Finding the artwork');await paint();let source={x:0,y:0,width:bitmap.width,height:bitmap.height,trimmed:false};
 let backgroundColor:string|null=null;{const ratio=Math.min(1,512/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*ratio)),h=Math.max(1,Math.round(bitmap.height*ratio));const scan=document.createElement('canvas');scan.width=w;scan.height=h;const scanContext=scan.getContext('2d',{willReadFrequently:true});if(!scanContext)throw Error('Image preparation is unavailable.');scanContext.drawImage(bitmap,0,0,w,h);const pixels=scanContext.getImageData(0,0,w,h).data;backgroundColor=logoBackgroundColor(pixels,w,h);if(!keepSpacing){const b=logoContentBounds(pixels,w,h);const x=Math.floor(b.x*bitmap.width/w),y=Math.floor(b.y*bitmap.height/h),right=Math.min(bitmap.width,Math.ceil((b.x+b.width)*bitmap.width/w)),bottom=Math.min(bitmap.height,Math.ceil((b.y+b.height)*bitmap.height/h));source={x,y,width:right-x,height:bottom-y,trimmed:b.trimmed};}}
 onStage('Centering on a square canvas');await paint();const fit=logoPlacement(source.width,source.height);const canvas=document.createElement('canvas');canvas.width=canvas.height=logoOutputSize;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image preparation is unavailable.');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(extendBackground&&backgroundColor){onStage('Extending the matching background');await paint();ctx.fillStyle=backgroundColor;ctx.fillRect(0,0,logoOutputSize,logoOutputSize);
 // Extend edge pixels into the surrounding canvas, leaving the actual logo untouched.
 const {x:sx,y:sy,width:sw,height:sh}=source,{x,y,width:w,height:h}=fit,size=logoOutputSize;
 ctx.drawImage(bitmap,sx,sy,sw,1,x,0,w,y+1);ctx.drawImage(bitmap,sx,sy+sh-1,sw,1,x,y+h-1,w,size-y-h+1);
 ctx.drawImage(bitmap,sx,sy,1,sh,0,y,x+1,h);ctx.drawImage(bitmap,sx+sw-1,sy,1,sh,x+w-1,y,size-x-w+1,h);
 ctx.drawImage(bitmap,sx,sy,1,1,0,0,x+1,y+1);ctx.drawImage(bitmap,sx+sw-1,sy,1,1,x+w-1,0,size-x-w+1,y+1);
 ctx.drawImage(bitmap,sx,sy+sh-1,1,1,0,y+h-1,x+1,size-y-h+1);ctx.drawImage(bitmap,sx+sw-1,sy+sh-1,1,1,x+w-1,y+h-1,size-x-w+1,size-y-h+1);
 }
 ctx.drawImage(bitmap,source.x,source.y,source.width,source.height,fit.x,fit.y,fit.width,fit.height);
 onStage('Exporting your optimized PNG');await paint();const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to prepare your logo.')),'image/png'));
 // Decode the exact output before allowing it to be saved.
 const check=await createImageBitmap(blob);try{if(check.width!==logoOutputSize||check.height!==logoOutputSize)throw Error('Unable to create a square logo. Please try again.')}finally{check.close()}
 return {blob,originalWidth:bitmap.width,originalHeight:bitmap.height,trimmed:source.trimmed,enlarged:fit.enlarged,backgroundColor,backgroundExtended:!!backgroundColor&&extendBackground};
 }finally{bitmap.close()}}
