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
  Search,
  X,
  History,
  Star,
  Heart,
  Brain,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { PersuasionTemplate, MENTAL_TRIGGERS, PersuasionScenario } from '@/types/triggers';
import { toast } from 'sonner';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { useFavoriteTemplates } from '@/hooks/useFavoriteTemplates';
import { SmartTemplateSuggestions } from './SmartTemplateSuggestions';
import { TemplatePerformanceComparison } from './TemplatePerformanceComparison';

interface PersuasionTemplatesProps {
  contact: Contact;
  className?: string;
  showSmartSuggestions?: boolean;
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

type ScenarioFilter = 'all' | 'favorites' | 'price_objection' | 'indecisive' | 'reactivation' | 'initial_negotiation' | 'upsell_crosssell' | 'contract_renewal' | 'timing_objection' | 'general';

const scenarioFilters: { id: ScenarioFilter; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { id: 'all', label: 'Todos', icon: LayoutGrid, description: 'Todos os templates' },
  { id: 'favorites', label: 'Favoritos', icon: Star, description: 'Seus templates favoritos' },
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
  onUseTemplate: (template: PersuasionTemplate) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function TemplateFiller({ template, contact, onClose, onUseTemplate, isFavorite, onToggleFavorite }: TemplateFillerProps) {
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
    toast.success('Mensagem copiada e uso registrado!');
    onUseTemplate(template);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite();
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
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
          variant="outline"
          size="icon"
          onClick={handleToggleFavorite}
          className={cn(
            "shrink-0 transition-colors",
            isFavorite && "text-yellow-500 border-yellow-500 hover:text-yellow-600 hover:border-yellow-600"
          )}
        >
          <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </Button>
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

export function PersuasionTemplates({ contact, className, showSmartSuggestions = true }: PersuasionTemplatesProps) {
  const { allTemplates, analysis } = useClientTriggers(contact);
  const { createUsage, stats } = useTriggerHistory(contact.id);
  const { isFavorite, toggleFavorite, favorites } = useFavoriteTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<PersuasionTemplate | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'smart' | 'all' | 'compare'>('smart');
  
  const handleUseTemplate = async (template: PersuasionTemplate) => {
    await createUsage({
      contact_id: contact.id,
      trigger_type: template.trigger as any,
      template_id: template.id,
      template_title: template.title,
      scenario: template.scenario as PersuasionScenario,
      channel: template.channel,
      result: 'pending',
    });
  };
  
  // Normaliza texto para busca (remove acentos e lowercase)
  const normalizeText = (text: string) => 
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Filtra templates por cenário, perfil DISC e busca
  const filteredTemplates = allTemplates.filter(t => {
    // Filtro de perfil DISC
    const discMatch = t.discProfile === null || t.discProfile === contact.behavior?.discProfile;
    
    // Filtro de cenário
    let scenarioMatch = true;
    if (activeScenario === 'favorites') {
      scenarioMatch = isFavorite(t.id);
    } else if (activeScenario !== 'all') {
      if (activeScenario === 'general') {
        scenarioMatch = !t.scenario;
      } else {
        const scenarioValue = activeScenario === 'indecisive' ? 'indecisive_client'
          : activeScenario === 'reactivation' ? 'lost_client_reactivation'
          : activeScenario;
        scenarioMatch = t.scenario === scenarioValue;
      }
    }
    
    // Filtro de busca por texto
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = normalizeText(searchQuery);
      const titleMatch = normalizeText(t.title).includes(query);
      const templateMatch = normalizeText(t.template).includes(query);
      const tipsMatch = t.tips.some(tip => normalizeText(tip).includes(query));
      const triggerName = MENTAL_TRIGGERS[t.trigger as keyof typeof MENTAL_TRIGGERS]?.name || '';
      const triggerMatch = normalizeText(triggerName).includes(query);
      searchMatch = titleMatch || templateMatch || tipsMatch || triggerMatch;
    }
    
    return discMatch && scenarioMatch && searchMatch;
  });
  
  // Count favorites
  const favoritesCount = allTemplates.filter(t => {
    const discMatch = t.discProfile === null || t.discProfile === contact.behavior?.discProfile;
    return discMatch && isFavorite(t.id);
  }).length;
  
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
  }, { all: 0, favorites: 0, price_objection: 0, indecisive: 0, reactivation: 0, initial_negotiation: 0, upsell_crosssell: 0, contract_renewal: 0, timing_objection: 0, general: 0 } as Record<ScenarioFilter, number>);
  
  // Add favorites count
  scenarioCounts.favorites = favoritesCount;
  
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
          {stats && stats.totalUsages > 0 && (
            <Badge variant="outline" className="gap-1 text-xs">
              <History className="w-3 h-3" />
              {stats.totalUsages} usos
            </Badge>
          )}
          <Badge variant="secondary" className="ml-auto">
            {filteredTemplates.length} de {scenarioCounts.all}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tabs: Smart vs All */}
        {showSmartSuggestions && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'smart' | 'all' | 'compare')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="smart" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sugestões IA
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Comparativo
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                Todos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart" className="mt-4">
              <SmartTemplateSuggestions contact={contact} />
            </TabsContent>
            
            <TabsContent value="compare" className="mt-4">
              <TemplatePerformanceComparison contact={contact} />
            </TabsContent>
            
            <TabsContent value="all" className="mt-4 space-y-4">
              {/* Filtros por cenário */}
        <div className="flex flex-wrap gap-2">
          {scenarioFilters.map(scenario => {
            const Icon = scenario.icon;
            const count = scenarioCounts[scenario.id];
            const isActive = activeScenario === scenario.id;
            const isFavoritesFilter = scenario.id === 'favorites';
            
            return (
              <Button
                key={scenario.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "gap-1.5 text-xs transition-all",
                  isActive && "shadow-md",
                  isFavoritesFilter && !isActive && count > 0 && "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                )}
                title={scenario.description}
              >
                <Icon className={cn("w-3.5 h-3.5", isFavoritesFilter && count > 0 && !isActive && "fill-yellow-400")} />
                {scenario.label}
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className={cn(
                    "ml-1 h-5 min-w-[20px] px-1.5",
                    isActive ? "bg-background/20 text-primary-foreground" : "bg-muted",
                    isFavoritesFilter && !isActive && count > 0 && "bg-yellow-100 text-yellow-700 border-yellow-300"
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
        
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar templates por título, conteúdo ou gatilho..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {sortedTriggers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? `Nenhum template encontrado para "${searchQuery}"` 
                    : 'Nenhum template encontrado para este cenário'}
                </p>
                <div className="flex gap-2 mt-2">
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setSearchQuery('')}
                    >
                      Limpar busca
                    </Button>
                  )}
                  {activeScenario !== 'all' && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setActiveScenario('all')}
                    >
                      Ver todos os templates
                    </Button>
                  )}
                </div>
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
                      const isTemplateFavorite = isFavorite(template.id);
                      
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
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium truncate">{template.title}</p>
                                  {isTemplateFavorite && (
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                  )}
                                </div>
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
                                {isTemplateFavorite && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            <TemplateFiller 
                              template={template} 
                              contact={contact}
                              onClose={() => setSelectedTemplate(null)}
                              onUseTemplate={handleUseTemplate}
                              isFavorite={isTemplateFavorite}
                              onToggleFavorite={() => toggleFavorite(template.id)}
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
            </TabsContent>
          </Tabs>
        )}
        
        {/* Fallback when smart suggestions disabled */}
        {!showSmartSuggestions && (
          <>
            {/* Filtros por cenário */}
            <div className="flex flex-wrap gap-2">
              {scenarioFilters.map(scenario => {
                const Icon = scenario.icon;
                const count = scenarioCounts[scenario.id];
                const isActive = activeScenario === scenario.id;
                const isFavoritesFilter = scenario.id === 'favorites';
                
                return (
                  <Button
                    key={scenario.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveScenario(scenario.id)}
                    className={cn(
                      "gap-1.5 text-xs transition-all",
                      isActive && "shadow-md",
                      isFavoritesFilter && !isActive && count > 0 && "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                    )}
                    title={scenario.description}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isFavoritesFilter && count > 0 && !isActive && "fill-yellow-400")} />
                    {scenario.label}
                    <Badge 
                      variant={isActive ? "secondary" : "outline"} 
                      className={cn(
                        "ml-1 h-5 min-w-[20px] px-1.5",
                        isActive ? "bg-background/20 text-primary-foreground" : "bg-muted",
                        isFavoritesFilter && !isActive && count > 0 && "bg-yellow-100 text-yellow-700 border-yellow-300"
                      )}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar templates por título, conteúdo ou gatilho..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {sortedTriggers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? `Nenhum template encontrado para "${searchQuery}"` 
                        : 'Nenhum template encontrado para este cenário'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
