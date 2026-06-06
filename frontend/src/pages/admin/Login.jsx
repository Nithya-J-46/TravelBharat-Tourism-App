import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, User, Lock, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials and server connection.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-16rem)] flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8 relative text-left"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1599661509660-f47c94b711e7?auto=format&fit=crop&q=80&w=1500")' }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"></div>
      
      <div className="max-w-md w-full relative z-10">
        
        {/* Back Link */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center text-sm font-semibold text-white/80 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to homepage
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20">
          
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 border border-indigo-200">
              <ShieldAlert className="h-6 w-6 stroke-[2]" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Please sign in to manage TravelBharat destinations.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold mb-6 flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition font-medium"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
          </form>

        </div>

      </div>
    </div>
  );
};

export default Login;
