import type { Product, Combo } from '../types';
import { contactConfig } from '../config/contact';
import {
  normalizePhoneNumber,
  formatWhatsAppNumber,
  formatDialerUrl,
  formatPhoneDisplay,
  DEFAULT_WA_FORMAT,
} from './phone-normalizer';

export { contactConfig, businessContact } from '../config/contact';
export { normalizePhoneNumber, formatPhoneDisplay } from './phone-normalizer';

/**
 * Formats a numeric price into INR currency display (e.g. ₹45,000).
 */
export function formatPrice(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
}

/**
 * Backward compatibility alias for normalizing phone number into WhatsApp format
 */
export function normalizeWhatsAppNumber(phone?: string): string {
  return formatWhatsAppNumber(phone || contactConfig.whatsappNumber);
}

/**
 * Backward compatibility alias for telephone URI format
 */
export function normalizeDialerNumber(phone?: string): string {
  return normalizePhoneNumber(phone || contactConfig.phoneNumber).e164;
}

/**
 * Pure native WhatsApp URL scheme (whatsapp://send?phone=...&text=...)
 * Directly launches the native WhatsApp client on Android & iOS.
 */
export function getNativeWhatsAppUrl(arg1?: string, arg2?: string): string {
  const { phone, message } = parseArgs(arg1, arg2);
  const num = formatWhatsAppNumber(phone || contactConfig.whatsappNumber);
  const msg = message || contactConfig.defaultWhatsAppMessage;
  return `whatsapp://send?phone=${num}&text=${encodeURIComponent(msg)}`;
}

/**
 * Smart Universal WhatsApp Deep Link Generator
 * Ported from day1 architecture:
 * - On Mobile: launches native WhatsApp app via `whatsapp://send?phone=...&text=...`
 * - On Desktop: launches official Web/Desktop gateway via `https://api.whatsapp.com/send/?phone=...&text=...`
 * 
 * Supports flexible argument signatures:
 * - getWhatsAppUrl(phone, message)
 * - getWhatsAppUrl(message, phone)
 */
export function getWhatsAppUrl(arg1?: string, arg2?: string): string {
  const { phone, message } = parseArgs(arg1, arg2);
  const num = formatWhatsAppNumber(phone || contactConfig.whatsappNumber);
  const msg = message || contactConfig.defaultWhatsAppMessage;
  const encoded = encodeURIComponent(msg);

  // On Mobile: dispatch directly to native WhatsApp app
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (isMobile) {
      return `whatsapp://send?phone=${num}&text=${encoded}`;
    }
  }

  // On Desktop / Laptop: Official WhatsApp Web & Desktop gateway
  return `https://api.whatsapp.com/send/?phone=${num}&text=${encoded}`;
}

/**
 * Helper to dynamically determine whether arg1 or arg2 is the phone number
 */
function parseArgs(arg1?: string, arg2?: string): { phone: string; message: string } {
  const defaultPhone = contactConfig.whatsappNumber || DEFAULT_WA_FORMAT;
  const defaultMsg = contactConfig.defaultWhatsAppMessage || 'Hello PC PART HUB, I have an enquiry regarding hardware.';

  if (!arg1 && !arg2) {
    return { phone: defaultPhone, message: defaultMsg };
  }

  if (arg1 && !arg2) {
    if (isPhoneNumber(arg1)) {
      return { phone: arg1, message: defaultMsg };
    }
    return { phone: defaultPhone, message: arg1 };
  }

  // Both args are present
  if (isPhoneNumber(arg1!)) {
    return { phone: arg1!, message: arg2 || defaultMsg };
  }
  return { phone: arg2!, message: arg1! };
}

function isPhoneNumber(str: string): boolean {
  if (!str) return false;
  // If it starts with + or has only digits, spaces, hyphens, and parentheses
  const cleaned = str.replace(/[\s\-()+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Generates standard telephone URI for dialer:
 * tel:+91XXXXXXXXXX
 * 
 * CRITICAL RULE (from day1):
 * NEVER use target="_blank" with tel: links — it breaks iOS and Android native phone dialers!
 */
export function getDialerUrl(phone?: string): string {
  return formatDialerUrl(phone || contactConfig.phoneNumber);
}

/**
 * Generates a contextual inquiry message for a specific product.
 */
export function generateProductWhatsAppMessage(
  product: Pick<Product, 'name'> & Partial<Product>,
  storeName?: string
): string {
  const brand = storeName || contactConfig.businessName;
  let msg = `Hello ${brand}, I am interested in purchasing:\n\n`;
  msg += `*${product.name}*\n`;

  if (product.product_code) {
    msg += `• Product Code: ${product.product_code}\n`;
  }
  if (product.condition) {
    msg += `• Condition: ${product.condition}\n`;
  }
  if (product.price) {
    msg += `• Price: ${formatPrice(product.price)}\n`;
  }
  if (product.stock_status) {
    msg += `• Status: ${product.stock_status.replace('_', ' ')}\n`;
  }

  msg += `\nIs this unit available for inspection / store pickup in Nehru Place?`;
  return msg;
}

/**
 * Generates a contextual inquiry message for a PC Build Combo.
 */
export function generateComboWhatsAppMessage(
  combo: Pick<Combo, 'title' | 'price'>,
  storeName?: string
): string {
  const brand = storeName || contactConfig.businessName;
  let msg = `Hello ${brand}, I am interested in the custom PC build combo:\n\n`;
  msg += `*${combo.title}*\n`;
  msg += `• Combo Price: ${formatPrice(combo.price)}\n\n`;
  msg += `Please share the full component breakdown, testing reports, and availability.`;
  return msg;
}

/**
 * Generates a general store enquiry message.
 */
export function generateGeneralWhatsAppMessage(storeName?: string): string {
  const brand = storeName || contactConfig.businessName;
  return `Hello ${brand}, I am looking for pre-owned PC hardware components in Nehru Place. Please share today's available inventory and pricing.`;
}
