import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, User, Users, MessageSquare, Building2, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

export function OnboardingChecklist({ hasProfile, hasContacts, hasCompanies, hasInteractions }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('singu_onboarding_dismissed');
    if (isDismissed === 'true') setDismissed(true);
  }, []);

  const steps: ChecklistStep[] = [
    { id: 'profile', label: 'Complete seu perfil', description: 'Nome e empresa', icon: User, path: '/configuracoes', completed: hasProfile },
    { id: 'company', label: 'Adicione empresa', description: 'Primeira empresa', icon: Building2, path: '/empresas', completed: hasCompanies },
    { id: 'contact', label: 'Adicione contato', description: 'Primeiro contato', icon: Users, path: '/contatos', completed: hasContacts },
    { id: 'interaction', label: 'Registre interação', description: 'Primeira conversa', icon: MessageSquare, path: '/interacoes', completed: hasInteractions },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  if (dismissed || allComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('singu_onboarding_dismissed', 'true');
  };

  // Find the next incomplete step
  const nextStep = steps.find(s => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Compact header — always visible */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card/85 shadow-[0_18px_44px_-32px_hsl(var(--foreground)/0.45)] hover:border-primary/25 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-primary/12 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Typography variant="small" className="font-semibold text-foreground">
                Primeiros passos
              </Typography>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-1 mt-1.5" />
          </div>

          {/* Next step hint (when collapsed) */}
          {!isOpen && nextStep && (
            <Link to={nextStep.path} className="hidden sm:block">
               <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                {nextStep.label}
                <span className="text-muted-foreground">→</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={isOpen ? 'Recolher' : 'Expandir'}>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Fechar checklist"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Expandable steps */}
        <CollapsibleContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            {steps.map((step, idx) => {
              const Icon = step.completed ? CheckCircle2 : step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Link to={step.path}>
                    <div className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border border-border/40 bg-surface-1/55 transition-all hover:bg-primary/6 hover:border-primary/20 hover:shadow-[0_16px_36px_-28px_hsl(var(--nexus-glow)/0.35)]',
                      step.completed && 'opacity-50'
                    )}>
                      <div className={cn(
                        'p-1.5 rounded-md shrink-0',
                        step.completed ? 'text-success' : 'text-muted-foreground bg-muted'
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-xs font-medium truncate', step.completed && 'line-through')}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
