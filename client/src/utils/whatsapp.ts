import type { Product, Combo } from '../types';
import { contactConfig } from '../config/contact';

export { contactConfig, businessContact } from '../config/contact';

/**
 * Formats a numeric price into INR currency display (e.g. ₹45,000).
 */
export function formatPrice(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
}

/**
 * Normalizes any phone number input into clean digits with country code for WhatsApp deep links.
 * Strips all spaces, +, -, (), and formatting characters.
 * Guarantees proper format: COUNTRYCODEPHONENUMBER (e.g. 919179527017).
 */
export function normalizeWhatsAppNumber(phone?: string): string {
  let clean = (phone || contactConfig.whatsappNumber || '').replace(/[^0-9]/g, '');
  if (!clean) {
    clean = (contactConfig.whatsappNumber || '919179527017').replace(/[^0-9]/g, '');
  }

  // If 10 digits (standard Indian mobile number without country code), prepend 91
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }

  return clean;
}

/**
 * Normalizes a phone number for the telephone URI (tel:+91XXXXXXXXXX).
 * Strips spaces, hyphens, and brackets. Preserves leading '+'.
 */
export function normalizeDialerNumber(phone?: string): string {
  let clean = (phone || contactConfig.phoneNumber || '').replace(/[^0-9+]/g, '');
  if (!clean) {
    clean = contactConfig.phoneNumber || '+919179527017';
  }

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

/**
 * Generates the official WhatsApp deep link:
 * https://wa.me/COUNTRYCODEPHONENUMBER?text=ENCODED_MESSAGE
 *
 * Fully URL-encodes messages to safely handle spaces, ₹ symbols, quotes, and punctuation.
 * Native link behavior on mobile directly launches the WhatsApp app.
 * On desktop, it opens WhatsApp Web / handler.
 */
export function getWhatsAppUrl(phone?: string, message?: string): string {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const msg = message !== undefined ? message : contactConfig.defaultWhatsAppMessage;
  if (!msg) {
    return `https://wa.me/${cleanPhone}`;
  }
  const encodedMsg = encodeURIComponent(msg);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Generates standard telephone URI for dialer:
 * tel:+91XXXXXXXXXX
 */
export function getDialerUrl(phone?: string): string {
  return `tel:${normalizeDialerNumber(phone)}`;
}

/**
 * Generates a contextual inquiry message for a specific product.
 * Includes product name and formatted price when available.
 */
export function generateProductWhatsAppMessage(
  product: Pick<Product, 'name'> & Partial<Product>,
  _businessName?: string
): string {
  if (product.stock_status === 'SOLD_OUT') {
    const codePart = product.product_code ? ` (Code: ${product.product_code})` : '';
    return `Hi, I saw that the ${product.name}${codePart} is currently Sold Out. Do you have any similar hardware coming in stock soon?`;
  }

  const priceStr = product.price ? ` (${formatPrice(product.price)})` : '';
  const codeStr = product.product_code ? ` [Code: ${product.product_code}]` : '';
  return `Hi, I'm interested in the ${product.name}${codeStr}${priceStr}. Please share more details.`;
}

/**
 * Generates a contextual inquiry message for a combo package.
 */
export function generateComboWhatsAppMessage(
  combo: Partial<Combo> & { name?: string; title?: string; price?: number },
  _businessName?: string
): string {
  const title = combo.title || combo.name || 'Build Package';
  const priceStr = combo.price ? ` (${formatPrice(combo.price)})` : '';
  return `Hi, I'm interested in the ${title} build bundle${priceStr}. Please share more details.`;
}

/**
 * Generates a general store enquiry message.
 */
export function generateGeneralWhatsAppMessage(businessName?: string): string {
  const name = businessName || contactConfig.businessName;
  return `Hello ${name}, I would like to enquire about available PC components for my custom build.`;
}
