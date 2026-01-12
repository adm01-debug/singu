import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SEARCH_HISTORY_KEY = 'search-history';
const MAX_HISTORY_ITEMS = 10;
const MAX_SUGGESTIONS = 5;

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'suggestion' | 'trending';
  category?: string;
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClear?: () => void;
  className?: string;
  suggestions?: SearchSuggestion[];
  trendingSearches?: string[];
}

/**
 * Displays search history, suggestions, and trending searches
 */
export function SearchSuggestions({
  query,
  onSelect,
  onClear,
  className,
  suggestions = [],
  trendingSearches = [],
}: SearchSuggestionsProps) {
  const [history, setHistory] = useState<SearchSuggestion[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  // Filter and combine suggestions
  const displayedSuggestions = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    const results: SearchSuggestion[] = [];

    // Filter history matching query
    if (lowerQuery) {
      const matchingHistory = history
        .filter(item => item.text.toLowerCase().includes(lowerQuery))
        .slice(0, 3);
      results.push(...matchingHistory);
    } else {
      // Show recent history when no query
      results.push(...history.slice(0, 3));
    }

    // Add external suggestions
    const externalSuggestions = suggestions
      .filter(s => 
        lowerQuery ? s.text.toLowerCase().includes(lowerQuery) : true
      )
      .slice(0, MAX_SUGGESTIONS - results.length);
    results.push(...externalSuggestions);

    // Add trending if no query and space remaining
    if (!lowerQuery && results.length < MAX_SUGGESTIONS) {
      const trending = trendingSearches
        .slice(0, MAX_SUGGESTIONS - results.length)
        .map(text => ({
          id: `trending-${text}`,
          text,
          type: 'trending' as const,
        }));
      results.push(...trending);
    }

    return results;
  }, [query, history, suggestions, trendingSearches]);

  const handleClearHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
    onClear?.();
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'trending':
        return <TrendingUp className="w-3.5 h-3.5 text-warning" />;
      case 'suggestion':
        return <Sparkles className="w-3.5 h-3.5 text-primary" />;
      default:
        return <Search className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  if (displayedSuggestions.length === 0) return null;

  return (
    <div className={cn("py-2", className)}>
      {/* Header with clear button */}
      {history.length > 0 && !query && (
        <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Buscas recentes
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClearHistory}
          >
            Limpar histórico
          </Button>
        </div>
      )}

      {/* Suggestions List */}
      <AnimatePresence mode="popLayout">
        {displayedSuggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15, delay: index * 0.03 }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-left",
              "hover:bg-muted/50 transition-colors group",
              "focus:bg-muted/50 focus:outline-none"
            )}
            onClick={() => onSelect(suggestion)}
          >
            {getIcon(suggestion.type)}
            
            <span className="flex-1 text-sm truncate">
              {/* Highlight matching text */}
              {query ? (
                highlightMatch(suggestion.text, query)
              ) : (
                suggestion.text
              )}
            </span>

            {suggestion.category && (
              <Badge variant="secondary" className="text-[10px] h-4">
                {suggestion.category}
              </Badge>
            )}

            {suggestion.type === 'trending' && (
              <Badge variant="outline" className="text-[10px] h-4 border-warning/30 text-warning">
                trending
              </Badge>
            )}

            {suggestion.type === 'history' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveHistoryItem(suggestion.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Trending Section */}
      {!query && trendingSearches.length > 0 && history.length > 0 && (
        <>
          <div className="px-3 py-2 mt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-warning" />
              Em alta
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {trendingSearches.slice(0, 5).map(text => (
              <Badge
                key={text}
                variant="secondary"
                className="cursor-pointer hover:bg-muted-foreground/20 transition-colors"
                onClick={() => onSelect({
                  id: `trending-${text}`,
                  text,
                  type: 'trending',
                })}
              >
                {text}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Highlights matching text in a string
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <span className="text-primary font-medium">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * Utility function to save search to history
 */
export function saveSearchToHistory(text: string) {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    const history: SearchSuggestion[] = stored ? JSON.parse(stored) : [];
    
    // Remove duplicates
    const filtered = history.filter(item => item.text.toLowerCase() !== text.toLowerCase());
    
    // Add new item at start
    const updated = [
      {
        id: `history-${Date.now()}`,
        text,
        type: 'history' as const,
      },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export default SearchSuggestions;
