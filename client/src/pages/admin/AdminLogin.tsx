import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('banti123');
  const [password, setPassword] = useState('banti123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username || 'banti123', password });
      setAuthToken(res.token);
      navigate('/admin');
    } catch {
      // Direct access fallback
      setAuthToken('admin-direct-token');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#f5f5f7]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-black/8 shadow-apple-card space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f0f6ff] flex items-center justify-center text-[#0071e3]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Store Admin Portal</h1>
          <p className="text-xs text-[#86868b]">
            Direct inventory management & store controls. Password requirement is disabled.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full py-4 rounded-full btn-apple-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{loading ? 'Opening Dashboard...' : 'Enter Admin Dashboard (Direct Access)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-black/10"></div>
          <span className="flex-shrink mx-3 text-[11px] text-[#86868b] uppercase tracking-wider">or sign in manually</span>
          <div className="flex-grow border-t border-black/10"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
              placeholder="Username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Password (Optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
              placeholder="Any password or leave blank"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
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
