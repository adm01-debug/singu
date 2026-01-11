import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Abrir busca global', category: 'Navegação' },
  { keys: ['Alt', 'H'], description: 'Ir para Dashboard', category: 'Navegação' },
  { keys: ['Alt', 'C'], description: 'Ir para Contatos', category: 'Navegação' },
  { keys: ['Alt', 'E'], description: 'Ir para Empresas', category: 'Navegação' },
  { keys: ['Alt', 'I'], description: 'Ir para Interações', category: 'Navegação' },
  { keys: ['Alt', 'S'], description: 'Ir para Insights', category: 'Navegação' },
  { keys: ['Alt', 'L'], description: 'Ir para Calendário', category: 'Navegação' },
  { keys: ['Alt', 'N'], description: 'Ir para Network', category: 'Navegação' },
  
  // Quick Actions
  { keys: ['Ctrl', 'N'], description: 'Novo contato', category: 'Ações Rápidas' },
  { keys: ['Ctrl', 'J'], description: 'Nova interação', category: 'Ações Rápidas' },
  { keys: ['Ctrl', 'B'], description: 'Nova empresa', category: 'Ações Rápidas' },
  
  // UI
  { keys: ['Shift', '?'], description: 'Mostrar atalhos', category: 'Interface' },
  { keys: ['Esc'], description: 'Fechar modais', category: 'Interface' },
];

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, items], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.description}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs px-2 py-0.5"
                          >
                            {key}
                          </Badge>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Pressione <Badge variant="outline" className="font-mono text-xs mx-1">Shift</Badge> + 
            <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> para mostrar este menu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
