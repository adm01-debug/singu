import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SecuritySettings } from '@/components/security/SecuritySettings';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { PasswordResetApproval } from '@/components/admin/PasswordResetApproval';
import { Shield } from 'lucide-react';

export function AccessSecurityManager() {
  return (
    <div className="space-y-4">
      <SecurityDashboard />
      <PasswordResetApproval />
      <SecuritySettings />
    </div>
  );
}
