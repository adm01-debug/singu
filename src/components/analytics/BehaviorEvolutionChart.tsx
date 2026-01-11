import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts';
import { TrendingUp, Brain, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEQPersistence } from '@/hooks/useEQPersistence';
import { useCognitiveBiasPersistence } from '@/hooks/useCognitiveBiasPersistence';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BehaviorEvolutionChartProps {
  contactId: string;
  contactName: string;
  className?: string;
}

export function BehaviorEvolutionChart({
  contactId,
  contactName,
  className
}: BehaviorEvolutionChartProps) {
  const { history: eqHistory, isLoading: isLoadingEQ } = useEQPersistence(contactId);
  const { history: biasHistory, isLoading: isLoadingBias } = useCognitiveBiasPersistence(contactId);

  // Prepare combined chart data
  const combinedData = useMemo(() => {
    const dataMap = new Map<string, {
      date: string;
      dateFormatted: string;
      eqScore?: number;
      biasCount?: number;
      selfAwareness?: number;
      selfRegulation?: number;
      motivation?: number;
      empathy?: number;
      socialSkills?: number;
    }>();

    // Add EQ data
    eqHistory.forEach(record => {
      const dateKey = format(new Date(record.analyzedAt), 'yyyy-MM-dd');
      const existing = dataMap.get(dateKey) || {
        date: dateKey,
        dateFormatted: format(new Date(record.analyzedAt), 'dd/MM', { locale: ptBR })
      };
      
      dataMap.set(dateKey, {
        ...existing,
        eqScore: record.overallScore,
        selfAwareness: record.pillarScores.self_awareness,
        selfRegulation: record.pillarScores.self_regulation,
        motivation: record.pillarScores.motivation,
        empathy: record.pillarScores.empathy,
        socialSkills: record.pillarScores.social_skills
      });
    });

    // Add Bias data
    biasHistory.forEach(record => {
      const dateKey = format(new Date(record.analyzedAt), 'yyyy-MM-dd');
      const existing = dataMap.get(dateKey) || {
        date: dateKey,
        dateFormatted: format(new Date(record.analyzedAt), 'dd/MM', { locale: ptBR })
      };
      
      dataMap.set(dateKey, {
        ...existing,
        biasCount: record.dominantBiases.length
      });
    });

    // Sort by date and return as array
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15); // Last 15 data points
  }, [eqHistory, biasHistory]);

  // Calculate trends
  const trends = useMemo(() => {
    if (combinedData.length < 2) return null;

    const eqScores = combinedData.filter(d => d.eqScore !== undefined).map(d => d.eqScore!);
    const biasCounts = combinedData.filter(d => d.biasCount !== undefined).map(d => d.biasCount!);

    const eqTrend = eqScores.length >= 2 
      ? eqScores[eqScores.length - 1] - eqScores[0]
      : 0;
    
    const biasTrend = biasCounts.length >= 2
      ? biasCounts[biasCounts.length - 1] - biasCounts[0]
      : 0;

    return {
      eqTrend,
      biasTrend,
      eqAverage: eqScores.length > 0 ? Math.round(eqScores.reduce((a, b) => a + b, 0) / eqScores.length) : 0,
      biasAverage: biasCounts.length > 0 ? Math.round(biasCounts.reduce((a, b) => a + b, 0) / biasCounts.length * 10) / 10 : 0
    };
  }, [combinedData]);

  const isLoading = isLoadingEQ || isLoadingBias;
  const hasData = combinedData.length > 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução Comportamental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução Comportamental
          </CardTitle>
          <CardDescription>
            Acompanhe as mudanças ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <p>Sem dados históricos ainda</p>
            <p className="text-sm">As análises serão registradas automaticamente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução Comportamental
            </CardTitle>
            <CardDescription>
              Análise temporal de {contactName}
            </CardDescription>
          </div>
          {trends && (
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={trends.eqTrend > 0 ? 'text-green-600 border-green-300' : 
                  trends.eqTrend < 0 ? 'text-red-600 border-red-300' : ''}
              >
                QE: {trends.eqTrend > 0 ? '+' : ''}{trends.eqTrend}%
              </Badge>
              <Badge 
                variant="outline"
                className={trends.biasTrend < 0 ? 'text-green-600 border-green-300' : 
                  trends.biasTrend > 0 ? 'text-orange-600 border-orange-300' : ''}
              >
                Vieses: {trends.biasTrend > 0 ? '+' : ''}{trends.biasTrend}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="combined" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combined" className="gap-1">
              <TrendingUp className="w-4 h-4" />
              Combinado
            </TabsTrigger>
            <TabsTrigger value="eq" className="gap-1">
              <Brain className="w-4 h-4" />
              QE Detalhado
            </TabsTrigger>
            <TabsTrigger value="biases" className="gap-1">
              <Eye className="w-4 h-4" />
              Vieses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="combined">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'QE (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Vieses', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="eqScore"
                    name="Score QE"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="biasCount"
                    name="Vieses Detectados"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Summary Stats */}
            {trends && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <div className="text-2xl font-bold text-primary">{trends.eqAverage}%</div>
                  <div className="text-xs text-muted-foreground">Média QE</div>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <div className="text-2xl font-bold text-destructive">{trends.biasAverage}</div>
                  <div className="text-xs text-muted-foreground">Média Vieses</div>
                </div>
                <div className="p-3 rounded-lg bg-muted text-center">
                  <div className="text-2xl font-bold">{eqHistory.length}</div>
                  <div className="text-xs text-muted-foreground">Análises QE</div>
                </div>
                <div className="p-3 rounded-lg bg-muted text-center">
                  <div className="text-2xl font-bold">{biasHistory.length}</div>
                  <div className="text-xs text-muted-foreground">Análises Vieses</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="eq">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="selfAwareness"
                    name="Autoconsciência"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="selfRegulation"
                    name="Autorregulação"
                    stackId="2"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="motivation"
                    name="Motivação"
                    stackId="3"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="empathy"
                    name="Empatia"
                    stackId="4"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="socialSkills"
                    name="Hab. Sociais"
                    stackId="5"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pillar Legend */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <Badge className="bg-purple-500">🧠 Autoconsciência</Badge>
              <Badge className="bg-cyan-500">🎯 Autorregulação</Badge>
              <Badge className="bg-amber-500">🔥 Motivação</Badge>
              <Badge className="bg-pink-500">💗 Empatia</Badge>
              <Badge className="bg-green-500">🤝 Hab. Sociais</Badge>
            </div>
          </TabsContent>

          <TabsContent value="biases">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dateFormatted"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 'auto']}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="biasCount"
                    name="Vieses Detectados"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Bias Insights */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Insights de Vieses
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Menos vieses detectados = comunicação mais clara e objetiva</li>
                <li>• Aumento de vieses pode indicar mudança no estado emocional</li>
                <li>• Use os padrões para adaptar sua abordagem de vendas</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
