import { useState, useMemo } from 'react';
import { Guest } from '../types';

interface SearchScreenProps {
  guests: Guest[];
  onCheckIn: (id: number) => Promise<{ success: boolean; alreadyCheckedIn: boolean }>;
  onBack: () => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ guests, onCheckIn, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Only show guests when searching - no browsing allowed
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return []; // Empty when no search - privacy first
    }
    const query = searchQuery.toLowerCase().trim();

    // Prioritize exact matches, then partial matches
    const exactMatches = guests.filter(guest =>
      guest.name.toLowerCase() === query
    );

    // If exact match found, only show that (for privacy)
    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // For partial matches, require minimum 3 characters
    if (query.length < 3) {
      return [];
    }

    // Partial match - but only show if few results to avoid listing too many names
    const partialMatches = guests.filter(guest =>
      guest.name.toLowerCase().includes(query)
    );

    // If more than 3 partial matches, don't show any (too many = privacy issue)
    if (partialMatches.length > 3) {
      return [];
    }

    return partialMatches;
  }, [guests, searchQuery]);

  const handleCheckIn = async (guest: Guest) => {
    const result = await onCheckIn(guest.id);

    if (result.alreadyCheckedIn) {
      setMessage({ type: 'error', text: `${guest.name} sudah check-in sebelumnya` });
    } else {
      setMessage({ type: 'success', text: `${guest.name} berhasil check-in!` });
      // Clear search after successful check-in for privacy
      setTimeout(() => {
        setSearchQuery('');
      }, 2000);
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const getCategoryStyle = (category: Guest['category']) => {
    switch (category) {
      case 'VIP': return 'bg-gradient-to-r from-sasie-gold/20 to-sasie-bronze/20 text-sasie-bronze border-sasie-gold/40 shadow-lg shadow-sasie-gold/10';
      case 'Speaker': return 'bg-gradient-to-r from-sasie-terracotta/20 to-sasie-marun/20 text-sasie-marun border-sasie-terracotta/40 shadow-lg shadow-sasie-terracotta/10';
      case 'Media': return 'bg-gradient-to-r from-sasie-sage/30 to-sasie-emerald/20 text-sasie-emerald border-sasie-emerald/40 shadow-lg shadow-sasie-emerald/10';
      default: return 'bg-sasie-dove/60 text-sasie-milo border-sasie-dove';
    }
  };

  return (
    <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col bg-sasie-cream">
      {/* Premium Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-3 rounded-2xl bg-white border border-sasie-dove shadow-sm hover:shadow-md hover:border-sasie-gold/30 transition-all duration-300"
        >
          <svg className="w-5 h-5 text-sasie-mocca" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium text-sasie-mocca tracking-wide">Guest Check-In</h2>
          <p className="text-[10px] text-sasie-milo/60 tracking-wider">WELCOME</p>
        </div>
        <div className="w-12"></div>
      </div>

      {/* Welcome Instructions */}
      {!searchQuery && (
        <div className="px-6 py-10 text-center animate-fade-in">
          {/* Animated Icon */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-sasie-gold/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-sasie-gold to-sasie-bronze p-1 shadow-xl shadow-sasie-gold/30">
              <div className="w-full h-full bg-sasie-cream rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-sasie-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-light text-sasie-mocca mb-3 tracking-wide">
            Selamat Datang
          </h3>
          <p className="text-sasie-milo/70 mb-8 text-sm">Silakan cari nama Anda untuk check-in</p>

          {/* Premium Info Cards */}
          <div className="glass-card p-5 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sasie-gold/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sasie-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sasie-mocca text-sm">Ketik nama Anda</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sasie-emerald/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sasie-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sasie-mocca text-sm">Tap nama untuk check-in</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sasie-terracotta/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sasie-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sasie-mocca text-sm">Privasi Anda terjaga</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Search Bar */}
      <div className="px-4 sticky top-0 z-10 bg-sasie-cream/95 backdrop-blur-sm py-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-sasie-gold/20 via-sasie-gold/10 to-sasie-gold/20 rounded-2xl blur-xl"></div>
          <div className="relative flex items-center">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sasie-milo/50 z-10"
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
              placeholder="Cari nama Anda..."
              className="input-field w-full pl-12 py-3 text-base bg-white/90 backdrop-blur-sm border-sasie-dove/50 shadow-sm"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sasie-milo/50 hover:text-sasie-mocca p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`mx-4 mt-3 p-4 rounded-2xl text-center animate-slide-up shadow-lg ${
          message.type === 'success'
            ? 'bg-gradient-to-r from-sasie-emerald/20 to-sasie-sage/20 border border-sasie-emerald/50 text-sasie-emerald shadow-sasie-emerald/10'
            : 'bg-gradient-to-r from-sasie-marun/20 to-sasie-terracotta/20 border border-sasie-marun/50 text-sasie-marun shadow-sasie-marun/10'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sasie-dove/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-sasie-milo/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sasie-milo/60 text-base">Nama tidak ditemukan</p>
              <p className="text-sasie-milo/40 text-sm mt-2">Silakan hubungi panitia</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sasie-milo/60 text-sm text-center tracking-wide">
                {searchResults.length} TAMU DITEMUKAN
              </p>
              {searchResults.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => handleCheckIn(guest)}
                  className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                    guest.status === 'checked_in'
                      ? 'bg-gradient-to-br from-sasie-emerald/10 to-sasie-sage/10 border border-sasie-emerald/30 shadow-md'
                      : 'bg-white/80 backdrop-blur-sm border border-sasie-dove hover:border-sasie-gold/40 hover:shadow-lg shadow-sm'
                  } ${guest.category === 'VIP' ? 'ring-2 ring-sasie-gold/30' : ''}`}
                >
                  {/* Subtle shine effect */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base mb-2 ${
                        guest.status === 'checked_in' ? 'text-sasie-emerald' : 'text-sasie-mocca'
                      }`}>
                        {guest.name}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryStyle(guest.category)}`}>
                        {guest.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {guest.status === 'checked_in' ? (
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sasie-emerald/20 to-sasie-emerald/10 flex items-center justify-center shadow-inner">
                            <svg className="w-8 h-8 text-sasie-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sasie-emerald text-xs mt-2 font-medium">Checked</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sasie-gold to-sasie-bronze flex items-center justify-center shadow-lg shadow-sasie-gold/30">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sasie-gold text-xs mt-2 font-medium">Tap</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {guest.checkInTime && (
                    <p className="text-xs text-sasie-emerald/80 mt-3 text-center font-medium">
                      Check-in: {new Date(guest.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchScreen;
