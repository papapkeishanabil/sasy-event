import { useState, useMemo } from 'react';
import { Guest } from '../types';

type FilterType = 'all' | 'checked_in' | 'not_checked_in';

interface OperatorDashboardProps {
  guests: Guest[];
  onCheckIn: (id: number) => { success: boolean; alreadyCheckedIn: boolean };
  onBack: () => void;
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ guests, onCheckIn, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredGuests = useMemo(() => {
    let result = guests;

    if (filter === 'checked_in') {
      result = result.filter(g => g.status === 'checked_in');
    } else if (filter === 'not_checked_in') {
      result = result.filter(g => g.status === 'not_checked_in');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.id.toString().includes(query)
      );
    }

    return result;
  }, [guests, searchQuery, filter]);

  const handleCheckIn = (guest: Guest) => {
    const result = onCheckIn(guest.id);

    if (result.alreadyCheckedIn) {
      setMessage({ type: 'error', text: `${guest.name} sudah check-in` });
    } else {
      setMessage({ type: 'success', text: `${guest.name} berhasil check-in!` });
    }

    setTimeout(() => setMessage(null), 2000);
  };

  const getCategoryColor = (category: Guest['category']) => {
    switch (category) {
      case 'VIP': return 'text-sasie-bronze border-sasie-gold/40 bg-sasie-gold/10';
      case 'Speaker': return 'text-sasie-marun border-sasie-terracotta/40 bg-sasie-terracotta/10';
      case 'Media': return 'text-sasie-emerald border-sasie-emerald/40 bg-sasie-sage/20';
      default: return 'text-sasie-milo border-sasie-dove bg-sasie-dove/50';
    }
  };

  const checkedCount = guests.filter(g => g.status === 'checked_in').length;
  const pendingCount = guests.filter(g => g.status === 'not_checked_in').length;
  const vipCheckedCount = guests.filter(g => g.category === 'VIP' && g.status === 'checked_in').length;
  const vipTotalCount = guests.filter(g => g.category === 'VIP').length;

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
          <h2 className="text-xl font-medium text-sasie-mocca">Operator Dashboard</h2>
          <p className="text-xs text-sasie-milo/70">Panel Pantauan Tamu</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-3">
        <div className="glass-card p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-sasie-mocca">{guests.length}</p>
              <p className="text-xs text-sasie-milo/70">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sasie-emerald">{checkedCount}</p>
              <p className="text-xs text-sasie-milo/70">Hadir</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sasie-gold">{vipCheckedCount}/{vipTotalCount}</p>
              <p className="text-xs text-sasie-milo/70">VIP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sasie-terracotta">{pendingCount}</p>
              <p className="text-xs text-sasie-milo/70">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-4 sticky top-0 z-10 bg-sasie-cream/95 backdrop-blur-sm py-2">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-sasie-mocca text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-gold/50'
            }`}
          >
            <div className="text-lg font-bold">{guests.length}</div>
            <div className="text-xs opacity-80">SEMUA</div>
          </button>

          <button
            onClick={() => setFilter('checked_in')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              filter === 'checked_in'
                ? 'bg-sasie-emerald text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-emerald/50'
            }`}
          >
            <div className="text-lg font-bold">{checkedCount}</div>
            <div className="text-xs opacity-80">HADIR</div>
          </button>

          <button
            onClick={() => setFilter('not_checked_in')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              filter === 'not_checked_in'
                ? 'bg-sasie-terracotta text-white shadow-sm'
                : 'bg-white border border-sasie-dove text-sasie-milo hover:border-sasie-terracotta/50'
            }`}
          >
            <div className="text-lg font-bold">{pendingCount}</div>
            <div className="text-xs opacity-80">BELUM</div>
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

        {/* Result Count */}
        <p className="text-sasie-milo text-sm mt-2 text-center">
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
                  guest.status === 'checked_in' ? 'border-sasie-emerald/50 bg-sasie-sage/10' : 'hover:border-sasie-gold/50'
                } ${guest.category === 'VIP' ? 'border-l-4 border-l-sasie-gold' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${guest.status === 'checked_in' ? 'text-sasie-emerald' : 'text-sasie-mocca'} truncate`}>
                        {guest.name}
                      </h3>
                      {guest.category === 'VIP' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sasie-gold/20 text-sasie-bronze border border-sasie-gold/40 flex-shrink-0">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sasie-milo/60 mt-1">##{guest.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {guest.status === 'checked_in' ? (
                      <>
                        <div className="text-center mr-2">
                          <p className="text-xs text-sasie-emerald">{new Date(guest.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sasie-emerald/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-sasie-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(guest.category)}`}>
                          {guest.category}
                        </span>
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                          <svg className="w-5 h-5 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
