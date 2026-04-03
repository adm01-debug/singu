import { Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3,
  Lightbulb,
  Calendar,
  Bell,
  Network,
  Settings,
  X,
  Search,
  LogOut,
  User,
  Zap,
  Workflow,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  onSearchClick?: () => void;
}

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/', section: 'Principal' },
  { icon: Users, label: 'Contatos', path: '/contatos', section: 'Principal' },
  { icon: Building2, label: 'Empresas', path: '/empresas', section: 'Principal' },
  { icon: MessageSquare, label: 'Interações', path: '/interacoes', section: 'Principal' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', section: 'Análise' },
  { icon: Lightbulb, label: 'Insights', path: '/insights', section: 'Análise' },
  { icon: Calendar, label: 'Calendário', path: '/calendario', section: 'Ferramentas' },
  { icon: Bell, label: 'Notificações', path: '/notificacoes', section: 'Ferramentas' },
  { icon: Network, label: 'Network', path: '/network', section: 'Ferramentas' },
  { icon: Workflow, label: 'Automações', path: '/automacoes', section: 'Ferramentas' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', section: 'Sistema' },
];

export function MobileSidebarDrawer({ open, onClose, onSearchClick }: MobileSidebarDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSearch = () => {
    onSearchClick?.();
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  // Group items by section
  const sections = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar z-50 md:hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-sidebar-foreground">SINGU</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <button
                onClick={handleSearch}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Buscar...</span>
                <kbd className="ml-auto text-xs bg-sidebar-accent px-2 py-0.5 rounded">⌘K</kbd>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {Object.entries(sections).map(([section, items]) => (
                <Fragment key={section}>
                  <div className="px-3 py-2 mt-4 first:mt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                      {section}
                    </span>
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <motion.button
                        key={item.path}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigate(item.path)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all",
                          active 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </Fragment>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
