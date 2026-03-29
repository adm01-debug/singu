import { toast } from 'sonner';

type ActionType = 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'duplicate' | 'export' | 'import' | 'send' | 'save';
type EntityType = 'contato' | 'empresa' | 'interação' | 'nota' | 'automação' | 'alerta' | 'configuração' | 'relatório';

const actionLabels: Record<ActionType, { success: string; error: string; loading: string }> = {
  create: { success: 'criado(a)', error: 'criar', loading: 'Criando' },
  update: { success: 'atualizado(a)', error: 'atualizar', loading: 'Atualizando' },
  delete: { success: 'removido(a)', error: 'remover', loading: 'Removendo' },
  archive: { success: 'arquivado(a)', error: 'arquivar', loading: 'Arquivando' },
  restore: { success: 'restaurado(a)', error: 'restaurar', loading: 'Restaurando' },
  duplicate: { success: 'duplicado(a)', error: 'duplicar', loading: 'Duplicando' },
  export: { success: 'exportado(a)', error: 'exportar', loading: 'Exportando' },
  import: { success: 'importado(a)', error: 'importar', loading: 'Importando' },
  send: { success: 'enviado(a)', error: 'enviar', loading: 'Enviando' },
  save: { success: 'salvo(a)', error: 'salvar', loading: 'Salvando' },
};

interface ActionFeedbackOptions {
  action: ActionType;
  entity: EntityType;
  entityName?: string;
  /** Optional undo callback — shows undo button in toast */
  onUndo?: () => void;
}

/**
 * Standardized CRUD action feedback via Sonner toasts.
 * Ensures consistent messaging across the entire app.
 */
export function showActionFeedback(
  result: 'success' | 'error',
  options: ActionFeedbackOptions
) {
  const { action, entity, entityName, onUndo } = options;
  const labels = actionLabels[action];
  const name = entityName ? ` "${entityName}"` : '';

  if (result === 'success') {
    toast.success(`${capitalize(entity)}${name} ${labels.success} com sucesso`, {
      duration: 3000,
      action: onUndo
        ? { label: 'Desfazer', onClick: onUndo }
        : undefined,
    });
  } else {
    toast.error(`Erro ao ${labels.error} ${entity}${name}`, {
      description: 'Tente novamente em alguns instantes.',
      duration: 5000,
    });
  }
}

/**
 * Promise-based toast for async operations.
 * Shows loading → success/error automatically.
 */
export function showActionPromise<T>(
  promise: Promise<T>,
  options: Omit<ActionFeedbackOptions, 'onUndo'>
): Promise<T> {
  const { action, entity, entityName } = options;
  const labels = actionLabels[action];
  const name = entityName ? ` "${entityName}"` : '';

  toast.promise(promise, {
    loading: `${labels.loading} ${entity}${name}...`,
    success: `${capitalize(entity)}${name} ${labels.success} com sucesso`,
    error: `Erro ao ${labels.error} ${entity}${name}`,
  });

  return promise;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
