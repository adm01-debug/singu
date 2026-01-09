import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useGlobalSearch();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onSearchClick={() => setIsOpen(true)} />
      <main className="ml-[280px] transition-all duration-300">
        {children}
      </main>
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
