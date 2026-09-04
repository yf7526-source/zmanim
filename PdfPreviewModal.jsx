import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Download, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 6;

export default function PdfPreviewModal({ open, imageUrl, onConfirm, onCancel, lang = 'both', title }) {
  const [zoom, setZoom] = useState(1);
  const [isFit, setIsFit] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Reset state when modal opens or image changes
  useEffect(() => {
    if (open) {
      setZoom(1);
      setIsFit(true);
      setPan({ x: 0, y: 0 });
    }
  }, [open, imageUrl]);

  const clampZoom = useCallback((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)), []);

  const handleWheel = useCallback((e) => {
    if (!imageUrl) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(z => {
      const next = clampZoom(z + delta * z);
      return next;
    });
    setIsFit(false);
  }, [imageUrl, clampZoom]);

  const handleMouseDown = useCallback((e) => {
    if (isFit || !imageUrl) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [isFit, imageUrl, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Touch pan support
  const handleTouchStart = useCallback((e) => {
    if (isFit || !imageUrl) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  }, [isFit, imageUrl, pan]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  const zoomIn = () => { setZoom(z => clampZoom(z + 0.25)); setIsFit(false); };
  const zoomOut = () => { setZoom(z => clampZoom(z - 0.25)); setIsFit(false); };
  const zoomTo = (z) => { setZoom(clampZoom(z)); setIsFit(false); };
  const fitToScreen = () => { setIsFit(true); setZoom(1); setPan({ x: 0, y: 0 }); };

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.();
      if ((event.key === '+' || event.key === '=') && imageUrl) zoomIn();
      if (event.key === '-' && imageUrl) zoomOut();
      if (event.key === '0' && imageUrl) fitToScreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, imageUrl, onCancel]);

  if (!open) return null;

  const displayZoom = isFit ? 1 : zoom;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-md select-none" role="dialog" aria-modal="true" aria-label={title || (lang === 'he' ? 'תצוגה מקדימה של PDF' : 'PDF preview')}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 safe-area-top">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/90">📄 {title || (lang === 'he' ? 'תצוגה מקדימה' : 'PDF Preview')}</span>
        </div>
        <button
          onClick={onCancel}
          aria-label={lang === 'he' ? 'סגור תצוגה מקדימה' : 'Close PDF preview'}
          className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Zoom toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-white/10 shrink-0 bg-black/40">
        <button
          onClick={zoomOut}
          disabled={(!isFit && zoom <= MIN_ZOOM)}
          className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all disabled:opacity-30"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-white/60" />
        </button>
        <button
          onClick={fitToScreen}
          className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold min-w-[64px] text-center ${isFit ? 'bg-blue-600/40 text-blue-200 border border-blue-400/40' : 'bg-white/8 hover:bg-white/15 text-white/70'}`}
          title="Fit to screen"
          aria-label="Fit PDF preview to screen"
        >
          {isFit ? 'Fit' : `${Math.round(displayZoom * 100)}%`}
        </button>
        <button
          onClick={zoomIn}
          disabled={(!isFit && zoom >= MAX_ZOOM)}
          className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all disabled:opacity-30"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-white/60" />
        </button>
        <div className="w-px h-5 bg-white/15 mx-1" />
        <button onClick={() => zoomTo(2)} aria-label="Zoom to 200 percent" className="px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-[11px] font-bold text-white/60 transition-all">2×</button>
        <button onClick={() => zoomTo(4)} aria-label="Zoom to 400 percent" className="px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-[11px] font-bold text-white/60 transition-all">4×</button>
        <button
          onClick={fitToScreen}
          className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all"
          title="Fit to screen"
          aria-label="Fit PDF preview to screen"
        >
          <Maximize className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Hint */}
      {!isFit && imageUrl && (
        <div className="text-center py-1 text-[10px] text-white/30 shrink-0 border-b border-white/5">
          {lang === 'he' ? 'גלול לזום · גרור להזזה' : 'Scroll to zoom · Drag to pan'}
        </div>
      )}

      {/* Scrollable preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center bg-black/60 p-4"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isFit ? 'default' : isDragging ? 'grabbing' : 'grab' }}
      >
        {imageUrl ? (
          <img
            ref={imgRef}
            src={imageUrl}
            alt="PDF Preview"
            className="pointer-events-none"
            draggable={false}
            style={
              isFit
                ? { width: '100%', height: '100%', objectFit: 'contain' }
                : {
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  }
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-3 mt-20">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            <p className="text-sm text-white/40">{lang === 'he' ? 'מכין תצוגה מקדימה...' : 'Generating preview...'}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {imageUrl && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 shrink-0 safe-area-bottom">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/15 text-white/70 font-bold text-sm hover:bg-white/15 transition-all"
          >
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 border border-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all"
          >
            <Download className="w-4 h-4" />
            {lang === 'he' ? 'הורד PDF' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}