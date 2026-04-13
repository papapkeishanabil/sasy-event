import { useState, useMemo, useRef, useEffect } from 'react';
import { Guest } from '../types';

type FilterType = 'all' | 'checked_in' | 'not_checked_in' | 'rsvp_confirmed' | 'rsvp_pending' | 'rsvp_declined';
type SortType = 'name_asc' | 'name_desc' | 'category' | 'checkin_time';

// Custom category order
const CATEGORY_ORDER = ['Bestie Deal', 'Designer', 'Guest', 'Reguler', 'VIP'];

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
  const [filterMode, setFilterMode] = useState<'checkin' | 'rsvp'>('checkin');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const guestListRef = useRef<HTMLDivElement>(null);

  const filteredGuests = useMemo(() => {
    let result = guests;

    // Only show CONFIRMED guests for check-in mode
    if (filterMode === 'checkin') {
      if (filter === 'all') {
        result = result.filter(g => g.rsvpStatus === 'confirmed');
      } else if (filter === 'checked_in') {
        result = result.filter(g => g.status === 'checked_in' && g.rsvpStatus === 'confirmed');
      } else if (filter === 'not_checked_in') {
        result = result.filter(g => g.status === 'not_checked_in' && g.rsvpStatus === 'confirmed');
      }
    } else {
      // RSVP mode - show all guests
      if (filter === 'rsvp_confirmed') {
        result = result.filter(g => g.rsvpStatus === 'confirmed');
      } else if (filter === 'rsvp_pending') {
        result = result.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending');
      } else if (filter === 'rsvp_declined') {
        result = result.filter(g => g.rsvpStatus === 'declined');
      }
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
          const aOrder = CATEGORY_ORDER.indexOf(a.category) ?? 999;
          const bOrder = CATEGORY_ORDER.indexOf(b.category) ?? 999;
          return aOrder - bOrder;
        case 'checkin_time':
          const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
          const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });

    return result;
  }, [guests, searchQuery, filter, sortBy, filterMode]);

  const handleCheckIn = async (guest: Guest) => {
    if (guest.status === 'checked_in') {
      if (onUndoCheckIn) {
        await onUndoCheckIn(guest.id);
        setMessage({ type: 'success', text: `${guest.name} batal check-in` });
      }
    } else {
      const result = await onCheckIn(guest.id);
      if (result.alreadyCheckedIn) {
        setMessage({ type: 'error', text: `${guest.name} sudah check-in` });
      } else {
        setMessage({ type: 'success', text: `${guest.name} berhasil check-in!` });
      }
    }
    setTimeout(() => setMessage(null), 2000);
  };

  // Scroll to top
  const scrollToTop = () => {
    if (guestListRef.current) {
      guestListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Track scroll position
  useEffect(() => {
    const listElement = guestListRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      setShowScrollTop(listElement.scrollTop > 300);
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Statistics
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'confirmed');
  const checkedCount = confirmedGuests.filter(g => g.status === 'checked_in').length;
  const pendingCount = confirmedGuests.filter(g => g.status === 'not_checked_in').length;

  const rsvpConfirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const rsvpPending = guests.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending').length;
  const rsvpDeclined = guests.filter(g => g.rsvpStatus === 'declined').length;

  return (
    <div className="page-transition min-h-screen flex flex-col bg-sasie-cream">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/80 backdrop-blur-sm border-b border-sasie-dove/30">
        <button onClick={onBack} className="p-1.5 rounded-full bg-white border border-sasie-dove">
          <svg className="w-5 h-5 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium text-sasie-mocca">Operator</h2>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Compact Stats */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-sasie-mocca">{confirmedGuests.length}</p>
            <p className="text-[9px] text-sasie-milo/70">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-sasie-emerald">{checkedCount}</p>
            <p className="text-[9px] text-sasie-milo/70">Hadir</p>
          </div>
          <div>
            <p className="text-lg font-bold text-sasie-terracotta">{pendingCount}</p>
            <p className="text-[9px] text-sasie-milo/70">Belum</p>
          </div>
        </div>
      </div>

      {/* Filters - Tab Style Compact */}
      <div className="px-3 py-2">
        {/* Filter Mode Toggle */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => {
              setFilterMode('checkin');
              setFilter('all');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
              filterMode === 'checkin'
                ? 'bg-sasie-emerald/10 text-sasie-emerald border border-sasie-emerald/30'
                : 'bg-white text-sasie-milo/60 border border-sasie-dove'
            }`}
          >
            ✓ Check-in
          </button>
          <button
            onClick={() => {
              setFilterMode('rsvp');
              setFilter('rsvp_confirmed');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
              filterMode === 'rsvp'
                ? 'bg-sasie-mocca/10 text-sasie-mocca border border-sasie-mocca/30'
                : 'bg-white text-sasie-milo/60 border border-sasie-dove'
            }`}
          >
            📋 RSVP
          </button>
        </div>

        {/* Filter Options */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {filterMode === 'checkin' ? (
            <>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-sasie-emerald text-white'
                    : 'bg-white border border-sasie-emerald/30 text-sasie-emerald'
                }`}
              >
                Semua ({confirmedGuests.length})
              </button>
              <button
                onClick={() => setFilter('checked_in')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'checked_in'
                    ? 'bg-sasie-emerald text-white'
                    : 'bg-white border border-sasie-emerald/30 text-sasie-emerald'
                }`}
              >
                Hadir ({checkedCount})
              </button>
              <button
                onClick={() => setFilter('not_checked_in')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'not_checked_in'
                    ? 'bg-sasie-terracotta text-white'
                    : 'bg-white border border-sasie-terracotta/30 text-sasie-terracotta'
                }`}
              >
                Belum ({pendingCount})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setFilter('rsvp_confirmed')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'rsvp_confirmed'
                    ? 'bg-sasie-emerald text-white'
                    : 'bg-white border border-sasie-emerald/30 text-sasie-emerald'
                }`}
              >
                ✓ Konfirm ({rsvpConfirmed})
              </button>
              <button
                onClick={() => setFilter('rsvp_pending')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'rsvp_pending'
                    ? 'bg-sasie-dove text-white'
                    : 'bg-white border border-sasie-dove/50 text-sasie-milo'
                }`}
              >
                … Pending ({rsvpPending})
              </button>
              <button
                onClick={() => setFilter('rsvp_declined')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap ${
                  filter === 'rsvp_declined'
                    ? 'bg-sasie-marun text-white'
                    : 'bg-white border border-sasie-marun/30 text-sasie-marun'
                }`}
              >
                ✕ Tidak ({rsvpDeclined})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 mb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sasie-milo/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama..."
            className="w-full pl-10 pr-8 py-2 rounded-lg border border-sasie-dove bg-white text-sm focus:outline-none focus:border-sasie-gold/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-sasie-milo/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="px-3 mb-2 flex gap-1">
        <button
          onClick={() => setSortBy('name_asc')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
            sortBy === 'name_asc'
              ? 'bg-sasie-mocca text-white'
              : 'bg-white border border-sasie-dove text-sasie-milo'
          }`}
        >
          A-Z
        </button>
        <button
          onClick={() => setSortBy('name_desc')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
            sortBy === 'name_desc'
              ? 'bg-sasie-mocca text-white'
              : 'bg-white border border-sasie-dove text-sasie-milo'
          }`}
        >
          Z-A
        </button>
        <button
          onClick={() => setSortBy('category')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
            sortBy === 'category'
              ? 'bg-sasie-mocca text-white'
              : 'bg-white border border-sasie-dove text-sasie-milo'
          }`}
        >
          Kat
        </button>
        <button
          onClick={() => setSortBy('checkin_time')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium ${
            sortBy === 'checkin_time'
              ? 'bg-sasie-mocca text-white'
              : 'bg-white border border-sasie-dove text-sasie-milo'
          }`}
        >
          Waktu
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-3 mb-2 p-2 rounded-lg text-center text-xs ${
          message.type === 'success'
            ? 'bg-sasie-emerald/20 border border-sasie-emerald/50 text-sasie-emerald'
            : 'bg-sasie-marun/20 border border-sasie-marun/50 text-sasie-marun'
        }`}>
          {message.text}
        </div>
      )}

      {/* Result Count */}
      <p className="px-3 mb-2 text-sasie-milo text-[10px]">
        {filteredGuests.length} tamu
      </p>

      {/* Guest List */}
      <div ref={guestListRef} className="flex-1 overflow-y-auto px-3 pb-4">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sasie-milo text-sm">Tidak ada tamu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                onClick={() => handleCheckIn(guest)}
                className={`glass-card p-3 cursor-pointer transition-all ${
                  guest.status === 'checked_in'
                    ? 'border-sasie-emerald/50 bg-sasie-sage/10'
                    : 'hover:border-sasie-gold/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-sm truncate ${
                        guest.status === 'checked_in'
                          ? 'text-sasie-emerald'
                          : guest.rsvpStatus === 'confirmed'
                          ? 'text-sasie-mocca'
                          : 'text-sasie-mocca/70'
                      }`}
                    >
                      {guest.name}
                    </h3>
                    <p className="text-xs text-sasie-milo/60">
                      #{guest.id} • {guest.category}
                    </p>
                    {guest.rsvpStatus === 'confirmed' && guest.status === 'not_checked_in' && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sasie-emerald/20 text-sasie-emerald border border-sasie-emerald/40 mt-1">
                        ✓ Konfirm
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {guest.status === 'checked_in' ? (
                      <>
                        <div className="text-right mr-1">
                          <p className="text-[10px] text-sasie-emerald">
                            {new Date(guest.checkInTime || '').toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-sasie-marun/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-sasie-marun" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
                          <svg className="w-4 h-4 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-sasie-gold text-white shadow-lg flex items-center justify-center z-50 animate-fade-in hover:bg-sasie-bronze transition-colors"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7h18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default OperatorDashboard;
