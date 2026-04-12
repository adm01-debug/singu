import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  vakProfile: Record<string, number> | null;
}

export function VakSubTab({ vakProfile }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-secondary" />
          Perfil VAK (Visual-Auditivo-Cinestésico)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {vakProfile ? (
          <div className="space-y-3">
            {[
              { key: 'visual', label: 'Visual', color: 'bg-info' },
              { key: 'auditory', label: 'Auditivo', color: 'bg-success' },
              { key: 'kinesthetic', label: 'Cinestésico', color: 'bg-accent' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted-foreground">{label}</span>
                <Progress value={vakProfile[key] || 0} className="h-3 flex-1" />
                <span className="w-10 text-right text-sm font-medium">{vakProfile[key] || 0}%</span>
              </div>
            ))}
            <div className="mt-2">
              <Badge variant="secondary">
                Canal Primário: {String(vakProfile.primary) === 'V' ? 'Visual' : String(vakProfile.primary) === 'A' ? 'Auditivo' : 'Cinestésico'}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Perfil VAK ainda não identificado</p>
        )}
      </CardContent>
    </Card>
  );
}
