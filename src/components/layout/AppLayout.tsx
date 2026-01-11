import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSidebarState } from '@/hooks/useSidebarState';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const { collapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader onSearchClick={() => setIsOpen(true)} title={title} />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onSearchClick={() => setIsOpen(true)} />
      </div>
      
      {/* Main Content */}
      <main 
        className="transition-all duration-200 pb-20 md:pb-0"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? (collapsed ? 72 : 280) : 0 }}
      >
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Global Components */}
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
      <div className="hidden md:block">
        <QuickAddButton />
      </div>
    </div>
  );
}
