import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, MapPin, Tag, Globe, RotateCcw, Calendar, Compass } from 'lucide-react';
import PlaceCard from '../components/PlaceCard';
import Breadcrumb from '../components/Breadcrumb';
import SEO from '../components/SEO';
import { clearImageRegistry } from '../components/SafeImage';
import ItineraryPlanner from '../components/ItineraryPlanner';

const Explore = () => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Selected Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [recType, setRecType] = useState('');
  const [plannerOpen, setPlannerOpen] = useState(false);

  // Fetch unique filter options
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [statesRes, categoriesRes] = await Promise.all([
          axios.get(`${window.API_BASE_URL}/api/states`),
          axios.get(`${window.API_BASE_URL}/api/categories`)
        ]);
        setStates(statesRes.data);
        setCategories(categoriesRes.data);

        // Parse query params
        const params = new URLSearchParams(location.search);
        
        // Category param
        const catParam = params.get('category');
        if (catParam) {
          const matched = categoriesRes.data.find(c => 
            c.slug === catParam.toLowerCase() || 
            c.name.toLowerCase() === catParam.toLowerCase()
          );
          if (matched) setSelectedCategory(matched._id);
        }

        // State param
        const stateParam = params.get('state');
        if (stateParam) {
          const matched = statesRes.data.find(s => 
            s.slug === stateParam.toLowerCase() || 
            s.name.toLowerCase() === stateParam.toLowerCase()
          );
          if (matched) setSelectedState(matched._id);
        }

        // Filter param (trending/weekend/gems)
        const filterParam = params.get('filter');
        if (filterParam) {
          if (filterParam === 'trending') setRecType('trending');
          else if (filterParam === 'hidden-gems') setRecType('hidden-gems');
          else if (filterParam === 'weekend') setRecType('weekend');
        }

        // Planner param
        if (params.get('planner') === 'true') {
          setPlannerOpen(true);
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFiltersData();
  }, [location.search]);

  // Fetch cities when state changes (dynamic city dropdown)
  useEffect(() => {
    const fetchCitiesForState = async () => {
      if (!selectedState) {
        setCities([]);
        setSelectedCity('');
        return;
      }
      try {
        const res = await axios.get(`${window.API_BASE_URL}/api/cities?state=${selectedState}`);
        setCities(res.data);
        if (!res.data.find(c => c._id === selectedCity)) {
          setSelectedCity('');
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCitiesForState();
  }, [selectedState]);

  // Trigger search on filter change
  useEffect(() => {
    fetchFilteredPlaces();
  }, [selectedState, selectedCity, selectedCategory, recType]);

  const fetchFilteredPlaces = async () => {
    clearImageRegistry();
    setLoading(true);
    try {
      let url = `${window.API_BASE_URL}/api/places?`;
      if (selectedState) url += `state=${selectedState}&`;
      if (selectedCity) url += `city=${selectedCity}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (recType) url += `recommendationType=${recType}&`;
      
      const res = await axios.get(url);
      setPlaces(res.data);
      applySeasonFilter(res.data, selectedSeason);
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  };

  // Local filter for Season
  useEffect(() => {
    applySeasonFilter(places, selectedSeason);
  }, [selectedSeason, places]);

  const applySeasonFilter = (placesList, season) => {
    if (!season) {
      setFilteredPlaces(placesList);
      return;
    }
    const filtered = placesList.filter(place => {
      const bestTime = place.bestTimeToVisit.toLowerCase();
      if (season === 'winter') {
        return bestTime.includes('october') || bestTime.includes('november') || bestTime.includes('december') || bestTime.includes('january') || bestTime.includes('february') || bestTime.includes('march') || bestTime.includes('winter');
      }
      if (season === 'summer') {
        return bestTime.includes('march') || bestTime.includes('april') || bestTime.includes('may') || bestTime.includes('june') || bestTime.includes('summer');
      }
      if (season === 'monsoon') {
        return bestTime.includes('july') || bestTime.includes('august') || bestTime.includes('september') || bestTime.includes('monsoon');
      }
      return true;
    });
    setFilteredPlaces(filtered);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFilteredPlaces();
  };

  const resetAllFilters = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedCategory('');
    setSelectedSeason('');
    setSearchQuery('');
    // Direct load all
    setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${window.API_BASE_URL}/api/places`);
        setPlaces(res.data);
        setFilteredPlaces(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const breadcrumbItems = [{ label: 'Explore India', url: '/explore' }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-left">
      <SEO 
        title="Search Destinations" 
        description="Filter and search through 1000+ Indian travel places. Filter by State, City, Category, and Season to plan your next itinerary."
      />
      
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-1/4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-850">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-indigo-650 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Filters</h2>
            </div>
            <button
              onClick={resetAllFilters}
              className="text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-855 dark:hover:text-indigo-305 font-bold flex items-center cursor-pointer gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          
          {/* State Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-1.5 text-indigo-500" />
              State / UT
            </label>
            <select 
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-305 font-semibold text-sm transition cursor-pointer"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">All States & UTs</option>
              {states.map(state => (
                <option key={state._id} value={state._id}>{state.name}</option>
              ))}
            </select>
          </div>
 
          {/* City Filter (Conditional) */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1.5 text-indigo-500" />
              City / Town
            </label>
            <select 
              className={`w-full p-3 border rounded-xl outline-none font-semibold text-sm transition cursor-pointer ${
                !selectedState 
                ? 'bg-slate-105 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                : 'bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedState}
            >
              <option value="">{selectedState ? 'All Cities' : 'Select a State First'}</option>
              {cities.map(city => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>
          </div>
 
          {/* Season Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-indigo-500" />
              Best Season
            </label>
            <select 
              className="w-full p-3 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-300 font-semibold text-sm transition cursor-pointer"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              <option value="">Any Season</option>
              <option value="winter">Winter (Oct - Mar)</option>
              <option value="summer">Summer (Apr - Jun)</option>
              <option value="monsoon">Monsoon (Jul - Sep)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center">
              <Tag className="h-4 w-4 mr-1.5 text-indigo-500" />
              Category
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="category" 
                  value="" 
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                  className="text-indigo-650 dark:text-indigo-450 focus:ring-indigo-500/20 h-4 w-4 border-slate-305 dark:border-slate-750 dark:bg-slate-950"
                />
                <span className="ml-3 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">All Categories</span>
              </label>
              {categories.map(cat => (
                <label key={cat._id} className="flex items-center cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat._id}
                    checked={selectedCategory === cat._id}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-indigo-650 dark:text-indigo-450 focus:ring-indigo-500/20 h-4 w-4 border-slate-305 dark:border-slate-750 dark:bg-slate-955"
                  />
                  <span className="ml-3 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="w-full lg:w-3/4">
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-6 flex shadow-sm rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
            <div className="relative flex-grow bg-white dark:bg-slate-900">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search by state, city, category, or place name..." 
                className="w-full pl-11 pr-4 py-4 focus:outline-none text-slate-705 dark:text-slate-300 bg-transparent text-sm font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-indigo-600 dark:bg-indigo-700 text-white px-8 py-4 font-bold hover:bg-indigo-700 dark:hover:bg-indigo-650 transition cursor-pointer text-sm"
            >
              Search
            </button>
          </form>
 
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 dark:border-slate-850 border-b-indigo-600"></div>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <MapPin className="h-16 w-16 text-slate-300 dark:text-slate-705 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No destinations found</h3>
              <p className="text-slate-500 dark:text-slate-405 mt-2 max-w-sm mx-auto text-sm font-medium">
                Try clearing search terms or modifying filters.
              </p>
              <button 
                onClick={resetAllFilters}
                className="mt-6 inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">
                  Found {filteredPlaces.length} destination{filteredPlaces.length !== 1 && 's'}
                </p>
              </div>

              {/* Collapsible Interactive Trip Planner Panel */}
              {(selectedCity || selectedCategory || selectedState) && filteredPlaces.length > 0 && (
                <div className="mb-8 bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-1 border border-slate-200/50 dark:border-slate-800/50">
                  <details open={plannerOpen} className="group [&_summary::-webkit-details-marker]:hidden" onToggle={(e) => setPlannerOpen(e.currentTarget.open)}>
                    <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-950 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
                          <Compass className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                            Interactive AI Trip Planner
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                            Plan an itinerary with the selected destinations.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-650 dark:text-indigo-400 font-bold group-open:hidden">
                        Expand Planner &rarr;
                      </span>
                      <span className="text-xs text-indigo-650 dark:text-indigo-400 font-bold hidden group-open:inline">
                        Collapse Planner &darr;
                      </span>
                    </summary>
                    <div className="p-5 pt-0 border-t border-slate-200/40 dark:border-slate-800/40">
                      <ItineraryPlanner 
                        places={filteredPlaces} 
                        title={
                          selectedCity 
                            ? cities.find(c => c._id === selectedCity)?.name 
                            : selectedState 
                            ? states.find(s => s._id === selectedState)?.name 
                            : selectedCategory 
                            ? categories.find(cat => cat._id === selectedCategory)?.name 
                            : "Selected Filter"
                        } 
                        defaultDuration={4} 
                      />
                    </div>
                  </details>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredPlaces.map(place => (
                  <PlaceCard key={place._id} place={place} />
                ))}
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default Explore;
