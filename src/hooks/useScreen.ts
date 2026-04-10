import { useState, useCallback, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const STORAGE_KEY = 'sasie_current_screen';
const DEVICE_ID_KEY = 'sasie_device_id';

// Get or generate device ID
const getDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    console.error('Failed to get device ID:', e);
    return 'device_' + Date.now();
  }
};

export const useScreen = () => {
  // Extract RSVP params from URL during initialization (done once)
  const getRsvpParams = (): { screen: Screen; guestId: number | undefined } => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const rsvpParam = urlParams.get('rsvp');
      const guestIdParam = urlParams.get('guestId');

      console.log('[useScreen] URL params check:', { rsvpParam, guestIdParam });

      if (rsvpParam === 'true' && guestIdParam) {
        const guestId = parseInt(guestIdParam, 10);
        if (!isNaN(guestId)) {
          console.log('[useScreen] RSVP detected, guestId:', guestId, 'screen: rsvp');
          return { screen: 'rsvp', guestId };
        }
      }
    }
    return { screen: 'landing', guestId: undefined };
  };

  const rsvpParams = getRsvpParams();

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    // If RSVP params exist, use that screen
    if (rsvpParams.screen === 'rsvp') {
      return 'rsvp';
    }

    // Try to restore from localStorage (fast load)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'success' && saved !== 'rsvp') {
        console.log('[useScreen] Restoring from localStorage:', saved);
        return saved as Screen;
      }
    } catch (e) {
      console.error('Failed to restore screen from localStorage:', e);
    }
    console.log('[useScreen] Default screen: landing');
    return 'landing';
  });

  const [lastScreen, setLastScreen] = useState<Screen>('landing');
  const [successGuest, setSuccessGuest] = useState<{ name: string; category: string } | null>(null);
  const [rsvpGuestId, setRsvpGuestId] = useState<number | undefined>(rsvpParams.guestId);

  // Refs to track loading state and previous screen
  const hasLoadedRef = useRef(false);
  const previousScreenRef = useRef<Screen | null>(null);

  // Save current screen to both localStorage and Supabase
  const saveScreen = useCallback(async (screen: Screen) => {
    // Save to localStorage (fast, local fallback)
    if (screen !== 'success' && screen !== 'rsvp') {
      try {
        localStorage.setItem(STORAGE_KEY, screen);
      } catch (e) {
        console.error('Failed to save screen to localStorage:', e);
      }
    }

    // Save to Supabase (for cross-device sync)
    if (isSupabaseConfigured() && screen !== 'success' && screen !== 'rsvp') {
      try {
        const deviceId = getDeviceId();
        await supabase
          .from('device_state')
          .upsert({
            device_id: deviceId,
            current_screen: screen,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'device_id'
          });
      } catch (e) {
        console.error('Failed to save screen to Supabase:', e);
      }
    }
  }, []);

  // Load screen from Supabase on mount (but don't override URL params)
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      hasLoadedRef.current = true;
      return;
    }

    const loadScreenFromSupabase = async () => {
      try {
        const deviceId = getDeviceId();
        const { data } = await supabase
          .from('device_state')
          .select('current_screen')
          .eq('device_id', deviceId)
          .single();

        // Don't override if current screen is 'rsvp' (from URL params)
        // or if it's 'success' (temporary screens)
        if (data && data.current_screen && data.current_screen !== 'success' && data.current_screen !== 'rsvp') {
          // Only update if we're not already on a special screen
          if (currentScreen !== 'rsvp' && currentScreen !== 'success') {
            setCurrentScreen(data.current_screen as Screen);
            previousScreenRef.current = data.current_screen as Screen;
            localStorage.setItem(STORAGE_KEY, data.current_screen);
          }
        }
      } catch (e) {
        console.error('Failed to load screen from Supabase:', e);
      } finally {
        hasLoadedRef.current = true;
      }
    };

    loadScreenFromSupabase();
  }, []);

  // Save screen to Supabase whenever it changes (but not initial landing before load)
  useEffect(() => {
    // Skip if this is the initial render before Supabase load completes
    if (!hasLoadedRef.current) {
      return;
    }

    // Skip saving success/rsvp screens
    if (currentScreen === 'success' || currentScreen === 'rsvp') {
      return;
    }

    // Only save if screen actually changed
    if (previousScreenRef.current !== currentScreen) {
      previousScreenRef.current = currentScreen;
      saveScreen(currentScreen);
    }
  }, [currentScreen, saveScreen]);

  const navigateTo = useCallback((screen: Screen) => {
    setLastScreen(currentScreen);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    setCurrentScreen(lastScreen);
  }, [lastScreen]);

  const showSuccess = useCallback((name: string, category: string) => {
    setSuccessGuest({ name, category });
    setCurrentScreen('success');
  }, []);

  const closeSuccess = useCallback(() => {
    setSuccessGuest(null);
    setCurrentScreen('landing');
  }, []);

  const navigateToRsvp = useCallback((guestId: number) => {
    setRsvpGuestId(guestId);
    setCurrentScreen('rsvp');
  }, []);

  return {
    currentScreen,
    navigateTo,
    goBack,
    showSuccess,
    closeSuccess,
    successGuest,
    rsvpGuestId,
    navigateToRsvp,
  };
};
