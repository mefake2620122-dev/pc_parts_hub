/**
 * Universal Indian Phone & WhatsApp Number Normalizer
 * (Ported from proven day1 architecture)
 *
 * Normalizes any user/admin input (e.g. "9179527017", "+91 91795 27017", "09179527017", "+91-91795-27017")
 * into consistent, valid formats for:
 * 1. Database storage & UI display: "+91 91795 27017"
 * 2. WhatsApp API links: "919179527017" (wa.me / api.whatsapp.com format)
 * 3. Mobile Tel links: "tel:+919179527017"
 * 4. Pure 10-digit number: "9179527017"
 */

export interface NormalizedPhone {
  isValid: boolean;
  raw: string;
  digits10: string;
  display: string;
  e164: string;
  waFormat: string;
  telUrl: string;
  error?: string;
}

export const DEFAULT_PHONE_RAW = '9179527017';
export const DEFAULT_PHONE_DISPLAY = '+91 91795 27017';
export const DEFAULT_WA_FORMAT = '919179527017';

export function normalizePhoneNumber(input?: string | null): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      raw: '',
      digits10: DEFAULT_PHONE_RAW,
      display: DEFAULT_PHONE_DISPLAY,
      e164: `+91${DEFAULT_PHONE_RAW}`,
      waFormat: DEFAULT_WA_FORMAT,
      telUrl: `tel:+91${DEFAULT_PHONE_RAW}`,
      error: 'Phone number is required',
    };
  }

  const raw = input.trim();
  // Extract all digits
  let digits = raw.replace(/[^0-9]/g, '');

  // Remove leading zero if 11 digits (e.g. 09179527017 -> 9179527017)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Remove country code 91 if 12 digits (e.g. 919179527017 -> 9179527017)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // If longer than 10 digits, keep the last 10 digits
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  // Validate standard Indian mobile number (10 digits starting with 6, 7, 8, or 9)
  const isValid = digits.length === 10 && /^[6-9]\d{9}$/.test(digits);

  if (!isValid) {
    // If not standard mobile, check if valid 10-digit landline or corporate number
    if (digits.length === 10) {
      return {
        isValid: true,
        raw,
        digits10: digits,
        display: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
        e164: `+91${digits}`,
        waFormat: `91${digits}`,
        telUrl: `tel:+91${digits}`,
      };
    }

    return {
      isValid: false,
      raw,
      digits10: digits || DEFAULT_PHONE_RAW,
      display: raw || DEFAULT_PHONE_DISPLAY,
      e164: digits ? `+91${digits}` : `+91${DEFAULT_PHONE_RAW}`,
      waFormat: digits ? (digits.startsWith('91') ? digits : `91${digits}`) : DEFAULT_WA_FORMAT,
      telUrl: digits ? `tel:+91${digits}` : `tel:+91${DEFAULT_PHONE_RAW}`,
      error: 'Please enter a valid 10-digit mobile number (e.g. 91795 27017)',
    };
  }

  const digits10 = digits;
  const display = `+91 ${digits10.slice(0, 5)} ${digits10.slice(5)}`;
  const e164 = `+91${digits10}`;
  const waFormat = `91${digits10}`;
  const telUrl = `tel:${e164}`;

  return {
    isValid: true,
    raw,
    digits10,
    display,
    e164,
    waFormat,
    telUrl,
  };
}

/**
 * Format a phone number into display format: "+91 91795 27017"
 */
export function formatPhoneDisplay(input?: string | null): string {
  return normalizePhoneNumber(input).display;
}

/**
 * Format a phone number into pure WhatsApp digits: "919179527017"
 */
export function formatWhatsAppNumber(input?: string | null): string {
  return normalizePhoneNumber(input).waFormat;
}

/**
 * Format a phone number into dialer URL: "tel:+919179527017"
 */
export function formatDialerUrl(input?: string | null): string {
  return normalizePhoneNumber(input).telUrl;
}
