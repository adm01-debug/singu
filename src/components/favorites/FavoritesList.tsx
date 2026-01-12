import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Star, GripVertical, Users, Building2, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoritesListProps {
  type?: 'contact' | 'company' | 'all';
  maxItems?: number;
  compact?: boolean;
  className?: string;
  showEmptyState?: boolean;
  allowReorder?: boolean;
}

export function FavoritesList({
  type = 'all',
  maxItems,
  compact = false,
  className,
  showEmptyState = true,
  allowReorder = false,
}: FavoritesListProps) {
  const navigate = useNavigate();
  const { 
    favorites, 
    removeFavorite, 
    reorderFavorites,
    getFavoritesByType,
  } = useFavorites();

  const filteredFavorites = type === 'all' 
    ? favorites 
    : getFavoritesByType(type);

  const displayFavorites = maxItems 
    ? filteredFavorites.slice(0, maxItems) 
    : filteredFavorites;

  const handleNavigate = (item: typeof favorites[0]) => {
    const path = item.type === 'contact' 
      ? `/contatos/${item.id}` 
      : `/empresas/${item.id}`;
    navigate(path);
  };

  const handleRemove = (e: React.MouseEvent, id: string, itemType: 'contact' | 'company') => {
    e.stopPropagation();
    removeFavorite(id, itemType);
  };

  const handleReorder = (newOrder: typeof favorites) => {
    // Find indices and reorder
    const startIndex = favorites.findIndex(f => f.id === displayFavorites[0]?.id);
    if (startIndex >= 0) {
      newOrder.forEach((item, idx) => {
        const currentIdx = favorites.findIndex(f => f.id === item.id);
        if (currentIdx !== startIndex + idx) {
          reorderFavorites(currentIdx, startIndex + idx);
        }
      });
    }
  };

  const getIcon = (itemType: 'contact' | 'company') => {
    return itemType === 'contact' 
      ? <Users className="w-4 h-4" /> 
      : <Building2 className="w-4 h-4" />;
  };

  if (displayFavorites.length === 0 && showEmptyState) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="font-medium mb-1">Nenhum favorito</h3>
            <p className="text-sm text-muted-foreground">
              {type === 'contact' 
                ? 'Adicione contatos aos favoritos para acesso rápido'
                : type === 'company'
                ? 'Adicione empresas aos favoritos para acesso rápido'
                : 'Adicione itens aos favoritos para acesso rápido'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayFavorites.length === 0) {
    return null;
  }

  const listContent = allowReorder ? (
    <Reorder.Group 
      axis="y" 
      values={displayFavorites} 
      onReorder={handleReorder}
      className="space-y-2"
    >
      {displayFavorites.map((item) => (
        <Reorder.Item 
          key={`${item.type}-${item.id}`} 
          value={item}
          className="list-none"
        >
          <FavoriteItem
            item={item}
            compact={compact}
            getIcon={getIcon}
            onNavigate={() => handleNavigate(item)}
            onRemove={(e) => handleRemove(e, item.id, item.type)}
            showDragHandle={allowReorder}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  ) : (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayFavorites.map((item) => (
          <motion.div
            key={`${item.type}-${item.id}`}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FavoriteItem
              item={item}
              compact={compact}
              getIcon={getIcon}
              onNavigate={() => handleNavigate(item)}
              onRemove={(e) => handleRemove(e, item.id, item.type)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          Favoritos
          <Badge variant="secondary" className="ml-auto text-xs">
            {filteredFavorites.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listContent}
        
        {maxItems && filteredFavorites.length > maxItems && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-muted-foreground"
            onClick={() => navigate('/favoritos')}
          >
            Ver todos os {filteredFavorites.length} favoritos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface FavoriteItemProps {
  item: {
    id: string;
    type: 'contact' | 'company';
    name: string;
    addedAt: string;
  };
  compact: boolean;
  getIcon: (type: 'contact' | 'company') => React.ReactNode;
  onNavigate: () => void;
  onRemove: (e: React.MouseEvent) => void;
  showDragHandle?: boolean;
}

function FavoriteItem({ 
  item, 
  compact, 
  getIcon, 
  onNavigate, 
  onRemove,
  showDragHandle = false,
}: FavoriteItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg transition-colors cursor-pointer',
        compact ? 'p-2 hover:bg-accent' : 'p-3 hover:bg-accent/50 border'
      )}
      onClick={onNavigate}
    >
      {showDragHandle && (
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      )}
      
      <div className={cn(
        'flex items-center justify-center rounded-lg',
        compact ? 'w-8 h-8' : 'w-10 h-10',
        item.type === 'contact' ? 'bg-primary/10 text-primary' : 'bg-accent-foreground/10 text-accent-foreground'
      )}>
        {getIcon(item.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          compact && 'text-sm'
        )}>
          {item.name}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground capitalize">
            {item.type === 'contact' ? 'Contato' : 'Empresa'}
          </p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        onClick={onRemove}
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </Button>
    </div>
  );
}
