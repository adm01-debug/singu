import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { ContactWithDISC, DISC_BG_COLORS, RadarDataItem } from './DISCAnalyticsTypes';

interface DISCPerformanceTabProps {
  compatibilityRadarData: RadarDataItem[];
  contacts: ContactWithDISC[];
}

export const DISCPerformanceTab = ({
  compatibilityRadarData,
  contacts,
}: DISCPerformanceTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar Chart - Score by Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score de Relacionamento por Perfil</CardTitle>
          <CardDescription>
            Media de relationship score por tipo DISC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={compatibilityRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="profile" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers by Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performers por Perfil</CardTitle>
          <CardDescription>
            Contatos com melhor score em cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['D', 'I', 'S', 'C'] as const).map(profile => {
              const topContact = contacts
                .filter(c => c.discProfile === profile)
                .sort((a, b) => b.relationshipScore - a.relationshipScore)[0];

              if (!topContact) return null;

              return (
                <div key={profile} className="flex items-center gap-3">
                  <DISCBadge profile={profile} size="sm" showLabel={false} />
                  <OptimizedAvatar
                    src={topContact.avatar}
                    alt={`${topContact.firstName} ${topContact.lastName}`}
                    fallback={`${(topContact.firstName || '?')[0]}${(topContact.lastName || '?')[0]}`}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {topContact.firstName} {topContact.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {topContact.companyName || 'Sem empresa'}
                    </p>
                  </div>
                  <Badge variant="outline" className={DISC_BG_COLORS[profile]}>
                    {topContact.relationshipScore}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
