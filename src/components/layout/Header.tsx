import { forwardRef } from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
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
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground sm:gap-2.5">
            {breadcrumbs?.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.href ? (
                  <Link to={item.href} className="transition-colors hover:text-foreground">{item.label}</Link>
                ) : (
                  <span>{item.label}</span>
                )}
                <span className="mx-1" aria-hidden="true">/</span>
              </li>
            ))}
            <li className="font-medium text-foreground">{title}</li>
          </ol>
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h3" as="h1">{title}</Typography>
          {subtitle && (
            <Typography variant="small">{subtitle}</Typography>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link to="/notificacoes">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </Link>

          {/* Add Button */}
          {showAddButton && (
            <Button onClick={onAddClick} className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              {addButtonLabel || 'Adicionar'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';