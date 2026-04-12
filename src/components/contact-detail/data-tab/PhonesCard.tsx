import { Phone, MessageSquare, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExternalPhone } from '@/hooks/useContactRelationalData';
import { PHONE_TYPE_LABELS, formatPhoneDisplay } from './helpers';
import { ConfidenceBadge, PrimaryBadge, VerifiedBadge, SourceBadge } from './shared-badges';

interface Props {
  phones: ExternalPhone[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export function PhonesCard({ phones, copiedField, onCopy }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-primary" />
          Telefones ({phones.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {phones.length > 0 ? phones.map((p) => (
          <div key={p.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a href={`tel:${formatPhoneDisplay(p)}`} className="font-medium text-foreground hover:text-primary transition-colors">
                  {p.numero}
                </a>
                <PrimaryBadge isPrimary={p.is_primary} />
                <VerifiedBadge isVerified={p.is_verified} />
                {p.is_whatsapp && (
                  <a href={`https://wa.me/${(p.numero_e164 || p.numero).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Badge variant="outline" className="text-[10px] border-success/30 text-success cursor-pointer">
                      <MessageSquare className="h-2.5 w-2.5 mr-0.5" />WhatsApp
                    </Badge>
                  </a>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {PHONE_TYPE_LABELS[p.phone_type] || p.phone_type}
                </Badge>
                <ConfidenceBadge value={p.confiabilidade} />
                <SourceBadge fonte={p.fonte} />
              </div>
              {p.numero_e164 && p.numero_e164 !== p.numero && (
                <p className="text-[10px] text-muted-foreground mt-0.5">E.164: {p.numero_e164}</p>
              )}
              {p.contexto && <p className="text-[10px] text-muted-foreground">{p.contexto}</p>}
              {p.observacao && <p className="text-[10px] text-muted-foreground italic">{p.observacao}</p>}
            </div>
            <button
              onClick={() => onCopy(formatPhoneDisplay(p), `phone-${p.id}`)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
            >
              {copiedField === `phone-${p.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum telefone registrado</p>
        )}
      </CardContent>
    </Card>
  );
}
