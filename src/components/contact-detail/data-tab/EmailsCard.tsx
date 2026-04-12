import { memo } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExternalEmail } from '@/hooks/useContactRelationalData';
import { EMAIL_TYPE_LABELS } from './helpers';
import { ConfidenceBadge, PrimaryBadge, VerifiedBadge, SourceBadge } from './shared-badges';

interface Props {
  emails: ExternalEmail[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export const EmailsCard = memo(function EmailsCard({ emails, copiedField, onCopy }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-info" />
          Emails ({emails.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {emails.length > 0 ? emails.map((e) => (
          <div key={e.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a href={`mailto:${e.email}`} className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[200px]">
                  {e.email}
                </a>
                <PrimaryBadge isPrimary={e.is_primary} />
                <VerifiedBadge isVerified={e.is_verified} />
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {EMAIL_TYPE_LABELS[e.email_type] || e.email_type}
                </Badge>
                <ConfidenceBadge value={e.confiabilidade} />
                <SourceBadge fonte={e.fonte} />
              </div>
              {e.email_normalizado && e.email_normalizado !== e.email && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Normalizado: {e.email_normalizado}</p>
              )}
              {e.contexto && <p className="text-[10px] text-muted-foreground mt-0.5">{e.contexto}</p>}
            </div>
            <button
              onClick={() => onCopy(e.email, `email-${e.id}`)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
            >
              {copiedField === `email-${e.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum email registrado</p>
        )}
      </CardContent>
    </Card>
  );
});
