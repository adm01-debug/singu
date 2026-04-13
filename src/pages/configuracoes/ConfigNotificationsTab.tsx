import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { TemplateNotificationSettings } from '@/components/triggers/TemplateNotificationSettings';
import { CompatibilityAlertSettings } from '@/components/triggers/CompatibilityAlertSettings';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  interactionReminders: boolean;
}

interface ConfigNotificationsTabProps {
  notifications: NotificationPreferences;
  onNotificationsChange: (notifications: NotificationPreferences) => void;
}

const NOTIFICATION_ITEMS = [
  { key: 'emailNotifications' as const, label: 'Notificações por Email', description: 'Receba atualizações importantes por email' },
  { key: 'pushNotifications' as const, label: 'Notificações Push', description: 'Receba notificações em tempo real no navegador' },
  { key: 'weeklyDigest' as const, label: 'Resumo Semanal', description: 'Receba um resumo semanal das suas atividades' },
  { key: 'interactionReminders' as const, label: 'Lembretes de Interação', description: 'Receba lembretes para follow-ups pendentes' },
];

export function ConfigNotificationsTab({ notifications, onNotificationsChange }: ConfigNotificationsTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como você deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {NOTIFICATION_ITEMS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(checked) => onNotificationsChange({ ...notifications, [key]: checked })}
                />
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          <TemplateNotificationSettings />
          <Separator className="my-6" />
          <CompatibilityAlertSettings />
        </CardContent>
      </Card>
    </motion.div>
  );
}
