import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain,
  Phone,
  MessageSquare,
  Clock,
  Heart,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Ear,
  Hand,
  Cpu,
  Lightbulb,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Star,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useContactPreferences } from '@/hooks/useContactPreferences';
import { cn } from '@/lib/utils';

interface QuickBriefingCardProps {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    role_title?: string | null;
    relationship_score?: number | null;
    sentiment?: string | null;
    disc_profile?: string | null;
    vak_profile?: string | null;
  };
  company?: {
    name: string;
  } | null;
  lastInteraction?: {
    type: string;
    title: string;
    created_at: string;
    sentiment?: string;
  } | null;
  className?: string;
}

const vakIcons: Record<string, React.ElementType> = {
  Visual: Eye,
  Auditory: Ear,
  Kinesthetic: Hand,
  Digital: Cpu,
};

const vakColors: Record<string, string> = {
  Visual: 'text-blue-500 bg-blue-500/10',
  Auditory: 'text-purple-500 bg-purple-500/10',
  Kinesthetic: 'text-orange-500 bg-orange-500/10',
  Digital: 'text-green-500 bg-green-500/10',
};

const discColors: Record<string, string> = {
  D: 'text-red-500 bg-red-500/10',
  I: 'text-yellow-500 bg-yellow-500/10',
  S: 'text-green-500 bg-green-500/10',
  C: 'text-blue-500 bg-blue-500/10',
};

const discLabels: Record<string, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conforme',
};

export function QuickBriefingCard({
  contact,
  company,
  lastInteraction,
  className,
}: QuickBriefingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { preference, isGoodTimeToContact } = useContactPreferences(contact.id);
  const contactStatus = isGoodTimeToContact();

  const VAKIcon = vakIcons[contact.vak_profile || ''] || Brain;
  const vakStyle = vakColors[contact.vak_profile || ''] || 'text-muted-foreground bg-muted';

  const sentimentIcon = contact.sentiment === 'positive' ? TrendingUp :
                        contact.sentiment === 'negative' ? TrendingDown : Minus;
  const SentimentIcon = sentimentIcon;

  const getQuickTips = () => {
    const tips: string[] = [];

    // Based on DISC
    if (contact.disc_profile === 'D') {
      tips.push('Seja direto e objetivo');
      tips.push('Foque em resultados');
    } else if (contact.disc_profile === 'I') {
      tips.push('Seja entusiasta e positivo');
      tips.push('Permita interação social');
    } else if (contact.disc_profile === 'S') {
      tips.push('Seja paciente e cordial');
      tips.push('Transmita segurança');
    } else if (contact.disc_profile === 'C') {
      tips.push('Apresente dados e detalhes');
      tips.push('Seja preciso e organizado');
    }

    // Based on preferences
    if (preference?.communication_tips) {
      tips.push(preference.communication_tips);
    }

    return tips.slice(0, 3);
  };

  const getWordsToUse = () => {
    if (contact.vak_profile === 'Visual') {
      return ['veja', 'perspectiva', 'claro', 'visualize'];
    } else if (contact.vak_profile === 'Auditory') {
      return ['ouça', 'soa bem', 'sintonia', 'harmonioso'];
    } else if (contact.vak_profile === 'Kinesthetic') {
      return ['sente', 'concreto', 'impacto', 'sólido'];
    }
    return ['entenda', 'analise', 'considere', 'avalie'];
  };

  return (
    <Card className={cn("overflow-hidden transition-all", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={contact.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {contact.first_name?.[0]}{contact.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {contact.first_name} {contact.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {company?.name || contact.role_title || 'Contato'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Contact Status Alert */}
        {!contactStatus.canContact && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {contactStatus.reason}
          </div>
        )}
        {contactStatus.isIdeal && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {contactStatus.reason}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {/* Relationship Score */}
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <Heart className={cn(
              "w-4 h-4 mx-auto mb-1",
              (contact.relationship_score || 0) >= 70 ? 'text-success' :
              (contact.relationship_score || 0) >= 40 ? 'text-warning' : 'text-destructive'
            )} />
            <p className="text-xs font-medium">{contact.relationship_score || 0}%</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>

          {/* DISC */}
          {contact.disc_profile && (
            <div className={cn("p-2 rounded-lg text-center", discColors[contact.disc_profile])}>
              <Target className="w-4 h-4 mx-auto mb-1" />
              <p className="text-xs font-medium">{contact.disc_profile}</p>
              <p className="text-[10px] opacity-70">DISC</p>
            </div>
          )}

          {/* VAK */}
          {contact.vak_profile && (
            <div className={cn("p-2 rounded-lg text-center", vakStyle)}>
              <VAKIcon className="w-4 h-4 mx-auto mb-1" />
              <p className="text-xs font-medium">{contact.vak_profile?.slice(0, 3)}</p>
              <p className="text-[10px] opacity-70">PNL</p>
            </div>
          )}

          {/* Sentiment */}
          <div className={cn(
            "p-2 rounded-lg text-center",
            contact.sentiment === 'positive' ? 'bg-success/10 text-success' :
            contact.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' :
            'bg-muted/50 text-muted-foreground'
          )}>
            <SentimentIcon className="w-4 h-4 mx-auto mb-1" />
            <p className="text-xs font-medium">
              {contact.sentiment === 'positive' ? '+' : contact.sentiment === 'negative' ? '-' : '~'}
            </p>
            <p className="text-[10px] opacity-70">Humor</p>
          </div>
        </div>

        {/* Preferred Channel */}
        {preference?.preferred_channel && (
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Canal preferido:</span>
            <Badge variant="secondary">
              {preference.preferred_channel === 'whatsapp' ? 'WhatsApp' :
               preference.preferred_channel === 'call' ? 'Ligação' :
               preference.preferred_channel === 'email' ? 'Email' :
               preference.preferred_channel === 'meeting' ? 'Presencial' : 'Vídeo'}
            </Badge>
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <Separator />

              {/* Quick Tips */}
              {getQuickTips().length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Dicas Rápidas
                  </p>
                  <div className="space-y-1">
                    {getQuickTips().map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-warning/5 text-sm"
                      >
                        <CheckCircle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Words to Use */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Palavras Mágicas
                </p>
                <div className="flex flex-wrap gap-1">
                  {getWordsToUse().map((word, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-success/10 text-success"
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Last Interaction */}
              {lastInteraction && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Última Interação
                  </p>
                  <div className="p-2 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium">{lastInteraction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lastInteraction.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {/* Restrictions Warning */}
              {preference?.restrictions && (
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-xs font-medium text-warning mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Atenção
                  </p>
                  <p className="text-sm">{preference.restrictions}</p>
                </div>
              )}

              {/* Personal Notes */}
              {preference?.personal_notes && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">📝 Notas Pessoais</p>
                  <p className="text-sm">{preference.personal_notes}</p>
                </div>
              )}

              {/* View Full Profile */}
              <Link to={`/contatos/${contact.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Ver Perfil Completo
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
