import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Info,
  Lightbulb,
  MessageSquare,
  DollarSign,
  Clock,
  Shield,
  HelpCircle,
  Users,
  Swords,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { 
  SLEIGHT_OF_MOUTH_PATTERNS, 
  SLEIGHT_TEMPLATES, 
  SleightOfMouthPattern,
  SleightTemplate,
  SleightPattern,
  getTemplatesByPattern,
  getTemplatesByObjection,
} from '@/data/sleightOfMouth';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { toast } from 'sonner';

interface SleightOfMouthLibraryProps {
  contact: Contact;
  className?: string;
}

type ObjectionCategory = SleightTemplate['objectionCategory'];

const objectionIcons: Record<ObjectionCategory, typeof DollarSign> = {
  price: DollarSign,
  timing: Clock,
  trust: Shield,
  need: HelpCircle,
  authority: Users,
  competition: Swords,
};

const objectionLabels: Record<ObjectionCategory, { label: string; description: string }> = {
  price: { label: 'Preço', description: '"É muito caro", "Não tenho orçamento"' },
  timing: { label: 'Timing', description: '"Não é o momento", "Talvez depois"' },
  trust: { label: 'Confiança', description: '"Não confio nisso", "Parece bom demais"' },
  need: { label: 'Necessidade', description: '"Não preciso", "Estou bem assim"' },
  authority: { label: 'Autoridade', description: '"Preciso falar com...", "Vou pensar"' },
  competition: { label: 'Concorrência', description: '"Já tenho algo similar"' },
};

interface TemplateFillerProps {
  template: SleightTemplate;
  pattern: SleightPattern;
  contact: Contact;
  onClose: () => void;
  onUseTemplate: () => void;
}

function TemplateFiller({ template, pattern, contact, onClose, onUseTemplate }: TemplateFillerProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });
  
  const [copied, setCopied] = useState(false);
  
  const filledTemplate = template.response.replace(
    /\{(\w+)\}/g, 
    (match, key) => variables[key] || match
  );
  
  const allFilled = template.variables.every(v => variables[v]?.trim());
  
  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Resposta copiada!');
    onUseTemplate();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Pattern Info */}
      <div className={cn("p-3 rounded-lg border", pattern.color)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{pattern.icon}</span>
          <div>
            <h4 className="font-medium">{pattern.name}</h4>
            <p className="text-xs opacity-80">{pattern.nameEn}</p>
          </div>
        </div>
        <p className="text-sm">{pattern.description}</p>
      </div>

      {/* How it works */}
      <div className="p-3 rounded-lg bg-secondary/30 border">
        <p className="text-xs font-medium mb-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          Como funciona:
        </p>
        <p className="text-sm text-muted-foreground">{pattern.howItWorks}</p>
        <p className="text-xs mt-2 font-mono bg-background/50 p-2 rounded">{pattern.formula}</p>
      </div>

      {/* Objection context */}
      <div className="p-3 rounded-lg bg-muted/50 border">
        <p className="text-xs font-medium mb-1">Objeção tratada:</p>
        <Badge variant="outline" className="text-sm">"{template.objection}"</Badge>
      </div>
      
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
        <Label className="text-sm">Sua resposta:</Label>
        <Textarea
          value={filledTemplate}
          readOnly
          className="mt-1 h-28 bg-secondary/30"
        />
      </div>

      {/* Explanation */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Por que funciona:</p>
        <p className="text-sm text-blue-600 dark:text-blue-300">{template.explanation}</p>
      </div>
      
      {/* Tips */}
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas de uso:</p>
          <ul className="space-y-1">
            {template.tips.map((tip, i) => (
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
          {copied ? 'Copiado!' : 'Copiar Resposta'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

function PatternCard({ pattern, isExpanded, onToggle }: { 
  pattern: SleightPattern; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
          pattern.color
        )}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pattern.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{pattern.name}</h4>
              <p className="text-xs opacity-80">{pattern.nameEn}</p>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border-x border-b rounded-b-lg bg-background"
        >
          <div className="space-y-3">
            <p className="text-sm">{pattern.description}</p>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Como funciona:</p>
              <p className="text-sm">{pattern.howItWorks}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Fórmula:</p>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded">{pattern.formula}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Exemplos:</p>
              <ul className="space-y-1">
                {pattern.examples.map((ex, i) => (
                  <li key={i} className="text-sm italic text-muted-foreground">{ex}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <p className="text-xs font-medium text-muted-foreground mr-2">Melhor para:</p>
              {pattern.bestFor.map((use, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{use}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SleightOfMouthLibrary({ contact, className }: SleightOfMouthLibraryProps) {
  const { createUsage } = useTriggerHistory(contact.id);
  const [activeTab, setActiveTab] = useState<'patterns' | 'objections'>('objections');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SleightTemplate | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<SleightOfMouthPattern | null>(null);
  const [activeObjection, setActiveObjection] = useState<ObjectionCategory | 'all'>('all');

  const handleUseTemplate = async (template: SleightTemplate) => {
    await createUsage({
      contact_id: contact.id,
      trigger_type: 'reason_why',
      template_id: template.id,
      template_title: `SoM: ${template.objection}`,
      scenario: 'general',
      channel: 'any',
      result: 'pending',
      context: `Sleight of Mouth: ${template.pattern}`,
    });
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = SLEIGHT_TEMPLATES;
    
    if (activeObjection !== 'all') {
      templates = templates.filter(t => t.objectionCategory === activeObjection);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.objection.toLowerCase().includes(query) ||
        t.response.toLowerCase().includes(query) ||
        SLEIGHT_OF_MOUTH_PATTERNS[t.pattern].name.toLowerCase().includes(query)
      );
    }
    
    return templates;
  }, [activeObjection, searchQuery]);

  // Group by objection category
  const templatesByObjection = useMemo(() => {
    return filteredTemplates.reduce((acc, template) => {
      if (!acc[template.objectionCategory]) acc[template.objectionCategory] = [];
      acc[template.objectionCategory].push(template);
      return acc;
    }, {} as Record<ObjectionCategory, SleightTemplate[]>);
  }, [filteredTemplates]);

  // Group by pattern
  const templatesByPattern = useMemo(() => {
    return filteredTemplates.reduce((acc, template) => {
      if (!acc[template.pattern]) acc[template.pattern] = [];
      acc[template.pattern].push(template);
      return acc;
    }, {} as Record<SleightOfMouthPattern, SleightTemplate[]>);
  }, [filteredTemplates]);

  const patterns = Object.values(SLEIGHT_OF_MOUTH_PATTERNS);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Sleight of Mouth
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>14 padrões de ressignificação linguística de Robert Dilts para transformar objeções em oportunidades.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="secondary" className="ml-auto">
            {filteredTemplates.length} respostas
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'patterns' | 'objections')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="objections" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Por Objeção
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              14 Padrões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="objections" className="mt-4 space-y-4">
            {/* Objection filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeObjection === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveObjection('all')}
              >
                Todas
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {SLEIGHT_TEMPLATES.length}
                </Badge>
              </Button>
              {(Object.entries(objectionLabels) as [ObjectionCategory, typeof objectionLabels[ObjectionCategory]][]).map(([key, { label }]) => {
                const Icon = objectionIcons[key];
                const count = SLEIGHT_TEMPLATES.filter(t => t.objectionCategory === key).length;
                
                return (
                  <Button
                    key={key}
                    variant={activeObjection === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveObjection(key)}
                    className="gap-1"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
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
                placeholder="Buscar objeção ou resposta..."
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

            {/* Templates list */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(templatesByObjection).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma resposta encontrada.
                    </p>
                  </div>
                )}

                {(Object.entries(templatesByObjection) as [ObjectionCategory, SleightTemplate[]][]).map(([category, templates]) => {
                  const { label, description } = objectionLabels[category];
                  const Icon = objectionIcons[category];
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className="w-4 h-4" />
                        {label}
                        <span className="text-xs font-normal">— {description}</span>
                      </div>
                      
                      <div className="grid gap-2">
                        {templates.map((template) => {
                          const pattern = SLEIGHT_OF_MOUTH_PATTERNS[template.pattern];
                          
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
                                      pattern.color
                                    )}>
                                      <span>{pattern.icon}</span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                          "{template.objection}"
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {template.response.substring(0, 120)}...
                                      </p>
                                      
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={cn("text-xs", pattern.color)}>
                                          {pattern.name}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                  </div>
                                </motion.div>
                              </DialogTrigger>
                              
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <span>{pattern.icon}</span>
                                    {pattern.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Resposta para: "{template.objection}"
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <TemplateFiller
                                  template={template}
                                  pattern={pattern}
                                  contact={contact}
                                  onClose={() => setSelectedTemplate(null)}
                                  onUseTemplate={() => handleUseTemplate(template)}
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
          </TabsContent>
          
          <TabsContent value="patterns" className="mt-4 space-y-4">
            {/* Patterns reference */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border">
              <h4 className="font-medium text-sm mb-1">Os 14 Padrões Sleight of Mouth</h4>
              <p className="text-xs text-muted-foreground">
                Desenvolvidos por Robert Dilts baseado nos padrões linguísticos de Milton Erickson e Richard Bandler.
                Usados para ressignificar crenças e transformar objeções.
              </p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {patterns.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    isExpanded={expandedPattern === pattern.id}
                    onToggle={() => setExpandedPattern(
                      expandedPattern === pattern.id ? null : pattern.id
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
