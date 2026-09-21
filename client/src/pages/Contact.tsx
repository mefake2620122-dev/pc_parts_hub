import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { SiteSettings } from '../types';
import { getWhatsAppUrl, getDialerUrl, generateGeneralWhatsAppMessage, contactConfig, formatPhoneDisplay } from '../utils/whatsapp';
import { SEO } from '../components/common/SEO';

interface ContactProps {
  settings?: SiteSettings;
}

export const Contact: React.FC<ContactProps> = ({ settings }) => {
  const businessName = settings?.business_name || contactConfig.businessName;
  const phone = settings?.phone || contactConfig.phoneNumber;
  const whatsapp = settings?.whatsapp || contactConfig.whatsappNumber;
  const address = settings?.address || 'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi, India 110019';
  const mapsUrl = settings?.maps_url || 'https://maps.google.com/?q=Nehru+Place+New+Delhi';
  const hours = settings?.opening_hours || 'Mon – Sat: 11:00 AM – 8:30 PM (Sunday by Appointment)';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-28 space-y-12 bg-white">
      <SEO
        title={`Contact ${businessName} — Store & WhatsApp`}
        description={`Connect directly with ${businessName}${address ? ' at ' + address.split(',').slice(0,2).join(',') : ''}. Phone: ${phone}. Visit our store for in-person hardware testing and pickup.`}
        keywords={`contact ${businessName}, computer shop phone, PC hardware showroom`}
        siteName={businessName}
      />
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
          Direct Store Connection
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
          Talk to {businessName}
        </h1>
        <p className="text-sm text-[#86868b] max-w-lg mx-auto">
          Visit our showroom in person to test components on our live test-bench, or connect directly via WhatsApp.
        </p>
      </div>

      {/* Main 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* WhatsApp Card */}
        <div className="rounded-3xl bg-white p-7 sm:p-8 flex flex-col justify-between gap-6 border border-black/8 shadow-apple-card hover:shadow-apple-hover transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1d1d1f]">WhatsApp Enquiry</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Fastest response. Send component names, ask for benchmark videos, or request store availability.
            </p>
            <p className="text-xs font-mono text-emerald-700 font-semibold">
              {phone}
            </p>
          </div>

          <a
            href={getWhatsAppUrl(whatsapp, generateGeneralWhatsAppMessage(businessName))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Start WhatsApp chat with ${businessName}`}
            className="w-full py-3 rounded-full btn-whatsapp-apple text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start WhatsApp Chat</span>
          </a>
        </div>

        {/* Call Card */}
        <div className="rounded-3xl bg-white p-7 sm:p-8 flex flex-col justify-between gap-6 border border-black/8 shadow-apple-card hover:shadow-apple-hover transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f0f6ff] flex items-center justify-center text-[#0071e3]">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1d1d1f]">Direct Phone Call</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Call our shop directly during operating hours for immediate stock inquiries and technical questions.
            </p>
            <p className="text-xs font-mono text-[#0071e3] font-semibold">
              {formatPhoneDisplay(phone)}
            </p>
          </div>

          <a
            href={getDialerUrl(phone)}
            aria-label={`Call ${businessName} now at ${phone}`}
            className="w-full py-3 rounded-full btn-apple-secondary text-xs font-semibold shadow-xs flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#0071e3]" />
            <span>Call Now</span>
          </a>
        </div>

        {/* Location Card */}
        <div className="rounded-3xl bg-white p-7 sm:p-8 flex flex-col justify-between gap-6 border border-black/8 shadow-apple-card hover:shadow-apple-hover transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
              <MapPin className="w-6 h-6 text-[#0071e3]" />
            </div>
            <h3 className="text-lg font-bold text-[#1d1d1f]">Showroom Location</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              {address}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#86868b] pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{hours}</span>
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Offline Policy Notice */}
      <div className="rounded-3xl bg-[#f5f5f7] p-8 border border-black/5 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-[#0071e3] shrink-0 mt-1" />
        <div className="space-y-1 text-xs text-[#6e6e73]">
          <h4 className="font-bold text-[#1d1d1f] text-sm">
            In-Person Hardware Testing & Inspection Policy
          </h4>
          <p className="leading-relaxed">
            We actively encourage buyers to visit our store in Nehru Place. You can test your chosen GPU on our live test-bench, run FurMark or 3DMark benchmarks, check temperatures in person, and collect your hardware with complete peace of mind.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Contact;
