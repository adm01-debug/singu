import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Eye, Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { QUADRANT_CONFIG, safeInitial } from './stakeholderMapConstants';

export function PowerInterestGrid({ stakeholders, onSelect }: { stakeholders: StakeholderData[]; onSelect: (s: StakeholderData) => void }) {
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
