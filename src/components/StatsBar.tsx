import { CheckInStats } from '../types';

interface StatsBarProps {
  stats: CheckInStats;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const percentage = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <div className="mx-4 mt-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl shadow-lg shadow-sasie-mocca/10 border border-sasie-dove/50">
        {/* Subtle shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sasie-gold/30 to-transparent"></div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sasie-gold animate-pulse"></div>
              <h2 className="text-sm font-medium text-sasie-milo/80 tracking-wide">CHECK-IN PROGRESS</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-sasie-gold to-sasie-bronze bg-clip-text text-transparent">
                {Math.round(percentage)}%
              </span>
            </div>
          </div>

          {/* Premium Progress Bar */}
          <div className="relative h-3 bg-sasie-dove/60 rounded-full overflow-hidden mb-5">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-sasie-gold/20 via-sasie-bronze/30 to-sasie-gold/20 animate-shimmer"></div>
            <div
              className="relative h-full rounded-full transition-all duration-700 ease-out overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sasie-gold via-sasie-bronze to-sasie-gold bg-[length:200%_100%] animate-gradient"></div>
              {/* Shine effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-shine"></div>
            </div>
          </div>

          {/* Stats Grid - Premium Design */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center group">
              <div className="relative inline-block mb-1">
                <div className="absolute -inset-2 bg-sasie-mocca/10 rounded-xl blur-lg group-hover:bg-sasie-mocca/20 transition-all duration-300"></div>
                <p className="relative text-2xl font-bold text-sasie-mocca">{stats.total}</p>
              </div>
              <p className="text-xs text-sasie-milo/60 tracking-wider">TOTAL</p>
            </div>
            <div className="text-center group">
              <div className="relative inline-block mb-1">
                <div className="absolute -inset-2 bg-sasie-emerald/10 rounded-xl blur-lg group-hover:bg-sasie-emerald/20 transition-all duration-300"></div>
                <p className="relative text-2xl font-bold text-sasie-emerald">{stats.checkedIn}</p>
              </div>
              <p className="text-xs text-sasie-milo/60 tracking-wider">PRESENT</p>
            </div>
            <div className="text-center group">
              <div className="relative inline-block mb-1">
                <div className="absolute -inset-2 bg-sasie-terracotta/10 rounded-xl blur-lg group-hover:bg-sasie-terracotta/20 transition-all duration-300"></div>
                <p className="relative text-2xl font-bold text-sasie-terracotta">{stats.remaining}</p>
              </div>
              <p className="text-xs text-sasie-milo/60 tracking-wider">PENDING</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
