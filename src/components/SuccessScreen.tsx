import { useEffect, useState } from 'react';

interface SuccessScreenProps {
  guestName: string;
  category: string;
  onClose: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ guestName, category, onClose }) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setConfetti(pieces);

    // Auto close after 3 seconds
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sasie-mocca/80 backdrop-blur-sm page-transition">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-fade-in"
            style={{
              left: `${piece.x}%`,
              top: '-10px',
              animationDelay: `${piece.delay}s`,
              animation: `fall 2s ease-in forwards ${piece.delay}s`,
            }}
          >
            <div className={`w-2 h-2 ${piece.id % 2 === 0 ? 'bg-sasie-gold' : 'bg-sasie-emerald'} rounded-full`} />
          </div>
        ))}
      </div>

      {/* Success Card */}
      <div
        className="bg-white/90 backdrop-blur-sm p-8 mx-6 max-w-sm w-full text-center animate-scale-in border border-sasie-gold/40 shadow-2xl shadow-sasie-mocca/20 rounded-2xl"
        onClick={onClose}
      >
        {/* Checkmark Animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full gold-gradient animate-pulse-glow" />
          <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
            <svg className="w-12 h-12 text-sasie-gold checkmark-animate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-3xl font-bold mb-2 text-sasie-gold">Welcome!</h2>
        <p className="text-sasie-mocca text-2xl font-medium mb-1">{guestName}</p>

        {/* Category Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mt-4 ${
          category === 'VIP'
            ? 'bg-sasie-gold/20 border border-sasie-gold text-sasie-bronze'
            : 'bg-sasie-dove border border-sasie-mocca/30 text-sasie-mocca'
        }`}>
          <span className="text-sm font-medium">{category}</span>
          {category === 'VIP' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>

        {/* Sparkles */}
        <div className="mt-6 text-sasie-gold text-lg tracking-wider">✨</div>

        {/* Tap to Continue */}
        <p className="text-sasie-milo/70 text-sm mt-6">Tap to continue</p>
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SuccessScreen;
