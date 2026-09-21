import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any>;
  /** Pass settings?.business_name here so page titles update from admin panel */
  siteName?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  jsonLd,
  siteName,
}) => {
  useEffect(() => {
    // 1. Title — use dynamic siteName from settings if provided
    const brand = siteName || (window as any).__siteName || 'PC PART HUB';
    const defaultTitle = `${brand} — Pre-Owned PC Components & Hardware`;
    const finalTitle = title ? `${title} | ${brand}` : defaultTitle;
    document.title = finalTitle;

    // 2. Helper to set or update meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Meta Description & Keywords
    const finalDesc = description || 'Premium pre-owned, stress-tested PC components and hardware showroom in Nehru Place. Browse GPUs, CPUs, motherboards, RAM, and storage with direct WhatsApp enquiry.';
    setMetaTag('name', 'description', finalDesc);

    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 4. Open Graph & Twitter Cards
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', window.location.href);

    const finalImage = ogImage || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80';
    setMetaTag('property', 'og:image', finalImage);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', finalImage);

    // 5. Canonical link
    const finalCanonical = canonical || window.location.href.split('?')[0];
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);

    // 6. JSON-LD Schema
    let scriptTag = document.getElementById('seo-json-ld') as HTMLScriptElement;
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-json-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonical, ogImage, ogType, jsonLd]);

  return null;
};

export default SEO;
