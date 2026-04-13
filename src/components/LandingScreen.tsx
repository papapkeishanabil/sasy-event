interface LandingScreenProps {
  onScanClick: () => void;
  onSearchClick: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onScanClick,
  onSearchClick
}) => {
  return (
    <div className="page-transition min-h-screen flex flex-col justify-center px-4 py-3 relative overflow-hidden bg-sasie-cream">
      {/* Subtle Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-sasie-gold rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-sasie-mocca rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Compact Logo Area */}
        <div className="text-center mb-6">
          {/* SASIENALA Logo */}
          <div className="mb-3">
            <img
              src="/assets/SASIENALA Logo.png"
              alt="SASIENALA Logo"
              className="h-14 mx-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'block';
              }}
            />
            <div id="logo-fallback" className="hidden">
              <h1 className="text-3xl font-bold text-sasie-mocca">SASIENALA</h1>
              <div className="flex items-center justify-center gap-2 my-1">
                <div className="h-px w-8 bg-sasie-gold/50"></div>
                <span className="text-sasie-gold text-sm">×</span>
                <div className="h-px w-8 bg-sasie-gold/50"></div>
              </div>
              <h2 className="text-lg font-semibold text-sasie-mocca">WARDAH</h2>
            </div>
          </div>

          {/* Event Title */}
          <h1 className="text-xl font-light text-sasie-mocca mb-1">Welcome</h1>
          <p className="text-sasie-milo/60 text-xs tracking-wider uppercase">Guest Check-in</p>
        </div>

        {/* Compact CTA Buttons */}
        <div className="space-y-2">
          <button
            onClick={onScanClick}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sasie-gold via-sasie-bronze to-sasie-gold bg-[length:200%_100%] p-[2px] transition-all duration-500 hover:bg-[position:100%_0] shadow-md"
          >
            <div className="relative flex items-center justify-center gap-2 rounded-xl bg-sasie-cream py-3 px-6 transition-all">
              <svg className="w-5 h-5 text-sasie-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-base font-medium text-sasie-mocca">Scan QR Code</span>
            </div>
          </button>

          <button
            onClick={onSearchClick}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sasie-gold via-sasie-bronze to-sasie-gold bg-[length:200%_100%] p-[2px] transition-all duration-500 hover:bg-[position:100%_0] shadow-md"
          >
            <div className="relative flex items-center justify-center gap-2 rounded-xl bg-sasie-cream py-3 px-6 transition-all">
              <svg className="w-5 h-5 text-sasie-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-base font-medium text-sasie-mocca">Cari Nama</span>
            </div>
          </button>
        </div>

        {/* Minimal Footer */}
        <div className="text-center mt-6">
          <p className="text-sasie-milo/30 text-[10px] tracking-wider">SASIENALA × WARDAH</p>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
