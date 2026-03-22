import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Monitor,
  Save,
  Camera,
  Sparkles,
  Brain,
  GraduationCap,
  FileText,
  Smartphone,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAccessibleToast } from '@/hooks/useAccessibleToast';
import { cn } from '@/lib/utils';
import { TemplateNotificationSettings } from '@/components/triggers/TemplateNotificationSettings';
import { SalespersonProfileSettings } from '@/components/triggers/SalespersonProfileSettings';
import { CommunicationTrainingMode } from '@/components/triggers/CommunicationTrainingMode';
import { CompatibilityAlertSettings } from '@/components/triggers/CompatibilityAlertSettings';
import { WeeklyReportPanel } from '@/components/dashboard/WeeklyReportPanel';
import { TourPreferencesPanel } from '@/components/settings/TourPreferencesPanel';
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const Configuracoes = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const accessibleToast = useAccessibleToast();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    avatar_url: null,
  });

  // Guard against accidental navigation with unsaved changes
  useUnsavedChangesGuard(hasUnsavedChanges);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    interactionReminders: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
        }
      });

      setHasUnsavedChanges(false);
      accessibleToast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      accessibleToast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const userInitials = profile.first_name && profile.last_name
    ? `${(profile.first_name || '')[0] || 'U'}${(profile.last_name || '')[0] || ''}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const;

  return (
    <AppLayout>
      <Header 
        title="Configurações" 
        subtitle="Gerencie seu perfil, preferências e configurações do sistema"
      />
      
      <div className="p-6 space-y-6">

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="nlp" className="gap-2">
              <Brain className="w-4 h-4" />
              Meu PNL
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Treinamento
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-2">
              <Smartphone className="w-4 h-4" />
              App
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informações do Perfil
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <OptimizedAvatar
                        src={profile.avatar_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        fallback={userInitials}
                        size="xl"
                        className="border-4 border-primary/20"
                      />
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {profile.first_name && profile.last_name 
                          ? `${profile.first_name} ${profile.last_name}` 
                          : 'Seu Nome'}
                      </h3>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Membro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nome</Label>
                      <Input
                        id="first_name"
                        value={profile.first_name}
                        onChange={(e) => { setProfile({ ...profile, first_name: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input
                        id="last_name"
                        value={profile.last_name}
                        onChange={(e) => { setProfile({ ...profile, last_name: e.target.value }); setHasUnsavedChanges(true); }}
                        placeholder="Seu sobrenome"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                      <Save className="w-4 h-4" />
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* NLP Profile Tab */}
          <TabsContent value="nlp">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SalespersonProfileSettings />
            </motion.div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CommunicationTrainingMode />
            </motion.div>
          </TabsContent>

          {/* Weekly Reports Tab */}
          <TabsContent value="reports">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <WeeklyReportPanel />
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Tema</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {themeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200',
                            theme === option.value
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div className={cn(
                            'p-4 rounded-full',
                            theme === option.value 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          )}>
                            <option.icon className="w-6 h-6" />
                          </div>
                          <span className={cn(
                            'font-medium',
                            theme === option.value ? 'text-primary' : 'text-foreground'
                          )}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'system' 
                        ? 'O tema será ajustado automaticamente de acordo com as preferências do seu sistema.'
                        : theme === 'dark'
                        ? 'Tema escuro ativado. Ideal para ambientes com pouca luz.'
                        : 'Tema claro ativado. Ideal para ambientes bem iluminados.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Theme Customizer */}
              <ThemeCustomizer />
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notificações
                  </CardTitle>
                  <CardDescription>
                    Configure como você deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Notificações por Email</p>
                        <p className="text-sm text-muted-foreground">
                          Receba atualizações importantes por email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Notificações Push</p>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações em tempo real no navegador
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Resumo Semanal</p>
                        <p className="text-sm text-muted-foreground">
                          Receba um resumo semanal das suas atividades
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyDigest}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, weeklyDigest: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Lembretes de Interação</p>
                        <p className="text-sm text-muted-foreground">
                          Receba lembretes para follow-ups pendentes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.interactionReminders}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, interactionReminders: checked })
                        }
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Template Success Notifications */}
                  <TemplateNotificationSettings />
                  
                  <Separator className="my-6" />
                  
                  {/* Compatibility Alert Settings */}
                  <CompatibilityAlertSettings />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Segurança
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Alterar Senha</p>
                          <p className="text-sm text-muted-foreground">
                            Atualize sua senha de acesso
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Alterar
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Sessões Ativas</p>
                          <p className="text-sm text-muted-foreground">
                            Gerencie os dispositivos conectados à sua conta
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Sessões
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-destructive">Excluir Conta</p>
                          <p className="text-sm text-muted-foreground">
                            Exclua permanentemente sua conta e todos os dados
                          </p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* App/Tour Tab */}
          <TabsContent value="app">
            <TourPreferencesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
