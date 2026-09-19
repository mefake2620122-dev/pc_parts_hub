import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, Cpu, Sparkles, Layers } from 'lucide-react';
import { Combo, SiteSettings } from '../types';
import { api } from '../services/api';
import { SEO } from '../components/common/SEO';
import { formatPrice, getWhatsAppUrl, openWhatsApp } from '../utils/whatsapp';

interface BuildsProps {
  settings?: SiteSettings;
}

export const Builds: React.FC<BuildsProps> = ({ settings }) => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  const businessName = settings?.business_name || 'PC PART HUB';
  const whatsappNum = settings?.whatsapp || '919179527017';

  useEffect(() => {
    async function loadCombos() {
      try {
        const res = await api.getCombos();
        setCombos(res.combos || []);
      } catch (err) {
        console.error('Failed to load combos', err);
      } finally {
        setLoading(false);
      }
    }
    loadCombos();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-28 space-y-12 bg-white">
      <SEO
        title="Curated Hardware Combos & PC Builds"
        description="Explore balanced pre-tested PC component combinations and upgrade packs in Nehru Place. Bottleneck-free CPU, GPU, motherboard bundles."
        keywords="PC build combos, gaming combo pack, Ryzen RTX bundle, PC Part Hub builds"
      />
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f6ff] text-xs font-semibold text-[#0071e3] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Performance Bundles</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
          Build Something Better.
        </h1>
        <p className="text-sm text-[#86868b] leading-relaxed">
          Pre-tested matching hardware packages assembled by our technicians to eliminate socket incompatibilities and performance bottlenecks.
        </p>
      </div>

      {/* Combos Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#86868b] text-xs flex flex-col items-center justify-center">
          <div className="w-7 h-7 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
          <span>Loading curated hardware bundles...</span>
        </div>
      ) : combos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="rounded-3xl bg-white border border-black/8 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-apple-card hover:shadow-apple-hover transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Visual */}
                <div className="aspect-[16/9] rounded-2xl bg-[#fbfbfd] border border-black/5 overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={combo.image_url || combo.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'}
                    alt={combo.name || combo.title}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Header Strip */}
                <div className="flex items-baseline justify-between gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold">
                    Tested Combination
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
                    {formatPrice(combo.price)}
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-bold text-[#1d1d1f]">
                  {combo.name || combo.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  {combo.description}
                </p>

                {/* Included Components Checklist */}
                {((combo.products && combo.products.length > 0) || (combo.items && combo.items.length > 0)) && (
                  <div className="pt-3 border-t border-black/5 space-y-2">
                    <p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#0071e3]" /> Package Includes:
                    </p>
                    <ul className="space-y-1.5">
                      {(combo.products || combo.items || []).map((p: any) => (
                        <li key={p.id} className="flex items-center gap-2 text-xs text-[#424245] bg-[#fbfbfd] p-2 rounded-xl border border-black/5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                          <span className="font-medium truncate">{p.name || p.product_name || p.custom_label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#86868b] text-center sm:text-left">
                  Nehru Place store pickup available
                </span>

                <a
                  href={getWhatsAppUrl(
                    whatsappNum,
                    `Hello ${businessName}, I am inquiring about the "${combo.name || combo.title}" combo package priced at ${formatPrice(combo.price)}. Can I inspect it at the store?`
                  )}
                  onClick={(e) => { e.preventDefault(); api.trackEnquiry(null, combo.name || combo.title, 'WHATSAPP'); openWhatsApp(whatsappNum, `Hello ${businessName}, I am inquiring about the "${combo.name || combo.title}" combo package priced at ${formatPrice(combo.price)}. Can I inspect it at the store?`); }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full btn-whatsapp-apple text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask About This Build</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-[#86868b] text-sm">
          No combo packages published at this moment. Contact us on WhatsApp for a custom build quote!
        </div>
      )}

    </div>
  );
};

export default Builds;
