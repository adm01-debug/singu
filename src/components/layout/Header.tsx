import { forwardRef } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { BackButton } from '@/components/navigation/BackButton';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  /** Explicit back destination. If omitted, auto-detected from route depth. */
  backTo?: string;
  /** Hide back button even on sub-pages */
  hideBack?: boolean;
}

/** Route-to-parent mapping for smart back navigation */
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
};

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header({ 
  title, 
  subtitle, 
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
    <header ref={ref} className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <BackButton
              to={resolvedBackTo}
              label="Voltar"
              variant="ghost"
              className="shrink-0 -ml-1"
            />
          )}
          <div className="min-w-0">
            <Typography variant="h3" as="h1" className="truncate">{title}</Typography>
            {subtitle && (
              <Typography variant="small" className="truncate">{subtitle}</Typography>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Notifications — hidden on mobile (MobileHeader has its own) */}
          <Link to="/notificacoes" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </Link>

          {/* Add Button */}
          {showAddButton && (
            <Button onClick={onAddClick} className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
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
