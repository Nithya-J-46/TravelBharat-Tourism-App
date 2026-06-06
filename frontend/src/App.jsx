import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import StatePage from './pages/StatePage';
import PlaceDetail from './pages/PlaceDetail';
import MyTrips from './pages/MyTrips';
import WishlistPage from './pages/WishlistPage';
import ShareTrip from './pages/ShareTrip';
import TourismMap from './pages/TourismMap';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Chatbot from './components/Chatbot';
import { QuickViewProvider } from './context/QuickViewContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompareProvider } from './context/CompareContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <CompareProvider>
          <QuickViewProvider>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 font-sans transition-all duration-300">
            <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/state/:stateSlug" element={<StatePage />} />
              <Route path="/destination/:destSlug" element={<PlaceDetail />} />
              <Route path="/my-trips" element={<MyTrips />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/share-trip" element={<ShareTrip />} />
              <Route path="/tourism-map" element={<TourismMap />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
        </div>
      </QuickViewProvider>
      </CompareProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
