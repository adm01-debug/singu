import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Ear,
  Hand,
  Brain,
  Copy,
  Check,
  ChevronRight,
  MessageSquare,
  Mail,
  Phone,
  Users,
  FileText,
  Sparkles,
  Search,
  X,
  Filter,
  ArrowLeftRight,
  Info,
  Lightbulb,
  Target,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { useVAKTemplates, AdaptedTemplate } from '@/hooks/useVAKTemplates';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { PersuasionScenario, MENTAL_TRIGGERS } from '@/types/triggers';
import { toast } from 'sonner';

interface VAKTemplateLibraryProps {
  contact: Contact;
  className?: string;
}

const VAK_ICONS: Record<VAKType, typeof Eye> = {
  V: Eye,
  A: Ear,
  K: Hand,
  D: Brain,
};

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Users,
  any: FileText,
};

const scenarioLabels: Record<string, { label: string; emoji: string }> = {
  initial_negotiation: { label: 'Negociação Inicial', emoji: '🤝' },
  price_objection: { label: 'Objeção de Preço', emoji: '💰' },
  indecisive_client: { label: 'Cliente Indeciso', emoji: '🤔' },
  lost_client_reactivation: { label: 'Reativação', emoji: '🔄' },
  upsell_crosssell: { label: 'Upsell', emoji: '📈' },
  contract_renewal: { label: 'Renovação', emoji: '📝' },
  timing_objection: { label: 'Objeção Timing', emoji: '⏰' },
  general: { label: 'Geral', emoji: '📋' },
};

interface TemplateFillerProps {
  template: AdaptedTemplate;
  contact: Contact;
  onClose: () => void;
  onUseTemplate: (template: AdaptedTemplate) => void;
  alternativeVariations: { vakType: VAKType; template: string; keywords: string[] }[];
}

function TemplateFiller({ 
  template, 
  contact, 
  onClose, 
  onUseTemplate,
  alternativeVariations 
}: TemplateFillerProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa' || v === 'empresa_cliente') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });
  
  const [copied, setCopied] = useState(false);
  const [activeVAK, setActiveVAK] = useState<VAKType>(template.vakType);
  const [currentTemplate, setCurrentTemplate] = useState(template.template);
  
  // Update template when VAK changes
  useEffect(() => {
    if (activeVAK === template.vakType) {
      setCurrentTemplate(template.template);
    } else {
      const alt = alternativeVariations.find(v => v.vakType === activeVAK);
      if (alt) {
        setCurrentTemplate(alt.template);
      }
    }
  }, [activeVAK, template, alternativeVariations]);
  
  const filledTemplate = currentTemplate.replace(
    /\{(\w+)\}/g, 
    (match, key) => variables[key] || match
  );
  
  const allFilled = template.variables.every(v => variables[v]?.trim());
  
  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Mensagem copiada!');
    onUseTemplate(template);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeVariation = activeVAK === template.vakType 
    ? { keywords: template.keywords, tips: template.tips }
    : alternativeVariations.find(v => v.vakType === activeVAK);

  return (
    <div className="space-y-4">
      {/* VAK Switcher */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" />
          Alternar Sistema VAK
        </Label>
        <div className="flex gap-2">
          {alternativeVariations.map(variation => {
            const Icon = VAK_ICONS[variation.vakType];
            const label = VAK_LABELS[variation.vakType];
            const isActive = activeVAK === variation.vakType;
            
            return (
              <Button
                key={variation.vakType}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveVAK(variation.vakType)}
                className={cn(
                  "gap-1.5",
                  isActive && label.bgColor
                )}
              >
                <Icon className="w-4 h-4" />
                {label.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Keywords Used */}
      {activeVariation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Palavras-chave VAK usadas:
          </p>
          <div className="flex flex-wrap gap-1">
            {(activeVariation.keywords || template.keywords).slice(0, 8).map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Variables */}
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
      
      {/* Preview */}
      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea
          value={filledTemplate}
          readOnly
          className="mt-1 h-32 bg-secondary/30"
        />
      </div>
      
      {/* Tips */}
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas para {VAK_LABELS[activeVAK].name}:</p>
          <ul className="space-y-1">
            {template.tips.slice(0, 5).map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Actions */}
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

export function VAKTemplateLibrary({ contact, className }: VAKTemplateLibraryProps) {
  const { adaptedTemplates, filterByScenario, getAlternativeVariations } = useVAKTemplates(contact);
  const { getContactVAKProfile, analyzeContactInteractions } = useVAKAnalysis();
  const { createUsage } = useTriggerHistory(contact.id);
  
  const [selectedTemplate, setSelectedTemplate] = useState<AdaptedTemplate | null>(null);
  const [activeScenario, setActiveScenario] = useState<PersuasionScenario | 'all'>('all');
  const [activeVAKFilter, setActiveVAKFilter] = useState<VAKType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vakProfile, setVakProfile] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load VAK profile
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getContactVAKProfile(contact.id);
      setVakProfile(profile);
    };
    loadProfile();
  }, [contact.id, getContactVAKProfile]);

  const behavior = contact.behavior as any;
  const primaryVAK = vakProfile?.primary || behavior?.vakProfile?.primary || 'V';

  const handleAnalyzeVAK = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeContactInteractions(contact.id);
      const profile = await getContactVAKProfile(contact.id);
      setVakProfile(profile);
      toast.success('Análise VAK atualizada!');
    } catch (error) {
      toast.error('Erro ao analisar interações');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseTemplate = async (template: AdaptedTemplate) => {
    await createUsage({
      contact_id: contact.id,
      trigger_type: template.trigger as any,
      template_id: template.id,
      template_title: template.title,
      scenario: template.scenario,
      channel: template.channel as any,
      result: 'pending',
      context: `VAK: ${template.vakType}`,
    });
  };

  // Filter templates
  const filteredTemplates = adaptedTemplates.filter(t => {
    // Scenario filter
    if (activeScenario !== 'all' && t.scenario !== activeScenario) return false;
    
    // VAK filter
    if (activeVAKFilter !== 'all' && t.vakType !== activeVAKFilter) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = t.title.toLowerCase().includes(query);
      const templateMatch = t.template.toLowerCase().includes(query);
      const keywordsMatch = t.keywords.some(k => k.toLowerCase().includes(query));
      return titleMatch || templateMatch || keywordsMatch;
    }
    
    return true;
  });

  // Group by scenario for display
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const scenario = template.scenario || 'general';
    if (!acc[scenario]) acc[scenario] = [];
    acc[scenario].push(template);
    return acc;
  }, {} as Record<string, AdaptedTemplate[]>);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Templates VAK Adaptados
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Templates adaptados ao sistema representacional (Visual, Auditivo, Cinestésico, Digital) do contato para maior efetividade na comunicação.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* VAK Profile Summary */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = VAK_ICONS[primaryVAK as VAKType] || Eye;
                return <Icon className="w-5 h-5 text-primary" />;
              })()}
              <span className="font-medium">
                Perfil VAK: {VAK_LABELS[primaryVAK as VAKType]?.name || 'Não definido'}
              </span>
              {vakProfile?.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {vakProfile.confidence}% confiança
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAnalyzeVAK}
              disabled={isAnalyzing}
              className="gap-1"
            >
              <Sparkles className={cn("w-3 h-3", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? 'Analisando...' : 'Reanalisar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {VAK_LABELS[primaryVAK as VAKType]?.description || 'Analise as interações para determinar o perfil VAK.'}
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* VAK Type Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeVAKFilter === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveVAKFilter('all')}
              className="gap-1"
            >
              Todos VAK
            </Button>
            {(['V', 'A', 'K', 'D'] as VAKType[]).map(vak => {
              const Icon = VAK_ICONS[vak];
              const label = VAK_LABELS[vak];
              const count = adaptedTemplates.filter(t => t.vakType === vak).length;
              
              return (
                <Button
                  key={vak}
                  variant={activeVAKFilter === vak ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveVAKFilter(vak)}
                  className={cn(
                    "gap-1",
                    activeVAKFilter === vak && label.bgColor
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label.name}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Scenario Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeScenario === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveScenario('all')}
            >
              Todos Cenários
            </Button>
            {Object.entries(scenarioLabels).map(([key, { label, emoji }]) => {
              const count = adaptedTemplates.filter(t => t.scenario === key).length;
              if (count === 0) return null;
              
              return (
                <Button
                  key={key}
                  variant={activeScenario === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveScenario(key as PersuasionScenario)}
                  className="gap-1"
                >
                  {emoji} {label}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar templates por título, conteúdo ou palavras-chave VAK..."
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
        </div>

        {/* Templates List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedTemplates).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum template encontrado com os filtros atuais.
                </p>
              </div>
            )}

            {Object.entries(groupedTemplates).map(([scenario, templates]) => {
              const scenarioInfo = scenarioLabels[scenario] || { label: scenario, emoji: '📋' };
              
              return (
                <div key={scenario} className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                    <span>{scenarioInfo.emoji}</span>
                    {scenarioInfo.label}
                    <Badge variant="outline" className="text-xs">
                      {templates.length}
                    </Badge>
                  </h4>
                  
                  <div className="grid gap-2">
                    {templates.map((template) => {
                      const Icon = VAK_ICONS[template.vakType];
                      const vakLabel = VAK_LABELS[template.vakType];
                      const ChannelIcon = channelIcons[template.channel as keyof typeof channelIcons] || FileText;
                      
                      return (
                        <Dialog 
                          key={template.id}
                          open={selectedTemplate?.id === template.id}
                          onOpenChange={(open) => !open && setSelectedTemplate(null)}
                        >
                          <DialogTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.01 }}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                "hover:shadow-md hover:border-primary/30",
                                "bg-card"
                              )}
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg shrink-0",
                                  vakLabel.bgColor
                                )}>
                                  <Icon className={cn("w-4 h-4", vakLabel.color)} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-sm truncate">
                                      {template.title}
                                    </h5>
                                    {template.matchScore > 70 && (
                                      <Badge className="bg-green-100 text-green-700 text-xs shrink-0">
                                        Recomendado
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {template.template.substring(0, 100)}...
                                  </p>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className={cn("text-xs", vakLabel.bgColor, vakLabel.color)}>
                                      {vakLabel.name}
                                    </Badge>
                                    {template.triggerInfo && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <span>{template.triggerInfo.icon}</span>
                                        {template.triggerInfo.name}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <ChannelIcon className="w-3 h-3" />
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {template.matchScore}% match
                                    </span>
                                  </div>
                                </div>
                                
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              </div>
                            </motion.div>
                          </DialogTrigger>
                          
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Icon className={cn("w-5 h-5", vakLabel.color)} />
                                {template.title}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <TemplateFiller
                              template={template}
                              contact={contact}
                              onClose={() => setSelectedTemplate(null)}
                              onUseTemplate={handleUseTemplate}
                              alternativeVariations={getAlternativeVariations(template.id)}
                            />
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
