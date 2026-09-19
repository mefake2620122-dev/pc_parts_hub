import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/whatsapp';

export const AdminImport: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setPreviewData(null);
      setImportSuccess(null);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV content or upload a CSV file');
      return;
    }

    setError('');
    setLoading(true);
    setImportSuccess(null);

    try {
      const res = await api.previewCSV(csvText);
      setPreviewData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setImporting(true);
    setError('');

    try {
      const res = await api.confirmCSVImport(previewData.validRows);
      setImportSuccess(res.count);
      setPreviewData(null);
      setCsvText('');
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    window.open('/api/import/sample-csv', '_blank');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Bulk CSV Inventory Import</h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Quickly intake large PC hardware batches via spreadsheet.
          </p>
        </div>

        <button
          onClick={downloadSampleCSV}
          className="px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-black/10 text-[#1d1d1f] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {importSuccess !== null && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Successfully imported {importSuccess} hardware components into catalog!</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-8 border border-black/8 shadow-apple-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
            1. Select File or Paste Content
          </span>
          <span className="text-[11px] text-[#86868b]">Columns: name, category, brand, model, price, condition, stock...</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-black/10 border-dashed cursor-pointer text-xs font-semibold text-[#1d1d1f] transition">
            <Upload className="w-4 h-4 text-[#0071e3]" />
            <span>Upload CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#6e6e73]">Raw CSV Data</label>
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Product Name,Category,Brand,Model,Price,Condition,Stock,Description&#10;ASUS RTX 3060 12GB,gpu,ASUS,Dual,18000,Like New,IN_STOCK,Stress tested clean"
            className="w-full p-3 bg-[#f5f5f7] border border-black/8 rounded-2xl text-xs font-mono text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
          />
        </div>

        <button
          onClick={handlePreview}
          disabled={loading || !csvText.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold disabled:opacity-40 transition shadow-xs"
        >
          {loading ? 'Validating CSV...' : 'Preview Rows'}
        </button>
      </div>

      {/* Validation Preview Card */}
      {previewData && (
        <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-8 border border-black/8 shadow-apple-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1d1d1f]">
                2. Validation Results
              </h3>
              <p className="text-xs text-[#86868b]">
                Found {previewData.validRows.length} valid row(s) and {previewData.invalidRows.length} error(s).
              </p>
            </div>

            {previewData.validRows.length > 0 && (
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full btn-apple-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <span>{importing ? 'Importing...' : `Import ${previewData.validRows.length} Valid Products`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Valid rows preview */}
          {previewData.validRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-700">Valid Rows Preview:</span>
              <div className="overflow-x-auto rounded-2xl border border-black/8">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-[#f5f5f7] text-[#86868b] uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Brand</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {previewData.validRows.slice(0, 5).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-[#fafafc]">
                        <td className="p-2.5 font-semibold text-[#1d1d1f] truncate max-w-xs whitespace-nowrap">{row.name}</td>
                        <td className="p-2.5 text-[#86868b] whitespace-nowrap">{row.category}</td>
                        <td className="p-2.5 text-[#86868b] whitespace-nowrap">{row.brand}</td>
                        <td className="p-2.5 font-semibold text-[#1d1d1f] whitespace-nowrap">{formatPrice(row.price)}</td>
                        <td className="p-2.5 text-[#424245] whitespace-nowrap">{row.condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid rows */}
          {previewData.invalidRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-rose-700">Invalid Rows:</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {previewData.invalidRows.map((inv: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                    <span className="font-mono text-[11px]">Row {inv.row}: {inv.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminImport;
