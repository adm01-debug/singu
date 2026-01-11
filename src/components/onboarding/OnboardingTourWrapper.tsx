import { useEffect, useState } from 'react';
import { OnboardingTour, useOnboardingTour } from './OnboardingTour';

/**
 * Wrapper autônomo para OnboardingTour que gerencia seu próprio estado
 * e inicia automaticamente para novos usuários
 */
export function OnboardingTourWrapper() {
  const { isOpen, hasCompleted, startTour, completeTour, skipTour } = useOnboardingTour('main');
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  // Auto-start tour for new users after a short delay
  useEffect(() => {
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setShouldAutoStart(true);
      }, 2000); // 2 second delay for page to load

      return () => clearTimeout(timer);
    }
  }, [hasCompleted]);

  useEffect(() => {
    if (shouldAutoStart && !hasCompleted && !isOpen) {
      startTour();
    }
  }, [shouldAutoStart, hasCompleted, isOpen, startTour]);

  return (
    <OnboardingTour
      isOpen={isOpen}
      onComplete={completeTour}
      onSkip={skipTour}
    />
  );
}

export default OnboardingTourWrapper;
