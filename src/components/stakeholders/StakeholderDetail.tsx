import { motion } from 'framer-motion';
import { X, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { QUADRANT_CONFIG, RISK_COLORS, SUPPORT_CONFIG, getSupportType, safeInitial } from './stakeholderMapConstants';
import { MetricBar } from './StakeholderCard';

export function StakeholderDetail({ stakeholder, onClose }: { stakeholder: StakeholderData; onClose: () => void }) {
  const { contact, metrics, quadrant, strategyRecommendation, riskLevel } = stakeholder;
  const config = QUADRANT_CONFIG[quadrant];
  const QuadrantIcon = config.icon;
  const supportType = getSupportType(metrics.support);
  const supportConfig = SUPPORT_CONFIG[supportType];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 bg-background z-10 overflow-auto"
    >
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="mb-3">
          <X className="w-4 h-4 mr-1" />
          Fechar
        </Button>

        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={contact.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {safeInitial(contact.first_name)}{safeInitial(contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">{contact.first_name} {contact.last_name}</h3>
            <p className="text-muted-foreground text-sm">{contact.role_title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
                <QuadrantIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <Badge variant="outline" className={RISK_COLORS[riskLevel]}>
                {riskLevel === 'high' ? 'Alto Risco' : riskLevel === 'medium' ? 'Risco Médio' : 'Baixo Risco'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Métricas de Stakeholder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricBar value={metrics.power} label="Poder" color="bg-primary" />
            <MetricBar value={metrics.interest} label="Interesse" color="bg-info" />
            <MetricBar value={metrics.influence} label="Influência" color="bg-warning" />
            <MetricBar value={metrics.engagement} label="Engajamento" color="bg-success" />

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Posição</span>
                <div className={`flex items-center gap-1 ${supportConfig.color}`}>
                  {supportConfig.label}
                  <span className="text-xs">({metrics.support > 0 ? '+' : ''}{metrics.support})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Estratégia Recomendada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{strategyRecommendation}</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Link to={`/contatos/${contact.id}`}>
          <Button className="w-full">
            Ver Perfil Completo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
