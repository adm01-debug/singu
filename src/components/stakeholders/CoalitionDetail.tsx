import { motion } from 'framer-motion';
import {
  Users,
  Crown,
  ChevronRight,
  Target,
  X,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { Coalition } from '@/hooks/useCoalitionDetection';
import { COALITION_TYPE_CONFIG, RISK_CONFIG } from './CoalitionSharedConfig';

export function CoalitionDetail({ coalition, onClose }: { coalition: Coalition; onClose: () => void }) {
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
                    {(coalition.leader.contact.first_name || '?')[0]}{(coalition.leader.contact.last_name || '?')[0]}
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
                        {(member.contact.first_name || '?')[0]}{(member.contact.last_name || '?')[0]}
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
