import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Phone,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  MapPin,
  Clock
} from 'lucide-react';
import { Product, SiteSettings } from '../types';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { SEO } from '../components/common/SEO';
import {
  formatPrice,
  getWhatsAppUrl,
  getDialerUrl,
  generateProductWhatsAppMessage
} from '../utils/whatsapp';

interface PartDetailProps {
  settings?: SiteSettings;
}

export const PartDetail: React.FC<PartDetailProps> = ({ settings }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const businessName = settings?.business_name || 'PC PART HUB';
  const whatsappNum = settings?.whatsapp || '919179527017';
  const phoneNum = settings?.phone || '+91 91795 27017';
  const storeAddress = settings?.address || 'Shop 14, Commercial Tech Zone, Nehru Place, New Delhi';

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await api.getProduct(slug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-32 text-center text-[#86868b] text-xs flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading hardware specifications & gallery...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#1d1d1f]">Component Not Found</h2>
        <p className="text-sm text-[#86868b]">The requested hardware part may have been removed or updated in our inventory.</p>
        <Link to="/parts" className="inline-block px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold">
          Return to Inventory
        </Link>
      </div>
    );
  }

  const isSold = product.stock_status === 'SOLD_OUT';
  const images = (product.images && product.images.length > 0)
    ? product.images
    : [{ id: 0, image_url: product.primary_image || 'https://placehold.co/800x600/f5f5f7/1d1d1f?text=PC+Part', is_primary: 1 }];

  const waMsg = isSold
    ? `Hello ${businessName}, I saw that ${product.name} (Code: ${product.product_code}) is currently Sold Out. Do you have any similar hardware coming in stock soon?`
    : generateProductWhatsAppMessage(product, businessName);
  const waUrl = getWhatsAppUrl(whatsappNum, waMsg);
  const callUrl = getDialerUrl(phoneNum);

  const handleWhatsApp = () => {
    api.trackEnquiry(product.id, product.name, 'WHATSAPP');
  };

  const handleCall = () => {
    api.trackEnquiry(product.id, product.name, 'CALL');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: images.map((img) => img.image_url),
    description: product.description || `Pre-owned ${product.name} in ${product.condition} condition. Tested and certified at PC Part Hub.`,
    sku: product.product_code,
    mpn: product.model || product.product_code,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'PC Part Hub'
    },
    itemCondition: product.condition === 'Like New' ? 'https://schema.org/LikeNewCondition' : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.stock_status === 'IN_STOCK' ? 'https://schema.org/InStock' : product.stock_status === 'LOW_STOCK' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
      seller: {
        '@type': 'Organization',
        name: businessName
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-28 space-y-10 bg-white">
      <SEO
        title={`${product.name} (${product.condition})`}
        description={`Buy pre-owned ${product.name} at ₹${product.price?.toLocaleString('en-IN')}. Condition: ${product.condition}. Verified stock at PC Part Hub Nehru Place showroom.`}
        keywords={`${product.name}, ${product.brand}, pre-owned ${product.category_name}, used PC hardware Nehru Place`}
        ogImage={images[0]?.image_url}
        ogType="product"
        jsonLd={productJsonLd}
      />
      
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-xs text-[#86868b] pb-2 border-b border-black/5">
        <button
          onClick={() => navigate('/parts')}
          className="flex items-center gap-1.5 text-[#1d1d1f] hover:text-[#0071e3] transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Parts Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-black/5">
            ID: {product.product_code}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] transition"
            title="Copy link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Hero Image in Studio Frame */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-[#fbfbfd] border border-black/8 p-8 flex items-center justify-center shadow-apple-card">
            <img
              src={images[activeImageIndex]?.image_url || product.primary_image}
              alt={product.name}
              className={`w-full h-full object-contain transition-transform duration-500 hover:scale-105 ${
                isSold ? 'grayscale opacity-50' : ''
              }`}
            />

            {/* Overlay Status */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <StatusBadge condition={product.condition} />
              <StatusBadge stock={product.stock_status} />
            </div>

            {isSold && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-6 py-2 rounded-full bg-[#1d1d1f] text-white font-bold text-sm tracking-widest uppercase shadow-lg">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-16 rounded-xl overflow-hidden bg-[#fbfbfd] p-1 border transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-xs'
                      : 'border-black/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Testing Guarantee Callout */}
          <div className="rounded-2xl bg-[#f5f5f7] p-4 border border-black/5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-[#1d1d1f] uppercase tracking-wider">
                Stress-Tested & Verified Hardware
              </p>
              <p className="text-[#86868b] leading-relaxed">
                Tested for zero thermal throttling, verified stability under FurMark/Prime95 benchmarks, and physical socket integrity check passed.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Information & CTAs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0071e3] uppercase tracking-widest">
              <span>{product.category_name}</span>
              <span className="text-[#86868b]">•</span>
              <span className="text-[#86868b]">{product.brand}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.model && (
              <p className="text-xs text-[#86868b] font-mono">
                Model: {product.model}
              </p>
            )}
          </div>

          {/* Price Box */}
          <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/5 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#86868b] font-medium block">
                Verified Store Price
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] tracking-tight mt-0.5">
                {formatPrice(product.price)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#86868b] block">Stock Status</span>
              <span className={`text-xs font-semibold ${isSold ? 'text-[#86868b]' : 'text-emerald-700'}`}>
                {isSold ? 'Sold Out' : `${product.quantity} unit(s) available`}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-1">
            <a
              href={waUrl}
              onClick={handleWhatsApp}
              className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition ${
                isSold
                  ? 'bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#6e6e73]'
                  : 'btn-whatsapp-apple text-white shadow-md'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isSold ? 'Ask About Similar Hardware' : 'WhatsApp Enquire to Buy'}</span>
            </a>

            <a
              href={callUrl}
              onClick={handleCall}
              className="w-full py-3 px-6 rounded-full btn-apple-secondary text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#0071e3]" />
              <span>Call Store ({phoneNum})</span>
            </a>
          </div>

          {/* Dynamic Technical Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-3 pt-4 border-t border-black/8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                Technical Specifications
              </h3>
              <div className="rounded-2xl border border-black/8 overflow-hidden divide-y divide-black/5 text-xs">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 py-2.5 px-4 bg-[#fbfbfd]">
                    <span className="text-[#86868b] font-medium">{key}</span>
                    <span className="col-span-2 font-mono text-[#1d1d1f]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-2 pt-4 border-t border-black/8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                Component Overview & Condition Notes
              </h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Offline Store Reassurance Card */}
          <div className="p-4 rounded-2xl bg-[#fafafc] border border-black/5 space-y-2 text-xs text-[#86868b]">
            <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>In-Store Inspection & Testing Available</span>
            </div>
            <p className="leading-relaxed">
              Visit our Nehru Place showroom to inspect this component in a live test-bench setup before completing your deal.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PartDetail;
