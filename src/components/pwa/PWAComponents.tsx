import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  WifiOff, 
  RefreshCw, 
  Share2,
  Check,
  Loader2,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Network Information API type (experimental)
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

// ============================================
// PWA EXPERIENCE COMPONENTS - Pilar 8.3
// ============================================

// Install Prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = React.forwardRef<HTMLDivElement>(function InstallPrompt(_, ref) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay to not interrupt user
      setTimeout(() => setShowPrompt(true), 30000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Instalar RelateIQ</h3>
                <p className="text-xs opacity-90 mt-1">
                  Acesse mais rápido direto da sua tela inicial
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={handleInstall}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Instalar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-white/20"
                    onClick={handleDismiss}
                  >
                    Agora não
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
});

// Offline Indicator
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowReconnecting(true);
      setTimeout(() => {
        setIsOnline(true);
        setShowReconnecting(false);
      }, 1000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnecting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className={`py-2 px-4 text-center text-sm font-medium ${
        showReconnecting 
          ? 'bg-success text-success-foreground' 
          : 'bg-warning text-warning-foreground'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {showReconnecting ? (
            <>
              <Check className="h-4 w-4" />
              <span>Conexão restaurada!</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Update Available Banner
export function UpdateAvailable({ onUpdate }: { onUpdate: () => void }) {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShow(true);
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleUpdate);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate);
      }
    };
  }, []);

  const handleUpdateClick = async () => {
    setUpdating(true);
    try {
      await onUpdate();
      window.location.reload();
    } catch (error) {
      setUpdating(false);
    }
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 px-4"
    >
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-medium">Nova versão disponível!</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUpdateClick}
          disabled={updating}
          className="bg-white text-primary hover:bg-white/90"
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar agora
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// iOS Install Instructions
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if iOS and not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = sessionStorage.getItem('ios-install-dismissed');
    
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 10000);
    }
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Instalar RelateIQ</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toque em <Share2 className="h-3 w-3 inline" /> e depois em "Adicionar à Tela de Início"
              </p>
            </div>
            <button
              onClick={() => {
                setShow(false);
                sessionStorage.setItem('ios-install-dismissed', 'true');
              }}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Notification Permission Request
export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    
    setPermission(Notification.permission);
    
    // Show prompt if not decided
    if (Notification.permission === 'default') {
      const dismissed = sessionStorage.getItem('notification-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 60000); // Show after 1 minute
      }
    }
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    setShow(false);
  };

  if (permission !== 'default' || !show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Ativar notificações?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Receba alertas sobre follow-ups, aniversários e insights importantes
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={requestPermission}>
                  <Bell className="h-4 w-4 mr-1" />
                  Ativar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShow(false);
                    sessionStorage.setItem('notification-prompt-dismissed', 'true');
                  }}
                >
                  <BellOff className="h-4 w-4 mr-1" />
                  Não
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// App Loading/Splash Screen
export function AppSplashScreen({ progress = 0 }: { progress?: number }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <span className="text-3xl font-bold text-primary">R</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">RelateIQ</h1>
        <p className="text-white/80 text-sm mb-8">Inteligência Relacional</p>
        
        <div className="w-48">
          <Progress value={progress} className="h-1 bg-white/20" />
        </div>
        <p className="text-white/60 text-xs mt-2">
          {progress < 100 ? 'Carregando...' : 'Pronto!'}
        </p>
      </motion.div>
    </motion.div>
  );
}

// Share Target Handler (for receiving shared content)
export function useShareTarget() {
  const [sharedData, setSharedData] = useState<{
    title?: string;
    text?: string;
    url?: string;
  } | null>(null);

  useEffect(() => {
    // Check URL for shared content
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const text = params.get('text');
    const url = params.get('url');

    if (title || text || url) {
      setSharedData({ 
        title: title || undefined, 
        text: text || undefined, 
        url: url || undefined 
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const clearSharedData = () => setSharedData(null);

  return { sharedData, clearSharedData };
}

// Network Status Badge
export const NetworkStatusBadge = React.forwardRef<HTMLDivElement>(function NetworkStatusBadge(_, ref) {
  const [status, setStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [effectiveType, setEffectiveType] = useState<string>('');

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }

      // Check connection quality
      const connection = navigator.connection;
      if (connection) {
        setEffectiveType(connection.effectiveType);
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setStatus('slow');
        } else {
          setStatus('online');
        }
      } else {
        setStatus('online');
      }
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = navigator.connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  if (status === 'online') return null;

  return (
    <Badge
      ref={ref}
      variant={status === 'offline' ? 'destructive' : 'secondary'}
      className="fixed bottom-4 left-4 z-40"
    >
      {status === 'offline' ? (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </>
      ) : (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Conexão lenta ({effectiveType})
        </>
      )}
    </Badge>
  );
});
