import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login'; // Unified Login Page
import Register from './pages/Register'; // New Register Page

// Lazy load other routes for optimized bundle sizes
const Explore = lazy(() => import('./pages/Explore'));
const StatePage = lazy(() => import('./pages/StatePage'));
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const ShareTrip = lazy(() => import('./pages/ShareTrip'));
const TourismMap = lazy(() => import('./pages/TourismMap'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword')); // New Forgot Password Page
const Profile = lazy(() => import('./pages/Profile')); // New Profile Page
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));

import Chatbot from './components/Chatbot';
import { QuickViewProvider } from './context/QuickViewContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompareProvider } from './context/CompareContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
    <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
      Loading Page...
    </p>
  </div>
);

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
                  <Suspense fallback={<PageLoader />}>
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
                          <MyTrips initialTab="wishlist" />
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
                  </Suspense>
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
