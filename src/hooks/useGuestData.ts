import { useState, useEffect } from 'react';
import { Guest, CheckInStats } from '../types';
import { getGuests, saveGuests, updateGuestStatus, resetCheckIns, initializeDefaultData } from '../utils/storage';

export const useGuestData = () => {
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    // Initialize default data if needed and load guests immediately
    initializeDefaultData();
    setGuests(getGuests());
  }, []);

  const checkInGuest = (guestId: number) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest?.status === 'checked_in') {
      return { success: false, alreadyCheckedIn: true };
    }
    const updated = updateGuestStatus(guestId, 'checked_in');
    setGuests(updated);
    return { success: true, alreadyCheckedIn: false };
  };

  const undoCheckIn = (guestId: number) => {
    const updated = updateGuestStatus(guestId, 'not_checked_in');
    setGuests(updated);
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset all check-ins?')) {
      const updated = resetCheckIns();
      setGuests(updated);
    }
  };

  const importGuests = (newGuests: Guest[]) => {
    saveGuests(newGuests);
    setGuests(newGuests);
  };

  const stats: CheckInStats = {
    total: guests.length,
    checkedIn: guests.filter(g => g.status === 'checked_in').length,
    remaining: guests.filter(g => g.status === 'not_checked_in').length,
    vipCheckedIn: guests.filter(g => g.category === 'VIP' && g.status === 'checked_in').length,
    vipTotal: guests.filter(g => g.category === 'VIP').length,
  };

  return {
    guests,
    stats,
    checkInGuest,
    undoCheckIn,
    resetAll,
    importGuests,
  };
};
