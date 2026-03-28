// ==============================================
// NEURO CHEMISTRY TAB - Neurochemical Profile
// ==============================================

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Neurochemical, NeurochemicalInfo } from '@/types/neuromarketing';

interface NeurochemicalBarDataItem {
  name: string;
  count: number;
  icon: string;
}

interface NeuroChemistryTabProps {
  neurochemicalBarData: NeurochemicalBarDataItem[];
  neurochemicalInfo: Record<Neurochemical, NeurochemicalInfo>;
}

export const NeuroChemistryTab = ({
  neurochemicalBarData,
  neurochemicalInfo
}: NeuroChemistryTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Perfil Neuroquímico do Portfólio</CardTitle>
          <CardDescription>
            Neuroquímicos dominantes baseados nos perfis comportamentais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={neurochemicalBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{payload[0].payload.icon} {payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value} contatos
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Neurochemical Application Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {neurochemicalBarData.slice(0, 4).map((item, index) => {
          const chemKey = Object.entries(neurochemicalInfo).find(
            ([_, info]) => info.namePt === item.name
          )?.[0] as Neurochemical | undefined;

          if (!chemKey) return null;
          const info = neurochemicalInfo[chemKey];

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${info.bgColor}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <h4 className="font-semibold">{info.namePt}</h4>
                  <p className="text-xs text-muted-foreground">{item.count} contatos</p>
                </div>
              </div>
              <p className="text-sm mb-2">{info.effectPt}</p>
              <div className="text-xs p-2 bg-background/50 rounded">
                <span className="font-medium">Aplicação:</span> {info.salesApplication}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
