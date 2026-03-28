// ==============================================
// NEURO BRAIN SYSTEMS TAB - Pie Chart, Details, Decision Speed
// ==============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { BrainSystem, BrainSystemInfo } from '@/types/neuromarketing';

interface BrainPieDataItem {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface DecisionSpeedDataItem {
  name: string;
  value: number;
  color: string;
}

interface NeuroBrainSystemsTabProps {
  brainDistribution: Record<BrainSystem, { count: number; contacts: string[] }>;
  brainPieData: BrainPieDataItem[];
  decisionSpeedData: DecisionSpeedDataItem[];
  brainSystemInfo: Record<BrainSystem, BrainSystemInfo>;
}

export const NeuroBrainSystemsTab = ({
  brainDistribution,
  brainPieData,
  decisionSpeedData,
  brainSystemInfo
}: NeuroBrainSystemsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição dos 3 Cérebros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={brainPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {brainPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brain Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhes por Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {(Object.entries(brainDistribution) as [BrainSystem, { count: number; contacts: string[] }][]).map(([system, data]) => (
                  <div
                    key={system}
                    className={`p-3 rounded-lg ${brainSystemInfo[system].bgColor} border`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{brainSystemInfo[system].icon}</span>
                        <span className="font-medium">{brainSystemInfo[system].namePt}</span>
                      </div>
                      <Badge variant="secondary">{data.count} contatos</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {brainSystemInfo[system].decisionRole}
                    </p>
                    {data.contacts.length > 0 && (
                      <p className="text-xs truncate">
                        Ex: {data.contacts.slice(0, 3).join(', ')}
                        {data.contacts.length > 3 && ` +${data.contacts.length - 3}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Decision Speed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Velocidade de Decisão do Portfólio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {decisionSpeedData.map(item => (
              <div key={item.name} className="flex-1 p-3 rounded-lg bg-muted/50 border text-center">
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
