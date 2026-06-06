import { Link } from 'react-router-dom';
import { Heart, Map, Globe, Mail, Phone, Compass, Landmark, ShieldCheck } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 dark:bg-slate-950 dark:text-slate-400 border-t border-slate-800 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-4 space-y-4 text-left">
            <Link to="/" className="flex items-center text-xl font-extrabold text-white tracking-tight">
              <Map className="h-6 w-6 mr-2 text-indigo-500 animate-pulse stroke-[2.5]" />
              <span>Travel<span className="text-indigo-400">Bharat</span></span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Discover the soul of Incredible India state by state. Explore majestic forts, spiritual retreats, scenic backwaters, and pristine snow peaks.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-355 hover:text-white transition-all duration-300 flex items-center justify-center" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H7v3h2v9h3v-9h3.6l.4-3H12V6c0-.9.2-1.2 1.2-1.2H15V2h-3c-3.1 0-5 1.6-5 4.8V8Z"/>
                </svg>
              </a>
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-355 hover:text-white transition-all duration-300 flex items-center justify-center" aria-label="Instagram">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>
                </svg>
              </a>
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-355 hover:text-white transition-all duration-300 flex items-center justify-center" aria-label="Twitter">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L11 15.6l-6 6.7H1.7l7.6-8.7L1.2 2.4h6.9l4.6 6.1 5.5-6.1Zm-1.2 17.6h1.8L7.1 4.5H5.1l11.9 15.5Z"/>
                </svg>
              </a>
              <a href="#" className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-355 hover:text-white transition-all duration-300 flex items-center justify-center" aria-label="Youtube">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.5 12c0 5-1.5 6.5-6.5 6.5H8c-5 0-6.5-1.5-6.5-6.5s1.5-6.5 6.5-6.5h8c5 0 6.5 1.5 6.5 6.5Z"/>
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 text-left">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-400" />
              Navigation
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Explore</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">Login</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Travel Categories */}
          <div className="md:col-span-3 text-left">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-indigo-400" />
              Categories
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Heritage Collections</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Nature & Beaches</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Spiritual Retreats</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Adventure & Wildlife</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Resources */}
          <div className="md:col-span-3 text-left space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-indigo-400" />
              Get In Touch
            </h3>
            <div className="space-y-2 text-xs font-semibold">
              <a href="mailto:info@travelbharat.gov" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-indigo-500" />
                info@travelbharat.gov
              </a>
              <a href="tel:+911800111363" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-indigo-500" />
                Toll Free: 1800-111-363
              </a>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
              An Initiative of Incredible India
            </p>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-500 gap-4">
          <p>© {currentYear} TravelBharat. All Rights Reserved.</p>
          <div className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse mx-0.5" /> for Incredible India
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
