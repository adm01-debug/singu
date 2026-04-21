import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID_PERIODS = [7, 30, 90, 365] as const;
const DEFAULT_DAYS = 90;

export type Ficha360Period = (typeof VALID_PERIODS)[number];

/**
 * Sincroniza filtros da seção "Últimas Interações" da Ficha 360 com a URL.
 * Query params: ?periodo=<days>&canais=<csv>
 */
export function useFicha360Filters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const days: Ficha360Period = useMemo(() => {
    const raw = Number(searchParams.get('periodo'));
    return (VALID_PERIODS as readonly number[]).includes(raw)
      ? (raw as Ficha360Period)
      : DEFAULT_DAYS;
  }, [searchParams]);

  const channels: string[] = useMemo(() => {
    const raw = searchParams.get('canais');
    if (!raw) return [];
    return raw
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }, [searchParams]);

  const setDays = useCallback(
    (next: Ficha360Period) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_DAYS) sp.delete('periodo');
          else sp.set('periodo', String(next));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setChannels = useCallback(
    (next: string[]) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (!Array.isArray(next) || next.length === 0) sp.delete('canais');
          else sp.set('canais', next.join(','));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete('periodo');
        sp.delete('canais');
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const activeCount = (days !== DEFAULT_DAYS ? 1 : 0) + (channels.length > 0 ? 1 : 0);

  return { days, channels, setDays, setChannels, clear, activeCount, periods: VALID_PERIODS };
}
