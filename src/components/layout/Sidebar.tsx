import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  MessageSquare, 
  Lightbulb, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User,
  CalendarDays,
  Bell,
  Search,
  Keyboard,
  BarChart3,
  Share2,
  Heart,
  AlertTriangle,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecentFavoritesMenu } from '@/components/navigation/RecentFavoritesMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MenuItemConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  shortcut: string;
  tourId: string;
  badgeKey?: keyof ReturnType<typeof useNotificationCounts>['counts'];
  hasMegaMenu?: boolean;
}

const menuItems: MenuItemConfig[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', shortcut: '1', tourId: 'dashboard' },
  { icon: Building2, label: 'Empresas', path: '/empresas', shortcut: '2', tourId: 'companies', hasMegaMenu: true },
  { icon: Users, label: 'Contatos', path: '/contatos', shortcut: '3', tourId: 'contacts', hasMegaMenu: true },
  { icon: MessageSquare, label: 'Conversas', path: '/interacoes', shortcut: '4', tourId: 'interactions', badgeKey: 'interactions' },
  { icon: CalendarDays, label: 'Calendário', path: '/calendario', shortcut: '5', tourId: 'calendar' },
  { icon: Share2, label: 'Network', path: '/network', shortcut: '6', tourId: 'network' },
  { icon: Lightbulb, label: 'Insights', path: '/insights', shortcut: '7', tourId: 'insights', badgeKey: 'insights' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', shortcut: '8', tourId: 'analytics' },
  { icon: Workflow, label: 'Automações', path: '/automacoes', shortcut: '9', tourId: 'automations' },
];

const bottomMenuItems: MenuItemConfig[] = [
  { icon: Bell, label: 'Notificações', path: '/notificacoes', shortcut: '0', tourId: 'notifications', badgeKey: 'total' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', shortcut: '-', tourId: 'settings' },
];

interface SidebarProps {
  onSearchClick?: () => void;
}

function KeyboardShortcutsDialog() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: [`${modKey}`, 'K'], description: 'Busca global' },
    { keys: [`${modKey}`, 'B'], description: 'Expandir/colapsar sidebar' },
    { keys: ['Alt', '1-8'], description: 'Navegar para página' },
    { keys: ['G', '1-8'], description: 'Ir para página (sequencial)' },
    { keys: ['Esc'], description: 'Fechar modal/busca' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground">
          <Keyboard className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Páginas:</strong> 1=Dashboard, 2=Empresas, 3=Contatos, 4=Interações, 5=Calendário, 6=Insights, 7=Analytics, 8=Notificações, 9=Configurações
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Sidebar({ onSearchClick }: SidebarProps) {
  const { collapsed, toggle } = useSidebarState();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { counts } = useNotificationCounts();

  // Enable keyboard navigation
  useKeyboardNavigation({
    onToggleSidebar: toggle,
    onOpenSearch: onSearchClick,
    enabled: true,
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
    navigate('/auth');
  };

  const userInitials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${(user.user_metadata.first_name as string)[0]}${(user.user_metadata.last_name as string)[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  const userName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email || 'Usuário';

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border/50 fixed left-0 top-0 z-40 backdrop-blur-xl"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0"
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <Zap className="w-5 h-5 text-white" aria-hidden="true" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col overflow-hidden"
                >
                  <span className="font-bold text-lg text-sidebar-primary-foreground whitespace-nowrap">SINGU</span>
                  <span className="text-xs text-sidebar-foreground/60 whitespace-nowrap">Inteligência Relacional</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors flex-shrink-0"
                aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <p>{collapsed ? 'Expandir' : 'Colapsar'}</p>
              <p className="text-xs text-muted-foreground">{modKey}+B</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Search Button */}
        <div className="px-3 pt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSearchClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground',
                  'border border-sidebar-border/50',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center justify-between flex-1 overflow-hidden"
                    >
                      <span className="text-sm text-sidebar-foreground/70 whitespace-nowrap">Buscar...</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-sidebar-border/50 rounded ml-2">{modKey}K</kbd>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                <p>Buscar</p>
                <p className="text-xs text-muted-foreground">{modKey}+K</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
            
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="relative group">
                    <Link
                      to={item.path}
                      data-tour={item.tourId}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                        isActive
                          ? 'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.3)]'
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <div className="relative">
                        <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'animate-pulse-soft')} />
                        {/* Badge indicator for collapsed state */}
                        {collapsed && badgeCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                          >
                            <span className="text-[9px] font-bold text-destructive-foreground">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center justify-between flex-1 overflow-hidden"
                          >
                            <span className="font-medium whitespace-nowrap">{item.label}</span>
                            <div className="flex items-center gap-1.5">
                              {badgeCount > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold"
                                >
                                  {badgeCount > 99 ? '99+' : badgeCount}
                                </Badge>
                              )}
                              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-sidebar-border/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.shortcut}
                              </kbd>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                    
                    {/* Mega Menu for Contacts and Companies */}
                    {item.hasMegaMenu && !collapsed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RecentFavoritesMenu 
                          type={item.path === '/contatos' ? 'contact' : 'company'}
                          trigger={
                            <button className="p-1 rounded hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground">
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          }
                        />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" sideOffset={10}>
                    <p>{item.label}</p>
                    {badgeCount > 0 && (
                      <p className="text-xs text-destructive">{badgeCount} pendente(s)</p>
                    )}
                    <p className="text-xs text-muted-foreground">Alt+{item.shortcut}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="py-4 px-3 border-t border-sidebar-border space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
            
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    data-tour={item.tourId}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {collapsed && badgeCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                        >
                          <span className="text-[9px] font-bold text-destructive-foreground">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex items-center justify-between flex-1 overflow-hidden"
                        >
                          <span className="font-medium whitespace-nowrap">{item.label}</span>
                          <div className="flex items-center gap-1.5">
                            {badgeCount > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold animate-pulse"
                              >
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </Badge>
                            )}
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-sidebar-border/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.shortcut}
                            </kbd>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" sideOffset={10}>
                    <p>{item.label}</p>
                    {badgeCount > 0 && (
                      <p className="text-xs text-destructive">{badgeCount} pendente(s)</p>
                    )}
                    <p className="text-xs text-muted-foreground">Alt+{item.shortcut}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {/* Keyboard Shortcuts & User Profile */}
        <div className="p-3 border-t border-sidebar-border">
          {/* Keyboard shortcuts button - only visible when expanded */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-end mb-2"
              >
                <KeyboardShortcutsDialog />
              </motion.div>
            )}
          </AnimatePresence>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 h-auto hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-0'
                )}
              >
                <OptimizedAvatar 
                  src={user?.user_metadata?.avatar_url}
                  alt="User avatar"
                  fallback={userInitials}
                  size="sm"
                  className="w-8 h-8 border-2 border-sidebar-primary/30 flex-shrink-0"
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 text-left min-w-0 overflow-hidden"
                    >
                      <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"} side={collapsed ? "right" : "top"} className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/configuracoes')}>
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/configuracoes')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
