import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Briefcase, Heart, FolderHeart, BarChart3, Calendar, 
  Coins, Compass, Eye, Trash2, Edit2, Copy, Share2, 
  Plus, X, Check, ExternalLink, MapPin, Clock, Users,
  FolderOpen, PlusCircle, AlertCircle, FileText, ChevronRight,
  BookOpen, Star, Sparkles, Award, Mountain, Palmtree,
  Utensils, Milestone, Lock, Unlock
} from 'lucide-react';
import destinationImages from '../assets/destinationImages.json';

const MyTrips = ({ initialTab = 'trips' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [trips, setTrips] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all');

  // Modal / Form States
  const [viewingTrip, setViewingTrip] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('Planning');
  const [sharingTrip, setSharingTrip] = useState(null);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState('');

  const navigate = useNavigate();

  // Load data from Local Storage
  useEffect(() => {
    loadAllData();
    window.addEventListener('wishlistChanged', loadAllData);
    return () => window.removeEventListener('wishlistChanged', loadAllData);
  }, []);

  const loadAllData = () => {
    // 1. Load Trips
    const savedTrips = localStorage.getItem('travelbharat_trips');
    let tripList = [];
    if (savedTrips) {
      try { tripList = JSON.parse(savedTrips); } catch(e){}
    } else {
      // Migrate from travelbharat_itineraries if present
      const oldItins = localStorage.getItem('travelbharat_itineraries');
      if (oldItins) {
        try { 
          const migrated = JSON.parse(oldItins).map(item => ({
            id: item.id || Date.now() + Math.random(),
            name: item.title || 'My Trip Plan',
            destinationName: item.title?.split('-')[0]?.trim() || 'India',
            stateName: item.title?.split('-')[0]?.trim() || 'India',
            duration: item.duration || 3,
            budgetCategory: item.budgetTier || 'Mid-range',
            travelStyle: item.selectedStyle || 'Sightseeing',
            travelerType: item.travelerCount === 'Solo' ? 'solo' : item.travelerCount === 'Couple' ? 'couple' : item.travelerCount === 'Family' ? 'family' : 'friends',
            estimatedCost: item.totalCost || 15000,
            status: 'Planning',
            dateCreated: item.date || new Date().toLocaleDateString(),
            itinerary: []
          }));
          tripList = migrated;
          localStorage.setItem('travelbharat_trips', JSON.stringify(migrated));
        } catch(e){}
      }
    }
    setTrips(tripList);

    // 2. Load Wishlist
    const savedWishlist = localStorage.getItem('travelbharat_wishlist');
    let wishList = [];
    if (savedWishlist) {
      try { wishList = JSON.parse(savedWishlist); } catch(e){}
    }
    setWishlist(wishList);

    // 3. Load Collections
    const savedCollections = localStorage.getItem('travelbharat_collections');
    let collectionList = [
      { id: 'summer', name: 'Summer Vacation 2026' },
      { id: 'south', name: 'South India Tour' },
      { id: 'temple', name: 'Temple Pilgrimage' }
    ];
    if (savedCollections) {
      try { collectionList = JSON.parse(savedCollections); } catch(e){}
    } else {
      localStorage.setItem('travelbharat_collections', JSON.stringify(collectionList));
    }
    setCollections(collectionList);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Duplicate Trip
  const handleDuplicateTrip = (trip) => {
    const duplicated = {
      ...trip,
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${trip.name} (Copy)`,
      dateCreated: new Date().toLocaleDateString()
    };
    const updated = [duplicated, ...trips];
    setTrips(updated);
    localStorage.setItem('travelbharat_trips', JSON.stringify(updated));
    showToast('Trip plan duplicated successfully!');
  };

  // Delete Trip
  const handleDeleteTrip = (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip plan?')) {
      const updated = trips.filter(t => t.id !== tripId);
      setTrips(updated);
      localStorage.setItem('travelbharat_trips', JSON.stringify(updated));
      showToast('Trip plan deleted successfully.');
    }
  };

  // Edit Trip Save
  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const updated = trips.map(t => {
      if (t.id === editingTrip.id) {
        return {
          ...t,
          name: editName,
          status: editStatus
        };
      }
      return t;
    });
    setTrips(updated);
    localStorage.setItem('travelbharat_trips', JSON.stringify(updated));
    setEditingTrip(null);
    showToast('Trip updated successfully.');
  };

  // Duplicate Wishlist to Planner
  const handleMoveToPlanner = (place) => {
    // Redirect to state page with parameters or default plan
    const slug = place.slug || '';
    if (slug) {
      navigate(`/destination/${slug}`);
    } else {
      navigate('/explore');
    }
  };

  // Remove from Wishlist
  const handleRemoveFromWishlist = (placeId) => {
    const updated = wishlist.filter(item => item._id !== placeId);
    setWishlist(updated);
    localStorage.setItem('travelbharat_wishlist', JSON.stringify(updated));
    showToast('Removed from Wishlist.');
  };

  // Create Collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    const newColl = {
      id: 'coll-' + Date.now(),
      name: newCollectionName.trim()
    };
    const updated = [...collections, newColl];
    setCollections(updated);
    localStorage.setItem('travelbharat_collections', JSON.stringify(updated));
    setNewCollectionName('');
    setCreatingCollection(false);
    showToast(`Collection "${newColl.name}" created!`);
  };

  // Organize Saved Destination into Collection
  const handleAssignCollection = (tripId, collectionId) => {
    const updated = trips.map(t => {
      if (t.id === tripId) {
        return { ...t, collectionId: collectionId === 'none' ? null : collectionId };
      }
      return t;
    });
    setTrips(updated);
    localStorage.setItem('travelbharat_trips', JSON.stringify(updated));
    showToast('Trip collection updated.');
  };

  // Statistics calculation
  const getStats = () => {
    const tripsSaved = trips.length;
    const wishlistCount = wishlist.length;
    
    // States explored (unique state names)
    const statesSet = new Set();
    trips.forEach(t => { if (t.stateName) statesSet.add(t.stateName); });
    wishlist.forEach(w => { 
      const sName = w.state?.name || w.state || '';
      if (sName) statesSet.add(sName); 
    });
    
    const statesExplored = statesSet.size;
    const destinationsSaved = Array.from(new Set(trips.map(t => t.destinationName))).length;
    const budgetTotal = trips.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);

    return {
      tripsSaved,
      wishlistCount,
      statesExplored,
      destinationsSaved,
      budgetTotal
    };
  };

  const stats = getStats();

  // Combined unique destinations from wishlist and trips
  const getCombinedDestinations = () => {
    const items = [];
    const seenNames = new Set();
    
    wishlist.forEach(w => {
      const name = w.name;
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        items.push({
          name: w.name,
          state: w.state?.name || w.state || '',
          category: w.category?.name || w.category || '',
          tags: w.tags || []
        });
      }
    });

    trips.forEach(t => {
      const destName = t.destinationName;
      if (destName && !seenNames.has(destName.toLowerCase())) {
        seenNames.add(destName.toLowerCase());
        items.push({
          name: destName,
          state: t.stateName || '',
          category: t.travelStyle || '',
          tags: []
        });
      }
      if (t.itinerary && Array.isArray(t.itinerary)) {
        t.itinerary.forEach(day => {
          const spotName = day.spotName;
          if (spotName && !seenNames.has(spotName.toLowerCase())) {
            seenNames.add(spotName.toLowerCase());
            items.push({
              name: spotName,
              state: t.stateName || '',
              category: '',
              tags: []
            });
          }
        });
      }
    });

    return items;
  };

  // Dynamically evaluate traveler badges/achievements
  const getBadges = () => {
    const combined = getCombinedDestinations();
    
    // 1. Unique States
    const uniqueStates = new Set();
    combined.forEach(item => {
      if (item.state && item.state.toLowerCase() !== 'india') {
        uniqueStates.add(item.state.trim());
      }
    });
    const statesCount = uniqueStates.size;
    
    // 2. Temple Explorer
    let templeCount = 0;
    combined.forEach(item => {
      const nameLower = item.name.toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const isTemple = nameLower.includes('temple') || 
                       nameLower.includes('mandir') || 
                       nameLower.includes('temples') ||
                       catLower.includes('religious') || 
                       catLower.includes('temple') ||
                       catLower.includes('spiritual') ||
                       catLower.includes('pilgrimage');
      if (isTemple) templeCount++;
    });

    // 3. Hill Station Lover
    const hillKeywords = ['hill station', 'hill', 'valley', 'ghat', 'mountain', 'peak', 'ridge', 'pass'];
    const hillPlaces = ['ooty', 'munnar', 'shimla', 'manali', 'mussoorie', 'darjeeling', 'nainital', 'kodaikanal', 'coorg', 'gulmarg', 'srinagar', 'mahabaleshwar', 'gangtok', 'lonavala', 'matheran', 'dharamshala'];
    let hillCount = 0;
    combined.forEach(item => {
      const nameLower = item.name.toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const isHill = hillKeywords.some(kw => nameLower.includes(kw) || catLower.includes(kw)) ||
                     hillPlaces.some(hp => nameLower.includes(hp)) ||
                     (item.tags || []).some(tag => tag.toLowerCase().includes('hill') || tag.toLowerCase().includes('mountain'));
      if (isHill) hillCount++;
    });

    // 4. Beach Explorer
    const beachKeywords = ['beach', 'lake', 'backwater', 'island', 'sea', 'ocean', 'coast', 'marina', 'lagoon', 'waterfall'];
    const beachPlaces = ['goa', 'kovalam', 'varkala', 'havelock', 'radhanagar', 'marina', 'alappuzha', 'alleppey', 'kumarakom', 'kerala backwaters', 'gokarna', 'pondicherry'];
    let beachCount = 0;
    combined.forEach(item => {
      const nameLower = item.name.toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const isBeach = beachKeywords.some(kw => nameLower.includes(kw) || catLower.includes(kw)) ||
                      beachPlaces.some(bp => nameLower.includes(bp)) ||
                      (item.tags || []).some(tag => tag.toLowerCase().includes('beach') || tag.toLowerCase().includes('coast') || tag.toLowerCase().includes('water'));
      if (isBeach) beachCount++;
    });

    // 5. Food Explorer
    let foodCount = 0;
    combined.forEach(item => {
      const nameLower = item.name.toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const isFoodSpot = nameLower.includes('restaurant') || nameLower.includes('food') || nameLower.includes('cafe') || nameLower.includes('cuisine') || nameLower.includes('bazaar') || nameLower.includes('street food') || nameLower.includes('dhaba') ||
                         catLower.includes('food') || catLower.includes('dining') || catLower.includes('culinary') || catLower.includes('cuisine');
      if (isFoodSpot) foodCount++;
    });
    
    const uniqueRestaurants = new Set();
    trips.forEach(t => {
      if (t.itinerary && Array.isArray(t.itinerary)) {
        t.itinerary.forEach(day => {
          if (day.dining && day.dining.restaurantName && !day.dining.restaurantName.includes('Traditional Diner') && !day.dining.restaurantName.includes('Dine at')) {
            uniqueRestaurants.add(day.dining.restaurantName.toLowerCase());
          }
        });
      }
    });
    foodCount += uniqueRestaurants.size;

    const badgeList = [
      {
        id: 'visited_5_states',
        title: 'Visited 5 States',
        description: 'Explore 5 unique states in India.',
        current: statesCount,
        target: 5,
        icon: Milestone,
        color: 'from-amber-500 to-orange-600',
        glowColor: 'shadow-orange-500/20',
        unlocked: statesCount >= 5,
        category: 'exploration'
      },
      {
        id: 'visited_10_states',
        title: 'Visited 10 States',
        description: 'Explore 10 unique states in India.',
        current: statesCount,
        target: 10,
        icon: Milestone,
        color: 'from-yellow-500 to-amber-600',
        glowColor: 'shadow-yellow-500/20',
        unlocked: statesCount >= 10,
        category: 'exploration'
      },
      {
        id: 'temple_explorer',
        title: 'Temple Explorer',
        description: 'Visit or save 3 religious structures or temples.',
        current: templeCount,
        target: 3,
        icon: Compass,
        color: 'from-red-500 to-rose-600',
        glowColor: 'shadow-rose-500/20',
        unlocked: templeCount >= 3,
        category: 'culture'
      },
      {
        id: 'hill_station_lover',
        title: 'Hill Station Lover',
        description: 'Visit or save 3 hill stations or mountain peaks.',
        current: hillCount,
        target: 3,
        icon: Mountain,
        color: 'from-emerald-500 to-teal-600',
        glowColor: 'shadow-emerald-500/20',
        unlocked: hillCount >= 3,
        category: 'nature'
      },
      {
        id: 'beach_explorer',
        title: 'Beach Explorer',
        description: 'Visit or save 3 beaches, lakes, or coastal zones.',
        current: beachCount,
        target: 3,
        icon: Palmtree,
        color: 'from-blue-500 to-cyan-600',
        glowColor: 'shadow-blue-500/20',
        unlocked: beachCount >= 3,
        category: 'nature'
      },
      {
        id: 'food_explorer',
        title: 'Food Explorer',
        description: 'Enjoy or save 3 local dining experiences.',
        current: foodCount,
        target: 3,
        icon: Utensils,
        color: 'from-indigo-500 to-violet-600',
        glowColor: 'shadow-indigo-500/20',
        unlocked: foodCount >= 3,
        category: 'dining'
      }
    ];

    const unlockedCount = badgeList.filter(b => b.unlocked).length;

    return {
      badgeList,
      unlockedCount,
      uniqueStatesList: Array.from(uniqueStates)
    };
  };

  const badgeInfo = getBadges();

  // Generate share link details
  const getShareLink = (trip) => {
    // Compress and stringify trip data
    const payload = {
      name: trip.name,
      dest: trip.destinationName,
      state: trip.stateName,
      dur: trip.duration,
      bud: trip.budgetCategory,
      style: trip.travelStyle,
      type: trip.travelerType,
      cost: trip.estimatedCost,
      itin: (trip.itinerary || []).map(d => ({
        dayIndex: d.dayIndex,
        spotName: d.spotName,
        morningText: d.morningText,
        eveningText: d.eveningText,
        hotel: d.hotel,
        dining: d.dining
      }))
    };
    
    const stringified = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(stringified)));
    return `${window.location.origin}/share-trip?data=${encoded}`;
  };

  const copyShareLink = (trip) => {
    const link = getShareLink(trip);
    navigator.clipboard.writeText(link);
    showToast('Share link copied to clipboard!');
  };

  // Filtered Trips list based on Collection
  const filteredTrips = selectedCollection === 'all' 
    ? trips 
    : trips.filter(t => t.collectionId === selectedCollection);

  const getTripImageUrl = (trip) => {
    const dest = trip.destinationName;
    const state = trip.stateName;

    if (dest && destinationImages[dest] && destinationImages[dest].length > 0) {
      return `https://images.unsplash.com/photo-${destinationImages[dest][0]}?auto=format&fit=crop&w=600&q=80`;
    }
    if (state && destinationImages[state] && destinationImages[state].length > 0) {
      return `https://images.unsplash.com/photo-${destinationImages[state][0]}?auto=format&fit=crop&w=600&q=80`;
    }
    // Search substring match
    const matchedKey = Object.keys(destinationImages).find(k => 
      (dest && k.toLowerCase().includes(dest.toLowerCase())) || 
      (state && k.toLowerCase().includes(state.toLowerCase()))
    );
    if (matchedKey && destinationImages[matchedKey].length > 0) {
      return `https://images.unsplash.com/photo-${destinationImages[matchedKey][0]}?auto=format&fit=crop&w=600&q=80`;
    }
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80'; // Taj Mahal default
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-left">
      
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* LEFT COLUMN: Sidebar Navigation Dashboard (25%) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* User Profile overview card */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xl flex items-center justify-center mx-auto border border-indigo-200/35">
              TB
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-white mt-3">Travel Explorer</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Gold Tier Member</p>
          </div>

          {/* Navigation Sections */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md overflow-hidden">
            <div className="flex flex-col text-xs font-bold">
              {[
                { id: 'trips', label: 'My Trips', icon: Briefcase },
                { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlist.length },
                { id: 'collections', label: 'Trip Collections', icon: FolderHeart, badge: collections.length },
                { id: 'badges', label: 'Traveler Badges', icon: Award, badge: badgeInfo.unlockedCount },
                { id: 'stats', label: 'Trip Statistics', icon: BarChart3 }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-4 border-b border-slate-100 dark:border-slate-850/60 transition text-left flex items-center justify-between cursor-pointer select-none ${
                      isActive 
                        ? 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-405' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-950/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <TabIcon className="h-4.5 w-4.5" />
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[9px]">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trip Statistics Quick Panel */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-850">
              Trip statistics
            </h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center font-semibold text-slate-500">
                <span>Trips Saved</span>
                <strong className="text-slate-800 dark:text-white font-extrabold">{stats.tripsSaved}</strong>
              </div>
              <div className="flex justify-between items-center font-semibold text-slate-500">
                <span>Wishlist Spots</span>
                <strong className="text-slate-800 dark:text-white font-extrabold">{stats.wishlistCount}</strong>
              </div>
              <div className="flex justify-between items-center font-semibold text-slate-500">
                <span>States Explored</span>
                <strong className="text-slate-800 dark:text-white font-extrabold">{stats.statesExplored}</strong>
              </div>
              <div className="flex justify-between items-center font-semibold text-slate-500">
                <span>Budget Allocated</span>
                <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">₹{stats.budgetTotal.toLocaleString()}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Dashboard Main Work area (75%) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: MY TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-850 dark:text-white">My Saved Trips</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Access, edit, duplicate, and share your custom itineraries.</p>
                </div>
                
                {/* Collection Filter dropdown */}
                <div className="flex items-center gap-2.5">
                  <select
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-655 cursor-pointer outline-none shadow-sm"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                  >
                    <option value="all">All Collections</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => navigate('/explore')}
                    className="inline-flex items-center gap-1 bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition"
                  >
                    <Plus className="h-4 w-4" />
                    New Plan
                  </button>
                </div>
              </div>

              {filteredTrips.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                  <FolderOpen className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No trips found</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm font-semibold">
                    You haven't saved any trip plans under this collection yet. Head over to the State Guides or Explore section to create one!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredTrips.map((trip) => {
                    const statusColors = {
                      Upcoming: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100',
                      Planning: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100',
                      Completed: 'bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 border-slate-200',
                      Cancelled: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100'
                    };
                    return (
                      <motion.div 
                        key={trip.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/85 rounded-3xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                      >
                        {/* Card Image */}
                        <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                          <img 
                            src={getTripImageUrl(trip)} 
                            alt={trip.destinationName} 
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                          />
                          <div className="absolute top-3 right-3 bg-indigo-650/90 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full shadow">
                            {trip.travelStyle}
                          </div>
                        </div>

                        {/* Upper Section */}
                        <div className="p-5 md:p-6 space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${statusColors[trip.status] || statusColors.Planning}`}>
                                {trip.status}
                              </span>
                              <h3 className="font-extrabold text-slate-850 dark:text-white text-base mt-2 truncate max-w-[220px]">
                                {trip.name}
                              </h3>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-indigo-500" />
                                {trip.destinationName}, {trip.stateName}
                              </p>
                            </div>
                            
                            {/* Collection Assignment dropdown */}
                            <select
                              className="text-[9px] font-bold p-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-pointer text-slate-500"
                              value={trip.collectionId || 'none'}
                              onChange={(e) => handleAssignCollection(trip.id, e.target.value)}
                            >
                              <option value="none">Folder: None</option>
                              {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-3 gap-2.5 text-center text-xs border-y border-slate-100 dark:border-slate-850/60 py-3">
                            <div>
                              <span className="text-[9px] text-slate-450 uppercase block font-bold tracking-wider">Duration</span>
                              <strong className="text-slate-750 dark:text-slate-200">{trip.duration} Days</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-450 uppercase block font-bold tracking-wider">Budget</span>
                              <strong className="text-slate-755 dark:text-slate-200 truncate block">{trip.budgetCategory}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-450 uppercase block font-bold tracking-wider">Cost</span>
                              <strong className="text-indigo-650 dark:text-indigo-405">₹{trip.estimatedCost.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold">
                            <span>Created: {trip.dateCreated}</span>
                            <span className="capitalize">{trip.travelStyle} • {trip.travelerType}</span>
                          </div>
                        </div>

                        {/* Lower buttons bar */}
                        <div className="px-5 py-4.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850/60 grid grid-cols-3 gap-2 text-xs font-bold select-none">
                          <button 
                            onClick={() => setViewingTrip(trip)}
                            className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl text-center cursor-pointer hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-650 transition"
                          >
                            View Plan
                          </button>
                          <button 
                            onClick={() => setSharingTrip(trip)}
                            className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-300 py-2 rounded-xl text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition"
                          >
                            Share
                          </button>
                          
                          {/* Actions drop list trigger */}
                          <div className="relative group">
                            <button className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-300 py-2 rounded-xl text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition">
                              Actions
                            </button>
                            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 hidden group-hover:block py-1">
                              <button 
                                onClick={() => {
                                  setEditingTrip(trip);
                                  setEditName(trip.name);
                                  setEditStatus(trip.status);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-950/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit Title/Status
                              </button>
                              <button 
                                onClick={() => handleDuplicateTrip(trip)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-950/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Duplicate Plan
                              </button>
                              <button 
                                onClick={() => window.print()}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-950/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Print Itinerary
                              </button>
                              <button 
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-red-955/20 text-[11px] font-semibold text-red-600 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Trip
                              </button>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-black text-slate-855 dark:text-white">My Saved Wishlist</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Discover, move to planners, and track your bucket list spots.</p>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                  <Heart className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Wishlist is empty</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm font-semibold">
                    You haven't added any tourist destinations to your wishlist yet. Explore destinations to add them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((place) => {
                    const ratingValue = place.ratingScores?.popularity 
                      ? place.ratingScores.popularity.toFixed(1) 
                      : '4.5';
                    const allowedImages = place.images || [];
                    const imgUrl = allowedImages[0] 
                      ? (allowedImages[0].startsWith('http') ? allowedImages[0] : `http://localhost:5000${allowedImages[0]}`)
                      : '';
                    return (
                      <motion.div 
                        key={place._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition flex flex-col h-full justify-between"
                      >
                        {/* Image wrapper */}
                        <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={place.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">No photos</div>
                          )}
                          <div className="absolute top-3 right-3 bg-indigo-600/90 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full shadow">
                            {place.category?.name || place.category || 'Spot'}
                          </div>
                          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] text-white flex items-center gap-0.5 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-450" />
                            <span>{ratingValue}</span>
                          </div>
                        </div>

                        {/* content */}
                        <div className="p-4 flex-grow text-left space-y-2.5">
                          <div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm truncate">{place.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{place.city?.name || place.city || ''}, {place.state?.name || place.state || ''}</p>
                          </div>

                          <div className="text-[10px] font-bold text-slate-450 space-y-1">
                            {place.bestTimeToVisit && <p className="truncate">🗓 Best time: {place.bestTimeToVisit}</p>}
                            <p>💰 Est. Budget: {place.entryFees?.adult ? `₹${place.entryFees.adult}` : 'Free Entry'}</p>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="p-3 border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/15 grid grid-cols-2 gap-2 text-[10px] font-bold">
                          <button 
                            onClick={() => handleMoveToPlanner(place)}
                            className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-1.5 rounded-lg text-center cursor-pointer hover:bg-indigo-600 hover:text-white transition"
                          >
                            Plan Trip
                          </button>
                          <button 
                            onClick={() => handleRemoveFromWishlist(place._id)}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-1.5 rounded-lg text-center cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition border border-transparent"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIP COLLECTIONS */}
          {activeTab === 'collections' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-855 dark:text-white">Trip Collections</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Organize your saved destinations and trips into custom folders.</p>
                </div>
                <button 
                  onClick={() => setCreatingCollection(true)}
                  className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs shadow transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Folder
                </button>
              </div>

              {/* Create Collection Dialog Overlay */}
              {creatingCollection && (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-3.5 items-end max-w-md">
                  <div className="flex-grow space-y-1.5 text-left w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Folder Name</label>
                    <input 
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g. South India Tour"
                      className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={handleCreateCollection}
                      className="bg-indigo-650 hover:bg-indigo-750 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setCreatingCollection(false)}
                      className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-450 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {collections.map(c => {
                  const itemsCount = trips.filter(t => t.collectionId === c.id).length;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => { setSelectedCollection(c.id); setActiveTab('trips'); }}
                      className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-500/20 transition duration-300 cursor-pointer flex items-center justify-between gap-4 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{c.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{itemsCount} Trip Plan{itemsCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TRIP STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div>
                <h2 className="text-2xl font-black text-slate-855 dark:text-white">Trip Statistics</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Analytics overview of your travel planning footprint across TravelBharat.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-2">
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Trips Saved</span>
                  <div className="text-3xl font-black text-slate-850 dark:text-white">{stats.tripsSaved}</div>
                  <p className="text-[9px] text-slate-400">Total custom itineraries mapped</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-2">
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Wishlist Count</span>
                  <div className="text-3xl font-black text-slate-850 dark:text-white">{stats.wishlistCount}</div>
                  <p className="text-[9px] text-slate-400">Destinations flagged for later</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-2">
                  <span className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">Budget Allocation</span>
                  <div className="text-3xl font-black text-indigo-650 dark:text-indigo-400">₹{stats.budgetTotal.toLocaleString()}</div>
                  <p className="text-[9px] text-slate-400">Cumulative budget ledger</p>
                </div>
              </div>

              {/* Progress status overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-850 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
                  <Star className="h-4.5 w-4.5 text-indigo-500" />
                  State Exploration Progress
                </h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  You have explored and pinned details in **{stats.statesExplored} out of 36** Indian States and Union Territories.
                </p>
                
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-650 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((stats.statesExplored / 36) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>0 States</span>
                    <span>{Math.round((stats.statesExplored / 36) * 100)}% Explored ({stats.statesExplored} / 36)</span>
                    <span>36 States</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* TAB 5: TRAVELER BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-855 dark:text-white flex items-center gap-2">
                    <Award className="h-7 w-7 text-amber-500 animate-pulse" />
                    Traveler Achievements
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Unlock exclusive digital badges as you explore India's diverse landscapes and cultures.
                  </p>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 px-4 py-2 rounded-2xl flex items-center gap-2 w-fit">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
                    Unlocked Badges:
                  </span>
                  <strong className="text-sm font-black text-amber-700 dark:text-amber-450">
                    {badgeInfo.unlockedCount} / 6
                  </strong>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-850/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between gap-6 items-center">
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Explore more of Bharat!</h3>
                    <p className="text-xs text-slate-505 dark:text-slate-400 font-medium leading-relaxed">
                      Every state added to your wishlist or saved itineraries helps you unlock new explorer levels. Visited States: <span className="font-bold text-slate-700 dark:text-slate-200">{badgeInfo.uniqueStatesList.join(', ') || 'None yet'}</span>
                    </p>
                  </div>
                  <div className="w-full sm:w-48 bg-slate-250 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-750">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${Math.round((badgeInfo.unlockedCount / 6) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {badgeInfo.badgeList.map(badge => {
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.div 
                      key={badge.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between shadow-md ${
                        badge.unlocked 
                          ? `bg-white dark:bg-slate-900 border-amber-500/30 dark:border-amber-500/20 shadow-amber-500/5` 
                          : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-808/80 opacity-75'
                      }`}
                    >
                      {/* Background design elements */}
                      {badge.unlocked && (
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-orange-500/0 rounded-full blur-xl pointer-events-none" />
                      )}

                      <div className="space-y-4">
                        {/* Icon Header */}
                        <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-2xl border ${
                            badge.unlocked 
                              ? `bg-gradient-to-br ${badge.color} text-white border-transparent shadow-lg ${badge.glowColor}` 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200/80 dark:border-slate-750'
                          }`}>
                            <BadgeIcon className="h-6 w-6 stroke-[2]" />
                          </div>
                          {badge.unlocked ? (
                            <span className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1">
                              <Check className="h-3 w-3 stroke-[3]" /> Unlocked
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-805 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-750 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                        </div>

                        {/* Title and Description */}
                        <div>
                          <h3 className={`font-black text-base ${badge.unlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {badge.title}
                          </h3>
                          <p className="text-xs text-slate-505 dark:text-slate-400/80 mt-1 font-medium leading-relaxed">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar & Footer info */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850/60 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={badge.unlocked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-550'}>
                            {badge.unlocked ? 'Achievement completed!' : 'Progress toward unlock'}
                          </span>
                          <span className={badge.unlocked ? 'text-slate-705 dark:text-slate-300' : 'text-slate-500'}>
                            {badge.current} / {badge.target}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden p-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              badge.unlocked 
                                ? `bg-gradient-to-r ${badge.color}` 
                                : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((badge.current / badge.target) * 100))}%` }}
                          />
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: VIEW TRIP DETAILS (TIMELINE & MAP) */}
      <AnimatePresence>
        {viewingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn print:hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-850">
                <div className="text-left">
                  <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                    {viewingTrip.travelStyle} • {viewingTrip.travelerType}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-850 dark:text-white mt-2">
                    {viewingTrip.name}
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-indigo-500" />
                    {viewingTrip.destinationName}, {viewingTrip.stateName}
                  </p>
                </div>
                <button 
                  onClick={() => setViewingTrip(null)}
                  className="p-2 bg-slate-105 dark:bg-slate-955 text-slate-400 hover:text-slate-200 rounded-full cursor-pointer transition border border-slate-200 dark:border-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                  <div className="p-3 bg-slate-50 dark:bg-slate-955/25 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-0.5">
                    <span className="text-[9px] text-slate-450 font-bold uppercase">Estimated Cost</span>
                    <strong className="text-indigo-650 dark:text-indigo-400 text-sm">₹{viewingTrip.estimatedCost.toLocaleString()}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-955/25 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-0.5">
                    <span className="text-[9px] text-slate-455 font-bold uppercase">Trip Duration</span>
                    <strong className="text-slate-750 dark:text-slate-200 text-sm">{viewingTrip.duration} Days</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-955/25 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-0.5">
                    <span className="text-[9px] text-slate-455 font-bold uppercase">Budget level</span>
                    <strong className="text-slate-755 dark:text-slate-200 text-sm">{viewingTrip.budgetCategory}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-955/25 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-0.5">
                    <span className="text-[9px] text-slate-455 font-bold uppercase">Trip Status</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{viewingTrip.status}</strong>
                  </div>
                </div>

                {/* Day timeline */}
                {viewingTrip.itinerary && viewingTrip.itinerary.length > 0 ? (
                  <div className="space-y-4 text-left">
                    <h4 className="font-extrabold text-slate-850 dark:text-white text-sm uppercase tracking-wide">Itinerary Schedule Stops</h4>
                    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6">
                      {viewingTrip.itinerary.map(day => (
                        <div key={day.dayIndex} className="relative space-y-2.5">
                          {/* dot */}
                          <div className="absolute -left-[30px] top-1.5 bg-indigo-600 border border-indigo-650 w-3 h-3 rounded-full"></div>
                          <div>
                            <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-bold uppercase">Day {day.dayIndex} - {day.spotName}</span>
                            <div className="bg-slate-50 dark:bg-slate-955/30 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 mt-1.5 space-y-3.5 text-xs">
                              {/* slots */}
                              <div className="flex gap-2 items-start">
                                <span className="text-amber-500 font-bold flex-shrink-0">🌅 Morning:</span>
                                <span className="text-slate-600 dark:text-slate-350">{day.morningText}</span>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="text-rose-500 font-bold flex-shrink-0">🍴 Lunch:</span>
                                <span className="text-slate-600 dark:text-slate-350">
                                  Dine at <strong>{day.dining?.restaurantName}</strong> (Specialty: {day.dining?.specialty}, Cost: {day.dining?.costForTwo}).
                                </span>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="text-sky-500 font-bold flex-shrink-0">🌇 Evening:</span>
                                <span className="text-slate-600 dark:text-slate-350">{day.eveningText}</span>
                              </div>
                              <div className="flex gap-2 items-start border-t border-slate-100 dark:border-slate-850 pt-2.5">
                                <span className="text-emerald-500 font-bold flex-shrink-0">🏨 Stay:</span>
                                <span className="text-slate-600 dark:text-slate-350">
                                  Lodge at <strong>{day.hotel?.name}</strong> ({day.hotel?.priceRange}, Rating: {day.hotel?.rating}★).
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl text-xs font-semibold text-slate-400">
                    No timeline schedule saved for this plan.
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/15 flex justify-end gap-2.5">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-2 px-4 rounded-xl text-xs shadow cursor-pointer select-none"
                >
                  Print / Save PDF
                </button>
                <button 
                  onClick={() => setViewingTrip(null)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer select-none"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT TRIP DIALOG */}
      <AnimatePresence>
        {editingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn print:hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/80 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-850 dark:text-white text-base">Edit Trip Properties</h3>
                <button onClick={() => setEditingTrip(null)} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4 text-left text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trip Plan Name</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trip Planning Status</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    {['Planning', 'Upcoming', 'Completed', 'Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-850/60">
                <button 
                  onClick={handleSaveEdit}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditingTrip(null)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-450 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SHARE TRIP OPTIONS */}
      <AnimatePresence>
        {sharingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn print:hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/80 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-855 dark:text-white text-base">Share Itinerary</h3>
                <button onClick={() => setSharingTrip(null)} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
              </div>

              <p className="text-xs text-slate-500 text-left font-semibold">Anyone with the shared link will be able to view the full day-by-day timeline, hotels, activities, and budget ledger of **{sharingTrip.name}**.</p>

              <div className="space-y-3 pt-2">
                {/* Copy Link */}
                <button 
                  onClick={() => copyShareLink(sharingTrip)}
                  className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-3 transition cursor-pointer border border-slate-200 dark:border-slate-850"
                >
                  <Copy className="h-4.5 w-4.5 text-indigo-500" />
                  Copy URL Share Link
                </button>

                {/* WhatsApp */}
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my travel plan for ${sharingTrip.destinationName}: ${getShareLink(sharingTrip)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 hover:text-emerald-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-3 transition cursor-pointer border border-slate-200 dark:border-slate-850"
                >
                  <Share2 className="h-4.5 w-4.5 text-emerald-500" />
                  Share via WhatsApp
                </a>

                {/* Email */}
                <a 
                  href={`mailto:?subject=${encodeURIComponent(`TravelBharat Trip Plan: ${sharingTrip.name}`)}&body=${encodeURIComponent(`I constructed a custom itinerary for ${sharingTrip.destinationName} on TravelBharat! Check it out here:\n\n${getShareLink(sharingTrip)}`)}`}
                  className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-sky-50/30 dark:hover:bg-sky-950/10 hover:text-sky-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-3 transition cursor-pointer border border-slate-200 dark:border-slate-850"
                >
                  <Clock className="h-4.5 w-4.5 text-sky-500" />
                  Share via Email
                </a>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-850/60">
                <button 
                  onClick={() => setSharingTrip(null)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MyTrips;
