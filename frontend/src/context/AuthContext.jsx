import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // User-specific data state
  const [wishlist, setWishlist] = useState([]);
  const [trips, setTrips] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [preferences, setPreferences] = useState({ travel: [], budget: 'Medium' });

  const API_URL = 'http://localhost:5000/api';

  // Helper to get auth headers
  const getAuthHeaders = (tempToken = null) => {
    const activeToken = tempToken || token || localStorage.getItem('token') || sessionStorage.getItem('token');
    return activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
  };

  // Fetch full user data (wishlist, trips, itineraries, preferences)
  const fetchUserData = async (activeToken = null) => {
    try {
      const headers = getAuthHeaders(activeToken);
      const res = await axios.get(`${API_URL}/user/data`, headers);
      if (res.data) {
        setWishlist(res.data.wishlist || []);
        setTrips(res.data.savedTrips || []);
        setItineraries(res.data.itineraries || []);
        setPreferences(res.data.preferences || { travel: [], budget: 'Medium' });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Migrate anonymous local storage data to user's database account
  const migrateAnonymousData = async (activeToken) => {
    try {
      const headers = getAuthHeaders(activeToken);
      
      // Migrate wishlist
      const anonWishlist = localStorage.getItem('travelbharat_wishlist');
      if (anonWishlist) {
        const wishlistItems = JSON.parse(anonWishlist);
        for (const item of wishlistItems) {
          await axios.post(`${API_URL}/user/wishlist`, { place: item }, headers);
        }
        localStorage.removeItem('travelbharat_wishlist');
      }

      // Migrate trips
      const anonTrips = localStorage.getItem('travelbharat_trips');
      if (anonTrips) {
        const tripList = JSON.parse(anonTrips);
        for (const trip of tripList) {
          await axios.post(`${API_URL}/user/trips`, { trip }, headers);
        }
        localStorage.removeItem('travelbharat_trips');
      }

      // Migrate itineraries
      const anonItineraries = localStorage.getItem('travelbharat_itineraries');
      if (anonItineraries) {
        const itins = JSON.parse(anonItineraries);
        for (const itin of itins) {
          await axios.post(`${API_URL}/user/itineraries`, { itinerary: itin }, headers);
        }
        localStorage.removeItem('travelbharat_itineraries');
      }

      // Clean up legacy collections
      localStorage.removeItem('travelbharat_collections');
    } catch (e) {
      console.error('Error migrating local storage data to account:', e);
    }
  };

  // Verify token and load session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const verifyRes = await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (verifyRes.data && verifyRes.data.verified) {
            setUser(verifyRes.data.user);
            await fetchUserData(storedToken);
          } else {
            // Token invalid or expired
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password, rememberMe) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: userToken, user: userData } = res.data;

      if (rememberMe) {
        localStorage.setItem('token', userToken);
      } else {
        sessionStorage.setItem('token', userToken);
      }

      setToken(userToken);
      setUser(userData);

      // Migrate local anonymous data to DB on first login
      await migrateAnonymousData(userToken);
      
      // Load user trips/wishlist/etc
      await fetchUserData(userToken);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  // Register
  const register = async (name, email, password, mobile) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, mobile });
      const { token: userToken, user: userData } = res.data;

      sessionStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);

      // Migrate local anonymous data to DB on registration
      await migrateAnonymousData(userToken);
      await fetchUserData(userToken);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setWishlist([]);
    setTrips([]);
    setItineraries([]);
    setPreferences({ travel: [], budget: 'Medium' });
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return { success: true, message: res.data.message, otp: res.data.otp };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process request.';
      return { success: false, message };
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      return { success: true, resetToken: res.data.resetToken };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired OTP.';
      return { success: false, message };
    }
  };

  // Reset Password
  const resetPassword = async (resetToken, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { resetToken, password });
      return { success: true, message: res.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password.';
      return { success: false, message };
    }
  };

  // Edit Profile
  const updateProfile = async (name, email, mobile) => {
    try {
      const res = await axios.put(`${API_URL}/user/profile`, { name, email, mobile }, getAuthHeaders());
      setUser(res.data.user);
      return { success: true, message: res.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed.';
      return { success: false, message };
    }
  };

  // Change Password (while logged in)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axios.put(`${API_URL}/user/change-password`, { currentPassword, newPassword }, getAuthHeaders());
      return { success: true, message: res.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed.';
      return { success: false, message };
    }
  };

  // Upload Avatar
  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await axios.post(`${API_URL}/user/avatar`, formData, {
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      return { success: true, avatar: res.data.avatar };
    } catch (error) {
      const message = error.response?.data?.message || 'Avatar upload failed.';
      return { success: false, message };
    }
  };

  // Toggle Wishlist
  const toggleWishlist = async (place) => {
    if (!user) return { success: false, message: 'Must be logged in' };
    try {
      const res = await axios.post(`${API_URL}/user/wishlist`, { place }, getAuthHeaders());
      setWishlist(res.data.wishlist || []);
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: 'Wishlist sync failed' };
    }
  };

  // Save Trip
  const saveTrip = async (trip) => {
    if (!user) return { success: false, message: 'Must be logged in' };
    try {
      const res = await axios.post(`${API_URL}/user/trips`, { trip }, getAuthHeaders());
      setTrips(res.data.savedTrips || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Trip sync failed' };
    }
  };

  // Delete Trip
  const deleteTrip = async (tripId) => {
    if (!user) return { success: false, message: 'Must be logged in' };
    try {
      const res = await axios.delete(`${API_URL}/user/trips/${tripId}`, getAuthHeaders());
      setTrips(res.data.savedTrips || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Trip deletion failed' };
    }
  };

  // Save Custom Itinerary
  const saveItinerary = async (itinerary) => {
    if (!user) return { success: false, message: 'Must be logged in' };
    try {
      const res = await axios.post(`${API_URL}/user/itineraries`, { itinerary }, getAuthHeaders());
      setItineraries(res.data.itineraries || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Itinerary sync failed' };
    }
  };

  // Save Travel/Budget Preferences
  const savePreferences = async (travelPrefs, budgetPref) => {
    if (!user) return { success: false, message: 'Must be logged in' };
    try {
      const prefs = { travel: travelPrefs, budget: budgetPref };
      const res = await axios.put(`${API_URL}/user/preferences`, { preferences: prefs }, getAuthHeaders());
      setPreferences(res.data.preferences || { travel: [], budget: 'Medium' });
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Preferences sync failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        wishlist,
        trips,
        itineraries,
        preferences,
        login,
        register,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        updateProfile,
        changePassword,
        uploadAvatar,
        toggleWishlist,
        saveTrip,
        deleteTrip,
        saveItinerary,
        savePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
