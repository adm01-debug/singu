import React from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CustomTooltip } from './AnalyticsShared';

interface OverviewTabContentProps {
  relationshipData: Array<{
    date: string;
    score: number;
    newContacts: number;
    interactions: number;
  }>;
  topPerformers: Array<{ name: string; score: number; interactions: number; sentiment: string }>;
}

export const OverviewTabContent = ({
  relationshipData,
  topPerformers,
}: OverviewTabContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Relationship Evolution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução do Relacionamento
            </CardTitle>
            <CardDescription>Score médio e novos contatos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {relationshipData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={relationshipData}>
                    <defs>
                      <linearGradient id="colorScoreAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="hsl(221, 83%, 53%)"
                      fill="url(#colorScoreAnalytics)"
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="newContacts"
                      name="Novos Contatos"
                      fill="hsl(142, 76%, 36%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de interações para o período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top Relacionamentos
            </CardTitle>
            <CardDescription>Contatos com maior score de relacionamento</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <motion.div
                    key={performer.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.interactions} interações
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-foreground">{performer.score}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          performer.sentiment === 'positivo' || performer.sentiment === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {performer.sentiment}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhum contato encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
