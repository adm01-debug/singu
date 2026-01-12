import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Tag,
  UserMinus,
  Download,
  Mail,
  Star,
  Archive,
  ChevronDown,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAction: (actionId: string) => Promise<void>;
  entityType: 'contact' | 'company' | 'interaction';
  className?: string;
}

const actionsByType: Record<string, BulkAction[]> = {
  contact: [
    { id: 'add-tag', label: 'Adicionar Tag', icon: Tag },
    { id: 'add-favorite', label: 'Adicionar aos Favoritos', icon: Star },
    { id: 'export', label: 'Exportar Selecionados', icon: Download },
    { id: 'send-email', label: 'Enviar Email', icon: Mail },
    { id: 'archive', label: 'Arquivar', icon: Archive },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir os contatos selecionados? Esta ação não pode ser desfeita.',
    },
  ],
  company: [
    { id: 'add-tag', label: 'Adicionar Tag', icon: Tag },
    { id: 'add-favorite', label: 'Adicionar aos Favoritos', icon: Star },
    { id: 'export', label: 'Exportar Selecionadas', icon: Download },
    { id: 'archive', label: 'Arquivar', icon: Archive },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir as empresas selecionadas? Todos os contatos vinculados serão desassociados.',
    },
  ],
  interaction: [
    { id: 'add-tag', label: 'Adicionar Tag', icon: Tag },
    { id: 'export', label: 'Exportar Selecionadas', icon: Download },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir as interações selecionadas?',
    },
  ],
};

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onAction,
  entityType,
  className,
}: BulkActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<BulkAction | null>(null);

  const actions = actionsByType[entityType] || [];
  const isVisible = selectedCount > 0;

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmDialog(action);
      return;
    }

    await executeAction(action.id);
  };

  const executeAction = async (actionId: string) => {
    setIsProcessing(true);
    setProcessingAction(actionId);

    try {
      await onAction(actionId);
      toast.success(`Ação executada com sucesso em ${selectedCount} itens`);
    } catch (error) {
      toast.error('Erro ao executar ação');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
      setConfirmDialog(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
              'bg-card/95 backdrop-blur-lg border shadow-2xl rounded-2xl',
              'px-4 py-3 flex items-center gap-4',
              className
            )}
          >
            {/* Selection info */}
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedCount} selecionados</p>
                <p className="text-xs text-muted-foreground">de {totalCount} total</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1">
              {actions.slice(0, 3).map((action) => {
                const Icon = action.icon;
                const isLoading = processingAction === action.id;

                return (
                  <Button
                    key={action.id}
                    variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
                    size="sm"
                    onClick={() => handleAction(action)}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                );
              })}

              {actions.length > 3 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isProcessing}>
                      Mais <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.slice(3).map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <>
                          {action.variant === 'destructive' && index > 0 && (
                            <DropdownMenuSeparator />
                          )}
                          <DropdownMenuItem
                            key={action.id}
                            onClick={() => handleAction(action)}
                            className={cn(
                              action.variant === 'destructive' && 'text-destructive'
                            )}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {action.label}
                          </DropdownMenuItem>
                        </>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Selection controls */}
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              {selectedCount < totalCount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={isProcessing}
                >
                  Selecionar Todos
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSelection}
                disabled={isProcessing}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.confirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog && executeAction(confirmDialog.id)}
              disabled={isProcessing}
              className={cn(
                confirmDialog?.variant === 'destructive' &&
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
