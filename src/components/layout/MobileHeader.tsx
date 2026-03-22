import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, Zap } from 'lucide-react';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  onSearchClick?: () => void;
  title?: string;
}

export function MobileHeader({ onSearchClick, title }: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 md:hidden bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </motion.button>

          {/* Logo or Title */}
          <div className="flex items-center gap-2">
            {title ? (
              <h1 className="text-base font-semibold text-foreground">{title}</h1>
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-base text-foreground">SINGU</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSearchClick}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl hover:bg-muted transition-colors relative"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </header>

      <MobileSidebarDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        onSearchClick={onSearchClick}
      />
    </>
  );
}
