import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Phone,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/whatsapp';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboardMetrics();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickStockToggle = async (productId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'IN_STOCK' ? 'SOLD_OUT' : 'IN_STOCK';
    try {
      await api.updateStock(productId, nextStatus);
      fetchDashboard();
    } catch (err) {
      alert('Failed to update stock status');
    }
  };

  if (loading) {
    return (
      <div className="text-[#86868b] text-xs py-20 text-center flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading dashboard metrics...</span>
      </div>
    );
  }

  const m = data?.metrics || {};

  const statCards = [
    { label: 'Total Products', value: m.totalProducts || 0, icon: Package, color: 'text-[#0071e3]', bg: 'bg-[#f0f6ff]' },
    { label: 'In Stock', value: m.inStock || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-[#f0fdf4]' },
    { label: 'Low Stock', value: m.lowStock || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-[#fefce8]' },
    { label: 'Sold Out', value: m.soldOut || 0, icon: XCircle, color: 'text-[#86868b]', bg: 'bg-[#f5f5f7]' },
    { label: 'WhatsApp Clicks', value: m.whatsappClicks || 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-[#f0fdf4]' },
    { label: 'Call Clicks', value: m.callClicks || 0, icon: Phone, color: 'text-[#0071e3]', bg: 'bg-[#f0f6ff]' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Store Dashboard</h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Real-time overview of inventory stock, active components, and customer enquiries.
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
            className="px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/10 text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>CSV Import</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-white border border-black/8 shadow-apple-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#86868b] truncate">{c.label}</span>
                <div className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center ${c.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Recent Inventory & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Products (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 border border-black/8 shadow-apple-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Recent Inventory Items</h2>
            <Link to="/admin/products" className="text-xs text-[#0071e3] hover:text-[#0077ed] font-medium flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[#86868b] border-b border-black/5 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data?.recentProducts?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#fafafc] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#86868b]">{p.product_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1d1d1f] max-w-[200px] truncate">{p.name}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">{formatPrice(p.price)}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleQuickStockToggle(p.id, p.stock_status)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider transition ${
                          p.stock_status === 'IN_STOCK'
                            ? 'bg-[#f0fdf4] text-emerald-800 border border-emerald-200'
                            : 'bg-[#f5f5f7] text-[#86868b] border border-black/10'
                        }`}
                        title="Click to toggle stock status"
                      >
                        {p.stock_status === 'IN_STOCK' ? 'In Stock' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="text-[#0071e3] hover:text-[#0077ed] font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Enquiries Activity Log (1 col) */}
        <div className="rounded-3xl bg-white p-6 border border-black/8 shadow-apple-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Recent Customer Enquiries</h2>
          
          <div className="space-y-2.5">
            {data?.recentEnquiries?.length > 0 ? (
              data.recentEnquiries.map((enq: any) => (
                <div key={enq.id} className="p-3 rounded-2xl bg-[#fbfbfd] border border-black/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                      enq.type === 'WHATSAPP' ? 'bg-[#f0fdf4] text-emerald-700 border border-emerald-200' : 'bg-[#f0f6ff] text-[#0071e3] border border-blue-200'
                    }`}>
                      {enq.type}
                    </span>
                    <span className="text-[10px] text-[#86868b] font-mono">
                      {new Date(enq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1d1d1f] truncate">
                    {enq.product_name || 'General enquiry'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#86868b] font-mono py-6 text-center">No enquiry clicks logged yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
