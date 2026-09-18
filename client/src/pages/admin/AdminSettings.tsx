import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, KeyRound, Store, Phone, ShieldCheck, User, Database, HardDrive, RefreshCw } from 'lucide-react';
import { SiteSettings } from '../../types';
import { api, setAuthToken } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Admin Account & Username state
  const [currentAdminUsername, setCurrentAdminUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernameCurrentPw, setUsernameCurrentPw] = useState('');
  const [unSuccess, setUnSuccess] = useState('');
  const [unError, setUnError] = useState('');
  const [changingUn, setChangingUn] = useState(false);

  // Database status state
  const [dbStatus, setDbStatus] = useState<{
    status: string;
    integrity: string;
    journalMode: string;
    engine: string;
    databaseFile: string;
    counts: { products: number; categories: number; combos: number; admins: number };
    currentAdmin: { id: number; username: string; name: string } | null;
  } | null>(null);
  const [refreshingDb, setRefreshingDb] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [res, meRes, dbRes] = await Promise.all([
          api.getSettings(),
          api.getMe().catch(() => null),
          api.getDbStatus().catch(() => null)
        ]);
        setSettings(res.settings || {});
        if (meRes?.admin?.username) {
          setCurrentAdminUsername(meRes.admin.username);
        } else if (dbRes?.currentAdmin?.username) {
          setCurrentAdminUsername(dbRes.currentAdmin.username);
        }
        if (dbRes) {
          setDbStatus(dbRes);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleRefreshDb = async () => {
    setRefreshingDb(true);
    try {
      const [meRes, dbRes] = await Promise.all([
        api.getMe().catch(() => null),
        api.getDbStatus().catch(() => null)
      ]);
      if (meRes?.admin?.username) {
        setCurrentAdminUsername(meRes.admin.username);
      } else if (dbRes?.currentAdmin?.username) {
        setCurrentAdminUsername(dbRes.currentAdmin.username);
      }
      if (dbRes) {
        setDbStatus(dbRes);
      }
    } finally {
      setRefreshingDb(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setSettings({ ...settings, [key]: val });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateSettings(settings as Record<string, string>);
      setSuccess('Store settings successfully updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnError('');
    setUnSuccess('');
    setChangingUn(true);

    try {
      const res = await api.changeUsername({ newUsername, currentPassword: usernameCurrentPw });
      setUnSuccess(`Username successfully updated to "${res.admin.username}"`);
      setCurrentAdminUsername(res.admin.username);
      setNewUsername('');
      setUsernameCurrentPw('');
      if (res.token) {
        setAuthToken(res.token);
      }
      // Refresh database status card
      api.getDbStatus().then(setDbStatus).catch(() => {});
      setTimeout(() => setUnSuccess(''), 4000);
    } catch (err: any) {
      setUnError(err.message || 'Failed to update username');
    } finally {
      setChangingUn(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setChangingPw(true);

    try {
      await api.changePassword({ currentPassword, newPassword });
      setPwSuccess('Admin password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="text-[#86868b] text-xs py-20 text-center flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Store Settings</h1>
        <p className="text-xs text-[#86868b] mt-0.5">
          Configure business details, WhatsApp enquiry numbers, address, and values.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Section 1: Business Identity */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2 border-b border-black/5 pb-2">
            <Store className="w-4 h-4 text-[#0071e3]" /> Business Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Business Name</label>
              <input
                type="text"
                value={settings.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Currency Symbol</label>
              <input
                type="text"
                value={settings.currency || '₹'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-mono"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Hero Supporting Headline</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Enquiries */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2 border-b border-black/5 pb-2">
            <Phone className="w-4 h-4 text-emerald-600" /> Contact & WhatsApp Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">WhatsApp Number (with country code, digits only) *</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="919876543210"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Phone Display & Calling</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Physical Store Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Google Maps URL</label>
              <input
                type="text"
                value={settings.maps_url || ''}
                onChange={(e) => handleChange('maps_url', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Opening Hours</label>
              <input
                type="text"
                value={settings.opening_hours || ''}
                onChange={(e) => handleChange('opening_hours', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Trust Value Strip */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2 border-b border-black/5 pb-2">
            <ShieldCheck className="w-4 h-4 text-[#0071e3]" /> Homepage Trust Cards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">
              <label className="text-[11px] font-bold text-[#0071e3] uppercase">Card 1 Title & Description</label>
              <input
                type="text"
                value={settings.trust_card_1_title || ''}
                onChange={(e) => handleChange('trust_card_1_title', e.target.value)}
                className="w-full p-2 bg-white border border-black/8 rounded-lg text-xs text-[#1d1d1f]"
              />
              <textarea
                rows={2}
                value={settings.trust_card_1_desc || ''}
                onChange={(e) => handleChange('trust_card_1_desc', e.target.value)}
                className="w-full p-2 bg-white border border-black/8 rounded-lg text-xs text-[#6e6e73]"
              />
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">
              <label className="text-[11px] font-bold text-emerald-700 uppercase">Card 2 Title & Description</label>
              <input
                type="text"
                value={settings.trust_card_2_title || ''}
                onChange={(e) => handleChange('trust_card_2_title', e.target.value)}
                className="w-full p-2 bg-white border border-black/8 rounded-lg text-xs text-[#1d1d1f]"
              />
              <textarea
                rows={2}
                value={settings.trust_card_2_desc || ''}
                onChange={(e) => handleChange('trust_card_2_desc', e.target.value)}
                className="w-full p-2 bg-white border border-black/8 rounded-lg text-xs text-[#6e6e73]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>

      </form>

      {/* Section 4: Security & Admin Credentials */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" /> Account Security & Credentials
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Manage your store admin login username and password.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Change Username */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0071e3]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Change Username</h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#f0f6ff] text-[#0071e3] font-semibold font-mono">
                Current: {currentAdminUsername || 'Loading...'}
              </span>
            </div>

            {unSuccess && (
              <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{unSuccess}</span>
              </div>
            )}

            {unError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{unError}</span>
              </div>
            )}

            <form onSubmit={handleChangeUsername} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">New Username (min 3 characters)</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. banti123, store_admin"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Current Password (to confirm identity)</label>
                <input
                  type="password"
                  required
                  value={usernameCurrentPw}
                  onChange={(e) => setUsernameCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <button
                type="submit"
                disabled={changingUn}
                className="py-2.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{changingUn ? 'Updating...' : 'Update Username'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Change Password */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Change Password</h3>
            </div>

            {pwSuccess && (
              <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="py-2.5 px-6 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{changingPw ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Section 5: Database Connectivity & System Health */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f0f6ff] text-[#0071e3] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Database Connectivity & Health Check</h2>
              <p className="text-[11px] text-[#86868b]">Real-time SQLite database status, data integrity, and inventory counts.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshDb}
            disabled={refreshingDb}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingDb ? 'animate-spin' : ''}`} />
            <span>{refreshingDb ? 'Checking...' : 'Check Database Status'}</span>
          </button>
        </div>

        {dbStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status & Integrity */}
            <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Database Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm text-emerald-900">Connected & Active</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono mt-1">Integrity Check: {dbStatus.integrity} ✓</p>
            </div>

            {/* Active Admin User */}
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/8 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Database Admin User</span>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0071e3]" />
                <span className="font-mono font-bold text-sm text-[#1d1d1f]">{dbStatus.currentAdmin?.username || currentAdminUsername || 'None'}</span>
              </div>
              <p className="text-[11px] text-[#86868b]">Saved directly in admins table</p>
            </div>

            {/* Catalog Counts */}
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/8 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Inventory Records</span>
              <div className="font-bold text-sm text-[#1d1d1f]">
                {dbStatus.counts.products} Products / {dbStatus.counts.categories} Categories
              </div>
              <p className="text-[11px] text-[#86868b]">{dbStatus.counts.combos} Combos Saved</p>
            </div>

            {/* Engine & File */}
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/8 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Engine & Storage</span>
              <div className="font-bold text-xs text-[#1d1d1f] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{dbStatus.engine}</span>
              </div>
              <p className="text-[10px] font-mono text-[#86868b] truncate">{dbStatus.databaseFile}</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#86868b] p-4 text-center">Checking database connectivity...</div>
        )}
      </div>

    </div>
  );
};

export default AdminSettings;
