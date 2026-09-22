'use client';
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { ProductImage } from "@/lib/types";
import Icon from "./Icon";
import DemoProductArt from "./DemoProductArt";

const limit = (n: number, max: number) => Math.max(-max, Math.min(max, n));
export default function ProductGallery({ images, name, demo, category, pack }: { images: ProductImage[]; name: string; demo?: boolean; category?: string; pack?: string }) {
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; start: typeof view; rotate: boolean } | null>(null);
  const usable = images.filter(image => image.url);
  const available = Boolean(usable[selected] || demo);
  function reset() { setZoom(false); setTilt(false); setView({ x: 0, y: 0, rx: 0, ry: 0 }); }
  function toggleZoom() { setZoom(value => !value); setView(value => ({ ...value, x: 0, y: 0 })); }
  function start(e: PointerEvent<HTMLDivElement>) {
    if (!available || e.button !== 0 || (e.pointerType === "touch" && !zoom && !tilt)) return;
    drag.current = { x: e.clientX, y: e.clientY, start: view, rotate: e.ctrlKey || tilt || !zoom };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const previous = drag.current;
    if (!previous) return;
    const dx = e.clientX - previous.x, dy = e.clientY - previous.y;
    setView(previous.rotate
      ? { ...previous.start, rx: limit(previous.start.rx - dy / 7, 25), ry: limit(previous.start.ry + dx / 7, 25) }
      : { ...previous.start, x: limit(previous.start.x + dx, e.currentTarget.clientWidth / 3), y: limit(previous.start.y + dy, e.currentTarget.clientHeight / 3) });
  }
  function end(e: PointerEvent<HTMLDivElement>) { drag.current = null; setDragging(false); if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }
  return <div className="product-gallery"><div className={`gallery-stage ${dragging ? "is-dragging" : ""}`} tabIndex={available ? 0 : undefined} role="img" aria-label={`${name}: interactive product image`} aria-describedby="gallery-help" style={{ touchAction: zoom || tilt ? "none" : "pan-y" }} onDoubleClick={() => available && toggleZoom()} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { drag.current = null; setDragging(false); }} onKeyDown={e => {
    if (!available) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleZoom(); }
    if (e.key === "Escape") reset();
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      setView(v => ({ ...v, ry: limit(v.ry + (e.key === "ArrowLeft" ? -5 : e.key === "ArrowRight" ? 5 : 0), 25), rx: limit(v.rx + (e.key === "ArrowUp" ? 5 : e.key === "ArrowDown" ? -5 : 0), 25) }));
    }
  }}><div className="gallery-image-plane" style={{ transform: `perspective(900px) rotateX(${view.rx}deg) rotateY(${view.ry}deg) translate(${view.x}px, ${view.y}px) scale(${zoom ? 2 : 1})` }}>{usable[selected] ? <Image src={usable[selected].url} alt={name} fill priority draggable={false} sizes="(max-width:760px) 95vw, 580px" className="object-contain" /> : demo ? <DemoProductArt name={name} category={category} pack={pack} /> : <span className="product-no-image"><Icon name="box" width={60} height={60} /><span>Product photo coming soon</span></span>}</div>{zoom && <span className="gallery-zoom-badge">2× zoom</span>}</div>
    {available && <><div className="gallery-controls"><button type="button" className="button-secondary" aria-pressed={zoom} onClick={toggleZoom}>{zoom ? "Zoom out" : "Zoom in"}</button><button type="button" className="button-secondary" aria-pressed={tilt} onClick={() => setTilt(v => !v)}>3D tilt</button><button type="button" className="button-secondary" onClick={reset}>Reset view</button></div><p id="gallery-help" className="gallery-help">Double-click to zoom. Drag to tilt; when zoomed, drag to pan or hold Ctrl to tilt. On touch screens, enable 3D tilt first. Keyboard: Enter to zoom, arrows to tilt, Escape to reset.</p></>}
    {usable.length > 1 && <div className="mt-4 flex gap-3 overflow-auto">{usable.map((image, index) => <button key={image.id ?? index} aria-label={`View product image ${index + 1}`} aria-pressed={selected === index} onClick={() => { setSelected(index); reset(); }} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${selected === index ? "border-emerald-700" : "border-transparent"}`}><Image src={image.url} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>}
  </div>;
}
