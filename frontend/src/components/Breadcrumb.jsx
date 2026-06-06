import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex py-3 px-5 text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors">
            <Home className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index}>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                {isLast ? (
                  <span className="ml-1 text-xs font-bold text-slate-400 uppercase tracking-wider select-none md:ml-2">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.url}
                    className="ml-1 text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider transition-colors md:ml-2"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
