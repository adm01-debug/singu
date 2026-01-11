import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { TriggerSuggestion, TRIGGER_CATEGORIES, TriggerCategory, TriggerType } from '@/types/triggers';
import { toast } from 'sonner';

interface ClientTriggerPanelProps {
  contact: Contact;
  className?: string;
  compact?: boolean;
}

const TriggerCard = ({ 
  suggestion, 
  onCopy,
  expanded = false 
}: { 
  suggestion: TriggerSuggestion; 
  onCopy: (text: string, triggerType: TriggerType) => void;
  expanded?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(expanded);
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    onCopy(suggestion.template, suggestion.trigger.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const categoryInfo = TRIGGER_CATEGORIES[suggestion.trigger.category];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                  suggestion.trigger.color
                )}>
                  {suggestion.trigger.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">
                      {suggestion.trigger.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {categoryInfo.icon} {categoryInfo.name}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'text-xs',
                        suggestion.matchScore >= 70 && 'bg-success/10 text-success',
                        suggestion.matchScore >= 50 && suggestion.matchScore < 70 && 'bg-warning/10 text-warning',
                        suggestion.matchScore < 50 && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {suggestion.matchScore}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestion.trigger.description}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {suggestion.timing}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Template sugerido:
              </p>
              <div className="relative">
                <div className="p-3 bg-secondary/50 rounded-lg text-sm italic">
                  "{suggestion.template}"
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Exemplos de uso:
              </p>
              <ul className="space-y-1">
                {suggestion.trigger.examples.map((example, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export function ClientTriggerPanel({ contact, className, compact = false }: ClientTriggerPanelProps) {
  const { analysis } = useClientTriggers(contact);
  const { createUsage, stats } = useTriggerHistory(contact.id);
  const [activeTab, setActiveTab] = useState<TriggerCategory | 'all' | 'tips'>('all');
  
  const handleCopy = async (text: string, triggerType?: TriggerType) => {
    navigator.clipboard.writeText(text);
    toast.success('Template copiado e uso registrado!');
    
    if (triggerType) {
      await createUsage({
        contact_id: contact.id,
        trigger_type: triggerType,
        context: 'Gatilho Mental copiado do painel',
        result: 'pending',
      });
    }
  };
  
  if (!analysis) return null;
  
  const allSuggestions = [...analysis.primaryTriggers, ...analysis.secondaryTriggers];
  
  const filteredSuggestions = activeTab === 'all' || activeTab === 'tips'
    ? allSuggestions
    : allSuggestions.filter(s => s.trigger.category === activeTab);

  if (compact) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Gatilhos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.currentOpportunity && (
            <div className={cn(
              'p-3 rounded-lg border flex items-start gap-3',
              analysis.currentOpportunity.urgency === 'high' 
                ? 'bg-destructive/5 border-destructive/30' 
                : 'bg-warning/5 border-warning/30'
            )}>
              <Zap className={cn(
                'w-4 h-4 mt-0.5',
                analysis.currentOpportunity.urgency === 'high' ? 'text-destructive' : 'text-warning'
              )} />
              <div className="flex-1">
                <p className="text-sm font-medium">{analysis.currentOpportunity.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use: {analysis.primaryTriggers.find(t => t.trigger.id === analysis.currentOpportunity?.trigger)?.trigger.name}
                </p>
              </div>
            </div>
          )}
          
          {analysis.primaryTriggers.slice(0, 3).map((suggestion, index) => (
            <div 
              key={suggestion.trigger.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <span className="text-lg">{suggestion.trigger.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{suggestion.trigger.name}</p>
                <p className="text-xs text-muted-foreground truncate">{suggestion.timing}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {suggestion.matchScore}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Gatilhos Mentais para Persuasão
            {stats && stats.totalUsages > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <History className="w-3 h-3" />
                {stats.totalUsages} usos
              </Badge>
            )}
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Perfil: {contact.behavior?.discProfile || 'Não definido'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Oportunidade Atual */}
        {analysis.currentOpportunity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'p-4 rounded-lg border-2 flex items-start gap-3',
              analysis.currentOpportunity.urgency === 'high' 
                ? 'bg-destructive/5 border-destructive/50' 
                : 'bg-warning/5 border-warning/50'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg',
              analysis.currentOpportunity.urgency === 'high' 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-warning/10 text-warning'
            )}>
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">Oportunidade Agora</h4>
                <Badge variant={analysis.currentOpportunity.urgency === 'high' ? 'destructive' : 'secondary'}>
                  {analysis.currentOpportunity.urgency === 'high' ? 'Alta Urgência' : 'Aproveite'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.currentOpportunity.reason}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 gap-1"
                onClick={() => {
                  const trigger = analysis.primaryTriggers.find(
                    t => t.trigger.id === analysis.currentOpportunity?.trigger
                  );
                  if (trigger) handleCopy(trigger.template, trigger.trigger.id);
                }}
              >
                <Copy className="w-3 h-3" />
                Copiar template
              </Button>
            </div>
          </motion.div>
        )}

        {/* Gatilhos a Evitar */}
        {analysis.avoidTriggers.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Evite esses gatilhos:</p>
              <p className="text-xs text-muted-foreground">
                {analysis.avoidTriggers.slice(0, 3).map(id => {
                  const trigger = allSuggestions.find(s => s.trigger.id === id)?.trigger;
                  return trigger?.name;
                }).filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Tabs de Categorias */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            {Object.entries(TRIGGER_CATEGORIES).map(([key, cat]) => (
              <TabsTrigger key={key} value={key} className="text-xs gap-1">
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="tips" className="text-xs gap-1">
              <Lightbulb className="w-3 h-3" />
              <span className="hidden sm:inline">Dicas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="mt-4">
            <div className="space-y-2">
              {analysis.negotiationTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <Lightbulb className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{tip}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {['all', ...Object.keys(TRIGGER_CATEGORIES)].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {(tab === 'all' ? allSuggestions : filteredSuggestions).map((suggestion, index) => (
                      <TriggerCard
                        key={suggestion.trigger.id}
                        suggestion={suggestion}
                        onCopy={handleCopy}
                        expanded={index === 0}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
