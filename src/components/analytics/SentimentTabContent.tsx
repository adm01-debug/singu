import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CustomTooltip, PieTooltip, ComparisonBadge } from './AnalyticsShared';
import type { PeriodFilter } from './analyticsData';
import {
  calcChange,
  getRelationshipEvolutionData,
  getSentimentDistributionData,
  getSentimentColors,
} from './analyticsData';

interface SentimentTabContentProps {
  period: PeriodFilter;
}

export const SentimentTabContent = ({ period }: SentimentTabContentProps) => {
  const relationshipData = getRelationshipEvolutionData(period);
  const sentimentData = getSentimentDistributionData(period);
  const sentimentColors = getSentimentColors();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sentiment Distribution Pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Distribuição de Sentimentos
            </CardTitle>
            <CardDescription>
              Proporção de interações por tipo de sentimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={sentimentColors[entry.name as keyof typeof sentimentColors]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend with comparison */}
            <div className="flex justify-center gap-6 mt-4">
              {sentimentData.map((item) => {
                const comparison = calcChange(item.value, item.prevValue);
                return (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sentimentColors[item.name as keyof typeof sentimentColors] }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <ComparisonBadge comparison={comparison} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sentiment Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Evolução do Sentimento
            </CardTitle>
            <CardDescription>
              Tendência de sentimentos ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={relationshipData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="score"
                    name="Score de Relacionamento"
                    fill="hsl(221, 83%, 53%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sentiment Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Insights de Sentimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-emerald-500">Positivo</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {sentimentData[0].value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((sentimentData[0].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Neutro</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {sentimentData[1].value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((sentimentData[1].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-500">Negativo</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {sentimentData[2].value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((sentimentData[2].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
