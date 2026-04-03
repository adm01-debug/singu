import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageLoadingFallback } from "@/components/feedback/PageLoadingFallback";
import { logger } from "@/lib/logger";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Gate component that checks user_roles table for 'admin' role.
 * Redirects non-admins to the home page.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["user-role-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) {
        if (import.meta.env.DEV) logger.warn("Role check error:", error.message);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageLoadingFallback />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
