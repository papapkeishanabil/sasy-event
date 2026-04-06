import { useState, useCallback } from 'react';
import { Screen } from '../types';

export const useScreen = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [lastScreen, setLastScreen] = useState<Screen>('landing');
  const [successGuest, setSuccessGuest] = useState<{ name: string; category: string } | null>(null);
  const [rsvpGuestId, setRsvpGuestId] = useState<number | undefined>(undefined);

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
