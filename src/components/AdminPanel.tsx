import { useState, useRef } from 'react';
import { Guest, CheckInStats } from '../types';
import { parseCSV, downloadCSV } from '../utils/csvParser';
import { generateQRPdf } from '../utils/qrGenerator';
import { clearAllData } from '../utils/storage';

interface AdminPanelProps {
  guests: Guest[];
  stats: CheckInStats;
  onImport: (guests: Guest[]) => void;
  onReset: () => void;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ guests, stats, onImport, onReset, onBack }) => {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const parsedGuests = await parseCSV(file);

      if (parsedGuests.length === 0) {
        throw new Error('No guests found in file');
      }

      if (confirm(`Import ${parsedGuests.length} guests? This will replace existing data.`)) {
        onImport(parsedGuests);
        alert(`Successfully imported ${parsedGuests.length} guests`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error parsing file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGeneratePDF = async () => {
    if (guests.length === 0) {
      setError('No guests to generate QR codes for');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await generateQRPdf(guests);
    } catch (err) {
      setError('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    downloadCSV(guests, 'sasie_guests_export.csv');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all check-ins?')) {
      onReset();
    }
  };

  const handleClearAll = () => {
    if (confirm('This will delete ALL guest data. Are you sure?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors"
        >
          <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-medium text-sasie-mocca">Admin Panel</h2>
        <div className="w-10"></div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-lg font-medium text-sasie-mocca mb-4">Current Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold text-sasie-mocca">{guests.length}</p>
            <p className="text-sm text-sasie-milo/70">Total Guests</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-sasie-emerald">{stats.checkedIn}</p>
            <p className="text-sm text-sasie-milo/70">Checked In</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-sasie-gold">{stats.vipTotal}</p>
            <p className="text-sm text-sasie-milo/70">VIP Guests</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-sasie-terracotta">{guests.filter(g => g.category === 'Speaker').length}</p>
            <p className="text-sm text-sasie-milo/70">Speakers</p>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="glass-card p-6 mb-4">
        <h3 className="text-lg font-medium text-sasie-mocca mb-4">Import Guests</h3>
        <p className="text-sasie-milo/70 text-sm mb-4">
          Upload a CSV file with columns: Name, Category (VIP/Regular/Media/Speaker), Email, Phone
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload CSV
            </>
          )}
        </button>
      </div>

      {/* QR Code Section */}
      <div className="glass-card p-6 mb-4">
        <h3 className="text-lg font-medium text-sasie-mocca mb-4">QR Codes</h3>
        <div className="space-y-3">
          <button
            onClick={handleGeneratePDF}
            disabled={generating || guests.length === 0}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-sasie-mocca border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All QR Codes (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6 mb-4">
        <h3 className="text-lg font-medium text-sasie-mocca mb-4">Data Management</h3>
        <div className="space-y-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data (CSV)
          </button>

          <button
            onClick={handleReset}
            className="w-full py-3 px-4 rounded-xl border border-sasie-terracotta/50 text-sasie-terracotta font-medium hover:bg-sasie-terracotta/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All Check-ins
          </button>

          <button
            onClick={handleClearAll}
            className="w-full py-3 px-4 rounded-xl border border-sasie-marun/50 text-sasie-marun font-medium hover:bg-sasie-marun/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete All Data
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-sasie-milo/60 text-sm mt-4">
        SASIENALA x WARDAH Guest Check-in System
      </p>
    </div>
  );
};

export default AdminPanel;
