import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

interface BreadcrumbConfig {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface DynamicBreadcrumbsProps {
  items?: BreadcrumbConfig[];
  currentPage: string;
  className?: string;
}

// Route mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'empresas': 'Empresas',
  'contatos': 'Contatos',
  'interacoes': 'Interações',
  'insights': 'Insights',
  'calendario': 'Calendário',
  'configuracoes': 'Configurações',
  'notificacoes': 'Notificações',
};

export function DynamicBreadcrumbs({ items, currentPage, className }: DynamicBreadcrumbsProps) {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbConfig[] => {
    if (items) return items;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbConfig[] = [];
    
    // Skip if we're on the home page
    if (pathSegments.length === 0) return [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if it's a detail page (UUID or numeric ID)
      const isDetailPage = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                          /^\d+$/.test(segment);
      
      if (!isDetailPage && index < pathSegments.length - 1) {
        breadcrumbs.push({
          label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
        });
      }
    });
    
    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  return (
    <Breadcrumb className={cn("mb-4", className)}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {(breadcrumbItems.length > 0 || currentPage) && (
          <BreadcrumbSeparator>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </BreadcrumbSeparator>
        )}

        {/* Intermediate breadcrumbs */}
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbLink asChild>
              <Link 
                to={item.href || '#'}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon}
                {item.label}
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </BreadcrumbSeparator>
          </BreadcrumbItem>
        ))}

        {/* Current page */}
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium text-foreground">
            {currentPage}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
