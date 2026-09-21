import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, RotateCcw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, Category, SiteSettings } from '../types';
import { api } from '../services/api';
import ProductCard from '../components/cards/ProductCard';
import { SEO } from '../components/common/SEO';

interface PartsProps {
  settings?: SiteSettings;
}

export const Parts: React.FC<PartsProps> = ({ settings }) => {
  const businessName = settings?.business_name || 'PC PART HUB';
  const address = settings?.address || '';
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const brandParam = searchParams.get('brand') || 'all';
  const conditionParam = searchParams.get('condition') || 'all';
  const stockParam = searchParams.get('stock') || 'all';
  const sortParam = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Local search input for smooth typing
  const [searchInput, setSearchInput] = useState(queryParam);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Load filter options & categories once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, filterRes] = await Promise.all([
          api.getCategories(),
          api.getFilters()
        ]);
        setCategories(catRes.categories || []);
        setAvailableBrands(filterRes.brands || []);
        setAvailableConditions(filterRes.conditions || []);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch products whenever params change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await api.getProducts({
          q: queryParam,
          category: categoryParam,
          brand: brandParam,
          condition: conditionParam,
          stock_status: stockParam,
          min_price: minPriceParam,
          max_price: maxPriceParam,
          sort: sortParam,
          limit: 100
        });
        setProducts(res.products || []);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [queryParam, categoryParam, brandParam, conditionParam, stockParam, minPriceParam, maxPriceParam, sortParam]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchInput);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    queryParam ||
    (categoryParam && categoryParam !== 'all') ||
    (brandParam && brandParam !== 'all') ||
    (conditionParam && conditionParam !== 'all') ||
    (stockParam && stockParam !== 'all') ||
    minPriceParam ||
    maxPriceParam
  );

  const activeCatName = categories.find((c) => c.slug === categoryParam)?.name;
  const pageTitle = activeCatName
    ? `${activeCatName} — Pre-Owned PC Hardware`
    : 'PC Parts Inventory — Graphics Cards, CPUs, RAM & Motherboards';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pb-20 space-y-8 bg-white">
      <SEO
        title={pageTitle}
        description={`Filter and search available pre-owned PC parts at ${businessName}${address ? ', ' + address.split(',').slice(0,2).join(',') : ''}. Genuine GPUs, CPUs, motherboards, RAM, PSUs with live stock ratings.`}
        keywords={`PC components catalog, buy used GPU, RTX second hand, pre-owned processor, DDR4 RAM, ${businessName}`}
        siteName={businessName}
      />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
            Inventory Catalog
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight mt-1">
            PC Parts
          </h1>
          <p className="text-sm text-[#86868b] mt-1.5 max-w-xl">
            Explore currently available hardware. Filter by category, verify condition ratings, and enquire directly on WhatsApp.
          </p>
        </div>

        {/* Mobile Filter Toggle & Quick Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#86868b] font-mono">
            Showing <strong className="text-[#1d1d1f] font-semibold">{products.length}</strong> part(s)
          </span>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f5f5f7] border border-black/8 text-xs font-semibold text-[#1d1d1f]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Filters {hasActiveFilters ? '• Active' : ''}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 items-start">
        
        {/* Desktop Left Filter Sidebar in White Glass */}
        <aside className="hidden md:block md:col-span-1 lg:col-span-1 space-y-6 bg-[#fbfbfd] p-5 rounded-3xl border border-black/8 shadow-xs sticky top-24">
          
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Filters</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-[#0071e3] hover:text-[#0077ed] font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] block">Category</label>
            <select
              value={categoryParam}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full py-2 px-3 bg-white border border-black/10 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] shadow-xs"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} ({c.total_products || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Availability */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6e6e73] block">Availability</label>
            <select
              value={stockParam}
              onChange={(e) => updateFilter('stock', e.target.value)}
              className="w-full py-2 px-3 bg-white border border-black/10 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] shadow-xs"
            >
              <option value="all">All Items</option>
              <option value="IN_STOCK">In Stock (Available)</option>
              <option value="LOW_STOCK">Low Stock (1-2 Left)</option>
              <option value="SOLD_OUT">Sold Out</option>
            </select>
          </div>

          {/* Condition Filter */}
          {availableConditions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73] block">Condition</label>
              <select
                value={conditionParam}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full py-2 px-3 bg-white border border-black/10 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] shadow-xs"
              >
                <option value="all">Any Condition</option>
                {availableConditions.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          )}

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73] block">Brand</label>
              <select
                value={brandParam}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full py-2 px-3 bg-white border border-black/10 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] shadow-xs"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range Filter */}
          <div className="space-y-2 pt-2 border-t border-black/5">
            <label className="text-xs font-semibold text-[#6e6e73] block">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPriceParam}
                onChange={(e) => updateFilter('min_price', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-white border border-black/10 rounded-lg text-xs text-[#1d1d1f] shadow-xs"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPriceParam}
                onChange={(e) => updateFilter('max_price', e.target.value)}
                className="w-full py-1.5 px-2.5 bg-white border border-black/10 rounded-lg text-xs text-[#1d1d1f] shadow-xs"
              />
            </div>
          </div>

        </aside>

        {/* Right Product Grid Area */}
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
          
          {/* Top Search & Sorting Bar */}
          <div className="bg-[#f5f5f7] p-3 rounded-2xl border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search RTX 3060, Ryzen 5, DDR4, B550, 1TB..."
                className="w-full pl-10 pr-10 py-2 bg-white border border-black/10 rounded-full text-xs sm:text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] shadow-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilter('q', '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#86868b]" />
              <span className="text-xs text-[#86868b] whitespace-nowrap">Sort:</span>
              <select
                value={sortParam}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="py-1.5 px-3 bg-white border border-black/10 rounded-full text-xs font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] shadow-xs"
              >
                <option value="newest">Newest Added</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name A – Z</option>
              </select>
            </div>

          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#86868b]">Active filters:</span>
              {queryParam && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#0071e3] text-xs font-medium">
                  "{queryParam}"
                  <button onClick={() => updateFilter('q', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {categoryParam !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#0071e3] text-xs font-medium">
                  Category: {categoryParam}
                  <button onClick={() => updateFilter('category', 'all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {conditionParam !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#0071e3] text-xs font-medium">
                  Condition: {conditionParam}
                  <button onClick={() => updateFilter('condition', 'all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {stockParam !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#0071e3] text-xs font-medium">
                  Status: {stockParam}
                  <button onClick={() => updateFilter('stock', 'all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#86868b] hover:text-[#1d1d1f] underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          {loading ? (
            <div className="py-24 text-center text-[#86868b] text-xs flex flex-col items-center justify-center">
              <div className="w-7 h-7 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
              <span>Fetching catalog items...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} settings={settings} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl bg-[#f5f5f7] p-8 sm:p-14 text-center border border-black/5 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-white border border-black/5 flex items-center justify-center text-[#86868b] shadow-xs">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">No matching parts found.</h3>
              <p className="text-xs sm:text-sm text-[#86868b]">
                Try another model, category or specification, or reset your active filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs tracking-wide transition shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Filters Drawer / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white border-t border-black/10 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0071e3]" /> Filter Inventory
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-[#86868b] hover:text-[#1d1d1f]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Category</label>
              <select
                value={categoryParam}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Mobile Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Stock Availability</label>
              <select
                value={stockParam}
                onChange={(e) => updateFilter('stock', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f]"
              >
                <option value="all">All Items</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="SOLD_OUT">Sold Out</option>
              </select>
            </div>

            {/* Mobile Condition */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Condition</label>
              <select
                value={conditionParam}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f]"
              >
                <option value="all">Any Condition</option>
                {availableConditions.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-black/5 flex items-center gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 rounded-full bg-[#f5f5f7] text-[#6e6e73] font-semibold text-xs"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-full btn-apple-primary text-white font-semibold text-xs"
              >
                View {products.length} Parts
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Parts;
