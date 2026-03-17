import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus, ShoppingBag, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  contactId: string;
}

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function ContactCommercialTab({ contactId }: Props) {
  const { user } = useAuth();
  const [rfm, setRfm] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !contactId) return;

    const fetchData = async () => {
      const [rfmRes, purchaseRes] = await Promise.all([
        supabase.from('rfm_analysis').select('*').eq('contact_id', contactId).order('analyzed_at', { ascending: false }).limit(1),
        supabase.from('purchase_history').select('*').eq('contact_id', contactId).order('purchase_date', { ascending: false }).limit(20),
      ]);

      setRfm(rfmRes.data?.[0] || null);
      setPurchases(purchaseRes.data || []);
    };

    fetchData();
  }, [user, contactId]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* RFM Analysis */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Análise RFM
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rfm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  className="text-sm px-3 py-1"
                  style={{ backgroundColor: rfm.segment_color || undefined }}
                >
                  {rfm.segment}
                </Badge>
                {rfm.segment_description && (
                  <span className="text-xs text-muted-foreground">{rfm.segment_description}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Recência', score: rfm.recency_score, trend: rfm.recency_trend },
                  { label: 'Frequência', score: rfm.frequency_score, trend: rfm.frequency_trend },
                  { label: 'Monetário', score: rfm.monetary_score, trend: rfm.monetary_trend },
                ].map(({ label, score, trend }) => {
                  const TrendIcon = TREND_ICONS[trend] || Minus;
                  return (
                    <div key={label} className="text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-2xl font-bold text-foreground">{score}</span>
                        <TrendIcon className={cn('h-4 w-4',
                          trend === 'up' ? 'text-green-500' :
                          trend === 'down' ? 'text-red-500' :
                          'text-muted-foreground'
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {rfm.total_monetary_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.total_monetary_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {rfm.total_purchases != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Total Compras</p>
                    <p className="font-semibold text-foreground">{rfm.total_purchases}</p>
                  </div>
                )}
                {rfm.average_order_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Ticket Médio</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.average_order_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {rfm.predicted_lifetime_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">LTV Previsto</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.predicted_lifetime_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {rfm.churn_probability != null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Probabilidade de Churn
                    </span>
                    <span className={cn('text-xs font-medium',
                      Number(rfm.churn_probability) > 70 ? 'text-red-600' :
                      Number(rfm.churn_probability) > 40 ? 'text-orange-600' :
                      'text-green-600'
                    )}>
                      {Number(rfm.churn_probability)}%
                    </span>
                  </div>
                  <Progress value={Number(rfm.churn_probability)} className="h-2" />
                </div>
              )}

              {rfm.communication_priority && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Prioridade de comunicação:</span>
                  <Badge variant="outline" className="text-xs capitalize">{rfm.communication_priority}</Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Análise RFM ainda não realizada</p>
          )}
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
            Histórico de Compras ({purchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length > 0 ? (
            <div className="space-y-2">
              {purchases.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category && `${p.category} · `}
                      {p.purchase_date && format(new Date(p.purchase_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      R$ {Number(p.value || 0).toLocaleString('pt-BR')}
                    </p>
                    {p.renewal_date && (
                      <p className="text-xs text-muted-foreground">
                        Renova: {format(new Date(p.renewal_date), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma compra registrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
