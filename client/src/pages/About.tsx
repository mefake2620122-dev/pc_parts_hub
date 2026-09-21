import React from 'react';
import { ShieldCheck, Cpu, CheckCircle2, MessageSquare, Search } from 'lucide-react';
import { SiteSettings } from '../types';
import { getWhatsAppUrl, generateGeneralWhatsAppMessage, contactConfig } from '../utils/whatsapp';
import { SEO } from '../components/common/SEO';

interface AboutProps {
  settings?: SiteSettings;
}

export const About: React.FC<AboutProps> = ({ settings }) => {
  const businessName = settings?.business_name || contactConfig.businessName;
  const whatsappNum = settings?.whatsapp || contactConfig.whatsappNumber;
  const aboutCustom = settings?.about_text;
  const address = settings?.address || '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-28 space-y-14 bg-white">
      <SEO
        title={`About ${businessName} — Standards & Hardware Testing Process`}
        description={`Learn about ${businessName}'s benchmark testing procedure for pre-owned computer hardware${address ? ' in ' + address.split(',').slice(0, 2).join(',') : ''}. FurMark, Cinebench, and MemTest verified.`}
        keywords={`about ${businessName}, hardware testing, pre-owned GPU benchmark, certified used PC parts`}
        siteName={businessName}
      />
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
          Our Standards & Process
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
          About {businessName}
        </h1>
        <p className="text-sm text-[#86868b] max-w-xl mx-auto">
          A dedicated digital inventory and showroom for tested, certified pre-owned PC hardware.
        </p>
      </div>

      {/* Main Philosophy Card */}
      <div className="rounded-3xl bg-[#fbfbfd] p-8 sm:p-12 border border-black/8 shadow-apple-card space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
          Who We Are
        </h2>
        <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
          {aboutCustom || `${businessName} operates as a specialized hardware showroom providing transparent, pre-tested, and certified pre-owned computer components for gamers, video editors, and PC builders. We believe buying second-hand hardware should be completely transparent, dependable, and risk-free.`}
        </p>
      </div>

      {/* How We Work / Testing Grid */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">
            Quality Assurance
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight">
            Our 4-Stage Testing Procedure
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white p-6 space-y-3 border border-black/8 shadow-apple-card">
            <div className="w-10 h-10 rounded-full bg-[#f0f6ff] flex items-center justify-center text-[#0071e3]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
              1. Physical & Microscopic Inspection
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Every component is inspected for bent socket pins, capacitor health, oxidation, PCB warping, and connector wear before accepting into inventory.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 space-y-3 border border-black/8 shadow-apple-card">
            <div className="w-10 h-10 rounded-full bg-[#f0f6ff] flex items-center justify-center text-[#0071e3]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
              2. Thermal & Repasting Care
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Graphics cards and CPU coolers are dusted, cleaned with isopropyl alcohol, and repasted with premium thermal compounds where necessary.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 space-y-3 border border-black/8 shadow-apple-card">
            <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
              3. Extended Benchmark Stress-Tests
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              FurMark, 3DMark Time Spy, Cinebench R23, and Prime95 stress sessions verify stability under maximum theoretical thermal and electrical loads.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 space-y-3 border border-black/8 shadow-apple-card">
            <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
              4. Accurate Cataloguing
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              We list the verified condition (Like New, Excellent, Good), attach live benchmark specs, and sync availability immediately so you never buy blind.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Contact CTA */}
      <div className="rounded-3xl bg-[#f5f5f7] p-8 sm:p-12 border border-black/8 text-center space-y-4 shadow-apple-card">
        <h2 className="text-2xl font-bold text-[#1d1d1f]">
          Need Advice for Your Build?
        </h2>
        <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto">
          Share your target budget, games, or workload with our technicians on WhatsApp for custom part recommendations.
        </p>
        <a
          href={getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat on WhatsApp with ${businessName} technicians`}
          className="px-7 py-3 rounded-full btn-whatsapp-apple text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat with Technicians</span>
        </a>
      </div>

    </div>
  );
};

export default About;
