import { useGuestData } from './hooks/useGuestData';
import { useScreen } from './hooks/useScreen';

// Components
import LandingScreen from './components/LandingScreen';
import SearchScreen from './components/SearchScreen';
import ScanScreen from './components/ScanScreen';
import OperatorDashboard from './components/OperatorDashboard';
import SuccessScreen from './components/SuccessScreen';
import AdminPanel from './components/AdminPanel';
import StatsBar from './components/StatsBar';

function App() {
  const { guests, stats, checkInGuest, resetAll, importGuests } = useGuestData();
  const { currentScreen, navigateTo, showSuccess, closeSuccess, successGuest } = useScreen();

  const handleCheckIn = (guestId: number) => {
    const result = checkInGuest(guestId);
    if (result.success) {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        showSuccess(guest.name, guest.category);
      }
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-sasie-cream">
      {/* Header Stats - Only show in admin/operator dashboards */}
      {(currentScreen === 'operator' || currentScreen === 'admin') && <StatsBar stats={stats} />}

      {/* Main Content */}
      <main className="pb-safe">
        {currentScreen === 'landing' && (
          <LandingScreen
            onSearchClick={() => navigateTo('search')}
            onOperatorClick={() => navigateTo('operator')}
            onScanClick={() => navigateTo('scan')}
            onAdminClick={() => navigateTo('admin')}
          />
        )}

        {currentScreen === 'search' && (
          <SearchScreen
            guests={guests}
            onCheckIn={handleCheckIn}
            onBack={() => navigateTo('landing')}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen
            guests={guests}
            onCheckIn={handleCheckIn}
            onBack={() => navigateTo('landing')}
          />
        )}

        {currentScreen === 'operator' && (
          <OperatorDashboard
            guests={guests}
            onCheckIn={handleCheckIn}
            onBack={() => navigateTo('landing')}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminPanel
            guests={guests}
            stats={stats}
            onImport={importGuests}
            onReset={resetAll}
            onBack={() => navigateTo('landing')}
          />
        )}

        {currentScreen === 'success' && successGuest && (
          <SuccessScreen
            guestName={successGuest.name}
            category={successGuest.category}
            onClose={closeSuccess}
          />
        )}
      </main>

      {/* Admin Button (hidden) */}
      <button
        onClick={() => navigateTo('admin')}
        className="fixed bottom-4 right-4 w-8 h-8 opacity-20 hover:opacity-100 transition-opacity"
        aria-label="Admin"
      >
        <svg className="w-full h-full text-sasie-gold" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default App;
