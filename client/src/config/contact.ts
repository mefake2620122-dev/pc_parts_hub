/**
 * Centralized Business Contact Configuration
 * Single source of truth for WhatsApp, phone, and messaging defaults.
 * Supports Vite environment variables with production fallbacks.
 */

export interface BusinessContactConfig {
  whatsappNumber: string;
  phoneNumber: string;
  businessName: string;
  defaultWhatsAppMessage: string;
}

export const contactConfig: BusinessContactConfig = {
  // Automatic normalization is handled by normalizeWhatsAppNumber() & normalizeDialerNumber()
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '919179527017',
  phoneNumber: import.meta.env.VITE_BUSINESS_PHONE || '+919179527017',
  businessName: import.meta.env.VITE_BUSINESS_NAME || 'PC PART HUB',
  defaultWhatsAppMessage:
    import.meta.env.VITE_DEFAULT_WHATSAPP_MESSAGE ||
    'Hello, I would like to enquire about available PC components for my custom build.',
};

export const businessContact = contactConfig;
