import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Download, 
  Smartphone, 
  Check,
  X,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Notificacoes = () => {
  const { permissionState, isLoading, requestPermission, showNotification } = useNotifications();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    followUps: true,
    birthdays: true,
    insights: true,
    weeklyDigest: false,
  });

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle install
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: 'App instalado!',
        description: 'O RelateIQ foi adicionado à sua tela inicial.',
      });
    }
    setDeferredPrompt(null);
  };

  // Test notification
  const handleTestNotification = async () => {
    const success = await showNotification(
      'Teste de Notificação',
      {
        body: 'As notificações estão funcionando corretamente! 🎉',
        tag: 'test-notification',
      }
    );
    
    if (success) {
      toast({
        title: 'Notificação enviada!',
        description: 'Verifique suas notificações do sistema.',
      });
    }
  };

  const handleSettingChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    
    // Save to localStorage for persistence
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <AppLayout>
      <Header 
        title="Notificações" 
        subtitle="Configure alertas e notificações push"
      />

      <div className="p-6 space-y-6">
        {/* Install PWA Card */}
        {!isInstalled && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Instalar App</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione o RelateIQ à sua tela inicial para acesso rápido
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleInstall} className="gap-2">
                    <Download className="w-4 h-4" />
                    Instalar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Installed Badge */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-full">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">App Instalado</h3>
                    <p className="text-sm text-muted-foreground">
                      O RelateIQ está instalado no seu dispositivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notification Permission Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {permissionState.permission === 'granted' ? (
                  <Bell className="w-5 h-5 text-success" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                Status das Notificações
              </CardTitle>
              <CardDescription>
                Ative as notificações para receber alertas importantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!permissionState.supported ? (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    Seu navegador não suporta notificações push.
                  </p>
                </div>
              ) : permissionState.permission === 'denied' ? (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                  <X className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Notificações bloqueadas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para ativar, altere as permissões nas configurações do navegador.
                    </p>
                  </div>
                </div>
              ) : permissionState.permission === 'granted' ? (
                <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <p className="text-sm font-medium text-success">
                      Notificações ativadas
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleTestNotification}>
                    Testar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Ativar notificações</p>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas de follow-ups e eventos importantes
                    </p>
                  </div>
                  <Button onClick={requestPermission} disabled={isLoading}>
                    {isLoading ? 'Ativando...' : 'Ativar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Notificação</CardTitle>
              <CardDescription>
                Escolha quais notificações deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Follow-ups</p>
                    <p className="text-sm text-muted-foreground">
                      Lembretes de acompanhamento com contatos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.followUps}
                  onCheckedChange={() => handleSettingChange('followUps')}
                  disabled={permissionState.permission !== 'granted'}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Aniversários</p>
                    <p className="text-sm text-muted-foreground">
                      Alertas de aniversário de contatos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.birthdays}
                  onCheckedChange={() => handleSettingChange('birthdays')}
                  disabled={permissionState.permission !== 'granted'}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-info" />
                  <div>
                    <p className="font-medium text-foreground">Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Novos insights gerados pela IA
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.insights}
                  onCheckedChange={() => handleSettingChange('insights')}
                  disabled={permissionState.permission !== 'granted'}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Resumo Semanal</p>
                    <p className="text-sm text-muted-foreground">
                      Relatório semanal de atividades
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.weeklyDigest}
                  onCheckedChange={() => handleSettingChange('weeklyDigest')}
                  disabled={permissionState.permission !== 'granted'}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Como funcionam as notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Ative as notificações clicando no botão acima</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Permita as notificações quando o navegador solicitar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Instale o app na tela inicial para melhor experiência</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Você receberá alertas de follow-ups e eventos mesmo com o app fechado</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Notificacoes;
