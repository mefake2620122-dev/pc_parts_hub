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
  // If 10 digits (e.g. Indian mobile number without country code), prepend 91
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

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  // Official WhatsApp universal link (wa.me) - natively intercepted by iOS Safari and Android Chrome
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function getDialerUrl(phone: string): string {
  return `tel:${normalizeDialerNumber(phone)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  const url = getWhatsAppUrl(phone, message);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // On phones: navigate directly in current window so mobile OS immediately hands off to WhatsApp app without popup blocking
    window.location.href = url;
  } else {
    // On desktop: open in new tab so user keeps their place in the catalog
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function openDialer(phone: string): void {
  const telUrl = getDialerUrl(phone);
  window.location.href = telUrl;
}


