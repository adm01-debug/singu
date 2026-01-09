import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Phone,
  Mail,
  Users,
  Send,
  Heart,
  Calendar,
  Lightbulb,
  ChevronDown,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DISCBadge } from '@/components/ui/disc-badge';
import { toast } from 'sonner';
import type { Contact, Interaction, DISCProfile } from '@/types';

interface AIWritingAssistantProps {
  contact: Contact;
  interactions: Interaction[];
  onClose?: () => void;
}

type MessageType = 'follow_up' | 'introduction' | 'proposal' | 'check_in' | 'thank_you' | 'meeting_request' | 'custom';
type ToneType = 'formal' | 'casual' | 'friendly';

interface Suggestion {
  id: string;
  label: string;
  message: string;
  reasoning: string;
}

interface AIResponse {
  suggestions: Suggestion[];
  tips: string[];
}

const MESSAGE_TYPES: { value: MessageType; label: string; icon: typeof MessageSquare }[] = [
  { value: 'follow_up', label: 'Follow-up', icon: RefreshCw },
  { value: 'check_in', label: 'Check-in', icon: Heart },
  { value: 'meeting_request', label: 'Agendar Reunião', icon: Calendar },
  { value: 'proposal', label: 'Proposta', icon: Send },
  { value: 'thank_you', label: 'Agradecimento', icon: Heart },
  { value: 'introduction', label: 'Apresentação', icon: Users },
  { value: 'custom', label: 'Personalizado', icon: Wand2 },
];

const TONE_OPTIONS: { value: ToneType; label: string }[] = [
  { value: 'friendly', label: 'Amigável' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
];

export function AIWritingAssistant({ contact, interactions, onClose }: AIWritingAssistantProps) {
  const [messageType, setMessageType] = useState<MessageType>('follow_up');
  const [tone, setTone] = useState<ToneType>('friendly');
  const [customContext, setCustomContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const contactProfile = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        roleTitle: contact.roleTitle,
        companyName: contact.companyName,
        discProfile: contact.behavior.discProfile,
        discNotes: contact.behavior.discNotes,
        preferredChannel: contact.behavior.preferredChannel,
        messageStyle: contact.behavior.messageStyle,
        formalityLevel: contact.behavior.formalityLevel,
        primaryMotivation: contact.behavior.primaryMotivation,
        primaryFear: contact.behavior.primaryFear,
        hobbies: contact.hobbies,
        interests: contact.interests,
      };

      const recentInteractions = interactions.slice(0, 5).map(i => ({
        type: i.type,
        sentiment: i.sentiment,
        content: i.content,
        createdAt: i.createdAt.toISOString(),
      }));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-writing-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          contact: contactProfile,
          recentInteractions,
          messageType,
          customContext: messageType === 'custom' ? customContext : undefined,
          tone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 429) {
          toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        } else if (res.status === 402) {
          toast.error('Créditos insuficientes. Adicione créditos na sua conta.');
        } else {
          toast.error(errorData.error || 'Erro ao gerar sugestões');
        }
        setError(errorData.error || 'Erro ao gerar sugestões');
        return;
      }

      const data: AIResponse = await res.json();
      setResponse(data);
      toast.success('Sugestões geradas com sucesso!');
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Erro ao conectar com o assistente de IA');
      toast.error('Erro ao gerar sugestões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (suggestion: Suggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.message);
      setCopiedId(suggestion.id);
      toast.success('Mensagem copiada!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Erro ao copiar mensagem');
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-gradient-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="gradient-text">Assistente de Escrita</span>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">
                Mensagens personalizadas com IA
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {contact.behavior.discProfile && (
              <DISCBadge profile={contact.behavior.discProfile} size="sm" />
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Message Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Tipo de Mensagem</label>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={messageType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType(type.value)}
                className="gap-1.5"
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Context */}
        <AnimatePresence>
          {messageType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-muted-foreground">
                Descreva o contexto
              </label>
              <Textarea
                placeholder="Ex: Quero agradecer pela reunião de ontem e propor próximos passos..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                className="min-h-[80px]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tone Selection */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Tom</label>
            <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-6">
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || (messageType === 'custom' && !customContext.trim())}
              className="gap-2 bg-gradient-primary hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-3 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {response && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4"
            >
              {/* Tips */}
              {response.tips.length > 0 && (
                <Collapsible open={showTips} onOpenChange={setShowTips}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-warning" />
                        Dicas para este perfil
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showTips ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mt-2 space-y-1.5">
                      {response.tips.map((tip, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                          {tip}
                        </p>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Message Suggestions */}
              <div className="space-y-3">
                {response.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-border/50 hover:border-primary/30 transition-colors group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(suggestion)}
                          >
                            {copiedId === suggestion.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {suggestion.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3 italic">
                          💡 {suggestion.reasoning}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Gerar novas sugestões
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial State */}
        {!response && !isLoading && !error && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1">
              Mensagens personalizadas para {contact.firstName}
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {contact.behavior.discProfile 
                ? `Baseado no perfil ${contact.behavior.discProfile === 'D' ? 'Dominante' : contact.behavior.discProfile === 'I' ? 'Influente' : contact.behavior.discProfile === 'S' ? 'Estável' : 'Conforme'} e histórico de interações`
                : 'Selecione o tipo de mensagem e clique em "Gerar Sugestões"'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
