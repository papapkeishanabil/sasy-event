import { useState, useEffect } from 'react';
import { Guest, CheckInStats } from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import {
  getGuests,
  saveGuests,
  updateGuestStatus,
  resetCheckIns,
  initializeDefaultData,
  addGuest as storageAddGuest,
  updateGuest as storageUpdateGuest,
  deleteGuest as storageDeleteGuest,
} from '../utils/storage';

export const useGuestData = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load guests on mount
  useEffect(() => {
    loadData();
  }, []);

  // Real-time sync for Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('guests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests' },
        async (payload: any) => {
          console.log('Real-time update:', payload);
          // Reload all guests when changes occur
          const updated = await getGuests();
          setGuests(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    await initializeDefaultData();
    const loaded = await getGuests();
    setGuests(loaded);
    setLoading(false);
  };

  const checkInGuest = async (guestId: number) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest?.status === 'checked_in') {
      return { success: false, alreadyCheckedIn: true };
    }
    // Update status to checked_in AND mark as invitation sent
    const updated = await updateGuestStatus(guestId, 'checked_in');
    if (updated) {
      // Also mark as invitation sent since they checked in
      const guestWithInvitation = updated.find(g => g.id === guestId);
      if (guestWithInvitation && !guestWithInvitation.invitationSent) {
        const now = new Date().toISOString();
        await storageUpdateGuest(guestId, {
          invitationSent: true,
          invitationSentTime: now
        });
        // Reload to get the updated guest
        const reloaded = await getGuests();
        setGuests(reloaded);
      }
    }
    return { success: true, alreadyCheckedIn: false };
  };

  const undoCheckIn = async (guestId: number) => {
    const updated = await updateGuestStatus(guestId, 'not_checked_in');
    setGuests(updated);
  };

  const resetAll = async () => {
    if (confirm('Are you sure you want to reset all check-ins?')) {
      const updated = await resetCheckIns();
      setGuests(updated);
    }
  };

  const importGuests = async (newGuests: Guest[]) => {
    await saveGuests(newGuests);
    setGuests(newGuests);
  };

  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    const updated = await storageAddGuest(guest);
    setGuests(updated);
    return updated;
  };

  const updateGuest = async (guestId: number, updates: Partial<Omit<Guest, 'id'>>) => {
    const updated = await storageUpdateGuest(guestId, updates);
    if (updated) {
      setGuests(updated);
    }
    return updated;
  };

  const deleteGuest = async (guestId: number) => {
    const updated = await storageDeleteGuest(guestId);
    if (updated) {
      setGuests(updated);
    }
    return updated;
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
    loading,
    checkInGuest,
    undoCheckIn,
    resetAll,
    importGuests,
    addGuest,
    updateGuest,
    deleteGuest,
    refreshData: loadData,
  };
};
