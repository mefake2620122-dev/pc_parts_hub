import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      setAuthToken(res.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#f5f5f7]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-black/8 shadow-apple-card space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f0f6ff] flex items-center justify-center text-[#0071e3]">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Store Admin Portal</h1>
          <p className="text-xs text-[#86868b]">
            Sign in to manage inventory, update stock status, and adjust store settings.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
              placeholder="Username"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            <span>{loading ? 'Verifying...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-[#86868b] hover:text-[#1d1d1f] transition">
            ← Return to public website
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
