import { useState, useEffect } from 'react';
import { 
  Calculator, Users, Calendar, Car, Hotel, Utensils, 
  Coins, Wallet, Sparkles, MapPin, Landmark, ArrowRight
} from 'lucide-react';

const TripBudgetCalculator = ({ 
  destinationName = "Destination", 
  baseEntryFees = null, 
  destCoords = null,
  initialDuration = 3,
  initialTravelers = 2,
  initialBudgetCategory = 'Mid-Range'
}) => {
  const [source, setSource] = useState('');
  const [duration, setDuration] = useState(initialDuration);
  const [travelers, setTravelers] = useState(initialTravelers);
  const [transportMode, setTransportMode] = useState('Train');
  const [budgetCategory, setBudgetCategory] = useState(initialBudgetCategory);

  // Sync state if initial props change
  useEffect(() => {
    setDuration(initialDuration);
  }, [initialDuration]);

  useEffect(() => {
    setTravelers(initialTravelers);
  }, [initialTravelers]);

  useEffect(() => {
    setBudgetCategory(initialBudgetCategory);
  }, [initialBudgetCategory]);

  // Load user detected city if available on mount
  useEffect(() => {
    const storedCity = localStorage.getItem('userCity');
    const storedState = localStorage.getItem('userState');
    if (storedCity) {
      setSource(`${storedCity}, ${storedState || ''}`);
    } else {
      setSource('Delhi');
    }
  }, []);

  const handleUseMyLocation = () => {
    const storedCity = localStorage.getItem('userCity');
    const storedState = localStorage.getItem('userState');
    if (storedCity) {
      setSource(`${storedCity}, ${storedState || ''}`);
    } else {
      setSource('Your detected location');
    }
  };

  // Estimate distance in km between source and destination coordinates
  const getDistanceEstimate = () => {
    // If we have destination coordinates and user starting coordinates, calculate geodesic distance
    const userLat = parseFloat(localStorage.getItem('userLat'));
    const userLng = parseFloat(localStorage.getItem('userLng'));
    const destLat = destCoords?.latitude;
    const destLng = destCoords?.longitude;

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
      return Math.round(R * c * 1.24); // with winding factor
    }

    // Default distance estimate based on major cities fallback
    return 650; 
  };

  const distance = getDistanceEstimate();

  // Budget calculations
  const calculateCosts = () => {
    const roomRates = { 'Budget': 1500, 'Mid-Range': 3800, 'Luxury': 14000 };
    const foodRates = { 'Budget': 350, 'Mid-Range': 850, 'Luxury': 2100 };
    const miscRates = { 'Budget': 150, 'Mid-Range': 450, 'Luxury': 1200 };
    const activityRates = { 'Budget': 100, 'Mid-Range': 300, 'Luxury': 1000 };

    // Accommodation (assumes 1 room per 2 travelers)
    const roomsCount = Math.ceil(travelers / 2);
    const accommodationCost = roomRates[budgetCategory] * roomsCount * duration;

    // Food
    const foodCost = foodRates[budgetCategory] * travelers * duration;

    // Entry Fees
    const adultFee = baseEntryFees?.adult || 40;
    const entryFeesCost = adultFee * travelers;

    // Activities
    const activitiesCost = activityRates[budgetCategory] * travelers * duration;

    // Incidental/Misc
    const miscCost = miscRates[budgetCategory] * travelers * duration;

    // Transport Cost Calculation
    let transportCost = 0;
    if (transportMode === 'Car') {
      const fuelCost = distance * 7.8;
      const tollCost = distance > 200 ? distance * 1.15 : 0;
      transportCost = Math.round(fuelCost + tollCost);
    } else if (transportMode === 'Train') {
      const baseTrainTicket = distance * 1.6;
      transportCost = Math.round(baseTrainTicket * travelers);
    } else if (transportMode === 'Flight') {
      const baseFlightTicket = distance > 250 ? (distance * 4.2 + 2000) : 4500;
      transportCost = Math.round(baseFlightTicket * travelers);
    } else if (transportMode === 'Bus') {
      const baseBusTicket = distance * 1.95;
      transportCost = Math.round(baseBusTicket * travelers);
    }

    const total = transportCost + accommodationCost + foodCost + entryFeesCost + activitiesCost + miscCost;
    
    return {
      transport: transportCost,
      accommodation: accommodationCost,
      food: foodCost,
      entry: entryFeesCost,
      activities: activitiesCost,
      misc: miscCost,
      total,
      perPerson: Math.round(total / travelers),
      daily: Math.round(total / duration)
    };
  };

  const costs = calculateCosts();

  // Compute percentage for visually appealing bar charts
  const getPercentage = (costValue) => {
    return Math.min(Math.round((costValue / costs.total) * 100), 100);
  };

  return (
    <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm text-left space-y-6">
      
      <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Calculator className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Smart Trip Budget Calculator</h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Customize preferences to simulate live trip costs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Input Fields Column */}
        <div className="md:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Source */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between">
                <span>Source Location</span>
                <button 
                  onClick={handleUseMyLocation} 
                  className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] hover:underline cursor-pointer"
                >
                  📍 Use My Location
                </button>
              </label>
              <input 
                type="text" 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Chennai, Delhi"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-slate-300 text-xs font-bold"
              />
            </div>

            {/* Destination */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destination</label>
              <input 
                type="text" 
                value={destinationName} 
                disabled 
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed"
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Duration Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-450">
                <span>Trip Duration</span>
                <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/10 px-2.5 py-0.5 rounded-lg text-[10px]">{duration} Days</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="14" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              />
            </div>

            {/* Travelers Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-450">
                <span>Number of Travelers</span>
                <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/10 px-2.5 py-0.5 rounded-lg text-[10px]">{travelers} Traveler{travelers > 1 ? 's' : ''}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={travelers} 
                onChange={(e) => setTravelers(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              />
            </div>
          </div>

          {/* Segmented Controls for Mode & Tier */}
          <div className="space-y-4">
            {/* Transport Mode */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Transport Mode</span>
              <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-250 dark:border-slate-800">
                {['Car', 'Train', 'Flight', 'Bus'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTransportMode(mode)}
                    className={`py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${
                      transportMode === mode 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100/10' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Budget Category</span>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-250 dark:border-slate-800">
                {['Budget', 'Mid-Range', 'Luxury'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setBudgetCategory(level)}
                    className={`py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${
                      budgetCategory === level 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100/10' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Cost Summary Column */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-900 rounded-3xl p-5 md:p-6 space-y-5 text-center flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Total Estimated Budget</span>
            <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                ₹{costs.total.toLocaleString()}
              </span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">For {travelers} traveler{travelers > 1 ? 's' : ''} | {duration} days</p>
            </div>

            {/* Unit cost cards */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-405 block uppercase tracking-wider">Per Person</span>
                <strong className="text-slate-805 dark:text-slate-200 text-xs sm:text-sm">₹{costs.perPerson.toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-405 block uppercase tracking-wider">Daily Cost</span>
                <strong className="text-slate-805 dark:text-slate-200 text-xs sm:text-sm">₹{costs.daily.toLocaleString()}</strong>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-3 pt-2">
              {[
                { label: 'Transportation', value: costs.transport, icon: <Car className="h-3.5 w-3.5 text-indigo-500" /> },
                { label: 'Accommodation', value: costs.accommodation, icon: <Hotel className="h-3.5 w-3.5 text-emerald-500" /> },
                { label: 'Food & Dining', value: costs.food, icon: <Utensils className="h-3.5 w-3.5 text-sky-500" /> },
                { label: 'Entry Tickets', value: costs.entry, icon: <Coins className="h-3.5 w-3.5 text-amber-500" /> },
                { label: 'Activities & Sightseeing', value: costs.activities, icon: <Landmark className="h-3.5 w-3.5 text-purple-500" /> },
                { label: 'Miscellaneous', value: costs.misc, icon: <Wallet className="h-3.5 w-3.5 text-slate-400" /> }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      {item.icon}
                      {item.label}
                    </span>
                    <strong className="text-slate-700 dark:text-slate-350">₹{item.value.toLocaleString()} ({getPercentage(item.value)}%)</strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-550 h-full rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(item.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default TripBudgetCalculator;
