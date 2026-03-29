import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseClipboardOptions {
  /** Duração em ms que `hasCopied` permanece true */
  timeout?: number;
  /** Mensagem de sucesso no toast */
  successMessage?: string;
  /** Mensagem de erro no toast */
  errorMessage?: string;
  /** Desabilitar toast automático */
  silent?: boolean;
}

interface UseClipboardReturn {
  /** Copia texto para o clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Se acabou de copiar (reseta após timeout) */
  hasCopied: boolean;
  /** Último valor copiado */
  value: string | null;
}

/**
 * Hook para copiar texto para o clipboard com feedback visual.
 * 
 * @example
 * const { copy, hasCopied } = useClipboard();
 * <Button onClick={() => copy(contact.email)}>
 *   {hasCopied ? 'Copiado!' : 'Copiar'}
 * </Button>
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    timeout = 2000,
    successMessage = 'Copiado!',
    errorMessage = 'Falha ao copiar',
    silent = false,
  } = options;

  const [hasCopied, setHasCopied] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para browsers antigos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setValue(text);
      setHasCopied(true);

      if (!silent) {
        toast.success(successMessage);
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setHasCopied(false), timeout);

      return true;
    } catch {
      if (!silent) {
        toast.error(errorMessage);
      }
      return false;
    }
  }, [timeout, successMessage, errorMessage, silent]);

  return { copy, hasCopied, value };
}
