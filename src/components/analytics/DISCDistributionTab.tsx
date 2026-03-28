import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DISCBadge } from '@/components/ui/disc-badge';
import { DISCProfile } from '@/types';
import { DistributionDataItem, BlendDataItem } from './DISCAnalyticsTypes';

interface DISCDistributionTabProps {
  distributionData: DistributionDataItem[];
  blendData: BlendDataItem[];
  totalProfiled: number;
}

export const DISCDistributionTab = ({
  distributionData,
  blendData,
  totalProfiled,
}: DISCDistributionTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuicao por Perfil</CardTitle>
            <CardDescription>
              Proporcao de cada perfil DISC no portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ profile, value }) => `${profile}: ${value}`}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} contatos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Profile Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contagem por Perfil</CardTitle>
            <CardDescription>
              Numero de contatos em cada perfil DISC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="profile" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blend Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfis Blend Mais Comuns</CardTitle>
          <CardDescription>
            Combinacoes de perfis identificadas no portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blendData.map((item, index) => (
              <div key={item.blend} className="flex items-center gap-4">
                <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </div>
                <DISCBadge profile={item.blend as DISCProfile} size="sm" />
                <div className="flex-1">
                  <Progress
                    value={(item.count / totalProfiled) * 100}
                    className="h-2"
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
