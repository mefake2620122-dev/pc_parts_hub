import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import { SiteSettings } from '../../types';
import { openWhatsApp, openDialer, generateGeneralWhatsAppMessage } from '../../utils/whatsapp';
import { api } from '../../services/api';

interface MobileBottomBarProps {
  settings?: SiteSettings;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ settings }) => {
  const whatsappNum = settings?.whatsapp || '919876543210';
  const phoneNum = settings?.phone || '+919876543210';
  const businessName = settings?.business_name || 'PC PART HUB';

  const handleWhatsApp = () => {
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'WHATSAPP');
    openWhatsApp(whatsappNum, generateGeneralWhatsAppMessage(businessName));
  };

  const handleCall = () => {
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'CALL');
    openDialer(phoneNum);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/90 backdrop-blur-xl border-t border-black/8 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
        {/* Call Button */}
        <button
          onClick={handleCall}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/8 text-[#1d1d1f] font-semibold text-xs transition active:scale-95 shadow-xs"
        >
          <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>Call Shop</span>
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full btn-whatsapp-apple text-white font-semibold text-xs tracking-wide transition active:scale-95 shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Us</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomBar;
