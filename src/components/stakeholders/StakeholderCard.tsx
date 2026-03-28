import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { QUADRANT_CONFIG, RISK_COLORS, SUPPORT_CONFIG, getSupportType, safeInitial } from './stakeholderMapConstants';

export function MetricBar({ value, max = 10, label, color }: { value: number; max?: number; label: string; color: string }) {
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

export function StakeholderCard({ stakeholder, onClick }: { stakeholder: StakeholderData; onClick: () => void }) {
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
