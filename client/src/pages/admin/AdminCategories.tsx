import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../../types';
import { api } from '../../services/api';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const fetchCats = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSortOrder(categories.length + 1);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setSortOrder(cat.sort_order || 0);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.updateCategory(editingId, { name, description, sort_order: sortOrder });
        setSuccess('Category updated');
      } else {
        await api.createCategory({ name, description, sort_order: sortOrder });
        setSuccess('Category created');
      }
      setShowModal(false);
      fetchCats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setError('');
    try {
      await api.deleteCategory(cat.id);
      setSuccess('Category deleted');
      fetchCats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Hardware Categories</h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Organize catalog filters and homepage category showcase tiles.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="self-start sm:self-auto px-4 py-2 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-black/8 overflow-hidden shadow-apple-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-xs text-left">
            <thead>
              <tr className="border-b border-black/5 bg-[#f5f5f7] uppercase font-mono text-[10px] text-[#86868b]">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Inventory Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#fafafc] transition-colors">
                  <td className="py-3 px-4 font-mono text-[#86868b] whitespace-nowrap">{cat.sort_order}</td>
                  <td className="py-3 px-4 font-semibold text-[#1d1d1f] whitespace-nowrap">{cat.name}</td>
                  <td className="py-3 px-4 font-mono text-[#0071e3] whitespace-nowrap">{cat.slug}</td>
                  <td className="py-3 px-4 text-[#86868b] max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-mono text-[11px] font-semibold">
                      {cat.total_products || 0} parts ({cat.in_stock_count || 0} in stock)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] transition"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-[#86868b] hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 sm:p-8 border border-black/8 shadow-apple-floating space-y-4">
            <h3 className="text-lg font-bold text-[#1d1d1f]">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Graphics Cards (GPU)"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. High performance gaming graphics cards"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full btn-apple-primary text-xs font-semibold shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;
