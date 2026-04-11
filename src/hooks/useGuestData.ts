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

  // Real-time sync for Supabase with polling fallback
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('[Realtime] Supabase not configured, skipping real-time sync');
      return;
    }

    console.log('[Realtime] Setting up real-time sync for guests table...');

    let channel: any = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    // Setup Realtime subscription
    channel = supabase
      .channel('guests-changes-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests'
        },
        async (payload: any) => {
          console.log('[Realtime] 🎉 Update received:', payload);
          console.log('[Realtime] Event type:', payload.eventType);
          // Reload all guests when changes occur
          const updated = await getGuests();
          setGuests(updated);
        }
      )
      .subscribe((status: any) => {
        console.log('[Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Successfully subscribed - Instant sync active');
          // Clear polling if realtime works
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] ⚠️ Connection failed - Polling every 3 seconds...');
          // Start polling as fallback
          if (!pollingInterval) {
            pollingInterval = setInterval(async () => {
              console.log('[Polling] Refreshing data...');
              const updated = await getGuests();
              setGuests(updated);
            }, 3000); // Poll every 3 seconds
          }
        }
      });

    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (channel) supabase.removeChannel(channel);
      if (pollingInterval) clearInterval(pollingInterval);
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
    // Get existing guests
    const existingGuests = await getGuests();

    // Find max ID to assign new IDs
    const maxId = existingGuests.length > 0
      ? Math.max(...existingGuests.map(g => g.id))
      : 0;

    // Create a map of existing guests by name for deduplication
    const existingGuestsMap = new Map(
      existingGuests.map(g => [g.name.toLowerCase().trim(), g])
    );

    // Merge guests: keep existing, add new ones with new IDs
    let mergedGuests = [...existingGuests];
    let nextId = maxId + 1;
    let addedCount = 0;

    for (const newGuest of newGuests) {
      const guestKey = newGuest.name.toLowerCase().trim();

      // Skip if guest already exists (by name)
      if (!existingGuestsMap.has(guestKey)) {
        mergedGuests.push({
          ...newGuest,
          id: nextId++
        });
        addedCount++;
      }
    }

    // Sort by ID
    mergedGuests.sort((a, b) => a.id - b.id);

    await saveGuests(mergedGuests);
    setGuests(mergedGuests);

    return addedCount; // Return number of guests actually added
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
