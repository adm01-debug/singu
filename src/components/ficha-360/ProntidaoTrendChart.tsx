import { memo, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AccessibleChart } from '@/components/ui/accessible-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  classifyTrend,
  computeTrendSlope,
  type ProntidaoTrendPoint,
} from '@/lib/prontidaoTrend';
import {
  useProntidaoTargetStore,
  PRONTIDAO_TARGET_DEFAULT,
} from '@/stores/useProntidaoTargetStore';
import { cn } from '@/lib/utils';

export type TrendWeeks = 4 | 8 | 12 | 24;

const WEEKS_OPTIONS: { value: TrendWeeks; label: string }[] = [
  { value: 4, label: '4 semanas' },
  { value: 8, label: '8 semanas' },
  { value: 12, label: '12 semanas' },
  { value: 24, label: '24 semanas' },
];

interface Props {
  data: ProntidaoTrendPoint[];
  currentScore: number;
  simulated?: boolean;
  weeks?: TrendWeeks;
  onWeeksChange?: (w: TrendWeeks) => void;
}

const trendMeta = {
  up: {
    label: 'Melhorando',
    Icon: TrendingUp,
    className: 'bg-success/15 text-success border-success/30',
  },
  flat: {
    label: 'Estável',
    Icon: Minus,
    className: 'bg-muted text-muted-foreground border-border',
  },
  down: {
    label: 'Piorando',
    Icon: TrendingDown,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
} as const;

const makeTooltipContent = (target: number) => {
  const Comp = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ProntidaoTrendPoint }> }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    if (!p.hasData) {
      return (
        <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground">
          <div className="font-medium">Semana de {p.weekLabel}</div>
          <div className="text-muted-foreground">Sem interações registradas</div>
        </div>
      );
    }
    const diff = target > 0 ? p.score - target : null;
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground space-y-0.5">
        <div className="font-medium">Semana de {p.weekLabel}</div>
        <div>
          Score: <span className="tabular-nums font-semibold">{p.score}</span> ·{' '}
          <span className="capitalize">{p.levelLabel}</span>
        </div>
        {diff !== null && (
          <div
            className={cn(
              'tabular-nums',
              diff >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {diff >= 0 ? '+' : ''}
            {diff} pts vs. meta ({target})
          </div>
        )}
        <div className="text-muted-foreground">
          {p.interactionCount} {p.interactionCount === 1 ? 'interação' : 'interações'} na semana
        </div>
      </div>
    );
  };
  return Comp;
};

export const ProntidaoTrendChart = memo(({ data, currentScore, simulated, weeks, onWeeksChange }: Props) => {
  const valid = useMemo(() => data.filter((p) => p.hasData), [data]);

  // Janela de variação: ¼ da janela total (mín 2, máx 8) para ficar coerente com 4/8/12/24
  const variationWindow = useMemo(() => {
    const total = weeks ?? data.length ?? 8;
    return Math.min(8, Math.max(2, Math.round(total / 2)));
  }, [weeks, data.length]);

  const { slope, direction, variation, peak } = useMemo(() => {
    const s = computeTrendSlope(data, variationWindow);
    const d = classifyTrend(s);
    const lastN = valid.slice(-variationWindow);
    const v = lastN.length >= 2 ? lastN[lastN.length - 1].score - lastN[0].score : 0;
    const pk = valid.length ? Math.max(...valid.map((p) => p.score)) : 0;
    return { slope: s, direction: d, variation: v, peak: pk };
  }, [data, valid, variationWindow]);

  const meta = trendMeta[direction];

  if (valid.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Tendência do Score de Prontidão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Histórico insuficiente. Registre mais interações para ver a evolução semanal do score.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Tendência do Score de Prontidão
            {simulated && (
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning text-[10px]">
                Simulação
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {weeks !== undefined && onWeeksChange && (
              <Select
                value={String(weeks)}
                onValueChange={(v) => onWeeksChange(Number(v) as TrendWeeks)}
              >
                <SelectTrigger
                  className="h-7 w-[130px] text-xs"
                  aria-label="Período da tendência"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Badge variant="outline" className={cn('text-xs gap-1', meta.className)}>
              <meta.Icon className="h-3 w-3" aria-hidden="true" />
              {meta.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Atual</div>
            <div className="text-lg font-semibold tabular-nums">{currentScore}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Variação {variationWindow} sem.
            </div>
            <div
              className={cn(
                'text-lg font-semibold tabular-nums',
                variation > 0 && 'text-success',
                variation < 0 && 'text-destructive',
              )}
            >
              {variation > 0 ? '+' : ''}
              {variation} pts
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pico</div>
            <div className="text-lg font-semibold tabular-nums">{peak}</div>
          </div>
        </div>

        {/* Chart */}
        <AccessibleChart
          summary={`Tendência semanal do Score de Prontidão nas últimas ${data.length} semanas. Direção: ${meta.label}.`}
          columns={['Semana', 'Score']}
          data={data.map((p) => ({
            label: p.weekLabel,
            value: p.hasData ? p.score : '—',
          }))}
        >
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prontidaoTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 40, 70, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ReferenceLine
                  y={40}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <ReferenceLine
                  y={70}
                  stroke="hsl(var(--success))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <Tooltip
                  content={<TooltipContent />}
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#prontidaoTrendFill)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AccessibleChart>

        <p className="text-[11px] text-muted-foreground">
          Linhas tracejadas marcam os limiares Morno (40) e Quente (70). Tendência calculada pelos
          últimos {variationWindow} pontos · slope {slope.toFixed(1)}.
        </p>
      </CardContent>
    </Card>
  );
});
ProntidaoTrendChart.displayName = 'ProntidaoTrendChart';
