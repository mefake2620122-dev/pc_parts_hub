import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Product, SiteSettings } from '../types';
import { api } from '../services/api';
import ProductCard from '../components/cards/ProductCard';
import { SEO } from '../components/common/SEO';

interface NewArrivalsProps {
  settings?: SiteSettings;
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const businessName = settings?.business_name || 'PC PART HUB';

  useEffect(() => {
    async function loadNewArrivals() {
      try {
        const res = await api.getProducts({ new_arrival: 1, limit: 50 });
        setProducts(res.products || []);
      } catch (err) {
        console.error('Failed to load new arrivals', err);
      } finally {
        setLoading(false);
      }
    }
    loadNewArrivals();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-28 space-y-8 bg-white">
      <SEO
        title="Just Arrived — New PC Components & Fresh Intakes"
        description={`Browse recently acquired and stress-tested pre-owned PC parts at ${businessName}. Fresh graphics cards, processors, and motherboards.`}
        keywords={`new arrivals PC parts, freshly tested GPU, recent PC components, ${businessName}`}
        siteName={businessName}
      />
      <div className="border-b border-black/8 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdf4] text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fresh Intakes & Benchmarks</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
          Just Arrived.
        </h1>
        <p className="text-sm text-[#86868b] mt-1.5">
          Fresh additions to the inventory. Recently acquired and stress-tested components ready for your next setup.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-[#86868b] text-xs flex flex-col items-center justify-center">
          <div className="w-7 h-7 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
          <span>Loading latest arrivals...</span>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                NEW
              </div>
              <ProductCard product={p} settings={settings} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-[#86868b] text-sm">
          No new arrivals listed right now. Check our full PC Parts catalog for in-stock components.
        </div>
      )}
    </div>
  );
};

export default NewArrivals;
