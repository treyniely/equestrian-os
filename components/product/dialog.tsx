'use client';
import {useEffect,useRef,useContext,createContext,useId} from 'react';
export const FeedbackContext=createContext('');
export default function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),startedOnBackdrop=useRef(false),titleId=useId(),error=useContext(FeedbackContext);
 useEffect(()=>{const opener=document.activeElement as HTMLElement|null,dialog=ref.current;dialog?.showModal();return()=>{dialog?.close();if(opener?.isConnected)opener.focus({preventScroll:true})}},[]);
 const outside=(x:number,y:number)=>{const rect=ref.current?.getBoundingClientRect();return !!rect&&(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)};
 return <dialog ref={ref} className="native-dialog" aria-labelledby={titleId} onCancel={e=>{if(e.target!==e.currentTarget)return;e.preventDefault();onClose()}}
  onPointerDown={e=>{startedOnBackdrop.current=e.button===0&&e.target===e.currentTarget&&outside(e.clientX,e.clientY)}}
  onPointerCancel={()=>{startedOnBackdrop.current=false}}
  onClick={e=>{const dismiss=startedOnBackdrop.current&&e.target===e.currentTarget&&outside(e.clientX,e.clientY);startedOnBackdrop.current=false;if(dismiss)onClose()}}>
  <div className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="close icon" onClick={onClose} aria-label="Close dialog">×</button></div>
  <div className="dialog-body">{error&&<div className="error" role="alert">{error}</div>}{children}</div>
 </dialog>
}
