import { forwardRef, ReactNode } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/navigation/BackButton';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  backTo?: string;
  hideBack?: boolean;
}

const PARENT_ROUTES: Record<string, string> = {
  '/contatos': '/',
  '/empresas': '/',
  '/interacoes': '/',
  '/analytics': '/',
  '/insights': '/',
  '/calendario': '/',
  '/notificacoes': '/',
  '/network': '/',
  '/automacoes': '/',
  '/configuracoes': '/',
  '/mapa-empresas': '/',
};

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header({ 
  title, 
  subtitle,
  icon: PageIcon,
  showAddButton, 
  addButtonLabel, 
  onAddClick,
  backTo,
  hideBack = false,
}, ref) {
  const location = useLocation();
  const isRoot = location.pathname === '/';
  const showBack = !hideBack && !isRoot;
  const resolvedBackTo = backTo || PARENT_ROUTES[location.pathname] || '/';

  return (
    <header ref={ref} className="bg-card/80 backdrop-blur-lg border-b border-border/50 px-4 md:px-6 py-2.5 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <BackButton
              to={resolvedBackTo}
              label="Voltar"
              variant="ghost"
              className="shrink-0 -ml-1 hidden md:inline-flex"
            />
          )}
          <div className="min-w-0 flex items-center gap-2">
            {PageIcon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-1.5 rounded-lg bg-primary/8 shrink-0 hidden md:flex"
              >
                <PageIcon className="w-4 h-4 text-primary" aria-hidden="true" />
              </motion.div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Link to="/notificacoes" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notificações">
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
            </Button>
          </Link>

          {showAddButton && (
            <Button onClick={onAddClick} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline">{addButtonLabel || 'Adicionar'}</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
