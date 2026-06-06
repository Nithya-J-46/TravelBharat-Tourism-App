import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, MapPin, Calendar, Clock, Coins, Compass, Heart, Plus, 
  ExternalLink, X, Loader2, Info, Lightbulb, ChevronLeft, ChevronRight
} from 'lucide-react';
import Lightbox from '../components/Lightbox';
import SafeImage from '../components/SafeImage';
import WeatherWidget from '../components/WeatherWidget';

const QuickViewContext = createContext(null);

export const useQuickView = () => {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
};

export const QuickViewProvider = ({ children }) => {
  const [quickViewPlace, setQuickViewPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  
  // Touch Swipe Gesture State
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const navigate = useNavigate();

  // Reset states on place change
  useEffect(() => {
    if (quickViewPlace) {
      setActiveImageIndex(0);
      setSuccessMsg('');
      setFailedImages(new Set());
      setIsFullscreenOpen(false);
      
      const savedWishlist = localStorage.getItem('travelbharat_wishlist');
      if (savedWishlist) {
        try {
          const list = JSON.parse(savedWishlist);
          const isSaved = list.some(item => item._id === quickViewPlace._id);
          setWishlisted(isSaved);
        } catch (e) {
          console.error(e);
        }
      } else {
        setWishlisted(false);
      }
    }
  }, [quickViewPlace]);

  const openQuickView = async (placeInput) => {
    setLoading(true);
    setError('');
    
    let placeObj = null;
    let nameToSearch = '';
    
    if (typeof placeInput === 'string') {
      nameToSearch = placeInput;
      setQuickViewPlace({ name: placeInput });
    } else if (placeInput && typeof placeInput === 'object') {
      if (placeInput._id || placeInput.slug) {
        placeObj = placeInput;
        setQuickViewPlace(placeInput);
      } else if (placeInput.name) {
        nameToSearch = placeInput.name;
        setQuickViewPlace(placeInput);
      }
    }
    
    try {
      let res;
      if (placeObj) {
        if (placeObj.slug) {
          res = await axios.get(`http://localhost:5000/api/places/slug/${placeObj.slug}`);
        } else {
          res = await axios.get(`http://localhost:5000/api/places/${placeObj._id}`);
        }
        setQuickViewPlace(res.data);
      } else if (nameToSearch) {
        res = await axios.get(`http://localhost:5000/api/places?search=${encodeURIComponent(nameToSearch)}`);
        if (res.data && res.data.length > 0) {
          const matched = res.data.find(p => p.name.toLowerCase() === nameToSearch.toLowerCase()) || res.data[0];
          setQuickViewPlace(matched);
        } else {
          setError('Unable to load destination details');
        }
      } else {
        setError('Unable to load destination details');
      }
    } catch (err) {
      console.error('Error fetching quick view details:', err);
      setError('Unable to load destination details');
    } finally {
      setLoading(false);
    }
  };

  const closeQuickView = () => {
    setQuickViewPlace(null);
    setError('');
  };

  const toggleWishlist = () => {
    if (!quickViewPlace) return;
    const savedWishlist = localStorage.getItem('travelbharat_wishlist');
    let list = [];
    if (savedWishlist) {
      try {
        list = JSON.parse(savedWishlist);
      } catch (e) {
        console.error(e);
      }
    }

    const index = list.findIndex(item => item._id === quickViewPlace._id);
    if (index > -1) {
      list.splice(index, 1);
      setWishlisted(false);
      showTemporaryMessage('Removed from Saved Wishlist');
    } else {
      list.push({
        _id: quickViewPlace._id,
        name: quickViewPlace.name,
        slug: quickViewPlace.slug,
        images: quickViewPlace.images,
        city: quickViewPlace.city,
        state: quickViewPlace.state
      });
      setWishlisted(true);
      showTemporaryMessage('Saved to Wishlist!');
    }
    localStorage.setItem('travelbharat_wishlist', JSON.stringify(list));
    window.dispatchEvent(new Event('wishlistChanged'));
  };

  const addToTripPlanner = () => {
    if (!quickViewPlace) return;
    const plannerStorageKey = 'travelbharat_temp_planner';
    let currentPlanned = [];
    const saved = localStorage.getItem(plannerStorageKey);
    if (saved) {
      try {
        currentPlanned = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    if (!currentPlanned.some(item => item._id === quickViewPlace._id)) {
      currentPlanned.push(quickViewPlace);
      localStorage.setItem(plannerStorageKey, JSON.stringify(currentPlanned));
    }
    showTemporaryMessage('Destination Added to AI Trip Planner!');
  };

  const showTemporaryMessage = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 2800);
  };

  const handleHeroImageError = (imgUrl) => {
    if (!imgUrl) return;
    setFailedImages(prev => {
      const next = new Set(prev);
      next.add(imgUrl);
      return next;
    });
    setActiveImageIndex(prev => prev + 1);
  };

  const getImageUrl = (index) => {
    if (!quickViewPlace) return '';
    const imagesToUse = (quickViewPlace.images || []).filter(img => !failedImages.has(img));
    if (imagesToUse.length === 0) return '';
    const path = imagesToUse[index % imagesToUse.length];
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const getPathUrl = (path) => {
    if (!path || typeof path !== 'string' || failedImages.has(path)) {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  // Distance computation helper
  const getDistanceText = () => {
    if (!quickViewPlace) return '';
    const userLat = parseFloat(localStorage.getItem('userLat'));
    const userLng = parseFloat(localStorage.getItem('userLng'));
    const destLat = quickViewPlace.coordinates?.latitude;
    const destLng = quickViewPlace.coordinates?.longitude;

    if (userLat && userLng && destLat && destLng) {
      const R = 6371; // km
      const dLat = ((destLat - userLat) * Math.PI) / 180;
      const dLon = ((destLng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((destLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c * 1.24);
      return `${distance} km away`;
    }
    return '';
  };

  const imagesToUse = quickViewPlace ? (quickViewPlace.images || []).filter(img => !failedImages.has(img)) : [];
  const cityName = quickViewPlace?.city?.name || quickViewPlace?.city || '';
  const stateName = quickViewPlace?.state?.name || quickViewPlace?.state || '';
  const categoryName = quickViewPlace?.category?.name || quickViewPlace?.category || 'Destination';
  const ratingValue = quickViewPlace?.ratingScores?.popularity 
    ? quickViewPlace.ratingScores.popularity.toFixed(1) 
    : '4.5';
  const distanceText = getDistanceText();

  const directionsUrl = quickViewPlace 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quickViewPlace.name + ', ' + cityName)}`
    : '#';

  const viewFullDetails = () => {
    if (!quickViewPlace) return;
    const url = quickViewPlace.slug ? `/destination/${quickViewPlace.slug}` : `/place/${quickViewPlace._id}`;
    navigate(url);
    closeQuickView();
  };

  // Keyboard controls listener (Escape and Left/Right keys)
  useEffect(() => {
    if (!quickViewPlace) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeQuickView();
        return;
      }

      const len = imagesToUse.length;
      if (len <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === 0 ? len - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === len - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickViewPlace, imagesToUse.length]);

  // Touch handlers for mobile swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    const swipeThreshold = 55;
    const len = imagesToUse.length;

    if (len <= 1) return;

    if (diff > swipeThreshold) {
      // Swipe Left (Next Image)
      setActiveImageIndex(prev => (prev === len - 1 ? 0 : prev + 1));
    } else if (diff < -swipeThreshold) {
      // Swipe Right (Previous Image)
      setActiveImageIndex(prev => (prev === 0 ? len - 1 : prev - 1));
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <QuickViewContext.Provider value={{ openQuickView, closeQuickView }}>
      {children}

      {/* Global Quick View Modal */}
      {quickViewPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn print:hidden">
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row h-[90vh] md:h-[600px] min-h-[500px]">
            
            {/* Close trigger top-right */}
            <button 
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-20 text-white font-extrabold text-sm p-2 bg-black/55 hover:bg-black/75 rounded-full cursor-pointer transition border border-white/10 hover:scale-105"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Success Message Banner */}
            {successMsg && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-indigo-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-2xl shadow-xl animate-slideUp">
                {successMsg}
              </div>
            )}

            {/* Left side: Premium Gallery Side-by-Side (48% width) */}
            <div className="w-full md:w-[48%] flex flex-col h-[40vh] md:h-full bg-slate-950 relative border-r border-slate-100 dark:border-slate-850 flex-shrink-0 select-none overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
              
              {/* Hero Image Container */}
              <div 
                className="flex-1 relative overflow-hidden group w-full h-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {imagesToUse.length > 0 ? (
                  <>
                    <SafeImage 
                      key={activeImageIndex}
                      src={getImageUrl(activeImageIndex)} 
                      alt={quickViewPlace.name} 
                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105 cursor-zoom-in animate-fadeIn"
                      onClick={() => setIsFullscreenOpen(true)}
                      onError={() => handleHeroImageError(getImageUrl(activeImageIndex))}
                      allowDuplicate={true}
                    />
                    
                    {/* Image Counter Overlay */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-white border border-white/10 z-10 shadow-md">
                      {`${(activeImageIndex % imagesToUse.length) + 1} / ${imagesToUse.length}`}
                    </div>

                    {/* Highly Visible Glassmorphic Navigation Arrows */}
                    {imagesToUse.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const len = imagesToUse.length;
                            setActiveImageIndex(prev => (prev === 0 ? len - 1 : prev - 1));
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white rounded-full p-2.5 transition duration-200 hover:scale-110 cursor-pointer z-10 border border-white/10 shadow-lg backdrop-blur-md"
                          title="Previous Image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const len = imagesToUse.length;
                            setActiveImageIndex(prev => (prev === len - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/85 text-white rounded-full p-2.5 transition duration-200 hover:scale-110 cursor-pointer z-10 border border-white/10 shadow-lg backdrop-blur-md"
                          title="Next Image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider p-4 text-center">
                    Images currently unavailable
                  </div>
                )}
              </div>

              {/* Bottom Thumbnail Strip */}
              <div className="h-20 bg-slate-900 dark:bg-slate-950/80 p-3 flex items-center justify-center border-t border-slate-850 flex-shrink-0">
                <div className="flex gap-2.5 overflow-x-auto py-1 px-1 no-scrollbar w-full max-w-full justify-start md:justify-center items-center">
                  {imagesToUse.map((img, idx) => {
                    const isSelected = (activeImageIndex % imagesToUse.length) === idx;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 cursor-pointer hover:scale-105 hover:border-indigo-400 ${
                          isSelected 
                            ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/20' 
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <SafeImage 
                          src={getPathUrl(img)} 
                          alt={`${quickViewPlace.name} gallery ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          allowDuplicate={true}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right side: Detailed Information Block (52% width) */}
            <div className="w-full md:w-[52%] p-6 md:p-8 flex flex-col justify-between overflow-y-auto h-[50vh] md:h-full text-left bg-white dark:bg-slate-900 rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none">
              
              {error ? (
                <div className="flex flex-col justify-center items-center h-full py-16 space-y-3 text-center">
                  <Info className="h-10 w-10 text-red-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{error}</span>
                  <button 
                    onClick={closeQuickView}
                    className="mt-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4 flex-grow">
                  
                  {/* Category and Rating Header */}
                  <div className="flex justify-between items-center">
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full">
                      {categoryName}
                    </span>
                    <div className="flex items-center gap-1 text-slate-755 text-slate-700 dark:text-slate-350 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      <span>{ratingValue} / 5.0</span>
                    </div>
                  </div>

                  {/* Title & Location details */}
                  <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight tracking-tight">
                      {quickViewPlace.name}
                    </h2>
                    <div className="flex flex-wrap items-center text-xs font-semibold text-slate-400 dark:text-slate-500 gap-y-1">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-indigo-505 flex-shrink-0" />
                      <span>{cityName}{stateName ? `, ${stateName}` : ''}</span>
                      {distanceText && (
                        <>
                          <span className="mx-2 font-light">•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{distanceText}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Skeleton Loaders */}
                  {loading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  ) : (
                    <div className="space-y-4.5">
                      
                      {/* Best Time to Visit Badge */}
                      {quickViewPlace.bestTimeToVisit && (
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-650 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10 w-fit">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                          Best season: {quickViewPlace.bestTimeToVisit}
                        </div>
                      )}

                      {/* Description */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block">Description</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-h-[90px] overflow-y-auto pr-1">
                          {quickViewPlace.description}
                        </p>
                      </div>

                      {/* Timings and Fees Grid */}
                      <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-200/50 dark:border-slate-850">
                          <Coins className="h-4.5 w-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-450 uppercase block font-bold tracking-wider">Entry Ticket</span>
                            <strong className="text-slate-700 dark:text-slate-200">{quickViewPlace.entryFees?.adult ? `₹${quickViewPlace.entryFees.adult}` : 'Free Entry'}</strong>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-200/50 dark:border-slate-850">
                          <Clock className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-450 uppercase block font-bold tracking-wider">Opening Hours</span>
                            <strong className="text-slate-705 dark:text-slate-200 truncate block max-w-[140px]">{quickViewPlace.timings || '9:00 AM - 6:00 PM'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Nearby Attractions */}
                      {quickViewPlace.nearbyAttractions && quickViewPlace.nearbyAttractions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                            <Compass className="h-3.5 w-3.5 text-indigo-555" /> Nearby attractions
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {quickViewPlace.nearbyAttractions.slice(0, 3).map((attr, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-slate-600 dark:text-slate-450 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 py-1 px-3 rounded-lg">
                                {attr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Travel Tips */}
                      {quickViewPlace.travelTips && quickViewPlace.travelTips.length > 0 && (
                        <div className="space-y-1 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-200/40 dark:border-slate-850 p-3 rounded-2xl">
                          <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                            <Lightbulb className="h-3.5 w-3.5 text-indigo-550" /> Traveler Advice
                          </span>
                          <p className="text-slate-655 dark:text-slate-400 text-xs italic font-medium leading-relaxed">
                            "{quickViewPlace.travelTips[0]}"
                          </p>
                        </div>
                      )}

                      {/* Smart Weather Assistant */}
                      <div className="pt-2">
                        <WeatherWidget 
                          placeName={quickViewPlace.name} 
                          stateName={stateName} 
                          coordinates={quickViewPlace.coordinates} 
                          category={categoryName} 
                        />
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* Action Buttons Row */}
              {!error && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4 border-t border-slate-150 dark:border-slate-800/80 mt-6 flex-shrink-0">
                  <button 
                    onClick={viewFullDetails}
                    className="bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={addToTripPlanner}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border border-slate-200/50 dark:border-slate-800/80"
                  >
                    Add to Planner
                  </button>
                  <a 
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350 font-extrabold py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Directions
                  </a>
                  <button 
                    onClick={toggleWishlist}
                    className={`font-extrabold py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border ${
                      wishlisted 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                    {wishlisted ? 'Saved' : 'Wishlist'}
                  </button>
                  <button 
                    onClick={closeQuickView}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold py-2.5 px-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    Close
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Lightbox Viewer */}
      {isFullscreenOpen && imagesToUse.length > 0 && (
        <Lightbox 
          images={imagesToUse}
          currentIndex={activeImageIndex % (imagesToUse.length || 1)}
          onClose={() => setIsFullscreenOpen(false)}
          onPrev={() => {
            const len = imagesToUse.length;
            setActiveImageIndex(prev => (prev === 0 ? len - 1 : prev - 1));
          }}
          onNext={() => {
            const len = imagesToUse.length;
            setActiveImageIndex(prev => (prev === len - 1 ? 0 : prev + 1));
          }}
          getImageUrl={getPathUrl}
          onError={handleHeroImageError}
        />
      )}
    </QuickViewContext.Provider>
  );
};
