import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function PrintPreview({ open, onClose }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const captureRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setImgUrl(null);
    // Capture the main app content (everything except this modal)
    const target = document.querySelector('main') || document.querySelector('#root') || document.body;
    html2canvas(target, {
      scale: 1.5,
      backgroundColor: '#0D1B2A',
      useCORS: true,
      logging: false,
    })
      .then(canvas => {
        setImgUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => setImgUrl(null))
      .finally(() => setLoading(false));
  }, [open]);

  function handlePrint() {
    if (!imgUrl) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html><head><title>Print Preview</title>
      <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; background: #0D1B2A; }
        img { width: 100%; height: auto; display: block; }
      </style>
      </head><body>
      <img src="${imgUrl}" alt="" />
      </body></html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 500);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-600" />
              Print Preview
            </h2>
            <p className="text-xs text-gray-400">This is how the page will look on paper</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all" title="Zoom out">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all" title="Zoom in">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handlePrint} disabled={!imgUrl} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-40">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} aria-label="Close print preview" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-200 p-4 flex items-start justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-500">Capturing page...</p>
            </div>
          ) : imgUrl ? (
            <div className="bg-white shadow-2xl" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <img src={imgUrl} alt="Print preview" className="block max-w-full" />
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-20">Failed to capture page</p>
          )}
        </div>
      </div>
    </div>
  );
}