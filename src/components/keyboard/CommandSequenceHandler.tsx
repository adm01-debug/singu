import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Building2, 
  MessageSquare, 
  Flame, 
  Clock, 
  Download, 
  Sun, 
  Keyboard,
  Search,
  Settings,
  Home,
  Users,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  shortcut?: string[];
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'create' | 'action' | 'settings';
}

interface CommandSequenceContextType {
  currentSequence: string[];
  registerCommands: (commands: Command[]) => void;
  clearSequence: () => void;
  executeCommand: (id: string) => void;
}

const CommandSequenceContext = createContext<CommandSequenceContextType | null>(null);

export function useCommandSequence() {
  const context = useContext(CommandSequenceContext);
  if (!context) throw new Error('useCommandSequence must be used within CommandSequenceProvider');
  return context;
}

interface CommandSequenceProviderProps {
  children: React.ReactNode;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
  onToggleTheme?: () => void;
  onOpenCreateContact?: () => void;
  onOpenCreateCompany?: () => void;
  onOpenCreateInteraction?: () => void;
  onExport?: () => void;
}

export function CommandSequenceProvider({ 
  children,
  onOpenSearch,
  onOpenShortcuts,
  onToggleTheme,
  onOpenCreateContact,
  onOpenCreateCompany,
  onOpenCreateInteraction,
  onExport,
}: CommandSequenceProviderProps) {
  const navigate = useNavigate();
  const [currentSequence, setCurrentSequence] = useState<string[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);

  // Default commands
  const defaultCommands: Command[] = [
    // Navigation commands
    { 
      id: 'go-home', 
      label: 'Ir para Dashboard', 
      shortcut: ['G', 'H'],
      icon: Home,
      action: () => navigate('/'),
      category: 'navigation',
    },
    { 
      id: 'go-contacts', 
      label: 'Ir para Contatos', 
      shortcut: ['G', 'C'],
      icon: Users,
      action: () => navigate('/contatos'),
      category: 'navigation',
    },
    { 
      id: 'go-companies', 
      label: 'Ir para Empresas', 
      shortcut: ['G', 'E'],
      icon: Building2,
      action: () => navigate('/empresas'),
      category: 'navigation',
    },
    { 
      id: 'go-interactions', 
      label: 'Ir para Interações', 
      shortcut: ['G', 'I'],
      icon: MessageSquare,
      action: () => navigate('/interacoes'),
      category: 'navigation',
    },
    { 
      id: 'go-analytics', 
      label: 'Ir para Analytics', 
      shortcut: ['G', 'A'],
      icon: BarChart3,
      action: () => navigate('/analytics'),
      category: 'navigation',
    },
    { 
      id: 'go-settings', 
      label: 'Ir para Configurações', 
      shortcut: ['G', 'S'],
      icon: Settings,
      action: () => navigate('/configuracoes'),
      category: 'navigation',
    },
    // Creation commands
    { 
      id: 'create-contact', 
      label: 'Criar Contato', 
      shortcut: ['N', 'C'],
      icon: UserPlus,
      action: () => onOpenCreateContact?.(),
      category: 'create',
    },
    { 
      id: 'create-company', 
      label: 'Criar Empresa', 
      shortcut: ['N', 'E'],
      icon: Building2,
      action: () => onOpenCreateCompany?.(),
      category: 'create',
    },
    { 
      id: 'create-interaction', 
      label: 'Nova Interação', 
      shortcut: ['N', 'I'],
      icon: MessageSquare,
      action: () => onOpenCreateInteraction?.(),
      category: 'create',
    },
    // Action commands
    { 
      id: 'open-search', 
      label: 'Abrir Busca', 
      shortcut: ['/', '/'],
      icon: Search,
      action: () => onOpenSearch?.(),
      category: 'action',
    },
    { 
      id: 'export-all', 
      label: 'Exportar Dados', 
      shortcut: ['E', 'X'],
      icon: Download,
      action: () => onExport?.(),
      category: 'action',
    },
    // Settings commands
    { 
      id: 'toggle-theme', 
      label: 'Alternar Tema', 
      shortcut: ['T', 'T'],
      icon: Sun,
      action: () => onToggleTheme?.(),
      category: 'settings',
    },
    { 
      id: 'keyboard-shortcuts', 
      label: 'Ver Atalhos', 
      shortcut: ['?', '?'],
      icon: Keyboard,
      action: () => onOpenShortcuts?.(),
      category: 'settings',
    },
  ];

  useEffect(() => {
    setCommands(defaultCommands);
  }, [onOpenSearch, onOpenShortcuts, onToggleTheme, onOpenCreateContact, onOpenCreateCompany, onOpenCreateInteraction, onExport]);

  const registerCommands = useCallback((newCommands: Command[]) => {
    setCommands(prev => [...prev, ...newCommands]);
  }, []);

  const clearSequence = useCallback(() => {
    setCurrentSequence([]);
    setShowSequence(false);
  }, []);

  const executeCommand = useCallback((id: string) => {
    const command = commands.find(c => c.id === id);
    if (command) {
      command.action();
      clearSequence();
    }
  }, [commands, clearSequence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Ignore modifier combinations
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();
      
      // Handle special keys
      if (key === 'ESCAPE') {
        clearSequence();
        return;
      }

      // Build new sequence
      const newSequence = [...currentSequence, key];
      
      // Check for exact match
      const exactMatch = commands.find(cmd => 
        cmd.shortcut && 
        cmd.shortcut.length === newSequence.length &&
        cmd.shortcut.join('') === newSequence.join('')
      );
      
      if (exactMatch) {
        e.preventDefault();
        exactMatch.action();
        clearSequence();
        return;
      }
      
      // Check for partial match (prefix)
      const hasPartialMatch = commands.some(cmd =>
        cmd.shortcut && 
        cmd.shortcut.length > newSequence.length &&
        cmd.shortcut.slice(0, newSequence.length).join('') === newSequence.join('')
      );
      
      if (hasPartialMatch) {
        e.preventDefault();
        setCurrentSequence(newSequence);
        setShowSequence(true);
        
        // Clear after timeout
        const timeout = setTimeout(() => {
          clearSequence();
        }, 1500);
        
        return () => clearTimeout(timeout);
      } else {
        // No match, reset
        clearSequence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSequence, commands, clearSequence]);

  // Find matching commands for current sequence
  const matchingCommands = commands.filter(cmd =>
    cmd.shortcut && 
    cmd.shortcut.length > currentSequence.length &&
    cmd.shortcut.slice(0, currentSequence.length).join('') === currentSequence.join('')
  );

  return (
    <CommandSequenceContext.Provider value={{
      currentSequence,
      registerCommands,
      clearSequence,
      executeCommand,
    }}>
      {children}
      
      {/* Sequence indicator */}
      <AnimatePresence>
        {showSequence && currentSequence.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-popover border rounded-xl shadow-2xl p-4 min-w-[200px]">
              {/* Current sequence */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-muted-foreground">Sequência:</span>
                <div className="flex gap-1">
                  {currentSequence.map((key, i) => (
                    <motion.kbd
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm font-mono"
                    >
                      {key}
                    </motion.kbd>
                  ))}
                </div>
              </div>
              
              {/* Matching commands */}
              {matchingCommands.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Continue com:</p>
                  {matchingCommands.slice(0, 5).map((cmd) => (
                    <div 
                      key={cmd.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <cmd.icon className="w-4 h-4 text-muted-foreground" />
                        {cmd.label}
                      </span>
                      <div className="flex gap-0.5">
                        {cmd.shortcut?.slice(currentSequence.length).map((key, i) => (
                          <kbd 
                            key={i}
                            className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Progress bar */}
              <motion.div 
                className="mt-3 h-1 bg-muted rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CommandSequenceContext.Provider>
  );
}

export default CommandSequenceProvider;
