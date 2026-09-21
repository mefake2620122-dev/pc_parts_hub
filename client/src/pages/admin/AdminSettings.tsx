import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Store,
  Phone,
  ShieldCheck,
  User,
  Database,
  RefreshCw,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { SiteSettings } from '../../types';
import { api, setAuthToken } from '../../services/api';
import { formatPhoneDisplay } from '../../utils/whatsapp';

type SettingsTab = 'store' | 'hero' | 'trust' | 'security' | 'database';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Hero Image Upload state
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);

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
          api.getDbStatus().catch(() => null),
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
        api.getDbStatus().catch(() => null),
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
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateSettings(settings as Record<string, string>);
      setSuccess('Settings successfully updated and live on storefront');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroImg(true);
    setError('');
    try {
      const res = await api.uploadImages([file]);
      if (res.urls && res.urls.length > 0) {
        handleChange('hero_image', res.urls[0]);
        setSuccess('Hero showcase image uploaded successfully. Click "Save Changes" to apply.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload hero image');
    } finally {
      setUploadingHeroImg(false);
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
      setTimeout(() => setPwSuccess(''), 3500);
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
        <span>Loading store settings...</span>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'store', label: 'Store & Contact', icon: Store },
    { id: 'hero', label: 'Hero Banner CMS', icon: Sparkles },
    { id: 'trust', label: 'Trust & Cards', icon: ShieldCheck },
    { id: 'security', label: 'Admin Security', icon: KeyRound },
    { id: 'database', label: 'Database & Cloud', icon: Database },
  ];

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
          Website & Store Settings
        </h1>
        <p className="text-xs text-[#86868b] mt-0.5">
          Full CMS control: modify typography, Hero graphics, WhatsApp contact, trust cards, and security.
        </p>
      </div>

      {/* Global Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Apple-Style Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#ebebed] rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STORE & CONTACT PROFILE */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-black/5">
              <Store className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Store Profile & Contact Numbers</h2>
                <p className="text-xs text-[#86868b]">Control phone dialer and WhatsApp routing across the entire website.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  value={settings.business_name || ''}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  placeholder="PC PART HUB"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Store Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="Pre-Owned Parts. Tested for Your Build."
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Phone Number (Call Dialer)
                </label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 91795 27017"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
                <p className="text-[11px] text-[#86868b]">
                  Formatted Display: <span className="font-mono font-semibold">{formatPhoneDisplay(settings.phone)}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="919179527017 (Country code + 10 digits)"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
                <p className="text-[11px] text-[#86868b]">
                  Normalized: <span className="font-mono font-semibold">{formatPhoneDisplay(settings.whatsapp)}</span>
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Physical Store Address
                </label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.opening_hours || ''}
                  onChange={(e) => handleChange('opening_hours', e.target.value)}
                  placeholder="Mon – Sat: 11:00 AM – 8:30 PM (Sunday by Appointment)"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Google Maps URL
                </label>
                <input
                  type="text"
                  value={settings.maps_url || ''}
                  onChange={(e) => handleChange('maps_url', e.target.value)}
                  placeholder="https://maps.google.com/?q=Nehru+Place+New+Delhi"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>


              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  About Store Text
                </label>
                <textarea
                  rows={3}
                  value={settings.about_text || ''}
                  onChange={(e) => handleChange('about_text', e.target.value)}
                  placeholder="Describe your store and testing guarantees..."
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Store Details'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: HERO BANNER & 3D HARDWARE SHOWCASE CMS */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-black/5">
              <Sparkles className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Hero Banner CMS & 3D Hardware Showcase</h2>
                <p className="text-xs text-[#86868b]">Control the main homepage headline, description, 3D card image, and floating spec chips.</p>
              </div>
            </div>

            {/* Typography Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Eyebrow Badge Text
                </label>
                <input
                  type="text"
                  value={settings.hero_badge || ''}
                  onChange={(e) => handleChange('hero_badge', e.target.value)}
                  placeholder="PC PART HUB"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Main Headline (H1)
                </label>
                <input
                  type="text"
                  value={settings.hero_title || ''}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="Power Your Next Build."
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Sub-Headline
                </label>
                <input
                  type="text"
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="Quality pre-owned PC hardware, ready for your next setup."
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                  Supporting Description
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_desc || ''}
                  onChange={(e) => handleChange('hero_desc', e.target.value)}
                  placeholder="Explore available components, compare specifications..."
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>
            </div>

            {/* Hero Hardware Image Upload & Preview */}
            <div className="pt-4 border-t border-black/5 space-y-4">
              <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">
                Hero Showcase Hardware Image
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-40 h-28 bg-[#fbfbfd] border border-black/8 rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-xs">
                  <img
                    src={settings.hero_image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80'}
                    alt="Hero Hardware"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 rounded-full bg-[#f0f6ff] text-[#0071e3] hover:bg-blue-100 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingHeroImg ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={uploadingHeroImg}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-[#86868b]">or enter image URL directly:</span>
                  </div>

                  <input
                    type="url"
                    value={settings.hero_image || ''}
                    onChange={(e) => handleChange('hero_image', e.target.value)}
                    placeholder="https://..."
                    className="w-full py-2 px-3 bg-[#f5f5f7] border border-black/10 rounded-xl text-xs font-mono text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>
            </div>

            {/* 4 Floating 3D Spec Badges */}
            <div className="pt-4 border-t border-black/5 space-y-4">
              <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                Floating 3D Hardware Spec Chips
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2">
                  <span className="text-[11px] font-semibold text-[#0071e3] block">Top-Left Chip</span>
                  <input
                    type="text"
                    value={settings.hero_chip1_tag || ''}
                    onChange={(e) => handleChange('hero_chip1_tag', e.target.value)}
                    placeholder="RTX SERIES"
                    className="w-full p-2 bg-white border border-black/10 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2">
                  <span className="text-[11px] font-semibold text-[#0071e3] block">Top-Right Chip (Label & Value)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={settings.hero_chip2_label || ''}
                      onChange={(e) => handleChange('hero_chip2_label', e.target.value)}
                      placeholder="VRAM"
                      className="p-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={settings.hero_chip2_val || ''}
                      onChange={(e) => handleChange('hero_chip2_val', e.target.value)}
                      placeholder="12GB GDDR6"
                      className="p-2 bg-white border border-black/10 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2">
                  <span className="text-[11px] font-semibold text-emerald-600 block">Bottom-Left Chip (Quality)</span>
                  <input
                    type="text"
                    value={settings.hero_chip3_text || ''}
                    onChange={(e) => handleChange('hero_chip3_text', e.target.value)}
                    placeholder="STRESS TESTED"
                    className="w-full p-2 bg-white border border-black/10 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2">
                  <span className="text-[11px] font-semibold text-emerald-600 block">Bottom-Right Chip (Status)</span>
                  <input
                    type="text"
                    value={settings.hero_chip4_text || ''}
                    onChange={(e) => handleChange('hero_chip4_text', e.target.value)}
                    placeholder="IN STOCK"
                    className="w-full p-2 bg-white border border-black/10 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Hero CMS'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: TRUST STRIP & VALUE CARDS */}
      {activeTab === 'trust' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-black/5">
              <ShieldCheck className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Trust Strip & Value Proposition Cards</h2>
                <p className="text-xs text-[#86868b]">Customize the 4 highlight guarantee boxes shown on the storefront.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-2.5">
                  <span className="text-xs font-bold text-[#0071e3] uppercase">Trust Card {num}</span>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#86868b] uppercase">Card Title</label>
                    <input
                      type="text"
                      value={(settings as any)[`trust_card_${num}_title`] || ''}
                      onChange={(e) => handleChange(`trust_card_${num}_title`, e.target.value)}
                      placeholder={`Trust Card ${num} Title`}
                      className="w-full p-2 bg-white border border-black/10 rounded-lg text-xs font-semibold text-[#1d1d1f]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#86868b] uppercase">Card Description</label>
                    <textarea
                      rows={2}
                      value={(settings as any)[`trust_card_${num}_desc`] || ''}
                      onChange={(e) => handleChange(`trust_card_${num}_desc`, e.target.value)}
                      placeholder={`Trust Card ${num} Description`}
                      className="w-full p-2 bg-white border border-black/10 rounded-lg text-xs text-[#1d1d1f]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Trust Cards'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: ADMIN SECURITY (USERNAME & PASSWORD) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Username */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-black/5">
              <User className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Admin Username Credentials</h2>
                <p className="text-xs text-[#86868b]">
                  Current active username: <span className="font-mono font-semibold text-[#1d1d1f]">{currentAdminUsername || 'admin'}</span>
                </p>
              </div>
            </div>

            {unSuccess && (
              <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{unSuccess}</span>
              </div>
            )}

            {unError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{unError}</span>
              </div>
            )}

            <form onSubmit={handleChangeUsername} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">New Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Current Password (Verify)</label>
                <input
                  type="password"
                  required
                  value={usernameCurrentPw}
                  onChange={(e) => setUsernameCurrentPw(e.target.value)}
                  placeholder="Current password"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingUn}
                  className="px-5 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{changingUn ? 'Updating...' : 'Update Username'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-black/5">
              <KeyRound className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Admin Password</h2>
                <p className="text-xs text-[#86868b]">Update your administrator password (encrypted with bcrypt 10 rounds).</p>
              </div>
            </div>

            {pwSuccess && (
              <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full py-2.5 px-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPw}
                  className="px-5 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{changingPw ? 'Updating...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE & CLOUD STATUS */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-apple-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#0071e3]" />
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">Database Connectivity & Cloud Health</h2>
                <p className="text-xs text-[#86868b]">Real-time database engine, integrity, and row counts.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefreshDb}
              disabled={refreshingDb}
              className="p-2 rounded-full hover:bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f] transition"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingDb ? 'animate-spin text-[#0071e3]' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">
              <span className="text-[11px] text-[#86868b] uppercase block font-semibold">Engine</span>
              <span className="text-base font-bold text-[#1d1d1f]">
                {dbStatus?.engine || 'SQLite / Supabase Engine'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">
              <span className="text-[11px] text-[#86868b] uppercase block font-semibold">Status</span>
              <span className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{dbStatus?.status || 'ONLINE'}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/5">
              <span className="text-[11px] text-[#86868b] uppercase block font-semibold">Integrity</span>
              <span className="text-base font-mono font-semibold text-[#0071e3]">
                {dbStatus?.integrity || 'OK'}
              </span>
            </div>
          </div>

          {/* Row Counts */}
          {dbStatus?.counts && (
            <div className="pt-2">
              <span className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider block mb-3">
                Live Inventory Counts
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#f5f5f7] rounded-xl">
                  <span className="text-xl font-extrabold text-[#1d1d1f] block">{dbStatus.counts.products}</span>
                  <span className="text-[11px] text-[#86868b]">Products</span>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl">
                  <span className="text-xl font-extrabold text-[#1d1d1f] block">{dbStatus.counts.categories}</span>
                  <span className="text-[11px] text-[#86868b]">Categories</span>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl">
                  <span className="text-xl font-extrabold text-[#1d1d1f] block">{dbStatus.counts.combos}</span>
                  <span className="text-[11px] text-[#86868b]">Combos</span>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl">
                  <span className="text-xl font-extrabold text-[#1d1d1f] block">{dbStatus.counts.admins}</span>
                  <span className="text-[11px] text-[#86868b]">Admins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
