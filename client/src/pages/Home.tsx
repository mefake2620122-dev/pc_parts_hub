import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MessageSquare,
  Cpu,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Layers,
  Sparkles,
  HardDrive,
  Fan,
  Box,
  Monitor,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Product, Category, Combo, SiteSettings } from '../types';
import { api } from '../services/api';
import ProductCard from '../components/cards/ProductCard';
import StatusBadge from '../components/common/StatusBadge';
import { SEO } from '../components/common/SEO';
import {
  getWhatsAppUrl,
  getDialerUrl,
  generateGeneralWhatsAppMessage,
  generateProductWhatsAppMessage,
  generateComboWhatsAppMessage,
  formatPrice,
  contactConfig
} from '../utils/whatsapp';

interface HomeProps {
  settings?: SiteSettings;
}

export const Home: React.FC<HomeProps> = ({ settings }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mouse parallax state for Hero hardware composition
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const businessName = settings?.business_name || contactConfig.businessName;
  const whatsappNum = settings?.whatsapp || contactConfig.whatsappNumber;
  const phoneNum = settings?.phone || contactConfig.phoneNumber;

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featRes, newRes, catRes, comboRes] = await Promise.all([
          api.getProducts({ featured: 1, limit: 8 }),
          api.getProducts({ new_arrival: 1, limit: 4 }),
          api.getCategories(),
          api.getCombos()
        ]);
        setFeaturedProducts(featRes.products || []);
        setNewArrivals(newRes.products || []);
        setCategories(catRes.categories || []);
        setCombos(comboRes.combos || []);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Parallax mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Category visual mapping with images
  const categoryImages: Record<string, string> = {
    gpu: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    cpu: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=600&q=80',
    motherboard: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ram: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    storage: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    psu: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    cooling: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80',
    cabinet: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    accessories: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  };

  // Flagship items for the editorial launch showcase
  const flagshipProduct = featuredProducts.find((p) => p.category_slug === 'gpu') || featuredProducts[0];
  const secondFlagship = featuredProducts.find((p) => p.category_slug === 'cpu' || p.category_slug === 'motherboard') || featuredProducts[1];

  return (
    <div className="space-y-24 sm:space-y-32 pb-28 sm:pb-20 bg-[#ffffff]">
      <SEO
        title="Power Your Next Build — Quality Pre-Owned PC Hardware"
        description={`Explore premium pre-owned and stress-tested PC components at ${businessName}. Live graphics cards, processors, motherboards, RAM, storage, and custom build combos.`}
        keywords={`PC hardware, pre-owned GPU, used graphics card, refurbished PC parts, gaming PC build, ${businessName}`}
        siteName={businessName}
      />
      
      {/* 1. CINEMATIC HARDWARE HERO SECTION */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden border-b border-black/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#fafafc] via-[#ffffff] to-[#ffffff]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Apple Editorial Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f5f5f7] border border-black/5 text-xs font-semibold tracking-widest text-[#86868b] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>{settings?.hero_badge || businessName}</span>
              </div>

              {/* Headlines */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold text-[#1d1d1f] tracking-tight leading-[1.08]">
                  {settings?.hero_title || 'Power Your Next Build.'}
                </h1>
                <p className="text-lg sm:text-2xl font-medium text-[#424245] leading-snug">
                  {settings?.hero_subtitle || 'Quality pre-owned PC hardware, ready for your next setup.'}
                </p>
              </div>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base text-[#86868b] max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {settings?.hero_desc || `Explore available components, compare specifications and connect directly with ${businessName} for live stock confirmation and store pickup.`}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/parts"
                  className="w-full sm:w-auto px-7 py-3.5 btn-apple-primary flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
                >
                  <span>Explore Parts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackEnquiry(null, 'Hero WhatsApp', 'WHATSAPP')}
                  aria-label={`Chat on WhatsApp with ${businessName}`}
                  className="w-full sm:w-auto px-7 py-3.5 btn-whatsapp-apple flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Us</span>
                </a>
              </div>

              {/* Micro specs indicator */}
              <div className="pt-3 flex items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-[#86868b] flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {settings?.address ? (settings.address.split(',')[1]?.trim() || settings.address.split(',')[0]?.trim() || 'Verified Store') : 'Verified Store'}
                </span>
                <span>•</span>
                <span>Stress-Tested Hardware</span>
                <span>•</span>
                <span>Same-Day Availability</span>
              </div>
            </div>

            {/* Right Column: Studio Hardware Composition with Floating Spec Chips & Subtle Parallax */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Studio Backdrop Plate */}
              <div 
                className="relative w-full max-w-[460px] aspect-[4/3] sm:aspect-square bg-gradient-to-b from-[#fbfbfd] to-[#f5f5f7] rounded-3xl border border-black/5 p-4 sm:p-6 flex items-center justify-center shadow-apple-floating transition-transform duration-300 ease-out overflow-hidden sm:overflow-visible"
                style={{
                  transform: `perspective(1000px) rotateY(${mousePos.x * 6}deg) rotateX(${-mousePos.y * 6}deg)`
                }}
              >
                {/* Foreground Primary Hardware Image */}
                <img
                  src={settings?.hero_image || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80"}
                  alt={settings?.hero_title || "Flagship Hardware"}
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.15)] select-none transition-transform duration-500 hover:scale-105"
                />

                {/* Floating Apple-Style Spec Chip 1 (Top Left) */}
                <div 
                  className="absolute top-2 left-2 sm:top-6 sm:left-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-black/8 shadow-apple-card text-[11px] sm:text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition-transform duration-200"
                  style={{
                    transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -12}px)`
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                  <span>{settings?.hero_chip1_tag || 'RTX SERIES'}</span>
                </div>

                {/* Floating Apple-Style Spec Chip 2 (Top Right) */}
                <div 
                  className="absolute top-2 right-2 sm:top-6 sm:right-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-black/8 shadow-apple-card text-[11px] sm:text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition-transform duration-200"
                  style={{
                    transform: `translate(${mousePos.x * 14}px, ${mousePos.y * -14}px)`
                  }}
                >
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#86868b]">{settings?.hero_chip2_label || 'VRAM'}</span>
                  <span>{settings?.hero_chip2_val || '12GB GDDR6'}</span>
                </div>

                {/* Floating Apple-Style Spec Chip 3 (Bottom Left) */}
                <div 
                  className="absolute bottom-2 left-2 sm:bottom-6 sm:left-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-black/8 shadow-apple-card text-[11px] sm:text-xs font-semibold text-emerald-700 flex items-center gap-1.5 transition-transform duration-200"
                  style={{
                    transform: `translate(${mousePos.x * -15}px, ${mousePos.y * 15}px)`
                  }}
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                  <span>{settings?.hero_chip3_text || 'STRESS TESTED'}</span>
                </div>

                {/* Floating Apple-Style Spec Chip 4 (Bottom Right) */}
                <div 
                  className="absolute bottom-2 right-2 sm:bottom-6 sm:right-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-black/8 shadow-apple-card text-[11px] sm:text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition-transform duration-200"
                  style={{
                    transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{settings?.hero_chip4_text || 'IN STOCK'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST / VALUE STRIP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 sm:p-8 rounded-3xl bg-[#f5f5f7] border border-black/5">
          {[
            {
              title: settings?.trust_card_1_title || 'LARGE INVENTORY',
              desc: settings?.trust_card_1_desc || 'Browse over 100+ stress-tested parts in active rotation.',
              icon: Layers,
            },
            {
              title: settings?.trust_card_2_title || 'REAL HARDWARE',
              desc: settings?.trust_card_2_desc || '100% genuine components with verified stress benchmarks.',
              icon: ShieldCheck,
            },
            {
              title: settings?.trust_card_3_title || 'CLEAR SPECS',
              desc: settings?.trust_card_3_desc || 'Transparent condition photos and exact technical ratings.',
              icon: CheckCircle2,
            },
            {
              title: settings?.trust_card_4_title || 'DIRECT WHATSAPP',
              desc: settings?.trust_card_4_desc || 'Fast technician response and seamless in-store pickup.',
              icon: MessageSquare,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex flex-col space-y-2">
                <div className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#0071e3] shadow-xs mb-1">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1d1d1f] tracking-wider uppercase">
                  {item.title}
                </h4>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED INVENTORY ("Explore Our Parts") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#0071e3] tracking-wider uppercase">
              Current Inventory
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mt-1">
              Explore Our Parts.
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Find the hardware your build needs with verified condition and live pricing.
            </p>
          </div>
          <Link
            to="/parts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0071e3] hover:text-[#0077ed] transition"
          >
            <span>View All Parts</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-[#86868b]">Loading hardware inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} />
            ))}
          </div>
        )}
      </section>

      {/* 4. HARDWARE CATEGORIES ("Find Your Hardware") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-semibold text-[#0071e3] tracking-wider uppercase">
            Categories
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            Find Your Hardware.
          </h2>
          <p className="text-sm text-[#86868b]">
            Browse components by category to build or upgrade your custom PC setup.
          </p>
        </div>

        {/* Category Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Graphics Cards', slug: 'gpu', icon: Zap, sub: 'RTX & Radeon' },
            { name: 'Processors', slug: 'cpu', icon: Cpu, sub: 'Intel & Ryzen' },
            { name: 'Motherboards', slug: 'motherboard', icon: Layers, sub: 'ATX & ITX' },
            { name: 'Memory (RAM)', slug: 'ram', icon: HardDrive, sub: 'DDR4 & DDR5' },
            { name: 'Storage', slug: 'storage', icon: HardDrive, sub: 'NVMe Gen4 SSDs' },
            { name: 'Power Supplies', slug: 'psu', icon: Zap, sub: '80+ Bronze/Gold' },
            { name: 'Cooling & AIOs', slug: 'cooling', icon: Fan, sub: 'Air & Liquid' },
            { name: 'Cases & Cabinets', slug: 'cabinet', icon: Box, sub: 'Airflow & Glass' },
            { name: 'Monitors', slug: 'monitor', icon: Monitor, sub: 'High Refresh Rate' },
            { name: 'Accessories', slug: 'accessories', icon: Sparkles, sub: 'Keyboards & Cables' },
          ].map((cat) => {
            const Icon = cat.icon;
            const imgSrc = categoryImages[cat.slug] || categoryImages.gpu;
            return (
              <Link
                key={cat.slug}
                to={`/parts?category=${cat.slug}`}
                className="group relative bg-[#fbfbfd] hover:bg-white rounded-2xl border border-black/5 hover:border-black/10 p-5 flex flex-col justify-between h-48 shadow-xs hover:shadow-apple-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Background image preview */}
                <div className="absolute right-[-15%] bottom-[-15%] w-28 h-28 opacity-15 group-hover:opacity-35 transition-opacity pointer-events-none">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>

                <div className="space-y-1 z-10">
                  <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center text-[#0071e3] shadow-2xs mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    {cat.sub}
                  </p>
                </div>

                <div className="z-10 flex items-center gap-1 text-xs font-semibold text-[#0071e3] group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. FEATURED PRODUCT EDITORIAL SHOWCASE (Apple Keynote Style Split Layout) */}
      {flagshipProduct && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#f5f5f7] border border-black/5 p-8 sm:p-12 lg:p-16 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Side: Large isolated product photo */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <div className="w-full max-w-md aspect-[4/3] bg-white rounded-2xl p-6 border border-black/5 shadow-apple-card flex items-center justify-center">
                  <img
                    src={flagshipProduct.primary_image}
                    alt={flagshipProduct.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Right Side: Editorial Launch Info */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wider text-[#0071e3] uppercase">
                    Featured Flagship Hardware
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
                    {flagshipProduct.name}
                  </h2>
                  <p className="text-sm text-[#86868b] leading-relaxed">
                    {flagshipProduct.description}
                  </p>
                </div>

                {/* Specs Highlights */}
                {flagshipProduct.specifications && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-white/70 rounded-2xl border border-black/5 text-xs">
                    {Object.entries(flagshipProduct.specifications)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-[#86868b] block text-[11px] font-medium">{key}</span>
                          <span className="font-semibold text-[#1d1d1f] font-mono">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Price & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div>
                    <span className="text-xs text-[#86868b] block">Verified Hardware Price</span>
                    <span className="text-3xl font-extrabold text-[#1d1d1f]">
                      {formatPrice(flagshipProduct.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/parts/${flagshipProduct.slug}`}
                      className="px-5 py-2.5 rounded-full bg-white hover:bg-[#fafafc] border border-black/10 text-xs font-semibold text-[#1d1d1f] transition shadow-xs"
                    >
                      View Part
                    </Link>

                    <a
                      href={getWhatsAppUrl(
                        whatsappNum,
                        generateProductWhatsAppMessage(flagshipProduct, businessName)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => api.trackEnquiry(flagshipProduct.id, flagshipProduct.name, 'WHATSAPP')}
                      aria-label={`Enquire about ${flagshipProduct.name} on WhatsApp`}
                      className="px-5 py-2.5 rounded-full btn-whatsapp-apple text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Enquire</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. JUST ARRIVED ("Fresh Additions to the Inventory") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#0071e3] tracking-wider uppercase">
              Fresh Inventory
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mt-1">
              Just Arrived.
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Newly tested components added to our inventory this week.
            </p>
          </div>
          <Link
            to="/new-arrivals"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0071e3] hover:text-[#0077ed] transition"
          >
            <span>View All New Arrivals</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {newArrivals.slice(0, 4).map((product) => (
            <div key={product.id} className="relative">
              {/* Floating NEW badge */}
              <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                NEW
              </div>
              <ProductCard product={product} settings={settings} />
            </div>
          ))}
        </div>
      </section>

      {/* 7. BUILD / COMBO SHOWCASE ("Build Something Better") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-semibold text-[#0071e3] tracking-wider uppercase">
            Curated Setups
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            Build Something Better.
          </h2>
          <p className="text-sm text-[#86868b]">
            Hand-picked combinations tested together for bottleneck-free performance and superior value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-3xl border border-black/8 p-6 sm:p-8 shadow-apple-card hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Combo Image */}
                <div className="aspect-[16/9] rounded-2xl bg-[#fbfbfd] border border-black/5 overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={combo.image_url || combo.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'}
                    alt={combo.name || combo.title}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Combo Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#f0f6ff] text-[#0071e3] text-xs font-semibold">
                      Tested Combo Pack
                    </span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Ready to Build
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#1d1d1f]">
                    {combo.name || combo.title}
                  </h3>
                  <p className="text-xs text-[#86868b] leading-relaxed">
                    {combo.description}
                  </p>
                </div>

                {/* Included Components List */}
                {((combo.products && combo.products.length > 0) || (combo.items && combo.items.length > 0)) && (
                  <div className="space-y-2 pt-2 border-t border-black/5">
                    <span className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider block">
                      Included Hardware:
                    </span>
                    <div className="space-y-1.5">
                      {(combo.products || combo.items || []).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-[#424245]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                          <span className="truncate">{p.name || p.product_name || p.custom_label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & CTA */}
              <div className="pt-6 mt-6 border-t border-black/5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-[#86868b] block font-medium">Bundle Price</span>
                  <span className="text-2xl font-bold text-[#1d1d1f]">
                    {formatPrice(combo.price)}
                  </span>
                </div>

                <a
                  href={getWhatsAppUrl(
                    whatsappNum,
                    generateComboWhatsAppMessage(combo, businessName)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.trackEnquiry(null, combo.name || combo.title, 'WHATSAPP')}
                  aria-label={`Enquire about ${combo.title || combo.name} bundle on WhatsApp`}
                  className="px-5 py-2.5 rounded-full btn-whatsapp-apple text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask About This Build</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* 8. WHY PC PART HUB ("Built Around Real Inventory") */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-semibold text-[#0071e3] tracking-wider uppercase">
            Store Standards
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            Built Around Real Inventory.
          </h2>
          <p className="text-sm text-[#86868b]">
            No drop-shipping. No unverified third-party listings. Every component is physically tested in our store.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'LARGE INVENTORY',
              desc: 'Browse available components from current stock with real-time updates.',
              num: '01'
            },
            {
              title: 'CLEAR CONDITION',
              desc: 'See transparent condition ratings and detailed specifications before enquiring.',
              num: '02'
            },
            {
              title: 'DIRECT CONTACT',
              desc: `Talk directly to ${businessName} through WhatsApp or phone without intermediaries.`,
              num: '03'
            },
            {
              title: 'FLEXIBLE BUILDS',
              desc: 'Explore individual components or curated combinations tailored to your setup.',
              num: '04'
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-[#fbfbfd] rounded-2xl border border-black/5 p-6 space-y-4 hover:shadow-apple-card transition-all"
            >
              <span className="text-xs font-mono font-bold text-[#0071e3]">
                {card.num}
              </span>
              <h3 className="text-sm font-bold text-[#1d1d1f] tracking-wider uppercase">
                {card.title}
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. CINEMATIC HARDWARE IMAGE INTERLUDE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-black text-white aspect-[21/9] sm:aspect-[24/9] flex items-center justify-center p-8 text-center shadow-apple-floating">
          {/* Macro Hardware Background */}
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
            alt="Hardware macro PCB silicon"
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter contrast-125"
          />

          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <p className="text-xl sm:text-3xl font-light tracking-wide text-white/90">
              "Every component has a story."
            </p>
            <p className="text-sm sm:text-base font-normal text-slate-300">
              Find the right one for your next build.
            </p>
            <div className="pt-2">
              <Link
                to="/parts"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#1d1d1f] text-xs font-semibold hover:bg-[#f5f5f7] transition"
              >
                <span>Browse Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. WHATSAPP DIRECT CONVERSION CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#f5f5f7] border border-black/8 p-8 sm:p-12 text-center space-y-6 shadow-apple-card">
          <div className="w-12 h-12 rounded-full bg-white border border-black/5 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight">
              Have a Specific Part in Mind?
            </h2>
            <p className="text-sm text-[#86868b] leading-relaxed">
              Connect directly with our {businessName} store team on WhatsApp. Get live stock confirmation, custom photos, or build guidance in minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={getWhatsAppUrl(whatsappNum, generateGeneralWhatsAppMessage(businessName))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => api.trackEnquiry(null, 'Home Bottom CTA WhatsApp', 'WHATSAPP')}
              aria-label={`Chat on WhatsApp with ${businessName}`}
              className="w-full sm:w-auto px-7 py-3.5 btn-whatsapp-apple flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Enquire</span>
            </a>

            <a
              href={getDialerUrl(phoneNum)}
              onClick={() => api.trackEnquiry(null, 'Home Bottom CTA Call', 'CALL')}
              aria-label={`Call ${businessName} at ${phoneNum}`}
              className="w-full sm:w-auto px-7 py-3.5 btn-apple-secondary flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
            >
              <Phone className="w-4 h-4 text-[#0071e3]" />
              <span>Call {phoneNum}</span>
            </a>
          </div>

          <p className="text-xs text-[#86868b] pt-1">
            {settings?.address ? `${settings.address} • ${settings.opening_hours || 'Open Mon – Sat'}` : (settings?.opening_hours || 'Store pickup & testing available')}
          </p>
        </div>
      </section>

    </div>
  );
};

export default Home;
