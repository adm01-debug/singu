import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSidebarState } from '@/hooks/useSidebarState';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();
  const { collapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onSearchClick={() => setIsOpen(true)} />
      <main 
        className="transition-all duration-200"
        style={{ marginLeft: collapsed ? 72 : 280 }}
      >
        {children}
      </main>
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
      <QuickAddButton />
    </div>
  );
}
