import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Layers,
  FileSpreadsheet,
  Settings,
  LogOut,
  ExternalLink,
  Cpu,
  Boxes,
  Menu,
  X
} from 'lucide-react';
import { getAuthToken, removeAuthToken, api } from '../../services/api';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [shopName, setShopName] = useState<string>('PC PART HUB');

  // Fetch business name from settings and keep in sync
  useEffect(() => {
    const fetchShopName = () => {
      api.getSettings().then(res => {
        if (res?.settings?.business_name) setShopName(res.settings.business_name);
      }).catch(() => {});
    };
    fetchShopName();

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail?.business_name) {
        setShopName(e.detail.business_name);
      } else {
        fetchShopName();
      }
    };
    window.addEventListener('site_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('site_settings_updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthorized(false);
      navigate('/admin/login', { replace: true });
      return;
    }

    api.getMe()
      .then((res) => {
        setAuthorized(true);
        setAdminUser(res?.admin?.username || 'Admin');
      })
      .catch(() => {
        removeAuthToken();
        setAuthorized(false);
        navigate('/admin/login', { replace: true });
      });
  }, [navigate, location.pathname]);

  // Close mobile drawer whenever user navigates
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    removeAuthToken();
    setAuthorized(false);
    navigate('/admin/login', { replace: true });
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center text-xs text-[#86868b]">
        <div className="w-7 h-7 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3" />
        <span>Verifying admin authentication...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Add Product', path: '/admin/products/new', icon: PlusCircle },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Combos & Builds', path: '/admin/combos', icon: Boxes },
    { label: 'CSV Bulk Import', path: '/admin/import', icon: FileSpreadsheet },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col md:flex-row font-sans relative">
      
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-black/8 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white shadow-xs">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#1d1d1f]">
            {shopName} <span className="text-[#0071e3] font-normal text-xs ml-0.5">Pro</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {adminUser && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0f6ff] text-[#0071e3] border border-blue-100 font-semibold truncate max-w-[100px]">
              {adminUser}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] transition active:scale-95 border border-black/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Slide-over drawer on mobile (< md), fixed/sticky sidebar on desktop (md+) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-black/8 flex flex-col justify-between shrink-0 shadow-xl md:shadow-xs transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white shadow-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#1d1d1f]">
                {shopName} <span className="text-[#0071e3] font-normal text-xs ml-1">Pro</span>
              </span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b] border border-black/5">
                v1.0
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] ml-1"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#f0f6ff] text-[#0071e3] shadow-xs'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-black/5 space-y-2 mt-auto">
            {adminUser && (
              <div className="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-black/5 flex items-center justify-between text-xs">
                <span className="text-[#86868b] text-[11px]">Logged in:</span>
                <span className="font-mono font-bold text-[#1d1d1f] text-[11px] truncate max-w-[120px]">
                  {adminUser}
                </span>
              </div>
            )}

            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs font-medium text-[#1d1d1f] transition"
            >
              <span>View Public Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#86868b]" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 md:p-8 lg:p-10 overflow-y-auto w-full max-w-full">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;

