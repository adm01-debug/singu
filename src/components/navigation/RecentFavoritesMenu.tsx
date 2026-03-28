import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Star, 
  Users, 
  Building2, 
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface RecentItem {
  id: string;
  type: 'contact' | 'company';
  name: string;
  subtitle?: string;
  avatar?: string;
  timestamp: Date;
}

interface FavoriteItem {
  id: string;
  type: 'contact' | 'company';
  name: string;
  subtitle?: string;
  avatar?: string;
}

const RECENT_ITEMS_KEY = 'relateiq_recent_items';
const FAVORITE_ITEMS_KEY = 'relateiq_favorite_items';

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedRecent = localStorage.getItem(RECENT_ITEMS_KEY);
    const storedFavorites = localStorage.getItem(FAVORITE_ITEMS_KEY);

    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent);
        setRecentItems(parsed.map((item: RecentItem) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        logger.error('Error parsing recent items:', e);
      }
    }

    if (storedFavorites) {
      try {
        setFavoriteItems(JSON.parse(storedFavorites));
      } catch (e) {
        logger.error('Error parsing favorites:', e);
      }
    }
  }, []);

  const addRecentItem = (item: Omit<RecentItem, 'timestamp'>) => {
    setRecentItems((prev) => {
      // Remove duplicates
      const filtered = prev.filter(
        (i) => !(i.id === item.id && i.type === item.type)
      );
      const newItems = [
        { ...item, timestamp: new Date() },
        ...filtered,
      ].slice(0, 10); // Keep only 10 most recent

      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(newItems));
      return newItems;
    });
  };

  const toggleFavorite = (item: FavoriteItem) => {
    setFavoriteItems((prev) => {
      const exists = prev.some(
        (i) => i.id === item.id && i.type === item.type
      );
      
      let newItems: FavoriteItem[];
      if (exists) {
        newItems = prev.filter(
          (i) => !(i.id === item.id && i.type === item.type)
        );
      } else {
        newItems = [...prev, item].slice(0, 20); // Max 20 favorites
      }

      localStorage.setItem(FAVORITE_ITEMS_KEY, JSON.stringify(newItems));
      return newItems;
    });
  };

  const isFavorite = (id: string, type: 'contact' | 'company') => {
    return favoriteItems.some((i) => i.id === id && i.type === type);
  };

  const clearRecent = () => {
    setRecentItems([]);
    localStorage.removeItem(RECENT_ITEMS_KEY);
  };

  return {
    recentItems,
    favoriteItems,
    addRecentItem,
    toggleFavorite,
    isFavorite,
    clearRecent,
  };
}

interface RecentFavoritesMenuProps {
  type: 'contact' | 'company';
  trigger?: React.ReactNode;
  className?: string;
}

export function RecentFavoritesMenu({ 
  type,
  trigger,
  className 
}: RecentFavoritesMenuProps) {
  const navigate = useNavigate();
  const { recentItems, favoriteItems, toggleFavorite, clearRecent } = useRecentItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const [isOpen, setIsOpen] = useState(false);

  // Filter items by type
  const filteredRecent = recentItems
    .filter((item) => item.type === type)
    .filter((item) => 
      searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredFavorites = favoriteItems
    .filter((item) => item.type === type)
    .filter((item) => 
      searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleItemClick = (item: RecentItem | FavoriteItem) => {
    const path = item.type === 'contact' 
      ? `/contatos/${item.id}` 
      : `/empresas/${item.id}`;
    navigate(path);
    setIsOpen(false);
  };

  const Icon = type === 'contact' ? Users : Building2;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
            <Icon className="h-4 w-4" />
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {type === 'contact' ? 'Contatos' : 'Empresas'}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === 'recent'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="h-3.5 w-3.5 inline mr-1.5" />
            Recentes ({filteredRecent.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === 'favorites'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className="h-3.5 w-3.5 inline mr-1.5" />
            Favoritos ({filteredFavorites.length})
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === 'recent' ? (
              <motion.div
                key="recent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {filteredRecent.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum item recente</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredRecent.map((item) => (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-2 hover:bg-muted/50 cursor-pointer group flex items-center gap-3"
                        onClick={() => handleItemClick(item)}
                      >
                        <OptimizedAvatar
                          src={item.avatar}
                          alt={item.name}
                          fallback={item.name.slice(0, 2).toUpperCase()}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                          }}
                          aria-label="Favoritar"
                        >
                          <Star className={cn(
                            "h-3.5 w-3.5",
                            favoriteItems.some(f => f.id === item.id && f.type === item.type)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )} />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {filteredFavorites.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum favorito</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredFavorites.map((item) => (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-2 hover:bg-muted/50 cursor-pointer group flex items-center gap-3"
                        onClick={() => handleItemClick(item)}
                      >
                        <OptimizedAvatar
                          src={item.avatar}
                          alt={item.name}
                          fallback={item.name.slice(0, 2).toUpperCase()}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                          }}
                          aria-label="Favoritar"
                        >
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        {activeTab === 'recent' && filteredRecent.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={clearRecent}
            >
              Limpar histórico
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default RecentFavoritesMenu;
