import { motion } from 'framer-motion';
import { Search, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryIcons, categoryLabels } from './types';

interface InsightsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

export const InsightsFilters = ({
  searchTerm,
  setSearchTerm,
  isSearching,
  clearSearch,
  selectedCategory,
  setSelectedCategory,
}: InsightsFiltersProps) => {
  const categories = Object.keys(categoryLabels);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar insights... (tolerante a erros)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${isSearching ? 'pr-10' : ''}`}
        />
        {isSearching && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="w-full sm:w-auto">
        <div className="flex items-center gap-2 pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.map(category => {
            const Icon = categoryIcons[category] || Lightbulb;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="gap-1.5 whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" />
                {categoryLabels[category]}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
