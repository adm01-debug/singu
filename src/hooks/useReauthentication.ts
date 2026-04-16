import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useReauthentication() {
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const verify = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) { toast.error('Usuário não encontrado.'); return false; }
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
      if (error) { toast.error('Senha incorreta.'); return false; }
      setIsVerified(true);
      return true;
    } catch {
      toast.error('Erro na verificação.'); return false;
    } finally {
      setIsVerifying(false);
    }
  }, [user?.email]);

  const reset = useCallback(() => setIsVerified(false), []);

  return { verify, isVerifying, isVerified, reset };
}
