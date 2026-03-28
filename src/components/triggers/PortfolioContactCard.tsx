import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DISC_LABELS } from '@/types';
import { VAK_LABELS } from '@/types/vak';
import {
  ContactWithCompatibility,
  SalespersonProfile,
  LEVEL_CONFIG,
} from './portfolio-compatibility-types';

export function PortfolioContactCard({
  contact,
  expanded,
  onToggle,
  salespersonProfile,
}: {
  contact: ContactWithCompatibility;
  expanded: boolean;
  onToggle: () => void;
  salespersonProfile: SalespersonProfile | null;
}) {
  const levelConfig = LEVEL_CONFIG[contact.level];
  const LevelIcon = levelConfig.icon;

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-lg overflow-hidden transition-shadow',
        expanded && 'shadow-md'
      )}
    >
      <div
        className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              levelConfig.bgColor
            )}>
              <LevelIcon className={cn('w-5 h-5', levelConfig.color)} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {contact.firstName} {contact.lastName}
              </p>
              {contact.company && (
                <p className="text-xs text-muted-foreground truncate">
                  {contact.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {contact.discProfile && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', DISC_LABELS[contact.discProfile].color)}
                >
                  {contact.discProfile}
                </Badge>
              )}
              {contact.vakProfile && (
                <Badge variant="outline" className="text-xs">
                  {VAK_LABELS[contact.vakProfile].icon}
                </Badge>
              )}
            </div>

            <div className="text-right">
              <p className={cn('font-bold text-lg', levelConfig.color)}>
                {contact.compatibilityScore}%
              </p>
              <p className="text-xs text-muted-foreground">{levelConfig.label}</p>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={expanded ? "Recolher" : "Expandir"}>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t bg-muted/10 space-y-4">
              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">DISC</p>
                  <p className={cn(
                    'font-bold',
                    contact.discScore >= 70 ? 'text-green-600' :
                    contact.discScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.discScore > 0 ? `${contact.discScore}%` : '-'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">VAK</p>
                  <p className={cn(
                    'font-bold',
                    contact.vakScore >= 70 ? 'text-green-600' :
                    contact.vakScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.vakScore > 0 ? `${contact.vakScore}%` : '-'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">Meta</p>
                  <p className={cn(
                    'font-bold',
                    contact.metaprogramScore >= 70 ? 'text-green-600' :
                    contact.metaprogramScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.metaprogramScore > 0 ? `${contact.metaprogramScore}%` : '-'}
                  </p>
                </div>
              </div>

              {/* Opportunities */}
              {contact.opportunities.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1 text-green-600">
                    <Sparkles className="w-3 h-3" />
                    Oportunidades
                  </p>
                  <ul className="space-y-1">
                    {contact.opportunities.map((opp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Challenges */}
              {contact.challenges.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    Desafios
                  </p>
                  <ul className="space-y-1">
                    {contact.challenges.map((ch, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                        {ch}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/contatos/${contact.id}`}>
                    Ver Perfil Completo
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
