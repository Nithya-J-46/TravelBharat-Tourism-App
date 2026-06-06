import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Search, MapPin, Compass, Heart, Star, Navigation, 
  Calendar, ChevronRight, X, Sun, Moon, Plane, Train, 
  Car, TrendingUp, Trees, Landmark, Eye, DollarSign, Award
} from 'lucide-react';

const statesPaths = [
  { id: 'JK', name: 'Jammu and Kashmir', capital: 'Srinagar', slug: 'jammu-and-kashmir', path: 'M 175,60 L 205,50 L 215,65 L 195,95 L 175,85 Z' },
  { id: 'LA', name: 'Ladakh', capital: 'Leh', slug: 'ladakh', path: 'M 205,50 L 255,55 L 245,95 L 215,65 Z' },
  { id: 'HP', name: 'Himachal Pradesh', capital: 'Shimla', slug: 'himachal-pradesh', path: 'M 195,95 L 230,90 L 235,115 L 190,120 Z' },
  { id: 'PB', name: 'Punjab', capital: 'Chandigarh', slug: 'punjab', path: 'M 155,110 L 190,100 L 190,135 L 155,135 Z' },
  { id: 'UT', name: 'Uttarakhand', capital: 'Dehradun', slug: 'uttarakhand', path: 'M 230,90 L 265,120 L 240,150 L 210,140 Z' },
  { id: 'HR', name: 'Haryana', capital: 'Chandigarh', slug: 'haryana', path: 'M 190,135 L 220,130 L 220,160 L 185,160 Z' },
  { id: 'DL', name: 'Delhi', capital: 'New Delhi', slug: 'delhi', path: 'M 215,150 L 225,150 L 225,160 L 215,160 Z' },
  { id: 'RJ', name: 'Rajasthan', capital: 'Jaipur', slug: 'rajasthan', path: 'M 105,145 L 185,160 L 160,235 L 95,210 Z' },
  { id: 'UP', name: 'Uttar Pradesh', capital: 'Lucknow', slug: 'uttar-pradesh', path: 'M 220,160 L 325,180 L 295,245 L 210,205 Z' },
  { id: 'GJ', name: 'Gujarat', capital: 'Gandhinagar', slug: 'gujarat', path: 'M 45,220 L 105,220 L 115,280 L 70,285 L 45,255 Z' },
  { id: 'MP', name: 'Madhya Pradesh', capital: 'Bhopal', slug: 'madhya-pradesh', path: 'M 160,235 L 270,230 L 260,295 L 140,285 Z' },
  { id: 'BH', name: 'Bihar', capital: 'Patna', slug: 'bihar', path: 'M 325,180 L 385,200 L 375,245 L 315,240 Z' },
  { id: 'JH', name: 'Jharkhand', capital: 'Ranchi', slug: 'jharkhand', path: 'M 315,240 L 375,245 L 370,290 L 305,280 Z' },
  { id: 'WB', name: 'West Bengal', capital: 'Kolkata', slug: 'west-bengal', path: 'M 375,245 L 400,240 L 390,325 L 370,290 Z' },
  { id: 'OR', name: 'Odisha', capital: 'Bhubaneswar', slug: 'odisha', path: 'M 285,290 L 355,285 L 335,355 L 275,335 Z' },
  { id: 'CG', name: 'Chhattisgarh', capital: 'Raipur', slug: 'chhattisgarh', path: 'M 260,275 L 290,275 L 275,350 L 245,315 Z' },
  { id: 'MH', name: 'Maharashtra', capital: 'Mumbai', slug: 'maharashtra', path: 'M 115,280 L 235,290 L 205,375 L 100,330 Z' },
  { id: 'AP', name: 'Andhra Pradesh', capital: 'Amaravati', slug: 'andhra-pradesh', path: 'M 205,375 L 245,365 L 225,475 L 185,445 Z' },
  { id: 'TS', name: 'Telangana', capital: 'Hyderabad', slug: 'telangana', path: 'M 185,355 L 235,365 L 215,415 L 165,405 Z' },
  { id: 'KA', name: 'Karnataka', capital: 'Bengaluru', slug: 'karnataka', path: 'M 120,370 L 165,370 L 185,470 L 135,485 Z' },
  { id: 'GO', name: 'Goa', capital: 'Panaji', slug: 'goa', path: 'M 115,405 L 130,405 L 130,420 L 115,420 Z' },
  { id: 'KL', name: 'Kerala', capital: 'Thiruvananthapuram', slug: 'kerala', path: 'M 140,490 L 165,485 L 170,565 L 155,565 Z' },
  { id: 'TN', name: 'Tamil Nadu', capital: 'Chennai', slug: 'tamil-nadu', path: 'M 165,485 L 195,480 L 180,580 L 160,580 Z' },
  { id: 'SK', name: 'Sikkim', capital: 'Gangtok', slug: 'sikkim', path: 'M 390,200 L 405,200 L 405,215 L 390,215 Z' },
  { id: 'AS', name: 'Assam', capital: 'Dispur', slug: 'assam', path: 'M 425,210 L 475,210 L 475,240 L 425,240 Z' },
  { id: 'AR', name: 'Arunachal Pradesh', capital: 'Itanagar', slug: 'arunachal-pradesh', path: 'M 455,185 L 510,200 L 485,225 L 455,210 Z' },
  { id: 'NL', name: 'Nagaland', capital: 'Kohima', slug: 'nagaland', path: 'M 490,225 L 510,225 L 510,240 L 490,240 Z' },
  { id: 'MN', name: 'Manipur', capital: 'Imphal', slug: 'manipur', path: 'M 485,240 L 505,240 L 505,255 L 485,255 Z' },
  { id: 'MZ', name: 'Mizoram', capital: 'Aizawl', slug: 'mizoram', path: 'M 475,255 L 490,255 L 490,275 L 475,275 Z' },
  { id: 'TR', name: 'Tripura', capital: 'Agartala', slug: 'tripura', path: 'M 460,250 L 475,250 L 475,265 L 460,265 Z' },
  { id: 'ML', name: 'Meghalaya', capital: 'Shillong', slug: 'meghalaya', path: 'M 430,230 L 460,230 L 460,245 L 430,245 Z' }
];

const stateCentroids = {
  'JK': { x: 190, y: 70 },
  'LA': { x: 230, y: 70 },
  'HP': { x: 210, y: 105 },
  'PB': { x: 175, y: 120 },
  'UT': { x: 235, y: 125 },
  'HR': { x: 200, y: 145 },
  'DL': { x: 220, y: 155 },
  'RJ': { x: 140, y: 180 },
  'UP': { x: 260, y: 200 },
  'GJ': { x: 80, y: 250 },
  'MP': { x: 200, y: 260 },
  'BH': { x: 350, y: 215 },
  'JH': { x: 340, y: 265 },
  'WB': { x: 385, y: 280 },
  'OR': { x: 310, y: 320 },
  'CG': { x: 265, y: 310 },
  'MH': { x: 160, y: 330 },
  'AP': { x: 215, y: 415 },
  'TS': { x: 200, y: 385 },
  'KA': { x: 150, y: 430 },
  'GO': { x: 122, y: 412 },
  'KL': { x: 155, y: 525 },
  'TN': { x: 180, y: 530 },
  'SK': { x: 398, y: 208 },
  'AS': { x: 450, y: 225 },
  'AR': { x: 480, y: 205 },
  'NL': { x: 500, y: 232 },
  'MN': { x: 495, y: 248 },
  'MZ': { x: 482, y: 265 },
  'TR': { x: 468, y: 258 },
  'ML': { x: 445, y: 238 }
};

const getPinCoords = (centroid, index) => {
  const offsets = [
    { dx: -12, dy: -12 },
    { dx: 15, dy: -6 },
    { dx: -10, dy: 15 },
    { dx: 12, dy: 14 },
    { dx: 0, dy: -24 }
  ];
  const offset = offsets[index % offsets.length];
  return {
    x: centroid.x + offset.dx,
    y: centroid.y + offset.dy
  };
};

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLng = toRad(coords2.longitude - coords1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) *
      Math.cos(toRad(coords2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const IndiaMap = () => {
  const [dbStates, setDbStates] = useState([]);
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeDiscoveryMode, setActiveDiscoveryMode] = useState(null);
  const [statePlaces, setStatePlaces] = useState([]);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [zoomState, setZoomState] = useState({ scale: 1, x: 0, y: 0 });

  // Geolocation states
  const [userCoords, setUserCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Stats viewport counters
  const [showCounters, setShowCounters] = useState(false);
  const [stats, setStats] = useState({ states: 0, places: 0, heritage: 0, wildlife: 0, hills: 0, beaches: 0 });

  // Light/Dark Theme detection
  const { isDark } = useTheme();
  const darkMode = isDark;

  const navigate = useNavigate();
  const suggestionRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // 1. Fetch States data from backend
    axios.get('http://localhost:5000/api/states')
      .then(res => setDbStates(res.data))
      .catch(err => console.error('Error fetching states:', err));

    // 3. Stats section viewport intersection observer
    const statsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShowCounters(true);
      }
    }, { threshold: 0.1 });
    if (statsRef.current) {
      statsObserver.observe(statsRef.current);
    }

    // 4. Close suggestions on click outside
    const handleOutsideClick = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      statsObserver.disconnect();
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Animate statistics counters once visible
  useEffect(() => {
    if (!showCounters) return;

    let sVal = 0, pVal = 0, hVal = 0, wVal = 0, hlVal = 0, bVal = 0;
    const interval = setInterval(() => {
      let done = true;
      if (sVal < 36) { sVal += 1; done = false; }
      if (pVal < 1000) { pVal += 25; done = false; }
      if (hVal < 200) { hVal += 5; done = false; }
      if (wVal < 150) { wVal += 4; done = false; }
      if (hlVal < 100) { hlVal += 3; done = false; }
      if (bVal < 50) { bVal += 2; done = false; }

      setStats({
        states: Math.min(sVal, 36),
        places: Math.min(pVal, 1000),
        heritage: Math.min(hVal, 200),
        wildlife: Math.min(wVal, 150),
        hills: Math.min(hlVal, 100),
        beaches: Math.min(bVal, 50)
      });

      if (done) clearInterval(interval);
    }, 20);

    return () => clearInterval(interval);
  }, [showCounters]);

  // Fetch Suggestions Autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      axios.get(`http://localhost:5000/api/places/suggestions?q=${encodeURIComponent(searchQuery)}`)
        .then(res => setSuggestions(res.data))
        .catch(err => console.error(err));
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Load places for the selected state to display markers
  useEffect(() => {
    if (!selectedState) {
      setStatePlaces([]);
      setSelectedPin(null);
      return;
    }
    axios.get(`http://localhost:5000/api/places?state=${selectedState.slug}`)
      .then(res => {
        // filter destinations that have valid coordinates
        const coordsPlaces = res.data.filter(p => p.coordinates && p.coordinates.latitude && p.coordinates.longitude);
        // Sort by popularity or views and take the top 5
        setStatePlaces(coordsPlaces.slice(0, 5));
      })
      .catch(err => console.error('Error fetching places for state:', err));
  }, [selectedState]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 15
    });
  };

  const getMatchedStateData = (slug) => {
    return dbStates.find(s => s.slug === slug);
  };

  const handleStateSelect = (stateMapItem) => {
    const fullState = getMatchedStateData(stateMapItem.slug);
    if (!fullState) return;

    setSelectedState(fullState);
    setSelectedPin(null);

    // Dynamic Zoom & Center based on state centroid coordinates
    const centroid = stateCentroids[stateMapItem.id] || { x: 275, y: 300 };
    
    // Compute offset so the centroid moves towards the center of the viewBox (275, 300)
    const zoomMultiplier = 1.8;
    const targetX = (275 - centroid.x * zoomMultiplier);
    const targetY = (300 - centroid.y * zoomMultiplier);

    setZoomState({
      scale: zoomMultiplier,
      x: targetX,
      y: targetY
    });
  };

  const handleResetZoom = () => {
    setSelectedState(null);
    setStatePlaces([]);
    setSelectedPin(null);
    setZoomState({ scale: 1, x: 0, y: 0 });
  };

  const handleSuggestionClick = (sug) => {
    setSearchQuery('');
    setShowSuggestions(false);

    if (sug.type === 'State') {
      const mapItem = statesPaths.find(s => s.slug === sug.slug);
      if (mapItem) handleStateSelect(mapItem);
    } else if (sug.type === 'Destination' || sug.type === 'City') {
      // Find the corresponding state
      axios.get(`http://localhost:5000/api/places/slug/${sug.slug || sug.text.toLowerCase().split(' ').join('-')}`)
        .then(res => {
          const place = res.data;
          if (place && place.state) {
            const mapItem = statesPaths.find(s => s.slug === place.state.slug);
            if (mapItem) {
              handleStateSelect(mapItem);
              // Set the selected pin after places load
              setTimeout(() => {
                setSelectedPin(place);
              }, 600);
            }
          }
        })
        .catch(() => {
          // Fallback search
          navigate(`/explore?search=${encodeURIComponent(sug.text)}`);
        });
    }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocLoading(false);
      },
      (err) => {
        console.error("User denied location request", err);
        setLocLoading(false);
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  // Distance and transportation recommendation builder
  const getLocationInsights = () => {
    if (!userCoords || !selectedState || statePlaces.length === 0) return null;
    
    // Choose the first place as target
    const targetPlace = statePlaces[0];
    const dist = haversineDistance(userCoords, targetPlace.coordinates);
    
    let transport = { type: 'Flight', icon: <Plane className="h-5 w-5 text-sky-505" />, time: '', speed: 500 };
    if (dist < 300) {
      transport = { type: 'Road Trip (Car / Bus)', icon: <Car className="h-5 w-5 text-emerald-555" />, time: '', speed: 65 };
    } else if (dist < 800) {
      transport = { type: 'Express Train', icon: <Train className="h-5 w-5 text-amber-555" />, time: '', speed: 75 };
    }

    const calculatedTime = (dist / transport.speed) + (transport.type === 'Flight' ? 2 : 0);
    const hours = Math.floor(calculatedTime);
    const minutes = Math.round((calculatedTime - hours) * 60);
    transport.time = `${hours}h ${minutes}m`;

    const nearestAir = targetPlace.howToReach?.byAir?.nearest || 'State Domestic Airport';
    const nearestAirDist = targetPlace.howToReach?.byAir?.distance || 'N/A';

    return {
      distance: Math.round(dist),
      transport,
      nearestAir: `${nearestAir} (${nearestAirDist})`,
      budget: selectedState.estimatedBudget?.midRange || '₹4,000/day'
    };
  };

  const locationInsights = getLocationInsights();

  // Dynamic Map recoloring logic
  const getStateFillColor = (mapItem) => {
    const fullState = getMatchedStateData(mapItem.slug);
    const isHovered = hoveredState?.id === mapItem.id;
    const isSelected = selectedState?.slug === mapItem.slug;

    if (isSelected) {
      return darkMode ? '#10b981' : '#10b981'; // Saffron active / Emerald green
    }

    if (isHovered) {
      return darkMode ? '#312e81' : '#c7d2fe'; // Indigo accent
    }

    // Filter Highlight state check
    if (activeFilter !== 'All') {
      const matchesFilter = fullState?.topCategories?.some(
        c => c.toLowerCase() === activeFilter.toLowerCase()
      );
      if (matchesFilter) {
        return darkMode ? '#0284c7' : '#bae6fd'; // Sky blue matches
      }
      return darkMode ? '#1e293b' : '#f8fafc'; // Dim non-matches
    }

    // Discovery modes highlight state check
    if (activeDiscoveryMode) {
      const mode = activeDiscoveryMode.toLowerCase();
      let isMatch = false;

      if (mode === 'trending') isMatch = fullState?.famousFor?.toLowerCase().includes('palace') || fullState?.famousFor?.toLowerCase().includes('beach') || ['kerala', 'goa', 'rajasthan', 'jammu-and-kashmir'].includes(mapItem.slug);
      else if (mode === 'adventure') isMatch = fullState?.topCategories?.some(c => c.toLowerCase() === 'adventure');
      else if (mode === 'beaches') isMatch = fullState?.topCategories?.some(c => c.toLowerCase() === 'beaches' || c.toLowerCase() === 'coastal');
      else if (mode === 'nature') isMatch = fullState?.topCategories?.some(c => c.toLowerCase() === 'nature' || c.toLowerCase() === 'wildlife');
      else if (mode === 'heritage') isMatch = fullState?.topCategories?.some(c => c.toLowerCase() === 'heritage');
      else if (mode === 'spiritual') isMatch = fullState?.topCategories?.some(c => c.toLowerCase() === 'religious' || c.toLowerCase() === 'spiritual');
      else if (mode === 'hidden gems') isMatch = ['sikkim', 'ladakh', 'meghalaya', 'mizoram', 'tripura', 'lakshadweep'].includes(mapItem.slug);

      if (isMatch) {
        // Mode specific color mappings
        if (mode === 'trending') return darkMode ? '#85210c' : '#fed7aa'; // Saffron Orange tint
        if (mode === 'adventure') return darkMode ? '#1e3a8a' : '#dbeafe'; // Electric blue
        if (mode === 'beaches') return darkMode ? '#0f766e' : '#ccfbf1'; // Deep teal/turquoise
        if (mode === 'nature') return darkMode ? '#065f46' : '#d1fae5'; // Forest green
        if (mode === 'heritage') return darkMode ? '#78350f' : '#fef3c7'; // Royal gold/bronze
        if (mode === 'spiritual') return darkMode ? '#7c2d12' : '#ffedd5'; // Saffron orange
        if (mode === 'hidden gems') return darkMode ? '#581c87' : '#f3e8ff'; // Violet amethyst
      }
      return darkMode ? '#131c2c' : '#f1f5f9'; // Dim others
    }

    // Default colors
    return darkMode ? '#1e293b' : '#e2e8f0';
  };

  const getStateStrokeColor = (mapItem) => {
    const isSelected = selectedState?.slug === mapItem.slug;
    const isHovered = hoveredState?.id === mapItem.id;

    if (isSelected || isHovered) {
      return '#3b82f6'; // Neon blue borders
    }
    return darkMode ? '#334155' : '#ffffff';
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 bg-slate-50/50 dark:bg-slate-950/20 py-8 px-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/30">
      
      {/* Control Panel: Search & Discovery Modes */}
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Search Bar */}
        <div ref={suggestionRef} className="relative w-full max-w-2xl mx-auto">
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-slate-200/60 dark:border-slate-800/60 transition-all focus-within:ring-2 focus-within:ring-indigo-500">
            <Search className="h-5 w-5 text-indigo-500 ml-4 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Search State, City or Destination..." 
              className="w-full py-2.5 px-3 text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-bold text-sm sm:text-base bg-transparent"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden z-40 text-left"
              >
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(sug)}
                    className="w-full px-5 py-3 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-850 last:border-0 flex items-center justify-between text-slate-700 dark:text-slate-350 font-bold text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <span>{sug.text}</span>
                    </div>
                    <span className="text-[9px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                      {sug.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Filters (Horizontal Slider) */}
        <div className="w-full overflow-x-auto pb-2 flex gap-2 no-scrollbar justify-center">
          {['All', 'Nature', 'Heritage', 'Religious', 'Adventure', 'Wildlife', 'Beaches', 'Hill Stations', 'UNESCO Sites'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setActiveDiscoveryMode(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 flex-shrink-0 cursor-pointer select-none border ${
                activeFilter === filter 
                  ? 'bg-indigo-600 border-indigo-650 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-805/85 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Discovery Modes Toggles */}
        <div className="flex flex-wrap gap-2.5 justify-center items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mr-1.5 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" /> Discovery Modes:
          </span>
          {[
            { label: 'Trending', emoji: '🔥' },
            { label: 'Adventure', emoji: '🏔' },
            { label: 'Beaches', emoji: '🏖' },
            { label: 'Nature', emoji: '🌿' },
            { label: 'Heritage', emoji: '🕌' },
            { label: 'Spiritual', emoji: '🙏' },
            { label: 'Hidden Gems', emoji: '🌍' }
          ].map((mode) => (
            <button
              key={mode.label}
              onClick={() => {
                setActiveDiscoveryMode(activeDiscoveryMode === mode.label ? null : mode.label);
                setActiveFilter('All');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeDiscoveryMode === mode.label
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Main Map Box & Location Panel */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 gap-8 select-none">
        
        {/* SVG India Map Visual */}
        <div className="relative w-full max-w-xl aspect-[11/12] h-[520px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850 overflow-hidden flex justify-center items-center" onMouseMove={handleMouseMove}>
          
          {/* Zoom Controls */}
          {selectedState && (
            <button 
              onClick={handleResetZoom}
              className="absolute top-4 left-4 z-20 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 dark:bg-slate-100/90 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Compass className="h-4 w-4 animate-spin-slow" />
              Reset Map View
            </button>
          )}

          {/* Use My Location button */}
          <button
            onClick={requestUserLocation}
            disabled={locLoading}
            className={`absolute top-4 right-4 z-20 px-3.5 py-1.5 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition border cursor-pointer ${
              userCoords 
                ? 'bg-emerald-500/90 text-white border-emerald-600 hover:bg-emerald-600' 
                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-850/80 text-slate-750 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Navigation className={`h-3.5 w-3.5 ${locLoading ? 'animate-spin' : ''}`} />
            {userCoords ? 'Location Detected' : 'Use My Location'}
          </button>

          {/* Interactive SVG Canvas */}
          <motion.svg
            viewBox="0 0 550 600"
            className="w-full h-full filter drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
              scale: zoomState.scale,
              x: zoomState.x,
              y: zoomState.y
            }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          >
            {statesPaths.map((s) => (
              <motion.path
                key={s.id}
                d={s.path}
                fill={getStateFillColor(s)}
                stroke={getStateStrokeColor(s)}
                strokeWidth={selectedState?.slug === s.slug ? 2.2 : 1.2}
                className="cursor-pointer transition-colors duration-300"
                whileHover={{
                  scale: selectedState ? 1.0 : 1.03,
                  strokeWidth: 2,
                  fill: selectedState?.slug === s.slug ? '#10b981' : (darkMode ? '#312e81' : '#c7d2fe'),
                  transition: { duration: 0.15 }
                }}
                onMouseEnter={() => !selectedState && setHoveredState(s)}
                onMouseLeave={() => !selectedState && setHoveredState(null)}
                onClick={() => handleStateSelect(s)}
              />
            ))}

            {/* Destination Pins on Zoom */}
            {selectedState && statePlaces.map((place, idx) => {
              const centroid = stateCentroids[statesPaths.find(s => s.slug === selectedState.slug)?.id];
              if (!centroid) return null;
              const coords = getPinCoords(centroid, idx);

              return (
                <g 
                  key={place._id} 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(place);
                  }}
                  onMouseEnter={() => setHoveredPin(place)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Pulsing glow circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={6}
                    fill="#10b981"
                    opacity={0.4}
                    className="animate-ping"
                  />
                  {/* Anchor Point */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={4}
                    fill={selectedPin?._id === place._id ? '#ef4444' : '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </motion.svg>

          {/* Hover State Tooltip (Floating Card) */}
          <AnimatePresence>
            {hoveredState && !selectedState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute z-30 pointer-events-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-205/65 dark:border-slate-805/65 rounded-2xl p-4 shadow-2xl text-slate-800 dark:text-slate-100 text-left min-w-[200px]"
                style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <h4 className="font-extrabold text-sm text-indigo-650 dark:text-indigo-400">{hoveredState.name}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Capital: {hoveredState.capital}</p>
                </div>

                {getMatchedStateData(hoveredState.slug) && (
                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-tight">
                      {getMatchedStateData(hoveredState.slug).famousFor || getMatchedStateData(hoveredState.slug).description}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-550/20" />
                      <span>Best Time: {getMatchedStateData(hoveredState.slug).bestTimeToVisit || 'Oct - Mar'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                      <Award className="h-3.5 w-3.5" />
                      <span>Rating: ★★★★★ (4.8+)</span>
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold tracking-wider uppercase block mt-3 text-right">
                  Click to Explore →
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Place Preview Card (Hover/Click Pin) */}
          <AnimatePresence>
            {(hoveredPin || selectedPin) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 right-4 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-xl flex gap-3 items-center text-left"
              >
                {/* Close pin detail */}
                {selectedPin && (
                  <button 
                    onClick={() => setSelectedPin(null)} 
                    className="absolute top-2.5 right-2.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <img
                  src={(hoveredPin || selectedPin).images?.[0] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=300'}
                  alt={(hoveredPin || selectedPin).name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100 dark:border-slate-800"
                />

                <div className="flex-grow space-y-1">
                  <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-extrabold text-[8px] tracking-wider uppercase py-0.5 px-2 rounded-md">
                    {(hoveredPin || selectedPin).category?.name || 'Destination'}
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {(hoveredPin || selectedPin).name}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      {((hoveredPin || selectedPin).ratingScores?.popularity || 4.5).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>Best Season: {(hoveredPin || selectedPin).bestTimeToVisit}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/destination/${(hoveredPin || selectedPin).slug}`)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  View Detail
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* State Preview Card Sidebar (Glassmorphism layout inside control area) */}
        <div className="w-full md:w-[280px] h-[520px] flex flex-col justify-between items-stretch bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-left">
          
          {selectedState ? (
            <div className="flex flex-col h-full justify-between">
              
              {/* State Preview Image Header */}
              <div className="space-y-4">
                <div className="relative h-28 rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={selectedState.bannerImage}
                    alt={selectedState.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2.5 left-3 text-white">
                    <h4 className="font-extrabold text-base tracking-tight">{selectedState.name}</h4>
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-300">Capital: {selectedState.capital}</p>
                  </div>
                </div>

                {/* State traveler statistics metrics */}
                <div className="space-y-3">
                  
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Famous Attractions</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350 line-clamp-2 mt-0.5 leading-tight">
                      {selectedState.mustVisitDestinations?.join(', ') || 'Scenic Temples, Monuments'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Est. Daily Budget</span>
                    <div className="flex justify-between text-[9px] font-extrabold text-slate-650 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40 mt-1">
                      <span>Budget: {selectedState.estimatedBudget?.budget?.split(' ')[0] || '₹1,500'}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">Mid: {selectedState.estimatedBudget?.midRange?.split(' ')[0] || '₹4,000'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Travel Styles</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedState.travelStyleTags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 font-bold px-2 py-0.5 rounded text-[9px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* User Location Metrics Calculation */}
              {userCoords && locationInsights ? (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/20 rounded-xl p-3 space-y-1.5 text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-450">
                    <Navigation className="h-3.5 w-3.5 fill-emerald-600/10" />
                    <span>Your Location Journey</span>
                  </div>
                  <div className="space-y-1 text-slate-650 dark:text-slate-350 font-semibold text-[10px]">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{locationInsights.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transit Mode:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {locationInsights.transport.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Travel Time:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{locationInsights.transport.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nearest Airport:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{locationInsights.nearestAir}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100/40 dark:bg-slate-950/30 border border-slate-200/20 rounded-xl p-3 text-center text-[10px] text-slate-400 font-bold">
                  Enable Geolocation above to check distance and transport recommendations.
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => handleStateSelect(statesPaths.find(s => s.slug === selectedState.slug))}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  Open Travel Planner
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col h-full justify-between items-center text-center py-6">
              <Compass className="h-10 w-10 text-slate-300 dark:text-slate-700 animate-bounce" />
              <div className="space-y-1">
                <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No State Selected</h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-[180px] mx-auto">
                  Click on the map or type in search to explore custom state guides.
                </p>
              </div>
              <div className="w-full bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/30 text-[9px] font-bold text-slate-400 leading-normal">
                ⭐ Protip: Toggling different categories or discovery modes above will filter states dynamically!
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Slide-In Side Travel Planner Panel */}
      <AnimatePresence>
        {selectedState && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleResetZoom}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 cursor-pointer"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[460px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-800/50 z-50 overflow-y-auto no-scrollbar flex flex-col text-left"
            >
              
              {/* Sticky Top Header banner */}
              <div className="relative h-56 flex-shrink-0">
                <img
                  src={selectedState.bannerImage}
                  alt={selectedState.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-slate-950/80"></div>
                
                {/* Close button */}
                <button
                  onClick={handleResetZoom}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs border border-white/20 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute bottom-5 left-6 right-6 text-white space-y-1">
                  <span className="bg-emerald-500/90 text-white font-extrabold text-[8px] tracking-widest uppercase py-1 px-3.5 rounded-full shadow-md">
                    Capital: {selectedState.capital}
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight drop-shadow-sm mt-1">{selectedState.name}</h3>
                </div>
              </div>

              {/* Panel content scrollable */}
              <div className="p-6 space-y-6 flex-grow">
                
                {/* State Overview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Overview</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                    {selectedState.description}
                  </p>
                </div>

                {/* Traveler Decision Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Best Travel Season</span>
                    <span className="text-xs font-bold text-slate-750 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      {selectedState.bestTimeToVisit || 'Oct - Mar'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Travel Style Tags</span>
                    <span className="text-xs font-bold text-slate-750 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-emerald-555" />
                      {selectedState.travelStyleTags?.slice(0, 2).join(', ') || 'Family, Adventure'}
                    </span>
                  </div>
                </div>

                {/* Estimate Budget details */}
                {selectedState.estimatedBudget && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Estimated Travel Budgets</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800/50 text-center">
                        <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Budget</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mt-1">{selectedState.estimatedBudget.budget}</span>
                        <span className="text-[7px] text-slate-400 font-bold block mt-0.5">Backpacker style</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-150/30 dark:border-indigo-900/30 text-center">
                        <span className="block text-[8px] font-bold text-indigo-455 dark:text-indigo-400 uppercase tracking-wider">Mid-range</span>
                        <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 block mt-1">{selectedState.estimatedBudget.midRange}</span>
                        <span className="text-[7px] text-indigo-400 font-bold block mt-0.5">Hotel + Taxi</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-amber-50/20 dark:bg-amber-955/10 border border-amber-150/30 dark:border-amber-900/30 text-center">
                        <span className="block text-[8px] font-bold text-amber-550 dark:text-amber-500 uppercase tracking-wider">Luxury</span>
                        <span className="text-xs font-extrabold text-amber-650 dark:text-amber-450 block mt-1">{selectedState.estimatedBudget.luxury}</span>
                        <span className="text-[7px] text-amber-500 font-bold block mt-0.5">Resort + Flight</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top experiences and must visit */}
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Top Experiences & Places</h4>
                  <div className="space-y-2.5">
                    {selectedState.topExperiences?.slice(0, 3).map((exp, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-350 font-bold leading-normal">{exp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Food Specialties */}
                {selectedState.foodSpecialties && selectedState.foodSpecialties.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Food Specialties</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedState.foodSpecialties.map((food, idx) => (
                        <span key={idx} className="bg-amber-50 dark:bg-amber-955/10 text-amber-700 dark:text-amber-400 border border-amber-100/40 dark:border-amber-900/30 font-bold px-2.5 py-1 rounded-lg text-xs">
                          😋 {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Local Airport and Geo info if Geolocation active */}
                {userCoords && locationInsights && (
                  <div className="bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-150/40 dark:border-emerald-900/20 rounded-2xl p-4 space-y-3 text-xs">
                    <h4 className="font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="h-4 w-4" /> Transit & Routing Plan
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-650 dark:text-slate-350">
                      <div>
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Calculated Distance</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{locationInsights.distance} km</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recommended Route</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block flex items-center gap-1">
                          {locationInsights.transport.icon} {locationInsights.transport.type}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estimated Travel Time</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{locationInsights.transport.time}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nearest Air Terminal</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block truncate max-w-[170px]" title={locationInsights.nearestAir}>{locationInsights.nearestAir}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate(`/state/${selectedState.slug}`)}
                  className="flex-grow py-3 bg-indigo-650 hover:bg-indigo-705 text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Complete State Guide
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate(`/explore?state=${selectedState.slug}`)}
                  className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Plan Trip
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upgraded Statistics Counter Section (Scrolled in view) */}
      <section ref={statsRef} className="w-full bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 border border-slate-955/80 shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">{stats.states}</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">States & UTs</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-450 tracking-tight">{stats.places}+</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Destinations</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">{stats.heritage}+</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Heritage Sites</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-455 tracking-tight">{stats.wildlife}+</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Wildlife Spots</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">{stats.hills}+</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Hill Stations</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-455 tracking-tight">{stats.beaches}+</h3>
            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Coastal Beaches</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default IndiaMap;
