import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  MessageSquare,
  Calendar,
  Bell,
  Search,
  FileText,
  TrendingUp,
  Heart,
  Lightbulb,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface SmartEmptyStateProps {
  type: 'contacts' | 'companies' | 'interactions' | 'calendar' | 'notifications' | 
        'search' | 'documents' | 'analytics' | 'favorites' | 'insights' | 'custom';
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: EmptyStateAction[];
  illustration?: ReactNode;
  tip?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const typeConfig: Record<string, {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
}> = {
  contacts: {
    icon: Users,
    title: 'Nenhum contato encontrado',
    description: 'Comece adicionando seu primeiro contato para gerenciar seus relacionamentos.',
    tip: 'Dica: Use Ctrl+N para adicionar um contato rapidamente.',
  },
  companies: {
    icon: Building2,
    title: 'Nenhuma empresa cadastrada',
    description: 'Adicione empresas para organizar seus contatos e oportunidades.',
    tip: 'Dica: Vincule contatos a empresas para uma visão completa.',
  },
  interactions: {
    icon: MessageSquare,
    title: 'Sem interações registradas',
    description: 'Registre suas conversas, reuniões e follow-ups para manter o histórico.',
    tip: 'Dica: Interações frequentes melhoram seu score de relacionamento.',
  },
  calendar: {
    icon: Calendar,
    title: 'Agenda vazia',
    description: 'Nenhum evento agendado para este período.',
    tip: 'Dica: Configure lembretes automáticos para follow-ups.',
  },
  notifications: {
    icon: Bell,
    title: 'Tudo em dia!',
    description: 'Você não tem notificações pendentes.',
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os termos de busca ou filtros.',
    tip: 'Dica: Use aspas para busca exata.',
  },
  documents: {
    icon: FileText,
    title: 'Sem documentos',
    description: 'Nenhum documento foi adicionado ainda.',
  },
  analytics: {
    icon: TrendingUp,
    title: 'Dados insuficientes',
    description: 'Continue registrando interações para gerar insights.',
    tip: 'Dica: Quanto mais dados, melhores as análises.',
  },
  favorites: {
    icon: Heart,
    title: 'Sem favoritos',
    description: 'Adicione contatos e empresas aos favoritos para acesso rápido.',
    tip: 'Dica: Clique no ❤️ para adicionar aos favoritos.',
  },
  insights: {
    icon: Lightbulb,
    title: 'Nenhum insight disponível',
    description: 'Insights serão gerados com base em suas interações.',
  },
  custom: {
    icon: FileText,
    title: 'Vazio',
    description: 'Nenhum item para exibir.',
  },
};

const sizeClasses = {
  sm: {
    container: 'py-6 px-4',
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-10 px-6',
    icon: 'w-14 h-14',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function SmartEmptyState({
  type,
  title,
  description,
  icon,
  actions,
  illustration,
  tip,
  className,
  size = 'md',
}: SmartEmptyStateProps) {
  const config = typeConfig[type] || typeConfig.custom;
  const Icon = icon || config.icon;
  const sizeClass = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClass.container,
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-4">{illustration}</div>
      ) : (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={cn(
            'mb-4 rounded-full bg-muted/50 p-4',
            'flex items-center justify-center'
          )}
        >
          <Icon className={cn(sizeClass.icon, 'text-muted-foreground/60')} />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={cn('font-semibold text-foreground mb-2', sizeClass.title)}
      >
        {title || config.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'text-muted-foreground max-w-sm mb-4',
          sizeClass.description
        )}
      >
        {description || config.description}
      </motion.p>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap gap-2 justify-center mb-4"
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || (index === 0 ? 'default' : 'outline')}
              onClick={action.onClick}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </motion.div>
      )}

      {/* Tip */}
      {(tip || config.tip) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground/70 flex items-center gap-1"
        >
          <Lightbulb className="w-3 h-3" />
          {tip || config.tip}
        </motion.p>
      )}
    </motion.div>
  );
}
