import { Guest } from '../types';

const STORAGE_KEY = 'sasie_guests';
const CHECK_IN_HISTORY_KEY = 'sasie_checkin_history';

/**
 * Get all guests from localStorage
 */
export const getGuests = (): Guest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return [];
};

/**
 * Save guests to localStorage
 */
export const saveGuests = (guests: Guest[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Update guest check-in status
 */
export const updateGuestStatus = (guestId: number, status: 'checked_in' | 'not_checked_in'): Guest[] => {
  const guests = getGuests();
  const guestIndex = guests.findIndex(g => g.id === guestId);

  if (guestIndex !== -1) {
    guests[guestIndex].status = status;
    if (status === 'checked_in') {
      guests[guestIndex].checkInTime = new Date().toISOString();
    } else {
      delete guests[guestIndex].checkInTime;
    }
    saveGuests(guests);

    // Log to history
    addToHistory(guests[guestIndex], status);
  }

  return guests;
};

/**
 * Reset all check-in statuses
 */
export const resetCheckIns = (): Guest[] => {
  const guests = getGuests();
  guests.forEach(guest => {
    guest.status = 'not_checked_in';
    delete guest.checkInTime;
  });
  saveGuests(guests);
  return guests;
};

/**
 * Initialize with default data if none exists
 */
export const initializeDefaultData = (): void => {
  if (getGuests().length === 0) {
    const defaultGuests: Guest[] = [
      { id: 1, name: 'Deny', category: 'VIP', status: 'not_checked_in' },
      { id: 2, name: 'Sarah Wijaya', category: 'VIP', status: 'not_checked_in' },
      { id: 3, name: 'Budi Santoso', category: 'Regular', status: 'not_checked_in' },
      { id: 4, name: 'Citra Lestari', category: 'VIP', status: 'not_checked_in' },
      { id: 5, name: 'Ahmad Rahman', category: 'Media', status: 'not_checked_in' },
      { id: 6, name: 'Diana Putri', category: 'Regular', status: 'not_checked_in' },
      { id: 7, name: 'Eko Prasetyo', category: 'Speaker', status: 'not_checked_in' },
      { id: 8, name: 'Fitri Handayani', category: 'VIP', status: 'not_checked_in' },
      { id: 9, name: 'Gunawan', category: 'Regular', status: 'not_checked_in' },
      { id: 10, name: 'Hesti Kumala', category: 'Media', status: 'not_checked_in' },
    ];
    saveGuests(defaultGuests);
  }
};

/**
 * Get check-in history
 */
export const getCheckInHistory = () => {
  try {
    const data = localStorage.getItem(CHECK_IN_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading history:', error);
  }
  return [];
};

/**
 * Add entry to check-in history
 */
const addToHistory = (guest: Guest, status: 'checked_in' | 'not_checked_in'): void => {
  try {
    const history = getCheckInHistory();
    history.unshift({
      guest,
      status,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 100 entries
    if (history.length > 100) {
      history.pop();
    }
    localStorage.setItem(CHECK_IN_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history:', error);
  }
};

/**
 * Clear all data
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CHECK_IN_HISTORY_KEY);
};
