import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MessageSquare, Menu, X, Cpu, Command, Shield } from 'lucide-react';
import { SiteSettings } from '../../types';
import { getWhatsAppUrl, generateGeneralWhatsAppMessage } from '../../utils/whatsapp';
import SearchOverlay from './SearchOverlay';

interface NavbarProps {
  settings?: SiteSettings;
}

export const GlassNavbar: React.FC<NavbarProps> = ({ settings }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const location = useLocation();

  const businessName = settings?.business_name || 'PC PART HUB';
  const whatsappNum = settings?.whatsapp || '919179527017';

  // Scroll listener for compact navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut listener for Spotlight Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'PC Parts', path: '/parts' },
    { name: 'Builds', path: '/builds' },
    { name: 'New Arrivals', path: '/new-arrivals' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Floating Apple-Style Translucent White Pill Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 pt-3 sm:pt-4 transition-all duration-300">
        <div
          className={`max-w-6xl mx-auto rounded-full transition-all duration-300 ${
            isScrolled
              ? 'py-2 px-4 sm:px-6 bg-white/85 backdrop-blur-2xl shadow-apple-hover border border-black/8'
              : 'py-2.5 px-4 sm:px-6 bg-white/70 backdrop-blur-xl shadow-apple-card border border-black/5'
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold tracking-tight text-[#1d1d1f]">
                  PC PART <span className="text-[#0071e3]">HUB</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'text-[#1d1d1f] bg-black/5 shadow-xs font-semibold'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Elements: Spotlight Search & WhatsApp */}
            <div className="flex items-center gap-2">
              {/* Spotlight Search Pill Trigger */}
              <button
                onClick={() => setSearchOverlayOpen(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/5 text-[#6e6e73] hover:text-[#1d1d1f] transition text-xs"
                title="Search hardware (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-normal text-[#86868b]">Search parts...</span>
                <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-[#86868b] font-mono bg-white px-1.5 py-0.2 rounded border border-black/5">
                  <Command className="w-2.5 h-2.5" />K
                </span>
              </button>

              {/* WhatsApp Quick CTA Button */}
              <a
                href={getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName))}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full btn-whatsapp-apple text-xs font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* Admin Portal Button */}
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/5 text-[#6e6e73] hover:text-[#1d1d1f] transition text-xs font-medium"
                title="Store Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-[#0071e3]" />
                <span className="hidden sm:inline">Admin</span>
              </Link>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-8 h-8 rounded-full bg-[#f5f5f7] border border-black/5 flex items-center justify-center text-[#1d1d1f]"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation in White Glass */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden bg-white/95 backdrop-blur-2xl pt-24 px-6 flex flex-col justify-between pb-28 animate-in fade-in duration-200">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-[#86868b] font-semibold mb-3 px-2">
              Menu
            </p>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-3 px-3 text-lg font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl border-b border-black/5"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin"
              className="py-3 px-3 text-lg font-medium text-[#0071e3] hover:bg-[#f0f6ff] rounded-xl border-b border-black/5 flex items-center justify-between"
            >
              <span>Admin Dashboard</span>
              <Shield className="w-4 h-4 text-[#0071e3]" />
            </Link>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOverlayOpen(true);
              }}
              className="w-full py-3 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-medium flex items-center justify-center gap-2 text-sm border border-black/5"
            >
              <Search className="w-4 h-4 text-[#86868b]" />
              <span>Search Inventory...</span>
            </button>

            <a
              href={getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName))}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full btn-whatsapp-apple font-semibold text-white flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct WhatsApp Enquiry</span>
            </a>
          </div>
        </div>
      )}

      {/* Apple Spotlight Search Modal */}
      <SearchOverlay
        isOpen={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
      />
    </>
  );
};

export default GlassNavbar;
