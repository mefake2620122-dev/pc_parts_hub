import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Phone, MessageSquare, MapPin, Clock, ShieldCheck, Lock } from 'lucide-react';
import { SiteSettings } from '../../types';
import { getWhatsAppUrl, getDialerUrl, generateGeneralWhatsAppMessage, contactConfig, formatPhoneDisplay } from '../../utils/whatsapp';
import { renderBrandLogo } from '../../utils/brand';

interface FooterProps {
  settings?: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const businessName = settings?.business_name || contactConfig.businessName;
  const tagline = settings?.tagline || 'Pre-Owned Parts. Ready for Your Next Build.';
  const phone = settings?.phone || contactConfig.phoneNumber;
  const whatsapp = settings?.whatsapp || contactConfig.whatsappNumber;
  const address = settings?.address || 'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019';
  const hours = settings?.opening_hours || 'Mon – Sat: 11:00 AM – 8:30 PM';

  return (
    <footer className="border-t border-black/8 bg-[#f5f5f7] text-[#6e6e73] text-sm mt-20 pb-20 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              {renderBrandLogo(businessName)}
            </Link>
            <p className="text-sm font-semibold text-[#1d1d1f]">
              {tagline}
            </p>
            <p className="text-xs text-[#86868b] leading-relaxed max-w-sm">
              Premium marketplace for verified pre-owned PC hardware. Browse live shop inventory, compare specifications, and complete deals directly via WhatsApp or store visit.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>FurMark, 3DMark & Stress Tested Hardware</span>
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#1d1d1f] tracking-wide uppercase">
              PC Parts
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/parts?category=gpu" className="hover:text-[#0071e3] transition-colors">Graphics Cards (GPU)</Link></li>
              <li><Link to="/parts?category=cpu" className="hover:text-[#0071e3] transition-colors">Processors (CPU)</Link></li>
              <li><Link to="/parts?category=motherboard" className="hover:text-[#0071e3] transition-colors">Motherboards</Link></li>
              <li><Link to="/parts?category=ram" className="hover:text-[#0071e3] transition-colors">DDR4 / DDR5 Memory</Link></li>
              <li><Link to="/parts?category=storage" className="hover:text-[#0071e3] transition-colors">NVMe & SSD Storage</Link></li>
              <li><Link to="/parts" className="hover:text-[#0071e3] transition-colors font-medium text-[#1d1d1f]">View All Inventory →</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#1d1d1f] tracking-wide uppercase">
              Navigation
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/builds" className="hover:text-[#0071e3] transition-colors">PC Builds & Combos</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-[#0071e3] transition-colors">Just Arrived Inventory</Link></li>
              <li><Link to="/about" className="hover:text-[#0071e3] transition-colors">Hardware Testing & About</Link></li>
              <li><Link to="/contact" className="hover:text-[#0071e3] transition-colors">Store Location & Hours</Link></li>
              <li>
                <Link to="/admin/login" className="hover:text-[#0071e3] transition-colors flex items-center gap-1 text-[#86868b] pt-1">
                  <Lock className="w-3 h-3" /> Store Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#1d1d1f] tracking-wide uppercase">
              Direct Contact
            </p>
            <div className="space-y-2.5 text-xs text-[#6e6e73]">
              <a
                href={getWhatsAppUrl(whatsapp, generateGeneralWhatsAppMessage(businessName))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat on WhatsApp with ${businessName}`}
                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors text-left"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp: {formatPhoneDisplay(whatsapp)}</span>
              </a>
              <a
                href={getDialerUrl(phone)}
                aria-label={`Call ${businessName} at ${phone}`}
                className="flex items-center gap-2 text-[#1d1d1f] hover:text-[#0071e3] font-medium transition-colors text-left"
              >
                <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Call Shop: {formatPhoneDisplay(phone)}</span>
              </a>
              <div className="flex items-start gap-2 pt-1 text-[#86868b]">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#6e6e73]" />
                <span className="leading-snug">{address}</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-[#86868b]">
                <Clock className="w-3.5 h-3.5 shrink-0 text-[#6e6e73]" />
                <span>{hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Apple style lower copyright bar */}
        <div className="border-t border-black/8 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868b]">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved. Pre-owned PC hardware showroom.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Direct WhatsApp & In-Store Deals</span>
            <span>•</span>
            <Link to="/about" className="hover:text-[#1d1d1f] transition">Testing Process</Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-[#1d1d1f] transition">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
