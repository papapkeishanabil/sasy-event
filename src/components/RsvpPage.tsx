import { useState, useEffect } from 'react';
import { Guest, Event } from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import QRCode from 'qrcode';

interface RsvpPageProps {
  guestId?: number;
  onBack?: () => void;
}

// Default event configuration
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
  imageUrl: '/assets/LOGO SASIENALA 2023 BLACK-3.png'
};

const EVENT_STORAGE_KEY = 'sasie_event_config';

export default function RsvpPage({ guestId }: RsvpPageProps) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event>(DEFAULT_EVENT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [opened, setOpened] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Load event data FIRST, then guest data
    const loadAllData = async () => {
      await loadEventData();
      await loadGuestData();
    };
    loadAllData();
  }, [guestId]);

  // Generate QR code when showQr is true and guest exists
  useEffect(() => {
    const generateQRCode = async () => {
      if (showQr && guest && !qrCodeDataUrl) {
        try {
          const qrData = JSON.stringify({ id: guest.id, name: guest.name });
          const qrUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#8B4513',
              light: '#FFFFFF'
            }
          });
          setQrCodeDataUrl(qrUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };
    generateQRCode();
  }, [showQr, guest]);

  const loadEventData = async () => {
    console.log('=== Loading event data ===');

    // Try loading from Supabase first
    if (isSupabaseConfigured()) {
      try {
        console.log('Fetching from Supabase...');
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', 'default')
          .single();

        console.log('Supabase response:', { data, error });

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
          console.log('✅ Loaded event config from Supabase:', loadedEvent);
          setEvent(loadedEvent);
          return;
        }
      } catch (supabaseError) {
        console.log('❌ Could not load event from Supabase:', supabaseError);
      }
    } else {
      console.log('⚠️ Supabase not configured');
    }

    // Try loading from JSON file (for deployed version)
    try {
      const response = await fetch('/event-config.json');
      if (response.ok) {
        const jsonEvent = await response.json();
        console.log('Loaded event config from JSON file:', jsonEvent);
        setEvent(jsonEvent);
        return;
      }
    } catch (jsonError) {
      console.log('Could not load event-config.json, trying localStorage...');
    }

    // Fallback to localStorage
    const eventConfig = localStorage.getItem(EVENT_STORAGE_KEY);
    console.log('Loading event config from localStorage:', eventConfig);

    if (eventConfig) {
      const savedEvent = JSON.parse(eventConfig);
      console.log('Parsed event config:', savedEvent);

      // Merge with defaults to ensure all fields exist
      const mergedEvent = {
        ...DEFAULT_EVENT,
        ...savedEvent
      };

      console.log('Final event config:', mergedEvent);
      setEvent(mergedEvent);
    } else {
      console.log('No event config found, using default');
      setEvent(DEFAULT_EVENT);
    }
  };

  const loadGuestData = async () => {
    try {
      if (guestId) {
        const { getGuestById } = await import('../utils/storage');
        const foundGuest = await getGuestById(guestId);
        setGuest(foundGuest);
      }
    } catch (error) {
      console.error('Error loading guest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvitation = () => {
    setOpened(true);
  };

  const handleRsvp = async (status: 'confirmed' | 'declined' | 'maybe') => {
    if (!guest) return;

    setSubmitting(true);
    try {
      const { updateGuestRsvp } = await import('../utils/storage');
      const updatedGuest = await updateGuestRsvp(guest.id, status);

      if (updatedGuest) {
        setGuest(updatedGuest);

        if (status === 'confirmed') {
          // Generate QR Code with guest data
          const qrData = JSON.stringify({ id: updatedGuest.id, name: updatedGuest.name });
          const qrUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#8B4513',
              light: '#FFFFFF'
            }
          });
          setQrCodeDataUrl(qrUrl);
          setTimeout(() => setShowQr(true), 500);
        } else {
          setTimeout(() => setShowDeclined(true), 500);
        }
      }
    } catch (error) {
      console.error('Error saving RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openGoogleMaps = () => {
    if (event.locationLat && event.locationLng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${event.locationLat},${event.locationLng}`;
      window.open(url, '_blank');
    } else if (event.locationAddress) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationAddress)}`;
      window.open(url, '_blank');
    }
  };

  const getRsvpStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-sage-green/20 text-sage-green-dark border-sage-green/40';
      case 'declined': return 'bg-dusty-rose/30 text-mahogany-brown border-dusty-rose/50';
      case 'maybe': return 'bg-champagne-gold/20 text-mahogany-brown border-champagne-gold/40';
      default: return 'bg-blush-pink/30 text-mahogany-brown/70 border-blush-pink-dark/30';
    }
  };

  const getRsvpStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'declined': return 'Declined';
      case 'maybe': return 'Maybe';
      default: return 'Pending';
    }
  };

  // Opening Screen
  if (!opened) {
    // Show loading state if event data hasn't loaded yet
    if (event.title === DEFAULT_EVENT.title) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8E8E8 0%, #FCF0F0 50%, #FFFEF9 100%)' }}>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-champagne-gold border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-mahogany-brown text-sm sm:text-base">Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8E8E8 0%, #FCF0F0 50%, #FFFEF9 100%)' }}>
        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-12 sm:top-20 left-6 sm:left-10 w-40 h-40 sm:w-64 sm:h-64 bg-champagne-gold/10 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
          <div className="absolute bottom-12 sm:bottom-20 right-6 sm:right-10 w-48 h-48 sm:w-80 sm:h-80 bg-sage-green/10 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-dusty-rose/5 rounded-full blur-xl sm:blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt="Event"
                className="h-12 sm:h-16 mx-auto mb-3 sm:mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Try fallback logo
                  target.src = '/assets/LOGO SASIENALA 2023 BLACK-3.png';
                }}
              />
            )}
            {!event.imageUrl && (
              <img
                src="/assets/LOGO SASIENALA 2023 BLACK-3.png"
                alt="SASIENALA"
                className="h-12 sm:h-16 mx-auto mb-3 sm:mb-4"
              />
            )}
            {event.title.includes('×') && (
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="h-px w-8 sm:w-12 bg-champagne-gold/50"></div>
                <span className="text-champagne-gold text-base sm:text-lg">×</span>
                <div className="h-px w-8 sm:w-12 bg-champagne-gold/50"></div>
              </div>
            )}
            {/* Show event title */}
            {(() => {
              const title = event.title;
              const hasColorOfUs = title.toLowerCase().includes('color of us') ||
                                   title.toLowerCase().includes('color') ||
                                   title.includes('COLOR');

              if (hasColorOfUs) {
                // Extract the part before "Color Of Us"
                let prefix = '';
                if (title.includes('-')) {
                  prefix = title.split('-')[1]?.trim() || '';
                } else if (title.includes(':')) {
                  prefix = title.split(':')[1]?.trim() || '';
                } else if (title.toLowerCase().includes('color of us')) {
                  const parts = title.split(/color of us/i);
                  prefix = parts[1]?.trim() || parts[0]?.trim().replace(/color/i, '').trim() || '';
                }

                return (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    {prefix && (
                      <p className="text-mahogany-brown text-base sm:text-lg mt-2 sm:mt-3 font-medium">
                        {prefix}
                      </p>
                    )}
                    <p className="color-of-us-text text-3xl sm:text-4xl md:text-5xl font-bold text-champagne-gold leading-tight" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                      Color Of Us
                    </p>
                  </div>
                );
              }

              return (
                <p className="text-mahogany-brown text-lg sm:text-xl mt-2 sm:mt-3 font-medium">
                  {title.includes('×') ? title.split('×')[1]?.trim() || title : title}
                </p>
              );
            })()}
          </div>

          {/* Title */}
          <h1 className="font-elegant text-2xl sm:text-3xl font-light text-mahogany-brown mb-2 tracking-wide">You're Invited</h1>

          {/* Color Of Us - Dancing Script */}
          <p className="color-of-us-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-champagne-gold leading-tight mb-3 sm:mb-4 -mt-1" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '0 2px 12px rgba(212, 175, 55, 0.5)' }}>
            Color Of Us
          </p>

          <p className="text-sage-green/70 text-xs sm:text-sm mb-8 sm:mb-12 tracking-widest uppercase">Digital Invitation</p>

          {/* Open Button */}
          <button
            onClick={handleOpenInvitation}
            className="group relative px-8 sm:px-12 py-3 sm:py-4 bg-mahogany-brown text-white rounded-xl sm:rounded-2xl font-medium overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <span className="relative z-10 flex items-center gap-2 sm:gap-3">
              Open Invitation
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-champagne-gold via-champagne-gold-light to-champagne-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8E8E8 0%, #FCF0F0 50%, #FFFEF9 100%)' }}>
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-champagne-gold border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-mahogany-brown text-sm sm:text-base">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Main Invitation
  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #F8E8E8 0%, #FCF0F0 50%, #FFFEF9 100%)' }}>
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-champagne-gold/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-champagne-gold/30 to-transparent"></div>
      </div>

      {/* Floating Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-24 sm:top-32 right-6 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-champagne-gold/5 rounded-full blur-xl sm:blur-2xl"></div>
        <div className="absolute bottom-32 sm:bottom-40 left-6 sm:left-10 w-28 h-28 sm:w-40 sm:h-40 bg-sage-green/5 rounded-full blur-xl sm:blur-2xl"></div>
      </div>

      {/* Content - Responsive */}
      <div className="relative z-10 mx-auto px-4 py-6 sm:px-6 sm:py-8 md:py-12 max-w-2xl lg:max-w-4xl">
        {/* Guest Name - MOVED TO TOP */}
        {guest && (
          <div className="text-center mb-6 sm:mb-8 animate-slide-up">
            <p className="font-elegant italic text-sage-green/70 text-xs sm:text-sm mb-1.5 sm:mb-2">Dear Sassyfriend</p>

            {/* Guest Name - Block display */}
            <div className="mb-3 sm:mb-4">
              <h2 className="guest-name font-elegant text-xl sm:text-2xl md:text-3xl font-semibold relative inline-block">
                <span className="relative inline-block">
                  {/* Gold 3D Effect for Guest Name */}
                  <span className="relative z-10 bg-gradient-to-br from-champagne-gold via-mahogany-brown to-champagne-gold bg-clip-text text-transparent drop-shadow-lg"
                        style={{
                          WebkitTextStroke: '0.5px rgba(212, 175, 55, 0.2)',
                          textShadow: '0 1px 2px rgba(212, 175, 55, 0.2), 0 2px 4px rgba(212, 175, 55, 0.1)',
                          filter: 'drop-shadow(0 1px 1px rgba(212, 175, 55, 0.3))'
                        }}>
                    {guest.name}
                  </span>
                  {/* Shimmer overlay */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded"
                        style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 3s ease-in-out infinite'
                        }}>
                  </span>
                </span>
              </h2>
            </div>

            {/* Badges below name - Separate row */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border bg-cream-ivory/60 backdrop-blur-sm">
              {/* Category badge (VIP first if VIP) */}
              <span className="text-mahogany-brown text-[10px] sm:text-xs font-medium">{guest.category}</span>
              <span className="text-sage-green text-[10px] sm:text-xs">•</span>
              <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${getRsvpStatusColor(guest.rsvpStatus)}`}>
                {getRsvpStatusText(guest.rsvpStatus)}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-champagne-gold/50 to-transparent"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-champagne-gold"></div>
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-champagne-gold/50 to-transparent"></div>
          </div>

          <p className="font-elegant text-sage-green/70 text-xs sm:text-sm tracking-widest uppercase mb-2 sm:mb-3">You Are Invited To</p>

          {/* Event Title */}
          <h1 className="event-title font-elegant text-lg sm:text-xl md:text-2xl font-semibold text-mahogany-brown tracking-wide mb-2">
            {event.title}
          </h1>

          {/* Color Of Us - Always displayed with Dancing Script */}
          <p className="color-of-us-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-champagne-gold leading-tight -mt-2 sm:-mt-3 mb-3" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '0 2px 12px rgba(212, 175, 55, 0.4)' }}>
            Color Of Us
          </p>

          <p className="text-sage-green text-xs sm:text-sm mt-1.5 sm:mt-2 whitespace-pre-line">{event.description || 'Launch Event'}</p>

          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-champagne-gold/50 to-transparent"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-champagne-gold"></div>
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent via-champagne-gold/50 to-transparent"></div>
          </div>
        </header>

        {/* Event Details */}
        <section className="bg-cream-ivory/70 backdrop-blur-sm rounded-2xl border border-blush-pink-dark/20 p-4 sm:p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-3 sm:space-y-5">
            {/* Date */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-champagne-gold/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-sage-green/70 uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-sm sm:text-base text-mahogany-brown font-medium">{event.date}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-champagne-gold/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-sage-green/70 uppercase tracking-wider mb-0.5">Time</p>
                <p className="text-sm sm:text-base text-mahogany-brown font-medium">{event.time}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-champagne-gold/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-sage-green/70 uppercase tracking-wider mb-0.5">Location</p>
                <p className="text-sm sm:text-base text-mahogany-brown font-medium">{event.location}</p>
                {event.locationAddress && (
                  <p className="text-sage-green/70 text-xs sm:text-sm mt-0.5">{event.locationAddress}</p>
                )}
                <button
                  onClick={openGoogleMaps}
                  className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-champagne-gold hover:text-champagne-gold-dark transition"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Special Guest Experience */}
        <section className="bg-cream-ivory/70 backdrop-blur-sm rounded-2xl border border-blush-pink-dark/20 p-4 sm:p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-elegant text-sm font-semibold text-mahogany-brown mb-3 sm:mb-4">As our special guest, you will experience:</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-sage-green">
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong className="text-mahogany-brown">Interactive Booth Experience</strong><br/>Discover your true color and explore your personal style<br/>with Sasienala & Wardah Beauty</p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong className="text-mahogany-brown">Talk Show Session: Find Your Color</strong><br/>
                – Personal Color Analysis Demo by Wardah<br/>
                – Body Shape Analysis by Sasienala</p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong className="text-mahogany-brown">Exclusive First Look</strong><br/>Laras Raya Collection by Sasienala</p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong>Curated Goodie Bag</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong>Food & Beverages</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p><strong>Games & Special Surprises</strong></p>
            </div>
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-blush-pink-dark/30">
              <span>🎁</span>
              <p><strong className="text-mahogany-brown">A little something special:</strong><br/>
              A chance to win a <strong>Wardah Personal Color Analysis Ticket</strong><br/>
              — thoughtfully prepared for our guests</p>
            </div>
          </div>
        </section>

        {/* Dress Code */}
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          {/* Header with Icon */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-champagne-gold to-mahogany-brown flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h3 className="font-elegant text-sm font-semibold text-mahogany-brown">Dress Code</h3>
              <p className="text-xs text-sage-green/70">Your Personal Palette</p>
            </div>
          </div>

          {/* Main Message */}
          <div className="bg-gradient-to-r from-blush-pink-light to-cream-ivory rounded-xl p-4 mb-4 shadow-sm border border-blush-pink-dark/20">
            <p className="text-sm text-mahogany-brown text-center">
              ✨ Come dressed in any color that makes you feel confident! ✨
            </p>
          </div>

          {/* Color Palette Showcase */}
          <div className="bg-cream-ivory rounded-xl p-4 shadow-sm border border-champagne-gold/20 mb-4">
            <p className="text-xs font-medium text-sage-green/80 mb-3 text-center">Express Your True Colors</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Rose</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Amber</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Emerald</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Sky</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Violet</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md mb-1"></div>
                <span className="text-[9px] text-sage-green/60">Orange</span>
              </div>
            </div>
          </div>

          {/* Exclusions - More Gentle Design */}
          <div className="bg-gradient-to-r from-dusty-rose/10 to-blush-pink/30 rounded-xl p-3 border border-dusty-rose/20">
            <div className="flex items-start gap-2">
              <span className="text-lg">💝</span>
              <div>
                <p className="text-xs font-medium text-mahogany-brown mb-1">Kindly Avoid:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-black text-white text-[9px] rounded-full">Black</span>
                  <span className="px-2 py-1 bg-pink-200 text-pink-800 text-[9px] rounded-full">Soft Pink</span>
                  <span className="px-2 py-1 bg-orange-200 text-orange-800 text-[9px] rounded-full">Soft Salmon</span>
                  <span className="px-2 py-1 bg-red-800 text-white text-[9px] rounded-full">Burgundy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RSVP Section - Hide if already responded */}
        {guest && !guest.rsvpStatus && !showQr && !showDeclined && (
          <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {/* Label */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="h-px w-8 sm:w-12 bg-champagne-gold/40"></div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-champagne-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <div className="h-px w-8 sm:w-12 bg-champagne-gold/40"></div>
              </div>
              <p className="text-mahogany-brown font-medium text-sm">Kindly confirm your attendance through the button below</p>
            </div>

            {/* Yes Button - Shiny Gold */}
            <button
              onClick={() => handleRsvp('confirmed')}
              disabled={submitting}
              className="group relative w-full mb-2.5 sm:mb-3 overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

              {/* Gold Gradient Background */}
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-champagne-gold via-mahogany-brown to-champagne-gold bg-[length:200%_100%]"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>

                {/* Button Content */}
                <div className="relative py-3.5 sm:py-5 px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 group-hover:scale-[1.02]">
                  {/* Icon Circle */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/40">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm sm:text-base">I would be delighted to attend</p>
                    <p className="text-white/80 text-xs">I look forward to seeing you</p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-champagne-gold/40 via-champagne-gold/20 to-champagne-gold/40 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>

            {/* No Button - Elegant Muted */}
            <button
              onClick={() => handleRsvp('declined')}
              disabled={submitting}
              className="group relative w-full overflow-hidden"
            >
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-blush-pink-dark/30 hover:border-sage-green/50 transition-all duration-300">
                {/* Subtle shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sage-green/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Button Content */}
                <div className="relative py-3.5 sm:py-5 px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 group-hover:scale-[1.02]">
                  {/* Icon Circle */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-dusty-rose/10 flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-mahogany-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="text-left">
                    <p className="text-mahogany-brown font-semibold text-sm sm:text-base">I regret that I am unable to attend</p>
                    <p className="text-sage-green/70 text-xs">I hope to have the opportunity to meet in the future</p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sage-green/40 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Submitting State */}
            {submitting && (
              <div className="mt-4 sm:mt-6 text-center">
                <div className="relative inline-flex items-center justify-center">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full bg-champagne-gold/20 animate-ping"></div>
                  {/* Spinner */}
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 border-3 border-champagne-gold/30 border-t-champagne-gold rounded-full animate-spin"></div>
                </div>
                <p className="text-sage-green/70 text-xs sm:text-sm mt-2 sm:mt-3 animate-pulse">Saving your response...</p>
              </div>
            )}

            {/* Closing Message */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-sage-green/70 text-xs sm:text-sm italic leading-relaxed">
                We hope this event becomes a space for you<br/>
                to pause, to connect, and to rediscover your own colors—<br/>
                in the most genuine and meaningful way.
              </p>
              <p className="text-sage-green/70 text-xs sm:text-sm italic mt-3 sm:mt-4">We would be truly delighted to have you with us.</p>
              <div className="mt-3 sm:mt-4">
                <p className="text-sage-green/60 text-sm sm:text-base italic">With love,</p>
                <img
                  src="https://mrkjatwshfnldnfutuov.supabase.co/storage/v1/object/sign/Images/SASIENALA%20Logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYTlmYTQxNi0wNjUzLTRiNDYtYWRmZS04MzQyYzRhOWU0NzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZXMvU0FTSUVOQUxBIExvZ28ucG5nIiwiaWF0IjoxNzc1Mjg0OTkxLCJleHAiOjE4MDY4MjA5OTF9.pSVaamOOTj2bQ942w-ISI35W-q0RmYrvKjuRC3uQV6U"
                  alt="Sasienala"
                  className="h-12 sm:h-16 mx-auto mt-2 sm:mt-3 object-contain"
                />
              </div>
            </div>
          </section>
        )}

        {/* QR Code Section - Show after confirmation */}
        {showQr && guest && (
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-sage-green/30 p-5 sm:p-6 md:p-8 text-center animate-scale-in">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-sage-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-sage-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-elegant text-lg sm:text-xl font-semibold text-mahogany-brown mb-2">You're Confirmed!</h3>
            <p className="text-sage-green/70 text-xs sm:text-sm mb-4 sm:mb-6">Show this QR code at the entrance</p>

            {/* QR Code Display */}
            <div className="bg-white rounded-xl p-3 sm:p-4 inline-block mb-3 sm:mb-4 shadow-inner">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-36 h-36 sm:w-48 sm:h-48 rounded-lg"
                />
              ) : (
                <div className="w-36 h-36 sm:w-48 sm:h-48 bg-cream-ivory rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-champagne-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <p className="text-mahogany-brown font-medium mb-1 text-sm sm:text-base">{guest.name}</p>
            <p className="text-sage-green/60 text-xs">Guest ID: {guest.id}</p>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 justify-center">
              <button
                onClick={() => {
                  if (qrCodeDataUrl) {
                    const link = document.createElement('a');
                    link.href = qrCodeDataUrl;
                    link.download = `QR-${guest?.name || 'guest'}-${guest?.id}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-mahogany-brown hover:bg-mahogany-dark text-white rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'My Invitation QR Code',
                      text: `QR Code for ${event.title}`,
                    });
                  }
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-white border border-blush-pink-dark/30 hover:border-mahogany-brown text-mahogany-brown rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </section>
        )}

        {/* Declined Section */}
        {showDeclined && (
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dusty-rose/30 p-5 sm:p-6 md:p-8 text-center animate-scale-in">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-dusty-rose/20 flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-mahogany-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-elegant text-lg sm:text-xl font-semibold text-mahogany-brown mb-2">Response Recorded</h3>
            <p className="text-sage-green/70 text-sm sm:text-base">We're sorry you can't make it. We hope to see you at our next event!</p>
          </section>
        )}

        {/* Already Responded (from previous visit) */}
        {guest && guest.rsvpStatus && !showQr && !showDeclined && (
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blush-pink-dark/30 p-5 sm:p-6 md:p-8 text-center">
            <p className="text-sage-green/70 text-sm sm:text-base">You've already responded.</p>
            <p className="text-mahogany-brown font-medium mt-2">Status: <span className={`px-2 py-1 rounded-full text-xs ${getRsvpStatusColor(guest.rsvpStatus)}`}>{getRsvpStatusText(guest.rsvpStatus)}</span></p>
            {guest.rsvpStatus === 'confirmed' && (
              <button
                onClick={() => setShowQr(true)}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-mahogany-brown hover:bg-mahogany-dark text-white rounded-xl text-xs sm:text-sm font-medium transition"
              >
                View My QR Code
              </button>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 text-center animate-fade-in">
          <p className="text-sage-green/40 text-[10px] sm:text-xs">© 2024 SASIENALA × WARDAH</p>
        </footer>
      </div>
    </div>
  );
}
