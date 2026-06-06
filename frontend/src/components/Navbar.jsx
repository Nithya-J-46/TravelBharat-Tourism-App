import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Map, Compass, ShieldCheck, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAdmin(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAdmin(false);
    navigate('/');
  };

  const linkClass = (path) => {
    const baseClass = "px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300";
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

            <Link to="/my-trips" className={linkClass('/my-trips')}>
              My Trips
            </Link>

            <Link to="/wishlist" className={linkClass('/wishlist')}>
              Wishlist
            </Link>
            
            {isAdmin ? (
              <>
                <Link to="/admin" className={linkClass('/admin')}>
                  <span className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Admin Panel
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-slate-600 dark:text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" className={linkClass('/admin/login')}>
                <span className="flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Admin
                </span>
              </Link>
            )}

            {/* Dark Mode Toggle Track (Glassmorphism slider) */}
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
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-850 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)} 
              className={`block ${linkClass('/')}`}
            >
              Home
            </Link>
            <Link 
              to="/explore" 
              onClick={() => setIsOpen(false)} 
              className={`block ${linkClass('/explore')}`}
            >
              Explore
            </Link>
            <Link 
              to="/tourism-map" 
              onClick={() => setIsOpen(false)} 
              className={`block ${linkClass('/tourism-map')}`}
            >
              Tourism Map
            </Link>
            <Link 
              to="/my-trips" 
              onClick={() => setIsOpen(false)} 
              className={`block ${linkClass('/my-trips')}`}
            >
              My Trips
            </Link>
            <Link 
              to="/wishlist" 
              onClick={() => setIsOpen(false)} 
              className={`block ${linkClass('/wishlist')}`}
            >
              Wishlist
            </Link>
            {isAdmin ? (
              <>
                <Link 
                  to="/admin" 
                  onClick={() => setIsOpen(false)} 
                  className={`block ${linkClass('/admin')}`}
                >
                  Admin Panel
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full text-left block text-slate-600 dark:text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-xl text-base font-bold transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/admin/login" 
                onClick={() => setIsOpen(false)} 
                className={`block ${linkClass('/admin/login')}`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
