import { useState, useEffect } from 'react';
import destinationImages from '../assets/destinationImages.json';

// Global registry to prevent duplicate image URLs on the same page view
const renderedImagesRegistry = new Set();

export const clearImageRegistry = () => {
  renderedImagesRegistry.clear();
};

const SafeImage = ({ src, alt, className, onError, allowDuplicate = false }) => {
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    setIsValid(true);
    setLoading(true);

    if (!src) {
      setIsValid(false);
      setLoading(false);
      if (onError) onError();
      return;
    }

    // Check 1: Check if it is a placeholder or generic fallback image
    const isPlaceholder = src.includes('placeholder') || src.includes('dummy') || src.includes('avatar');
    if (isPlaceholder) {
      setIsValid(false);
      setLoading(false);
      if (onError) onError();
      return;
    }

    // Check 2: Check for duplicates rendered on the current view
    if (!allowDuplicate && renderedImagesRegistry.has(src)) {
      setIsValid(false);
      setLoading(false);
      if (onError) onError();
      return;
    }

    // Check 3: Strict Destination Image Validation
    if (src && destinationImages && Object.keys(destinationImages).length > 0) {
      const altText = alt || '';
      
      // Find matching destination key from the registry
      let matchedPlace = null;
      for (const place of Object.keys(destinationImages)) {
        if (altText === place || altText.startsWith(place)) {
          matchedPlace = place;
          break;
        }
      }

      if (matchedPlace) {
        const allowedImages = destinationImages[matchedPlace] || [];
        
        // Helper to extract the unique Unsplash photo ID
        const getPhotoId = (url) => {
          const m = url.match(/photo-([a-zA-Z0-9-]+)/);
          return m ? m[1] : url;
        };
        const srcId = getPhotoId(src);

        // A. Verify that the image belongs to the destination
        const isAllowed = allowedImages.some(img => getPhotoId(img) === srcId);
        if (!isAllowed) {
          console.warn(`Validation failed: Image ID ${srcId} does not belong to destination "${matchedPlace}"`);
          setIsValid(false);
          setLoading(false);
          if (onError) onError();
          return;
        }

        // B. Verify that the image is not used by another destination
        let usedByOther = false;
        for (const otherPlace of Object.keys(destinationImages)) {
          if (otherPlace !== matchedPlace) {
            const otherAllowed = destinationImages[otherPlace] || [];
            if (otherAllowed.some(img => getPhotoId(img) === srcId)) {
              usedByOther = true;
              break;
            }
          }
        }
        if (usedByOther) {
          console.warn(`Validation failed: Image ID ${srcId} is assigned to another destination and cannot be reused for "${matchedPlace}"`);
          setIsValid(false);
          setLoading(false);
          if (onError) onError();
          return;
        }
      }
    }

    // Verify image availability and load
    const img = new Image();
    img.src = src;
    img.onload = () => {
      // Register the image URL to prevent reuse on this view
      renderedImagesRegistry.add(src);
      setImgSrc(src);
      setLoading(false);
    };
    img.onerror = () => {
      setIsValid(false);
      setLoading(false);
      if (onError) onError();
    };
  }, [src, alt]);

const fallbackImagesPool = [
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80", // Taj Mahal
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80", // India general
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80", // Lotus Temple
  "https://images.unsplash.com/photo-1598324422824-011172ab2ad1?auto=format&fit=crop&w=800&q=80", // Munnar
  "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80", // Kerala backwaters
  "https://images.unsplash.com/photo-1506461883276-594a12b11db3?auto=format&fit=crop&w=800&q=80", // Rishikesh
  "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80", // Shimla
  "https://images.unsplash.com/photo-1504701954957-2390f80649b6?auto=format&fit=crop&w=800&q=80", // Jaipur Hawa Mahal
  "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80", // Golden Temple
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80", // Goa
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80", // Madurai Meenakshi
  "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80", // Mysore Palace
  "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80", // Temple architecture
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", // Hampi
  "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=800&q=80", // Pondicherry
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80", // Beach Goa
  "https://images.unsplash.com/photo-1617653202545-931490e87b1f?auto=format&fit=crop&w=800&q=80", // Western Ghats
  "https://images.unsplash.com/photo-1608958414436-e89c6239ba8b?auto=format&fit=crop&w=800&q=80", // Nilgiri hills
  "https://images.unsplash.com/photo-1588186941799-f9a4355d734f?auto=format&fit=crop&w=800&q=80" // Fort heritage
];

const getDeterministicFallback = (name) => {
  if (!name) return fallbackImagesPool[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % fallbackImagesPool.length;
  return fallbackImagesPool[index];
};

  const fallbackSrc = getDeterministicFallback(alt || src);

  if (!isValid) {
    return <img src={fallbackSrc} alt={alt || "Destination placeholder"} className={className} loading="lazy" />;
  }

  if (loading) {
    return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${className}`} />;
  }

  return <img src={imgSrc} alt={alt} className={className} loading="lazy" />;
};

export default SafeImage;

