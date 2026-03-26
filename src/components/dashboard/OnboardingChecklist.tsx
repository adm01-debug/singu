import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, User, Users, MessageSquare, Building2, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Surface } from '@/components/ui/surface';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  hasProfile: boolean;
  hasContacts: boolean;
  hasCompanies: boolean;
  hasInteractions: boolean;
}

export const OnboardingChecklist = memo(function OnboardingChecklist({ hasProfile, hasContacts, hasCompanies, hasInteractions }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismiss state
  useEffect(() => {
    const isDismissed = localStorage.getItem('singu_onboarding_dismissed');
    if (isDismissed === 'true') setDismissed(true);
  }, []);

  const steps: ChecklistStep[] = [
    { id: 'profile', label: 'Complete seu perfil', description: 'Adicione seu nome e empresa', icon: User, path: '/configuracoes', completed: hasProfile },
    { id: 'company', label: 'Adicione uma empresa', description: 'Cadastre sua primeira empresa', icon: Building2, path: '/empresas', completed: hasCompanies },
    { id: 'contact', label: 'Adicione um contato', description: 'Registre seu primeiro contato', icon: Users, path: '/contatos', completed: hasContacts },
    { id: 'interaction', label: 'Registre uma interação', description: 'Documente uma conversa', icon: MessageSquare, path: '/interacoes', completed: hasInteractions },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  if (dismissed || allComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('singu_onboarding_dismissed', 'true');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Surface level={2} rounded="xl" className="p-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar checklist"
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4">Primeiros passos</Typography>
          <span className="text-sm text-muted-foreground ml-auto mr-6">
            {completedCount}/{steps.length}
          </span>
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step) => {
            const Icon = step.completed ? CheckCircle2 : step.icon;
            return (
              <Link key={step.id} to={step.path}>
                <div className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/50',
                  step.completed && 'opacity-60'
                )}>
                  <div className={cn(
                    'p-1.5 rounded-md flex-shrink-0',
                    step.completed ? 'text-success' : 'text-muted-foreground bg-muted'
                  )}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      step.completed && 'line-through'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Surface>
    </motion.div>
  );
});
