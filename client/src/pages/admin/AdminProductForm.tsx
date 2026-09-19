import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Category, ConditionType, StockStatusType } from '../../types';
import { api } from '../../services/api';

export const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<ConditionType>('Like New');
  const [stockStatus, setStockStatus] = useState<StockStatusType>('IN_STOCK');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // Images: list of URLs
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Dynamic Specs: key-value pairs
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  useEffect(() => {
    async function initData() {
      try {
        const catRes = await api.getCategories();
        setCategories(catRes.categories || []);
        if (catRes.categories?.length > 0 && !isEdit) {
          setCategoryId(catRes.categories[0].id);
        }

        if (isEdit && id) {
          const product = await api.getProduct(id);
          setName(product.name);
          setProductCode(product.product_code);
          setCategoryId(product.category_id);
          setBrand(product.brand);
          setModel(product.model || '');
          setPrice(String(product.price));
          setQuantity(product.quantity || 1);
          setCondition(product.condition);
          setStockStatus(product.stock_status);
          setDescription(product.description || '');
          setIsFeatured(Boolean(product.is_featured));
          setIsNewArrival(Boolean(product.is_new_arrival));

          if (product.images && product.images.length > 0) {
            setImages(product.images.map((img) => img.image_url));
          } else if (product.primary_image) {
            setImages([product.primary_image]);
          }

          if (product.specifications && typeof product.specifications === 'object') {
            const specArray = Object.entries(product.specifications).map(([k, v]) => ({ key: k, value: String(v) }));
            setSpecs(specArray.length > 0 ? specArray : [{ key: '', value: '' }]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize form');
      } finally {
        setFetching(false);
      }
    }
    initData();
  }, [id, isEdit]);

  // Apply default spec presets when changing category in "Add" mode
  const applyCategorySpecPreset = (catId: number) => {
    setCategoryId(catId);
    if (isEdit) return;

    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    const slug = cat.slug;
    if (slug.includes('gpu')) {
      setSpecs([
        { key: 'VRAM', value: '8GB GDDR6' },
        { key: 'Interface', value: 'PCIe 4.0 x16' },
        { key: 'Outputs', value: '3x DisplayPort, 1x HDMI' },
        { key: 'Power Connector', value: '1x 8-Pin' },
        { key: 'Recommended PSU', value: '550W' }
      ]);
    } else if (slug.includes('cpu')) {
      setSpecs([
        { key: 'Socket', value: 'AM4' },
        { key: 'Cores / Threads', value: '6 Cores / 12 Threads' },
        { key: 'Base Clock', value: '3.7 GHz' },
        { key: 'Boost Clock', value: '4.6 GHz' },
        { key: 'TDP', value: '65W' }
      ]);
    } else if (slug.includes('ram')) {
      setSpecs([
        { key: 'Capacity', value: '16GB (2x8GB)' },
        { key: 'Type', value: 'DDR4' },
        { key: 'Frequency', value: '3200MHz' },
        { key: 'Timing', value: 'CL16' }
      ]);
    } else if (slug.includes('motherboard')) {
      setSpecs([
        { key: 'Socket', value: 'LGA1700' },
        { key: 'Chipset', value: 'B660 / B760' },
        { key: 'Form Factor', value: 'ATX' },
        { key: 'RAM Slots', value: '4x DDR4' },
        { key: 'M.2 Slots', value: '2x PCIe Gen4' }
      ]);
    } else if (slug.includes('storage')) {
      setSpecs([
        { key: 'Capacity', value: '1TB' },
        { key: 'Interface', value: 'PCIe Gen 4.0 x4 NVMe' },
        { key: 'Health', value: '99% SMART Health' }
      ]);
    } else if (slug.includes('psu')) {
      setSpecs([
        { key: 'Wattage', value: '650W' },
        { key: 'Efficiency', value: '80 PLUS Bronze' },
        { key: 'Modularity', value: 'Semi-Modular' }
      ]);
    }
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const addSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpecRow = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const res = await api.uploadImages(files);
      setImages([...images, ...res.urls]);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !brand.trim() || !price) {
      setError('Please fill out product name, brand, and valid price');
      return;
    }

    setLoading(true);

    const specObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload: any = {
      name: name.trim(),
      product_code: productCode.trim() || undefined,
      category_id: categoryId,
      brand: brand.trim(),
      model: model.trim() || undefined,
      price: Number(price),
      quantity: Number(quantity) || 1,
      condition,
      stock_status: stockStatus,
      description: description.trim(),
      specifications: specObj,
      is_featured: isFeatured ? 1 : 0,
      is_new_arrival: isNewArrival ? 1 : 0,
      images
    };

    try {
      if (isEdit && id) {
        await api.updateProduct(Number(id), payload);
      } else {
        await api.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-[#86868b] text-xs py-20 text-center flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="p-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/8 text-[#1d1d1f] shadow-xs transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
            {isEdit ? 'Edit Product' : 'Add New Hardware Part'}
          </h1>
          <p className="text-xs text-[#86868b]">
            {isEdit ? `Updating ${productCode}` : 'Create a new inventory listing with specifications.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {/* Card 1: Core Details */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] border-b border-black/5 pb-2">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ZOTAC Gaming GeForce RTX 3060 Twin Edge 12GB"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => applyCategorySpecPreset(Number(e.target.value))}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Product Code / ID</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g. GPU-005 (Leave blank to auto-generate)"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Brand *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. ASUS, Intel, AMD, Corsair"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. ROG Strix OC / Alder Lake"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

          </div>
        </div>

        {/* Card 2: Pricing & Stock */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] border-b border-black/5 pb-2">
            2. Pricing, Condition & Stock
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Price (₹ INR) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="18500"
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Hardware Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ConditionType)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              >
                <option value="Like New">Like New (Mint)</option>
                <option value="Excellent">Excellent (Minor signs)</option>
                <option value="Good">Good (Tested fully)</option>
                <option value="Fair">Fair (Working tested)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Stock Status *</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatusType)}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              >
                <option value="IN_STOCK">IN STOCK</option>
                <option value="LOW_STOCK">LOW STOCK</option>
                <option value="SOLD_OUT">SOLD OUT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6e6e73]">Quantity</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
            </div>

          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-black/20 text-[#0071e3] focus:ring-0"
              />
              <span>Featured on Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="w-4 h-4 rounded border-black/20 text-[#0071e3] focus:ring-0"
              />
              <span>Mark as New Arrival</span>
            </label>
          </div>
        </div>

        {/* Card 3: Images */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] border-b border-black/5 pb-2">
            3. Product Images
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/10 border-dashed cursor-pointer text-xs font-semibold text-[#1d1d1f] transition">
              <Upload className="w-4 h-4 text-[#0071e3] shrink-0" />
              <span className="text-center">{uploading ? 'Uploading to Server...' : 'Upload Image Files (JPG/PNG/WEBP)'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-2 flex-1">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste external image URL..."
                className="flex-1 min-w-0 p-2.5 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="py-2.5 px-4 bg-[#1d1d1f] hover:bg-black rounded-xl text-xs font-semibold text-white transition shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* Thumbnails preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-[#fbfbfd] border border-black/8 group p-1 flex items-center justify-center">
                  <img src={img} alt="" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-white text-rose-600 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-[#1d1d1f] text-[9px] font-mono text-white font-bold">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Specifications */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-5">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
              4. Technical Specifications
            </h2>
            <button
              type="button"
              onClick={addSpecRow}
              className="text-xs text-[#0071e3] hover:text-[#0077ed] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec Field
            </button>
          </div>

          <div className="space-y-3">
            {specs.map((s, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-[#fbfbfd] sm:bg-transparent border sm:border-0 border-black/5">
                <input
                  type="text"
                  value={s.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  placeholder="Field (e.g. VRAM, Socket, TDP)"
                  className="w-full sm:w-1/3 p-2 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] font-semibold focus:outline-none focus:border-[#0071e3]"
                />
                <div className="flex items-center gap-2 flex-1 w-full">
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. 12GB GDDR6, AM4, 65W)"
                    className="flex-1 min-w-0 p-2 bg-[#f5f5f7] border border-black/8 rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecRow(idx)}
                    className="p-2 rounded-full text-[#86868b] hover:text-rose-600 transition-colors shrink-0"
                    title="Remove spec"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Description */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-black/8 shadow-apple-card space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
            5. Condition Notes & Benchmark Stress Report
          </h2>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details on physical wear, testing thermal peaks, repasting history, included accessories or box..."
            className="w-full p-3 bg-[#f5f5f7] border border-black/8 rounded-2xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] font-sans"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/products"
            className="w-full sm:w-auto text-center px-6 py-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] font-semibold text-xs transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto text-center px-8 py-2.5 rounded-full btn-apple-primary text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Inventory Item'}
          </button>
        </div>

      </form>

    </div>
  );
};

export default AdminProductForm;
