import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare, 
  Users, 
  Gift,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Contact, Company, Interaction } from '@/types';

interface ActionSuggestion {
  action_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'social' | 'gift' | 'follow_up';
  title: string;
  description: string;
  suggested_message?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  best_time?: string;
  reasoning: string;
  confidence: number;
}

interface NextActionSuggestionProps {
  contact: Contact;
  interactions: Interaction[];
  company?: Company;
}

const actionIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
  social: Share2,
  gift: Gift,
  follow_up: Clock,
};

const actionLabels = {
  call: 'Ligação',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  social: 'Rede Social',
  gift: 'Presente/Atenção',
  follow_up: 'Follow-up',
};

const urgencyConfig = {
  low: { color: 'bg-muted text-muted-foreground', label: 'Baixa', icon: Clock },
  medium: { color: 'bg-info/10 text-info', label: 'Média', icon: Zap },
  high: { color: 'bg-warning/10 text-warning', label: 'Alta', icon: AlertTriangle },
  critical: { color: 'bg-destructive/10 text-destructive', label: 'Crítica', icon: AlertTriangle },
};

export const NextActionSuggestion = ({ contact, interactions, company }: NextActionSuggestionProps) => {
  const [suggestion, setSuggestion] = useState<ActionSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestion = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-next-action', {
        body: { contact, interactions, company }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        setHasGenerated(true);
      } else {
        toast.error('Não foi possível gerar sugestão');
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429')) {
        toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (errorMessage.includes('402')) {
        toast.error('Créditos insuficientes. Adicione créditos em Configurações.');
      } else {
        toast.error('Erro ao gerar sugestão de ação');
      }
    } finally {
      setLoading(false);
    }
  };

  const ActionIcon = suggestion ? actionIcons[suggestion.action_type] : Sparkles;
  const UrgencyIcon = suggestion ? urgencyConfig[suggestion.urgency].icon : Clock;

  if (!hasGenerated && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Próxima Ação Sugerida</h3>
                  <p className="text-sm text-muted-foreground">
                    Use IA para analisar o perfil e sugerir a melhor próxima ação
                  </p>
                </div>
              </div>
              <Button onClick={generateSuggestion} disabled={loading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Sugestão
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Analisando perfil...</h3>
                <p className="text-sm text-muted-foreground">
                  A IA está analisando o histórico de interações e comportamento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Próxima Ação Sugerida
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {suggestion.confidence}% confiança
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={generateSuggestion}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Action Card */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${urgencyConfig[suggestion.urgency].color}`}>
                <ActionIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                  <Badge className={`text-xs ${urgencyConfig[suggestion.urgency].color}`}>
                    <UrgencyIcon className="w-3 h-3 mr-1" />
                    {urgencyConfig[suggestion.urgency].label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {actionLabels[suggestion.action_type]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                
                {suggestion.best_time && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                    <Clock className="w-4 h-4" />
                    <span>{suggestion.best_time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Menos detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Mais detalhes
                </>
              )}
            </Button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-4 border-t border-border mt-3">
                    {/* Reasoning */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <h5 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Por que esta ação?
                      </h5>
                      <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                    </div>

                    {/* Suggested Message */}
                    {suggestion.suggested_message && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <h5 className="text-sm font-medium text-primary mb-1 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          Sugestão de mensagem
                        </h5>
                        <p className="text-sm text-foreground italic">"{suggestion.suggested_message}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2">
              <ActionIcon className="w-4 h-4" />
              Executar Ação
            </Button>
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Agendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
