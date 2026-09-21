import { useEffect } from 'react';
import { formatWhatsAppNumber } from '../../utils/phone-normalizer';
import { contactConfig } from '../../utils/whatsapp';

/**
 * Universal WhatsApp & Call click interceptor (Ported from Day1 architecture):
 * - On Mobile (Android / iOS):
 *   - For tel: links, opens native phone dialer directly without opening empty tabs.
 *   - For WhatsApp links, dispatches directly to the native WhatsApp app via `whatsapp://send` scheme.
 * - On Desktop / Laptop:
 *   - Ensures official `https://api.whatsapp.com/send/?phone=...` gateway opens smoothly in a new tab
 *     (triggering WhatsApp Desktop or WhatsApp Web without popup blockers).
 */
export function WhatsAppGlobalHandler({ defaultPhone, defaultMsg }: { defaultPhone?: string; defaultMsg?: string }) {
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // On mobile devices, ensure tel: dialer links invoke native phone dialer directly
      if (href.startsWith('tel:')) {
        const isMobile =
          typeof navigator !== 'undefined' &&
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = href;
        }
        return;
      }

      const isWhatsApp =
        href.startsWith('whatsapp://') ||
        href.includes('wa.me') ||
        href.includes('api.whatsapp.com') ||
        href.includes('web.whatsapp.com');

      if (!isWhatsApp) return;

      let phone = defaultPhone || contactConfig.whatsappNumber || '919179527017';
      let text = defaultMsg || contactConfig.defaultWhatsAppMessage || 'Hello, I have an enquiry regarding hardware.';

      try {
        if (href.startsWith('http')) {
          const url = new URL(href, window.location.origin);
          const p = url.searchParams.get('phone');
          const t = url.searchParams.get('text');
          if (p) phone = p;
          if (t) text = t;
          if (!p && url.pathname) {
            const digits = url.pathname.replace(/[^0-9]/g, '');
            if (digits) phone = digits;
          }
        } else if (href.startsWith('whatsapp://')) {
          const queryStr = href.split('?')[1] || '';
          const params = new URLSearchParams(queryStr);
          const p = params.get('phone');
          const t = params.get('text');
          if (p) phone = p;
          if (t) text = t;
        }
      } catch {
        const phoneMatch = href.match(/phone=(\d+)/) || href.match(/wa\.me\/(\d+)/);
        if (phoneMatch) phone = phoneMatch[1];
        const textMatch = href.match(/text=([^&]+)/);
        if (textMatch) text = decodeURIComponent(textMatch[1]);
      }

      // Universal phone normalization (clean 91XXXXXXXXXX)
      const cleanPhone = formatWhatsAppNumber(phone);
      const encodedText = encodeURIComponent(text);

      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Direct native application protocol dispatch on mobile
        e.preventDefault();
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
      } else {
        // On Desktop / Laptop:
        // Set standard attributes and allow native browser link navigation to official API gateway
        target.setAttribute('target', '_blank');
        target.setAttribute('rel', 'noopener noreferrer');
        target.setAttribute(
          'href',
          `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`
        );
      }
    }

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [defaultPhone, defaultMsg]);

  return null;
}

export default WhatsAppGlobalHandler;
