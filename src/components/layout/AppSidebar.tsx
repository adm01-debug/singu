import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, MessageSquare, Lightbulb, Settings,
  Zap, LogOut, User, CalendarDays, Bell, ChevronDown, BarChart3, Share2,
  Workflow, MapPin,
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

  // Auto-expand section containing the active route
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%),linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(240_50%_3%)_100%)]">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3 min-w-0 group">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_12px_32px_-12px_hsl(var(--primary)/0.6)]">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg text-sidebar-accent-foreground whitespace-nowrap tracking-tight">SINGU</span>
            <span className="text-[10px] text-primary/70 whitespace-nowrap font-semibold tracking-wider uppercase">Inteligência Relacional</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navSections.map((section, sectionIdx) => {
          const isCollapsedSection = sectionCollapsed[section.key] && !collapsed;
          return (
            <SidebarGroup key={section.key} className="py-1">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex items-center justify-between w-full px-2.5 mb-1 group/label hover:bg-sidebar-accent/50 rounded-md py-1.5 transition-colors"
                  aria-expanded={!isCollapsedSection}
                  aria-controls={`nav-section-${section.key}`}
                >
                  <SidebarGroupLabel className="p-0 h-auto text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {section.label}
                  </SidebarGroupLabel>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-sidebar-foreground/30 transition-transform duration-200",
                      isCollapsedSection && "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                sectionIdx > 0 && <Separator className="mx-auto w-6 my-1 bg-sidebar-border/50" />
              )}
              <SidebarGroupContent
                id={`nav-section-${section.key}`}
                className={cn(
                  "transition-all duration-200 overflow-hidden",
                  isCollapsedSection && !collapsed && "max-h-0 opacity-0"
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
                              ? "bg-primary/15 text-sidebar-accent-foreground border border-primary/30 shadow-[0_0_16px_-6px_hsl(var(--primary)/0.35)]"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground border border-transparent"
                          )}
                        >
                          <Link to={item.url}>
                            <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <>
            <Separator className="bg-sidebar-border/50" />
            {user && (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive flex-shrink-0"
                  onClick={handleSignOut}
                  aria-label="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between px-2 pt-1">
              <p className="text-[10px] text-sidebar-foreground/30">SINGU v2.0</p>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          <Zap className="w-4 h-4 mr-2" />
          {!collapsed && <span>Recolher</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
