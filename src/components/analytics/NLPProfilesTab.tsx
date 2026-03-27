import React from 'react';
import {
  Eye,
  Ear,
  Hand,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { vakColors, discColors } from './NLPAnalyticsTypes';

interface VakChartItem {
  name: string;
  value: number;
  icon: typeof Eye;
}

interface DiscChartItem {
  name: string;
  value: number;
  profile: string;
}

interface NLPProfilesTabProps {
  vakChartData: VakChartItem[];
  discChartData: DiscChartItem[];
}

export function NLPProfilesTab({ vakChartData, discChartData }: NLPProfilesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* VAK Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Análise VAK Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {vakChartData.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                  <Progress
                    value={item.value}
                    className="h-3"
                    style={{
                      '--progress-background': vakColors[item.name.toLowerCase() === 'cinestésico' ? 'kinesthetic' : item.name.toLowerCase() === 'auditivo' ? 'auditory' : item.name.toLowerCase() as keyof typeof vakColors]
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DISC Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Análise DISC Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {discChartData.map((item) => (
              <div key={item.profile} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: discColors[item.profile as keyof typeof discColors],
                        color: 'white'
                      }}
                    >
                      {item.profile}
                    </Badge>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value} contatos</span>
                </div>
                <Progress
                  value={(item.value / Math.max(...discChartData.map(d => d.value), 1)) * 100}
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
