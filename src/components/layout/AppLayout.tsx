import { ReactNode, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Command, Settings, LogOut, ChevronRight } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OnboardingTourWrapper } from '@/components/onboarding/OnboardingTourWrapper';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { SkipToContent } from '@/components/navigation/NavigationPatterns';
import { PageTransition } from '@/components/navigation/PageTransition';
import { SwipeBackIndicator } from '@/components/navigation/SwipeBackIndicator';
import { RouteProgressBar } from '@/components/navigation/RouteProgressBar';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import { ScrollToTopButton } from '@/components/navigation/ScrollToTopButton';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/empresas': 'Empresas',
  '/contatos': 'Contatos',
  '/interacoes': 'Conversas',
  '/calendario': 'Calendário',
  '/network': 'Network',
  '/insights': 'Insights',
  '/analytics': 'Analytics',
  '/mapa-empresas': 'Mapa',
  '/automacoes': 'Automações',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'Página';
}

/** Returns breadcrumb segments for detail pages e.g. /contatos/123 → [{label:"Contatos", path:"/contatos"}, {label:"Detalhe"}] */
function getBreadcrumbs(pathname: string, pageTitle: string): { label: string; path?: string }[] {
  const PARENT_ROUTES: Record<string, { label: string; path: string }> = {
    '/contatos': { label: 'Contatos', path: '/contatos' },
    '/empresas': { label: 'Empresas', path: '/empresas' },
    '/interacoes': { label: 'Conversas', path: '/interacoes' },
  };

  for (const [prefix, parent] of Object.entries(PARENT_ROUTES)) {
    if (pathname.startsWith(prefix + '/') && pathname !== prefix) {
      return [parent, { label: 'Detalhe' }];
    }
  }

  return [{ label: pageTitle }];
}

function AppLayoutInner({ children, title }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useKeyboardShortcutsEnhanced();

  const pageTitle = useMemo(() => title || getPageTitle(location.pathname), [title, location.pathname]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(location.pathname, pageTitle), [location.pathname, pageTitle]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <SkipToContent />
      <RouteProgressBar />
      <SwipeBackIndicator />

      {/* Screen reader route announcer */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Navegou para {pageTitle}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader onSearchClick={() => setIsOpen(true)} title={title} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header Bar */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-border/50 px-3 sm:px-5 bg-background/95 backdrop-blur-sm sticky top-0 z-30" role="banner">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors shrink-0" aria-label="Alternar sidebar" />
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />}
                  {crumb.path ? (
                    <Link to={crumb.path} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Desktop search bar */}
            <button
              onClick={() => setIsOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-secondary hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ml-auto"
              aria-label="Abrir busca rápida (⌘K)"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Buscar...</span>
              <kbd className="ml-4 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[11px] font-mono text-muted-foreground" aria-hidden="true">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative h-8 w-8 rounded-full nexus-gradient-bg flex items-center justify-center text-xs font-semibold text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Menu do usuário"
                  >
                    {(user.email?.[0] || 'U').toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-nexus-emerald border-2 border-background" aria-label="Online" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-foreground">Minha conta</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <a href="/configuracoes">
                      <Settings className="h-3.5 w-3.5" /> Configurações
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto pb-24 md:pb-8 relative" tabIndex={-1} aria-label={pageTitle}>
          {/* Subtle radial depth */}
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary)), transparent)',
          }} aria-hidden="true" />
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Components */}
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
      <div className="hidden md:flex fixed bottom-8 right-8 lg:bottom-10 lg:right-10 z-50 flex-col items-end gap-3">
        <ScrollToTopButton className="relative" />
        <QuickAddButton className="relative z-10" />
      </div>

      <NotificationCenter />
      <OnboardingTourWrapper />
      <KeyboardShortcutsCheatsheet />
      <div className="md:hidden">
        <ScrollToTopButton />
      </div>
    </div>
  );
}

const SIDEBAR_KEY = "nexus-sidebar-state";

function getDefaultOpen() {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored !== "false";
  } catch {
    return true;
  }
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen={getDefaultOpen()}
      onOpenChange={(open) => {
        try { localStorage.setItem(SIDEBAR_KEY, String(open)); } catch { /* noop */ }
      }}
    >
      <AppLayoutInner title={title}>
        {children}
      </AppLayoutInner>
    </SidebarProvider>
  );
}
