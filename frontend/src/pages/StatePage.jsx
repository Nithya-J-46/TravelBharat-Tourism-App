import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Compass, Tag, Landmark, RotateCcw, Info, 
  Calendar, Coins, Utensils, Lightbulb, CloudSun, CheckCircle2, 
  ChevronRight, ArrowRight, Star, Users, Clock, ShieldAlert,
  Heart, Eye, Printer, Bookmark, Check, Plus, Minus,
  ChevronDown, ChevronUp, Map, Navigation, Car, Train, Plane,
  Bus, ExternalLink, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import PlaceCard from '../components/PlaceCard';
import Breadcrumb from '../components/Breadcrumb';
import SEO from '../components/SEO';
import { clearImageRegistry } from '../components/SafeImage';
import WeatherWidget from '../components/WeatherWidget';

// Fix Leaflet marker icons issue in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Icons for Map
const hotelIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Leaflet Map Bounds Controller
const MapBoundsController = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = points.map(pt => [pt.latitude, pt.longitude]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
    }
  }, [map, points]);
  return null;
};

// Animated Rolling Counter
const AnimatedCounter = ({ value, duration = 600 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end) || end === 0) {
      setCount(value);
      return;
    }
    if (start === end) return;
    
    let totalMiliseconds = duration;
    let incrementTime = Math.max(Math.floor(totalMiliseconds / end), 12);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{count.toLocaleString()}</span>;
};

const StatePage = () => {
  const { isDark } = useTheme();
  const { stateSlug } = useParams();
  const [stateInfo, setStateInfo] = useState(null);
  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  
  // Destination List Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Master Trip Planner States (Unified Section 2 Controls)
  const [travelerType, setTravelerType] = useState('couple'); // solo, couple, family, friends
  const [duration, setDuration] = useState(5); // 3, 5, 7
  const [budgetTier, setBudgetTier] = useState('Mid-range'); // Budget, Mid-range, Luxury
  const [travelStyle, setTravelStyle] = useState('Sightseeing'); // Adventure, Relaxed, Cultural, Sightseeing
  const [regenerating, setRegenerating] = useState(false);

  // Trigger loading state overlay when controls are adjusted
  useEffect(() => {
    setRegenerating(true);
    const timer = setTimeout(() => {
      setRegenerating(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [duration, travelerType, budgetTier, travelStyle]);

  // Geolocation States
  const [userCoords, setUserCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Timeline UI States
  const [expandedDays, setExpandedDays] = useState(new Set([1])); // Open day 1 by default
  const [saveStatus, setSaveStatus] = useState('');

  // Fetch State info by slug
  useEffect(() => {
    const fetchStateData = async () => {
      setLoading(true);
      try {
        const stateRes = await axios.get(`http://localhost:5000/api/states/slug/${stateSlug}`);
        setStateInfo(stateRes.data);
        
        const [citiesRes, categoriesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/cities?state=${stateRes.data._id}`),
          axios.get('http://localhost:5000/api/categories')
        ]);
        setCities(citiesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error fetching state details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStateData();
  }, [stateSlug]);

  // Fetch places inside this state whenever filters change
  useEffect(() => {
    const fetchPlaces = async () => {
      clearImageRegistry();
      setPlacesLoading(true);
      try {
        let url = `http://localhost:5000/api/places?state=${stateInfo._id}`;
        if (selectedCity) url += `&city=${selectedCity}`;
        if (selectedCategory) url += `&category=${selectedCategory}`;
        
        const res = await axios.get(url);
        setPlaces(res.data);
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setPlacesLoading(false);
      }
    };
    if (stateInfo) {
      fetchPlaces();
    }
  }, [stateInfo, selectedCity, selectedCategory]);

  // Load starting location on mount
  useEffect(() => {
    const storedCity = localStorage.getItem('userCity');
    const storedState = localStorage.getItem('userState');
    const storedLat = localStorage.getItem('userLat');
    const storedLng = localStorage.getItem('userLng');

    if (storedCity && storedLat && storedLng) {
      setLocationName(`${storedCity}, ${storedState || ''}`);
      setUserCoords({ latitude: parseFloat(storedLat), longitude: parseFloat(storedLng) });
    }
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const address = res.data?.address;
          let city = address?.city || address?.town || address?.village || address?.county || 'Unknown City';
          let state = address?.state || '';
          state = state.replace('State of ', '').trim();
          city = city.trim();

          localStorage.setItem('userCity', city);
          localStorage.setItem('userState', state);
          localStorage.setItem('userLat', latitude.toString());
          localStorage.setItem('userLng', longitude.toString());

          setLocationName(`${city}, ${state}`);
        } catch (err) {
          console.warn('Geocoding failed, using coordinates directly.', err);
          setLocationName(`Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Please enable location access in your browser.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const clearLocation = () => {
    localStorage.removeItem('userCity');
    localStorage.removeItem('userState');
    localStorage.removeItem('userLat');
    localStorage.removeItem('userLng');
    setLocationName('');
    setUserCoords(null);
  };

  if (loading && !stateInfo) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-800 border-b-indigo-600"></div>
      </div>
    );
  }

  if (!stateInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-slate-50 dark:bg-slate-950 h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">State or UT not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The state you are looking for does not exist in our database.</p>
        <Link to="/" className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Explore', url: '/explore' },
    { label: stateInfo.name, url: `/state/${stateSlug}` }
  ];

  // Recalculate Itinerary Days
  const getItineraryDays = () => {
    if (!places || places.length === 0) return [];
    
    // Sort places to match selected style (Adventure, Relaxed, Cultural, Sightseeing)
    const sorted = [...places];
    if (travelStyle === 'Adventure') {
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        return (catB.includes('adventure') || catB.includes('wildlife') ? 1 : 0) - 
               (catA.includes('adventure') || catA.includes('wildlife') ? 1 : 0);
      });
    } else if (travelStyle === 'Cultural') {
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        return (catB.includes('cultural') || catB.includes('heritage') || catB.includes('religious') ? 1 : 0) - 
               (catA.includes('cultural') || catA.includes('heritage') || catA.includes('religious') ? 1 : 0);
      });
    } else if (travelStyle === 'Relaxed') {
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        return (catB.includes('nature') || catB.includes('beach') ? 1 : 0) - 
               (catA.includes('nature') || catA.includes('beach') ? 1 : 0);
      });
    }

    const days = [];
    for (let i = 0; i < duration; i++) {
      const place = sorted[i % sorted.length];
      const nearby = place.nearbyAttractions || [];
      let spotName = place.name;
      let coords = place.coordinates || { latitude: 20.5937, longitude: 78.9629 };

      if (i >= sorted.length && nearby.length > 0) {
        const attrIndex = (i - sorted.length) % nearby.length;
        spotName = nearby[attrIndex];
        const latOffset = (Math.sin(attrIndex * 2.3) * 0.018) + 0.008;
        const lngOffset = (Math.cos(attrIndex * 2.3) * 0.018) + 0.008;
        coords = {
          latitude: coords.latitude + latOffset,
          longitude: coords.longitude + lngOffset
        };
      }

      const selectedHotel = place.hotels?.find(h => h.category === (budgetTier === 'Mid-range' ? 'Mid-range' : budgetTier)) || place.hotels?.[0];
      const hotelName = selectedHotel?.name || `Comfortable Stay near ${place.city?.name || stateInfo.name}`;
      const hotelPrice = selectedHotel?.priceRange || (budgetTier === 'Luxury' ? '₹12,000+' : budgetTier === 'Mid-range' ? '₹3,500 - ₹5,000' : '₹1,200 - ₹2,000');
      const hotelRating = selectedHotel?.rating || 4.2;

      const foodSpots = place.foodSpots || [];
      const selectedFood = foodSpots[i % Math.max(foodSpots.length, 1)];
      const restName = selectedFood?.restaurantName || `Traditional Dining in ${place.city?.name || stateInfo.name}`;
      const restSpecialty = selectedFood?.specialty || 'Regional Specialties';
      const restCost = selectedFood?.costForTwo || (budgetTier === 'Luxury' ? '₹2,500 for two' : budgetTier === 'Mid-range' ? '₹850 for two' : '₹350 for two');

      const entryCost = place.entryFees?.adult || 0;

      // Dynamic Morning Activity text using place database info for 100% uniqueness
      let morningText = `Head over to ${spotName} for a morning exploration. Soak in the beauty, capture landscape shots, and read the local history logs.`;
      if (place.famousFor && place.famousFor.length > 0) {
        morningText = `Explore ${spotName}, famous for ${place.famousFor.slice(0, 2).join(' and ')}. ${place.whyVisit || 'Take in the unique local atmosphere and enjoy sightseeing.'}`;
      } else if (place.whyVisit) {
        morningText = `Visit ${spotName} in the morning. ${place.whyVisit}`;
      } else if (place.description) {
        morningText = `Set off to visit ${spotName} in the morning. ${place.description.slice(0, 150)}${place.description.length > 150 ? '...' : ''}`;
      }

      if (travelStyle === 'Adventure') {
        morningText = `Gear up for an exciting morning trek and outdoor nature activities around the scenic landscapes of ${spotName}. ` + morningText;
      } else if (travelStyle === 'Relaxed') {
        morningText = `Enjoy a leisurely, tranquil morning stroll around the peaceful viewpoints of ${spotName}. ` + morningText;
      } else if (travelStyle === 'Cultural') {
        morningText = `Explore the historical structures, temples, and legacy displays at ${spotName} with a guided guide. ` + morningText;
      }

      // Dynamic Evening Activity text using place database info
      let eveningText = `Spend your evening wandering the local bazaar streets, buying traditional souvenirs, and tasting authentic street snacks.`;
      if (place.nearbyAttractions && place.nearbyAttractions.length > 0) {
        const attractionsList = place.nearbyAttractions.slice(0, 3).join(', ');
        eveningText = `In the afternoon and evening, check out nearby attractions around ${spotName} including ${attractionsList}. ` + (place.travelTips?.[0] ? `Traveler Tip: ${place.travelTips[0]}` : '');
      } else if (place.travelTips && place.travelTips.length > 0) {
        eveningText = `Spend your evening wandering the local bazaar areas. Note these traveler tips: ${place.travelTips.slice(0, 2).join(' ')}`;
      }

      if (place.category?.name === 'Nature' || place.category?.name === 'Beaches') {
        eveningText = `Relax at a scenic sunset viewpoint overlooking ${spotName} and enjoy the refreshing lake or valley breeze. ` + eveningText;
      }

      // Dynamic Transit Optimization info
      let transitOptimization = 'Local cabs or auto-rickshaws recommended for sight transfers.';
      if (i === 0) {
        transitOptimization = `Arrive via ${place.howToReach?.byTrain?.nearest || 'local railway terminal'} (${place.howToReach?.byTrain?.distance || 'N/A'}) or ${place.howToReach?.byAir?.nearest || 'local airport'} (${place.howToReach?.byAir?.distance || 'N/A'}).`;
      } else if (place.howToReach?.byRoad?.routeSuggestions) {
        transitOptimization = place.howToReach.byRoad.routeSuggestions;
      }

      // Nearby Attractions list
      const attractionsListStr = place.nearbyAttractions && place.nearbyAttractions.length > 0
        ? place.nearbyAttractions.slice(0, 3).join(', ')
        : 'Scenic viewpoints, local spots';

      days.push({
        dayIndex: i + 1,
        spotName,
        coordinates: coords,
        morningText,
        eveningText,
        entryCost,
        nearbyAttractionsList: attractionsListStr,
        transitOptimization,
        hotel: { name: hotelName, priceRange: hotelPrice, rating: hotelRating },
        dining: { restaurantName: restName, specialty: restSpecialty, costForTwo: restCost }
      });
    }
    return days;
  };

  const days = getItineraryDays();

  // Compute total distance
  const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateRouteDistance = () => {
    if (days.length === 0) return 0;
    let dist = 0;

    // Add distance from user start location if detected
    let startIndex = 0;
    if (userCoords?.latitude && userCoords?.longitude) {
      dist += getHaversineDistance(
        userCoords.latitude,
        userCoords.longitude,
        days[0].coordinates.latitude,
        days[0].coordinates.longitude
      );
    }

    for (let i = 0; i < days.length - 1; i++) {
      dist += getHaversineDistance(
        days[i].coordinates.latitude,
        days[i].coordinates.longitude,
        days[i + 1].coordinates.latitude,
        days[i + 1].coordinates.longitude
      );
    }
    return Math.round(dist * 1.22); // winding factor
  };

  const totalDistance = calculateRouteDistance() || 320;
  const estimatedTravelTime = (totalDistance / 60).toFixed(1);

  // Cost calculations
  const getTripCosts = () => {
    const travelersMap = { solo: 1, couple: 2, family: 4, friends: 6 };
    const travelerCount = travelersMap[travelerType];

    const hotelRates = { Budget: 1500, 'Mid-range': 3800, Luxury: 12000 };
    const foodRates = { Budget: 350, 'Mid-range': 850, Luxury: 2100 };
    const transportRates = { Budget: 2.5, 'Mid-range': 9.0, Luxury: 17.0 };
    const miscRates = { Budget: 150, 'Mid-range': 450, Luxury: 1200 };

    const roomsCount = Math.ceil(travelerCount / 2);
    const accommodationCost = hotelRates[budgetTier] * roomsCount * duration;
    const foodCost = foodRates[budgetTier] * travelerCount * duration;
    
    // Add transit tickets / cab fuel based on distance
    const transportCost = Math.round(totalDistance * transportRates[budgetTier] + (budgetTier === 'Luxury' ? 2500 : budgetTier === 'Mid-range' ? 1000 : 250));
    
    // sum entry fees
    const entryCost = days.reduce((sum, d) => sum + d.entryCost, 0) * travelerCount;
    const miscCost = miscRates[budgetTier] * travelerCount * duration;
    const total = accommodationCost + foodCost + transportCost + entryCost + miscCost;

    return {
      accommodation: accommodationCost,
      food: foodCost,
      transport: transportCost,
      entry: entryCost,
      misc: miscCost,
      total
    };
  };

  const costs = getTripCosts();

  // Handle Timeline Toggle Expand/Collapse
  const toggleDay = (dayIdx) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIdx)) {
      if (newExpanded.size > 1) { // Keep at least one open
        newExpanded.delete(dayIdx);
      }
    } else {
      newExpanded.add(dayIdx);
    }
    setExpandedDays(newExpanded);
  };

  const expandAllDays = () => {
    setExpandedDays(new Set(days.map(d => d.dayIndex)));
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set([1])); // Retain day 1 open
  };

  // Save Plan
  const savePlan = () => {
    const newTrip = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${stateInfo.name} - ${duration} Days Plan`,
      destinationName: stateInfo.name,
      stateName: stateInfo.name,
      duration: duration,
      budgetCategory: budgetTier,
      travelStyle: travelStyle,
      travelerType: travelerType,
      estimatedCost: costs.total,
      status: 'Planning',
      dateCreated: new Date().toLocaleDateString(),
      itinerary: days,
      routeInfo: routePoints
    };
    
    // Save to travelbharat_trips
    const savedTrips = localStorage.getItem('travelbharat_trips');
    let tripList = [];
    if (savedTrips) {
      try { tripList = JSON.parse(savedTrips); } catch(e){}
    }
    localStorage.setItem('travelbharat_trips', JSON.stringify([newTrip, ...tripList]));

    // Legacy compatibility sync
    const newPlan = {
      id: newTrip.id,
      title: newTrip.name,
      duration,
      travelerType,
      budgetTier,
      travelStyle,
      totalCost: costs.total,
      date: newTrip.dateCreated
    };
    const saved = localStorage.getItem('travelbharat_itineraries');
    let list = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch(e){}
    }
    localStorage.setItem('travelbharat_itineraries', JSON.stringify([newPlan, ...list]));

    setSaveStatus('✓ Trip Saved Successfully');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // print
  const triggerPrint = () => {
    window.print();
  };

  // Dynamic Progress bar helper
  const getPercentage = (val) => {
    return Math.min(Math.round((val / costs.total) * 100), 100);
  };

  // Map route points
  const routePoints = [
    ...(userCoords ? [{ latitude: userCoords.latitude, longitude: userCoords.longitude }] : []),
    ...days.map(d => d.coordinates)
  ];

  // Dynamic Local Insights extracts
  const hiddenGems = places.filter(p => p.isHiddenGem).slice(0, 3);
  const nearbyAttractions = Array.from(new Set(places.flatMap(p => p.nearbyAttractions || []))).slice(0, 6);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen text-left pb-20 transition-colors duration-300 font-sans print:bg-white print:text-slate-900">
      <SEO 
        title={`Explore ${stateInfo.name} - Premium Travel Guide`} 
        description={`Plan your perfect route and budget to ${stateInfo.name}. Interactive map, custom day-by-day itineraries, entry fees, hotel rankings, and traveler recommendations.`}
        image={stateInfo.bannerImage}
      />

      {/* SECTION 1 – STATE HERO */}
      <div className="relative w-full h-[540px] md:h-[620px] overflow-hidden flex items-end">
        {/* Background Image with Ken Burns Zoom Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] scale-105 hover:scale-100 ease-out"
          style={{ backgroundImage: `url("${stateInfo.bannerImage}")` }}
        />
        {/* Rich dark gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
        
        {/* Glassmorphic facts panel */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <span className="bg-indigo-500/90 text-white font-extrabold text-[10px] tracking-widest uppercase py-1.5 px-4 rounded-full inline-block shadow-lg border border-white/10">
              🇮🇳 Premium State Guide
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">
              {stateInfo.name}
            </h1>
            <p className="text-sm sm:text-lg text-slate-200 max-w-3xl drop-shadow leading-relaxed font-semibold">
              {stateInfo.whyVisit || stateInfo.description}
            </p>
          </motion.div>

          {/* Quick Stats Panel (Glassmorphism & animated stats) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-5 bg-white/10 dark:bg-slate-900/30 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-4 text-white"
          >
            <div className="space-y-1">
              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider block">Capital City</span>
              <span className="text-base sm:text-lg font-extrabold text-indigo-300">{stateInfo.capital}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider block">Best Time</span>
              <span className="text-base sm:text-lg font-extrabold text-amber-300 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-amber-400" />
                {stateInfo.bestTimeToVisit || 'Oct - Mar'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider block">Avg Rating</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-300 flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-450 fill-amber-400" />
                4.8 / 5.0
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider block">Destinations</span>
              <span className="text-base sm:text-lg font-extrabold text-sky-300">
                {places.length || 3} Seeded Spots
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* SECTION 2 – TRIP PLANNER CONTROL PANEL */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-lg space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/60">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                Trip Customization Panel
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Configure preferences to regenerate custom travel itineraries and real-time budgets.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={savePlan}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer select-none"
              >
                <Bookmark className="h-4 w-4 text-indigo-500" />
                Save Itinerary
              </button>
              <button 
                onClick={triggerPrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-indigo-500/25 cursor-pointer select-none"
              >
                <Printer className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {saveStatus && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/35 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold text-center">
              {saveStatus}
            </div>
          )}

          {/* Master horizontal controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Traveler Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-500" /> Traveler Type
              </label>
              <div className="flex gap-1.5 bg-slate-100/60 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-250 dark:border-slate-850">
                {[
                  { id: 'solo', label: 'Solo', icon: '🎒' },
                  { id: 'couple', label: 'Couple', icon: '💑' },
                  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
                  { id: 'friends', label: 'Friends', icon: '👥' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setTravelerType(type.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer select-none ${
                      travelerType === type.id 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/10' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/30 transition-all duration-300'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-[9px] mt-0.5">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Duration */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Duration
              </label>
              <div className="grid grid-cols-6 gap-1 bg-slate-100/60 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-250 dark:border-slate-850">
                {[2, 3, 4, 5, 6, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer select-none text-center ${
                      duration === d 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/10 font-extrabold' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/30 transition-all duration-300'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-indigo-500" /> Budget Level
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100/60 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-250 dark:border-slate-850">
                {['Budget', 'Mid-range', 'Luxury'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBudgetTier(b)}
                    className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition cursor-pointer select-none text-center ${
                      budgetTier === b 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/10 font-extrabold' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/30 transition-all duration-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Style */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-indigo-500" /> Travel Style
              </label>
              <select
                className="w-full p-2 bg-slate-100/60 dark:bg-slate-950/50 border border-slate-250 dark:border-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-750 dark:text-slate-300 text-xs font-bold cursor-pointer"
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
              >
                {['Sightseeing', 'Adventure', 'Relaxed', 'Cultural'].map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Unified Dashboard Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left spacious column (itinerary and map) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* SECTION 3 – AI ITINERARY TIMELINE */}
            <div className="space-y-6 relative min-h-[220px]">
              {/* Loader overlay */}
              {regenerating && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs z-50 flex flex-col justify-center items-center gap-3 rounded-3xl animate-fadeIn">
                  <Loader2 className="h-8 w-8 text-indigo-650 dark:text-indigo-400 animate-spin" />
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Regenerating Itinerary...</span>
                </div>
              )}
              <div className="flex justify-between items-center px-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">AI Generator Roadmap</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                    Day-by-Day Journey Planner
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={expandAllDays}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Expand All
                  </button>
                  <span className="text-slate-300 dark:text-slate-800">•</span>
                  <button 
                    onClick={collapseAllDays}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Vertical Timeline Node Chain */}
              <div className="relative border-l-2 border-indigo-100 dark:border-slate-900 ml-4 pl-6 md:pl-8 space-y-6">
                {days.map((day, idx) => {
                  const isExpanded = expandedDays.has(day.dayIndex);
                  return (
                    <motion.div 
                      key={day.dayIndex} 
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      {/* Timeline Dot Badge */}
                      <button 
                        onClick={() => toggleDay(day.dayIndex)}
                        className={`absolute -left-[35px] md:-left-[43px] top-6 w-6 h-6 rounded-full z-10 flex items-center justify-center shadow-md border-2 transition duration-300 cursor-pointer ${
                          isExpanded 
                            ? 'bg-indigo-600 border-indigo-650 text-white shadow-indigo-600/30' 
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-850 text-slate-400 hover:border-indigo-400'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold">{day.dayIndex}</span>
                      </button>

                      {/* Day Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-xs overflow-hidden transition-all duration-350 hover:shadow-md">
                        {/* Day Card Header */}
                        <div 
                          onClick={() => toggleDay(day.dayIndex)}
                          className="flex items-center justify-between p-5 md:p-6 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                        >
                          <div>
                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-extrabold py-0.5 px-2 rounded-md">
                              Day {day.dayIndex}
                            </span>
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg mt-1.5">
                              Explore {day.spotName}
                            </h4>
                          </div>
                          <div className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-slate-100 dark:border-slate-850 overflow-hidden"
                            >
                              <div className="p-6 space-y-6 text-xs sm:text-sm">
                                {/* Morning */}
                                <div className="flex gap-4 items-start text-left">
                                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-550 flex-shrink-0 mt-0.5">
                                    <CloudSun className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Morning Highlights</span>
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1 leading-relaxed">
                                      {day.morningText}
                                    </p>
                                    {day.entryCost > 0 && (
                                      <span className="inline-block text-[9px] bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-md font-bold mt-2">
                                        Entry ticket: ₹{day.entryCost} per traveler
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Lunch */}
                                <div className="flex gap-4 items-start text-left">
                                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-550 flex-shrink-0 mt-0.5">
                                    <Utensils className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Midday dining</span>
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1 leading-relaxed">
                                      Lunch stopover at <strong className="text-slate-800 dark:text-white font-extrabold">{day.dining.restaurantName}</strong>. Recommended specialty: <strong className="text-indigo-650 dark:text-indigo-400">{day.dining.specialty}</strong>.
                                    </p>
                                    <span className="inline-block text-[9px] bg-rose-50 dark:bg-rose-955 border border-rose-100/50 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 py-0.5 px-2 rounded-md font-bold mt-2">
                                      Cost estimate: {day.dining.costForTwo}
                                    </span>
                                  </div>
                                </div>

                                {/* Evening */}
                                <div className="flex gap-4 items-start text-left">
                                  <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl text-sky-550 flex-shrink-0 mt-0.5">
                                    <Compass className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">Evening experience</span>
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1 leading-relaxed">
                                      {day.eveningText}
                                    </p>
                                  </div>
                                </div>

                                {/* Hotel Stay Recommendation */}
                                <div className="flex gap-4 border-t border-slate-100 dark:border-slate-850 pt-5 text-left">
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-550 flex-shrink-0 mt-0.5">
                                    <Landmark className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                      <span className="text-[10px] font-bold text-emerald-550 uppercase tracking-widest block">Night Lodging</span>
                                      <strong className="text-slate-850 dark:text-white font-extrabold text-sm block mt-0.5">{day.hotel.name}</strong>
                                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase block mt-1">Average nightly rate: {day.hotel.priceRange}</span>
                                    </div>
                                    <div className="flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-655 dark:text-indigo-400 px-3 py-1 rounded-xl text-xs font-bold gap-0.5 border border-indigo-100/50 dark:border-indigo-900/30 w-fit">
                                      <Star className="h-3.5 w-3.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-650 dark:text-indigo-400" />
                                      <span>{day.hotel.rating}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Nearby Attractions, Transit & Budget Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-855 pt-5 text-[11px] font-semibold text-left">
                                  {/* Nearby Attractions */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block">Nearby Attractions</span>
                                    <p className="text-slate-650 dark:text-slate-350 leading-normal">
                                      {day.nearbyAttractionsList}
                                    </p>
                                  </div>

                                  {/* Travel Optimization */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-amber-650 dark:text-amber-500 uppercase tracking-widest block">Transit Optimization</span>
                                    <p className="text-slate-655 dark:text-slate-350 leading-normal">
                                      {day.transitOptimization}
                                    </p>
                                  </div>

                                  {/* Daily Cost Breakdown */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-500 uppercase tracking-widest block">Day Est. Budget</span>
                                    <div className="text-slate-655 dark:text-slate-355 space-y-0.5">
                                      <div>Ticket: <span className="font-bold">₹{day.entryCost}</span></div>
                                      <div>Stay: <span className="font-bold">{day.hotel.priceRange.split(' ')[0]}</span></div>
                                      <div>Food: <span className="font-bold">{day.dining.costForTwo.split(' ')[0]}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4 – ROUTE MAP */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Interactive Geography</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                    Smart Transit & Route Map
                  </h3>
                </div>
                {/* Location Detection Controls */}
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl transition duration-300 cursor-pointer shadow-sm text-[10px]"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        Detect My Starting point
                      </>
                    )}
                  </button>
                  {locationName && (
                    <button
                      onClick={clearLocation}
                      className="text-slate-400 hover:text-red-500 font-bold border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer text-[10px]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {locationError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100/30 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Large Route Map Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-md space-y-6">
                
                {locationName && (
                  <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Start Location</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 text-xs truncate block">{locationName}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Road Distance</span>
                      <strong className="text-slate-700 dark:text-slate-200 text-xs block">{totalDistance} km to target</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Estimated Drive Time</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-xs block">{estimatedTravelTime} Hours</strong>
                    </div>
                  </div>
                )}

                {/* Leaflet container */}
                <div className="w-full h-[520px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-850 relative z-10">
                  <MapContainer 
                    center={userCoords ? [userCoords.latitude, userCoords.longitude] : [days[0]?.coordinates.latitude || 20.5937, days[0]?.coordinates.longitude || 78.9629]} 
                    zoom={7} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                    />

                    {/* User Starting location marker */}
                    {userCoords && (
                      <Marker position={[userCoords.latitude, userCoords.longitude]} icon={startLocationIcon}>
                        <Popup>
                          <div className="text-left font-sans text-xs bg-slate-950 text-slate-100 p-1">
                            <strong className="text-indigo-400 block">Starting point</strong>
                            <span>{locationName}</span>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Day Destination markers */}
                    {days.map((d) => (
                      <Marker 
                        key={d.dayIndex} 
                        position={[d.coordinates.latitude, d.coordinates.longitude]}
                        icon={d.dayIndex === 1 ? hotelIcon : destinationIcon}
                      >
                        <Popup>
                          <div className="text-left font-sans text-xs bg-slate-950 text-slate-100 p-1">
                            <span className="font-bold text-indigo-405 block">Day {d.dayIndex} Destination</span>
                            <span className="font-bold text-slate-205 block mt-0.5">{d.spotName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Stay: {d.hotel.name}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Polyline connecting the route */}
                    {routePoints.length > 1 && (
                      <Polyline 
                        positions={routePoints.map(p => [p.latitude, p.longitude])} 
                        color="#4F46E5" 
                        weight={4}
                        dashArray="6, 8"
                      />
                    )}

                    <MapBoundsController points={routePoints} />
                  </MapContainer>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="italic">Map displays: Start Location (green), Day 1 (blue), and Stops (red) with polyline route.</span>
                  
                  {/* Google Maps link */}
                  <a 
                    href={userCoords 
                      ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${days[0]?.coordinates.latitude},${days[0]?.coordinates.longitude}&travelmode=driving`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stateInfo.name + ' tourist attractions')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-650 dark:text-indigo-405 hover:underline"
                  >
                    Open route in Google Maps
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right column (Summary Dashboard and Insights) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* SECTION 5 – TRIP SUMMARY */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Dashboard Summary</span>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-md space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-sm sm:text-base">
                    Estimated Budget Ledger
                  </h4>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/20 py-0.5 px-2 rounded-full font-bold">
                    Regenerated
                  </span>
                </div>

                <div className="text-center py-4 bg-slate-50 dark:bg-slate-955/35 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Total Est. Budget</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-850 dark:text-white mt-1">
                    ₹<AnimatedCounter value={costs.total} />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                    For {duration} Days | {travelerType.toUpperCase()} Group
                  </span>
                </div>

                {/* Costs Breakdown */}
                <div className="space-y-4">
                  {[
                    { label: '🏨 Accommodation', value: costs.accommodation, iconColor: 'text-indigo-500' },
                    { label: '🍽 Food Cost', value: costs.food, iconColor: 'text-rose-500' },
                    { label: '🎟 Entry Fees', value: costs.entry, iconColor: 'text-amber-500' },
                    { label: '🚗 Transport / Fuel', value: costs.transport, iconColor: 'text-purple-500' },
                    { label: '💼 Incidentals & Misc', value: costs.misc, iconColor: 'text-slate-500' }
                  ].map((item, idx) => {
                    const percent = getPercentage(item.value);
                    return (
                      <div key={idx} className="space-y-1.5 text-xs text-left font-semibold">
                        <div className="flex justify-between text-slate-505 dark:text-slate-400">
                          <span className="font-bold">{item.label}</span>
                          <strong className="text-slate-750 dark:text-slate-300">₹{item.value.toLocaleString()} ({percent}%)</strong>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 dark:bg-indigo-550 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dist & Time stats dashboard */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-850 pt-5 text-left">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-1">
                    <span className="text-[9px] text-slate-450 uppercase tracking-widest block font-bold">⏱ Travel Time</span>
                    <strong className="text-slate-805 dark:text-white text-sm sm:text-base">{estimatedTravelTime} Hrs</strong>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-1">
                    <span className="text-[9px] text-slate-455 uppercase tracking-widest block font-bold">📍 Distance</span>
                    <strong className="text-slate-805 dark:text-white text-sm sm:text-base">{totalDistance} km</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6 – LOCAL INSIGHTS */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Local Insights & Guides</span>
              
              {/* Grid of details cards */}
              <div className="space-y-4 text-xs font-semibold">
                {/* Food Specialties */}
                {stateInfo.foodSpecialties && stateInfo.foodSpecialties.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
                    <h4 className="font-extrabold text-slate-855 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
                      <Utensils className="h-4 w-4 text-rose-500" /> Food Specialties
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stateInfo.foodSpecialties.map((food, idx) => (
                        <span key={idx} className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 py-1.5 px-3 rounded-xl">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traveler Tips */}
                {stateInfo.travelTips && stateInfo.travelTips.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
                    <h4 className="font-extrabold text-slate-855 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
                      <Lightbulb className="h-4 w-4 text-amber-500" /> Traveler Tips
                    </h4>
                    <ul className="space-y-2.5 pt-1">
                      {stateInfo.travelTips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-slate-605 dark:text-slate-400 flex items-start leading-relaxed text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 mt-1.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hidden Gems (dynamic) */}
                {hiddenGems.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
                    <h4 className="font-extrabold text-slate-855 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
                      <Sparkles className="h-4 w-4 text-emerald-500" /> Hidden Gems in {stateInfo.name}
                    </h4>
                    <div className="space-y-2 pt-1">
                      {hiddenGems.map(gem => (
                        <Link 
                          key={gem._id}
                          to={`/destination/${gem.slug}`}
                          className="flex justify-between items-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 transition border border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-350"
                        >
                          <span className="font-bold truncate">{gem.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Attractions */}
                {nearbyAttractions.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
                    <h4 className="font-extrabold text-slate-855 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
                      <Compass className="h-4 w-4 text-indigo-500" /> Nearby Attractions
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {nearbyAttractions.map((attr, idx) => (
                        <span key={idx} className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-150/40 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 py-1.5 px-3 rounded-xl text-[10px]">
                          {attr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weather & Season info */}
                <WeatherWidget 
                  placeName={`Popular sites in ${stateInfo.name}`} 
                  stateName={stateInfo.name} 
                  coordinates={places[0]?.coordinates || null} 
                  category="Nature" 
                />

                {/* Local Culture & facts */}
                {stateInfo.facts && stateInfo.facts.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
                    <h4 className="font-extrabold text-slate-855 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
                      <Info className="h-4 w-4 text-sky-500" /> Quick Local Facts
                    </h4>
                    <ul className="space-y-2 pt-1">
                      {stateInfo.facts.slice(0, 2).map((fact, idx) => (
                        <li key={idx} className="text-slate-605 dark:text-slate-400 flex items-start leading-relaxed text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 mt-1.5 flex-shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* SECTION 7 – TOURIST ATTRACTIONS FILTER & GRID */}
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">
                Explore Attractions in {stateInfo.name}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Browse, filter, and search tourist spots individually across the state.</p>
            </div>
            
            {/* Clear Filters indicator */}
            {(selectedCity || selectedCategory) && (
              <button
                onClick={() => { setSelectedCity(''); setSelectedCategory(''); }}
                className="text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-805 font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 shadow-xs border border-slate-200/50 dark:border-slate-800/80 flex flex-col sm:flex-row gap-6">
            {/* City filter drop-down */}
            <div className="w-full sm:w-60 text-left space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Filter By City
              </label>
              <select
                className="w-full p-2.5 bg-slate-100/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">All Popular Cities</option>
                {cities.map(city => (
                  <option key={city._id} value={city._id}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Category pills */}
            <div className="flex-grow text-left space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-indigo-500" /> Filter By Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border select-none ${
                    selectedCategory === '' 
                      ? 'bg-indigo-650 border-indigo-650 text-white shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border select-none ${
                      selectedCategory === cat._id 
                        ? 'bg-indigo-650 border-indigo-650 text-white shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Attraction Places Grid output */}
          {placesLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-800 border-b-indigo-600"></div>
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800/80 shadow-xs">
              <Compass className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-205">No attractions match the filters</h3>
              <p className="text-slate-400 mt-1 max-w-xs mx-auto text-xs font-medium">Try clearing the filters or select another city/category combination.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {places.map(place => (
                <PlaceCard key={place._id} place={place} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StatePage;
