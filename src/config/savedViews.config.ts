/**
 * Configuração das "Visualizações salvas" (saved views) — combinações nomeadas
 * de filtros + sort + paginação que o usuário pode salvar e reaplicar.
 *
 * Ajuste estes valores para alterar limites e chave de storage sem mexer
 * na lógica em `src/lib/savedViews.ts` ou no hook `useSavedViews`.
 */

/** Chave usada em `localStorage` para persistir as visualizações salvas. */
export const SAVED_VIEWS_STORAGE_KEY = 'singu-saved-views-v1';

/** Versão do schema do payload — incrementar ao quebrar compatibilidade. */
export const SAVED_VIEWS_SCHEMA_VERSION = 1;

/** Quantidade máxima de visualizações que podem ser salvas por escopo. */
export const SAVED_VIEWS_MAX_PER_SCOPE = 20;

/** Tamanho máximo (caracteres) do nome de uma visualização. */
export const SAVED_VIEWS_NAME_MAX_LENGTH = 60;
