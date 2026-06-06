import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, MapPin, Loader2, CheckCircle, AlertCircle, 
  Car, Train, Plane, Bus, Compass, ExternalLink, Clock, Coins, 
  Milestone, X, Plus, Info, Sparkles
} from 'lucide-react';
import axios from 'axios';

// Zero-network custom SVG markers to replace broken external PNG assets
const getCustomIcon = (type, active = false) => {
  let color = '#4F46E5'; // Indigo default (User Location)
  let iconContent = '';

  if (type === 'start') {
    color = '#3B82F6'; // Sky Blue
    iconContent = `
      <circle cx="15" cy="15" r="7" fill="#FFFFFF"/>
      <circle cx="15" cy="15" r="4.5" fill="${color}"/>
    `;
  } else if (type === 'destination') {
    color = '#EF4444'; // Crimson Red
    iconContent = `
      <path d="M15 8L16.8 11.8L21 12.4L18 15.3L18.7 19.5L15 17.5L11.3 19.5L12 15.3L9 12.4L13.2 11.8L15 8Z" fill="#FFFFFF"/>
    `;
  } else if (type === 'attraction') {
    color = '#F59E0B'; // Amber Gold
    iconContent = `
      <circle cx="15" cy="15" r="6" fill="#FFFFFF"/>
      <path d="M13 13H17V17H13V13Z" fill="${color}"/>
    `;
  }

  const activeScale = active ? 'scale-125' : 'hover:scale-115';

  return L.divIcon({
    html: `
      <div class="custom-marker-container transition-all duration-300 transform ${activeScale}" style="width: 30px; height: 42px; display: flex; justify-content: center; align-items: center;">
        <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3));">
          <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="${color}"/>
          <circle cx="15" cy="15" r="10.5" fill="none" stroke="white" stroke-width="1.2" stroke-opacity="0.4"/>
          ${iconContent}
        </svg>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

// Map controller to automatically center, resize, and fit bounds
const MapBoundsController = ({ userCoords, destCoords, attractions, activeMode }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size to recalculate container bounds and avoid blank area bug
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const bounds = [];
    if (userCoords?.latitude && userCoords?.longitude) {
      bounds.push([userCoords.latitude, userCoords.longitude]);
    }
    if (destCoords?.latitude && destCoords?.longitude) {
      bounds.push([destCoords.latitude, destCoords.longitude]);
    }
    if (attractions && attractions.length > 0) {
      attractions.forEach(attr => {
        if (attr.latitude && attr.longitude) {
          bounds.push([attr.latitude, attr.longitude]);
        }
      });
    }

    if (bounds.length > 0) {
      const boundsTimer = setTimeout(() => {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
      }, 250);
      return () => {
        clearTimeout(resizeTimer);
        clearTimeout(boundsTimer);
      };
    }
    return () => clearTimeout(resizeTimer);
  }, [map, userCoords, destCoords, attractions, activeMode]);

  return null;
};

const SmartRoutePlanner = ({ destinationName = "Destination", destCoords = null, nearbyAttractions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [error, setError] = useState('');
  const [activeMode, setActiveMode] = useState('car'); // 'car', 'bus', 'train', 'flight'
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Load stored starting location on mount
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

  // Show Toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError('');

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
          let state = address?.state || 'Unknown State';
          state = state.replace('State of ', '').trim();
          city = city.trim();

          localStorage.setItem('userCity', city);
          localStorage.setItem('userState', state);
          localStorage.setItem('userLat', latitude.toString());
          localStorage.setItem('userLng', longitude.toString());

          setLocationName(`${city}, ${state}`);
          triggerToast('Location detected successfully!');
        } catch (err) {
          console.warn('Geocoding failed, using coordinates directly.', err);
          setLocationName(`Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`);
          triggerToast('Coordinates matched directly!');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Permission denied or timeout. Please enable location access.');
        setLoading(false);
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
    setSelectedMarker(null);
    triggerToast('Starting location cleared.');
  };

  // Compute Haversine distance
  const getHaversineDistance = () => {
    if (!userCoords || !destCoords) return null;
    const lat1 = userCoords.latitude;
    const lon1 = userCoords.longitude;
    const lat2 = destCoords.latitude;
    const lon2 = destCoords.longitude;

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

  const geoDistance = getHaversineDistance();

  // Multi-transport calculation
  const getTransportDetails = () => {
    if (!geoDistance) return null;

    const roadDist = Math.round(geoDistance * 1.24);
    const trainDist = Math.round(geoDistance * 1.18);
    const airDist = Math.round(geoDistance);

    const carTime = (roadDist / 55).toFixed(1);
    const carFuel = Math.round(roadDist * 7.8);
    const carTolls = roadDist > 200 ? Math.round(roadDist * 1.15) : 0;
    const carCost = carFuel + carTolls;

    const trainTime = (trainDist / 60).toFixed(1);
    const trainCost = Math.round(trainDist * 1.6);

    const isFlightViable = geoDistance > 250;
    const flightTime = isFlightViable ? (airDist / 650 + 1.25).toFixed(1) : 'N/A';
    const flightCost = isFlightViable ? Math.round(airDist * 4.2 + 2000) : 'N/A';

    const busTime = (roadDist / 42).toFixed(1);
    const busCost = Math.round(roadDist * 1.95);

    return {
      car: { name: 'Car', distance: roadDist, time: carTime, cost: carCost, details: 'Fuel & Tolls estimate' },
      train: { name: 'Train', distance: trainDist, time: trainTime, cost: trainCost, details: 'AC 3-Tier seat ticket' },
      flight: { name: 'Flight', distance: airDist, time: flightTime, cost: flightCost, viable: isFlightViable, details: 'Direct/Connecting airfare' },
      bus: { name: 'Bus', distance: roadDist, time: busTime, cost: busCost, details: 'Volvo AC Sleeper ticket' }
    };
  };

  const transportData = getTransportDetails();

  const destLat = destCoords?.latitude || 20.5937;
  const destLng = destCoords?.longitude || 78.9629;

  // Map attractions coords with deterministic offsets
  const mappedAttractions = (nearbyAttractions || []).slice(0, 3).map((name, index) => {
    const latOffset = (Math.sin(index * 2.5) * 0.018) + 0.01;
    const lngOffset = (Math.cos(index * 2.5) * 0.018) + 0.01;
    return {
      name,
      latitude: destLat + latOffset,
      longitude: destLng + lngOffset
    };
  });

  // Curved Flight trajectory helper
  const getFlightArcPoints = (start, end) => {
    if (!start || !end) return [];
    const points = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * t;
      const lon = start.longitude + (end.longitude - start.longitude) * t;
      
      // Arc curve logic
      const h = Math.sin(t * Math.PI) * (Math.abs(end.latitude - start.latitude) + Math.abs(end.longitude - start.longitude)) * 0.12;
      points.push([lat + h, lon + h]);
    }
    return points;
  };

  const polylinePositions = userCoords && destCoords 
    ? (activeMode === 'flight' 
        ? getFlightArcPoints(userCoords, { latitude: destLat, longitude: destLng })
        : [[userCoords.latitude, userCoords.longitude], [destLat, destLng]])
    : [];

  const handleMarkerClick = (type, data) => {
    if (type === 'start') {
      setSelectedMarker({
        name: locationName || 'Starting Location',
        type: 'start',
        description: 'Your detected departure point for this journey. Adjustments can be managed via Geolocation detection.',
        bestTime: 'Year-round',
        timings: 'Open 24/7',
        price: 'Free',
        category: 'Origin Hub'
      });
    } else if (type === 'destination') {
      setSelectedMarker({
        name: destinationName,
        type: 'destination',
        description: `Your main travel destination. Explore historic monuments, local cultures, and iconic culinary spots in the region.`,
        bestTime: 'October to March (Pleasant Weather)',
        timings: '8:00 AM - 6:00 PM (Daily)',
        price: '₹50 (Indians) | ₹600 (Foreigners)',
        category: 'Primary Destination'
      });
    } else if (type === 'attraction') {
      setSelectedMarker({
        name: data.name,
        type: 'attraction',
        description: `A highly-recommended local sightseeing spot near ${destinationName}. Known for scenic views, cultural heritage, and photography.`,
        bestTime: 'October to April',
        timings: '9:00 AM - 5:30 PM',
        price: '₹20 Entry Fee',
        category: 'Local Attraction Point'
      });
    }
  };

  // Add to trip handler
  const handleAddToTrip = (marker) => {
    if (!marker) return;
    
    // Save to local storage trip planner itinerary
    const savedItinerary = localStorage.getItem('travelbharat_itinerary');
    let list = [];
    if (savedItinerary) {
      try {
        list = JSON.parse(savedItinerary);
      } catch (e) {}
    }
    
    if (!list.some(item => item.name === marker.name)) {
      list.push({
        name: marker.name,
        category: marker.category,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem('travelbharat_itinerary', JSON.stringify(list));
      triggerToast(`"${marker.name}" added to itinerary!`);
    } else {
      triggerToast(`"${marker.name}" is already in your itinerary.`);
    }
  };

  // Timeline segment compiler
  const getTimelineSegments = () => {
    if (!userCoords || !transportData) return [];
    
    const segments = [];
    let prevName = locationName || 'Starting Location';
    
    // Leg 1: User to first attraction (or destination)
    if (mappedAttractions.length > 0) {
      segments.push({
        from: prevName,
        to: mappedAttractions[0].name,
        distance: transportData[activeMode].distance,
        time: `${transportData[activeMode].time} Hrs`,
        mode: activeMode,
        isPrimary: true
      });
      prevName = mappedAttractions[0].name;
    } else {
      segments.push({
        from: prevName,
        to: destinationName,
        distance: transportData[activeMode].distance,
        time: `${transportData[activeMode].time} Hrs`,
        mode: activeMode,
        isPrimary: true
      });
      return segments;
    }

    // Local Legs between attractions
    for (let i = 1; i < mappedAttractions.length; i++) {
      const current = mappedAttractions[i];
      const localDist = parseFloat((4.5 + i * 1.8).toFixed(1));
      const localTime = Math.round(localDist * 2.2); // mins
      segments.push({
        from: prevName,
        to: current.name,
        distance: localDist,
        time: `${localTime} mins`,
        mode: 'cab',
        isPrimary: false
      });
      prevName = current.name;
    }

    // Final Leg: Last attraction to Destination center
    segments.push({
      from: prevName,
      to: destinationName,
      distance: 3.5,
      time: '8 mins',
      mode: 'cab',
      isPrimary: false
    });

    return segments;
  };

  const timelineSegments = getTimelineSegments();

  const mapsDirUrl = userCoords 
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${destLat},${destLng}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationName)}`;

  // Transport details card helper
  const getModeIcon = (mode) => {
    switch (mode) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'bus': return <Bus className="h-4 w-4" />;
      case 'train': return <Train className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  return (
    <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-xl text-left space-y-6 relative overflow-hidden">
      
      {/* Stylesheet Injection */}
      <style>{`
        .dark .leaflet-tile-container {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
        }
        .leaflet-container {
          background-color: #0f172a !important;
          font-family: inherit;
        }
        .dark .leaflet-container {
          background-color: #020617 !important;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .route-line-car {
          stroke-dasharray: 8, 8;
          animation: dash 2.5s linear infinite;
        }
        .route-line-bus {
          stroke-dasharray: 10, 6;
          animation: dash 3.5s linear infinite;
        }
        .route-line-train {
          stroke-dasharray: 5, 10;
          animation: dash 4s linear infinite;
        }
        .route-line-flight {
          stroke-dasharray: 12, 12;
          animation: dash 1.5s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 py-2.5 px-6 rounded-2xl text-xs font-bold shadow-2xl border border-white/10 dark:border-slate-200/20 z-50 flex items-center gap-2 animate-bounce-subtle">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Compass className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              Smart Route Planner
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Detect starting position to calculate distance & transit times.</p>
          </div>
        </div>

        {/* Location Detection Controls */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                📍 Current Location
              </>
            )}
          </button>
          {locationName && (
            <button
              onClick={clearLocation}
              className="text-slate-500 hover:text-red-500 font-bold border border-slate-200 dark:border-slate-800 px-3.5 rounded-xl transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100/30 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Route Info Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fadeIn">
        {/* Start Location Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Start Location</span>
            <MapPin className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
            {locationName || "Pending Setup"}
          </p>
        </div>

        {/* Destination Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Destination</span>
            <Compass className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
            {destinationName}
          </p>
        </div>

        {/* Distance Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Distance</span>
            <Milestone className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            {transportData ? `${transportData[activeMode].distance} km` : '--'}
          </p>
        </div>

        {/* Duration Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. Travel Time</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            {transportData ? `${transportData[activeMode].time} hours` : '--'}
          </p>
        </div>

        {/* Recommended transport Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Recommended Mode</span>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xs font-extrabold text-emerald-650 dark:text-emerald-450">
            {geoDistance ? (geoDistance > 450 ? 'Flight' : geoDistance > 150 ? 'Train' : 'Road Drive') : '--'}
          </p>
        </div>

        {/* Travel Cost Card */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. Travel Cost</span>
            <Coins className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            {transportData ? (typeof transportData[activeMode].cost === 'number' ? `₹${transportData[activeMode].cost.toLocaleString()}` : 'N/A') : '--'}
          </p>
        </div>
      </div>

      {/* Modern Transport Switcher */}
      <div className="bg-slate-100/60 dark:bg-slate-950/40 p-1.5 rounded-2xl flex gap-1 border border-slate-200/30 dark:border-slate-800/40">
        {[
          { id: 'car', name: 'Car / Drive', icon: Car },
          { id: 'bus', name: 'Bus Transit', icon: Bus },
          { id: 'train', name: 'Train / Rail', icon: Train },
          { id: 'flight', name: 'Flight / Air', icon: Plane }
        ].map(mode => {
          const isSelected = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id);
                triggerToast(`Switched route calculations to ${mode.name}`);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-lg shadow-indigo-500/20 scale-102' 
                  : 'text-slate-705 text-slate-700 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <mode.icon className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Map + Sidebar Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Full-Width Map Container */}
        <div className="lg:col-span-8 w-full h-[450px] rounded-3xl overflow-hidden shadow-lg border border-slate-200/40 dark:border-slate-800/40 relative z-10">
          <MapContainer 
            center={userCoords ? [userCoords.latitude, userCoords.longitude] : [destLat, destLng]} 
            zoom={userCoords ? 6 : 10} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Starting Position Marker */}
            {userCoords && (
              <Marker 
                position={[userCoords.latitude, userCoords.longitude]} 
                icon={getCustomIcon('start', selectedMarker?.type === 'start')}
                eventHandlers={{ click: () => handleMarkerClick('start') }}
              />
            )}

            {/* Target Destination Marker */}
            <Marker 
              position={[destLat, destLng]} 
              icon={getCustomIcon('destination', selectedMarker?.type === 'destination')}
              eventHandlers={{ click: () => handleMarkerClick('destination') }}
            />

            {/* Attractions (Stops) Markers */}
            {mappedAttractions.map((attr, idx) => (
              <Marker 
                key={idx} 
                position={[attr.latitude, attr.longitude]} 
                icon={getCustomIcon('attraction', selectedMarker?.name === attr.name)}
                eventHandlers={{ click: () => handleMarkerClick('attraction', attr) }}
              />
            ))}

            {/* Polyline Trajectory line */}
            {userCoords && (
              <Polyline 
                positions={polylinePositions} 
                pathOptions={{ 
                  color: activeMode === 'flight' ? '#8B5CF6' : activeMode === 'train' ? '#10B981' : '#4F46E5',
                  weight: 4.5,
                  className: `route-line-${activeMode}`
                }} 
              />
            )}

            {/* Bounds Controller */}
            <MapBoundsController 
              userCoords={userCoords} 
              destCoords={destCoords} 
              attractions={mappedAttractions} 
              activeMode={activeMode}
            />
          </MapContainer>
        </div>

        {/* Dashboard Right Sidebar (Details / Timeline) */}
        <div className="lg:col-span-4 flex flex-col justify-between min-h-[450px] max-h-[450px] overflow-y-auto no-scrollbar glass-card p-5 border border-slate-200/40 dark:border-slate-800/40 rounded-3xl bg-white/70 dark:bg-slate-900/60 shadow-md">
          
          {/* Card Header */}
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-center flex-shrink-0">
            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
              {selectedMarker ? (
                <>
                  <Info className="h-4.5 w-4.5 text-indigo-500" />
                  Point Insights
                </>
              ) : (
                <>
                  <Navigation className="h-4.5 w-4.5 text-indigo-500" />
                  Route Timeline
                </>
              )}
            </h4>
            {selectedMarker && (
              <button 
                onClick={() => setSelectedMarker(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dynamic Sidebar Content */}
          <div className="flex-1 py-4 overflow-y-auto no-scrollbar">
            {selectedMarker ? (
              /* Clicked Marker Details View */
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <span className="inline-block bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 border border-indigo-100/20 dark:border-indigo-900/20">
                    {selectedMarker.category}
                  </span>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug">{selectedMarker.name}</h3>
                </div>

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {selectedMarker.description}
                </p>

                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/20 dark:border-slate-850 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-slate-400">Best Season</span>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{selectedMarker.bestTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-slate-400">Timings</span>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{selectedMarker.timings}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-slate-400">Ticket Cost</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMarker.price}</span>
                  </div>
                </div>

                {selectedMarker.type !== 'start' && (
                  <button
                    onClick={() => handleAddToTrip(selectedMarker)}
                    className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md text-xs uppercase tracking-wider transition cursor-pointer gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add To Trip
                  </button>
                )}
              </div>
            ) : (
              /* Timeline Mode (Default) */
              userCoords ? (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sequence of Transit Stops</p>
                  
                  <div className="relative pl-6 space-y-6">
                    {/* Line backdrop */}
                    <div className="absolute top-2 bottom-2 left-[11px] w-0.5 border-l-2 border-dashed border-slate-200 dark:border-slate-800 z-0"></div>

                    {/* Timeline items rendering */}
                    {timelineSegments.map((seg, idx) => (
                      <div key={idx} className="relative z-10 space-y-1.5 group">
                        
                        {/* Bullet Marker indicator */}
                        <div className={`absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-slate-950 shadow-sm transition-transform duration-300 group-hover:scale-120 ${
                          seg.isPrimary 
                            ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
                            : 'border-amber-500 ring-4 ring-amber-500/10'
                        }`}></div>

                        <div className="text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {seg.from}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Departure Point</span>
                        </div>

                        {/* Segment Connection box */}
                        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/20 dark:border-slate-850 p-2.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-xs">
                          <span className="flex items-center gap-1.5">
                            {getModeIcon(seg.mode)}
                            <span className="capitalize">{seg.mode === 'cab' ? 'Local Cab' : seg.mode} Segment</span>
                          </span>
                          <span>{seg.distance} km ({seg.time})</span>
                        </div>
                      </div>
                    ))}

                    {/* Final Destination Center Stop */}
                    <div className="relative z-10 space-y-0.5">
                      <div className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-white dark:bg-slate-950 shadow-sm ring-4 ring-red-500/10"></div>
                      <div className="text-xs">
                        <p className="font-extrabold text-slate-800 dark:text-slate-100">{destinationName}</p>
                        <span className="text-[10px] text-red-500 font-bold block mt-0.5">Final Stopover</span>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* Prompt to load location */
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <MapPin className="h-10 w-10 text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-relaxed">
                    Transit Timeline Inactive
                  </p>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold mt-1 max-w-[200px]">
                    Use "Current Location" to compile segment-by-segment journey timeline.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Sidebar Footer redirect button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex-shrink-0">
            <a 
              href={mapsDirUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold py-2 px-3.5 rounded-xl shadow-md text-xs uppercase tracking-wider transition cursor-pointer gap-1.5"
            >
              Open External Navigation
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>

      </div>

      {/* Map visual legend info */}
      <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-bold italic pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Start
          <span className="w-2 h-2 rounded-full bg-red-500" /> Destination
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Stops
        </span>
        <span>Map click toggles markers description.</span>
      </div>

    </div>
  );
};

export default SmartRoutePlanner;
