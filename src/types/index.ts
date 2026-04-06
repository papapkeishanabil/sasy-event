export interface Guest {
  id: number;
  name: string;
  category: string; // Changed to string to allow dynamic categories
  status: 'not_checked_in' | 'checked_in';
  checkInTime?: string;
  email?: string;
  phone?: string;
  rsvpStatus?: 'pending' | 'confirmed' | 'declined' | 'maybe';
  rsvpResponseTime?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  display_order: number;
}

export interface CheckInStats {
  total: number;
  checkedIn: number;
  remaining: number;
  vipCheckedIn: number;
  vipTotal: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  imageUrl?: string;
}

export type Screen = 'landing' | 'scan' | 'search' | 'admin' | 'success' | 'operator' | 'rsvp' | 'invitation';

export interface QRData {
  id: number;
  name: string;
}
