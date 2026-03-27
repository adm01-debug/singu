import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  RefreshCw,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Percent,
} from 'lucide-react';
import { RFM_SEGMENTS, RFMSegment, RFMAnalysis, RFMHistory } from '@/types/rfm';
import { SEGMENT_ICONS } from './RFMConstants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ScoreCard({
  label,
  score,
  detail,
  color,
  trend
}: {
  label: string;
  score: number;
  detail: string;
  color: string;
  trend?: string | null;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700'
  };

  const TrendIcon = trend === 'improving' ? ArrowUp :
                    trend === 'declining' ? ArrowDown : Minus;
  const trendColor = trend === 'improving' ? 'text-green-600' :
                     trend === 'declining' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <div className="text-3xl font-bold mt-1">{score}</div>
      <div className="text-sm opacity-80">{detail}</div>
    </div>
  );
}

interface RFMContactDetailProps {
  rfm: RFMAnalysis;
  history: RFMHistory[];
  onRefresh: () => void;
  analyzing: boolean;
}

export function RFMContactDetail({
  rfm,
  history,
  onRefresh,
  analyzing
}: RFMContactDetailProps) {
  const segment = RFM_SEGMENTS[rfm.segment];

  const historyChartData = useMemo(() => {
    return history.slice().reverse().map(h => ({
      date: format(h.recordedAt, 'dd/MM', { locale: ptBR }),
      R: h.recencyScore,
      F: h.frequencyScore,
      M: h.monetaryScore,
      total: h.recencyScore + h.frequencyScore + h.monetaryScore
    }));
  }, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${segment.bgColor} ${segment.color}`}>
                {SEGMENT_ICONS[rfm.segment]}
              </div>
              <div>
                <CardTitle>Análise RFM</CardTitle>
                <CardDescription>
                  Última análise: {format(rfm.analyzedAt, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={analyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Segment Badge */}
          <div className={`p-4 rounded-lg ${segment.bgColor}`}>
            <div className="flex items-center gap-2">
              {SEGMENT_ICONS[rfm.segment]}
              <span className={`font-semibold ${segment.color}`}>{segment.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
            <p className="text-sm mt-2">
              <strong>Foco:</strong> {segment.actionFocus}
            </p>
          </div>

          {/* RFM Scores */}
          <div className="grid grid-cols-3 gap-4">
            <ScoreCard
              label="Recência"
              score={rfm.recencyScore}
              detail={rfm.daysSinceLastPurchase ? `${rfm.daysSinceLastPurchase} dias` : 'N/A'}
              color="blue"
              trend={rfm.recencyTrend}
            />
            <ScoreCard
              label="Frequência"
              score={rfm.frequencyScore}
              detail={`${rfm.totalPurchases} compras`}
              color="green"
              trend={rfm.frequencyTrend}
            />
            <ScoreCard
              label="Monetário"
              score={rfm.monetaryScore}
              detail={`R$ ${rfm.totalMonetaryValue.toLocaleString('pt-BR')}`}
              color="amber"
              trend={rfm.monetaryTrend}
            />
          </div>

          {/* Combined Score */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Score RFM Total</div>
                <div className="text-3xl font-bold">{rfm.totalScore}/15</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Código RFM</div>
                <div className="text-2xl font-mono font-bold">
                  {rfm.recencyScore}{rfm.frequencyScore}{rfm.monetaryScore}
                </div>
              </div>
            </div>
            <Progress value={(rfm.totalScore / 15) * 100} className="mt-3" />
          </div>

          {/* Predictions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Próxima Compra Prevista</span>
              </div>
              <div className="text-lg font-semibold mt-1">
                {rfm.predictedNextPurchaseDate
                  ? format(rfm.predictedNextPurchaseDate, "dd 'de' MMM", { locale: ptBR })
                  : 'Indeterminado'}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span className="text-sm">Probabilidade de Churn</span>
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                (rfm.churnProbability || 0) > 50 ? 'text-red-600' :
                (rfm.churnProbability || 0) > 25 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {rfm.churnProbability?.toFixed(0) || 0}%
              </div>
            </div>
          </div>

          {/* History Chart */}
          {historyChartData.length > 1 && (
            <div>
              <h4 className="font-semibold mb-3">Evolução do Score</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="R" stroke="#3b82f6" name="Recência" />
                    <Line type="monotone" dataKey="F" stroke="#22c55e" name="Frequência" />
                    <Line type="monotone" dataKey="M" stroke="#f59e0b" name="Monetário" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {rfm.recommendedActions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ações Recomendadas</h4>
              <div className="space-y-2">
                {rfm.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.action}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{action.channel}</Badge>
                        <Badge variant="outline">{action.timing}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Offers */}
          {rfm.recommendedOffers.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ofertas Sugeridas</h4>
              <div className="grid grid-cols-2 gap-3">
                {rfm.recommendedOffers.map((offer, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="font-medium">{offer.offerType}</div>
                    <div className="text-sm text-muted-foreground">{offer.description}</div>
                    {offer.discountPercent && (
                      <Badge className="mt-2 bg-green-100 text-green-700">
                        {offer.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
