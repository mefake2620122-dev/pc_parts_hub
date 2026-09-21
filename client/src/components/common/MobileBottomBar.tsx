import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import { SiteSettings } from '../../types';
import { generateGeneralWhatsAppMessage, getNativeWhatsAppUrl, getDialerUrl, contactConfig, formatPhoneDisplay } from '../../utils/whatsapp';
import { api } from '../../services/api';

interface MobileBottomBarProps {
  settings?: SiteSettings;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ settings }) => {
  const whatsappNum = settings?.whatsapp || contactConfig.whatsappNumber;
  const phoneNum = settings?.phone || contactConfig.phoneNumber;
  const businessName = settings?.business_name || contactConfig.businessName;

  const waMsg = generateGeneralWhatsAppMessage(businessName);
  const waNativeUrl = getNativeWhatsAppUrl(waMsg, whatsappNum);
  const callUrl = getDialerUrl(phoneNum);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'WHATSAPP');
    // On native mobile, assign location directly to dispatch custom scheme without blank popup
    e.preventDefault();
    window.location.href = waNativeUrl;
  };

  const handleCallClick = () => {
    api.trackEnquiry(null, 'Mobile Bottom Bar', 'CALL');
    window.location.href = callUrl;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-t border-black/8 p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl">
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
        {/* Call Button */}
        <a
          href={callUrl}
          onClick={handleCallClick}
          aria-label={`Call ${businessName}`}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/8 text-[#1d1d1f] font-semibold text-xs transition active:scale-95 shadow-xs"
        >
          <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
          <div className="flex flex-col text-left leading-tight">
            <span>Call Store</span>
            <span className="text-[10px] font-normal text-[#86868b]">{formatPhoneDisplay(phoneNum)}</span>
          </div>
        </a>

        {/* WhatsApp Button */}
        <a
          href={waNativeUrl}
          onClick={handleWhatsAppClick}
          aria-label={`Chat on WhatsApp with ${businessName}`}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-full btn-whatsapp-apple text-white font-semibold text-xs tracking-wide transition active:scale-95 shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <div className="flex flex-col text-left leading-tight">
            <span>WhatsApp Us</span>
            <span className="text-[10px] font-normal text-white/80">Instant Reply</span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default MobileBottomBar;
