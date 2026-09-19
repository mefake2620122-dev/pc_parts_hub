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
  if (!clean) return '919876543210';
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
  if (!clean) return '+919876543210';
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
  // Universal WhatsApp Link: Android & iOS intercept this automatically via App Links / Universal Links
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
}

export function getDialerUrl(phone: string): string {
  return `tel:${normalizeDialerNumber(phone)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  
  // Universal Link that works seamlessly across iOS Safari, Android Chrome, and Desktop
  const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  const nativeAppUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // On phones and tablets:
    // Trigger direct universal navigation so iOS Safari and Android Chrome hand off to WhatsApp App
    // without triggering mobile popup blockers
    try {
      const a = document.createElement('a');
      a.href = universalUrl;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 500);
    } catch {
      window.location.href = universalUrl;
    }
    return;
  }

  // On Desktop / Laptop:
  // First try the native desktop application
  try {
    window.location.href = nativeAppUrl;

    // Fallback: If desktop app is not installed, open WhatsApp Web in new tab
    const fallbackTimer = setTimeout(() => {
      if (document.hasFocus()) {
        window.open(universalUrl, '_blank', 'noopener,noreferrer');
      }
    }, 2000);

    window.addEventListener('blur', () => clearTimeout(fallbackTimer), { once: true });
  } catch (err) {
    window.open(universalUrl, '_blank', 'noopener,noreferrer');
  }
}

export function openDialer(phone: string): void {
  const telUrl = getDialerUrl(phone);
  
  // Direct anchor click triggers native telephone dialer app on all smartphones
  try {
    const a = document.createElement('a');
    a.href = telUrl;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 500);
  } catch {
    window.location.href = telUrl;
  }
}


