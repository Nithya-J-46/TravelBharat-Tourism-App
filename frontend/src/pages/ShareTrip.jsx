import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Calendar, Coins, Compass, Clock, ArrowRight,
  Eye, FileText, Check, AlertCircle, Share2, Plus, ArrowLeft, Star
} from 'lucide-react';
import destinationImages from '../assets/destinationImages.json';

// Leaflet marker configuration fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ShareTrip = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No trip plan parameter found. Make sure you have a valid share link.');
      return;
    }

    try {
      // Decode Base64
      const decodedString = decodeURIComponent(escape(atob(dataParam)));
      const parsed = JSON.parse(decodedString);
      
      // Remap fields to match dashboard structure
      const remappedTrip = {
        id: parsed.id || Date.now(),
        name: parsed.name || 'Shared Custom Plan',
        destinationName: parsed.dest || 'India',
        stateName: parsed.state || 'India',
        duration: parsed.dur || 3,
        budgetCategory: parsed.bud || 'Mid-range',
        travelStyle: parsed.style || 'Sightseeing',
        travelerType: parsed.type || 'solo',
        estimatedCost: parsed.cost || 15000,
        status: 'Planning',
        dateCreated: new Date().toLocaleDateString(),
        itinerary: parsed.itin || [],
        routeInfo: parsed.itin?.map(d => d.coordinates).filter(Boolean) || []
      };

      setTrip(remappedTrip);
    } catch (e) {
      console.error(e);
      setError('Failed to parse the shared trip plan. The link may be corrupt.');
    }
  }, [searchParams]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Get photo from registry
  const getTripImageUrl = () => {
    if (!trip) return '';
    const dest = trip.destinationName;
    const state = trip.stateName;

    if (dest && destinationImages[dest] && destinationImages[dest].length > 0) {
      return `https://images.unsplash.com/photo-${destinationImages[dest][0]}?auto=format&fit=crop&w=1200&q=80`;
    }
    if (state && destinationImages[state] && destinationImages[state].length > 0) {
      return `https://images.unsplash.com/photo-${destinationImages[state][0]}?auto=format&fit=crop&w=1200&q=80`;
    }
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80'; // Taj Mahal default
  };

  // Save shared trip to local trips
  const handleSaveToDashboard = () => {
    if (!trip) return;
    
    const savedTrips = localStorage.getItem('travelbharat_trips');
    let tripList = [];
    if (savedTrips) {
      try { tripList = JSON.parse(savedTrips); } catch(e){}
    }
    
    // Add unique ID to prevent overlap
    const newTrip = {
      ...trip,
      id: Date.now(),
      name: `${trip.name} (Shared)`
    };

    localStorage.setItem('travelbharat_trips', JSON.stringify([newTrip, ...tripList]));
    setSaveSuccess(true);
    showToast('Trip saved to your Dashboard!');
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-xl space-y-4">
        <AlertCircle className="h-14 w-14 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-850 dark:text-white">Invalid Share Link</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{error}</p>
        <button 
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 bg-indigo-650 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </button>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-left">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-2xl shadow-xl flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        
        {/* Back navigation */}
        <div className="flex justify-between items-center print:hidden">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleSaveToDashboard}
              disabled={saveSuccess}
              className={`inline-flex items-center gap-1.5 font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition cursor-pointer select-none ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-650 hover:bg-indigo-750 text-white'
              }`}
            >
              {saveSuccess ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saveSuccess ? 'Saved to My Trips' : 'Save to My Trips'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-205 border border-slate-200 dark:border-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer select-none"
            >
              <FileText className="h-4 w-4 text-indigo-500" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Hero Header Area */}
        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-lg border border-slate-200/40 dark:border-slate-800/40">
          <img 
            src={getTripImageUrl()} 
            alt={trip.destinationName} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="space-y-2">
              <span className="bg-indigo-650/90 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full w-fit inline-block">
                Shared Itinerary
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {trip.name}
              </h1>
              <p className="text-sm font-semibold text-slate-300 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-indigo-400" />
                {trip.destinationName}, {trip.stateName}
              </p>
            </div>
          </div>
        </div>

        {/* Information stats banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-250/50 dark:border-slate-850/80 shadow-md">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Duration</span>
            <div className="text-base font-extrabold text-slate-800 dark:text-white">{trip.duration} Days</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Budget level</span>
            <div className="text-base font-extrabold text-slate-850 dark:text-white capitalize">{trip.budgetCategory}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Travel style</span>
            <div className="text-base font-extrabold text-slate-850 dark:text-white capitalize">{trip.travelStyle}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Estimated Cost</span>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">₹{trip.estimatedCost.toLocaleString()}</div>
          </div>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Day itinerary timeline (Left Column 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-lg font-black text-slate-850 dark:text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-indigo-500" />
              Day-by-Day Journey Planner
            </h3>

            {trip.itinerary && trip.itinerary.length > 0 ? (
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
                {trip.itinerary.map(day => (
                  <div key={day.dayIndex} className="relative space-y-2 text-xs">
                    <div className="absolute -left-[31px] top-1.5 bg-indigo-600 border border-indigo-650 w-3 h-3 rounded-full"></div>
                    <div>
                      <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase">Day {day.dayIndex} - {day.spotName}</span>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 mt-2 space-y-3 shadow-xs">
                        <div className="flex gap-2.5 items-start">
                          <span className="text-amber-500 font-bold flex-shrink-0">🌅 Morning:</span>
                          <span className="text-slate-655 dark:text-slate-350 leading-relaxed font-medium">{day.morningText}</span>
                        </div>
                        
                        {day.dining && (
                          <div className="flex gap-2.5 items-start">
                            <span className="text-rose-500 font-bold flex-shrink-0">🍴 Lunch:</span>
                            <span className="text-slate-655 dark:text-slate-350 leading-relaxed font-medium">
                              Enjoy local food specialty at <strong>{day.dining.restaurantName}</strong> ({day.dining.specialty}, Cost: {day.dining.costForTwo}).
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2.5 items-start">
                          <span className="text-sky-555 font-bold flex-shrink-0">🌇 Evening:</span>
                          <span className="text-slate-655 dark:text-slate-350 leading-relaxed font-medium">{day.eveningText}</span>
                        </div>

                        {day.hotel && (
                          <div className="flex gap-2.5 items-start border-t border-slate-100 dark:border-slate-850/60 pt-3">
                            <span className="text-emerald-500 font-bold flex-shrink-0">🏨 Lodging:</span>
                            <span className="text-slate-655 dark:text-slate-350 leading-relaxed font-medium">
                              Stay at <strong>{day.hotel.name}</strong> ({day.hotel.priceRange}, Rating: {day.hotel.rating}★).
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-semibold text-xs">
                No day-by-day plan saved.
              </div>
            )}
          </div>

          {/* Map & Budget details (Right Column 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Map Container */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Itinerary Route Map</h4>
                <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-inner z-10 relative">
                  <MapContainer 
                    center={trip.itinerary[0]?.coordinates ? [trip.itinerary[0].coordinates.latitude, trip.itinerary[0].coordinates.longitude] : [20.5937, 78.9629]} 
                    zoom={7} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {trip.itinerary.map((day, idx) => {
                      if (!day.coordinates) return null;
                      return (
                        <Marker 
                          key={idx} 
                          position={[day.coordinates.latitude, day.coordinates.longitude]}
                        >
                          <Popup>
                            <div className="text-left font-bold text-xs">
                              <span className="text-indigo-600 block">Day {day.dayIndex}</span>
                              {day.spotName}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {trip.itinerary.length > 1 && (
                      <Polyline 
                        positions={trip.itinerary.map(d => d.coordinates ? [d.coordinates.latitude, d.coordinates.longitude] : null).filter(Boolean)} 
                        color="#4f46e5" 
                        weight={3.5}
                        dashArray="5, 8"
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Budget ledger overview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4 text-xs font-semibold">
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Estimated Budget Ledger</h4>
              
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-1">
                    <span>Accommodation Stay (40%)</span>
                    <strong className="text-slate-800 dark:text-slate-200">₹{Math.round(trip.estimatedCost * 0.40).toLocaleString()}</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-1">
                    <span>Transport Transit (25%)</span>
                    <strong className="text-slate-800 dark:text-slate-200">₹{Math.round(trip.estimatedCost * 0.25).toLocaleString()}</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-1">
                    <span>Food Specialties & Dining (20%)</span>
                    <strong className="text-slate-800 dark:text-slate-200">₹{Math.round(trip.estimatedCost * 0.20).toLocaleString()}</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-1">
                    <span>Tickets & Incidentals (15%)</span>
                    <strong className="text-slate-800 dark:text-slate-200">₹{Math.round(trip.estimatedCost * 0.15).toLocaleString()}</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ShareTrip;
