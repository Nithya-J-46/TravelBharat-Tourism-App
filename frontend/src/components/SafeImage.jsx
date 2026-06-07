import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import destinationImages from '../assets/destinationImages.json';

export const clearImageRegistry = () => {
  // No-op since we don't block duplicate renderings of the same destination image across sections
};

const SafeImage = ({ src, alt, className }) => {
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState('');
  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    // Reset retry index if src changes
    setRetryIndex(0);
  }, [src]);

  useEffect(() => {
    if (!src) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsValid(true);

    const activeSrc = retryIndex > 0 && alt && destinationImages[alt] && destinationImages[alt][retryIndex]
      ? destinationImages[alt][retryIndex]
      : src;

    const img = new Image();
    img.src = activeSrc;
    img.onload = () => {
      setImgSrc(activeSrc);
      setLoading(false);
    };
    img.onerror = () => {
      const placeName = alt || '';
      const placeImages = destinationImages[placeName] || [];
      
      if (placeImages.length > 0 && retryIndex < placeImages.length - 1) {
        // Try the next image in the list
        setRetryIndex(prev => prev + 1);
      } else {
        // No more images to try
        setIsValid(false);
        setLoading(false);
      }
    };
  }, [src, alt, retryIndex]);

  if (!isValid) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-955/20 dark:via-purple-955/20 dark:to-pink-955/20 border border-slate-200/50 dark:border-slate-800/50 p-4 text-center select-none`}>
        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center mb-2 text-indigo-650 dark:text-indigo-400">
          <MapPin className="h-4.5 w-4.5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{alt || 'Destination'}</span>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Explore India</span>
      </div>
    );
  }

  if (loading) {
    return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${className}`} />;
  }

  return <img src={imgSrc} alt={alt} className={className} loading="lazy" />;
};

export default SafeImage;
