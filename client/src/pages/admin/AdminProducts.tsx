import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/whatsapp';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({
          q: search,
          category: categoryFilter,
          stock_status: stockFilter,
          limit: 100
        }),
        api.getCategories()
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, stockFilter]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleStockChange = async (id: number, nextStatus: string) => {
    try {
      await api.updateStock(id, nextStatus);
      showToast('Stock status updated');
      fetchProducts();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await api.duplicateProduct(id);
      showToast(`Product duplicated (New Code: ${res.product_code})`);
      fetchProducts();
    } catch (err) {
      alert('Failed to duplicate product');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast('Product deleted');
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-white border border-black/10 text-[#1d1d1f] text-xs font-semibold shadow-apple-floating flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Manage Inventory</h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Total {products.length} products in inventory catalogue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/products/new"
            className="px-4 py-2 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>

          <Link
            to="/admin/import"
            className="px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/10 text-[#1d1d1f] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Import CSV</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-black/8 shadow-apple-card flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, code, or specs..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5f5f7] border border-black/8 rounded-full text-xs sm:text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-[#f5f5f7] border border-black/8 rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] flex-1 md:flex-initial"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="py-2 px-3 bg-[#f5f5f7] border border-black/8 rounded-full text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] flex-1 md:flex-initial"
          >
            <option value="all">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="SOLD_OUT">Sold Out</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-black/8 overflow-hidden shadow-apple-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs text-left">
            <thead>
              <tr className="border-b border-black/5 bg-[#f5f5f7] uppercase font-mono text-[10px] text-[#86868b]">
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-[#86868b] font-mono">
                    Loading inventory table...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafafc] transition-colors">
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#fbfbfd] border border-black/5 shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={p.primary_image || 'https://placehold.co/100x100/f5f5f7/1d1d1f?text=PC'}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-2.5 px-4 font-mono text-[#86868b] font-medium whitespace-nowrap">
                      {p.product_code}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 max-w-xs font-semibold text-[#1d1d1f]">
                      <Link to={`/parts/${p.slug}`} target="_blank" className="hover:text-[#0071e3] inline-flex items-center gap-1 transition">
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-4 text-[#86868b] whitespace-nowrap">
                      {p.category_name}
                    </td>

                    {/* Condition */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5f5f7] border border-black/5 text-[#424245]">
                        {p.condition}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-4 font-bold text-[#1d1d1f] whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>

                    {/* Stock Status Selector */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <select
                        value={p.stock_status}
                        onChange={(e) => handleStockChange(p.id, e.target.value)}
                        className={`text-[10px] font-semibold py-1 px-2.5 rounded-full border focus:outline-none transition ${
                          p.stock_status === 'IN_STOCK'
                            ? 'bg-[#f0fdf4] text-emerald-800 border-emerald-200'
                            : p.stock_status === 'LOW_STOCK'
                            ? 'bg-[#fefce8] text-amber-800 border-amber-200'
                            : 'bg-[#f5f5f7] text-[#86868b] border-black/10'
                        }`}
                      >
                        <option value="IN_STOCK">IN STOCK</option>
                        <option value="LOW_STOCK">LOW STOCK</option>
                        <option value="SOLD_OUT">SOLD OUT</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#0071e3] transition"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-[#86868b] hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-[#86868b] font-mono">
                    No products matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default AdminProducts;
