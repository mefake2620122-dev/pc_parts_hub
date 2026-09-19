import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import { SiteSettings } from '../../types';
import { generateGeneralWhatsAppMessage, getWhatsAppUrl, getDialerUrl, openWhatsApp } from '../../utils/whatsapp';
import { api } from '../../services/api';

interface MobileBottomBarProps {
  settings?: SiteSettings;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ settings }) => {
  const whatsappNum = settings?.whatsapp || '919179527017';
  const phoneNum = settings?.phone || '+919179527017';
  const businessName = settings?.business_name || 'PC PART HUB';

  const waFallbackUrl = getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName));
  const callUrl = getDialerUrl(phoneNum);

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'WHATSAPP');
    openWhatsApp(whatsappNum, generateGeneralWhatsAppMessage(businessName));
  };

  const handleCallClick = () => {
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'CALL');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-t border-black/8 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
        {/* Call Button */}
        <a
          href={callUrl}
          onClick={handleCallClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/8 text-[#1d1d1f] font-semibold text-xs transition active:scale-95 shadow-xs"
        >
          <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>Call Shop</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={waFallbackUrl}
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full btn-whatsapp-apple text-white font-semibold text-xs tracking-wide transition active:scale-95 shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Us</span>
        </a>
      </div>
    </div>
  );
};

export default MobileBottomBar;
