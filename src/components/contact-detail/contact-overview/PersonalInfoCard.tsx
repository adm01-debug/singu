import { Heart, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { Contact } from '@/hooks/useContactDetail';

interface PersonalInfoCardProps {
  contact: Contact;
}

export function PersonalInfoCard({ contact }: PersonalInfoCardProps) {
  const c = contact as Record<string, unknown>;
  const extFields = [
    { label: 'Apelido', value: c.apelido },
    { label: 'Nome de Tratamento', value: c.nome_tratamento },
    { label: 'CPF', value: c.cpf },
    { label: 'Sexo', value: c.sexo === 'M' ? 'Masculino' : c.sexo === 'F' ? 'Feminino' : c.sexo === 'NB' ? 'Não-binário' : c.sexo },
    { label: 'Cargo', value: c.cargo || contact.role_title },
    { label: 'Departamento', value: c.departamento },
    { label: 'Fonte', value: c.source },
    { label: 'Assinatura', value: c.assinatura_contato },
  ].filter(f => f.value);

  const interests = contact.interests || (c.interests_array as string[] | undefined);
  const extraData = c.extra_data as Record<string, unknown> | null;

  const hasAnyData = contact.notes || contact.personal_notes || contact.family_info ||
    (contact.hobbies && contact.hobbies.length > 0) ||
    (interests && interests.length > 0) ||
    c.apelido || c.cpf || extFields.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Heart className="h-4 w-4 text-primary" />
          Informações Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {extFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {extFields.map(f => (
              <div key={f.label}>
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                <p className="text-foreground">{f.value as string}</p>
              </div>
            ))}
          </div>
        )}

        {contact.notes && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Notas</span>
            <p className="text-foreground">{contact.notes}</p>
          </div>
        )}
        {contact.personal_notes && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Notas Pessoais</span>
            <p className="text-foreground">{contact.personal_notes}</p>
          </div>
        )}
        {contact.family_info && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Família</span>
            <p className="text-foreground">{contact.family_info}</p>
          </div>
        )}
        {contact.hobbies && contact.hobbies.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Hobbies</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.hobbies.map(h => <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>)}
            </div>
          </div>
        )}
        {interests && interests.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Interesses</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {interests.map(i => <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>)}
            </div>
          </div>
        )}

        {extraData && Object.keys(extraData).length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Dados Extras</span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {Object.entries(extraData).map(([key, val]) => val ? (
                <div key={key} className="rounded border px-2 py-1 text-xs">
                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}: </span>
                  <span className="text-foreground">{String(val)}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {!hasAnyData && (
          <InlineEmptyState
            icon={PenLine}
            title="Sem informações pessoais"
            description="Adicione notas, hobbies ou interesses para personalizar o relacionamento"
          />
        )}
      </CardContent>
    </Card>
  );
}
