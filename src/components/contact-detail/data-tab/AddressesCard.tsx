import { memo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExternalAddress } from '@/hooks/useContactRelationalData';
import { PrimaryBadge, SourceBadge } from './shared-badges';

interface Props {
  addresses: ExternalAddress[];
}

export const AddressesCard = memo(function AddressesCard({ addresses }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-accent" />
          Endereços ({addresses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {addresses.length > 0 ? addresses.map((a) => {
          const fullAddress = [a.logradouro, a.numero, a.complemento, a.bairro].filter(Boolean).join(', ');
          const cityState = [a.cidade, a.estado].filter(Boolean).join(' - ');
          return (
            <div key={a.id} className="rounded-lg border p-2.5 text-sm space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <PrimaryBadge isPrimary={a.is_primary} />
                {a.tipo_logradouro && <Badge variant="outline" className="text-[10px]">{a.tipo_logradouro}</Badge>}
                {a.tipo && <Badge variant="secondary" className="text-[10px] capitalize">{a.tipo}</Badge>}
                <SourceBadge fonte={a.fonte || a.origem} />
              </div>
              {fullAddress && <p className="text-foreground text-xs">{fullAddress}</p>}
              {cityState && <p className="text-xs text-muted-foreground">{cityState}{a.pais && a.pais !== 'Brasil' ? ` - ${a.pais}` : ''}</p>}
              {a.cep && <p className="text-[10px] text-muted-foreground">CEP: {a.cep}</p>}
              {a.ponto_referencia && <p className="text-[10px] text-muted-foreground italic">Ref: {a.ponto_referencia}</p>}
              {a.cidade_ibge && <p className="text-[10px] text-muted-foreground">IBGE: {a.cidade_ibge}</p>}
              <div className="flex items-center gap-2 mt-1">
                {a.latitude && a.longitude && (
                  <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />Mapa
                  </a>
                )}
                {a.google_maps_url && (
                  <a href={a.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <ExternalLink className="h-2.5 w-2.5" />Google Maps
                  </a>
                )}
                {a.google_place_id && (
                  <span className="text-[10px] text-muted-foreground">Place: {a.google_place_id.substring(0, 12)}…</span>
                )}
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum endereço registrado</p>
        )}
      </CardContent>
    </Card>
  );
});
