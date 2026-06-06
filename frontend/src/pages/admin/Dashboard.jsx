import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, 
  Map, 
  MapPin, 
  Tag, 
  Compass, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  X, 
  Briefcase, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Eye,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, places, states, cities, categories, import
  const navigate = useNavigate();

  // Database Data States
  const [places, setPlaces] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bulk Import States
  const [importJson, setImportJson] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls add/edit item modal
  const [modalType, setModalType] = useState(''); // place, state, city, category
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);

  // Dynamic Cities for Place Form
  const [filteredCities, setFilteredCities] = useState([]);

  // Form States
  const [formPlace, setFormPlace] = useState({
    name: '',
    slug: '',
    state: '',
    city: '',
    category: '',
    description: '',
    history: '',
    bestTimeToVisit: '',
    weatherInfo: '',
    entryFee: 'Free',
    timings: 'Open 24 hours',
    location: '',
    images: [],
    nearbyAttractions: '', // Comma-separated input, will convert to array on save
    travelTips: '', // Comma-separated input, will convert to array on save
    isHiddenGem: false,
    isTrending: false,
    isWeekendGetaway: false
  });

  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    capital: '',
    description: '',
    bannerImage: '',
    popularFor: '',
    facts: '' // Comma-separated input, will convert to array on save
  });

  const [formCity, setFormCity] = useState({
    name: '',
    slug: '',
    state: '',
    description: ''
  });

  const [formCategory, setFormCategory] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Compass'
  });

  // Verify auth on mount
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (!localToken) {
      navigate('/admin/login');
      return;
    }
    setToken(localToken);
    loadAllData();
  }, [navigate]);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [placesRes, statesRes, citiesRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/places'),
        axios.get('http://localhost:5000/api/states'),
        axios.get('http://localhost:5000/api/cities'),
        axios.get('http://localhost:5000/api/categories')
      ]);
      setPlaces(placesRes.data);
      setStates(statesRes.data);
      setCities(citiesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setErrorMsg('Failed to load database data. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger alert timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Filter cities in Place Form based on selected State
  useEffect(() => {
    if (formPlace.state) {
      const matched = cities.filter(c => c.state?._id === formPlace.state || c.state === formPlace.state);
      setFilteredCities(matched);
    } else {
      setFilteredCities([]);
    }
  }, [formPlace.state, cities]);

  // Helper to format image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:5000${imagePath}`;
  };

  // Auto-slug generator helper
  const handleNameChange = (e, type) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (type === 'place') {
      setFormPlace(prev => ({ ...prev, name: val, slug: generatedSlug }));
    } else if (type === 'state') {
      setFormState(prev => ({ ...prev, name: val, slug: generatedSlug }));
    } else if (type === 'city') {
      setFormCity(prev => ({ ...prev, name: val, slug: generatedSlug }));
    } else if (type === 'category') {
      setFormCategory(prev => ({ ...prev, name: val, slug: generatedSlug }));
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadHeaders = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token || localStorage.getItem('token')}`
        }
      };

      const res = await axios.post('http://localhost:5000/api/places/upload', formData, uploadHeaders);
      
      if (modalType === 'place') {
        setFormPlace(prev => ({
          ...prev,
          images: [...prev.images, res.data.imageUrl]
        }));
      } else if (modalType === 'state') {
        setFormState(prev => ({
          ...prev,
          bannerImage: res.data.imageUrl
        }));
      }
      setSuccessMsg('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Image upload failed.');
    }
  };

  // Delete Handlers
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      let url = '';
      if (type === 'place') url = `/api/places/${id}`;
      else if (type === 'state') url = `/api/states/${id}`;
      else if (type === 'city') url = `/api/cities/${id}`;
      else if (type === 'category') url = `/api/categories/${id}`;

      await axios.delete(`http://localhost:5000${url}`, authHeaders);
      setSuccessMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      loadAllData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || `Failed to delete ${type}.`);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      let url = 'http://localhost:5000';
      let data = {};

      if (modalType === 'place') {
        url += modalMode === 'add' ? '/api/places' : `/api/places/${editingId}`;
        
        if (!formPlace.name || !formPlace.slug || !formPlace.state || !formPlace.city || !formPlace.category || !formPlace.description || !formPlace.bestTimeToVisit) {
          setErrorMsg('Please fill in all required fields.');
          return;
        }

        const nearbyAttractionsArray = formPlace.nearbyAttractions
          ? formPlace.nearbyAttractions.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];

        const travelTipsArray = formPlace.travelTips
          ? formPlace.travelTips.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];

        data = {
          ...formPlace,
          nearbyAttractions: nearbyAttractionsArray,
          travelTips: travelTipsArray
        };
      } 
      else if (modalType === 'state') {
        url += modalMode === 'add' ? '/api/states' : `/api/states/${editingId}`;
        if (!formState.name || !formState.slug || !formState.capital || !formState.description || !formState.bannerImage) {
          setErrorMsg('Name, slug, capital, description, and banner image are required.');
          return;
        }
        
        const factsArray = formState.facts
          ? formState.facts.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];

        data = {
          ...formState,
          facts: factsArray
        };
      } 
      else if (modalType === 'city') {
        url += modalMode === 'add' ? '/api/cities' : `/api/cities/${editingId}`;
        if (!formCity.name || !formCity.slug || !formCity.state) {
          setErrorMsg('City name, slug, and state are required.');
          return;
        }
        data = formCity;
      } 
      else if (modalType === 'category') {
        url += modalMode === 'add' ? '/api/categories' : `/api/categories/${editingId}`;
        if (!formCategory.name || !formCategory.slug) {
          setErrorMsg('Category name and slug are required.');
          return;
        }
        data = formCategory;
      }

      if (modalMode === 'add') {
        await axios.post(url, data, authHeaders);
        setSuccessMsg(`New ${modalType} added successfully!`);
      } else {
        await axios.put(url, data, authHeaders);
        setSuccessMsg(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} updated successfully!`);
      }

      setIsModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Operation failed. Verify entries.');
    }
  };

  // Run Bulk Import API
  const handleBulkImport = async () => {
    setErrorMsg('');
    setImportResults(null);
    
    if (!importJson.trim()) {
      setErrorMsg('Please paste a JSON array first.');
      return;
    }

    try {
      const parsedData = JSON.parse(importJson);
      if (!Array.isArray(parsedData)) {
        setErrorMsg('Pasted data must be a JSON array [{}, {}].');
        return;
      }

      setImporting(true);
      const res = await axios.post('http://localhost:5000/api/places/bulk-import', parsedData, authHeaders);
      setImportResults(res.data);
      setSuccessMsg('Bulk import completed!');
      loadAllData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'JSON parsing failed. Please check JSON syntax.');
    } finally {
      setImporting(false);
    }
  };

  // Open Add Modals
  const openAddModal = (type) => {
    setModalType(type);
    setModalMode('add');
    setEditingId(null);
    setErrorMsg('');

    if (type === 'place') {
      setFormPlace({
        name: '', slug: '', state: '', city: '', category: '', description: '', history: '',
        bestTimeToVisit: '', weatherInfo: '', entryFee: 'Free', timings: 'Open 24 hours',
        location: '', images: [], nearbyAttractions: '', travelTips: '', isHiddenGem: false,
        isTrending: false, isWeekendGetaway: false
      });
    } else if (type === 'state') {
      setFormState({ name: '', slug: '', capital: '', description: '', bannerImage: '', popularFor: '', facts: '' });
    } else if (type === 'city') {
      setFormCity({ name: '', slug: '', state: '', description: '' });
    } else if (type === 'category') {
      setFormCategory({ name: '', slug: '', description: '', icon: 'Compass' });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modals
  const openEditModal = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setEditingId(item._id);
    setErrorMsg('');

    if (type === 'place') {
      setFormPlace({
        name: item.name,
        slug: item.slug || '',
        state: item.state?._id || item.state,
        city: item.city?._id || item.city,
        category: item.category?._id || item.category,
        description: item.description,
        history: item.history || '',
        bestTimeToVisit: item.bestTimeToVisit,
        weatherInfo: item.weatherInfo || '',
        entryFee: item.entryFee,
        timings: item.timings,
        location: item.location || '',
        images: item.images || [],
        nearbyAttractions: item.nearbyAttractions ? item.nearbyAttractions.join(', ') : '',
        travelTips: item.travelTips ? item.travelTips.join(', ') : '',
        isHiddenGem: item.isHiddenGem || false,
        isTrending: item.isTrending || false,
        isWeekendGetaway: item.isWeekendGetaway || false
      });
    } else if (type === 'state') {
      setFormState({
        name: item.name,
        slug: item.slug || '',
        capital: item.capital || '',
        description: item.description,
        bannerImage: item.bannerImage,
        popularFor: item.popularFor || '',
        facts: item.facts ? item.facts.join(', ') : ''
      });
    } else if (type === 'city') {
      setFormCity({
        name: item.name,
        slug: item.slug || '',
        state: item.state?._id || item.state,
        description: item.description || ''
      });
    } else if (type === 'category') {
      setFormCategory({
        name: item.name,
        slug: item.slug || '',
        description: item.description || '',
        icon: item.icon || 'Compass'
      });
    }
    setIsModalOpen(true);
  };

  // Analytics Helpers
  const totalViews = places.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
  const trendingList = [...places].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-16rem)] text-left">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-1/4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/50 h-fit lg:sticky lg:top-24">
        <div className="flex items-center space-x-2 pb-5 mb-5 border-b border-slate-100">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Admin Control</h2>
        </div>
        
        <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-3 lg:pb-0 select-none no-scrollbar">
          <button
            onClick={() => { setActiveTab('overview'); loadAllData(); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Overview
          </button>
          
          <button
            onClick={() => { setActiveTab('places'); loadAllData(); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'places' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="h-4 w-4" />
            Places ({places.length})
          </button>

          <button
            onClick={() => { setActiveTab('states'); loadAllData(); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'states' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Map className="h-4 w-4" />
            States ({states.length})
          </button>

          <button
            onClick={() => { setActiveTab('cities'); loadAllData(); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'cities' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Cities ({cities.length})
          </button>

          <button
            onClick={() => { setActiveTab('categories'); loadAllData(); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Tag className="h-4 w-4" />
            Categories ({categories.length})
          </button>

          <button
            onClick={() => { setActiveTab('import'); }}
            className={`px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-shrink-0 flex items-center gap-2.5 ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Bulk Import
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="w-full lg:w-3/4 bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/50">
        
        {/* Toast Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 text-xs font-bold mb-6 flex items-center shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-4 text-xs font-bold mb-6 flex items-center shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading && activeTab !== 'import' ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-indigo-600"></div>
          </div>
        ) : (
          <div>
            
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Overview Analytics</h1>
                  <p className="text-xs text-slate-400 font-semibold">Real-time statistics of database metrics.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl text-center shadow-inner">
                    <h3 className="text-2xl font-extrabold text-indigo-600 mb-0.5">{places.length}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destinations</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl text-center shadow-inner">
                    <h3 className="text-2xl font-extrabold text-indigo-600 mb-0.5">{states.length}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">States & UTs</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl text-center shadow-inner">
                    <h3 className="text-2xl font-extrabold text-indigo-600 mb-0.5">{cities.length}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cities</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl text-center shadow-inner">
                    <h3 className="text-2xl font-extrabold text-emerald-600 mb-0.5 flex items-center justify-center gap-1">
                      <Eye className="h-5 w-5 text-emerald-500" />
                      {totalViews}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Page Views</p>
                  </div>
                </div>

                {/* Most Viewed Table */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-200/50 flex items-center gap-2">
                    <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                    Most Visited Destinations (Top 5)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                          <th className="pb-3">Destination Name</th>
                          <th className="pb-3">State</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3 text-right">Page Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                        {trendingList.map(p => (
                          <tr key={p._id} className="hover:bg-white/50 transition">
                            <td className="py-3 font-bold text-slate-800">{p.name}</td>
                            <td className="py-3">{p.state?.name || 'Unknown'}</td>
                            <td className="py-3">{p.category?.name || 'Unknown'}</td>
                            <td className="py-3 text-right font-extrabold text-emerald-600 flex items-center justify-end gap-1">
                              <Eye className="h-3.5 w-3.5 text-emerald-500" />
                              {p.viewsCount || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* PLACES CONTROL PANEL */}
            {activeTab === 'places' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">Tourist Destinations</h1>
                    <p className="text-xs text-slate-400 font-semibold">Perform CRUD actions on travel places.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal('place')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Add Place
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="p-4 rounded-l-xl">Img</th>
                        <th className="p-4">Place Name</th>
                        <th className="p-4">SEO Slug</th>
                        <th className="p-4">City / State</th>
                        <th className="p-4">Page Views</th>
                        <th className="p-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {places.map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <img 
                              src={getImageUrl(p.images[0])} 
                              alt={p.name} 
                              className="h-10 w-12 rounded-lg object-cover border border-slate-200"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-800">{p.name}</td>
                          <td className="p-4 font-mono text-slate-400">{p.slug}</td>
                          <td className="p-4 text-slate-500">
                            {p.city?.name || p.city}, {p.state?.name || p.state}
                          </td>
                          <td className="p-4 text-emerald-600 font-bold">{p.viewsCount || 0}</td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal('place', p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete('place', p._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STATES CONTROL PANEL */}
            {activeTab === 'states' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">States & UTs</h1>
                    <p className="text-xs text-slate-400 font-semibold">Create or edit state regions.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal('state')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add State
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="p-4 rounded-l-xl">Banner</th>
                        <th className="p-4">State Name</th>
                        <th className="p-4">Capital</th>
                        <th className="p-4">SEO Slug</th>
                        <th className="p-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {states.map(s => (
                        <tr key={s._id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <img 
                              src={getImageUrl(s.bannerImage)} 
                              alt={s.name} 
                              className="h-10 w-16 rounded-lg object-cover border border-slate-200"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-800">{s.name}</td>
                          <td className="p-4 font-bold text-indigo-600">{s.capital}</td>
                          <td className="p-4 font-mono text-slate-400">{s.slug}</td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal('state', s)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete('state', s._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CITIES CONTROL PANEL */}
            {activeTab === 'cities' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">Cities & Towns</h1>
                    <p className="text-xs text-slate-400 font-semibold">Link cities to states.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal('city')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add City
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="p-4 rounded-l-xl">City Name</th>
                        <th className="p-4">SEO Slug</th>
                        <th className="p-4">State</th>
                        <th className="p-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {cities.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800">{c.name}</td>
                          <td className="p-4 font-mono text-slate-400">{c.slug}</td>
                          <td className="p-4 text-indigo-600 font-bold">{c.state?.name || 'UnknownState'}</td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal('city', c)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete('city', c._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CATEGORIES CONTROL PANEL */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">Travel Categories</h1>
                    <p className="text-xs text-slate-400 font-semibold">Categorize travel spots.</p>
                  </div>
                  <button 
                    onClick={() => openAddModal('category')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Category
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                        <th className="p-4 rounded-l-xl">Category Name</th>
                        <th className="p-4">SEO Slug</th>
                        <th className="p-4">Icon Name</th>
                        <th className="p-4 rounded-r-xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {categories.map(cat => (
                        <tr key={cat._id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                          <td className="p-4 font-mono text-slate-400">{cat.slug}</td>
                          <td className="p-4 text-indigo-600 font-bold">{cat.icon}</td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal('category', cat)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete('category', cat._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BULK IMPORT CONTROL PANEL */}
            {activeTab === 'import' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">JSON Bulk Import Console</h1>
                  <p className="text-xs text-slate-400 font-semibold">Load a batch of destinations in a single click.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/50 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-indigo-500" />
                    Paste Destination Data (JSON Array format)
                  </h3>
                  
                  <textarea
                    rows="10"
                    placeholder={`[
  {
    "name": "Ooty botanical gardens",
    "stateName": "Tamil Nadu",
    "cityName": "Ooty",
    "categoryName": "Nature",
    "description": "Exquisite garden.",
    "bestTimeToVisit": "October to March",
    "images": ["https://images.unsplash.com/..."]
  }
]`}
                    className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono text-slate-700 bg-white"
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />

                  <button
                    onClick={handleBulkImport}
                    disabled={importing}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      importing ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {importing ? 'Importing...' : 'Run Import'}
                  </button>
                </div>

                {importResults && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-fadeIn space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Import Results
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center font-bold text-xs">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800">
                        <span className="text-xl block text-emerald-600 mb-0.5">{importResults.successCount}</span>
                        Success Count
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-800">
                        <span className="text-xl block text-red-600 mb-0.5">{importResults.errorCount}</span>
                        Fail Count
                      </div>
                    </div>
                    
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Error Log</h4>
                        <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono text-red-600">
                          {importResults.errors.map((err, idx) => (
                            <div key={idx} className="pb-2 border-b border-slate-100 last:border-0">
                              [Place: {err.name}] at index {err.index} - Error: {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* POPUP MODAL FOR ADD / EDIT OPERATIONS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 md:p-8 relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
              {modalMode === 'add' ? 'Add New' : 'Edit'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 text-slate-700">
              
              {/* PLACE FORM FIELDS */}
              {modalType === 'place' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Place Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.name}
                      onChange={(e) => handleNameChange(e, 'place')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SEO Slug (unique) *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold font-mono"
                      value={formPlace.slug}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">State *</label>
                    <select 
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.state}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, state: e.target.value, city: '' }))}
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City / Town *</label>
                    <select 
                      required
                      disabled={!formPlace.state}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold disabled:opacity-50"
                      value={formPlace.city}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, city: e.target.value }))}
                    >
                      <option value="">{formPlace.state ? 'Select City' : 'Choose state first'}</option>
                      {filteredCities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category *</label>
                    <select 
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.category}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Best Season *</label>
                    <input 
                      type="text" required placeholder="e.g. October to March"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.bestTimeToVisit}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, bestTimeToVisit: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Entry Fee</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.entryFee}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, entryFee: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Timings</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.timings}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, timings: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Weather Information</label>
                    <input 
                      type="text" placeholder="Summer: 25C-38C, Winter: 12C-22C"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.weatherInfo}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, weatherInfo: e.target.value }))}
                    />
                  </div>

                  {/* Recommendation Flags */}
                  <div className="sm:col-span-2 bg-slate-50 p-4 border border-slate-200/50 rounded-2xl flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider select-none">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formPlace.isTrending}
                        onChange={(e) => setFormPlace(prev => ({ ...prev, isTrending: e.target.checked }))}
                        className="text-indigo-600 focus:ring-indigo-500/20 h-4 w-4 border-slate-300"
                      />
                      <span>Trending Destination</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formPlace.isHiddenGem}
                        onChange={(e) => setFormPlace(prev => ({ ...prev, isHiddenGem: e.target.checked }))}
                        className="text-indigo-600 focus:ring-indigo-500/20 h-4 w-4 border-slate-300"
                      />
                      <span>Hidden Gem</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formPlace.isWeekendGetaway}
                        onChange={(e) => setFormPlace(prev => ({ ...prev, isWeekendGetaway: e.target.checked }))}
                        className="text-indigo-600 focus:ring-indigo-500/20 h-4 w-4 border-slate-300"
                      />
                      <span>Weekend Getaway</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Overview *</label>
                    <textarea 
                      required rows="3"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold leading-relaxed"
                      value={formPlace.description}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">History & Heritage Details</label>
                    <textarea 
                      rows="2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold leading-relaxed"
                      value={formPlace.history}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, history: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Travel Tips (comma separated)</label>
                    <input 
                      type="text" placeholder="Respect local customs, Plan early morning trips"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.travelTips}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, travelTips: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nearby Places (comma separated)</label>
                    <input 
                      type="text" placeholder="Central Mall, Scenic park"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formPlace.nearbyAttractions}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, nearbyAttractions: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Google Maps Embed HTML</label>
                    <input 
                      type="text" placeholder='<iframe src="https://..." ...></iframe>'
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono text-slate-700"
                      value={formPlace.location}
                      onChange={(e) => setFormPlace(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  {/* Image uploads */}
                  <div className="sm:col-span-2 space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Images List</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" id="placeImgUrl" placeholder="Enter image URL"
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              setFormPlace(prev => ({ ...prev, images: [...prev.images, val] }));
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('placeImgUrl');
                          if (el.value.trim()) {
                            setFormPlace(prev => ({ ...prev, images: [...prev.images, el.value.trim()] }));
                            el.value = '';
                          }
                        }}
                        className="bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider px-3 rounded-xl cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>

                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex flex-col items-center justify-center py-4">
                          <Upload className="w-6 h-6 mb-1 text-indigo-500" />
                          <p className="text-xs text-slate-500 font-bold">Upload Local File</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>

                    {formPlace.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formPlace.images.map((img, idx) => (
                          <div key={idx} className="relative h-12 w-16 rounded border border-slate-200 overflow-hidden shadow-sm">
                            <img src={getImageUrl(img)} alt="Upload" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormPlace(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATE FORM FIELDS */}
              {modalType === 'state' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">State Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formState.name}
                      onChange={(e) => handleNameChange(e, 'state')}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SEO Slug *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold font-mono"
                      value={formState.slug}
                      onChange={(e) => setFormState(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Capital *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formState.capital}
                      onChange={(e) => setFormState(prev => ({ ...prev, capital: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description *</label>
                    <textarea 
                      required rows="3"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formState.description}
                      onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Popular For</label>
                    <input 
                      type="text" placeholder="Temples, Beaches"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formState.popularFor}
                      onChange={(e) => setFormState(prev => ({ ...prev, popularFor: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Regional Facts (comma separated)</label>
                    <input 
                      type="text" placeholder="Official Language: Tamil, Area: 130000sq km"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formState.facts}
                      onChange={(e) => setFormState(prev => ({ ...prev, facts: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Banner Image URL *</label>
                    <input 
                      type="text" required placeholder="https://unsplash.com/..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold"
                      value={formState.bannerImage}
                      onChange={(e) => setFormState(prev => ({ ...prev, bannerImage: e.target.value }))}
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex-grow">
                        <label className="flex items-center justify-center p-2.5 border border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition text-xs font-bold text-slate-600 gap-1.5">
                          <Upload className="h-4 w-4 text-indigo-500" />
                          <span>Upload Banner file</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                      {formState.bannerImage && (
                        <div className="h-10 w-16 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={getImageUrl(formState.bannerImage)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CITY FORM FIELDS */}
              {modalType === 'city' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCity.name}
                      onChange={(e) => handleNameChange(e, 'city')}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SEO Slug *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold font-mono"
                      value={formCity.slug}
                      onChange={(e) => setFormCity(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">State *</label>
                    <select 
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCity.state}
                      onChange={(e) => setFormCity(prev => ({ ...prev, state: e.target.value }))}
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea 
                      rows="2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCity.description}
                      onChange={(e) => setFormCity(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* CATEGORY FORM FIELDS */}
              {modalType === 'category' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category Name *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCategory.name}
                      onChange={(e) => handleNameChange(e, 'category')}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SEO Slug *</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold font-mono"
                      value={formCategory.slug}
                      onChange={(e) => setFormCategory(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea 
                      rows="2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCategory.description}
                      onChange={(e) => setFormCategory(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lucide Icon Name</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold"
                      value={formCategory.icon}
                      onChange={(e) => setFormCategory(prev => ({ ...prev, icon: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'Save' : 'Update'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
