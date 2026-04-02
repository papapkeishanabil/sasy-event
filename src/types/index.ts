export interface Guest {
  id: number;
  name: string;
  category: 'VIP' | 'Regular' | 'Media' | 'Speaker' | 'Owner';
  status: 'not_checked_in' | 'checked_in';
  checkInTime?: string;
  email?: string;
  phone?: string;
}

export interface CheckInStats {
  total: number;
  checkedIn: number;
  remaining: number;
  vipCheckedIn: number;
  vipTotal: number;
}

export type Screen = 'landing' | 'scan' | 'search' | 'admin' | 'success' | 'operator';

export interface QRData {
  id: number;
  name: string;
}
