import { useState, useMemo } from 'react';
import { Guest } from '../types';

type FilterType = 'all' | 'checked_in' | 'not_checked_in' | 'rsvp_confirmed' | 'rsvp_pending' | 'rsvp_declined';
type SortType = 'name_asc' | 'name_desc' | 'category' | 'checkin_time';

interface OperatorDashboardProps {
  guests: Guest[];
  onCheckIn: (id: number) => Promise<{ success: boolean; alreadyCheckedIn: boolean }>;
  onUndoCheckIn?: (id: number) => Promise<void>;
  onBack: () => void;
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ guests, onCheckIn, onUndoCheckIn, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name_asc');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredGuests = useMemo(() => {
    let result = guests;

    // SEMUA filter: Only show CONFIRMED guests only (exclude pending and declined)
    if (filter === 'all') {
      result = result.filter(g => g.rsvpStatus === 'confirmed');
    }
    // Check-in filters (only from confirmed guests)
    else if (filter === 'checked_in') {
      result = result.filter(g => g.status === 'checked_in' && g.rsvpStatus === 'confirmed');
    } else if (filter === 'not_checked_in') {
      result = result.filter(g => g.status === 'not_checked_in' && g.rsvpStatus === 'confirmed');
    }
    // RSVP filters
    else if (filter === 'rsvp_confirmed') {
      result = result.filter(g => g.rsvpStatus === 'confirmed');
    } else if (filter === 'rsvp_pending') {
      result = result.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending');
    } else if (filter === 'rsvp_declined') {
      result = result.filter(g => g.rsvpStatus === 'declined');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.id.toString().includes(query)
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'id-ID');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'id-ID');
        case 'category':
          return a.category.localeCompare(b.category);
        case 'checkin_time':
          // Sort by check-in time (checked-in guests first, then by time)
          const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
          const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
          if (aTime === 0 && bTime === 0) return 0;
          if (aTime === 0) return 1;
          if (bTime === 0) return -1;
          return bTime - aTime; // Most recent first
        default:
          return 0;
      }
    });

    return result;
  }, [guests, searchQuery, filter, sortBy]);

  const handleCheckIn = async (guest: Guest) => {
    // Toggle: if already checked in, undo; if not, check in
    if (guest.status === 'checked_in') {
      // Undo check-in
      if (onUndoCheckIn) {
        await onUndoCheckIn(guest.id);
        setMessage({ type: 'success', text: `${guest.name} batal check-in` });
      } else {
        setMessage({ type: 'error', text: `Undo tidak tersedia` });
      }
    } else {
      // Check in
      const result = await onCheckIn(guest.id);
      if (result.alreadyCheckedIn) {
        setMessage({ type: 'error', text: `${guest.name} sudah check-in` });
      } else {
        setMessage({ type: 'success', text: `${guest.name} berhasil check-in!` });
      }
    }

    setTimeout(() => setMessage(null), 2000);
  };

  const getCategoryColor = (category: Guest['category']) => {
    switch (category) {
      case 'VIP': return 'text-sasie-bronze border-sasie-gold/40 bg-sasie-gold/10';
      case 'Speaker': return 'text-sasie-marun border-sasie-terracotta/40 bg-sasie-terracotta/10';
      case 'Media': return 'text-sasie-emerald border-sasie-emerald/40 bg-sasie-sage/20';
      case 'Owner': return 'text-sasie-mocca border-sasie-mocca/40 bg-sasie-mocca/10';
      default: return 'text-sasie-milo border-sasie-dove bg-sasie-dove/50';
    }
  };

  const getRsvpStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-sasie-emerald/20 text-sasie-emerald border-sasie-emerald/40';
      case 'declined': return 'bg-sasie-marun/20 text-sasie-marun border-sasie-marun/40';
      default: return 'bg-sasie-dove/30 text-sasie-milo border-sasie-dove';
    }
  };

  const getRsvpStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'Konfirm';
      case 'declined': return 'Tidak';
      default: return 'Pending';
    }
  };

  const getRsvpStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'declined': return '✕';
      default: return '…';
    }
  };

  // Statistics - Only count CONFIRMED guests (exclude pending and declined)
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'confirmed');
  const checkedCount = confirmedGuests.filter(g => g.status === 'checked_in').length;
  const pendingCount = confirmedGuests.filter(g => g.status === 'not_checked_in').length;

  // RSVP Statistics
  const rsvpConfirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const rsvpPending = guests.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending').length;
  const rsvpDeclined = guests.filter(g => g.rsvpStatus === 'declined').length;

  return (
    <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col bg-sasie-cream">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-sasie-dove hover:border-sasie-gold transition-colors"
        >
          <svg className="w-6 h-6 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium text-sasie-mocca">Operator Dashboard</h2>
          <p className="text-[10px] text-sasie-milo/70">Panel Pantauan Tamu</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Filter Buttons - Enhanced with RSVP */}
      <div className="px-4 sticky top-0 z-10 bg-sasie-cream/95 backdrop-blur-sm py-2">
        {/* Main Filters */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 text-sm ${
              filter === 'all'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            <div className="text-base font-bold">{confirmedGuests.length}</div>
            <div className="text-[10px] opacity-80">SEMUA</div>
          </button>

          <button
            onClick={() => setFilter('checked_in')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 text-sm ${
              filter === 'checked_in'
                ? 'bg-sasie-emerald text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-emerald/50'
            }`}
          >
            <div className="text-base font-bold">{checkedCount}</div>
            <div className="text-[10px] opacity-80">CHECK-IN</div>
          </button>

          <button
            onClick={() => setFilter('not_checked_in')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all duration-200 text-sm ${
              filter === 'not_checked_in'
                ? 'bg-sasie-terracotta text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-terracotta/50'
            }`}
          >
            <div className="text-lg font-bold">{pendingCount}</div>
            <div className="text-xs opacity-80">BELUM</div>
          </button>
        </div>

        {/* RSVP Filters */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter('rsvp_confirmed')}
            className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              filter === 'rsvp_confirmed'
                ? 'bg-sasie-emerald text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-emerald/50'
            }`}
          >
            ✓ Konfirm ({rsvpConfirmed})
          </button>

          <button
            onClick={() => setFilter('rsvp_pending')}
            className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              filter === 'rsvp_pending'
                ? 'bg-sasie-milo text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-mocca/50'
            }`}
          >
            … Pending ({rsvpPending})
          </button>

          <button
            onClick={() => setFilter('rsvp_declined')}
            className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              filter === 'rsvp_declined'
                ? 'bg-sasie-marun text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-marun/50'
            }`}
          >
            ✕ Tdk ({rsvpDeclined})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sasie-milo/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu..."
            className="input-field w-full pl-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sasie-milo/60 hover:text-sasie-mocca"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setSortBy('name_asc')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              sortBy === 'name_asc'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortBy('name_desc')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              sortBy === 'name_desc'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            Z-A
          </button>
          <button
            onClick={() => setSortBy('category')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              sortBy === 'category'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            Kategori
          </button>
          <button
            onClick={() => setSortBy('checkin_time')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 text-xs ${
              sortBy === 'checkin_time'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            Waktu Check-in
          </button>
        </div>

        {/* Result Count */}
        <p className="text-sasie-milo text-xs mt-2 text-center">
          {filteredGuests.length} tamu ditampilkan
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-4 mt-2 p-3 rounded-xl text-center animate-slide-up ${
          message.type === 'success'
            ? 'bg-sasie-emerald/20 border border-sasie-emerald/50 text-sasie-emerald'
            : 'bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun'
        }`}>
          {message.text}
        </div>
      )}

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-sasie-milo mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sasie-milo">Tidak ada tamu ditemukan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                onClick={() => handleCheckIn(guest)}
                className={`glass-card p-3 cursor-pointer transition-all duration-200 ${
                  guest.status === 'checked_in'
                    ? 'border-sasie-emerald/50 bg-sasie-sage/10'
                    : 'hover:border-sasie-gold/50'
                } ${
                  guest.rsvpStatus === 'confirmed' && guest.status === 'not_checked_in'
                    ? 'border-l-4 border-l-sasie-emerald'
                    : guest.category === 'VIP'
                    ? 'border-l-4 border-l-sasie-gold'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Name with VIP badge */}
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold text-base truncate ${
                          guest.status === 'checked_in'
                            ? 'text-sasie-emerald'
                            : guest.rsvpStatus === 'confirmed'
                            ? 'text-sasie-mocca'
                            : 'text-sasie-mocca/70'
                        }`}
                      >
                        {guest.name}
                      </h3>
                      {guest.category === 'VIP' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sasie-gold/20 text-sasie-bronze border border-sasie-gold/40 flex-shrink-0">
                          VIP
                        </span>
                      )}
                    </div>

                    {/* ID and Category */}
                    <p className="text-xs text-sasie-milo/60 mt-1">
                      ##{guest.id} • {guest.category}
                    </p>

                    {/* RSVP Status Badge */}
                    {guest.status === 'not_checked_in' && (
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getRsvpStatusColor(
                            guest.rsvpStatus
                          )}`}
                        >
                          <span>{getRsvpStatusIcon(guest.rsvpStatus)}</span>
                          <span>RSVP: {getRsvpStatusText(guest.rsvpStatus)}</span>
                        </span>
                      </div>
                    )}

                    {/* RSVP Response Time */}
                    {guest.rsvpResponseTime && guest.status === 'not_checked_in' && (
                      <p className="text-xs text-sasie-milo/50 mt-1">
                        Respon: {new Date(guest.rsvpResponseTime).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {guest.status === 'checked_in' ? (
                      <>
                        <div className="text-center mr-2">
                          <p className="text-xs text-sasie-emerald">
                            {new Date(guest.checkInTime || '').toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-[9px] text-sasie-marun/70">Tap to undo</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sasie-marun/20 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-sasie-marun"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Show category if not checked in */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(
                          guest.category
                        )}`}
                        >
                          {guest.category}
                        </span>
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-sasie-mocca"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;
