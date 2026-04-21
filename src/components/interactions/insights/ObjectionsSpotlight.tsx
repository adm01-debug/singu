import { memo, useMemo } from "react";
import { Flame, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ObjectionAggregate } from "@/hooks/useInteractionsInsights";

interface Props {
  objections: ObjectionAggregate[];
}

type Severity = "high" | "medium" | "low";

interface SeverityStyle {
  border: string;
  iconColor: string;
  bar: string;
  Icon: typeof Flame;
  label: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  high: {
    border: "border-destructive/40 bg-destructive/5",
    iconColor: "text-destructive",
    bar: "bg-destructive",
    Icon: Flame,
    label: "Crítica",
  },
  medium: {
    border: "border-warning/40 bg-warning/5",
    iconColor: "text-warning",
    bar: "bg-warning",
    Icon: AlertTriangle,
    label: "Atenção",
  },
  low: {
    border: "border-success/40 bg-success/5",
    iconColor: "text-success",
    bar: "bg-success",
    Icon: CheckCircle2,
    label: "Bem tratada",
  },
};

function getSeverity(o: ObjectionAggregate): Severity {
  const rate = o.count ? (o.handled / o.count) * 100 : 0;
  if (o.unhandled >= 3 || rate <= 30) return "high";
  if (o.unhandled >= 1 || rate <= 70) return "medium";
  return "low";
}

function ObjectionsSpotlightImpl({ objections }: Props) {
  const top = useMemo(() => {
    if (!Array.isArray(objections) || objections.length === 0) return [];
    return [...objections]
      .map((o) => ({ o, score: o.unhandled * 2 + o.count }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.o);
  }, [objections]);

  if (top.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Objeções que pedem ação</h3>
        <Badge variant="outline" className="text-[10px]">Top {top.length}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {top.map((o) => {
          const severity = getSeverity(o);
          const style = SEVERITY_STYLES[severity];
          const rate = o.count ? Math.round((o.handled / o.count) * 100) : 0;
          const Icon = style.Icon;

          return (
            <div
              key={o.objection}
              className={cn("rounded-md border p-3 space-y-2.5", style.border)}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", style.iconColor)} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-foreground line-clamp-2"
                    title={o.objection}
                  >
                    {o.objection}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {o.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-4 px-1.5", style.iconColor)}
                    >
                      {style.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>
                    {o.count}× mencionada · {o.handled}/{o.count} tratadas
                  </span>
                  <span className="font-medium">{rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full transition-all", style.bar)}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>

              {o.unhandled === 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-success bg-success/8 rounded px-2 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Esta objeção está sendo bem tratada</span>
                </div>
              ) : o.suggestedResponse ? (
                <div className="flex items-start gap-1.5 text-[11px] bg-warning/8 border border-warning/20 rounded px-2 py-1.5">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-warning mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-0.5">Resposta sugerida</p>
                    <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {o.suggestedResponse}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic px-2">
                  Sem resposta sugerida disponível ainda.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ObjectionsSpotlight = memo(ObjectionsSpotlightImpl);
