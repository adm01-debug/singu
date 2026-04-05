import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, MessageSquare, Lightbulb, Settings,
  Zap, LogOut, CalendarDays, Bell, ChevronDown, BarChart3, Share2,
  Workflow, MapPin, PanelLeftClose, PanelLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navSections = [
  {
    label: "Principal",
    key: "principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Contatos", url: "/contatos", icon: Users },
      { title: "Conversas", url: "/interacoes", icon: MessageSquare },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Análise",
    key: "analise",
    items: [
      { title: "Network", url: "/network", icon: Share2 },
      { title: "Insights", url: "/insights", icon: Lightbulb },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operacional",
    key: "ops",
    items: [
      { title: "Mapa", url: "/mapa-empresas", icon: MapPin },
      { title: "Automações", url: "/automacoes", icon: Workflow },
    ],
  },
  {
    label: "Configuração",
    key: "config",
    items: [
      { title: "Notificações", url: "/notificacoes", icon: Bell },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

const COLLAPSED_KEY = "nexus-sidebar-sections";

function getInitialCollapsed(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* noop */ }
  return { principal: false, analise: false, ops: true, config: true };
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>(getInitialCollapsed);

  useEffect(() => {
    setSectionCollapsed(prev => {
      for (const section of navSections) {
        const hasActive = section.items.some(item =>
          item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
        );
        if (hasActive && prev[section.key]) {
          const next = { ...prev, [section.key]: false };
          try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* noop */ }
          return next;
        }
      }
      return prev;
    });
  }, [location.pathname]);

  const toggleSection = useCallback((key: string) => {
    setSectionCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
  };

  const userInitials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${(user.user_metadata.first_name as string)[0]}${(user.user_metadata.last_name as string)[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  const userName = (() => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
    const emailPrefix = user?.email?.split('@')[0] || 'Usuário';
    const cleaned = emailPrefix.replace(/[0-9_\-.]+/g, ' ').trim();
    if (!cleaned || cleaned.length < 4) return 'Minha Conta';
    return cleaned.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  })();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50" aria-label="Navegação principal">
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg nexus-gradient-bg shadow-sm">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-heading text-base font-extrabold tracking-tight" aria-label="SINGU">
              <span className="text-sidebar-accent-foreground">SINGU</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2" role="navigation" aria-label="Menu principal">
        {navSections.map((section, sectionIdx) => {
          const isCollapsedSection = sectionCollapsed[section.key] && !collapsed;
          return (
            <SidebarGroup key={section.key}>
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex items-center justify-between w-full px-2.5 mb-1 group/label hover:bg-sidebar-accent/50 rounded-md py-1 transition-colors"
                  aria-expanded={!isCollapsedSection}
                  aria-controls={`nav-section-${section.key}`}
                >
                  <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60 pointer-events-none p-0 h-auto font-semibold">
                    {section.label}
                  </SidebarGroupLabel>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-sidebar-foreground/40 transition-transform duration-200",
                      isCollapsedSection && "-rotate-90"
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                sectionIdx > 0 && <Separator className="my-1.5 mx-auto w-6 bg-sidebar-border/40" />
              )}
              <SidebarGroupContent
                id={`nav-section-${section.key}`}
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  isCollapsedSection && !collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                )}
              >
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = item.url === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "rounded-lg transition-all duration-200",
                            isActive
                              ? "text-primary font-medium bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <Link to={item.url} aria-current={isActive ? "page" : undefined}>
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                            <span>{item.title}</span>
                            {isActive && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-glow-pulse" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1.5">
        {!collapsed && (
          <>
            <Separator className="bg-sidebar-border/30" />
            {user && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/30 transition-colors">
                <div className="h-7 w-7 rounded-full nexus-gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{userName}</p>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
                  onClick={handleSignOut}
                  aria-label="Sair da conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-sidebar-foreground/40 select-none">SINGU v2.0</p>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-xs h-8"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
