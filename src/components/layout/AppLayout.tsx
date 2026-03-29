import { ReactNode } from 'react';
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
import { SwipeBackIndicator } from '@/components/navigation/SwipeBackIndicator';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const { collapsed } = useSidebarState();
  
  // Enable keyboard shortcuts
  useKeyboardShortcutsEnhanced();
  
  // Enable swipe-back gesture on mobile
  useSwipeBack();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content for accessibility */}
      <SkipToContent />
      
      {/* Mobile Header */}
      <MobileHeader onSearchClick={() => setIsOpen(true)} title={title} />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onSearchClick={() => setIsOpen(true)} />
      </div>
      
      {/* Main Content */}
      <main 
        id="main-content"
        className={`transition-all duration-200 pb-20 md:pb-0 focus:outline-none md:ml-[280px] ${collapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'}`}
        tabIndex={-1}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Global Components */}
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
      <div className="hidden md:block">
        <QuickAddButton />
      </div>
      
      {/* Notification Center */}
      <NotificationCenter />
      
      {/* Onboarding Tour */}
      <OnboardingTourWrapper />
    </div>
  );
}
