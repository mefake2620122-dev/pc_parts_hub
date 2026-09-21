import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Cpu, HardDrive, Layers, Zap, ExternalLink } from 'lucide-react';
import { productService } from '../../services/api';
import { Product } from '../../types';
import StatusBadge from './StatusBadge';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [searchError, setSearchError] = useState(false);

  // Live search debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(false);
      try {
        const res = await productService.getAll({ q: query.trim(), limit: 8 });
        setResults(res.products || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        setSearchError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation (ESC to close, Up/Down arrows to select, Enter to open)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].slug);
      } else if (query.trim()) {
        navigate(`/parts?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  const handleSelect = (slug: string) => {
    navigate(`/parts/${slug}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 spotlight-overlay"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-2xl border border-black/10 shadow-2xl overflow-hidden transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Spotlight Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/5 gap-3">
          <Search className="w-5 h-5 text-[#86868b] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CPU, GPU, RAM, Motherboard, Storage..."
            className="w-full bg-transparent text-lg text-[#1d1d1f] placeholder-[#86868b] focus:outline-none font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-[#86868b] bg-[#f5f5f7] border border-black/5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Quick category filters when query is empty */}
        {!query && (
          <div className="p-4">
            <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 px-2">
              Popular Categories
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Graphics Cards', slug: 'gpu', icon: Zap },
                { name: 'Processors', slug: 'cpu', icon: Cpu },
                { name: 'Motherboards', slug: 'motherboard', icon: Layers },
                { name: 'Memory (RAM)', slug: 'ram', icon: HardDrive },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      navigate(`/parts?category=${cat.slug}`);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#f5f5f7] text-[#1d1d1f] text-sm text-left transition border border-transparent hover:border-black/5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#f0f6ff] text-[#0071e3] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-[#86868b] px-2">
              <span>Type part name, brand, model or socket</span>
              <span>Press <strong className="font-semibold text-[#1d1d1f]">Enter</strong> to search all</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-[#86868b]">Searching live hardware inventory...</p>
          </div>
        )}

        {/* Results List */}
        {!loading && query && results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-black/5">
            {results.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleSelect(product.slug)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition ${
                  index === selectedIndex ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafc]'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="w-12 h-12 bg-white rounded-lg border border-black/5 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold tracking-wider text-[#0071e3] uppercase">
                      {product.category_name || product.brand}
                    </span>
                    <span className="text-xs text-[#86868b]">•</span>
                    <span className="text-xs text-[#86868b]">{product.condition}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f] truncate">
                    {product.name}
                  </h4>
                </div>

                {/* Price & Stock */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-[#1d1d1f]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs">
                    <StatusBadge stock={product.stock_status} size="sm" />
                  </div>
                </div>

                <ArrowRight className={`w-4 h-4 text-[#86868b] transition ${index === selectedIndex ? 'translate-x-1 text-[#0071e3]' : ''}`} />
              </div>
            ))}

            {/* View all results button */}
            <div className="p-2 pt-3">
              <button
                onClick={() => {
                  navigate(`/parts?q=${encodeURIComponent(query.trim())}`);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-xl text-xs font-semibold text-[#1d1d1f] flex items-center justify-center gap-2 transition"
              >
                <span>View all results for "{query}"</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && query && searchError && (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-semibold text-rose-600 mb-1">Unable to connect to inventory</p>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto">
              We couldn't connect to the backend server. Please verify your connection or chat directly with our store team on WhatsApp.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && query && !searchError && results.length === 0 && (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-semibold text-[#1d1d1f] mb-1">No hardware found</p>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto">
              We couldn't find any component matching "{query}". Try searching by category (GPU, Ryzen, DDR4) or contact us directly on WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
