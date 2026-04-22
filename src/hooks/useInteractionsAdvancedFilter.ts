import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import type { SortKey } from '@/lib/sortInteractions';
import { readAppliedCanais, writeAppliedCanais } from '@/lib/channelPersistence';
import { parseCivilDate, formatCivilDate } from '@/lib/civilDate';

export type DirecaoFilter = 'all' | 'inbound' | 'outbound';
export type ViewMode = 'list' | 'by-contact' | 'by-company';
export type DensityMode = 'comfortable' | 'compact';
export type SentimentoFilter = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface AdvancedFilters {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  direcao: DirecaoFilter;
  de?: Date;
  ate?: Date;
  sort: SortKey;
  view: ViewMode;
  density: DensityMode;
  page: number;
  perPage: number;
  sentimento?: SentimentoFilter;
}

const KEYS = ['q', 'contact', 'company', 'canais', 'direcao', 'de', 'ate', 'sort', 'view', 'density', 'page', 'perPage', 'sentimento'] as const;

const VALID_SENTIMENTOS: SentimentoFilter[] = ['positive', 'neutral', 'negative', 'mixed'];
function parseSentimento(v: string | null): SentimentoFilter | undefined {
  return (VALID_SENTIMENTOS as string[]).includes(v ?? '') ? (v as SentimentoFilter) : undefined;
}

const DENSITY_STORAGE_KEY = 'singu-interactions-density-v1';
const PERPAGE_STORAGE_KEY = 'singu-interactions-perPage-v1';
const VIEW_STORAGE_KEY = 'singu-interactions-view-v1';
const SORT_STORAGE_KEY = 'singu-interactions-sort-v1';
const Q_STORAGE_KEY = 'singu-interactions-q-v1';
const DIRECAO_STORAGE_KEY = 'singu-interactions-direcao-v1';
const CONTACT_STORAGE_KEY = 'singu-interactions-contact-v1';
const COMPANY_STORAGE_KEY = 'singu-interactions-company-v1';
const DE_STORAGE_KEY = 'singu-interactions-de-v1';
const ATE_STORAGE_KEY = 'singu-interactions-ate-v1';
const SENTIMENTO_STORAGE_KEY = 'singu-interactions-sentimento-v1';

function readLS(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch { /* noop */ }
}
function removeLS(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch { /* noop */ }
}

function parseDensity(v: string | null): DensityMode {
  return v === 'compact' ? 'compact' : 'comfortable';
}

// Whitelist e parsers de canais agora vivem em `@/lib/canaisInteracao` para
// evitar divergência com `useFicha360Filters`. Mantemos aliases locais para
// compatibilidade com o restante do arquivo (e `VALID_CHANNELS` exportado).
const VALID_CHANNELS = INTERACTION_CHANNELS_SET;
const parseCanais = (v: string | null): string[] =>
  parseCanaisFromString(v, INTERACTION_CHANNELS_SET);
const normalizeCanais = (arr: unknown): string[] =>
  normalizeCanaisArray(arr, INTERACTION_CHANNELS_SET);

const VALID_VIEWS: ViewMode[] = ['list', 'by-contact', 'by-company'];
function parseView(v: string | null): ViewMode {
  return (VALID_VIEWS as string[]).includes(v ?? '') ? (v as ViewMode) : 'list';
}

const VALID_DIRECAO: DirecaoFilter[] = ['all', 'inbound', 'outbound'];
function parseDirecao(v: string | null): DirecaoFilter {
  return (VALID_DIRECAO as string[]).includes(v ?? '') ? (v as DirecaoFilter) : 'all';
}

const VALID_SORTS: SortKey[] = ['recent', 'oldest', 'relevance', 'entity', 'channel'];
function parseSort(v: string | null): SortKey {
  return (VALID_SORTS as string[]).includes(v ?? '') ? (v as SortKey) : 'recent';
}

export const VALID_PER_PAGE = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 25;
function parsePage(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
function parsePerPage(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return (VALID_PER_PAGE as readonly number[]).includes(n) ? n : DEFAULT_PER_PAGE;
}

// `parseDate`/`serializeDate` delegam para o helper civil (sem fuso) — evita
// que `2025-01-15` vire `2025-01-14` em fusos a oeste ou avance um dia em fusos a leste.
const parseDate = parseCivilDate;
const serializeDate = formatCivilDate;


export function useInteractionsAdvancedFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: AdvancedFilters = useMemo(() => ({
    q: searchParams.get('q') ?? '',
    contact: searchParams.get('contact') ?? '',
    company: searchParams.get('company') ?? '',
    canais: parseCanais(searchParams.get('canais')),
    direcao: parseDirecao(searchParams.get('direcao')),
    de: parseDate(searchParams.get('de')),
    ate: parseDate(searchParams.get('ate')),
    sort: parseSort(searchParams.get('sort')),
    view: parseView(searchParams.get('view')),
    density: parseDensity(searchParams.get('density')),
    page: parsePage(searchParams.get('page')),
    perPage: parsePerPage(searchParams.get('perPage')),
    sentimento: parseSentimento(searchParams.get('sentimento')),
  }), [searchParams]);

  const debouncedQ = useDebounce(filters.q, 300);

  // Aviso discreto sobre canais inválidos vindos da URL (uma vez por mount).
  const warnedUrlRef = useRef(false);
  useEffect(() => {
    if (warnedUrlRef.current) return;
    const raw = searchParams.get('canais');
    if (!raw) return;
    warnedUrlRef.current = true;
    const rawList = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const valid = new Set(parseCanais(raw));
    const ignored = Array.from(
      new Set(rawList.filter((c) => !valid.has(c.toLowerCase())))
    );
    if (ignored.length > 0) {
      toast.warning('Alguns canais foram ignorados', {
        description: `Valores inválidos: ${ignored.join(', ')}`,
        duration: 4000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hidratação one-shot do localStorage no mount: URL sempre ganha sobre cache.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (searchParams.get('canais')) return;
    const cachedRaw = readAppliedCanais() ?? [];
    const cached = normalizeCanais(cachedRaw);
    const ignored = Array.isArray(cachedRaw)
      ? Array.from(new Set(
          cachedRaw
            .filter((v): v is string => typeof v === 'string')
            .filter((v) => !cached.includes(v.trim().toLowerCase()))
        ))
      : [];
    if (ignored.length > 0) {
      toast.warning('Alguns canais salvos foram ignorados', {
        description: `Valores inválidos: ${ignored.join(', ')}`,
        duration: 4000,
      });
    }
    if (cached.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set('canais', cached.join(','));
      setSearchParams(next, { replace: true });
      const labelMap: Record<string, string> = {
        whatsapp: 'WhatsApp',
        call: 'Ligação',
        email: 'E-mail',
        meeting: 'Reunião',
        video_call: 'Vídeo',
        note: 'Nota',
      };
      const labels = cached.map((c) => labelMap[c] ?? c).join(', ');
      toast.info('Filtros de canal restaurados', {
        description: labels,
        duration: 3500,
        action: {
          label: 'Limpar',
          onClick: () => {
            const sp = new URLSearchParams(window.location.search);
            sp.delete('canais');
            setSearchParams(sp, { replace: true });
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência reativa: sincroniza canais aplicados com localStorage.
  useEffect(() => {
    writeAppliedCanais(filters.canais);
  }, [filters.canais]);

  // Hidratação one-shot consolidada das preferências de visualização: URL ganha sobre cache.
  const prefsHydratedRef = useRef(false);
  useEffect(() => {
    if (prefsHydratedRef.current) return;
    prefsHydratedRef.current = true;
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if (!searchParams.get('density')) {
      const v = readLS(DENSITY_STORAGE_KEY);
      if (v === 'compact') { next.set('density', 'compact'); changed = true; }
    }
    if (!searchParams.get('perPage')) {
      const n = parseInt(readLS(PERPAGE_STORAGE_KEY) ?? '', 10);
      if ((VALID_PER_PAGE as readonly number[]).includes(n) && n !== DEFAULT_PER_PAGE) {
        next.set('perPage', String(n));
        changed = true;
      }
    }
    if (!searchParams.get('view')) {
      const v = readLS(VIEW_STORAGE_KEY);
      if (v && (VALID_VIEWS as string[]).includes(v) && v !== 'list') {
        next.set('view', v);
        changed = true;
      }
    }
    if (!searchParams.get('sort')) {
      const v = readLS(SORT_STORAGE_KEY);
      if (v && (VALID_SORTS as string[]).includes(v) && v !== 'recent') {
        next.set('sort', v);
        changed = true;
      }
    }
    if (!searchParams.get('q')) {
      const v = readLS(Q_STORAGE_KEY);
      if (v && v.trim()) { next.set('q', v); changed = true; }
    }
    if (!searchParams.get('direcao')) {
      const v = readLS(DIRECAO_STORAGE_KEY);
      if (v && (VALID_DIRECAO as string[]).includes(v) && v !== 'all') {
        next.set('direcao', v);
        changed = true;
      }
    }
    if (!searchParams.get('contact')) {
      const v = readLS(CONTACT_STORAGE_KEY);
      if (v) { next.set('contact', v); changed = true; }
    }
    if (!searchParams.get('company')) {
      const v = readLS(COMPANY_STORAGE_KEY);
      if (v) { next.set('company', v); changed = true; }
    }
    if (!searchParams.get('de')) {
      const v = readLS(DE_STORAGE_KEY);
      const d = parseDate(v);
      const s = serializeDate(d);
      if (s) { next.set('de', s); changed = true; }
    }
    if (!searchParams.get('ate')) {
      const v = readLS(ATE_STORAGE_KEY);
      const d = parseDate(v);
      const s = serializeDate(d);
      if (s) { next.set('ate', s); changed = true; }
    }
    if (!searchParams.get('sentimento')) {
      const v = readLS(SENTIMENTO_STORAGE_KEY);
      if (v && (VALID_SENTIMENTOS as string[]).includes(v)) {
        next.set('sentimento', v);
        changed = true;
      }
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência reativa: espelha preferências de visualização no localStorage.
  useEffect(() => { writeLS(DENSITY_STORAGE_KEY, filters.density); }, [filters.density]);
  useEffect(() => { writeLS(PERPAGE_STORAGE_KEY, String(filters.perPage)); }, [filters.perPage]);
  useEffect(() => { writeLS(VIEW_STORAGE_KEY, filters.view); }, [filters.view]);
  useEffect(() => { writeLS(SORT_STORAGE_KEY, filters.sort); }, [filters.sort]);
  // Persistência reativa adicional: busca, direção, entidades, datas e sentimento.
  useEffect(() => {
    if (filters.q && filters.q.trim()) writeLS(Q_STORAGE_KEY, filters.q);
    else removeLS(Q_STORAGE_KEY);
  }, [filters.q]);
  useEffect(() => {
    if (filters.direcao && filters.direcao !== 'all') writeLS(DIRECAO_STORAGE_KEY, filters.direcao);
    else removeLS(DIRECAO_STORAGE_KEY);
  }, [filters.direcao]);
  useEffect(() => {
    if (filters.contact) writeLS(CONTACT_STORAGE_KEY, filters.contact);
    else removeLS(CONTACT_STORAGE_KEY);
  }, [filters.contact]);
  useEffect(() => {
    if (filters.company) writeLS(COMPANY_STORAGE_KEY, filters.company);
    else removeLS(COMPANY_STORAGE_KEY);
  }, [filters.company]);
  useEffect(() => {
    const s = serializeDate(filters.de);
    if (s) writeLS(DE_STORAGE_KEY, s);
    else removeLS(DE_STORAGE_KEY);
  }, [filters.de]);
  useEffect(() => {
    const s = serializeDate(filters.ate);
    if (s) writeLS(ATE_STORAGE_KEY, s);
    else removeLS(ATE_STORAGE_KEY);
  }, [filters.ate]);
  useEffect(() => {
    if (filters.sentimento) writeLS(SENTIMENTO_STORAGE_KEY, filters.sentimento);
    else removeLS(SENTIMENTO_STORAGE_KEY);
  }, [filters.sentimento]);

  const setFilter = useCallback(<K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    const next = new URLSearchParams(searchParams);
    // Reset automático de page sempre que QUALQUER outro filtro mudar
    // (incluindo `view`: trocar Lista→Por empresa pode reduzir o nº de páginas
    // e deixar o usuário em uma página inexistente).
    if (key !== 'page') next.delete('page');
    if (key === 'canais') {
      const arr = normalizeCanais(value);
      if (arr.length > 0) next.set('canais', arr.join(','));
      else next.delete('canais');
    } else if (key === 'de' || key === 'ate') {
      const s = serializeDate(value as Date | undefined);
      if (s) next.set(key, s);
      else next.delete(key);
    } else if (key === 'sort') {
      const s = (value as SortKey) ?? 'recent';
      if (s && s !== 'recent') next.set('sort', s);
      else next.delete('sort');
    } else if (key === 'view') {
      const v = (value as ViewMode) ?? 'list';
      if (v && v !== 'list') next.set('view', v);
      else next.delete('view');
    } else if (key === 'density') {
      const d = (value as DensityMode) ?? 'comfortable';
      if (d === 'compact') next.set('density', 'compact');
      else next.delete('density');
    } else if (key === 'direcao') {
      const d = (value as DirecaoFilter) ?? 'all';
      if (d && d !== 'all') next.set('direcao', d);
      else next.delete('direcao');
    } else if (key === 'page') {
      const n = value as number;
      if (Number.isFinite(n) && n > 1) next.set('page', String(n));
      else next.delete('page');
    } else if (key === 'perPage') {
      const n = value as number;
      if ((VALID_PER_PAGE as readonly number[]).includes(n) && n !== DEFAULT_PER_PAGE) next.set('perPage', String(n));
      else next.delete('perPage');
    } else if (key === 'sentimento') {
      const s = value as SentimentoFilter | undefined;
      if (s && (VALID_SENTIMENTOS as string[]).includes(s)) next.set('sentimento', s);
      else next.delete('sentimento');
    } else {
      const v = (value as string) ?? '';
      if (v) next.set(key, v);
      else next.delete(key);
    }
    // Para `view` e `page` criamos uma nova entrada no histórico do navegador:
    // são mudanças de navegação intencionais e o botão "Voltar" deve revertê-las,
    // o que é essencial para links compartilhados (estado preservado em recarregar/copiar).
    // Demais filtros continuam usando `replace` para não poluir o histórico.
    const pushToHistory = key === 'view' || key === 'page';
    setSearchParams(next, { replace: !pushToHistory });
  }, [searchParams, setSearchParams]);

  const clear = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    KEYS.forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
    // Também remove TODA a persistência de filtros do localStorage para
    // que o estado limpo sobreviva a um reload da página.
    [
      DENSITY_STORAGE_KEY,
      PERPAGE_STORAGE_KEY,
      VIEW_STORAGE_KEY,
      SORT_STORAGE_KEY,
      Q_STORAGE_KEY,
      DIRECAO_STORAGE_KEY,
      CONTACT_STORAGE_KEY,
      COMPANY_STORAGE_KEY,
      DE_STORAGE_KEY,
      ATE_STORAGE_KEY,
      SENTIMENTO_STORAGE_KEY,
      // Chips de canal (aplicados, pendentes e modo auto/manual).
      'channel-applied-canais',
      'channel-pending-canais',
      'channel-sync-mode',
    ].forEach(removeLS);
  }, [searchParams, setSearchParams]);

  const applyAll = useCallback((next: Partial<AdvancedFilters>) => {
    const sp = new URLSearchParams(searchParams);
    KEYS.forEach(k => sp.delete(k));
    if (next.q) sp.set('q', next.q);
    if (next.contact) sp.set('contact', next.contact);
    if (next.company) sp.set('company', next.company);
    if (next.canais !== undefined) {
      const arr = normalizeCanais(next.canais);
      if (arr.length > 0) sp.set('canais', arr.join(','));
    }
    if (next.direcao && next.direcao !== 'all') sp.set('direcao', next.direcao);
    { const s = serializeDate(next.de); if (s) sp.set('de', s); }
    { const s = serializeDate(next.ate); if (s) sp.set('ate', s); }
    if (next.sort && next.sort !== 'recent') sp.set('sort', next.sort);
    if (next.view && next.view !== 'list') sp.set('view', next.view);
    if (next.density === 'compact') sp.set('density', 'compact');
    if (typeof next.perPage === 'number'
        && (VALID_PER_PAGE as readonly number[]).includes(next.perPage)
        && next.perPage !== DEFAULT_PER_PAGE) {
      sp.set('perPage', String(next.perPage));
    }
    if (next.sentimento && (VALID_SENTIMENTOS as string[]).includes(next.sentimento)) {
      sp.set('sentimento', next.sentimento);
    }
    // page nunca é persistida via applyAll: qualquer mudança em filtros deve voltar pra página 1.
    setSearchParams(sp, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Aplica um intervalo de datas atomicamente. Se `de > ate`, faz swap silencioso.
   * Preserva todos os outros filtros e zera page automaticamente.
   * Retorna `true` se houve swap (útil pra UI exibir feedback).
   */
  const applyDateRange = useCallback((de?: Date, ate?: Date): boolean => {
    let swapped = false;
    let from = de;
    let to = ate;
    if (from instanceof Date && to instanceof Date && from.getTime() > to.getTime()) {
      [from, to] = [to, from];
      swapped = true;
    }
    const sp = new URLSearchParams(searchParams);
    sp.delete('page');
    { const s = serializeDate(from); if (s) sp.set('de', s); else sp.delete('de'); }
    { const s = serializeDate(to); if (s) sp.set('ate', s); else sp.delete('ate'); }
    setSearchParams(sp, { replace: true });
    return swapped;
  }, [searchParams, setSearchParams]);

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.contact ? 1 : 0) +
    (filters.company ? 1 : 0) +
    (filters.canais.length > 0 ? 1 : 0) +
    (filters.direcao !== 'all' ? 1 : 0) +
    (filters.de ? 1 : 0) +
    (filters.ate ? 1 : 0) +
    (filters.sentimento ? 1 : 0);

  return { filters, debouncedQ, setFilter, clear, activeCount, applyAll, applyDateRange };
}
