import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Network,
  Target,
  Zap,
  UserCheck,
  UserX,
  Scale,
  Lightbulb,
  Link2,
  X,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCoalitionDetection, Coalition, InfluenceCluster, CoalitionAnalysis } from '@/hooks/useCoalitionDetection';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';

interface CoalitionDetectionPanelProps {
  stakeholders: StakeholderData[];
  className?: string;
}

const COALITION_TYPE_CONFIG = {
  support: {
    icon: UserCheck,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    label: 'Apoio',
  },
  opposition: {
    icon: UserX,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'Oposição',
  },
  neutral: {
    icon: Minus,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    label: 'Neutro',
  },
  mixed: {
    icon: Scale,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    label: 'Misto',
  },
};

const RISK_CONFIG = {
  low: { color: 'text-success', bgColor: 'bg-success/10', label: 'Baixo' },
  medium: { color: 'text-warning', bgColor: 'bg-warning/10', label: 'Médio' },
  high: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Alto' },
};

function PowerBalanceIndicator({ powerBalance }: { powerBalance: CoalitionAnalysis['powerBalance'] }) {
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

function CoalitionCard({ coalition, onSelect }: { coalition: Coalition; onSelect: () => void }) {
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
                  {member.contact.first_name[0]}{member.contact.last_name[0]}
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

function InfluenceClusterCard({ cluster }: { cluster: InfluenceCluster }) {
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
                {cluster.center.contact.first_name[0]}{cluster.center.contact.last_name[0]}
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
                        {member.contact.first_name[0]}{member.contact.last_name[0]}
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

function CoalitionDetail({ coalition, onClose }: { coalition: Coalition; onClose: () => void }) {
  const config = COALITION_TYPE_CONFIG[coalition.type];
  const riskConfig = RISK_CONFIG[coalition.risk];
  const Icon = config.icon;

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
          Voltar
        </Button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-3 rounded-xl ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{coalition.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${config.bgColor} ${config.color}`}>
                {config.label}
              </Badge>
              <Badge variant="outline" className={`${riskConfig.bgColor} ${riskConfig.color}`}>
                Risco {riskConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Métricas da Coalizão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Força</span>
                <span className="font-medium">{coalition.strength}%</span>
              </div>
              <Progress value={coalition.strength} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Coesão</span>
                <span className="font-medium">{coalition.cohesion}%</span>
              </div>
              <Progress value={coalition.cohesion} className="h-2" />
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Influência Total</span>
              <span className="font-bold">{coalition.influence}</span>
            </div>
          </CardContent>
        </Card>

        {/* Characteristics */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Características
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {coalition.characteristics.map((char, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {char}
                </li>
              ))}
            </ul>
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
            <p className="text-sm text-muted-foreground">{coalition.strategy}</p>
          </CardContent>
        </Card>

        {/* Leader */}
        {coalition.leader && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-warning" />
                Líder Identificado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-warning/30">
                  <AvatarImage src={coalition.leader.contact.avatar_url || undefined} />
                  <AvatarFallback className="bg-warning/10 text-warning font-bold">
                    {coalition.leader.contact.first_name[0]}{coalition.leader.contact.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {coalition.leader.contact.first_name} {coalition.leader.contact.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{coalition.leader.contact.role_title}</p>
                </div>
                <Link to={`/contatos/${coalition.leader.contact.id}`}>
                  <Button size="sm" variant="outline">
                    Ver Perfil
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Membros ({coalition.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coalition.members.map(member => (
                <Link key={member.contact.id} to={`/contatos/${member.contact.id}`}>
                  <motion.div
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.contact.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {member.contact.first_name[0]}{member.contact.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.contact.first_name} {member.contact.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.contact.role_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">P:{member.metrics.power}</span>
                      <span className="text-muted-foreground">I:{member.metrics.influence}</span>
                      <Badge 
                        variant="outline" 
                        className={member.metrics.support >= 2 ? 'text-success' : member.metrics.support <= -2 ? 'text-destructive' : 'text-muted-foreground'}
                      >
                        {member.metrics.support > 0 ? '+' : ''}{member.metrics.support}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export function CoalitionDetectionPanel({ stakeholders, className }: CoalitionDetectionPanelProps) {
  const [selectedCoalition, setSelectedCoalition] = useState<Coalition | null>(null);
  const analysis = useCoalitionDetection(stakeholders);

  if (stakeholders.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Network className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Sem stakeholders</h3>
          <p className="text-muted-foreground text-sm">
            Adicione contatos para detectar coalizões e grupos de influência.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {selectedCoalition && (
          <CoalitionDetail
            coalition={selectedCoalition}
            onClose={() => setSelectedCoalition(null)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Power Balance */}
        <PowerBalanceIndicator powerBalance={analysis.powerBalance} />

        {/* Insights */}
        {analysis.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.insights.map((insight, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span>{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Coalitions */}
        {analysis.coalitions.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Coalizões Detectadas ({analysis.coalitions.length})
            </h3>
            <div className="space-y-3">
              {analysis.coalitions.map(coalition => (
                <CoalitionCard
                  key={coalition.id}
                  coalition={coalition}
                  onSelect={() => setSelectedCoalition(coalition)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Influence Clusters */}
        {analysis.influenceClusters.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-info" />
              Centros de Influência ({analysis.influenceClusters.length})
            </h3>
            <div className="space-y-2">
              {analysis.influenceClusters.slice(0, 5).map(cluster => (
                <InfluenceClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          </div>
        )}

        {/* Key Connections Summary */}
        {analysis.keyConnections.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Conexões-Chave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-info/10">
                  <p className="text-lg font-bold text-info">
                    {analysis.keyConnections.filter(c => c.type === 'influence').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Influência</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <p className="text-lg font-bold text-success">
                    {analysis.keyConnections.filter(c => c.type === 'alignment').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Alinhamento</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <p className="text-lg font-bold text-destructive">
                    {analysis.keyConnections.filter(c => c.type === 'conflict').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Conflito</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
