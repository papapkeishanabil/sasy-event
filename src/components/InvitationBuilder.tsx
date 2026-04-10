import { useState, useEffect } from 'react';
import { Guest, Event } from '../types';
import { getGuests, getRsvpStats } from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const EVENT_STORAGE_KEY = 'sasie_event_config';

const DEFAULT_EVENT: Event = {
  id: 'sasie-event-2024',
  title: 'SASIENALA x WARDAH',
  description: 'Kami dengan hangat mengundang Anda untuk meluncurkan kolaborasi istimewa bersama Waradah',
  date: 'Minggu, 14 April 2024',
  time: '10:00 - 15:00 WIB',
  location: 'Sasie Nala Boutique',
  locationLat: -6.2088,
  locationLng: 106.8456,
  locationAddress: 'Jl. Kemang Raya No. 123, Jakarta Selatan',
  imageUrl: '/assets/SASIENALA Logo.png'
};

interface InvitationBuilderProps {
  onBack: () => void;
}

export default function InvitationBuilder({ onBack }: InvitationBuilderProps) {
  const [event, setEvent] = useState<Event>(DEFAULT_EVENT);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvpStats, setRsvpStats] = useState({ total: 0, confirmed: 0, declined: 0, maybe: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState<'event' | 'guests' | 'rsvp' | 'send' | 'preview'>('event');
  const [saving, setSaving] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [previewGuestId, setPreviewGuestId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Try loading from Supabase first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', 'default')
          .single();

        if (data && !error) {
          const loadedEvent: Event = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            date: data.date,
            time: data.time,
            location: data.location,
            locationLat: data.location_lat,
            locationLng: data.location_lng,
            locationAddress: data.location_address || '',
            imageUrl: data.image_url || '',
          };
          setEvent(loadedEvent);
          console.log('Event config loaded from Supabase');
        }
      } catch (error) {
        console.error('Error loading event from Supabase:', error);
      }
    }

    // Fallback to localStorage
    try {
      const eventConfig = localStorage.getItem(EVENT_STORAGE_KEY);
      if (eventConfig) {
        setEvent(JSON.parse(eventConfig));
      }
    } catch (error) {
      console.error('Error loading event config from localStorage:', error);
    }

    const loadedGuests = await getGuests();
    setGuests(loadedGuests);
    const stats = await getRsvpStats();
    setRsvpStats(stats);
  };

  const handleEventChange = (field: keyof Event, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEvent = async () => {
    setSaving(true);
    try {
      console.log('=== Saving event config ===');
      console.log('Event data to save:', event);

      // Save to localStorage as backup
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(event));
      console.log('✅ Saved to localStorage');

      // Save to Supabase
      if (isSupabaseConfigured()) {
        console.log('Saving to Supabase...');

        const dbEvent = {
          id: 'default',
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          location_lat: event.locationLat,
          location_lng: event.locationLng,
          location_address: event.locationAddress,
          image_url: event.imageUrl,
        };

        console.log('Supabase data:', dbEvent);

        const { data, error } = await supabase
          .from('events')
          .upsert(dbEvent, { onConflict: 'id' });

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('❌ Error saving to Supabase:', error);
          throw error;
        }
        console.log('✅ Event config saved to Supabase');
      } else {
        console.log('⚠️ Supabase not configured, only saved to localStorage');
      }

      alert('Konfigurasi event berhasil disimpan!');
    } catch (error) {
      console.error('❌ Error saving event config:', error);
      alert('Gagal menyimpan konfigurasi event: ' + (error as any).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleGuestSelection = (guestId: number) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const selectAllGuests = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map(g => g.id));
    }
  };

  const getRsvpStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-sasie-emerald/20 text-sasie-emerald border-sasie-emerald/40';
      case 'declined': return 'bg-sasie-marun/20 text-sasie-marun border-sasie-marun/40';
      case 'maybe': return 'bg-sasie-gold/20 text-sasie-bronze border-sasie-gold/40';
      default: return 'bg-sasie-dove/30 text-sasie-milo border-sasie-dove';
    }
  };

  const getRsvpStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'Hadir';
      case 'declined': return 'Tidak Hadir';
      case 'maybe': return 'Ragu-ragu';
      default: return 'Pending';
    }
  };

  const generateInvitationLink = (guestId: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?rsvp=true&guestId=${guestId}`;
  };

  const copyInvitationLink = (guestId: number) => {
    const link = generateInvitationLink(guestId);
    navigator.clipboard.writeText(link);
    alert('Link undangan berhasil disalin!');
  };

  const copyAllLinks = () => {
    const links = selectedGuests.map(id => {
      const guest = guests.find(g => g.id === id);
      return `${guest?.name || 'Guest'}: ${generateInvitationLink(id)}`;
    }).join('\n');

    navigator.clipboard.writeText(links);
    alert(`Link untuk ${selectedGuests.length} tamu berhasil disalin!`);
  };

  const openWhatsAppInvite = (guest: Guest) => {
    const link = generateInvitationLink(guest.id);

    // Parse event title to get main title and subtitle
    const getEventTitleParts = (fullTitle: string) => {
      // Try to split by × or :
      let parts = fullTitle.split('×');
      if (parts.length === 1) {
        parts = fullTitle.split(':');
      }
      if (parts.length > 1) {
        return {
          main: parts[0].trim(),
          sub: parts[1].trim()
        };
      }
      return { main: fullTitle, sub: '' };
    };

    const { main: mainTitle, sub: subTitle } = getEventTitleParts(event.title);

    const message = encodeURIComponent(
      `Halo *${guest.name}*,\n\n` +
      `We would love to personally invite you to ✨\n\n` +
      `*${mainTitle}*\n` +
      (subTitle ? `_${subTitle}_\n\n` : `\n`) +
      `A special gathering celebrating individuality & self-expression.\n\n` +
      `📅 *${event.date}*\n` +
      `📍 *${event.location}*\n\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `Your personal invitation awaits:\n\n` +
      `${link}\n\n` +
      `Please confirm your attendance by clicking the link above 🙏`
    );

    const phone = guest.phone?.replace(/^0/, '62') || '';
    const url = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(url, '_blank');
  };

  const sendBulkWhatsApp = () => {
    if (selectedGuests.length === 0) {
      alert('Pilih tamu terlebih dahulu');
      return;
    }

    alert(
      `Fitur kirim massal akan membuka ${selectedGuests.length} tab WhatsApp.\n\n` +
      `Klik OK untuk melanjutkan.`
    );

    selectedGuests.forEach((id, index) => {
      setTimeout(() => {
        const guest = guests.find(g => g.id === id);
        if (guest) {
          openWhatsAppInvite(guest);
        }
      }, index * 500);
    });
  };

  return (
    <div className="min-h-screen bg-sasie-cream">
      {/* Header */}
      <div className="bg-sasie-mocca text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-2 hover:bg-sasie-brown rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold">Invitation Builder</h1>
              <p className="text-sasie-dove text-sm">Kelola Undangan Digital</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('event')}
            className={`px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
              activeTab === 'event'
                ? 'bg-sasie-mocca text-white shadow-md'
                : 'bg-white text-sasie-mocca border border-sasie-dove hover:border-sasie-gold'
            }`}
          >
            <span className="mr-2">📋</span> Event
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
              activeTab === 'guests'
                ? 'bg-sasie-mocca text-white shadow-md'
                : 'bg-white text-sasie-mocca border border-sasie-dove hover:border-sasie-gold'
            }`}
          >
            <span className="mr-2">👥</span> Daftar Tamu <span className="ml-1 px-2 py-0.5 rounded-full bg-sasie-gold/20 text-sasie-bronze text-xs">{guests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('rsvp')}
            className={`px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
              activeTab === 'rsvp'
                ? 'bg-sasie-mocca text-white shadow-md'
                : 'bg-white text-sasie-mocca border border-sasie-dove hover:border-sasie-gold'
            }`}
          >
            <span className="mr-2">✅</span> RSVP
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
              activeTab === 'send'
                ? 'bg-sasie-mocca text-white shadow-md'
                : 'bg-white text-sasie-mocca border border-sasie-dove hover:border-sasie-gold'
            }`}
          >
            <span className="mr-2">📤</span> Kirim
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-sasie-emerald text-white shadow-md'
                : 'bg-white text-sasie-emerald border border-sasie-dove hover:border-sasie-emerald'
            }`}
          >
            <span className="mr-2">👁️</span> Preview
          </button>
        </div>

        {/* Event Tab */}
        {activeTab === 'event' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6">
            <h2 className="text-lg font-semibold text-sasie-mocca mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sasie-gold/20 flex items-center justify-center">📋</span>
              Konfigurasi Event
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sasie-mocca mb-2">Judul Event</label>
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => handleEventChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sasie-mocca mb-2">Deskripsi</label>
                <textarea
                  value={event.description}
                  onChange={(e) => handleEventChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sasie-mocca mb-2">Tanggal</label>
                  <input
                    type="text"
                    value={event.date}
                    onChange={(e) => handleEventChange('date', e.target.value)}
                    placeholder="Contoh: Minggu, 14 April 2024"
                    className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sasie-mocca mb-2">Waktu</label>
                  <input
                    type="text"
                    value={event.time}
                    onChange={(e) => handleEventChange('time', e.target.value)}
                    placeholder="Contoh: 10:00 - 15:00 WIB"
                    className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sasie-mocca mb-2">Nama Lokasi</label>
                <input
                  type="text"
                  value={event.location}
                  onChange={(e) => handleEventChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sasie-mocca mb-2">Alamat Lengkap</label>
                <textarea
                  value={event.locationAddress || ''}
                  onChange={(e) => handleEventChange('locationAddress', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sasie-mocca mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={event.locationLat || ''}
                    onChange={(e) => handleEventChange('locationLat', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sasie-mocca mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={event.locationLng || ''}
                    onChange={(e) => handleEventChange('locationLng', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sasie-mocca mb-2">URL Gambar Banner</label>
                <input
                  type="text"
                  value={event.imageUrl || ''}
                  onChange={(e) => handleEventChange('imageUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-gold/50 focus:border-sasie-gold transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleSaveEvent}
                  disabled={saving}
                  className="col-span-2 bg-sasie-mocca hover:bg-sasie-brown disabled:bg-sasie-milo/30 text-white font-semibold py-4 px-6 rounded-xl transition shadow-md hover:shadow-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
                <button
                  onClick={() => {
                    if (guests.length > 0) {
                      setPreviewGuestId(guests[0].id);
                      setActiveTab('preview');
                    } else {
                      alert('Belum ada tamu. Import tamu terlebih dahulu.');
                    }
                  }}
                  className="bg-sasie-emerald hover:bg-sasie-emerald/90 text-white font-semibold py-4 px-6 rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-sasie-mocca flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sasie-gold/20 flex items-center justify-center">👥</span>
                Daftar Tamu
              </h2>
              <button
                onClick={selectAllGuests}
                className="text-sm text-sasie-mocca hover:text-sasie-brown font-medium"
              >
                {selectedGuests.length === guests.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {guests.length === 0 ? (
                <p className="text-center text-sasie-milo/70 py-8">Belum ada tamu. Import tamu terlebih dahulu di Admin Panel.</p>
              ) : (
                guests.map(guest => (
                  <div
                    key={guest.id}
                    onClick={() => toggleGuestSelection(guest.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedGuests.includes(guest.id)
                        ? 'border-sasie-gold bg-sasie-gold/10'
                        : 'border-sasie-dove hover:border-sasie-gold/50 bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={() => toggleGuestSelection(guest.id)}
                          className="w-5 h-5 text-sasie-gold rounded focus:ring-sasie-gold"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p className="font-medium text-sasie-mocca">{guest.name}</p>
                          <p className="text-sm text-sasie-milo/70">{guest.category} • ID: {guest.id}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRsvpStatusColor(guest.rsvpStatus)}`}>
                        {getRsvpStatusText(guest.rsvpStatus)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* RSVP Tab */}
        {activeTab === 'rsvp' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6">
            <h2 className="text-lg font-semibold text-sasie-mocca mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sasie-gold/20 flex items-center justify-center">✅</span>
              Statistik RSVP
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-sasie-mocca rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-white">{rsvpStats.total}</p>
                <p className="text-sm text-sasie-dove">Total Undangan</p>
              </div>
              <div className="bg-sasie-emerald rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-white">{rsvpStats.confirmed}</p>
                <p className="text-sm text-sasie-green-light">Konfirmasi Hadir</p>
              </div>
              <div className="bg-sasie-gold rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-white">{rsvpStats.maybe}</p>
                <p className="text-sm text-sasie-gold-light">Masih Ragu</p>
              </div>
              <div className="bg-sasie-marun rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-white">{rsvpStats.declined}</p>
                <p className="text-sm text-sasie-terracotta">Tidak Hadir</p>
              </div>
            </div>

            <div className="bg-sasie-cream rounded-xl p-5 text-center border border-sasie-dove">
              <p className="text-3xl font-bold text-sasie-milo">{rsvpStats.pending}</p>
              <p className="text-sm text-sasie-mocca">Belum Konfirmasi</p>
            </div>

            {/* Response Rate */}
            <div className="mt-6">
              <h3 className="font-semibold text-sasie-mocca mb-3">Tingkat Respon</h3>
              <div className="w-full bg-sasie-dove rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sasie-emerald to-sasie-green-light h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${rsvpStats.total > 0 ? ((rsvpStats.confirmed + rsvpStats.declined + rsvpStats.maybe) / rsvpStats.total) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-sm text-sasie-milo mt-2">
                {rsvpStats.total > 0
                  ? Math.round(((rsvpStats.confirmed + rsvpStats.declined + rsvpStats.maybe) / rsvpStats.total) * 100)
                  : 0}% sudah merespon
              </p>
            </div>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6">
            <h2 className="text-lg font-semibold text-sasie-mocca mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sasie-gold/20 flex items-center justify-center">📤</span>
              Kirim Undangan
            </h2>

            <div className="mb-6 p-4 bg-sasie-gold/10 rounded-xl border border-sasie-gold/30">
              <p className="text-sm text-sasie-mocca">
                <strong>Terpilih:</strong> {selectedGuests.length} dari {guests.length} tamu
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={sendBulkWhatsApp}
                disabled={selectedGuests.length === 0}
                className="w-full bg-sasie-emerald hover:bg-sasie-emerald/90 disabled:bg-sasie-milo/30 text-white font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Kirim via WhatsApp ({selectedGuests.length})
              </button>

              <button
                onClick={copyAllLinks}
                disabled={selectedGuests.length === 0}
                className="w-full bg-sasie-mocca hover:bg-sasie-brown disabled:bg-sasie-milo/30 text-white font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin Link Undangan ({selectedGuests.length})
              </button>
            </div>

            {/* Individual Guest Actions */}
            {selectedGuests.length > 0 && (
              <div className="mt-6 border-t border-sasie-dove pt-6">
                <h3 className="font-semibold text-sasie-mocca mb-4">Aksi Per Tamu</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedGuests.map(id => {
                    const guest = guests.find(g => g.id === id);
                    return guest ? (
                      <div key={guest.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-sasie-dove">
                        <span className="text-sm font-medium text-sasie-mocca">{guest.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyInvitationLink(guest.id)}
                            className="px-3 py-1.5 text-xs bg-sasie-mocca/10 text-sasie-mocca rounded-lg hover:bg-sasie-mocca/20 transition font-medium"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => openWhatsAppInvite(guest)}
                            className="px-3 py-1.5 text-xs bg-sasie-emerald/10 text-sasie-emerald rounded-lg hover:bg-sasie-emerald/20 transition font-medium"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div>
            {/* Preview Controls */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6 mb-4">
              <h2 className="text-lg font-semibold text-sasie-mocca mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sasie-emerald/20 flex items-center justify-center">👁️</span>
                Preview Undangan
              </h2>

              <p className="text-sasie-milo/70 text-sm mb-4">
                Pilih tamu untuk melihat preview undangan yang akan diterima.
              </p>

              <div className="flex flex-wrap gap-2">
                <label className="text-sm text-sasie-mocca font-medium self-center mr-2">Pilih Tamu:</label>
                <select
                  value={previewGuestId || ''}
                  onChange={(e) => setPreviewGuestId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-sasie-dove rounded-xl focus:outline-none focus:ring-2 focus:ring-sasie-emerald/50 focus:border-sasie-emerald transition"
                >
                  <option value="">-- Pilih Tamu --</option>
                  {guests.map(guest => (
                    <option key={guest.id} value={guest.id}>
                      {guest.name} ({guest.category})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (previewGuestId) {
                      const link = generateInvitationLink(previewGuestId);
                      window.open(link, '_blank');
                    }
                  }}
                  disabled={!previewGuestId}
                  className="px-4 py-2 bg-sasie-emerald hover:bg-sasie-emerald/90 disabled:bg-sasie-milo/30 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Buka di Tab Baru
                </button>
              </div>

              {/* Preview Link */}
              {previewGuestId && (
                <div className="mt-4 p-4 bg-sasie-cream rounded-xl border border-sasie-dove">
                  <p className="text-xs text-sasie-milo/70 mb-1">Link Undangan:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-sasie-mocca bg-white px-3 py-2 rounded-lg overflow-hidden text-ellipsis">
                      {generateInvitationLink(previewGuestId)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateInvitationLink(previewGuestId));
                        alert('Link berhasil disalin!');
                      }}
                      className="px-3 py-2 bg-sasie-mocca hover:bg-sasie-brown text-white rounded-lg text-xs font-medium transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Preview Frame */}
            {previewGuestId && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sasie-mocca">Live Preview</h3>
                  <span className="text-xs text-sasie-milo/70">Mobile View</span>
                </div>

                {/* Phone Frame */}
                <div className="mx-auto max-w-sm bg-sasie-cream rounded-3xl border-8 border-sasie-mocca overflow-hidden shadow-2xl">
                  {/* Phone Notch */}
                  <div className="bg-sasie-mocca h-6 flex justify-center">
                    <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                  </div>

                  {/* Preview Content */}
                  <div className="h-[500px] overflow-y-auto">
                    {/* Opening Screen Preview */}
                    <div className="bg-sasie-cream p-6 text-center min-h-full flex flex-col items-center justify-center">
                      {/* Floating Orbs */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-10 left-5 w-32 h-32 bg-sasie-gold/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-10 right-5 w-40 h-40 bg-sasie-mocca/10 rounded-full blur-2xl"></div>
                      </div>

                      {/* Logo */}
                      <div className="mb-6">
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt="Event"
                            className="h-12 mx-auto mb-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        {/* Show event title if it contains × */}
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-px w-8 bg-sasie-gold/50"></div>
                          <span className="text-sasie-gold text-sm">×</span>
                          <div className="h-px w-8 bg-sasie-gold/50"></div>
                        </div>
                        <p className="text-sasie-mocca text-sm mt-2">
                          {event.title.includes('×')
                            ? event.title.split('×')[1]?.trim() || event.title
                            : event.title}
                        </p>
                      </div>

                      {/* Title */}
                      <h1 className="text-xl font-light text-sasie-mocca mb-1">You're Invited</h1>
                      <p className="text-sasie-milo/70 text-xs mb-6 tracking-widest uppercase">Digital Invitation</p>

                      {/* Open Button */}
                      <button className="px-8 py-3 bg-sasie-mocca text-white rounded-xl text-sm font-medium shadow-lg">
                        Open Invitation
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Info */}
                <div className="mt-4 p-4 bg-sasie-gold/10 rounded-xl border border-sasie-gold/30">
                  <p className="text-xs text-sasie-mocca">
                    <strong>Tips:</strong> Klik "Buka di Tab Baru" untuk melihat preview full interaktif dengan semua fitur (RSVP, QR Code, dll).
                  </p>
                </div>
              </div>
            )}

            {/* No Guest Selected */}
            {!previewGuestId && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sasie-dove p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sasie-dove/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sasie-milo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-sasie-mocca mb-2">Pilih Tamu untuk Preview</h3>
                <p className="text-sasie-milo/70 text-sm">
                  Pilih nama tamu dari dropdown di atas untuk melihat preview undangan yang akan diterima.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
