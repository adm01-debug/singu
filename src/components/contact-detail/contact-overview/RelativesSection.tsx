import { Users, Building2, Cake, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface RelativesSectionProps {
  relatives: Tables<'contact_relatives'>[];
}

export function RelativesSection({ relatives }: RelativesSectionProps) {
  return (
    <CollapsibleSection
      title="Relacionados"
      icon={Users}
      iconColor="text-secondary"
      badge={relatives.length}
      defaultOpen={relatives.length > 0}
    >
      {relatives.length > 0 ? (
        <div className="space-y-2">
          {relatives.map((rel) => (
            <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{rel.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{rel.relationship_type}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {rel.occupation && <p>{rel.occupation}</p>}
                  {rel.company && (
                    <span className="flex items-center gap-1 justify-end">
                      <Building2 className="h-3 w-3" />
                      {rel.company}
                    </span>
                  )}
                  {rel.is_decision_influencer && (
                    <Badge variant="outline" className="text-xs text-warning">Influenciador</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {rel.age && <span>{rel.age} anos</span>}
                {rel.birthday && (
                  <span className="flex items-center gap-0.5">
                    <Cake className="h-3 w-3" />
                    {format(new Date(rel.birthday), "dd/MM")}
                  </span>
                )}
                {rel.phone && (
                  <a href={`tel:${rel.phone}`} className="flex items-center gap-0.5 hover:text-foreground">
                    <Phone className="h-3 w-3" />
                    {rel.phone}
                  </a>
                )}
                {rel.email && (
                  <a href={`mailto:${rel.email}`} className="flex items-center gap-0.5 hover:text-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{rel.email}</span>
                  </a>
                )}
              </div>
              {rel.notes && (
                <p className="text-xs text-muted-foreground italic">{rel.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <InlineEmptyState icon={Users} title="Nenhum relacionado" description="Adicione familiares ou contatos próximos" />
      )}
    </CollapsibleSection>
  );
}
