import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ThumbsDown, ThumbsUp, Activity, Sparkles, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface WhyScoreFactor {
  key: string;
  label: string;
  /** 0-100 */
  score: number;
  /** Peso relativo, 0-1 */
  weight: number;
  detail?: string;
  trend?: 'up' | 'down' | 'flat';
}

interface WhyScoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Identificador estável para feedback (ex: "lead-score:contact:abc"). */
  scoreKey: string;
  title: string;
  subtitle?: string;
  /** Score 0-100 */
  score: number;
  factors: WhyScoreFactor[];
  recommendations?: string[];
  /** Banda qualitativa: 'low' | 'mid' | 'high' (auto se ausente). */
  band?: 'low' | 'mid' | 'high';
}

const FEEDBACK_KEY = 'singu-score-feedback-v1';

function readFeedback(): Record<string, 'up' | 'down'> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(FEEDBACK_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeFeedback(map: Record<string, 'up' | 'down'>) {
  try {
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

function deriveBand(score: number): 'low' | 'mid' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

const BAND_META: Record<'low' | 'mid' | 'high', { label: string; cls: string; indicator: string }> = {
  low: { label: 'Baixo', cls: 'text-destructive', indicator: 'bg-destructive' },
  mid: { label: 'Médio', cls: 'text-warning', indicator: 'bg-warning' },
  high: { label: 'Alto', cls: 'text-success', indicator: 'bg-success' },
};

/**
 * Drawer universal "Por que esse score?". Mostra fatores ponderados,
 * recomendações e captura feedback do usuário (👍/👎) em localStorage
 * para futuro retraining.
 */
export function WhyScoreDrawer({
  open,
  onOpenChange,
  scoreKey,
  title,
  subtitle,
  score,
  factors,
  recommendations = [],
  band,
}: WhyScoreDrawerProps) {
  const resolvedBand = band ?? deriveBand(score);
  const meta = BAND_META[resolvedBand];

  const [feedback, setFeedback] = useState<'up' | 'down' | null>(() => {
    return readFeedback()[scoreKey] ?? null;
  });

  const rankedFactors = useMemo(() => {
    const sorted = [...factors].sort((a, b) => b.weight * b.score - a.weight * a.score);
    const totalContribution = sorted.reduce((sum, f) => sum + f.weight * f.score, 0);
    return sorted.map((f, i) => {
      const contribution = f.weight * f.score;
      const contributionPct = totalContribution > 0 ? (contribution / totalContribution) * 100 : 0;
      return { ...f, contribution, contributionPct, rank: i + 1 };
    });
  }, [factors]);

  const submitFeedback = (value: 'up' | 'down') => {
    setFeedback(value);
    const all = readFeedback();
    all[scoreKey] = value;
    writeFeedback(all);
    toast.success(value === 'up' ? 'Feedback registrado: score correto' : 'Feedback registrado: score incorreto', {
      description: 'Usaremos esse sinal para refinar o modelo localmente.',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', meta.cls)} aria-hidden="true" />
            Por que esse score?
          </SheetTitle>
          <SheetDescription>{subtitle ?? title}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{title}</span>
              <Badge variant="outline" className={cn('font-semibold', meta.cls)}>
                {meta.label}
              </Badge>
            </div>
            <p className={cn('text-3xl font-bold mt-1', meta.cls)}>
              {Math.round(score)}
              <span className="text-base text-muted-foreground">/100</span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Fatores que contribuíram
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex" aria-label="Sobre a ordenação dos fatores">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] text-xs">
                    Ordenados pela contribuição real (peso × score). O fator no topo é o que mais influenciou o resultado.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            {rankedFactors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sem fatores detalhados disponíveis para esse score.
              </p>
            )}
            {rankedFactors.map((f) => {
              const contribInt = Math.round(f.contribution);
              const contribPctInt = Math.round(f.contributionPct);
              const rankBadge =
                f.rank === 1 ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    #1 maior impacto
                  </Badge>
                ) : f.rank === 2 || f.rank === 3 ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    #{f.rank}
                  </Badge>
                ) : null;

              return (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{f.label}</span>
                      {rankBadge}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {Math.round(f.score)}/100 · peso {Math.round(f.weight * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={f.score}
                    className="h-2"
                    indicatorClassName={BAND_META[deriveBand(f.score)].indicator}
                    aria-label={`Qualidade do fator: ${Math.round(f.score)}/100`}
                  />
                  <Progress
                    value={f.contributionPct}
                    className="h-1 bg-muted"
                    indicatorClassName="bg-primary/60"
                    aria-label={`Contribuição relativa: ${contribPctInt}% do score total`}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Contribuição: <span className="font-medium text-foreground/80">{contribInt} pts</span> ({contribPctInt}% do total)
                  </p>
                  {f.detail && <p className="text-[11px] text-muted-foreground">{f.detail}</p>}
                </div>
              );
            })}
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recomendações</h4>
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="text-xs leading-relaxed p-2 rounded-md bg-muted/50 border border-border/50"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">Esse score parece correto?</h4>
            <p className="text-xs text-muted-foreground">
              Seu feedback nos ajuda a calibrar o modelo. Fica salvo localmente.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={feedback === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => submitFeedback('up')}
                className="gap-1.5"
                aria-pressed={feedback === 'up'}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                Correto
              </Button>
              <Button
                type="button"
                variant={feedback === 'down' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => submitFeedback('down')}
                className="gap-1.5"
                aria-pressed={feedback === 'down'}
              >
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                Incorreto
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
