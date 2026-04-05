import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OnboardingTourWrapper } from '@/components/onboarding/OnboardingTourWrapper';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import { SkipToContent } from '@/components/navigation/NavigationPatterns';
import { PageTransition } from '@/components/navigation/PageTransition';
import { DynamicBreadcrumbs } from '@/components/navigation/DynamicBreadcrumbs';
import { SwipeBackIndicator } from '@/components/navigation/SwipeBackIndicator';
import { RouteProgressBar } from '@/components/navigation/RouteProgressBar';
import { KeyboardShortcutsCheatsheet } from '@/components/keyboard/KeyboardShortcutsCheatsheet';
import { ScrollToTopButton } from '@/components/navigation/ScrollToTopButton';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const { collapsed } = useSidebarState();
  
  // Keyboard shortcuts
  useKeyboardShortcutsEnhanced();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content for accessibility */}
      <SkipToContent />

      {/* Route transition progress bar */}
      <RouteProgressBar />

      {/* Swipe-back gesture indicator (mobile only) */}
      <SwipeBackIndicator />
      
      {/* Mobile Header */}
      <MobileHeader onSearchClick={() => setIsOpen(true)} title={title} />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onSearchClick={() => setIsOpen(true)} />
      </div>
      
      {/* Main Content */}
      <main 
        id="main-content"
        className={cn(
          'pb-24 md:pb-32 md:pr-32 lg:pr-36 focus:outline-none transition-[margin] duration-200 ease-out will-change-[margin-left]',
          collapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'
        )}
        tabIndex={-1}
      >
        <DynamicBreadcrumbs className="hidden md:flex px-6 pt-4 pb-0" />
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Global Components */}
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
      <div className="hidden md:flex fixed bottom-8 right-8 lg:bottom-10 lg:right-10 z-50 flex-col items-end gap-3">
        <ScrollToTopButton className="relative" />
        <QuickAddButton className="relative z-10" />
      </div>
      
      {/* Notification Center */}
      <NotificationCenter />
      
      {/* Onboarding Tour */}
      <OnboardingTourWrapper />
      
      {/* Global keyboard shortcuts help (? key) */}
      <KeyboardShortcutsCheatsheet />
      
      {/* Global scroll-to-top button */}
      <div className="md:hidden">
        <ScrollToTopButton />
      </div>
    </div>
  );
}
