import { Product, Combo } from '../types';

export function formatPrice(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
}

export function generateProductWhatsAppMessage(product: Product, businessName = 'PC Part Hub'): string {
  const priceStr = formatPrice(product.price);
  return `Hello ${businessName}, I am interested in ${product.name} (Code: ${product.product_code}). Price: ${priceStr}, Condition: ${product.condition}. Is it currently available for purchase?`;
}

export function generateComboWhatsAppMessage(combo: Combo, businessName = 'PC Part Hub'): string {
  const priceStr = formatPrice(combo.price);
  return `Hello ${businessName}, I am interested in the ${combo.title} build bundle priced at ${priceStr}. Please confirm availability and details.`;
}

export function generateGeneralWhatsAppMessage(businessName = 'PC Part Hub'): string {
  return `Hello ${businessName}, I would like to enquire about available PC components for my custom build.`;
}

export function normalizeWhatsAppNumber(phone: string): string {
  let clean = (phone || '').replace(/[^0-9]/g, '');
  if (!clean) return '919179527017';
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean;
}

export function normalizeDialerNumber(phone: string): string {
  let clean = (phone || '').replace(/[^0-9+]/g, '');
  if (!clean) return '+919179527017';
  if (!clean.startsWith('+')) {
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      clean = '+91' + digits;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      clean = '+' + digits;
    } else {
      clean = '+' + digits;
    }
  }
  return clean;
}

/** Returns the wa.me universal link — used as the <a href> fallback for SEO & non-JS contexts */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function getDialerUrl(phone: string): string {
  return `tel:${normalizeDialerNumber(phone)}`;
}

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Opens WhatsApp with the given phone number and message.
 *
 * - Mobile (Android & iOS): Uses the `whatsapp://` URL scheme which directly
 *   launches the WhatsApp app without routing through the wa.me web redirect.
 *   This is the most reliable method on mobile because it bypasses the
 *   intermediate web page and triggers the app via the OS.
 *
 * - Desktop: Opens `https://wa.me/` in a new browser tab so the user stays
 *   on the current page.
 *
 * Always call this inside a synchronous click handler (never in an async
 * callback) so browsers treat it as a trusted user-gesture navigation.
 */
export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);

  if (isMobileDevice()) {
    // whatsapp:// is natively handled by Android & iOS and opens the app directly.
    // No intermediate wa.me web page, no App Link configuration required.
    window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
  } else {
    // Desktop: open in a new tab so the user keeps their place on the site.
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodedMsg}`,
      '_blank',
      'noopener,noreferrer'
    );
  }
}

/**
 * Triggers the device dialler for the given phone number.
 * tel: links are handled natively by all mobile browsers and OSes.
 */
export function openDialer(phone: string): void {
  window.location.href = `tel:${normalizeDialerNumber(phone)}`;
}
