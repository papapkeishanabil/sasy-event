import { CheckInStats } from '../types';

interface StatsBarProps {
  stats: CheckInStats;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const percentage = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <div className="mx-3 mt-2">
      <div className="overflow-hidden rounded-xl bg-white/90 backdrop-blur-sm shadow border border-sasie-dove/50">
        <div className="p-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sasie-gold animate-pulse"></div>
              <span className="text-[10px] font-medium text-sasie-milo/70 tracking-wide">CHECK-IN</span>
            </div>
            <span className="text-xl font-bold text-sasie-gold">
              {Math.round(percentage)}%
            </span>
          </div>

          {/* Compact Progress Bar */}
          <div className="relative h-2 bg-sasie-dove/60 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sasie-gold to-sasie-bronze transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stats Grid - Compact */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-sasie-mocca">{stats.total}</p>
              <p className="text-[9px] text-sasie-milo/60">TOTAL</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sasie-emerald">{stats.checkedIn}</p>
              <p className="text-[9px] text-sasie-milo/60">HADIR</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sasie-terracotta">{stats.remaining}</p>
              <p className="text-[9px] text-sasie-milo/60">BELUM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
