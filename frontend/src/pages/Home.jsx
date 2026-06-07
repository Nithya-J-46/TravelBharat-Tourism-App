import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, Compass, ShieldCheck, Landmark, ArrowRight, Star, Heart, Navigation, Calendar, Sparkles, Loader2 } from 'lucide-react';
import IndiaMap from '../components/IndiaMap';
import PlaceCard from '../components/PlaceCard';
import SEO from '../components/SEO';
import LocationDetector from '../components/LocationDetector';
import { clearImageRegistry } from '../components/SafeImage';
import ErrorBoundary from '../components/ErrorBoundary';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [states, setStates] = useState([]);
  
  // Recommendation collections
  const [trendingPlaces, setTrendingPlaces] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [heritagePlaces, setHeritagePlaces] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const suggestionRef = useRef(null);

  useEffect(() => {
    clearImageRegistry();
    const loadData = async () => {
      try {
        const [statesRes, trendingRes, gemsRes, weekendRes, allPlacesRes] = await Promise.all([
          axios.get(`${window.API_BASE_URL}/api/states`),
          axios.get(`${window.API_BASE_URL}/api/places?recommendationType=trending`),
          axios.get(`${window.API_BASE_URL}/api/places?recommendationType=hidden-gems`),
          axios.get(`${window.API_BASE_URL}/api/places?recommendationType=weekend`),
          axios.get(`${window.API_BASE_URL}/api/places`)
        ]);

        setStates(statesRes.data);
        setTrendingPlaces(trendingRes.data.slice(0, 8));
        setHiddenGems(gemsRes.data.slice(0, 8));
        setWeekendGetaways(weekendRes.data.slice(0, 8));
        
        // Filter heritage places
        const heritage = allPlacesRes.data.filter(p => p.category?.name === 'Heritage');
        setHeritagePlaces(heritage.slice(0, 8));
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Close suggestions on outside click
    const handleClickOutside = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestions Autocomplete Fetcher
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setSearchLoading(true);
      try {
        const catParam = searchCategory !== 'All' ? `&category=${encodeURIComponent(searchCategory)}` : '';
        const res = await axios.get(`${window.API_BASE_URL}/api/places/suggestions?q=${encodeURIComponent(searchQuery)}${catParam}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchCategory]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      let path = `/explore?search=${encodeURIComponent(searchQuery)}`;
      if (searchCategory !== 'All') {
        path += `&category=${encodeURIComponent(searchCategory)}`;
      }
      navigate(path);
    }
  };

  const handleSuggestionClick = (sug) => {
    setSearchQuery(sug.text);
    setShowSuggestions(false);
    if (sug.path) {
      navigate(sug.path);
    }
  };

  const handleChipClick = (chipName) => {
    setSearchQuery(chipName);
    setShowSuggestions(true);
    const searchInput = document.getElementById('main-search-input');
    if (searchInput) searchInput.focus();
  };

  const handleExploreNearby = () => {
    const city = localStorage.getItem('userCity');
    if (city) {
      navigate(`/explore?search=${encodeURIComponent(city)}`);
    } else {
      alert('Please detect your location first using the Location Detector below.');
    }
  };

  const searchCategories = [
    { id: 'All', label: 'All Destinations' },
    { id: 'States', label: 'States' },
    { id: 'Cities', label: 'Cities' },
    { id: 'Heritage', label: 'Heritage Sites' },
    { id: 'Beaches', label: 'Beaches' },
    { id: 'Hill Stations', label: 'Hill Stations' },
    { id: 'Temples', label: 'Temples' },
    { id: 'Wildlife', label: 'Wildlife' }
  ];

  const getPlaceholderText = () => {
    switch (searchCategory) {
      case 'States': return 'Explore states and union territories (e.g. Kerala, Goa)...';
      case 'Cities': return 'Search for historical & modern cities (e.g. Jaipur, Ooty)...';
      case 'Heritage': return 'Find UNESCO world heritage sites & forts (e.g. Hampi, Taj)...';
      case 'Beaches': return 'Find sun-soaked shores & coastal escapes (e.g. Radhanagar, Varkala)...';
      case 'Hill Stations': return 'Search for misty mountains & viewpoints (e.g. Munnar, Manali)...';
      case 'Temples': return 'Explore holy temples, shrines & spiritual hubs (e.g. Kedarnath)...';
      case 'Wildlife': return 'Find national parks, reserves & safaris (e.g. Jim Corbett)...';
      default: return 'Search destinations, states, or styles (e.g. Kashmir, temples)...';
    }
  };

  const CarouselRow = ({ title, subtitle, items, icon }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4 py-8 border-b border-slate-100 last:border-0">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {icon}
              {title}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
            See All <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x scroll-smooth">
          {items.map(item => (
            <div key={item._id} className="w-[280px] sm:w-[300px] flex-shrink-0 snap-start">
              <PlaceCard place={item} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <SEO 
        title="Discover the Soul of India" 
        description="Comprehensive Indian tourism web portal. Explore 36 states and union territories, over 1000+ handpicked heritage, nature, spiritual, and adventure places."
      />
      
      {/* Hero Section */}
      <div 
        className="relative min-h-[720px] flex items-center justify-center bg-cover bg-center py-16"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=2000")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-900/50 to-slate-50"></div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-4xl space-y-7">
          <span className="bg-emerald-500/90 text-white font-extrabold text-[10px] tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md inline-block">
            Incredible India State by State
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-none drop-shadow-md">
            Discover the <span className="text-sky-305">Soul</span> of India
          </h1>
          
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-medium drop-shadow leading-relaxed">
            Navigate through majestic forts, spiritual retreats, scenic backwaters, and pristine snow peaks across all 36 States & UTs.
          </p>

          <div ref={suggestionRef} className="relative w-full max-w-3xl mx-auto mt-8 text-left">
            {/* Category Tabs */}
            <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2.5 mb-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar gap-1.5 sm:gap-2">
              {searchCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSearchCategory(cat.id);
                    setSuggestions([]);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                    searchCategory === cat.id
                      ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100/10'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Premium Glassmorphic Search Bar */}
            <div className="relative bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-[28px] p-3 sm:p-4 shadow-2xl shadow-indigo-950/20 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all duration-300">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-grow flex items-center pl-3 w-full">
                  <Search className={`h-5 w-5 text-sky-305 flex-shrink-0 transition-transform duration-300 ${searchQuery ? 'scale-110' : ''}`} />
                  <input 
                    id="main-search-input"
                    type="text" 
                    placeholder={getPlaceholderText()}
                    className="w-full py-3 px-3 text-white focus:outline-none placeholder-slate-300 font-bold text-sm sm:text-base bg-transparent border-0 ring-0 outline-none"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {searchLoading && (
                    <Loader2 className="h-4.5 w-4.5 text-sky-305 animate-spin mr-2 flex-shrink-0" />
                  )}
                </div>
                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-3 px-8 rounded-2xl transition-all duration-300 shadow-md cursor-pointer hover:shadow-indigo-500/25 text-sm sm:text-base flex-shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span>Search</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Rich Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-[24px] border border-slate-100 dark:border-slate-850/80 shadow-2xl overflow-hidden z-40 text-left animate-fadeIn py-2.5 max-h-[350px] overflow-y-auto no-scrollbar">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition flex items-center justify-between border-b border-slate-50 dark:border-slate-900 last:border-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        {sug.thumbnail ? (
                          <img
                            src={sug.thumbnail}
                            alt={sug.text}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/35 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <MapPin className="h-5 w-5" />
                          </div>
                        )}
                        
                        <div>
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 block leading-tight">{sug.text}</span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide mt-0.5 block">
                            {sug.stateName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[9px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md">
                          {sug.categoryName || sug.type}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px]">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{sug.rating ? sug.rating.toFixed(1) : '4.5'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto px-2">
              <span className="text-xs font-bold text-slate-200 mr-1 select-none">Quick Links:</span>
              {['Kashmir', 'Goa', 'Kerala', 'Tamil Nadu', 'Rajasthan', 'Ladakh', 'Andaman', 'Ooty'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/15 hover:border-white/20 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleExploreNearby}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition duration-300 cursor-pointer"
              >
                <Navigation className="h-4 w-4 text-sky-305" />
                <span>Explore Nearby</span>
              </button>
              
              <Link
                to="/explore?planner=true"
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition duration-300 cursor-pointer text-center"
              >
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <span>AI Trip Planner</span>
              </Link>
            </div>
          </div>

          {/* Location Detector */}
          <div className="mt-4 flex justify-center">
            <LocationDetector />
          </div>
        </div>
      </div>

      {/* Trending Searches Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-2 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Trending Destinations', desc: 'Most popular in June', count: '10K+ searches', path: '/explore?filter=trending', icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
            { title: 'Most Saved Places', desc: 'Loved by travelers', count: '8K+ saves', path: '/explore?filter=popular', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
            { title: 'Weekend Getaways', desc: 'Perfect short escapes', count: '5K+ plans', path: '/explore?filter=weekend', icon: Compass, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
            { title: 'Hidden Gems', desc: 'Serene offbeat tracks', count: '3K+ visits', path: '/explore?filter=hidden-gems', icon: Landmark, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' }
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 text-left shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-300 group flex items-start gap-3.5 cursor-pointer"
              >
                <div className={`p-2.5 rounded-xl ${item.color} flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <ItemIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-none">{item.desc}</p>
                  <span className="inline-block text-[8px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md mt-2">
                    {item.count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Interactive Map of India Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-12 border border-white/40 dark:border-slate-800/40 space-y-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-full inline-block">
              Interactive Explorer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-105 tracking-tight leading-tight">
              Explore India Geographically
            </h2>
            <p className="text-slate-500 dark:text-slate-405 font-semibold leading-relaxed text-sm sm:text-base">
              India is a land of unmatched geographical variety. Use our interactive travel hub to explore all 36 States & UTs. Filter by styles, search key attractions, or use your location to calculate distance and transit plans.
            </p>
          </div>
          
          <div className="w-full">
            <ErrorBoundary fallbackMessage="Unable to load India Map Explorer">
              <IndiaMap />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* Explore India by State */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Explore State Profiles</h2>
          <p className="text-slate-400 font-semibold mt-2 text-sm">Discover regional capitals, facts, and travel insights.</p>
        </div>

        <ErrorBoundary fallbackMessage="Unable to load State Profiles">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {states.slice(0, 9).map(state => (
                <div 
                  key={state._id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-slate-200/50 dark:border-slate-800/50 flex flex-col group"
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url("${state.bannerImage}")` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-indigo-650/90 text-white font-extrabold text-[9px] tracking-wider uppercase py-1.5 px-3 rounded-lg backdrop-blur-xs">
                      Capital: {state.capital}
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-extrabold tracking-tight drop-shadow-sm">{state.name}</h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4 text-left">
                    
                    {/* Famous For */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Famous For</span>
                      <p className="text-xs text-slate-650 dark:text-slate-350 font-semibold line-clamp-2 leading-relaxed">
                        {state.famousFor || state.description}
                      </p>
                    </div>

                    {/* Best Time & Categories */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Best Time</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          {state.bestTimeToVisit || 'Oct - Mar'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Categories</span>
                        <div className="flex flex-wrap gap-1">
                          {state.topCategories?.slice(0, 2).map((cat, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                              {cat}
                            </span>
                          )) || (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                              Heritage
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Must Visit Destinations */}
                    {state.mustVisitDestinations && state.mustVisitDestinations.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Must Visit</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                          {state.mustVisitDestinations.join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Estimated Budgets */}
                    {state.estimatedBudget && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Est. Budget (Per Day)</span>
                        <div className="grid grid-cols-3 gap-1.5 text-[9px] text-center">
                          <div className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                            <span className="block text-[7px] font-bold text-slate-400 dark:text-slate-500">Budget</span>
                            <span className="font-extrabold text-slate-705 dark:text-slate-350">{state.estimatedBudget.budget?.split(' ')[0] || '₹1,500'}</span>
                          </div>
                          <div className="p-1 rounded bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30">
                            <span className="block text-[7px] font-bold text-indigo-400 dark:text-indigo-400">Mid</span>
                            <span className="font-extrabold text-indigo-650 dark:text-indigo-455">{state.estimatedBudget.midRange?.split(' ')[0] || '₹4,000'}</span>
                          </div>
                          <div className="p-1 rounded bg-amber-50/30 dark:bg-amber-955/10 border border-amber-100/30 dark:border-amber-900/30">
                            <span className="block text-[7px] font-bold text-amber-550 dark:text-amber-500">Luxury</span>
                            <span className="font-extrabold text-amber-655 dark:text-amber-455">{state.estimatedBudget.luxury?.split(' ')[0] || '₹12,000'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Travel Style Tags & Link */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1 max-w-[65%]">
                        {state.travelStyleTags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <Link 
                        to={`/state/${state.slug}`}
                        className="text-xs font-extrabold text-indigo-600 dark:text-indigo-405 hover:text-indigo-850 dark:hover:text-indigo-305 flex items-center gap-1 group/btn select-none"
                      >
                        Guide <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </ErrorBoundary>

        <div className="text-center mt-10">
          <Link 
            to="/explore"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Explore All 36 States & UTs
          </Link>
        </div>
      </section>

      {/* Recommendation Engine Rows */}
      <section className="bg-slate-50 py-8 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <ErrorBoundary fallbackMessage="Unable to load Trending Destinations">
            <CarouselRow 
              title="Trending Destinations" 
              subtitle="Most viewed and popular destinations this season" 
              items={trendingPlaces}
              icon={<Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Unable to load Hidden Gems">
            <CarouselRow 
              title="Hidden Gems" 
              subtitle="Undiscovered, serene places away from the crowd" 
              items={hiddenGems}
              icon={<Heart className="h-5 w-5 text-emerald-500 fill-emerald-500" />}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Unable to load Weekend Getaways">
            <CarouselRow 
              title="Weekend Getaways" 
              subtitle="Perfect escapes for a quick refreshing trip" 
              items={weekendGetaways}
              icon={<Compass className="h-5 w-5 text-indigo-500" />}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Unable to load Heritage Collection">
            <CarouselRow 
              title="Heritage Collection" 
              subtitle="Historic monuments, ancient forts, and palaces" 
              items={heritagePlaces}
              icon={<Landmark className="h-5 w-5 text-sky-500" />}
            />
          </ErrorBoundary>

        </div>
      </section>

    </div>
  );
};

export default Home;
