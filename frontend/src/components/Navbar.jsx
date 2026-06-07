import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Map, Compass, ShieldCheck, LogOut, Menu, X, Sun, Moon, User as UserIcon, Heart, Briefcase, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  const linkClass = (path) => {
    const baseClass = "px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300";
    const activeClass = "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30";
    const inactiveClass = "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/40";
    return location.pathname === path ? `${baseClass} ${activeClass}` : `${baseClass} ${inactiveClass}`;
  };

  const mobileLinkClass = (path) => {
    const baseClass = "block px-4 py-2.5 rounded-xl text-base font-bold transition-all duration-300";
    const activeClass = "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30";
    const inactiveClass = "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/40";
    return location.pathname === path ? `${baseClass} ${activeClass}` : `${baseClass} ${inactiveClass}`;
  };

  return (
    <nav className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-900 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-extrabold text-indigo-600 dark:text-indigo-450 tracking-tight">
              <Map className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-450 animate-pulse stroke-[2.5]" />
              <span>Travel<span className="text-slate-900 dark:text-slate-100">Bharat</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={linkClass('/')}>Home</Link>
            
            <Link to="/explore" className={linkClass('/explore')}>
              <span className="flex items-center">
                <Compass className="h-4 w-4 mr-1.5" />
                Explore
              </span>
            </Link>

            <Link to="/tourism-map" className={linkClass('/tourism-map')}>
              Tourism Map
            </Link>

            {/* Logged in links */}
            {user && (
              <>
                <Link to="/my-trips" className={linkClass('/my-trips')}>
                  <span className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1.5" />
                    My Trips
                  </span>
                </Link>

                <Link to="/wishlist" className={linkClass('/wishlist')}>
                  <span className="flex items-center">
                    <Heart className="h-4 w-4 mr-1.5" />
                    Wishlist
                  </span>
                </Link>

                {user.role === 'admin' && (
                  <Link to="/admin" className={linkClass('/admin')}>
                    <span className="flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      Admin
                    </span>
                  </Link>
                )}
              </>
            )}

            {/* Auth Buttons or Dropdown */}
            {user ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300 cursor-pointer"
                >
                  {user.avatar ? (
                    <img
                      src={`${window.API_BASE_URL}${user.avatar}`}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover border border-indigo-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';
                      }}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase border border-indigo-200/50">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-xl border border-slate-100 dark:border-slate-850/80 py-2.5 z-50 animate-fadeIn text-left">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900 mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium transition-colors"
                    >
                      <UserIcon className="h-4 w-4 mr-2.5 text-slate-400" />
                      My Profile
                    </Link>

                    <Link
                      to="/my-trips"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium transition-colors"
                    >
                      <Briefcase className="h-4 w-4 mr-2.5 text-slate-400" />
                      My Trips
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium transition-colors"
                    >
                      <Heart className="h-4 w-4 mr-2.5 text-slate-400" />
                      Wishlist
                    </Link>

                    <Link
                      to="/profile?tab=password"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-2.5 text-slate-400" />
                      Settings
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 font-bold transition-colors border-t border-b border-indigo-50/20 my-1"
                      >
                        <ShieldCheck className="h-4 w-4 mr-2.5" />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 font-bold transition-colors mt-1 border-t border-slate-100 dark:border-slate-900 pt-2 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200/50 dark:border-slate-800/60 ml-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-bold text-slate-650 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Dark Mode Toggle Track */}
            <div className="flex items-center pl-2 border-l border-slate-100 dark:border-slate-800 ml-2">
              <button
                onClick={toggleTheme}
                className="relative w-14 h-8 rounded-full p-1 cursor-pointer bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850/80 backdrop-blur-xs shadow-inner transition-colors duration-300 flex items-center focus:outline-none select-none"
                aria-label="Toggle Dark Mode"
              >
                <div className="absolute left-2 text-amber-500 opacity-60 dark:opacity-20 transition-opacity">
                  <Sun className="h-3 w-3 fill-amber-500/20" />
                </div>
                <div className="absolute right-2 text-indigo-400 opacity-20 dark:opacity-60 transition-opacity">
                  <Moon className="h-3 w-3 fill-indigo-450/20" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full bg-white dark:bg-slate-950 shadow-sm border border-slate-200/40 dark:border-slate-800/40 transform transition-transform duration-300 flex items-center justify-center z-10 ${
                    isDark ? 'translate-x-6 text-indigo-400' : 'translate-x-0 text-amber-500'
                  }`}
                >
                  {isDark ? <Moon className="h-3.5 w-3.5 fill-indigo-450/20" /> : <Sun className="h-3.5 w-3.5 fill-amber-550/20" />}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="relative w-12 h-7 rounded-full p-0.5 cursor-pointer bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850/80 backdrop-blur-xs shadow-inner transition-colors duration-305 flex items-center focus:outline-none select-none"
              aria-label="Toggle Dark Mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-sm border border-slate-200/40 dark:border-slate-800/40 transform transition-transform duration-300 flex items-center justify-center z-10 ${
                  isDark ? 'translate-x-5 text-indigo-400' : 'translate-x-0 text-amber-500'
                }`}
              >
                {isDark ? <Moon className="h-3 w-3 fill-indigo-450/20" /> : <Sun className="h-3 w-3 fill-amber-550/20" />}
              </div>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900/40 focus:outline-none"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-850 animate-fadeIn text-left">
          <div className="px-3 pt-2 pb-4 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className={mobileLinkClass('/')}>Home</Link>
            <Link to="/explore" onClick={() => setIsOpen(false)} className={mobileLinkClass('/explore')}>Explore</Link>
            <Link to="/tourism-map" onClick={() => setIsOpen(false)} className={mobileLinkClass('/tourism-map')}>Tourism Map</Link>
            
            {user ? (
              <>
                <Link to="/my-trips" onClick={() => setIsOpen(false)} className={mobileLinkClass('/my-trips')}>My Trips</Link>
                <Link to="/wishlist" onClick={() => setIsOpen(false)} className={mobileLinkClass('/wishlist')}>Wishlist</Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className={mobileLinkClass('/profile')}>My Profile</Link>
                
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className={`${mobileLinkClass('/admin')} text-indigo-600 dark:text-indigo-400 font-bold`}>
                    Admin Panel
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left block text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2.5 rounded-xl text-base font-bold transition-colors mt-2 border-t border-slate-100 dark:border-slate-900 pt-3 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-2 flex flex-col space-y-2 px-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 font-bold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200/65 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 rounded-xl shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
