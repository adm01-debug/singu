import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Hash, Check } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface TagData {
  id: string;
  name: string;
  color?: string;
  category?: string;
  count?: number;
}

interface TagManagerProps {
  tags: string[];
  availableTags?: TagData[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const tagColors = [
  { name: 'Azul', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Verde', value: 'bg-green-100 text-green-700 border-green-200' },
  { name: 'Amarelo', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: 'Vermelho', value: 'bg-red-100 text-red-700 border-red-200' },
  { name: 'Roxo', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: 'Rosa', value: 'bg-pink-100 text-pink-700 border-pink-200' },
  { name: 'Laranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
  { name: 'Ciano', value: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
];

export function TagManager({
  tags,
  availableTags = [],
  onChange,
  placeholder = 'Adicionar tag...',
  maxTags = 10,
  allowCreate = true,
  showCount = false,
  size = 'md',
  className,
}: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newTagColor, setNewTagColor] = useState(tagColors[0].value);

  const filteredTags = useMemo(() => {
    const searchLower = search.toLowerCase();
    return availableTags.filter(
      t => t.name.toLowerCase().includes(searchLower) && !tags.includes(t.name)
    );
  }, [availableTags, search, tags]);

  const canAddMore = tags.length < maxTags;

  const addTag = useCallback((tagName: string) => {
    if (!canAddMore || tags.includes(tagName)) return;
    onChange([...tags, tagName]);
    setSearch('');
  }, [tags, onChange, canAddMore]);

  const removeTag = useCallback((tagName: string) => {
    onChange(tags.filter(t => t !== tagName));
  }, [tags, onChange]);

  const createTag = useCallback(() => {
    if (!search.trim() || !allowCreate || !canAddMore) return;
    addTag(search.trim());
  }, [search, allowCreate, canAddMore, addTag]);

  const getTagColor = useCallback((tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName);
    if (tag?.color) return tag.color;
    // Generate consistent color based on tag name
    const index = tagName.charCodeAt(0) % tagColors.length;
    return tagColors[index].value;
  }, [availableTags]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Current Tags */}
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {tags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 pr-1',
                  getTagColor(tag),
                  size === 'sm' ? 'text-xs py-0' : 'text-sm'
                )}
              >
                <Hash className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                {tag}
                {showCount && (
                  <span className="text-xs opacity-70 ml-0.5">
                    ({availableTags.find(t => t.name === tag)?.count || 0})
                  </span>
                )}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                  aria-label={`Remover tag ${tag}`}
                >
                  <X className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Tag Button */}
        {canAddMore && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-6 px-2 text-xs gap-1 border-dashed',
                  size === 'sm' && 'h-5 px-1.5'
                )}
              >
                <Plus className="w-3 h-3" />
                Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <Input
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredTags.length > 0) {
                        addTag(filteredTags[0].name);
                      } else if (allowCreate && search.trim()) {
                        createTag();
                      }
                    }
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />

                {/* Suggestions */}
                {filteredTags.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag.name)}
                        className={cn(
                          'w-full flex items-center justify-between px-2 py-1.5 rounded-md',
                          'text-sm text-left hover:bg-muted transition-colors'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {tag.name}
                        </span>
                        {showCount && tag.count !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {tag.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Create new tag */}
                {allowCreate && search.trim() && !availableTags.some(t => t.name.toLowerCase() === search.toLowerCase()) && (
                  <div className="border-t pt-2">
                    <button
                      onClick={createTag}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
                        'text-sm text-left hover:bg-muted transition-colors'
                      )}
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>Criar "{search}"</span>
                    </button>
                    
                    {/* Color picker */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tagColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setNewTagColor(color.value)}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 transition-transform',
                            color.value.split(' ')[0],
                            newTagColor === color.value 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          )}
                          title={color.name}
                        >
                          {newTagColor === color.value && (
                            <Check className="w-3 h-3 mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {filteredTags.length === 0 && !search.trim() && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Digite para buscar ou criar tags
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Max tags warning */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground">
          Máximo de {maxTags} tags atingido
        </p>
      )}
    </div>
  );
}
