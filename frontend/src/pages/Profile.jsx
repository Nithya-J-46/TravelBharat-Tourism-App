import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Phone, Lock, Upload, Calendar, Briefcase, Heart, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, wishlist, trips, updateProfile, changePassword, uploadAvatar } = useAuth();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'password') {
      setActiveTab('password');
    } else {
      setActiveTab('profile');
    }
  }, [location]);

  // Sync user profile values when loaded
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setMobile(user.mobile || '');
    }
  }, [user]);

  // Format Join Date
  const getJoinDate = () => {
    if (!user || !user.createdAt) return 'June 2026';
    const date = new Date(user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate unique states visited from trips
  const getStatesVisitedCount = () => {
    if (!trips) return 0;
    const states = new Set();
    trips.forEach(trip => {
      if (trip.stateName) states.add(trip.stateName);
      if (trip.destination?.state) states.add(trip.destination.state);
    });
    return states.size;
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email) {
      setError('Name and email are required fields.');
      return;
    }

    setLoading(true);
    const result = await updateProfile(name, email, mobile);
    setLoading(false);

    if (result.success) {
      setSuccess('Profile updated successfully!');
    } else {
      setError(result.message);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.message);
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setAvatarLoading(true);
    
    const result = await uploadAvatar(file);
    setAvatarLoading(false);

    if (result.success) {
      setSuccess('Avatar image updated successfully!');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left transition-colors">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account details and travel statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stats Card & Avatar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Avatar Glassmorphism Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 shadow-md text-center flex flex-col items-center">
            
            {/* Avatar Circle */}
            <div className="relative group mb-4">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-indigo-150 dark:border-indigo-950 flex items-center justify-center bg-indigo-50 dark:bg-slate-950 shadow-inner relative">
                {avatarLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-650 animate-spin"></div>
                  </div>
                ) : null}
                
                {user?.avatar ? (
                  <img
                    src={`${window.API_BASE_URL}${user.avatar}`}
                    alt={user.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
                    }}
                  />
                ) : (
                  <span className="text-4xl font-black text-indigo-550 dark:text-indigo-400 uppercase select-none">
                    {user?.name?.charAt(0)}
                  </span>
                )}
              </div>

              {/* Upload Hover Overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 rounded-full bg-slate-950/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer border border-white/10"
              >
                <Upload className="h-6 w-6 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Upload Photo</span>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarLoading}
                />
              </label>
            </div>

            {/* Name & Role */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-full">{user?.name}</h2>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                user?.role === 'admin' 
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/40' 
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-250/30'
              }`}>
                {user?.role}
              </span>
            </div>

            {/* Member since */}
            <div className="flex items-center text-xs font-semibold text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 w-full justify-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <span>Explorer since {getJoinDate()}</span>
            </div>
          </div>

          {/* Account Stats Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 shadow-md">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              Exploration Metrics
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Trips Planned */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-900/60">
                <Briefcase className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{trips.length}</p>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Trips</p>
              </div>

              {/* Wishlist */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-900/60">
                <Heart className="h-5 w-5 mx-auto text-rose-500 mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{wishlist.length}</p>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Wishlist</p>
              </div>

              {/* Visited States */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-900/60">
                <MapPin className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{getStatesVisitedCount()}</p>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">States</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Tabbed Details Panel */}
        <div className="lg:col-span-2">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Account Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'password'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Security settings
            </button>
          </div>

          {/* Form Banner Banners */}
          {success && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-650 dark:text-emerald-400 rounded-xl p-4 text-xs font-semibold mb-6 flex items-start"
            >
              <CheckCircle className="h-4 w-4 mr-2.5 mt-0.5 text-emerald-500 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-50 dark:bg-rose-955/30 border border-rose-250 dark:border-rose-900/50 text-rose-600 dark:text-rose-405 rounded-xl p-4 text-xs font-semibold mb-6 flex items-start"
            >
              <ShieldAlert className="h-4 w-4 mr-2.5 mt-0.5 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Account Details Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 md:p-8 shadow-md"
            >
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-200 transition font-semibold"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 dark:text-slate-200 transition font-semibold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-200 transition font-semibold"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {loading ? 'Saving Details...' : 'Save Profile Details'}
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 md:p-8 shadow-md"
            >
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-200 transition font-semibold"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="•••••••• (Min 6 characters)"
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-200 transition font-semibold"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-3.5 py-3 bg-white/50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-855 dark:text-slate-200 transition font-semibold"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Change Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {loading ? 'Changing Password...' : 'Update Password'}
                  </button>
                </div>

              </form>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Profile;
