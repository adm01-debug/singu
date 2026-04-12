import { memo } from 'react';
import {
  Globe, ExternalLink, Copy, Check, MessageSquare,
  Linkedin, Instagram, Facebook, Twitter, Youtube,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExternalSocialMedia } from '@/hooks/useContactRelationalData';
import { ConfidenceBadge, VerifiedBadge, SourceBadge } from './shared-badges';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin, instagram: Instagram, facebook: Facebook,
  twitter: Twitter, x: Twitter, youtube: Youtube,
  website: Globe, whatsapp: MessageSquare,
};

interface Props {
  socials: ExternalSocialMedia[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export const SocialsCard = memo(function SocialsCard({ socials, copiedField, onCopy }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4 text-secondary" />
          Redes Sociais ({socials.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {socials.length > 0 ? socials.map((s) => {
          const PlatformIcon = PLATFORM_ICONS[s.plataforma] || Globe;
          return (
            <div key={s.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px] flex items-center gap-0.5">
                      {s.handle || s.nome_perfil || s.plataforma}
                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{s.handle || s.nome_perfil || s.plataforma}</span>
                  )}
                  <VerifiedBadge isVerified={s.is_verified} />
                  {s.is_active === false && (
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Inativo</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">{s.plataforma}</Badge>
                  <ConfidenceBadge value={s.confiabilidade} />
                  <SourceBadge fonte={s.fonte || s.origem} />
                </div>
                {s.nome_perfil && s.handle && <p className="text-[10px] text-muted-foreground mt-0.5">{s.nome_perfil}</p>}
                {s.contexto && <p className="text-[10px] text-muted-foreground">{s.contexto}</p>}
                {s.observacoes && <p className="text-[10px] text-muted-foreground italic">{s.observacoes}</p>}
              </div>
              {s.url && (
                <button
                  onClick={() => onCopy(s.url!, `social-${s.id}`)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                >
                  {copiedField === `social-${s.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          );
        }) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma rede social registrada</p>
        )}
      </CardContent>
    </Card>
  );
});
