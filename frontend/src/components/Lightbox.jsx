import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import SafeImage from './SafeImage';

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext, getImageUrl, onError }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom metrics when index changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onPrev, onNext]);

  if (!images || images.length === 0) return null;

  // Zoom adjustments
  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const zoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Drag Panning events
  const handleMouseDown = (e) => {
    if (scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale === 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Panning events
  const handleTouchStart = (e) => {
    if (scale === 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || scale === 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      
      {/* Top Bar Controls */}
      <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-center z-50 text-white">
        <span className="text-sm font-bold tracking-wider bg-black/40 backdrop-blur-md py-1.5 px-4 rounded-xl border border-white/10">
          {currentIndex + 1} / {images.length}
        </span>
        
        {/* Zoom & Action Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 px-2 py-1 gap-1">
            <button 
              onClick={zoomOut}
              disabled={scale === 1}
              className="p-1.5 rounded-full hover:bg-white/10 text-white disabled:opacity-40 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4.5 w-4.5" />
            </button>
            <span className="text-[10px] font-extrabold px-1 min-w-[35px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={zoomIn}
              disabled={scale === 4}
              className="p-1.5 rounded-full hover:bg-white/10 text-white disabled:opacity-40 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4.5 w-4.5" />
            </button>
            {scale > 1 && (
              <button 
                onClick={resetZoom}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                title="Reset Zoom"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/10"
            aria-label="Close Lightbox"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewer Area */}
      <div className="relative flex items-center justify-center w-full max-w-5xl px-4 h-[70vh]">
        {/* Left Arrow (only visible if not zoomed in) */}
        {scale === 1 && (
          <button 
            onClick={onPrev}
            className="absolute left-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-105 cursor-pointer border border-white/10 backdrop-blur-xs"
            aria-label="Previous Image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Zoomable Image Container */}
        <div 
          className="w-full h-full flex items-center justify-center select-none overflow-hidden relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div 
            className="transition-transform duration-150 ease-out flex items-center justify-center w-full h-full pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            onDoubleClick={handleDoubleClick}
          >
            <SafeImage 
              src={getImageUrl(images[currentIndex])} 
              alt={`Gallery image ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-scaleIn"
              onError={() => {
                if (onError) onError(images[currentIndex]);
              }}
              allowDuplicate={true}
            />
          </div>
        </div>

        {/* Right Arrow (only visible if not zoomed in) */}
        {scale === 1 && (
          <button 
            onClick={onNext}
            className="absolute right-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-105 cursor-pointer border border-white/10 backdrop-blur-xs"
            aria-label="Next Image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Helper text */}
      <span className="text-[10px] font-semibold text-slate-400 mt-2 select-none">
        Double click image to zoom/reset zoom. Drag image to pan when zoomed.
      </span>

      {/* Bottom Thumbnail strip */}
      {scale === 1 && (
        <div className="w-full max-w-3xl px-6 py-4 mt-2 overflow-x-auto no-scrollbar flex gap-2.5 justify-center">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                if (index > currentIndex) {
                  for (let i = currentIndex; i < index; i++) onNext();
                } else if (index < currentIndex) {
                  for (let i = currentIndex; i > index; i--) onPrev();
                }
              }}
              className={`h-12 w-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition cursor-pointer ${
                index === currentIndex ? 'border-indigo-500 scale-95 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <SafeImage 
                src={getImageUrl(img)} 
                alt={`Thumbnail ${index + 1}`} 
                className="w-full h-full object-cover" 
                onError={() => {
                  if (onError) onError(img);
                }}
                allowDuplicate={true}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lightbox;
