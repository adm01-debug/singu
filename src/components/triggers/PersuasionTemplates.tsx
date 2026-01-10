import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  FileText,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Mail,
  Phone,
  Users,
  Edit3,
  Filter,
  DollarSign,
  HelpCircle,
  UserPlus,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { PersuasionTemplate, MENTAL_TRIGGERS } from '@/types/triggers';
import { toast } from 'sonner';

interface PersuasionTemplatesProps {
  contact: Contact;
  className?: string;
}

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Users,
  any: FileText,
};

const channelLabels = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  call: 'Ligação',
  meeting: 'Reunião',
  any: 'Universal',
};

type ScenarioFilter = 'all' | 'price_objection' | 'indecisive' | 'reactivation' | 'initial_negotiation' | 'upsell_crosssell' | 'contract_renewal' | 'timing_objection' | 'general';

const scenarioFilters: { id: ScenarioFilter; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { id: 'all', label: 'Todos', icon: LayoutGrid, description: 'Todos os templates' },
  { id: 'initial_negotiation', label: 'Inicial', icon: MessageSquare, description: 'Primeiras conversas' },
  { id: 'price_objection', label: 'Preço', icon: DollarSign, description: 'Cliente questionando valor' },
  { id: 'indecisive', label: 'Indeciso', icon: HelpCircle, description: 'Ajudar na decisão' },
  { id: 'timing_objection', label: 'Timing', icon: Filter, description: 'Não é o momento' },
  { id: 'upsell_crosssell', label: 'Upsell', icon: Sparkles, description: 'Vendas adicionais' },
  { id: 'contract_renewal', label: 'Renovação', icon: Users, description: 'Renovar contratos' },
  { id: 'reactivation', label: 'Reativação', icon: UserPlus, description: 'Recuperar perdidos' },
  { id: 'general', label: 'Geral', icon: FileText, description: 'Templates genéricos' },
];

interface TemplateFillerProps {
  template: PersuasionTemplate;
  contact: Contact;
  onClose: () => void;
}

function TemplateFiller({ template, contact, onClose }: TemplateFillerProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      // Pré-preenche algumas variáveis conhecidas
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa_cliente') initial[v] = contact.companyName;
      else initial[v] = '';
    });
    return initial;
  });
  
  const [copied, setCopied] = useState(false);
  
  const filledTemplate = template.template.replace(
    /\{(\w+)\}/g, 
    (match, key) => variables[key] || match
  );
  
  const allFilled = template.variables.every(v => variables[v]?.trim());
  
  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {template.variables.map(variable => (
          <div key={variable}>
            <Label htmlFor={variable} className="text-sm capitalize">
              {variable.replace(/_/g, ' ')}
            </Label>
            <Input
              id={variable}
              value={variables[variable] || ''}
              onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
              placeholder={`Digite ${variable.replace(/_/g, ' ')}`}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      
      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea
          value={filledTemplate}
          readOnly
          className="mt-1 h-32 bg-secondary/30"
        />
      </div>
      
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas:</p>
          <ul className="space-y-1">
            {template.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={handleCopy} 
          disabled={!allFilled}
          className="flex-1 gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar Mensagem'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

export function PersuasionTemplates({ contact, className }: PersuasionTemplatesProps) {
  const { allTemplates, analysis } = useClientTriggers(contact);
  const [selectedTemplate, setSelectedTemplate] = useState<PersuasionTemplate | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioFilter>('all');
  
  // Filtra templates por cenário e perfil DISC
  const filteredTemplates = allTemplates.filter(t => {
    // Filtro de perfil DISC
    const discMatch = t.discProfile === null || t.discProfile === contact.behavior?.discProfile;
    
    // Filtro de cenário
    if (activeScenario === 'all') return discMatch;
    if (activeScenario === 'general') return discMatch && !t.scenario;
    
    // Map filter keys to scenario values
    const scenarioValue = activeScenario === 'indecisive' ? 'indecisive_client'
      : activeScenario === 'reactivation' ? 'lost_client_reactivation'
      : activeScenario;
    
    return discMatch && t.scenario === scenarioValue;
  });
  
  // Conta templates por cenário
  const scenarioCounts = allTemplates.reduce((acc, t) => {
    const discMatch = t.discProfile === null || t.discProfile === contact.behavior?.discProfile;
    if (!discMatch) return acc;
    
    acc.all++;
    if (t.scenario) {
      // Map scenario values to filter keys
      const scenarioKey = t.scenario === 'indecisive_client' ? 'indecisive' 
        : t.scenario === 'lost_client_reactivation' ? 'reactivation'
        : t.scenario as ScenarioFilter;
      acc[scenarioKey] = (acc[scenarioKey] || 0) + 1;
    } else {
      acc.general++;
    }
    return acc;
  }, { all: 0, price_objection: 0, indecisive: 0, reactivation: 0, initial_negotiation: 0, upsell_crosssell: 0, contract_renewal: 0, timing_objection: 0, general: 0 } as Record<ScenarioFilter, number>);
  
  // Agrupa por gatilho
  const templatesByTrigger = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.trigger]) acc[template.trigger] = [];
    acc[template.trigger].push(template);
    return acc;
  }, {} as Record<string, PersuasionTemplate[]>);
  
  // Ordena pelos gatilhos mais recomendados
  const sortedTriggers = Object.keys(templatesByTrigger).sort((a, b) => {
    const scoreA = analysis?.primaryTriggers.find(t => t.trigger.id === a)?.matchScore || 0;
    const scoreB = analysis?.primaryTriggers.find(t => t.trigger.id === b)?.matchScore || 0;
    return scoreB - scoreA;
  });
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Templates de Persuasão
          <Badge variant="secondary" className="ml-auto">
            {filteredTemplates.length} de {scenarioCounts.all}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtros por cenário */}
        <div className="flex flex-wrap gap-2">
          {scenarioFilters.map(scenario => {
            const Icon = scenario.icon;
            const count = scenarioCounts[scenario.id];
            const isActive = activeScenario === scenario.id;
            
            return (
              <Button
                key={scenario.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "gap-1.5 text-xs transition-all",
                  isActive && "shadow-md"
                )}
                title={scenario.description}
              >
                <Icon className="w-3.5 h-3.5" />
                {scenario.label}
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className={cn(
                    "ml-1 h-5 min-w-[20px] px-1.5",
                    isActive ? "bg-background/20 text-primary-foreground" : "bg-muted"
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
        
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {sortedTriggers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Filter className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum template encontrado para este cenário
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setActiveScenario('all')}
                  className="mt-2"
                >
                  Ver todos os templates
                </Button>
              </div>
            )}
            {sortedTriggers.map(triggerId => {
              const trigger = MENTAL_TRIGGERS[triggerId as keyof typeof MENTAL_TRIGGERS];
              const templates = templatesByTrigger[triggerId];
              const suggestion = analysis?.primaryTriggers.find(t => t.trigger.id === triggerId);
              
              if (!trigger) return null;
              
              return (
                <motion.div
                  key={triggerId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div className={cn(
                    'p-3 flex items-center gap-3',
                    trigger.color
                  )}>
                    <span className="text-xl">{trigger.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{trigger.name}</h4>
                      <p className="text-xs opacity-80">{trigger.description}</p>
                    </div>
                    {suggestion && (
                      <Badge variant="secondary" className="bg-background/50">
                        {suggestion.matchScore}% match
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-3 space-y-2 bg-card">
                    {templates.map(template => {
                      const ChannelIcon = channelIcons[template.channel];
                      
                      return (
                        <Dialog key={template.id}>
                          <DialogTrigger asChild>
                            <div 
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors group"
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <div className="p-1.5 rounded bg-secondary/50">
                                <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{template.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {channelLabels[template.channel]}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </DialogTrigger>
                          
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-xl">{trigger.icon}</span>
                                {template.title}
                              </DialogTitle>
                            </DialogHeader>
                            <TemplateFiller 
                              template={template} 
                              contact={contact}
                              onClose={() => setSelectedTemplate(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
