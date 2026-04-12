import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetaprogramData {
  toward_score?: number;
  away_from_score?: number;
  internal_score?: number;
  external_score?: number;
  options_score?: number;
  procedures_score?: number;
}

interface Props {
  metaprograms: MetaprogramData | null;
}

export function MetaprogramsSubTab({ metaprograms }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-primary" />
          Metaprogramas NLP
        </CardTitle>
      </CardHeader>
      <CardContent>
        {metaprograms ? (
          <div className="space-y-4">
            {[
              { left: 'Toward', right: 'Away-From', leftVal: metaprograms.toward_score, rightVal: metaprograms.away_from_score },
              { left: 'Interno', right: 'Externo', leftVal: metaprograms.internal_score, rightVal: metaprograms.external_score },
              { left: 'Opções', right: 'Procedimentos', leftVal: metaprograms.options_score, rightVal: metaprograms.procedures_score },
            ].map(({ left, right, leftVal, rightVal }) => {
              const total = (leftVal || 0) + (rightVal || 0);
              const leftPct = total > 0 ? Math.round(((leftVal || 0) / total) * 100) : 50;
              return (
                <div key={left}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{left} ({leftVal || 0})</span>
                    <span>{right} ({rightVal || 0})</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
                      style={{ width: `${leftPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Análise de metaprogramas ainda não realizada</p>
        )}
      </CardContent>
    </Card>
  );
}
