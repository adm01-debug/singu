import { memo, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { RapportIntel } from '@/hooks/useRapportIntelView';
import type { RapportPoints } from '@/hooks/useRapportPoints';

interface Props {
  rapportIntel: RapportIntel | null;
  rapportPoints: RapportPoints | null;
}

interface TagGroup {
  label: string;
  items: string[];
  variant: 'default' | 'secondary' | 'outline';
}

export const TagsInteresseCard = memo(({ rapportIntel, rapportPoints }: Props) => {
  const groups = useMemo<TagGroup[]>(() => {
    const safe = (arr: unknown): string[] =>
      Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
    return ([
      { label: 'Hobbies', items: safe(rapportIntel?.hobbies), variant: 'default' as const },
      { label: 'Interesses', items: safe(rapportIntel?.interests), variant: 'secondary' as const },
      { label: 'Valores', items: safe(rapportIntel?.top_values), variant: 'outline' as const },
      { label: 'Palavras frequentes', items: safe(rapportPoints?.frequent_words), variant: 'outline' as const },
      { label: 'Interesses compartilhados', items: safe(rapportPoints?.shared_interests), variant: 'secondary' as const },
    ] satisfies TagGroup[]).filter((g) => g.items.length > 0);
  }, [rapportIntel, rapportPoints]);

  const isEmpty = groups.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-primary" />
          Tags de Interesse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <InlineEmptyState
            icon={Tag}
            title="Sem tags registradas"
            description="Hobbies, interesses e valores aparecem conforme você adiciona detalhes do contato."
          />
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.slice(0, 12).map((item) => (
                    <Badge key={`${g.label}-${item}`} variant={g.variant} className="text-xs font-normal">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
TagsInteresseCard.displayName = 'TagsInteresseCard';
