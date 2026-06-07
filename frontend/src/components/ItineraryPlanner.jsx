import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Sparkles, Briefcase, Wallet, Users, Printer, Bookmark, 
  MapPin, ArrowRight, Utensils, Hotel, Compass, Info, Check, Star,
  Activity, Sun, Heart, Camera, Car, Shield, Footprints, Coins, Navigation,
  Calculator, Clock, Award, HelpCircle, ChevronDown, ChevronUp, Coffee, Loader2
} from 'lucide-react';
import TripBudgetCalculator from './TripBudgetCalculator';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from './WeatherWidget';

// Fix Leaflet default marker icons issue in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Map Marker Icons
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

// Component to dynamically fit map boundaries to include all itinerary markers
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

// Animated rolling counter helper component
const AnimatedCounter = ({ value, duration = 800 }) => {
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
    let incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
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

// Trip Type Options with travelers and styles mapping
const TRIP_TYPES = [
  { id: 'solo', name: 'Solo', icon: '🎒', travelers: 'Solo', style: 'Solo' },
  { id: 'couple', name: 'Couple', icon: '💑', travelers: 'Couple', style: 'Honeymoon' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧', travelers: 'Family', style: 'Family' },
  { id: 'group', name: 'Friends', icon: '👥', travelers: 'Group', style: 'Friends' },
  { id: 'adventure', name: 'Adventure', icon: '🏔', travelers: 'Solo', style: 'Adventure' },
  { id: 'photography', name: 'Photography', icon: '📸', travelers: 'Solo', style: 'Photography' },
  { id: 'luxury', name: 'Luxury', icon: '💎', travelers: 'Couple', style: 'Luxury' },
  { id: 'pilgrimage', name: 'Pilgrimage', icon: '🛕', travelers: 'Family', style: 'Pilgrimage' },
  { id: 'nature', name: 'Nature', icon: '🌿', travelers: 'Couple', style: 'Family' },
  { id: 'wildlife', name: 'Wildlife', icon: '🐾', travelers: 'Couple', style: 'Wildlife' },
  { id: 'roadtrip', name: 'Road Trip', icon: '🚗', travelers: 'Couple', style: 'Road Trip' }
];

const ItineraryPlanner = ({ places = [], title = "India", defaultDuration = 3 }) => {
  const { user, itineraries, saveItinerary: saveItineraryContext, saveTrip } = useAuth();
  const { isDark } = useTheme();
  const [duration, setDuration] = useState(defaultDuration);
  const [tripType, setTripType] = useState('couple');
  const [budgetTier, setBudgetTier] = useState('Mid-range');
  const [activeTab, setActiveTab] = useState('Nature & Scenic');
  const [showDetailedBudget, setShowDetailedBudget] = useState(false);

  const activeTripType = TRIP_TYPES.find(t => t.id === tripType) || TRIP_TYPES[1];
  const selectedStyle = activeTripType.style;
  const travelerCount = activeTripType.travelers;
  const [saved, setSaved] = useState(false);
  const [myItineraries, setMyItineraries] = useState([]);
  const [successToast, setSuccessToast] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Trigger loading state for smooth dynamic recalculations
  useEffect(() => {
    setRegenerating(true);
    const timer = setTimeout(() => {
      setRegenerating(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [duration, tripType, budgetTier, activeTab]);

  // Load saved itineraries from AuthContext
  useEffect(() => {
    if (itineraries) {
      setMyItineraries(itineraries);
    }
  }, [itineraries]);

  if (!places || places.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-slate-800/80 text-center text-slate-100">
        <Info className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-200">Itinerary Planner Ready</h3>
        <p className="text-slate-400 mt-2 text-xs font-semibold">
          Select or filter travel spots to generate custom AI plans.
        </p>
      </div>
    );
  }

  // Sorting places based on Active Tab option
  const getSortedPlaces = () => {
    const sorted = [...places];
    if (activeTab === 'Culture & Heritage') {
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        const scoreA = catA.includes('heritage') || catA.includes('religious') || catA.includes('cultural') ? 1 : 0;
        const scoreB = catB.includes('heritage') || catB.includes('religious') || catB.includes('cultural') ? 1 : 0;
        return scoreB - scoreA;
      });
    } else if (activeTab === 'Adventure & Activity') {
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        const scoreA = catA.includes('adventure') || catA.includes('wildlife') ? 1 : 0;
        const scoreB = catB.includes('adventure') || catB.includes('wildlife') ? 1 : 0;
        return scoreB - scoreA;
      });
    } else {
      // Nature & Scenic
      sorted.sort((a, b) => {
        const catA = a.category?.name?.toLowerCase() || '';
        const catB = b.category?.name?.toLowerCase() || '';
        const scoreA = catA.includes('nature') || catA.includes('beach') || catA.includes('wildlife') ? 1 : 0;
        const scoreB = catB.includes('nature') || catB.includes('beach') || catB.includes('wildlife') ? 1 : 0;
        return scoreB - scoreA;
      });
    }
    return sorted;
  };

  const sortedPlaces = getSortedPlaces();

  // Generate Itinerary Days Data
  const generateItineraryDays = () => {
    const days = [];
    for (let i = 0; i < duration; i++) {
      const place = sortedPlaces[i % sortedPlaces.length];
      const nearby = place.nearbyAttractions || [];
      
      let currentSpotName = place.name;
      let coords = place.coordinates || { latitude: 20.5937, longitude: 78.9629 };
      
      // Expand itinerary using nearby attractions if duration exceeds database spots
      if (i >= sortedPlaces.length && nearby.length > 0) {
        const attrIndex = (i - sortedPlaces.length) % nearby.length;
        currentSpotName = nearby[attrIndex];
        
        // Offset coordinates deterministically to plot nearby attraction routing
        const latOffset = (Math.sin(attrIndex * 2.3) * 0.018) + 0.008;
        const lngOffset = (Math.cos(attrIndex * 2.3) * 0.018) + 0.008;
        coords = {
          latitude: coords.latitude + latOffset,
          longitude: coords.longitude + lngOffset
        };
      }

      // Hotel recommendation
      let selectedHotel = place.hotels?.find(h => h.category === budgetTier) || place.hotels?.[0];
      const hotelName = selectedHotel?.name || `Comfortable Stay in ${place.city?.name || 'local town'}`;
      const hotelRating = selectedHotel?.rating || 4.1;
      const hotelPrice = selectedHotel?.priceRange || (budgetTier === 'Luxury' ? '₹12,000+' : budgetTier === 'Mid-range' ? '₹3,000 - ₹5,000' : '₹1,200 - ₹2,000');

      // Dining recommendation
      const foodSpots = place.foodSpots || [];
      const selectedFood = foodSpots[i % Math.max(foodSpots.length, 1)];
      const restName = selectedFood?.restaurantName || `Traditional Diner in ${place.city?.name || 'town'}`;
      const restSpecialty = selectedFood?.specialty || 'Local Cuisine Specialties';
      const restCost = selectedFood?.costForTwo || (budgetTier === 'Luxury' ? '₹2,500 for two' : budgetTier === 'Mid-range' ? '₹850 for two' : '₹350 for two');

      // Entry cost
      const entryCost = place.entryFees?.adult || 0;

      // Dynamic Morning Activity text using place database info for 100% uniqueness
      let morningText = `Head over to ${currentSpotName} for a morning exploration. Soak in the beauty, capture landscape shots, and read the local history logs.`;
      if (place.famousFor && place.famousFor.length > 0) {
        morningText = `Explore ${currentSpotName}, famous for ${place.famousFor.slice(0, 2).join(' and ')}. ${place.whyVisit || 'Take in the unique local atmosphere and enjoy sightseeing.'}`;
      } else if (place.whyVisit) {
        morningText = `Visit ${currentSpotName} in the morning. ${place.whyVisit}`;
      } else if (place.description) {
        morningText = `Set off to visit ${currentSpotName} in the morning. ${place.description.slice(0, 150)}${place.description.length > 150 ? '...' : ''}`;
      }

      if (selectedStyle === 'Honeymoon') {
        morningText = `Experience a romantic morning sunrise view together at ${currentSpotName}. Scenic and perfect for couples. ` + morningText;
      } else if (selectedStyle === 'Adventure') {
        morningText = `Embark on an early outdoor trail walk and adventure activities around the rugged spots of ${currentSpotName}. ` + morningText;
      } else if (selectedStyle === 'Pilgrimage') {
        morningText = `Begin with early spiritual darshan and quiet meditation at the sanctum of ${currentSpotName}. ` + morningText;
      }

      // Dynamic Evening Activity text using place database info
      let eveningText = `Spend your evening strolling the vibrant local markets, buying traditional handicrafts, and trying warm local street snacks.`;
      if (place.nearbyAttractions && place.nearbyAttractions.length > 0) {
        const attractionsList = place.nearbyAttractions.slice(0, 3).join(', ');
        eveningText = `In the afternoon and evening, check out nearby attractions around ${currentSpotName} including ${attractionsList}. ` + (place.travelTips?.[0] ? `Traveler Tip: ${place.travelTips[0]}` : '');
      } else if (place.travelTips && place.travelTips.length > 0) {
        eveningText = `Spend your evening wandering the local bazaar areas. Note these traveler tips: ${place.travelTips.slice(0, 2).join(' ')}`;
      }

      if (activeTab === 'Nature & Scenic') {
        eveningText = `Relax at a scenic viewpoint close to ${currentSpotName} to enjoy the stunning sunset views and peaceful breeze. ` + eveningText;
      } else if (activeTab === 'Adventure & Activity') {
        eveningText = `Take an evening boat safari, watch nature trails, or enjoy water sports around the banks of ${currentSpotName}. ` + eveningText;
      } else if (activeTab === 'Culture & Heritage') {
        eveningText = `Attend an authentic regional dance demonstration or folk music concert, appreciating local historical traditions. ` + eveningText;
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
        spotName: currentSpotName,
        coordinates: coords,
        morningText,
        eveningText,
        entryCost,
        nearbyAttractionsList: attractionsListStr,
        transitOptimization,
        hotel: {
          name: hotelName,
          rating: hotelRating,
          priceRange: hotelPrice
        },
        dining: {
          restaurantName: restName,
          specialty: restSpecialty,
          costForTwo: restCost
        }
      });
    }
    return days;
  };

  const days = generateItineraryDays();

  // Route map coordinates list
  const routePoints = days.map(d => d.coordinates);

  // Compute total distance using Haversine formula
  const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
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

  const calculateTotalDistance = () => {
    if (routePoints.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      dist += getHaversineDistance(
        routePoints[i].latitude,
        routePoints[i].longitude,
        routePoints[i + 1].latitude,
        routePoints[i + 1].longitude
      );
    }
    // Add realistic road winding factor (approx 20%)
    return Math.round(dist * 1.22);
  };

  const totalDistance = calculateTotalDistance();
  const estimatedTravelTime = (totalDistance / 55).toFixed(1); // Avg 55 km/h driving speed

  // Budget Tier rates per day
  const rates = {
    'Budget': { hotel: 1600, food: 450, transport: 600, misc: 200 },
    'Mid-range': { hotel: 4200, food: 1000, transport: 2200, misc: 500 },
    'Luxury': { hotel: 15000, food: 2500, transport: 5500, misc: 1500 }
  };

  // Traveler multiplier
  const travelerMultipliers = {
    'Solo': 1,
    'Couple': 2,
    'Family': 4,
    'Group': 6
  };

  const currentRates = rates[budgetTier];
  const multiplier = travelerMultipliers[travelerCount];

  const accommodationCost = currentRates.hotel * duration;
  const foodCost = currentRates.food * multiplier * duration;
  const transportCost = currentRates.transport * duration;
  const activitiesCost = days.reduce((sum, d) => sum + d.entryCost, 0) * multiplier;
  const miscCost = currentRates.misc * multiplier * duration;
  const totalCost = accommodationCost + foodCost + transportCost + activitiesCost + miscCost;

  // Save current itinerary
  const handleSaveItinerary = async () => {
    const stateName = places[0]?.state?.name || places[0]?.state || title;
    const newTrip = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${title} - ${duration} Days Itinerary`,
      destinationName: title,
      stateName: stateName,
      duration: duration,
      budgetCategory: budgetTier,
      travelStyle: selectedStyle,
      travelerType: travelerCount === 'Solo' ? 'solo' : travelerCount === 'Couple' ? 'couple' : travelerCount === 'Family' ? 'family' : 'friends',
      estimatedCost: totalCost,
      status: 'Planning',
      dateCreated: new Date().toLocaleDateString(),
      itinerary: days,
      routeInfo: days.map(d => d.coordinates)
    };

    if (!user) {
      if (window.confirm("Please login or create an account to save your itineraries. Would you like to go to the login page now?")) {
        window.location.href = "/login";
      }
      return;
    }

    await saveTrip(newTrip);

    // Legacy sync
    const newItin = {
      id: newTrip.id,
      title: newTrip.name,
      duration,
      selectedStyle,
      budgetTier,
      travelerCount,
      tripType,
      activeTab,
      totalCost,
      date: newTrip.dateCreated
    };
    await saveItineraryContext(newItin);
    
    setSaved(true);
    setSuccessToast('✓ Trip Saved Successfully');
    setTimeout(() => {
      setSaved(false);
      setSuccessToast('');
    }, 2800);
  };

  // Trigger PDF download
  const triggerPrint = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const slate900 = [30, 41, 59];
    const slate600 = [71, 85, 105];

    // Page 1 Header Banner
    doc.setFillColor(...slate900);
    doc.rect(0, 0, 210, 38, 'F');

    // Title & Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TravelBharat Itinerary", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Discover the Soul of India`, 15, 26);
    doc.text("Plan online at: travelbharat.vercel.app", 15, 31);

    // Section 1: Trip Overview
    doc.setTextColor(...slate900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Destination: ${title}`, 15, 50);

    doc.setDrawColor(226, 232, 240); // slate-200 border
    doc.line(15, 54, 195, 54);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`• Duration: ${duration} Days`, 15, 62);
    doc.text(`• Traveler Category: ${travelerCount}`, 15, 68);
    doc.text(`• Budget Tier: ${budgetTier}`, 15, 74);
    doc.text(`• Travel Style: ${selectedStyle}`, 15, 80);
    doc.text(`• Estimated Total Cost: INR ${totalCost.toLocaleString()}`, 15, 86);

    // Section 2: Route & Transit info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Route & Transit Details", 115, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`• Total Distance: ~${totalDistance} km`, 115, 68);
    doc.text(`• Est. Driving Time: ~${estimatedTravelTime} hrs`, 115, 74);
    
    const transitNote = days[0]?.transitOptimization || "Local transport options recommended.";
    const splitTransit = doc.splitTextToSize(`• Route Info: ${transitNote}`, 80);
    doc.text(splitTransit, 115, 80);

    doc.line(15, 94, 195, 94);

    // Section 3: Daily Timeline
    let y = 104;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Daily Schedule Breakdown", 15, y);
    y += 8;

    days.forEach((day) => {
      // Check page break
      if (y > 245) {
        doc.addPage();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`TravelBharat Itinerary: ${title} (${duration} Days Plan)`, 15, 9);
        y = 28;
      }

      // Day separator block
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 5, 180, 8, 'F');
      
      doc.setTextColor(...slate900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(`DAY ${day.dayIndex} - ${day.spotName}`, 18, y);
      y += 8;

      // Morning Activity
      doc.setTextColor(...slate900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Morning Sightseeing:", 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...slate600);
      const morningSplit = doc.splitTextToSize(day.morningText, 140);
      doc.text(morningSplit, 52, y);
      y += Math.max(morningSplit.length * 4.2, 5);

      // Lunch / Dining
      if (y > 260) { doc.addPage(); doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 15, 'F'); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`TravelBharat Itinerary: ${title}`, 15, 9); y = 28; }
      doc.setTextColor(...slate900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Lunch & Local Food:", 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...slate600);
      const diningText = `Dine at ${day.dining.restaurantName} (Specialty: ${day.dining.specialty}, Cost: ${day.dining.costForTwo})`;
      const diningSplit = doc.splitTextToSize(diningText, 140);
      doc.text(diningSplit, 52, y);
      y += Math.max(diningSplit.length * 4.2, 5);

      // Evening Activity
      if (y > 260) { doc.addPage(); doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 15, 'F'); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`TravelBharat Itinerary: ${title}`, 15, 9); y = 28; }
      doc.setTextColor(...slate900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Evening Activities:", 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...slate600);
      const eveningSplit = doc.splitTextToSize(day.eveningText, 140);
      doc.text(eveningSplit, 52, y);
      y += Math.max(eveningSplit.length * 4.2, 5);

      // Hotel Stay
      if (y > 260) { doc.addPage(); doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 15, 'F'); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`TravelBharat Itinerary: ${title}`, 15, 9); y = 28; }
      doc.setTextColor(...slate900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Stay Recommendation:", 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...slate600);
      const hotelText = `${day.hotel.name} (Rating: ${day.hotel.rating} Stars, Price: ${day.hotel.priceRange})`;
      const hotelSplit = doc.splitTextToSize(hotelText, 140);
      doc.text(hotelSplit, 52, y);
      y += Math.max(hotelSplit.length * 4.2, 8);
    });

    doc.save(`TravelBharat_Itinerary_${title.replace(/\s+/g, '_')}.pdf`);
  };

  // Compute percentage for dynamic progress bars
  const getPercentage = (costValue) => {
    return Math.min(Math.round((costValue / totalCost) * 100), 100);
  };

  // Simulated weather string based on coordinates
  const getWeatherSimulationText = () => {
    const lat = places[0]?.coordinates?.latitude || 20.5937;
    const lng = places[0]?.coordinates?.longitude || 78.9629;
    
    let isHighAltitude = lat > 30;
    let isDesert = lat > 24 && lat < 28 && lng < 75;
    let isCoastal = lat < 20 || lat < 10;
    
    if (isHighAltitude) return "Alpine / Snowy (8°C)";
    if (isDesert) return "Arid / Warm (32°C)";
    if (isCoastal) return "Coastal / Humid (28°C)";
    return "Plains / Pleasant (24°C)";
  };

  return (
    <div className="bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 rounded-3xl p-6 md:p-8 shadow-lg dark:shadow-2xl border border-slate-200 dark:border-slate-805/85 space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 relative overflow-hidden">
      
      {/* Loader overlay */}
      {regenerating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-955/80 backdrop-blur-xs z-50 flex flex-col justify-center items-center gap-3 animate-fadeIn">
          <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span className="text-xs font-extrabold text-slate-650 dark:text-slate-450 uppercase tracking-widest">Regenerating Itinerary...</span>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-2xl shadow-xl flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header section (hidden in print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-150 dark:border-slate-900 print:hidden">
        <div className="space-y-1">
          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-100/30 dark:border-indigo-900/30 inline-flex items-center gap-1 shadow-sm">
            <Sparkles className="h-3 w-3 animate-pulse text-indigo-650 dark:text-indigo-400" />
            AI Travel Dashboard
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Premium AI Travel Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Custom plans for {title} based on real destinations and local recommendations.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSaveItinerary}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer select-none"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Saved!
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 text-indigo-400" />
                Save Plan
              </>
            )}
          </button>
          
          <button 
            onClick={triggerPrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-indigo-500/20 cursor-pointer select-none"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Title only during Print mode */}
      <div className="hidden print:block space-y-2 mb-8 text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 border-b-2 border-indigo-600 pb-2">
          TravelBharat Itinerary: {duration} Days in {title}
        </h1>
        <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-600 uppercase pt-2">
          <div>Style: <span className="text-slate-900">{selectedStyle}</span></div>
          <div>Budget: <span className="text-slate-900">{budgetTier}</span></div>
          <div>Travelers: <span className="text-slate-900">{travelerCount}</span></div>
          <div>Option: <span className="text-slate-900">{activeTab}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Trip Configuration (25%) */}
        <div className="md:col-span-4 lg:col-span-3 lg:sticky lg:top-8 space-y-6 print:hidden">
          <div className="bg-slate-55 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-xl space-y-6">
            <h3 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-900">
              <Sparkles className="h-4 w-4" />
              Configure Trip
            </h3>

            {/* Travel Style Selector */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Travel Style</span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {TRIP_TYPES.map((type) => {
                  const isSelected = tripType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setTripType(type.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition duration-300 border flex-shrink-0 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850/60 border-slate-200 dark:border-white/5 text-slate-705 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Trip Duration</span>
                <span className="text-indigo-600 dark:text-indigo-405 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/10 px-2.5 py-0.5 rounded-lg text-[10px]">{duration} Days</span>
              </div>
              <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-205 dark:border-white/5">
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
                      duration === d 
                        ? 'bg-indigo-650 text-white shadow-xs font-extrabold' 
                        : 'text-slate-700 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier Selector */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Budget Category</span>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-205 dark:border-white/5">
                {['Budget', 'Mid-range', 'Luxury'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudgetTier(b)}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition duration-200 cursor-pointer ${
                      budgetTier === b
                        ? 'bg-indigo-650 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Travelers (derived) */}
            <div className="p-3 bg-slate-100 dark:bg-slate-950/40 rounded-2xl border border-slate-205 dark:border-white/5 flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Travelers Group</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{travelerCount} Profile</span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {multiplier} Pax
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Itinerary Timeline (50%) */}
        <div className="md:col-span-8 lg:col-span-6 space-y-6">
          {/* Option Segmented Tabs (3 distinct travel plans) */}
          <div className="border-b border-slate-200 dark:border-slate-900 pb-1 flex gap-6 print:hidden">
            {[
              { id: 'Nature & Scenic', label: 'Nature & Scenic Plan', icon: Compass },
              { id: 'Adventure & Activity', label: 'Adventure & Active Plan', icon: Activity },
              { id: 'Culture & Heritage', label: 'Culture & Heritage Plan', icon: Sun }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition duration-300 flex items-center gap-2 cursor-pointer ${
                    isActive 
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                      : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-slate-200 hover:bg-slate-100/30 dark:hover:bg-slate-800/20'
                  }`}
                >
                  <TabIcon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center print:hidden px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Itinerary Roadmap
            </span>
            <span className="text-xs font-bold text-indigo-400">
              {days.length} Days Optimised Route
            </span>
          </div>

          {/* Timeline Node Chain */}
          <div className="relative border-l-2 border-slate-200 dark:border-slate-900 ml-4 pl-6 md:pl-8 space-y-8 text-left">
            {days.map((day, idx) => (
              <motion.div 
                key={day.dayIndex} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="relative space-y-4"
              >
                {/* Timeline Marker Badge */}
                <div className="absolute -left-[37px] md:-left-[45px] top-6 bg-white dark:bg-slate-955 border-2 border-indigo-500 w-6 h-6 rounded-full z-10 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400">
                  {day.dayIndex}
                </div>

                {/* Day Card container */}
                <div className="bg-slate-55 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-5 md:p-6 shadow-lg hover:border-indigo-500/20 transition-all duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5 mb-5">
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                        Day {day.dayIndex}: {day.spotName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Itinerary Station Stop</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150/30 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-extrabold py-1 px-2.5 rounded-lg">
                      Sightseeing
                    </span>
                  </div>

                  {/* Day Slots Grid */}
                  <div className="space-y-5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    
                    {/* Morning */}
                    <div className="flex gap-4 items-start">
                      <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl text-amber-500 flex-shrink-0">
                        <Sun className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-550 dark:text-amber-500 uppercase tracking-widest block">Morning Slot</span>
                        <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-semibold mt-1">
                          {day.morningText}
                        </p>
                        {day.entryCost > 0 && (
                          <span className="inline-block text-[9px] bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 text-slate-550 dark:text-slate-400 py-0.5 px-2 rounded-md font-bold mt-1.5">
                            Ticket Fee: ₹{day.entryCost} / adult
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lunch */}
                    <div className="flex gap-4 items-start">
                      <div className="bg-rose-500/10 border border-rose-500/25 p-2 rounded-xl text-rose-500 flex-shrink-0">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-550 dark:text-rose-500 uppercase tracking-widest block">Lunch & Specialties</span>
                        <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-semibold mt-1">
                          Dine at <strong className="text-slate-800 dark:text-white">{day.dining.restaurantName}</strong>. Specialty: <strong className="text-indigo-650 dark:text-indigo-400">{day.dining.specialty}</strong>.
                        </p>
                        <span className="inline-block text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 py-0.5 px-2 rounded-md font-bold mt-1.5">
                          Average: {day.dining.costForTwo}
                        </span>
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="flex gap-4 items-start">
                      <div className="bg-sky-500/10 border border-sky-500/25 p-2 rounded-xl text-sky-500 flex-shrink-0">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-sky-550 dark:text-sky-500 uppercase tracking-widest block">Evening Slot</span>
                        <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-semibold mt-1">
                          {day.eveningText}
                        </p>
                      </div>
                    </div>

                    {/* Hotel Stay recommendations */}
                    <div className="flex gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-xl text-emerald-500 flex-shrink-0">
                        <Hotel className="h-4 w-4" />
                      </div>
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-550 dark:text-emerald-500 uppercase tracking-widest block">Stay & Lodge</span>
                          <strong className="text-slate-800 dark:text-white text-xs sm:text-sm block mt-0.5">{day.hotel.name}</strong>
                          <span className="text-[9px] text-slate-500 dark:text-slate-450 font-bold uppercase mt-0.5 block">{day.hotel.priceRange} / night</span>
                        </div>
                        <div className="flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 px-2 py-0.5 rounded-lg text-xs font-bold gap-0.5 border border-indigo-150 dark:border-indigo-900/30 w-fit self-start sm:self-center">
                          <Star className="h-3.5 w-3.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-650 dark:text-indigo-400" />
                          <span>{day.hotel.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nearby Attractions, Transit & Budget Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/5 pt-4 text-[11px] font-semibold">
                      {/* Nearby Attractions */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block">Nearby Attractions</span>
                        <p className="text-slate-600 dark:text-slate-350 leading-normal">
                          {day.nearbyAttractionsList}
                        </p>
                      </div>

                      {/* Travel Optimization */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-amber-650 dark:text-amber-500 uppercase tracking-widest block">Transit Optimization</span>
                        <p className="text-slate-600 dark:text-slate-350 leading-normal">
                          {day.transitOptimization}
                        </p>
                      </div>

                      {/* Daily Cost Breakdown */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-500 uppercase tracking-widest block">Day Est. Budget</span>
                        <div className="text-slate-600 dark:text-slate-350 space-y-0.5">
                          <div>Ticket: <span className="font-bold">₹{day.entryCost}</span></div>
                          <div>Stay: <span className="font-bold">{day.hotel.priceRange.split(' ')[0]}</span></div>
                          <div>Food: <span className="font-bold">{day.dining.costForTwo.split(' ')[0]}</span></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Trip Summary Dashboard & Map (25%) */}
        <div className="md:col-span-12 lg:col-span-3 lg:sticky lg:top-8 space-y-6">
          
          {/* Smart Route Map (Google Travel style) */}
          <div className="bg-slate-55 dark:bg-slate-900/40 backdrop-blur-md border border-slate-205 dark:border-white/5 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Navigation className="h-4.5 w-4.5" /> Route Map</span>
              <span className="text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30 px-2 py-0.5 rounded-full">Interactive</span>
            </h3>

            {/* Map Container */}
            <div className="w-full h-[450px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-900 relative z-10">
              <MapContainer 
                center={[routePoints[0]?.latitude || 20.5937, routePoints[0]?.longitude || 78.9629]} 
                zoom={7} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                />

                {/* Day Markers */}
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

                {/* Draw Route Polyline */}
                {routePoints.length > 1 && (
                  <Polyline 
                    positions={routePoints.map(p => [p.latitude, p.longitude])} 
                    color="#6366F1" 
                    weight={4}
                    dashArray="7, 7"
                  />
                )}

                {/* Fit Boundary Controller */}
                <MapBoundsController points={routePoints} />
              </MapContainer>
            </div>

            {/* Print Friendly Route Stats */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400 pt-1">
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Driving Route</span>
                <strong className="text-slate-200 text-sm">{totalDistance} km</strong>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Estimated Drive</span>
                <strong className="text-indigo-400 text-sm">{estimatedTravelTime} Hrs</strong>
              </div>
            </div>
          </div>

          {/* Premium Trip Summary Card */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pb-2.5 border-b border-slate-900 flex items-center justify-between">
              <span>Trip Summary</span>
              <span className="text-[9px] bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold">Live Stats</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 text-left">
              {/* Budget */}
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  Total Budget
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-100">
                  ₹<AnimatedCounter value={totalCost} />
                </p>
              </div>

              {/* Distance */}
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Navigation className="h-3.5 w-3.5 text-sky-500" />
                  Distance
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-100">
                  <AnimatedCounter value={totalDistance} /> km
                </p>
              </div>

              {/* Travel Time */}
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Travel Time
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-100">
                  <AnimatedCounter value={Math.round(parseFloat(estimatedTravelTime) || 0)} /> Hrs
                </p>
              </div>

              {/* Travelers */}
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-500" />
                  Travelers
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-100">
                  {multiplier} Pax
                </p>
              </div>

              {/* Transport */}
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Car className="h-3.5 w-3.5 text-purple-500" />
                  Transport
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                  {budgetTier === 'Budget' ? 'Bus / Train' : 'Private Cab'}
                </p>
              </div>

              {/* Trip Rating */}
              <div className="p-3.5 bg-slate-955/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-rose-500" />
                  Trip Rating
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-105">4.8</span>
                  <div className="flex text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Weather status travel assistant */}
            <WeatherWidget 
              placeName={title} 
              stateName={places[0]?.state?.name || places[0]?.state || title} 
              coordinates={places[0]?.coordinates} 
              category={places[0]?.category?.name || places[0]?.category} 
            />
          </div>

          {/* Interactive Cost Calculator Progress Visualizer */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-400 pb-2 border-b border-slate-900 flex items-center gap-1.5">
              <Coins className="h-4.5 w-4.5 text-indigo-400" />
              Itinerary Budget Details
            </h3>

            <div className="text-center pb-4 border-b border-slate-900">
              <span className="text-2xl font-extrabold text-white">
                ₹{totalCost.toLocaleString()}
              </span>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                Total Estimated Cost ({duration} Days, {travelerCount})
              </p>
            </div>

            <div className="space-y-4 pt-1 text-xs font-semibold text-slate-400">
              {[
                { label: 'Stay / Lodges', value: accommodationCost, color: '#10B981', icon: <Hotel className="h-4 w-4 text-emerald-500" /> },
                { label: 'Meals & Food', value: foodCost, color: '#0EA5E9', icon: <Utensils className="h-4 w-4 text-rose-500" /> },
                { label: 'Transit & Fuel', value: transportCost, color: '#6366F1', icon: <Car className="h-4 w-4 text-indigo-500" /> },
                { label: 'Activity Fees', value: activitiesCost, color: '#F59E0B', icon: <Sun className="h-4 w-4 text-amber-500" /> },
                { label: 'Incidentals', value: miscCost, color: '#64748B', icon: <Wallet className="h-4 w-4 text-slate-400" /> }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <strong className="text-slate-205">₹{item.value.toLocaleString()} ({getPercentage(item.value)}%)</strong>
                  </div>
                  <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getPercentage(item.value)}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-900">
              <button 
                onClick={() => setShowDetailedBudget(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10"
              >
                <Calculator className="h-4 w-4" />
                Customize Budget Details
              </button>
            </div>
          </div>

          {/* Saved Plans Sidebar Widget (hidden in print) */}
          {myItineraries.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 space-y-4 print:hidden text-left">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pb-2 border-b border-slate-900">
                Recent Saved Plans
              </h4>
              <div className="space-y-3">
                {myItineraries.map((it) => (
                  <div 
                    key={it.id} 
                    className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <strong className="text-slate-200 text-xs leading-snug">{it.title}</strong>
                      <span className="text-[10px] bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded-md font-bold">{it.duration}d</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase pt-1 border-t border-slate-900">
                      <span>{it.date}</span>
                      <span className="text-indigo-400 font-bold">₹{it.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Detailed Budget Calculator Modal */}
      {showDetailedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn print:hidden">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setShowDetailedBudget(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 font-extrabold text-sm p-2 bg-slate-900 rounded-full cursor-pointer transition"
            >
              ✕
            </button>
            <div className="pt-2 text-left">
              <TripBudgetCalculator 
                destinationName={title}
                baseEntryFees={{ adult: places[0]?.entryFees?.adult || 40 }}
                destCoords={places[0]?.coordinates}
                initialDuration={duration}
                initialTravelers={multiplier}
                initialBudgetCategory={budgetTier === 'Mid-range' ? 'Mid-Range' : budgetTier}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryPlanner;
