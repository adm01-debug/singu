import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, Check, Rocket, Zap, Brain, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  category: 'new' | 'improvement' | 'ai' | 'security';
  isHighlight?: boolean;
}

interface WhatsNewModalProps {
  version?: string;
  features?: Feature[];
  onClose?: () => void;
}

const WHATS_NEW_KEY = 'relateiq-whats-new-seen';
const CURRENT_VERSION = '2.0.0';

const defaultFeatures: Feature[] = [
  {
    id: '1',
    title: 'Busca Inteligente com Fuzzy Search',
    description: 'Encontre contatos mesmo com erros de digitação. "joao" agora encontra "João".',
    icon: Zap,
    category: 'improvement',
    isHighlight: true,
  },
  {
    id: '2',
    title: 'Análise de Inteligência Emocional',
    description: 'Identifique automaticamente os 5 pilares de EQ de Daniel Goleman nos seus contatos.',
    icon: Brain,
    category: 'ai',
    isHighlight: true,
  },
  {
    id: '3',
    title: 'Detecção de Vieses Cognitivos',
    description: 'Entenda os padrões de pensamento dos seus contatos para comunicação mais efetiva.',
    icon: Brain,
    category: 'ai',
  },
  {
    id: '4',
    title: 'Performance Otimizada',
    description: 'Listas virtualizadas para navegação suave mesmo com milhares de contatos.',
    icon: Rocket,
    category: 'improvement',
  },
  {
    id: '5',
    title: 'Modo Offline Aprimorado',
    description: 'Continue trabalhando sem conexão. Suas alterações sincronizam automaticamente.',
    icon: Shield,
    category: 'security',
  },
  {
    id: '6',
    title: 'Ajuda Contextual',
    description: 'Tooltips explicativos em todas as métricas e funcionalidades complexas.',
    icon: Sparkles,
    category: 'new',
  },
];

const categoryConfig = {
  new: { label: 'Novo', color: 'bg-primary text-primary-foreground' },
  improvement: { label: 'Melhoria', color: 'bg-info text-info-foreground' },
  ai: { label: 'IA', color: 'bg-accent text-accent-foreground' },
  security: { label: 'Segurança', color: 'bg-success text-success-foreground' },
};

export function WhatsNewModal({
  version = CURRENT_VERSION,
  features = defaultFeatures,
  onClose,
}: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Check if user has seen this version
  useEffect(() => {
    const seenVersion = localStorage.getItem(WHATS_NEW_KEY);
    if (seenVersion !== version) {
      // Delay showing to let page load
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [version]);

  const handleClose = () => {
    localStorage.setItem(WHATS_NEW_KEY, version);
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const currentFeature = features[currentIndex];
  const isLast = currentIndex === features.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-primary p-6 text-primary-foreground relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
            style={{
              backgroundImage: 'radial-gradient(circle at center, white 0%, transparent 50%)',
              backgroundSize: '100% 100%',
            }}
          />
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                v{version}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Novidades do SINGU
            </DialogTitle>
            <p className="text-white/80 text-sm mt-1">
              Confira as últimas melhorias e funcionalidades
            </p>
          </DialogHeader>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Feature content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  categoryConfig[currentFeature.category].color
                )}>
                  <currentFeature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{currentFeature.title}</h3>
                    {currentFeature.isHighlight && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                        Destaque
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-[10px] mb-2', categoryConfig[currentFeature.category].color)}
                  >
                    {categoryConfig[currentFeature.category].label}
                  </Badge>
                  <p className="text-muted-foreground text-sm">
                    {currentFeature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted hover:bg-muted-foreground/30'
                )}
                aria-label={`Ir para item ${index + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Pular tudo
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-2">
              {isLast ? (
                <>
                  <Check className="w-4 h-4" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manually trigger the modal
export function useWhatsNew() {
  const show = () => {
    localStorage.removeItem(WHATS_NEW_KEY);
    // Trigger re-render by dispatching custom event
    window.dispatchEvent(new CustomEvent('show-whats-new'));
  };

  return { show };
}

export default WhatsNewModal;
