import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Trash2, Edit, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Combo } from '../../types';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/whatsapp';

export const AdminCombos: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [items, setItems] = useState<string[]>(['']);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const res = await api.uploadImages([file]);
      if (res.urls && res.urls[0]) {
        setImageUrl(res.urls[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload combo image');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchCombos = async () => {
    try {
      const res = await api.getCombos();
      setCombos(res.combos || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80');
    setItems(['']);
    setShowModal(true);
  };

  const openEdit = (combo: Combo) => {
    setEditingId(combo.id);
    setName(combo.name || combo.title || '');
    setDescription(combo.description || '');
    setPrice(String(combo.price));
    setImageUrl(combo.image_url || combo.image || '');
    setItems(
      combo.products && combo.products.length > 0
        ? combo.products.map((p: any) => p.name || p.custom_label || '')
        : ['']
    );
    setShowModal(true);
  };

  const handleItemChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = val;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, '']);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image_url: imageUrl.trim()
    };

    try {
      if (editingId) {
        await api.updateCombo(editingId, payload);
        setSuccess('Combo bundle updated');
      } else {
        await api.createCombo(payload);
        setSuccess('Combo bundle created');
      }
      setShowModal(false);
      fetchCombos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save combo');
    }
  };

  const handleDelete = async (id: number, comboName: string) => {
    if (!confirm(`Delete combo "${comboName}"?`)) return;
    try {
      await api.deleteCombo(id);
      setSuccess('Combo deleted');
      fetchCombos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete combo');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">PC Builds & Combos</h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Create balanced component bundles for customers looking for complete setups.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="self-start sm:self-auto px-4 py-2 rounded-full btn-apple-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Combo</span>
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

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {combos.map((combo) => (
          <div key={combo.id} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f0f6ff] text-[#0071e3] font-semibold">
                  Tested Combo
                </span>
                <span className="text-xl font-bold text-[#1d1d1f]">
                  {formatPrice(combo.price)}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#1d1d1f]">{combo.name || combo.title}</h3>
              <p className="text-xs text-[#6e6e73] leading-relaxed line-clamp-2">{combo.description}</p>

              {combo.products && combo.products.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-black/5">
                  <p className="text-[11px] font-bold text-[#1d1d1f] uppercase tracking-wider">Included Hardware:</p>
                  <ul className="space-y-1 text-xs text-[#424245]">
                    {combo.products.map((it: any) => (
                      <li key={it.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                        <span className="truncate">{it.name || it.custom_label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5">
              <button
                onClick={() => openEdit(combo)}
                className="px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs text-[#1d1d1f] font-medium flex items-center gap-1.5 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(combo.id, combo.name || combo.title)}
                className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-xs text-rose-600 font-medium flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-lg w-full rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 border border-black/8 shadow-apple-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1d1d1f]">
              {editingId ? 'Edit Combo Bundle' : 'Create New Combo'}
            </h3>

            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Combo Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Budget 1080p Esports Combo"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="24500"
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#6e6e73]">Combo Showcase Image</label>
                  <label className="text-xs text-[#0071e3] hover:underline font-semibold cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <div className="w-12 h-12 rounded-lg bg-[#f5f5f7] border border-black/5 p-1 shrink-0 overflow-hidden">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or click Upload Image above"
                    className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs font-mono text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6e6e73]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the performance target, resolution (1080p/1440p) and games tested..."
                  className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
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
                  className="px-6 py-2 rounded-full btn-apple-primary text-xs font-semibold shadow-xs"
                >
                  Save Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCombos;
