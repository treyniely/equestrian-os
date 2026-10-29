'use client';
import { useEffect, useRef, useContext, createContext } from 'react';
export const FeedbackContext = createContext('');
export default function Dialog({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) { const ref = useRef<HTMLDialogElement>(null); const error = useContext(FeedbackContext); useEffect(() => { const opener = document.activeElement as HTMLElement; ref.current?.showModal(); return () => opener?.focus(); }, []); return <dialog ref={ref} className="native-dialog" onCancel={e => { e.preventDefault(); onClose(); }}><button className="close icon" onClick={onClose} aria-label="Close dialog">×</button><h2>{title}</h2>{error && <div className="error" role="alert">{error}</div>}{children}</dialog>; }
