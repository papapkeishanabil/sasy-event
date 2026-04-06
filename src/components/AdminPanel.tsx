import { useState, useRef, useEffect } from 'react';
import { Guest, CheckInStats, Category } from '../types';
import { parseCSV, downloadCSV } from '../utils/csvParser';
import { generateQRPdf } from '../utils/qrGenerator';
import { clearAllData, getCategories, addCategory, updateCategory, deleteCategory } from '../utils/storage';

interface AdminPanelProps {
  guests: Guest[];
  stats: CheckInStats;
  onImport: (guests: Guest[]) => void;
  onReset: () => void;
  onBack: () => void;
  onInvitationBuilder?: () => void;
  onAddGuest?: (guest: Omit<Guest, 'id'>) => void;
  onUpdateGuest?: (guestId: number, updates: Partial<Omit<Guest, 'id'>>) => void;
  onDeleteGuest?: (guestId: number) => void;
}

type AdminView = 'dashboard' | 'guests' | 'add-guest' | 'edit-guest' | 'categories';

const AdminPanel: React.FC<AdminPanelProps> = ({
  guests,
  stats,
  onImport,
  onReset,
  onBack,
  onInvitationBuilder,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest
}) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#8B7355',
    icon: '',
    display_order: 0,
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Form state for add/edit guest
  const [formData, setFormData] = useState({
    name: '',
    category: 'Regular' as Guest['category'],
    email: '',
    phone: '',
  });

  const resetForm = () => {
    setFormData({ name: '', category: 'Regular', email: '', phone: '' });
    setEditingGuest(null);
    setError('');
  };

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

  const handleAddGuest = () => {
    if (!formData.name.trim()) {
      setError('Nama tamu wajib diisi');
      return;
    }

    if (onAddGuest) {
      onAddGuest({
        ...formData,
        status: 'not_checked_in'
      });
      setSuccessMessage('Tamu berhasil ditambahkan!');
      setTimeout(() => setSuccessMessage(''), 2000);
      resetForm();
      setCurrentView('guests');
    }
  };

  const handleEditGuest = () => {
    if (!formData.name.trim()) {
      setError('Nama tamu wajib diisi');
      return;
    }

    if (onUpdateGuest && editingGuest) {
      onUpdateGuest(editingGuest.id, formData);
      setSuccessMessage('Data tamu berhasil diupdate!');
      setTimeout(() => setSuccessMessage(''), 2000);
      resetForm();
      setCurrentView('guests');
    }
  };

  const handleDeleteGuest = (guestId: number, guestName: string) => {
    if (confirm(`Hapus tamu "${guestName}"?`)) {
      if (onDeleteGuest) {
        onDeleteGuest(guestId);
        setSuccessMessage('Tamu berhasil dihapus!');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    }
  };

  // Category handlers
  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '', color: '#8B7355', icon: '', display_order: 0 });
    setEditingCategory(null);
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    try {
      const updated = await addCategory({
        ...categoryFormData,
        display_order: categories.length + 1,
      });
      setCategories(updated);
      setSuccessMessage('Kategori berhasil ditambahkan!');
      setTimeout(() => setSuccessMessage(''), 2000);
      resetCategoryForm();
    } catch (error) {
      setError('Gagal menambahkan kategori');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const updated = await updateCategory(editingCategory.id, categoryFormData);
      if (updated) {
        setCategories(updated);
        setSuccessMessage('Kategori berhasil diupdate!');
        setTimeout(() => setSuccessMessage(''), 2000);
        resetCategoryForm();
        setEditingCategory(null);
      }
    } catch (error) {
      setError('Gagal mengupdate kategori');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (confirm(`Hapus kategori "${categoryName}"?`)) {
      try {
        const updated = await deleteCategory(categoryId);
        if (updated) {
          setCategories(updated);
          setSuccessMessage('Kategori berhasil dihapus!');
          setTimeout(() => setSuccessMessage(''), 2000);
        }
      } catch (error) {
        setError('Gagal menghapus kategori');
      }
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || '',
      display_order: category.display_order,
    });
  };

  const openEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      category: guest.category,
      email: guest.email || '',
      phone: guest.phone || '',
    });
    setCurrentView('edit-guest');
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.id.toString().includes(searchQuery)
  );

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
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

        {/* Quick Stats */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setCurrentView('guests')}
            className="glass-card p-4 text-center hover:border-sasie-gold/50 transition-all"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="font-medium text-sasie-mocca">Kelola Tamu</p>
            <p className="text-xs text-sasie-milo/70">{guests.length} tamu</p>
          </button>

          <button
            onClick={() => setCurrentView('categories')}
            className="glass-card p-4 text-center hover:border-sasie-gold/50 transition-all"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-sasie-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="font-medium text-sasie-mocca">Kategori</p>
            <p className="text-xs text-sasie-milo/70">{categories.length} kategori</p>
          </button>

          <button
            onClick={() => setCurrentView('add-guest')}
            className="glass-card p-4 text-center hover:border-sasie-gold/50 transition-all"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-sasie-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="font-medium text-sasie-mocca">Tambah Tamu</p>
            <p className="text-xs text-sasie-milo/70">Tambah baru</p>
          </button>
        </div>

        {/* Import Section */}
        <div className="glass-card p-6 mb-4">
          <h3 className="text-lg font-medium text-sasie-mocca mb-4">Import Guests</h3>
          <p className="text-sasie-milo/70 text-sm mb-4">
            Upload a CSV file with columns: Name, Category (VIP/Regular/Media/Speaker), Email, Phone
          </p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
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
            <button onClick={handleGeneratePDF} disabled={generating || guests.length === 0} className="btn-secondary w-full flex items-center justify-center gap-2">
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

        {/* Digital Invitation Section */}
        <div className="glass-card p-6 mb-4 border-2 border-emerald-200">
          <h3 className="text-lg font-medium text-sasie-mocca mb-2">📧 Undangan Digital</h3>
          <p className="text-sasie-milo/70 text-sm mb-4">Buat undangan digital, kirim via WhatsApp, dan lacak RSVP</p>
          <button onClick={onInvitationBuilder} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Invitation Builder
          </button>
        </div>

        {/* Data Management */}
        <div className="glass-card p-6 mb-4">
          <h3 className="text-lg font-medium text-sasie-mocca mb-4">Data Management</h3>
          <div className="space-y-3">
            <button onClick={handleExportCSV} className="btn-secondary w-full flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data (CSV)
            </button>

            <button onClick={handleReset} className="w-full py-3 px-4 rounded-xl border border-sasie-terracotta/50 text-sasie-terracotta font-medium hover:bg-sasie-terracotta/10 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All Check-ins
            </button>

            <button onClick={handleClearAll} className="w-full py-3 px-4 rounded-xl border border-sasie-marun/50 text-sasie-marun font-medium hover:bg-sasie-marun/10 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sasie-milo/60 text-sm mt-4">SASIENALA x WARDAH Guest Check-in System</p>
      </div>
    );
  }

  // Guests List View
  if (currentView === 'guests') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
            <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-medium text-sasie-mocca">Daftar Tamu</h2>
          <button onClick={() => setCurrentView('add-guest')} className="p-2 rounded-full bg-sasie-emerald hover:bg-sasie-emerald/90 text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-emerald/20 border border-sasie-emerald/50 text-sasie-emerald text-center animate-slide-up">
            {successMessage}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sasie-milo/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama tamu..." className="input-field w-full pl-12" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-sasie-milo/60 hover:text-sasie-mocca">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Result Count */}
        <p className="text-sasie-milo text-sm mb-4 text-center">{filteredGuests.length} dari {guests.length} tamu</p>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-safe">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-sasie-milo mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sasie-milo">Tidak ada tamu ditemukan</p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div key={guest.id} className="glass-card p-4 hover:border-sasie-gold/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${guest.status === 'checked_in' ? 'text-sasie-emerald' : 'text-sasie-mocca'}`}>{guest.name}</h3>
                      {guest.category === 'VIP' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sasie-gold/20 text-sasie-bronze border border-sasie-gold/40">VIP</span>
                      )}
                      {guest.status === 'checked_in' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sasie-emerald/20 text-sasie-emerald border border-sasie-emerald/40">Checked In</span>
                      )}
                    </div>
                    <p className="text-xs text-sasie-milo/60">ID: {guest.id} • {guest.category}</p>
                    {guest.email && <p className="text-xs text-sasie-milo/60">{guest.email}</p>}
                    {guest.phone && <p className="text-xs text-sasie-milo/60">{guest.phone}</p>}
                    {guest.rsvpStatus && (
                      <p className="text-xs text-sasie-milo/60 mt-1">
                        RSVP: <span className={`font-medium ${
                          guest.rsvpStatus === 'confirmed' ? 'text-sasie-emerald' :
                          guest.rsvpStatus === 'declined' ? 'text-sasie-marun' :
                          guest.rsvpStatus === 'maybe' ? 'text-sasie-gold' : 'text-sasie-milo'
                        }`}>
                          {guest.rsvpStatus === 'confirmed' ? 'Hadir' :
                           guest.rsvpStatus === 'declined' ? 'Tidak' :
                           guest.rsvpStatus === 'maybe' ? 'Ragu' : 'Pending'}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-3">
                    <button onClick={() => openEditGuest(guest)} className="p-2 rounded-lg bg-sasie-mocca/10 hover:bg-sasie-mocca/20 text-sasie-mocca transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteGuest(guest.id, guest.name)} className="p-2 rounded-lg bg-sasie-marun/10 hover:bg-sasie-marun/20 text-sasie-marun transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Add Guest View
  if (currentView === 'add-guest') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { resetForm(); setCurrentView('dashboard'); }} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
            <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-medium text-sasie-mocca">Tambah Tamu Baru</h2>
          <div className="w-10"></div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-emerald/20 border border-sasie-emerald/50 text-sasie-emerald text-center">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Nama Lengkap *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama tamu"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="input-field w-full"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@contoh.com"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">No. Telepon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08123456789"
              className="input-field w-full"
            />
          </div>

          <button onClick={handleAddGuest} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Simpan Tamu
          </button>

          <button onClick={() => { resetForm(); setCurrentView('dashboard'); }} className="w-full py-3 px-4 rounded-xl border border-sasie-dove text-sasie-mocca hover:bg-sasie-dove/30 transition-colors">
            Batal
          </button>
        </div>
      </div>
    );
  }

  // Edit Guest View
  if (currentView === 'edit-guest') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { resetForm(); setCurrentView('guests'); }} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
            <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-medium text-sasie-mocca">Edit Data Tamu</h2>
          <div className="w-10"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="glass-card p-6 space-y-4">
          <div className="p-3 bg-sasie-dove/30 rounded-xl text-center">
            <p className="text-sm text-sasie-milo/70">Mengedit</p>
            <p className="font-semibold text-sasie-mocca">{editingGuest?.name}</p>
            <p className="text-xs text-sasie-milo/60">ID: {editingGuest?.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Nama Lengkap *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama tamu"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="input-field w-full"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@contoh.com"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">No. Telepon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08123456789"
              className="input-field w-full"
            />
          </div>

          <button onClick={handleEditGuest} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Update Data Tamu
          </button>

          <button onClick={() => { resetForm(); setCurrentView('guests'); }} className="w-full py-3 px-4 rounded-xl border border-sasie-dove text-sasie-mocca hover:bg-sasie-dove/30 transition-colors">
            Batal
          </button>
        </div>
      </div>
    );
  }

  // Categories Management View
  if (currentView === 'categories') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
            <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-medium text-sasie-mocca">Kelola Kategori</h2>
          <button
            onClick={() => {
              resetCategoryForm();
              setCurrentView('categories');
            }}
            className="p-2 rounded-full bg-sasie-bronze hover:bg-sasie-gold text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-emerald/20 border border-sasie-emerald/50 text-sasie-emerald text-center animate-slide-up">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun text-center">
            {error}
          </div>
        )}

        {/* Add/Edit Category Form */}
        <div className="glass-card p-6 mb-4">
          <h3 className="text-lg font-medium text-sasie-mocca mb-4">
            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sasie-mocca mb-2">Nama Kategori *</label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Contoh: VIP, Regular, Media"
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sasie-mocca mb-2">Deskripsi</label>
              <input
                type="text"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Keterangan singkat"
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sasie-mocca mb-2">Warna</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  placeholder="#8B7355"
                  className="input-field flex-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingCategory ? (
                <>
                  <button
                    onClick={handleUpdateCategory}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update
                  </button>
                  <button
                    onClick={() => {
                      resetCategoryForm();
                      setError('');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-sasie-dove text-sasie-mocca hover:bg-sasie-dove/30 transition-colors"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCategory}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Tambah Kategori
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loadingCategories ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-sasie-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sasie-milo">Memuat kategori...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-sasie-milo mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-sasie-milo">Belum ada kategori</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="glass-card p-4 hover:border-sasie-gold/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Color indicator */}
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sasie-mocca truncate">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs text-sasie-milo/70 truncate">{category.description}</p>
                      )}
                      <p className="text-xs text-sasie-milo/50">{guests.filter(g => g.category === category.name).length} tamu</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCategory(category)}
                      className="p-2 rounded-lg bg-sasie-mocca/10 hover:bg-sasie-mocca/20 text-sasie-mocca transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="p-2 rounded-lg bg-sasie-marun/10 hover:bg-sasie-marun/20 text-sasie-marun transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Edit Guest View
  if (currentView === 'edit-guest') {
    return (
      <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col px-4 py-6 bg-sasie-cream">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { resetForm(); setCurrentView('guests'); }} className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors">
            <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-medium text-sasie-mocca">Edit Data Tamu</h2>
          <div className="w-10"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="glass-card p-6 space-y-4">
          <div className="p-3 bg-sasie-dove/30 rounded-xl text-center">
            <p className="text-sm text-sasie-milo/70">Mengedit</p>
            <p className="font-semibold text-sasie-mocca">{editingGuest?.name}</p>
            <p className="text-xs text-sasie-milo/60">ID: {editingGuest?.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Nama Lengkap *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama tamu"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="input-field w-full"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@contoh.com"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sasie-mocca mb-2">No. Telepon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08123456789"
              className="input-field w-full"
            />
          </div>

          <button onClick={handleEditGuest} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Update Data Tamu
          </button>

          <button onClick={() => { resetForm(); setCurrentView('guests'); }} className="w-full py-3 px-4 rounded-xl border border-sasie-dove text-sasie-mocca hover:bg-sasie-dove/30 transition-colors">
            Batal
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminPanel;
