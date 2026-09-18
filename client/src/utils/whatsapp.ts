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

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  
  // Native deep link URI scheme to directly launch WhatsApp App
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
  const universalUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // On phones and tablets, immediately open native WhatsApp App
    window.location.href = appUrl;
    return;
  }

  // On Desktop / Laptop:
  // Directly trigger native desktop WhatsApp application
  try {
    window.location.href = appUrl;

    // Fallback: If WhatsApp desktop app is not installed on PC and window remains active,
    // open the web link in a new tab after 2.5 seconds so user is never stuck
    const fallbackTimer = setTimeout(() => {
      if (document.hasFocus()) {
        window.open(universalUrl, '_blank', 'noopener,noreferrer');
      }
    }, 2500);

    // If native desktop app opens, window loses focus -> clear the fallback timer
    window.addEventListener('blur', () => clearTimeout(fallbackTimer), { once: true });
  } catch (err) {
    window.open(universalUrl, '_blank', 'noopener,noreferrer');
  }
}

export function openDialer(phone: string): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanPhone}`;
}
