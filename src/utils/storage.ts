import { Guest, Category } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'sasie_guests';
const CHECK_IN_HISTORY_KEY = 'sasie_checkin_history';
const OFFLINE_CACHE_KEY = 'sasie_offline_cache';

// LocalStorage fallback for offline mode
const getCachedGuests = (): Guest[] => {
  try {
    const data = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (data) {
      const cached = JSON.parse(data);
      if (cached.guests) return cached.guests;
    }
  } catch (error) {
    console.error('Error reading offline cache:', error);
  }
  return [];
};

const cacheGuests = (guests: Guest[]): void => {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify({ guests, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error saving offline cache:', error);
  }
};

const mapDbToGuest = (dbGuest: any): Guest => ({
  id: dbGuest.id,
  name: dbGuest.name,
  category: dbGuest.category,
  status: dbGuest.status,
  checkInTime: dbGuest.check_in_time,
  email: dbGuest.email,
  phone: dbGuest.phone,
  rsvpStatus: dbGuest.rsvp_status,
  rsvpResponseTime: dbGuest.rsvp_response_time,
});

const mapGuestToDb = (guest: Guest) => ({
  id: guest.id,
  name: guest.name,
  category: guest.category,
  status: guest.status,
  check_in_time: guest.checkInTime,
  email: guest.email,
  phone: guest.phone,
  rsvp_status: guest.rsvpStatus,
  rsvp_response_time: guest.rsvpResponseTime,
});

/**
 * Get all guests from Supabase (with localStorage fallback)
 */
export const getGuests = async (): Promise<Guest[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      if (data) {
        const guests = data.map(mapDbToGuest);
        cacheGuests(guests);
        return guests;
      }
    } catch (error) {
      console.error('Error fetching from Supabase, using cache:', error);
    }
  }
  return getCachedGuests();
};

/**
 * Save guests to Supabase (batch upsert)
 */
export const saveGuests = async (guests: Guest[]): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      const dbGuests = guests.map(mapGuestToDb);
      const { error } = await supabase
        .from('guests')
        .upsert(dbGuests, { onConflict: 'id' });

      if (error) throw error;
      cacheGuests(guests);
      return;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    }
  }
  cacheGuests(guests);
};

/**
 * Update guest check-in status
 */
export const updateGuestStatus = async (guestId: number, status: 'checked_in' | 'not_checked_in'): Promise<Guest[]> => {
  const guests = await getGuests();
  const guestIndex = guests.findIndex(g => g.id === guestId);

  if (guestIndex !== -1) {
    guests[guestIndex].status = status;
    if (status === 'checked_in') {
      guests[guestIndex].checkInTime = new Date().toISOString();
    } else {
      delete guests[guestIndex].checkInTime;
    }

    // Update in Supabase
    if (isSupabaseConfigured()) {
      try {
        const updateData: any = {
          status,
          check_in_time: guests[guestIndex].checkInTime || null,
        };

        const { error } = await supabase
          .from('guests')
          .update(updateData)
          .eq('id', guestId);

        if (error) throw error;

        // Log to check_in_history
        await supabase.from('check_ins').insert({
          guest_id: guestId,
          status,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating guest status:', error);
      }
    }

    cacheGuests(guests);
    addToHistory(guests[guestIndex], status);
  }

  return guests;
};

/**
 * Reset all check-in statuses
 */
export const resetCheckIns = async (): Promise<Guest[]> => {
  const guests = await getGuests();
  guests.forEach(guest => {
    guest.status = 'not_checked_in';
    delete guest.checkInTime;
  });

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ status: 'not_checked_in', check_in_time: null })
        .neq('status', 'not_checked_in');

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting check-ins:', error);
    }
  }

  cacheGuests(guests);
  return guests;
};

/**
 * Initialize with default data if none exists
 */
export const initializeDefaultData = async (): Promise<void> => {
  const guests = await getGuests();
  if (guests.length === 0) {
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
    await saveGuests(defaultGuests);
  }
};

/**
 * Get check-in history
 */
export const getCheckInHistory = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*, guests(name, category)')
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching check-in history:', error);
    }
  }

  // Fallback to localStorage
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
const addToHistory = async (guest: Guest, status: 'checked_in' | 'not_checked_in'): Promise<void> => {
  // LocalStorage fallback for history
  try {
    const history = await getCheckInHistory();
    const newEntry = {
      guest,
      status,
      timestamp: new Date().toISOString(),
    };
    history.unshift(newEntry);
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
export const clearAllData = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CHECK_IN_HISTORY_KEY);
  localStorage.removeItem(OFFLINE_CACHE_KEY);
};

/**
 * Add a new guest
 */
export const addGuest = async (guest: Omit<Guest, 'id'>): Promise<Guest[]> => {
  const guests = await getGuests();
  const newId = guests.length > 0 ? Math.max(...guests.map(g => g.id)) + 1 : 1;
  const newGuest: Guest = {
    ...guest,
    id: newId,
    status: 'not_checked_in',
  };
  guests.push(newGuest);

  if (isSupabaseConfigured()) {
    try {
      const dbGuest = mapGuestToDb(newGuest);
      console.log('Adding guest to Supabase:', dbGuest);
      const { data, error } = await supabase.from('guests').insert(dbGuest).select();
      if (error) {
        console.error('Supabase error adding guest:', error);
        throw error;
      }
      console.log('Guest added successfully:', data);
    } catch (error) {
      console.error('Error adding guest:', error);
      throw error;
    }
  }

  cacheGuests(guests);
  return guests;
};

/**
 * Update guest data
 */
export const updateGuest = async (
  guestId: number,
  updates: Partial<Omit<Guest, 'id'>>
): Promise<Guest[] | null> => {
  const guests = await getGuests();
  const guestIndex = guests.findIndex(g => g.id === guestId);

  if (guestIndex !== -1) {
    guests[guestIndex] = { ...guests[guestIndex], ...updates };

    if (isSupabaseConfigured()) {
      try {
        const dbUpdate = mapGuestToDb(guests[guestIndex]);
        console.log('Updating guest in Supabase:', guestId, dbUpdate);
        const { error } = await supabase
          .from('guests')
          .update(dbUpdate)
          .eq('id', guestId);

        if (error) {
          console.error('Supabase error updating guest:', error);
          throw error;
        }
        console.log('Guest updated successfully');
      } catch (error) {
        console.error('Error updating guest:', error);
        throw error;
      }
    }

    cacheGuests(guests);
    return guests;
  }

  return null;
};

/**
 * Delete a guest
 */
export const deleteGuest = async (guestId: number): Promise<Guest[] | null> => {
  const guests = await getGuests();
  const filteredGuests = guests.filter(g => g.id !== guestId);

  if (filteredGuests.length !== guests.length) {
    if (isSupabaseConfigured()) {
      try {
        console.log('Deleting guest from Supabase:', guestId);
        const { error } = await supabase
          .from('guests')
          .delete()
          .eq('id', guestId);

        if (error) {
          console.error('Supabase error deleting guest:', error);
          throw error;
        }
        console.log('Guest deleted successfully');
      } catch (error) {
        console.error('Error deleting guest:', error);
        throw error;
      }
    }

    cacheGuests(filteredGuests);
    return filteredGuests;
  }

  return null;
};

/**
 * Get guest by ID
 */
export const getGuestById = async (guestId: number): Promise<Guest | null> => {
  const guests = await getGuests();
  return guests.find(g => g.id === guestId) || null;
};

/**
 * Update guest RSVP status
 */
export const updateGuestRsvp = async (
  guestId: number,
  rsvpStatus: 'confirmed' | 'declined' | 'maybe'
): Promise<Guest | null> => {
  const guests = await getGuests();
  const guestIndex = guests.findIndex(g => g.id === guestId);

  if (guestIndex !== -1) {
    guests[guestIndex].rsvpStatus = rsvpStatus;
    guests[guestIndex].rsvpResponseTime = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('guests')
          .update({
            rsvp_status: rsvpStatus,
            rsvp_response_time: new Date().toISOString(),
          })
          .eq('id', guestId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating RSVP:', error);
      }
    }

    cacheGuests(guests);
    return guests[guestIndex];
  }

  return null;
};

/**
 * Get RSVP statistics
 */
export const getRsvpStats = async () => {
  const guests = await getGuests();
  return {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
    declined: guests.filter(g => g.rsvpStatus === 'declined').length,
    maybe: guests.filter(g => g.rsvpStatus === 'maybe').length,
    pending: guests.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending').length,
  };
};

// ==================== CATEGORY MANAGEMENT ====================

const CATEGORIES_CACHE_KEY = 'sasie_categories_cache';
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_vip', name: 'VIP', description: 'Very Important Person', color: '#D4AF37', display_order: 1 },
  { id: 'cat_regular', name: 'Regular', description: 'Regular Guest', color: '#8B7355', display_order: 2 },
  { id: 'cat_media', name: 'Media', description: 'Media/Press', color: '#2C3E50', display_order: 3 },
  { id: 'cat_speaker', name: 'Speaker', description: 'Event Speaker', color: '#E74C3C', display_order: 4 },
  { id: 'cat_owner', name: 'Owner', description: 'Event Owner', color: '#9B59B6', display_order: 5 },
];

const getCachedCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (data) {
      const cached = JSON.parse(data);
      if (cached.categories) return cached.categories;
    }
  } catch (error) {
    console.error('Error reading categories cache:', error);
  }
  return DEFAULT_CATEGORIES;
};

const cacheCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ categories, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error saving categories cache:', error);
  }
};

/**
 * Get all categories from Supabase (with localStorage fallback)
 */
export const getCategories = async (): Promise<Category[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Supabase categories fetch error:', error);
        throw error;
      }
      if (data && data.length > 0) {
        const categories: Category[] = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          display_order: cat.display_order,
        }));
        cacheCategories(categories);
        return categories;
      }
    } catch (error) {
      console.error('Error fetching categories from Supabase, using cache:', error);
    }
  }
  return getCachedCategories();
};

/**
 * Add a new category
 */
export const addCategory = async (
  category: Omit<Category, 'id'>
): Promise<Category[]> => {
  const categories = await getCategories();

  const newId = `cat_${Date.now()}`;
  const newCategory: Category = {
    ...category,
    id: newId,
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          id: newId,
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
          icon: newCategory.icon,
          display_order: newCategory.display_order,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding category to Supabase:', error);
      throw error;
    }
  }

  categories.push(newCategory);
  cacheCategories(categories);
  return categories;
};

/**
 * Update a category
 */
export const updateCategory = async (
  categoryId: string,
  updates: Partial<Omit<Category, 'id'>>
): Promise<Category[] | null> => {
  const categories = await getCategories();
  const categoryIndex = categories.findIndex(c => c.id === categoryId);

  if (categoryIndex !== -1) {
    categories[categoryIndex] = { ...categories[categoryIndex], ...updates };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('categories')
          .update({
            name: categories[categoryIndex].name,
            description: categories[categoryIndex].description,
            color: categories[categoryIndex].color,
            icon: categories[categoryIndex].icon,
            display_order: categories[categoryIndex].display_order,
          })
          .eq('id', categoryId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating category in Supabase:', error);
        throw error;
      }
    }

    cacheCategories(categories);
    return categories;
  }

  return null;
};

/**
 * Delete a category
 */
export const deleteCategory = async (
  categoryId: string
): Promise<Category[] | null> => {
  const categories = await getCategories();
  const filteredCategories = categories.filter(c => c.id !== categoryId);

  if (filteredCategories.length !== categories.length) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting category from Supabase:', error);
        throw error;
      }
    }

    cacheCategories(filteredCategories);
    return filteredCategories;
  }

  return null;
};

/**
 * Update all guests with a specific category name to a new category name
 */
export const updateGuestsCategory = async (
  oldCategoryName: string,
  newCategoryName: string
): Promise<void> => {
  const guests = await getGuests();
  const guestsToUpdate = guests.filter(g => g.category === oldCategoryName);

  if (guestsToUpdate.length === 0) return;

  // Update local storage
  const storageKey = 'sasie_guests';
  const localData = localStorage.getItem(storageKey);
  if (localData) {
    const allGuests = JSON.parse(localData);
    const updatedGuests = allGuests.map((g: Guest) =>
      g.category === oldCategoryName ? { ...g, category: newCategoryName } : g
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedGuests));
  }

  // Update Supabase
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ category: newCategoryName })
        .eq('category', oldCategoryName);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating guest categories in Supabase:', error);
      throw error;
    }
  }
};
