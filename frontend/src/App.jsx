import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Login from './pages/Login'; // Unified Login Page
import Register from './pages/Register'; // New Register Page
import ForgotPassword from './pages/ForgotPassword'; // New Forgot Password Page
import Profile from './pages/Profile'; // New Profile Page
import Dashboard from './pages/admin/Dashboard';
import Chatbot from './components/Chatbot';
import { QuickViewProvider } from './context/QuickViewContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompareProvider } from './context/CompareContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Gatekeeper Wrapper
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CompareProvider>
            <QuickViewProvider>
              <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 font-sans transition-all duration-300">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/state/:stateSlug" element={<StatePage />} />
                    <Route path="/destination/:destSlug" element={<PlaceDetail />} />
                    <Route path="/tourism-map" element={<TourismMap />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<Login />} /> {/* Legacy compatibility */}
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected User Routes */}
                    <Route path="/my-trips" element={
                      <ProtectedRoute>
                        <MyTrips />
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={
                      <ProtectedRoute>
                        <WishlistPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/share-trip" element={
                      <ProtectedRoute>
                        <ShareTrip />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />

                    {/* Protected Admin Routes */}
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminRoute>
                          <Dashboard />
                        </AdminRoute>
                      </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                <Chatbot />
              </div>
            </QuickViewProvider>
          </CompareProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
