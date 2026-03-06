import { forwardRef } from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DynamicBreadcrumbs } from './DynamicBreadcrumbs';
import { PersonalizedGreeting } from './PersonalizedGreeting';

interface BreadcrumbConfig {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  breadcrumbs?: BreadcrumbConfig[];
  showBreadcrumbs?: boolean;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header({ 
  title, 
  subtitle, 
  showAddButton, 
  addButtonLabel, 
  onAddClick,
  breadcrumbs,
  showBreadcrumbs = true,
}, ref) {
  return (
    <header ref={ref} className="bg-card border-b border-border px-6 py-4">
      {showBreadcrumbs && (
        <DynamicBreadcrumbs items={breadcrumbs} currentPage={title} />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link to="/notificacoes">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </Link>

          {/* Add Button */}
          {showAddButton && (
            <Button onClick={onAddClick} className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              {addButtonLabel || 'Adicionar'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
