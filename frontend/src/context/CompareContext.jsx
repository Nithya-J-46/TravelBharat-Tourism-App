import { createContext, useContext, useState, useEffect } from 'react';
import { 
  X, Star, Calendar, Clock, Coins, Compass, 
  Trash2, Info, Award, ShieldAlert, Activity, User, Heart, Accessibility
} from 'lucide-react';
import SafeImage from '../components/SafeImage';
import { mapPlaceToComparisonSchema } from '../data/comparisonDataset';

const CompareContext = createContext(null);

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [comparePlaces, setComparePlaces] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const toggleCompare = (place) => {
    if (!place) return;
    
    const index = comparePlaces.findIndex(item => item._id === place._id);
    if (index > -1) {
      setComparePlaces(prev => prev.filter(item => item._id !== place._id));
      triggerToast(`Removed "${place.name}" from comparison.`);
    } else {
      if (comparePlaces.length >= 3) {
        triggerToast('You can compare a maximum of 3 destinations at once.');
        return;
      }
      setComparePlaces(prev => [...prev, place]);
      triggerToast(`Added "${place.name}" to comparison.`);
    }
  };

  const clearCompare = () => {
    setComparePlaces([]);
    setIsCompareOpen(false);
    triggerToast('Cleared all compared destinations.');
  };

  const isComparing = (placeId) => {
    return comparePlaces.some(item => item._id === placeId);
  };

  // Keyboard Escape controls to close comparison modal
  useEffect(() => {
    if (!isCompareOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCompareOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareOpen]);

  // Helper to compile place image URL
  const getPlaceImageUrl = (place) => {
    if (!place || !place.images || place.images.length === 0) return '';
    const img = place.images[0];
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${window.API_BASE_URL}${img}`;
  };

  // Map compared places to standard dynamic schemas
  const mappedPlaces = comparePlaces.map(mapPlaceToComparisonSchema);

  // Dynamic comparison insights builder
  const getComparisonInsights = (places) => {
    if (places.length < 2) return null;

    const getNumericFee = (feeStr) => {
      if (!feeStr || feeStr.toLowerCase().includes('free')) return 0;
      const m = feeStr.match(/\d+/);
      return m ? parseInt(m[0]) : 500;
    };

    // 1. Best Budget
    let bestBudget = places[0];
    let minFee = getNumericFee(bestBudget.entryFee);
    for (let i = 1; i < places.length; i++) {
      const feeVal = getNumericFee(places[i].entryFee);
      if (feeVal < minFee || (feeVal === minFee && places[i].budgetLevel === 'Low' && bestBudget.budgetLevel !== 'Low')) {
        bestBudget = places[i];
        minFee = feeVal;
      }
    }

    // 2. Best Family
    let bestFamily = places[0];
    for (let i = 1; i < places.length; i++) {
      if (places[i].familyFriendly > bestFamily.familyFriendly) {
        bestFamily = places[i];
      }
    }

    // 3. Best for Photography (using rating)
    let bestPhoto = places[0];
    for (let i = 1; i < places.length; i++) {
      if (places[i].rating > bestPhoto.rating) {
        bestPhoto = places[i];
      }
    }

    // 4. Best for Adventure
    let bestAdventure = places[0];
    for (let i = 1; i < places.length; i++) {
      if (places[i].adventure > bestAdventure.adventure) {
        bestAdventure = places[i];
      }
    }

    // 5. Least Crowded
    const crowdScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
    let leastCrowded = places[0];
    for (let i = 1; i < places.length; i++) {
      const scoreCurrent = crowdScores[places[i].crowdLevel] || 2;
      const scoreBest = crowdScores[leastCrowded.crowdLevel] || 2;
      if (scoreCurrent < scoreBest) {
        leastCrowded = places[i];
      }
    }

    // 6. Highest Rated
    let highestRated = places[0];
    for (let i = 1; i < places.length; i++) {
      if (places[i].rating > highestRated.rating) {
        highestRated = places[i];
      }
    }

    return {
      bestBudget: bestBudget.name,
      bestFamily: bestFamily.name,
      bestPhoto: bestPhoto.name,
      bestAdventure: bestAdventure.name,
      leastCrowded: leastCrowded.name,
      highestRated: highestRated.name
    };
  };

  const insights = getComparisonInsights(mappedPlaces);

  // Render score stars helper
  const renderScoreRating = (score) => {
    const val = score || 4.0;
    return (
      <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 dark:text-slate-350">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 flex-shrink-0" />
        <span>{val.toFixed(1)} / 5.0</span>
      </div>
    );
  };

  return (
    <CompareContext.Provider value={{ comparePlaces, isComparing, toggleCompare, clearCompare, isCompareOpen, setIsCompareOpen }}>
      {children}

      {/* Floating comparison toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 py-2.5 px-6 rounded-2xl text-xs font-bold shadow-2xl border border-white/10 dark:border-slate-200/20 z-50 flex items-center gap-2 animate-bounce-subtle">
          <Info className="h-4.5 w-4.5 text-indigo-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Bottom Compare Bar (drawer) */}
      {comparePlaces.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-slate-900/95 dark:bg-slate-955/95 text-white p-3.5 rounded-3xl border border-slate-700/50 shadow-2xl flex items-center justify-between gap-4 animate-slideUp backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex -space-x-3.5 overflow-hidden">
              {comparePlaces.map((place) => (
                <div key={place._id} className="relative w-11 h-9 rounded-lg border border-slate-700 overflow-hidden flex-shrink-0 bg-slate-800">
                  <SafeImage 
                    src={getPlaceImageUrl(place)} 
                    alt={place.name} 
                    className="w-full h-full object-cover"
                    allowDuplicate={true}
                  />
                  <button 
                    onClick={() => toggleCompare(place)}
                    className="absolute -top-1 -right-1 bg-red-655 bg-red-600 rounded-full p-0.5 border border-slate-900 text-white cursor-pointer hover:bg-red-750"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div>
              <p className="text-xs font-extrabold">{comparePlaces.length} of 3 Selected</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Compare destinations parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold">
            <button
              onClick={clearCompare}
              className="text-slate-400 hover:text-slate-200 cursor-pointer transition py-2 px-3 rounded-xl hover:bg-white/5"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-indigo-650 hover:bg-indigo-750 text-white py-2 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Comparison Modal Table Overlay */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 bg-slate-955/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn print:hidden">
          <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh] md:max-h-[85vh] animate-scaleIn">
            
            {/* Close Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-605 text-indigo-550 dark:text-indigo-400 border border-indigo-100/20 dark:border-indigo-900/20">
                  <Award className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-855 dark:text-slate-100">Compare Destinations</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Explore parameters side-by-side to pick your perfect match.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCompareOpen(false)}
                className="text-slate-450 hover:text-slate-655 dark:hover:text-white transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Table Body Scroll container */}
            <div className="flex-grow p-6 overflow-y-auto no-scrollbar">
              
              {/* Dynamic Comparison Insights Grid */}
              {insights && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150/40 dark:border-indigo-900/40 rounded-2xl p-4.5 mb-6 animate-fadeIn">
                  <h3 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Compass className="h-4 w-4" />
                    Smart Match Insights
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">💰 Best Budget Option</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.bestBudget}</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">👨‍👩‍👧 Best Family Destination</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.bestFamily}</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">📸 Best for Photography</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.bestPhoto}</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">🏃 Best for Adventure</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.bestAdventure}</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">👥 Least Crowded</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.leastCrowded}</strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <span className="text-slate-400 block mb-0.5">🏆 Highest Rated</span>
                      <strong className="text-slate-800 dark:text-slate-205">{insights.highestRated}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="min-w-[700px] w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {/* Left parameter spacing corner */}
                      <th className="w-[22%] p-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950/20 rounded-tl-2xl">
                        Compared Factors
                      </th>
                      
                      {/* Place card columns */}
                      {mappedPlaces.map((place) => (
                        <th key={place._id} className="p-4 w-[26%] relative bg-slate-50/50 dark:bg-slate-950/20 text-left border-l border-slate-150 dark:border-slate-850">
                          
                          {/* Close/Remove Column button */}
                          <button
                            onClick={() => toggleCompare(place)}
                            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Remove from comparison"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="space-y-3 pr-4">
                            <div className="h-24 w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                              <SafeImage 
                                src={getPlaceImageUrl(place)} 
                                alt={place.name} 
                                className="w-full h-full object-cover"
                                allowDuplicate={true}
                              />
                            </div>
                            <div>
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/20 dark:border-indigo-900/20 text-indigo-650 dark:text-indigo-400 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                                {place.category}
                              </span>
                              <h4 className="font-extrabold text-slate-805 dark:text-slate-100 text-sm mt-1 truncate max-w-[170px]" title={place.name}>
                                {place.name}
                              </h4>
                            </div>
                          </div>
                        </th>
                      ))}
                      
                      {/* Empty column slots to fit 3 */}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <th key={i} className="p-4 w-[26%] bg-slate-50/20 dark:bg-slate-950/5 border-l border-slate-150 dark:border-slate-850 text-center last:rounded-tr-2xl">
                          <div className="h-40 flex flex-col justify-center items-center text-slate-300 dark:text-slate-750">
                            <Compass className="h-8 w-8 animate-pulse mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Empty Slot</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {/* 1. Location */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        📍 Location
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-150 dark:border-slate-850">
                          {place.location}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 2. Category */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🏷 Category
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-150 dark:border-slate-850">
                          {place.category}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 3. Budget Level */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        💰 Budget Level
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-extrabold text-slate-800 dark:text-slate-200 border-l border-slate-150 dark:border-slate-850">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            place.budgetLevel === 'Low' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100/30' 
                              : place.budgetLevel === 'Medium' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100/30' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100/30'
                          }`}>
                            {place.budgetLevel} Cost
                          </span>
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 4. Entry Fee */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🎫 Entry Fee
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-150 dark:border-slate-850">
                          {place.entryFee}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 5. visitDuration */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        ⏱ Recommended Duration
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-705 dark:text-slate-300 border-l border-slate-150 dark:border-slate-850">
                          {place.visitDuration}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 6. Best Season */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🌦 Best Season
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-705 dark:text-slate-300 border-l border-slate-150 dark:border-slate-850">
                          {place.bestTime}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 7. User Rating */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        ⭐ User Rating
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 border-l border-slate-150 dark:border-slate-850">
                          {renderScoreRating(place.rating)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 8. Family Friendly */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        👨‍👩‍👧 Family Friendly
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 border-l border-slate-150 dark:border-slate-850">
                          {renderScoreRating(place.familyFriendly)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 9. Solo Traveler Friendly */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🎒 Solo Friendly
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 border-l border-slate-150 dark:border-slate-850">
                          {renderScoreRating(place.soloTraveler)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 10. Honeymoon Friendly */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        ❤️ Honeymoon Friendly
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 border-l border-slate-150 dark:border-slate-850">
                          {renderScoreRating(place.honeymoon)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 11. Adventure Score */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🏃 Adventure Score
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 border-l border-slate-150 dark:border-slate-850">
                          {renderScoreRating(place.adventure)}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 12. Accessibility */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🚗 Accessibility
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-semibold text-slate-655 dark:text-slate-400 border-l border-slate-150 dark:border-slate-850 leading-relaxed">
                          {place.accessibility}
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 13. Popularity */}
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide">
                        🔥 Popularity Score
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-extrabold text-slate-800 dark:text-slate-200 border-l border-slate-150 dark:border-slate-850">
                          <span className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-lg">
                            {place.popularityScore} Match
                          </span>
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850">--</td>
                      ))}
                    </tr>

                    {/* 14. Crowd Level */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="p-4 text-xs font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wide rounded-bl-2xl">
                        👥 Crowd Level
                      </td>
                      {mappedPlaces.map(place => (
                        <td key={place._id} className="p-4 text-xs font-bold text-slate-800 dark:text-slate-205 border-l border-slate-150 dark:border-slate-850">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            place.crowdLevel === 'Low' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100/30' 
                              : place.crowdLevel === 'Medium' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100/30' 
                              : 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-100/30'
                          }`}>
                            {place.crowdLevel}
                          </span>
                        </td>
                      ))}
                      {Array.from({ length: 3 - mappedPlaces.length }).map((_, i) => (
                        <td key={i} className="p-4 text-slate-400 border-l border-slate-150 dark:border-slate-850 last:rounded-br-2xl">--</td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3 flex-shrink-0 bg-slate-50/50 dark:bg-slate-955/20">
              <button
                onClick={() => setIsCompareOpen(false)}
                className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </CompareContext.Provider>
  );
};
