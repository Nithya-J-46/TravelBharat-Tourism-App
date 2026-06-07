import { useState } from 'react';
import { MapPin, Star, Calendar, ArrowRight, Heart } from 'lucide-react';
import SafeImage from './SafeImage';
import { useQuickView } from '../context/QuickViewContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';

const PlaceCard = ({ place }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const { openQuickView } = useQuickView();
  const { toggleCompare, isComparing } = useCompare();
  const { user, wishlist, toggleWishlist } = useAuth();

  const isAddedToCompare = isComparing(place._id);
  const isWishlisted = wishlist.some(item => item._id === place._id);

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (!user) {
      if (window.confirm("Please login or create an account to save places to your wishlist. Would you like to go to the login page now?")) {
        window.location.href = "/login";
      }
      return;
    }
    toggleWishlist(place);
  };

  const getImageUrl = (index) => {
    if (!place.images || place.images.length === 0) return '';
    const path = place.images[index % place.images.length];
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const handleImageError = () => {
    if (place.images && imageIndex < place.images.length - 1) {
      setImageIndex(prev => prev + 1);
    }
  };

  const stateName = place.state?.name || place.state || '';
  const cityName = place.city?.name || place.city || '';
  const categoryName = place.category?.name || place.category || 'Destination';
  
  const ratingValue = place.ratingScores?.popularity 
    ? place.ratingScores.popularity.toFixed(1) 
    : '4.5';

  const targetUrl = place.slug ? `/destination/${place.slug}` : `/place/${place._id}`;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative">
      
      {/* Image Container with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        {place.images && place.images.length > 0 ? (
          <SafeImage 
            src={getImageUrl(imageIndex)} 
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={handleImageError}
          />
        ) : (
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider p-4 text-center">
            Images currently unavailable
          </div>
        )}
        
        {/* Category Overlay */}
        <div className="absolute top-4 right-4 bg-indigo-600/90 dark:bg-indigo-700/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
          {categoryName}
        </div>

        {/* Rating Overlay */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-md border border-white/10 flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-450" />
          <span>{ratingValue} / 5.0</span>
        </div>

        {/* Floating Heart Toggle Overlay */}
        <button
          onClick={handleWishlistClick}
          className="absolute bottom-4 right-4 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-md border border-white/20 hover:scale-110 active:scale-95 transition cursor-pointer"
          aria-label="Toggle Wishlist"
        >
          <Heart className={`h-4.5 w-4.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-650 dark:text-slate-300'}`} />
        </button>
      </div>

      {/* Details Section */}
      <div className="p-5 flex flex-col flex-grow text-left">
        <h3 className="text-base sm:text-lg font-bold text-slate-805 dark:text-slate-100 mb-1.5 truncate group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
          {place.name}
        </h3>
        
        {/* City & State */}
        <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-semibold mb-3">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{cityName}{stateName ? `, ${stateName}` : ''}</span>
        </div>

        {/* Best Time to Visit Badge */}
        {place.bestTimeToVisit && (
          <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10 w-fit mb-3.5">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            Best time: {place.bestTimeToVisit}
          </div>
        )}

        {/* Description */}
        <p className="text-slate-505 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-5 flex-grow font-medium">
          {place.description}
        </p>

        {/* Action Button Row: Quick View + Compare */}
        <div className="flex gap-2.5 mt-auto">
          <button 
            onClick={() => openQuickView(place)}
            className="flex-1 text-center bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 border border-indigo-100/40 dark:border-indigo-900/30 hover:border-indigo-600 dark:hover:border-indigo-500 text-[10px] sm:text-xs tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
          >
            Quick View
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(place);
            }}
            className={`flex-1 text-center font-bold py-2.5 rounded-xl transition-all duration-300 text-[10px] sm:text-xs tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer border ${
              isAddedToCompare 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-705 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-250'
            }`}
          >
            {isAddedToCompare ? '✓ Compared' : '+ Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
