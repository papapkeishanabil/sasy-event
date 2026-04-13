import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Guest } from '../types';

interface ScanScreenProps {
  guests: Guest[];
  onCheckIn: (id: number) => Promise<{ success: boolean; alreadyCheckedIn: boolean }>;
  onBack: () => void;
}

const ScanScreen: React.FC<ScanScreenProps> = ({ guests, onCheckIn, onBack }) => {
  const [error, setError] = useState<string>('');
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('user');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanRegionId = 'scan-region';
  const isRunningRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let cleanupObserver: (() => void) | null = null;

    const startScanner = async () => {
      // Prevent multiple simultaneous scans
      if (isRunningRef.current) {
        return;
      }
      isRunningRef.current = true;

      try {
        // Clear any existing scanner instance
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // Scanner wasn't running, that's fine
          }
          try {
            await scannerRef.current.clear();
          } catch {
            // Clear failed, continue anyway
          }
          scannerRef.current = null;
        }

        const scanner = new Html5Qrcode(scanRegionId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: cameraMode },
          {
            fps: 30, // Optimal balance - not too fast to miss, not too slow
            qrbox: (scanRegionWidth, scanRegionHeight) => {
              // Use 80% of the smaller dimension for better detection area
              const size = Math.max(200, Math.min(scanRegionWidth, scanRegionHeight) * 0.8);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Ignore scan errors (continuous)
          }
        );

        if (isMounted) {
          setIsScanning(true);
          setError('');
        }

        // Apply mirror effect for front camera
        const applyMirror = () => {
          const scanRegionEl = document.getElementById(scanRegionId);
          if (!scanRegionEl) return;

          const videos = scanRegionEl.querySelectorAll('video');
          videos.forEach(video => {
            if (cameraMode === 'user') {
              video.style.setProperty('transform', 'scaleX(-1)', 'important');
            } else {
              video.style.removeProperty('transform');
            }
          });

          const canvases = scanRegionEl.querySelectorAll('canvas');
          canvases.forEach(canvas => {
            if (cameraMode === 'user') {
              canvas.style.setProperty('transform', 'scaleX(-1)', 'important');
            } else {
              canvas.style.removeProperty('transform');
            }
          });
        };

        applyMirror();

        // Set up observer for dynamic elements
        const observer = new MutationObserver(() => {
          applyMirror();
        });

        const scanRegionEl = document.getElementById(scanRegionId);
        if (scanRegionEl) {
          observer.observe(scanRegionEl, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
          });
          cleanupObserver = () => observer.disconnect();
        }

      } catch (err) {
        console.error('Scanner start error:', err);
        if (isMounted) {
          setIsScanning(false);
          setError('Unable to access camera. Please check permissions.');
        }
      } finally {
        isRunningRef.current = false;
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (cleanupObserver) {
        cleanupObserver();
      }

      // Clean up scanner
      const cleanupScanner = async () => {
        if (scannerRef.current) {
          const scanner = scannerRef.current;
          scannerRef.current = null;
          try {
            await scanner.stop();
          } catch {
            // Ignore stop errors
          }
          try {
            await scanner.clear();
          } catch {
            // Ignore clear errors
          }
        }
        setIsScanning(false);
      };

      cleanupScanner();
    };
  }, [cameraMode]);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Try to parse as JSON first
      let data: { id: number; name?: string };
      try {
        data = JSON.parse(decodedText);
      } catch {
        // Try to extract ID from string
        const match = decodedText.match(/id[:\s]+(\d+)/i);
        if (match) {
          data = { id: parseInt(match[1]) };
        } else {
          setError('Invalid QR code format');
          playErrorSound();
          return;
        }
      }

      const guest = guests.find(g => g.id === data.id);

      if (!guest) {
        setError(`Guest #${data.id} not found`);
        playErrorSound();
        return;
      }

      const result = await onCheckIn(guest.id);

      if (result.alreadyCheckedIn) {
        setError(`${guest.name} is already checked in`);
        playErrorSound();
      } else {
        // Success
        playSuccessSound();
      }

      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Error reading QR code');
      playErrorSound();
    }
  };

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  return (
    <div className="page-transition min-h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-sasie-gray-light border border-sasie-gold/20"
        >
          <svg className="w-6 h-6 text-sasie-gold font-cremona" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-cremona text-xl font-cremona gold-text">Scan QR Code</h2>
        <button
          onClick={() => setCameraMode(cameraMode === 'environment' ? 'user' : 'environment')}
          className="p-2 rounded-full bg-sasie-cream border border-sasie-gold/30 hover:border-sasie-gold/60 transition-colors"
          title="Switch Camera"
        >
          <svg className="w-6 h-6 text-sasie-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="relative w-full max-w-xl aspect-square">
          <div
            className="w-full h-full rounded-3xl overflow-hidden border-2 border-sasie-gold/30 shadow-2xl shadow-sasie-gold/10"
          >
            <div id={scanRegionId} className="w-full h-full" />
          </div>

          {/* Scan overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="scan-line" />
            <div className="absolute top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-sasie-gold rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-20 h-20 border-r-4 border-t-4 border-sasie-gold rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-4 border-b-4 border-sasie-gold rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-4 border-b-4 border-sasie-gold rounded-br-3xl" />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-gray-400 font-cremona mt-6 text-sm font-cremona">
          {isScanning ? 'Arahkan QR Code ke kotak, tunggu sebentar untuk deteksi' : 'Memulai kamera...'}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-4 glass-card p-4 border-l-4 border-red-500 animate-slide-up">
            <p className="text-red-400 font-cremona text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
