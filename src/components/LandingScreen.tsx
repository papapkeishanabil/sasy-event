interface LandingScreenProps {
  onScanClick: () => void;
  onSearchClick: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onScanClick,
  onSearchClick
}) => {
  return (
    <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sasie-gold rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sasie-mocca rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Area - Premium Design */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-sasie-gold/50 to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-sasie-gold animate-pulse"></div>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-sasie-gold/50 to-transparent"></div>
          </div>

          {/* SASIENALA Logo */}
          <div className="mb-6">
            <img
              src="/assets/SASIENALA Logo.png"
              alt="SASIENALA Logo"
              className="h-20 md:h-28 object-contain mx-auto block"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'block';
              }}
            />
            <div id="logo-fallback" className="hidden">
              <h1 className="text-5xl md:text-6xl font-bold mb-2 tracking-tight text-sasie-mocca">
                SASIENALA
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-16 bg-sasie-gold/50"></div>
                <span className="text-sasie-gold text-xl">×</span>
                <div className="h-px w-16 bg-sasie-gold/50"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-sasie-mocca">
                WARDAH
              </h2>
            </div>
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-light text-sasie-mocca tracking-wide">
              Welcome
            </h1>
            <p className="text-sasie-milo/70 text-sm tracking-[0.2em] uppercase">Launch Event Guest Check-in</p>
          </div>

          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-sasie-gold/50 to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-sasie-gold animate-pulse"></div>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-sasie-gold/50 to-transparent"></div>
          </div>
        </div>

        {/* Premium CTA Button */}
        <div className="animate-slide-up space-y-3">
          <button
            onClick={onScanClick}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sasie-gold via-sasie-bronze to-sasie-gold bg-[length:200%_100%] p-[2px] transition-all duration-500 hover:bg-[position:100%_0] shadow-lg hover:shadow-xl hover:shadow-sasie-gold/20"
          >
            <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-sasie-cream py-[18px] px-8 transition-all duration-300 group-hover:bg-opacity-90">
              <svg className="w-6 h-6 text-sasie-gold transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-lg font-medium text-sasie-mocca tracking-wide">Scan QR Code</span>
            </div>
          </button>

          <button
            onClick={onSearchClick}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sasie-gold via-sasie-bronze to-sasie-gold bg-[length:200%_100%] p-[2px] transition-all duration-500 hover:bg-[position:100%_0] shadow-lg hover:shadow-xl hover:shadow-sasie-gold/20"
          >
            <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-sasie-cream py-[18px] px-8 transition-all duration-300 group-hover:bg-opacity-90">
              <svg className="w-6 h-6 text-sasie-gold transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-lg font-medium text-sasie-mocca tracking-wide">Search by Name</span>
            </div>
          </button>
        </div>
      </div>

      {/* Elegant Footer */}
      <div className="absolute bottom-6 left-0 right-0">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-sasie-milo/20"></div>
          <p className="text-center text-sasie-milo/40 text-xs tracking-wider">
            SASIENALA × WARDAH
          </p>
          <div className="h-px w-12 bg-sasie-milo/20"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
