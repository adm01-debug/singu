import {
  Building2,
  Users,
  MessageSquare,
  Search,
  ExternalLink,
  Lightbulb,
  Settings,
  Bell,
  CalendarDays,
  LayoutDashboard,
  UserPlus,
  Building,
  MessagesSquare,
} from 'lucide-react';

export interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  title: string;
  subtitle?: string;
  meta?: string;
}

export interface RecentItem {
  id: string;
  type: 'contact' | 'company' | 'interaction' | 'page';
  title: string;
  path: string;
  timestamp: number;
}

export interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const navigationItems = [
  {
    key: '1',
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral e métricas',
  },
  {
    key: '2',
    path: '/empresas',
    label: 'Empresas',
    icon: Building2,
    description: 'Gerenciar empresas',
  },
  {
    key: '3',
    path: '/contatos',
    label: 'Contatos',
    icon: Users,
    description: 'Gerenciar contatos',
  },
  {
    key: '4',
    path: '/interacoes',
    label: 'Interações',
    icon: MessageSquare,
    description: 'Histórico de interações',
  },
  {
    key: '5',
    path: '/calendario',
    label: 'Calendário',
    icon: CalendarDays,
    description: 'Eventos e lembretes',
  },
  {
    key: '6',
    path: '/insights',
    label: 'Insights',
    icon: Lightbulb,
    description: 'Análises e tendências',
  },
  {
    key: '7',
    path: '/notificacoes',
    label: 'Notificações',
    icon: Bell,
    description: 'Alertas e avisos',
  },
  {
    key: '8',
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    description: 'Preferências do sistema',
  },
];

export const quickActions = [
  {
    id: 'new-contact',
    label: 'Novo Contato',
    description: 'Adicionar um novo contato à sua rede',
    icon: UserPlus,
    shortcut: 'C',
    color: 'primary',
    path: '/contatos?new=true',
  },
  {
    id: 'new-company',
    label: 'Nova Empresa',
    description: 'Cadastrar uma nova empresa',
    icon: Building,
    shortcut: 'E',
    color: 'accent',
    path: '/empresas?new=true',
  },
  {
    id: 'new-interaction',
    label: 'Nova Interação',
    description: 'Registrar uma nova interação',
    icon: MessagesSquare,
    shortcut: 'I',
    color: 'warning',
    path: '/interacoes?new=true',
  },
];

// Local storage key for recent items
const RECENT_ITEMS_KEY = 'command-palette-recent';
const MAX_RECENT_ITEMS = 5;

export function getRecentItems(): RecentItem[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (_err) {
    // localStorage unavailable
    return [];
  }
}

export function addRecentItem(item: Omit<RecentItem, 'timestamp'>) {
  const recent = getRecentItems();
  const filtered = recent.filter(r => !(r.id === item.id && r.type === item.type));
  const newRecent = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(newRecent));
}

// Normalize text removing accents for better matching
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function getTypeIcon(type: string) {
  switch (type) {
    case 'contact':
      return Users;
    case 'company':
      return Building2;
    case 'interaction':
      return MessageSquare;
    case 'page':
      return ExternalLink;
    default:
      return Search;
  }
}

export function getColorClass(color: string) {
  switch (color) {
    case 'primary':
      return 'bg-primary/10 text-primary';
    case 'accent':
      return 'bg-accent/10 text-accent';
    case 'warning':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
