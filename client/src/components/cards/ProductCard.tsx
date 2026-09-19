import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Product, SiteSettings } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { formatPrice, getWhatsAppUrl, generateProductWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';
import { api } from '../../services/api';

interface ProductCardProps {
  product: Product;
  settings?: SiteSettings;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, settings }) => {
  const whatsappNum = settings?.whatsapp || '919179527017';
  const businessName = settings?.business_name || 'PC PART HUB';
  const isSold = product.stock_status === 'SOLD_OUT';

  const waMsg = isSold
    ? `Hello ${businessName}, I saw that ${product.name} (Code: ${product.product_code}) is currently Sold Out. Do you have any similar hardware coming in stock soon?`
    : generateProductWhatsAppMessage(product, businessName);
  const waUrl = getWhatsAppUrl(whatsappNum, waMsg);

  const handleWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    api.trackEnquiry(product.id, product.name, 'WHATSAPP');
    openWhatsApp(whatsappNum, waMsg);
  };

  const imageSrc = product.primary_image || (product.images && product.images[0]?.image_url) || 'https://placehold.co/800x600/f5f5f7/1d1d1f?text=PC+Part';

  return (
    <article className="group relative bg-white rounded-2xl border border-black/8 overflow-hidden flex flex-col h-full shadow-apple-card hover:shadow-apple-hover transition-all duration-300 hover:-translate-y-1">
      
      {/* Product Image Area with studio-like soft lighting */}
      <Link to={`/parts/${product.slug}`} className="block relative aspect-[4/3] bg-[#fbfbfd] p-6 flex items-center justify-center overflow-hidden border-b border-black/5">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 ${
            isSold ? 'grayscale opacity-50 contrast-75' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/f5f5f7/86868b?text=PC+Part';
          }}
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 pointer-events-none">
          <StatusBadge condition={product.condition} size="sm" />
          <StatusBadge stock={product.stock_status} size="sm" />
        </div>

        {/* Hardware Code Tag */}
        <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-black/5 text-[10px] font-mono text-[#6e6e73] shadow-sm">
          {product.product_code}
        </div>

        {/* Tested chip */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Tested</span>
        </div>

        {isSold && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-[#1d1d1f] text-white font-bold text-xs tracking-widest uppercase shadow-md">
              SOLD OUT
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3.5">
        <div className="space-y-1.5">
          {/* Category & Brand info */}
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span className="font-semibold text-[#0071e3] uppercase tracking-wider text-[11px]">
              {product.category_name || product.brand}
            </span>
            <span className="text-[#86868b]">{product.brand}</span>
          </div>

          {/* Title */}
          <Link to={`/parts/${product.slug}`} className="block">
            <h3 className="font-semibold text-[#1d1d1f] text-base leading-snug line-clamp-2 group-hover:text-[#0071e3] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Quick Specs Snippet */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <p className="text-xs text-[#86868b] line-clamp-1 font-mono pt-0.5">
              {Object.entries(product.specifications)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' • ')}
            </p>
          )}
        </div>

        {/* Price & Actions */}
        <div className="pt-3 border-t border-black/5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-[#86868b] block font-medium">Verified Price</span>
              <span className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#86868b] block">Condition</span>
              <span className="text-xs font-semibold text-[#1d1d1f]">{product.condition}</span>
            </div>
          </div>

          {/* Buttons: Apple Pill Style */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/parts/${product.slug}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-medium transition"
            >
              <span>View Part</span>
              <ArrowRight className="w-3 h-3 text-[#86868b]" />
            </Link>

            <a
              href={waUrl}
              onClick={handleWhatsApp}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold tracking-wide transition ${
                isSold
                  ? 'bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#6e6e73]'
                  : 'btn-whatsapp-apple'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSold ? 'Similar?' : 'WhatsApp'}</span>
            </a>
          </div>
        </div>

      </div>
    </article>
  );
};

export default ProductCard;
