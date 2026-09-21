import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SiteSettings } from './types';
import { api } from './services/api';

import { GlassNavbar } from './components/common/GlassNavbar';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { Footer } from './components/common/Footer';
import { WhatsAppGlobalHandler } from './components/common/WhatsAppGlobalHandler';

// Public Pages
import { Home } from './pages/Home';
import { Parts } from './pages/Parts';
import { PartDetail } from './pages/PartDetail';
import { Builds } from './pages/Builds';
import { NewArrivals } from './pages/NewArrivals';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminCombos } from './pages/admin/AdminCombos';
import { AdminImport } from './pages/admin/AdminImport';
import { AdminSettings } from './pages/admin/AdminSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public Layout Wrapper
function PublicLayout({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1d1d1f]">
      <GlassNavbar settings={settings} />
      <main className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<SiteSettings>({});

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res?.settings) {
        setSettings(res.settings);
        if (res.settings.business_name) {
          // Set global so SEO component always has the brand name
          (window as any).__siteName = res.settings.business_name;
          document.title = `${res.settings.business_name} — Pre-Owned PC Components & Hardware`;
        }
      }
    } catch (err) {
      console.error('Failed to load site settings', err);
    }
  };

  useEffect(() => {
    loadSettings();

    // 1. Re-fetch when switching back to this tab
    const handleFocus = () => {
      loadSettings();
    };
    window.addEventListener('focus', handleFocus);

    // 2. Immediate in-app event when settings are saved in admin
    const handleSettingsEvent = (e: any) => {
      if (e?.detail) {
        setSettings(e.detail);
        if (e.detail.business_name) {
          (window as any).__siteName = e.detail.business_name;
          document.title = `${e.detail.business_name} — Pre-Owned PC Components & Hardware`;
        }
      } else {
        loadSettings();
      }
    };
    window.addEventListener('site_settings_updated', handleSettingsEvent);

    // 3. Cross-tab synchronization via storage event
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'site_settings_last_updated') {
        loadSettings();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('site_settings_updated', handleSettingsEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return (
    <BrowserRouter>
      <WhatsAppGlobalHandler
        defaultPhone={settings?.whatsapp}
        defaultMsg={settings?.business_name ? `Hello ${settings.business_name}, I have an enquiry regarding hardware.` : undefined}
      />
      <ScrollToTop />
      <Routes>
        
        {/* Public Catalog Routes */}
        <Route path="/" element={<PublicLayout settings={settings}><Home settings={settings} /></PublicLayout>} />
        <Route path="/parts" element={<PublicLayout settings={settings}><Parts settings={settings} /></PublicLayout>} />
        <Route path="/parts/:slug" element={<PublicLayout settings={settings}><PartDetail settings={settings} /></PublicLayout>} />
        <Route path="/builds" element={<PublicLayout settings={settings}><Builds settings={settings} /></PublicLayout>} />
        <Route path="/new-arrivals" element={<PublicLayout settings={settings}><NewArrivals settings={settings} /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout settings={settings}><About settings={settings} /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout settings={settings}><Contact settings={settings} /></PublicLayout>} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="combos" element={<AdminCombos />} />
          <Route path="import" element={<AdminImport />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<PublicLayout settings={settings}><Home settings={settings} /></PublicLayout>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
