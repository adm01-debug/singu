import { useEffect } from 'react';
import { OnboardingTour, useOnboardingTour } from './OnboardingTour';

/**
 * Wrapper autônomo para OnboardingTour que gerencia seu próprio estado
 * e inicia automaticamente para novos usuários
 */
export function OnboardingTourWrapper() {
  const { isOpen, hasCompleted, startTour, completeTour, skipTour } = useOnboardingTour('main');
  // Auto-start tour for new users after page fully loads
  useEffect(() => {
    if (!hasCompleted && !isOpen) {
      const timer = setTimeout(() => {
        startTour();
      }, 3500); // Wait for dashboard to fully render

      return () => clearTimeout(timer);
    }
  }, [hasCompleted, isOpen, startTour]);

  return (
    <OnboardingTour
      isOpen={isOpen}
      onComplete={completeTour}
      onSkip={skipTour}
    />
  );
}

export default OnboardingTourWrapper;
