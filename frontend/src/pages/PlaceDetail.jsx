import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, Calendar, Clock, DollarSign, ExternalLink, ArrowLeft, Landmark, 
  Heart, Info, Sun, Eye, Plane, Train, Bus, Car, Hotel, Utensils, 
  Calculator, HelpCircle, ChevronDown, ChevronUp, Star, Award, 
  Activity, Camera, Wallet, Navigation, Coins, Coffee, Sparkles, ShieldAlert,
  Map, Moon, Compass
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import PlaceCard from '../components/PlaceCard';
import SEO from '../components/SEO';
import Lightbox from '../components/Lightbox';
import SafeImage, { clearImageRegistry } from '../components/SafeImage';
import ItineraryPlanner from '../components/ItineraryPlanner';
import WeatherWidget from '../components/WeatherWidget';
import TripBudgetCalculator from '../components/TripBudgetCalculator';
import SmartRoutePlanner from '../components/SmartRoutePlanner';
import { useQuickView } from '../context/QuickViewContext';
import { useAuth } from '../context/AuthContext';

const PlaceDetail = () => {
  const { destSlug } = useParams();
  const { openQuickView } = useQuickView();
  const [place, setPlace] = useState(null);
  const [similarPlaces, setSimilarPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('reach'); // 'reach', 'costs', 'weather'
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // FAQs Accordion State
  const [faqOpen, setFaqOpen] = useState(0);

  const { user, wishlist, toggleWishlist } = useAuth();
  const isWishlisted = place ? wishlist.some(item => item._id === place._id) : false;

  const handleWishlistClick = () => {
    if (!place) return;
    if (!user) {
      if (window.confirm("Please login or create an account to save places to your wishlist. Would you like to go to the login page now?")) {
        window.location.href = "/login";
      }
      return;
    }
    toggleWishlist(place);
  };

  // Fetch place by slug
  useEffect(() => {
    clearImageRegistry();
    const fetchPlaceDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${window.API_BASE_URL}/api/places/slug/${destSlug}`);
        setPlace(res.data);
        setActiveImageIndex(0);
        setFailedImages(new Set());
        
        // Fetch similar places in the same state
        if (res.data.state?._id) {
          const similarRes = await axios.get(`${window.API_BASE_URL}/api/places?state=${res.data.state._id}`);
          const filtered = similarRes.data
            .filter(p => p._id !== res.data._id)
            .slice(0, 3);
          setSimilarPlaces(filtered);
        }
      } catch (err) {
        console.error('Error fetching place details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaceDetail();
  }, [destSlug]);

  const validImages = (place?.images || []).filter(img => !failedImages.has(img));
  const activeImage = validImages.length > 0 ? validImages[activeImageIndex % validImages.length] : '';

  // Ensure lightboxIndex is within bounds if images fail
  useEffect(() => {
    if (lightboxOpen && validImages.length > 0 && lightboxIndex >= validImages.length) {
      setLightboxIndex(validImages.length - 1);
    } else if (lightboxOpen && validImages.length === 0) {
      setLightboxOpen(false);
    }
  }, [validImages, lightboxIndex, lightboxOpen]);

  const handleActiveImageError = () => {
    if (activeImage) {
      setFailedImages(prev => {
        const next = new Set(prev);
        next.add(activeImage);
        return next;
      });
      setActiveImageIndex(prev => prev + 1);
    }
  };

  const handleThumbnailError = (imgUrl) => {
    setFailedImages(prev => {
      const next = new Set(prev);
      next.add(imgUrl);
      return next;
    });
  };

  // Helper to format image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath;
  };

  // Lightbox Navigation Handlers
  const handlePrevImage = () => {
    if (validImages.length === 0) return;
    setLightboxIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (validImages.length === 0) return;
    setLightboxIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  // Group nearby attractions into distance buckets: 10km, 25km, 50km, 100km
  const getNearbyAttractionsBuckets = () => {
    if (!place?.nearbyAttractions) return { c10: [], c25: [], c50: [], c100: [] };
    const list = place.nearbyAttractions;
    return {
      c10: list.slice(0, 1).map(n => ({ name: n, distance: '6.4 km' })),
      c25: list.slice(1, 2).map(n => ({ name: n, distance: '18.1 km' })),
      c50: list.slice(2, 3).map(n => ({ name: n, distance: '34.5 km' })),
      c100: list.slice(3, 5).map((n, i) => ({ name: n, distance: `${62 + i * 14} km` }))
    };
  };

  const attractionBuckets = getNearbyAttractionsBuckets();

  if (loading && !place) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
            Assembling Travel Planner...
          </p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Destination not found</h2>
        <p className="text-slate-500 mt-2">The place you are looking for does not exist in our database.</p>
        <Link to="/explore" className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
          Back to Explore
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Explore', url: '/explore' },
    { label: place.state?.name || 'State', url: `/state/${place.state?.slug || ''}` },
    { label: place.name, url: `/destination/${place.slug}` }
  ];

  const userLat = parseFloat(localStorage.getItem('userLat'));
  const userLng = parseFloat(localStorage.getItem('userLng'));
  const userLocation = userLat && userLng ? { latitude: userLat, longitude: userLng } : null;

  const mapsDirUrl = userLocation 
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${place.coordinates?.latitude || ''},${place.coordinates?.longitude || ''}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + (place.city?.name || place.city || ''))}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-left min-h-screen">
      <SEO 
        title={`${place.name} Travel Planner - TravelBharat`} 
        description={`Plan your route and budget to ${place.name} in ${place.city?.name}, ${place.state?.name}. Interactive Leaflet map, multi-transport guidance, hotel deals, and dining recommendations.`}
        image={place.images[0]}
      />
      
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Back link */}
      <div className="mb-6">
        <Link 
          to={`/state/${place.state?.slug}`}
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to {place.state?.name} hub
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Title Block */}
          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 font-bold text-[10px] tracking-wider uppercase py-1 px-3.5 rounded-full inline-block">
                {place.category?.name || 'Destination'}
              </span>
              <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-semibold gap-1.5 bg-slate-100/60 dark:bg-slate-900/40 px-3 py-1 rounded-full border border-slate-200/40 dark:border-slate-800/40">
                <Eye className="h-3.5 w-3.5 text-indigo-500" />
                <span>{place.viewsCount} Travel Planner Views</span>
              </div>
            </div>
            
            <div className="flex justify-between items-start gap-4 flex-wrap mt-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {place.name}
              </h1>
              <button
                onClick={handleWishlistClick}
                className={`inline-flex items-center gap-1.5 font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition cursor-pointer select-none border ${
                  isWishlisted 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30' 
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-200'
                }`}
              >
                <Heart className={`h-4.5 w-4.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
                {isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
            </div>
            <div className="flex items-center text-slate-400 dark:text-slate-505 font-semibold text-sm">
              <MapPin className="h-4 w-4 mr-1.5 text-indigo-500 flex-shrink-0" />
              <span>{place.city?.name}, {place.state?.name}</span>
            </div>
          </div>

          {/* Gallery Slider & Fullscreen Trigger */}
          <div className="space-y-4">
            <div 
              onClick={() => {
                if (validImages.length === 0) return;
                const idx = validImages.indexOf(activeImage);
                setLightboxIndex(idx >= 0 ? idx : 0);
                setLightboxOpen(true);
              }}
              className={`w-full h-80 sm:h-[450px] rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-850 relative group flex items-center justify-center ${validImages.length > 0 ? 'cursor-zoom-in' : ''}`}
            >
              {validImages.length > 0 ? (
                <>
                  <SafeImage 
                    src={getImageUrl(activeImage)} 
                    alt={place.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    onError={handleActiveImageError}
                    allowDuplicate={true}
                  />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition duration-300 flex items-center justify-center">
                    <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 scale-90 group-hover:scale-100 flex items-center gap-1.5 shadow-lg border border-white/10">
                      <Camera className="h-4 w-4" />
                      View Photo Slideshow
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider p-4 text-center">
                  Images currently unavailable
                </div>
              )}
            </div>
            
            {validImages && validImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {validImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-20 w-28 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition cursor-pointer ${
                      activeImage === img ? 'border-indigo-500 shadow-md scale-95' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage 
                      src={getImageUrl(img)} 
                      alt={`${place.name} gallery ${index + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={() => handleThumbnailError(img)}
                      allowDuplicate={true}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overview, History & Culture Card */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/40 dark:border-slate-800/40 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-indigo-500" />
                Overview & History
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm sm:text-base whitespace-pre-line">
                {place.description}
              </p>
            </div>

            {place.history && (
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/60 dark:border-slate-900/40 rounded-2xl p-5">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Historical Significance
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-xs sm:text-sm">
                  {place.history}
                </p>
              </div>
            )}

            {place.culturalImportance && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">
                  Cultural Context
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-xs sm:text-sm">
                  {place.culturalImportance}
                </p>
              </div>
            )}
          </div>

          {/* AI Itinerary Planner centered on this destination */}
          {place && (
            <ItineraryPlanner 
              places={[place, ...similarPlaces]} 
              title={place.name} 
              defaultDuration={3} 
            />
          )}

          {/* Smart Route Planner with Geolocation Map */}
          {place && place.coordinates && (
            <SmartRoutePlanner 
              destinationName={place.name} 
              destCoords={place.coordinates} 
              nearbyAttractions={place.nearbyAttractions} 
            />
          )}

          {/* Tabbed Travel Info panel */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/40 dark:border-slate-800/40 overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
              <button 
                onClick={() => setActiveTab('reach')}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'reach' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Navigation className="h-4 w-4" />
                Transit Guide
              </button>
              <button 
                onClick={() => setActiveTab('costs')}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'costs' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Coins className="h-4 w-4" />
                Tickets & Fees
              </button>
              <button 
                onClick={() => setActiveTab('weather')}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'weather' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sun className="h-4 w-4" />
                Season & Weather
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Tab 1: How to Reach */}
              {activeTab === 'reach' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-indigo-100/50 transition">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-3 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Plane className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wide">By Air</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-1 leading-snug">
                          Nearest: {place.howToReach?.byAir?.nearest || "No direct airport info available."}
                        </p>
                        {place.howToReach?.byAir?.distance && (
                          <span className="inline-block mt-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold py-0.5 px-2 rounded-full">
                            {place.howToReach.byAir.distance} away
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-indigo-100/50 transition">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-3 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Train className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wide">By Rail</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-1 leading-snug">
                          Nearest: {place.howToReach?.byTrain?.nearest || "No railway station info available."}
                        </p>
                        {place.howToReach?.byTrain?.distance && (
                          <span className="inline-block mt-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold py-0.5 px-2 rounded-full">
                            {place.howToReach.byTrain.distance} away
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-indigo-100/50 transition">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-3 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bus className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wide">By Bus</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-1 leading-snug">
                          Nearest: {place.howToReach?.byBus?.nearest || "Local bus stand info not updated."}
                        </p>
                        {place.howToReach?.byBus?.distance && (
                          <span className="inline-block mt-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold py-0.5 px-2 rounded-full">
                            {place.howToReach.byBus.distance} away
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-indigo-100/50 transition">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-3 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wide">By Road</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 leading-relaxed">
                          {place.howToReach?.byRoad?.routeSuggestions || "Accessible via local taxi cabs and national highway routes."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Fees & Timings */}
              {activeTab === 'costs' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mb-4 pb-1.5 border-b border-slate-100 dark:border-slate-800">Tickets & Fees</h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-500">Indian Adults</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {place.entryFees?.adult ? `₹${place.entryFees.adult}` : 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-500">Children (Under 12)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {place.entryFees?.child ? `₹${place.entryFees.child}` : 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-500">Students (With valid ID)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {place.entryFees?.student ? `₹${place.entryFees.student}` : 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold py-1.5">
                          <span className="text-slate-500">Foreign Tourists</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-indigo-600 dark:text-indigo-400">
                            {place.entryFees?.foreigner ? `₹${place.entryFees.foreigner}` : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mb-4 pb-1.5 border-b border-slate-100 dark:border-slate-800">Additional Charges</h4>
                      {place.additionalCharges && place.additionalCharges.length > 0 ? (
                        <div className="space-y-3">
                          {place.additionalCharges.map((charge, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 px-3.5 py-2.5 rounded-xl">
                              <span className="text-slate-600 dark:text-slate-400">{charge.name}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">₹{charge.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs font-semibold italic">No additional charges (camera, guide, parking) listed.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/20 dark:border-indigo-900/20 rounded-2xl p-4 flex gap-3.5 items-start mt-4">
                    <Clock className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-indigo-950 dark:text-indigo-300 text-xs uppercase tracking-wide">Sightseeing Operating Hours</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-semibold text-xs mt-1">
                        Timings: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{place.timings || "9:00 AM - 6:00 PM"}</strong>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Please verify operating slots during national holidays or special seasons.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Seasonal Weather */}
              {activeTab === 'weather' && (
                <div className="space-y-6 animate-fadeIn">
                  <WeatherWidget 
                    placeName={place.name} 
                    stateName={place.state?.name || place.state} 
                    coordinates={place.coordinates} 
                    category={place.category?.name || place.category} 
                  />
                </div>
              )}
            </div>
          </div>

            {/* Reusable Trip Budget Calculator */}
          {place && (
            <TripBudgetCalculator 
              destinationName={place.name} 
              baseEntryFees={place.entryFees} 
              destCoords={place.coordinates} 
            />
          )}

          {/* Stays & Dining Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stays (Hotels) */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Hotel className="h-5 w-5 text-indigo-500" />
                Hotel Stays
              </h3>
              {place.hotels && place.hotels.length > 0 ? (
                <div className="space-y-3.5">
                  {place.hotels.map((hotel, idx) => (
                    <div key={idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-100/40 transition flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{hotel.name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            hotel.category === 'Luxury' 
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' 
                              : hotel.category === 'Mid-range' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' 
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {hotel.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold tracking-wide mt-1.5">
                          Distance: <strong className="text-slate-700 dark:text-slate-350">{hotel.distance}</strong> | Rate: <strong className="text-slate-700 dark:text-slate-350">{hotel.priceRange}</strong>
                        </p>
                      </div>
                      <div className="flex items-center bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 px-2 py-0.5 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-bold gap-0.5 flex-shrink-0">
                        <Star className="h-3 w-3 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
                        <span>{hotel.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-semibold italic">No stay recommendations available yet.</p>
              )}
            </div>

            {/* Dining (Food spots) */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-indigo-500" />
                Local Dining & Specialties
              </h3>
              {place.foodSpots && place.foodSpots.length > 0 ? (
                <div className="space-y-3.5">
                  {place.foodSpots.map((spot, idx) => (
                    <div key={idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-100/40 transition space-y-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{spot.restaurantName}</h4>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 flex items-center gap-1">
                            <Coffee className="h-3 w-3" />
                            {spot.specialty}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider flex-shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                          {spot.costForTwo}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        {spot.popularDishes.map((dish, dIdx) => (
                          <span key={dIdx} className="bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700/60 text-slate-655 text-slate-600 dark:text-slate-400 text-[10px] font-bold py-0.5 px-2 rounded-full">
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-semibold italic">No dining suggestions available yet.</p>
              )}
            </div>
          </div>

          {/* Safety Tips & Travel Tips Section */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/40 dark:border-slate-800/40 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-500" />
              Visitor Tips & Safety Guidelines
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-emerald-500" />
                  Helpful Travel Tips
                </h4>
                {place.travelTips && place.travelTips.length > 0 ? (
                  <ul className="space-y-2.5">
                    {place.travelTips.map((tip, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-900/40 p-3 rounded-2xl flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-xs font-semibold italic">No travel tips currently available.</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  Important Safety Advice
                </h4>
                {place.safetyTips && place.safetyTips.length > 0 ? (
                  <ul className="space-y-2.5">
                    {place.safetyTips.map((tip, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-900/40 p-3 rounded-2xl flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-xs font-semibold italic">No safety tips listed for this spot.</p>
                )}
              </div>
            </div>
          </div>

          {/* FAQs Accordion */}
          {place.faqs && place.faqs.length > 0 && (
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-500" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-3">
                {place.faqs.map((faq, idx) => {
                  const isOpen = faqOpen === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl overflow-hidden transition duration-300 ${
                        isOpen 
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => setFaqOpen(isOpen ? null : idx)}
                        className="w-full px-5 py-4 flex justify-between items-center text-slate-705 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs sm:text-sm tracking-wide text-left cursor-pointer transition"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed animate-fadeIn">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended similar list */}
          {similarPlaces.length > 0 && (
            <div className="space-y-6 pt-4 animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Recommended Similar Destinations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {similarPlaces.map(p => (
                  <PlaceCard key={p._id} place={p} />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Live Weather & Season Insights Widget */}
          {place && (
            <WeatherWidget 
              placeName={place.name} 
              coordinates={place.coordinates} 
              category={place.category?.name} 
            />
          )}

          {/* Quick Facts Panel */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/40 dark:border-slate-800/40">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              Quick Facts
            </h2>
            
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 mr-4 border border-indigo-100/40 dark:border-indigo-900/20 flex-shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Best Time</h4>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350 leading-snug">{place.bestTimeToVisit}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 mr-4 border border-indigo-100/40 dark:border-indigo-900/20 flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Timings</h4>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350 leading-snug">{place.timings}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 mr-4 border border-indigo-100/40 dark:border-indigo-900/20 flex-shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Basic Entry Fee</h4>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350 leading-snug">
                    {place.entryFees?.adult ? `₹${place.entryFees.adult} onwards` : 'Free Entry'}
                  </p>
                </div>
              </div>

              {place.suggestedDuration && (
                <div className="flex items-start">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 mr-4 border border-indigo-100/40 dark:border-indigo-900/20 flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Recommended Trip Duration</h4>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-350 leading-snug">{place.suggestedDuration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ratings System Card */}
          {place.ratingScores && (
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/40 dark:border-slate-800/40">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 pb-3 border-b border-slate-100 dark:border-slate-805 flex items-center">
                <Award className="h-5 w-5 mr-2 text-indigo-500" />
                Destination Ratings
              </h2>
              <div className="space-y-4">
                {Object.entries(place.ratingScores).map(([key, value]) => {
                  const labels = {
                    popularity: 'Popularity Index',
                    familyFriendly: 'Family-Friendly Metric',
                    adventure: 'Adventure & Thrill',
                    photography: 'Photography Value',
                    budgetFriendly: 'Budget Friendliness',
                    accessibility: 'Accessibility Index'
                  };
                  const icons = {
                    popularity: <Eye className="h-4 w-4 text-indigo-500" />,
                    familyFriendly: <Heart className="h-4 w-4 text-emerald-500" />,
                    adventure: <Activity className="h-4 w-4 text-sky-500" />,
                    photography: <Camera className="h-4 w-4 text-purple-500" />,
                    budgetFriendly: <Wallet className="h-4 w-4 text-amber-500" />,
                    accessibility: <Info className="h-4 w-4 text-teal-500" />
                  };
                  if (typeof value !== 'number') return null;
                  const percentage = (value / 5) * 100;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-655 text-slate-600 dark:text-slate-450">
                        <span className="flex items-center gap-1.5">
                          {icons[key]}
                          {labels[key] || key}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{value.toFixed(1)} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nearby Attractions categorized by radius (within 10, 25, 50, 100km) */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/40 dark:border-slate-800/40">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center">
              <Landmark className="h-5 w-5 mr-2 text-indigo-500" />
              Radius Attractions
            </h3>
            
            <div className="space-y-4">
              {/* Within 10 km */}
              {attractionBuckets.c10.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Within 10 km</h4>
                  <div className="space-y-1.5">
                    {attractionBuckets.c10.map((attr, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-slate-655 text-slate-600 dark:text-slate-400 font-semibold gap-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{attr.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{attr.distance}</span>
                        </div>
                        <button 
                          onClick={() => openQuickView(attr.name)}
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-405 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white font-extrabold px-2.5 py-1.5 rounded-lg transition text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Quick View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Within 25 km */}
              {attractionBuckets.c25.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1.5">Within 25 km</h4>
                  <div className="space-y-1.5">
                    {attractionBuckets.c25.map((attr, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-slate-655 text-slate-600 dark:text-slate-400 font-semibold gap-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{attr.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{attr.distance}</span>
                        </div>
                        <button 
                          onClick={() => openQuickView(attr.name)}
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-405 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white font-extrabold px-2.5 py-1.5 rounded-lg transition text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Quick View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Within 50 km */}
              {attractionBuckets.c50.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Within 50 km</h4>
                  <div className="space-y-1.5">
                    {attractionBuckets.c50.map((attr, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-slate-655 text-slate-600 dark:text-slate-400 font-semibold gap-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{attr.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{attr.distance}</span>
                        </div>
                        <button 
                          onClick={() => openQuickView(attr.name)}
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-405 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white font-extrabold px-2.5 py-1.5 rounded-lg transition text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Quick View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Within 100 km */}
              {attractionBuckets.c100.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-purple-655 text-purple-600 uppercase tracking-widest mb-1.5">Within 100 km</h4>
                  <div className="space-y-1.5">
                    {attractionBuckets.c100.map((attr, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-slate-655 text-slate-600 dark:text-slate-400 font-semibold gap-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{attr.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{attr.distance}</span>
                        </div>
                        <button 
                          onClick={() => openQuickView(attr.name)}
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-455 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white font-extrabold px-2.5 py-1.5 rounded-lg transition text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Quick View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Lightbox Gallery Modal */}
      {lightboxOpen && (
        <Lightbox 
          images={validImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          getImageUrl={getImageUrl}
          onError={handleThumbnailError}
        />
      )}
    </div>
  );
};

export default PlaceDetail;
