import { motion } from 'framer-motion';
import {
  Crown,
  Scale,
  ChevronRight,
  Zap,
  Link2,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Coalition, InfluenceCluster, CoalitionAnalysis } from '@/hooks/useCoalitionDetection';
import { COALITION_TYPE_CONFIG, RISK_CONFIG } from './CoalitionSharedConfig';

export function PowerBalanceIndicator({ powerBalance }: { powerBalance: CoalitionAnalysis['powerBalance'] }) {
  const getBalanceColor = () => {
    switch (powerBalance.balance) {
      case 'favorable': return 'bg-success';
      case 'unfavorable': return 'bg-destructive';
      default: return 'bg-warning';
    }
  };

  const getBalanceLabel = () => {
    switch (powerBalance.balance) {
      case 'favorable': return 'Favorável';
      case 'unfavorable': return 'Desfavorável';
      default: return 'Disputado';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Balanço de Poder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Power distribution bar */}
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="bg-success"
              initial={{ width: 0 }}
              animate={{ width: `${powerBalance.supportPower}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="bg-warning"
              initial={{ width: 0 }}
              animate={{ width: `${powerBalance.neutralPower}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <motion.div
              className="bg-destructive"
              initial={{ width: 0 }}
              animate={{ width: `${powerBalance.oppositionPower}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>

          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Apoio: {powerBalance.supportPower}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>Neutro: {powerBalance.neutralPower}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>Oposição: {powerBalance.oppositionPower}%</span>
            </div>
          </div>
        </div>

        {/* Balance status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getBalanceColor()}`} />
            <span className="font-medium text-sm">{getBalanceLabel()}</span>
          </div>
          <Badge variant="outline" className={`${RISK_CONFIG[powerBalance.balance === 'unfavorable' ? 'high' : powerBalance.balance === 'contested' ? 'medium' : 'low'].bgColor}`}>
            {powerBalance.balance === 'favorable' ? 'Baixo Risco' : powerBalance.balance === 'unfavorable' ? 'Alto Risco' : 'Risco Médio'}
          </Badge>
        </div>

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{powerBalance.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoalitionCard({ coalition, onSelect }: { coalition: Coalition; onSelect: () => void }) {
  const config = COALITION_TYPE_CONFIG[coalition.type];
  const riskConfig = RISK_CONFIG[coalition.risk];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border-2 transition-all hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${config.bgColor}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{coalition.name}</h4>
                <p className="text-xs text-muted-foreground">{coalition.members.length} membros</p>
              </div>
            </div>
            <Badge variant="outline" className={`${riskConfig.bgColor} ${riskConfig.color}`}>
              Risco {riskConfig.label}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded bg-background/50">
              <p className="text-lg font-bold">{coalition.strength}%</p>
              <p className="text-[10px] text-muted-foreground">Força</p>
            </div>
            <div className="text-center p-2 rounded bg-background/50">
              <p className="text-lg font-bold">{coalition.influence}</p>
              <p className="text-[10px] text-muted-foreground">Influência</p>
            </div>
            <div className="text-center p-2 rounded bg-background/50">
              <p className="text-lg font-bold">{coalition.cohesion}%</p>
              <p className="text-[10px] text-muted-foreground">Coesão</p>
            </div>
          </div>

          {/* Members preview */}
          <div className="flex items-center gap-1 mb-3">
            {coalition.members.slice(0, 5).map((member, idx) => (
              <Avatar key={member.contact.id} className="w-7 h-7 border-2 border-background" style={{ marginLeft: idx > 0 ? '-8px' : 0 }}>
                <AvatarImage src={member.contact.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-muted">
                  {(member.contact.first_name || '?')[0]}{(member.contact.last_name || '?')[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {coalition.members.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">+{coalition.members.length - 5}</span>
            )}
            {coalition.leader && (
              <div className="ml-auto flex items-center gap-1">
                <Crown className="w-3 h-3 text-warning" />
                <span className="text-xs">{coalition.leader.contact.first_name}</span>
              </div>
            )}
          </div>

          {/* View details */}
          <div className="flex items-center justify-end text-xs text-muted-foreground">
            Ver detalhes
            <ChevronRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InfluenceClusterCard({ cluster }: { cluster: InfluenceCluster }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="bg-info/5 border-info/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-info/30">
              <AvatarImage src={cluster.center.contact.avatar_url || undefined} />
              <AvatarFallback className="bg-info/20 text-info">
                {(cluster.center.contact.first_name || '?')[0]}{(cluster.center.contact.last_name || '?')[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm truncate">
                  {cluster.center.contact.first_name} {cluster.center.contact.last_name}
                </h4>
                <Zap className="w-3 h-3 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground">
                Influencia {cluster.influenced.length} pessoa{cluster.influenced.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-info">{cluster.totalReach}</p>
              <p className="text-[10px] text-muted-foreground">Alcance total</p>
            </div>
          </div>

          {/* Influenced preview */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-info/20">
            <Link2 className="w-3 h-3 text-muted-foreground mr-1" />
            {cluster.influenced.slice(0, 4).map(member => (
              <TooltipProvider key={member.contact.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[8px] bg-muted">
                        {(member.contact.first_name || '?')[0]}{(member.contact.last_name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{member.contact.first_name} {member.contact.last_name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {cluster.influenced.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{cluster.influenced.length - 4}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
