import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (authLoading) return;
      
      if (!user) {
        setNeedsOnboarding(false);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding:', error);
        }

        // Check if onboarding was completed
        const preferences = profile?.preferences as { onboardingCompleted?: boolean } | null;
        const onboardingCompleted = preferences?.onboardingCompleted === true;
        
        setNeedsOnboarding(!onboardingCompleted);
      } catch (err) {
        console.error('Error checking onboarding:', err);
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, [user, authLoading]);

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    loading: loading || authLoading,
    completeOnboarding,
  };
}
