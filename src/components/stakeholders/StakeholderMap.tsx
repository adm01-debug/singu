import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Eye,
  Bell,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Info,
  Shield,
  Zap,
  UserCheck,
  UserX,
  X,
  Network,
  GitBranch,
  FlaskConical,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStakeholderAnalysis, StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { useStakeholderAlerts } from '@/hooks/useStakeholderAlerts';
import { StakeholderAlertsList } from './StakeholderAlertsList';
import { StakeholderInfluenceNetwork } from './StakeholderInfluenceNetwork';
import { CoalitionDetectionPanel } from './CoalitionDetectionPanel';
import { StakeholderSimulator } from './StakeholderSimulator';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

interface StakeholderMapProps {
  contacts: Contact[];
  interactions: Interaction[];
  companyId?: string;
}

const QUADRANT_CONFIG = {
  manage_closely: {
    label: 'Gerenciar de Perto',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    description: 'Alto poder e alto interesse - stakeholders críticos',
  },
  keep_satisfied: {
    label: 'Manter Satisfeito',
    icon: Shield,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    description: 'Alto poder, baixo interesse - evite frustrar',
  },
  keep_informed: {
    label: 'Manter Informado',
    icon: Bell,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    description: 'Baixo poder, alto interesse - bons aliados',
  },
  monitor: {
    label: 'Monitorar',
    icon: Eye,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted',
    description: 'Baixo poder e baixo interesse - verificar periodicamente',
  },
};

const RISK_COLORS = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
};

const SUPPORT_CONFIG = {
  champion: { icon: UserCheck, color: 'text-success', label: 'Champion' },
  supporter: { icon: TrendingUp, color: 'text-success', label: 'Apoiador' },
  neutral: { icon: Minus, color: 'text-muted-foreground', label: 'Neutro' },
  skeptic: { icon: TrendingDown, color: 'text-warning', label: 'Cético' },
  blocker: { icon: UserX, color: 'text-destructive', label: 'Bloqueador' },
};

function getSupportType(support: number): keyof typeof SUPPORT_CONFIG {
  if (support >= 4) return 'champion';
  if (support >= 1) return 'supporter';
  if (support >= -1) return 'neutral';
  if (support >= -3) return 'skeptic';
  return 'blocker';
}

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

function MetricBar({ value, max = 10, label, color }: { value: number; max?: number; label: string; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function StakeholderCard({ stakeholder, onClick }: { stakeholder: StakeholderData; onClick: () => void }) {
  const { contact, metrics, quadrant, riskLevel } = stakeholder;
  const config = QUADRANT_CONFIG[quadrant];
  const supportType = getSupportType(metrics.support);
  const supportConfig = SUPPORT_CONFIG[supportType];
  const SupportIcon = supportConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border-2 transition-all hover:shadow-md`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={contact.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                {safeInitial(contact.first_name)}{safeInitial(contact.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm truncate">
                  {contact.first_name} {contact.last_name}
                </h4>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${RISK_COLORS[riskLevel]}`}>
                  {riskLevel === 'high' ? 'Alto Risco' : riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{contact.role_title}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-0.5 ${supportConfig.color}`}>
                        <SupportIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{supportConfig.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nível de suporte: {metrics.support > 0 ? '+' : ''}{metrics.support}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  <span>P:{metrics.power}</span>
                  <span>I:{metrics.interest}</span>
                  <span>In:{metrics.influence}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PowerInterestGrid({ stakeholders, onSelect }: { stakeholders: StakeholderData[]; onSelect: (s: StakeholderData) => void }) {
  const quadrants = useMemo(() => {
    const grouped: Record<string, StakeholderData[]> = {
      manage_closely: [],
      keep_satisfied: [],
      keep_informed: [],
      monitor: [],
    };
    
    stakeholders.forEach(s => {
      grouped[s.quadrant].push(s);
    });
    
    return grouped;
  }, [stakeholders]);

  return (
    <div className="grid grid-cols-2 gap-2 relative">
      {/* Axes labels */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium whitespace-nowrap">
        PODER →
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-muted-foreground font-medium">
        INTERESSE →
      </div>

      {/* High Power, Low Interest */}
      <div className={`p-3 rounded-lg ${QUADRANT_CONFIG.keep_satisfied.bgColor} ${QUADRANT_CONFIG.keep_satisfied.borderColor} border min-h-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className={`w-4 h-4 ${QUADRANT_CONFIG.keep_satisfied.color}`} />
          <span className="text-xs font-medium">Manter Satisfeito</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{quadrants.keep_satisfied.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {quadrants.keep_satisfied.slice(0, 3).map(s => (
            <motion.button
              key={s.contact.id}
              className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-background/50 transition-colors text-left"
              onClick={() => onSelect(s)}
              whileHover={{ x: 2 }}
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-warning/20">
                  {safeInitial(s.contact.first_name)}{safeInitial(s.contact.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">{s.contact.first_name}</span>
            </motion.button>
          ))}
          {quadrants.keep_satisfied.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{quadrants.keep_satisfied.length - 3} mais
            </p>
          )}
        </div>
      </div>

      {/* High Power, High Interest */}
      <div className={`p-3 rounded-lg ${QUADRANT_CONFIG.manage_closely.bgColor} ${QUADRANT_CONFIG.manage_closely.borderColor} border min-h-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Crown className={`w-4 h-4 ${QUADRANT_CONFIG.manage_closely.color}`} />
          <span className="text-xs font-medium">Gerenciar de Perto</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{quadrants.manage_closely.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {quadrants.manage_closely.slice(0, 3).map(s => (
            <motion.button
              key={s.contact.id}
              className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-background/50 transition-colors text-left"
              onClick={() => onSelect(s)}
              whileHover={{ x: 2 }}
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-primary/20">
                  {safeInitial(s.contact.first_name)}{safeInitial(s.contact.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">{s.contact.first_name}</span>
              {s.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />}
            </motion.button>
          ))}
          {quadrants.manage_closely.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{quadrants.manage_closely.length - 3} mais
            </p>
          )}
        </div>
      </div>

      {/* Low Power, Low Interest */}
      <div className={`p-3 rounded-lg ${QUADRANT_CONFIG.monitor.bgColor} ${QUADRANT_CONFIG.monitor.borderColor} border min-h-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Eye className={`w-4 h-4 ${QUADRANT_CONFIG.monitor.color}`} />
          <span className="text-xs font-medium">Monitorar</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{quadrants.monitor.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {quadrants.monitor.slice(0, 3).map(s => (
            <motion.button
              key={s.contact.id}
              className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-background/50 transition-colors text-left"
              onClick={() => onSelect(s)}
              whileHover={{ x: 2 }}
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-muted">
                  {safeInitial(s.contact.first_name)}{safeInitial(s.contact.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">{s.contact.first_name}</span>
            </motion.button>
          ))}
          {quadrants.monitor.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{quadrants.monitor.length - 3} mais
            </p>
          )}
        </div>
      </div>

      {/* Low Power, High Interest */}
      <div className={`p-3 rounded-lg ${QUADRANT_CONFIG.keep_informed.bgColor} ${QUADRANT_CONFIG.keep_informed.borderColor} border min-h-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Bell className={`w-4 h-4 ${QUADRANT_CONFIG.keep_informed.color}`} />
          <span className="text-xs font-medium">Manter Informado</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{quadrants.keep_informed.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {quadrants.keep_informed.slice(0, 3).map(s => (
            <motion.button
              key={s.contact.id}
              className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-background/50 transition-colors text-left"
              onClick={() => onSelect(s)}
              whileHover={{ x: 2 }}
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-info/20">
                  {safeInitial(s.contact.first_name)}{safeInitial(s.contact.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">{s.contact.first_name}</span>
            </motion.button>
          ))}
          {quadrants.keep_informed.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{quadrants.keep_informed.length - 3} mais
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StakeholderDetail({ stakeholder, onClose }: { stakeholder: StakeholderData; onClose: () => void }) {
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

export function StakeholderMap({ contacts, interactions, companyId }: StakeholderMapProps) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderData | null>(null);
  const { stakeholders, summary, recommendations } = useStakeholderAnalysis(contacts, interactions);
  const { checkForChanges, alerts } = useStakeholderAlerts(companyId);

  // Check for stakeholder changes when analysis updates
  useEffect(() => {
    if (stakeholders.length > 0) {
      stakeholders.forEach(stakeholder => {
        const contactName = `${stakeholder.contact.first_name} ${stakeholder.contact.last_name}`;
        checkForChanges(
          stakeholder.contact.id,
          contactName,
          companyId || null,
          {
            power: stakeholder.metrics.power * 10,
            interest: stakeholder.metrics.interest * 10,
            influence: stakeholder.metrics.influence * 10,
            support: stakeholder.metrics.support * 10 + 50, // Convert from -5 to 5 scale to 0-100
            engagement: stakeholder.metrics.engagement * 10,
            quadrant: stakeholder.quadrant,
            riskLevel: stakeholder.riskLevel
          }
        );
      });
    }
  }, [stakeholders, companyId, checkForChanges]);

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Stakeholder</h3>
          <p className="text-muted-foreground">
            Adicione contatos à empresa para visualizar o mapa de stakeholders.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Mapa de Stakeholders
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success">
              <UserCheck className="w-3 h-3 mr-1" />
              {summary.champions} Champions
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              <UserX className="w-3 h-3 mr-1" />
              {summary.blockers} Blockers
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <AnimatePresence>
          {selectedStakeholder && (
            <StakeholderDetail 
              stakeholder={selectedStakeholder} 
              onClose={() => setSelectedStakeholder(null)} 
            />
          )}
        </AnimatePresence>

        <Tabs defaultValue="matrix">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="matrix">Matriz</TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-1">
              <Network className="w-3.5 h-3.5" />
              Rede
            </TabsTrigger>
            <TabsTrigger value="coalitions" className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              Coalizões
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alertas
              {alerts.length > 0 && (
                <Badge className="ml-1.5 h-5 w-5 p-0 justify-center text-xs bg-destructive">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix">
            <PowerInterestGrid 
              stakeholders={stakeholders} 
              onSelect={setSelectedStakeholder}
            />
          </TabsContent>

          <TabsContent value="network">
            <StakeholderInfluenceNetwork 
              stakeholders={stakeholders}
              height={450}
            />
          </TabsContent>

          <TabsContent value="coalitions">
            <CoalitionDetectionPanel stakeholders={stakeholders} />
          </TabsContent>

          <TabsContent value="simulator">
            <StakeholderSimulator stakeholders={stakeholders} />
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-2">
              {stakeholders.map((stakeholder, index) => (
                <StakeholderCard
                  key={stakeholder.contact.id}
                  stakeholder={stakeholder}
                  onClick={() => setSelectedStakeholder(stakeholder)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <StakeholderAlertsList 
              companyId={companyId} 
              maxItems={10}
              showHeader={false}
            />
          </TabsContent>

          <TabsContent value="insights">
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{summary.totalStakeholders}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{summary.avgPower}</div>
                    <div className="text-xs text-muted-foreground">Poder Médio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{summary.avgInterest}</div>
                    <div className="text-xs text-muted-foreground">Interesse Médio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className={`text-2xl font-bold ${summary.riskScore > 50 ? 'text-destructive' : summary.riskScore > 25 ? 'text-warning' : 'text-success'}`}>
                      {summary.riskScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Score de Risco</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-info" />
                    Recomendações Estratégicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="block mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
