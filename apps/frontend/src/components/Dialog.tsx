'use client';
import { ReactNode, useEffect, useRef } from "react";

export default function Dialog({ children, labelledBy, onClose, busy = false }: { children: ReactNode; labelledBy: string; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={labelledBy} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (!busy && event.target === event.currentTarget) onClose(); }} className="m-auto w-[calc(100%-32px)] max-w-md overflow-visible rounded-2xl border-0 bg-transparent p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40">{children}</dialog>;
}
