import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Brain, 
  Search, 
  Copy, 
  Check, 
  Target, 
  Shield, 
  Compass, 
  Users, 
  GitBranch, 
  List,
  Sparkles,
  FileText,
  MessageSquare,
  Handshake,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { 
  MetaprogramProfile,
  MotivationDirection,
  ReferenceFrame,
  WorkingStyle,
  METAPROGRAM_LABELS
} from '@/types/metaprograms';
import { 
  METAPROGRAM_TEMPLATES, 
  MetaprogramTemplate,
  getAdaptedMessage 
} from '@/data/metaprogramTemplates';
import { motion, AnimatePresence } from 'framer-motion';
import { createMetaprogramFocusHandler, MetaprogramFocusType } from '@/lib/tab-utils';

interface MetaprogramTemplateLibraryProps {
  contactId: string;
  contactName: string;
  interactions: Array<{ id: string; content: string; transcription?: string }>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  sales: <FileText className="h-4 w-4" />,
  objection: <AlertCircle className="h-4 w-4" />,
  follow_up: <RefreshCw className="h-4 w-4" />,
  closing: <Handshake className="h-4 w-4" />,
  relationship: <MessageSquare className="h-4 w-4" />
};

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Vendas',
  objection: 'Objeções',
  follow_up: 'Follow-up',
  closing: 'Fechamento',
  relationship: 'Relacionamento'
};

export function MetaprogramTemplateLibrary({
  contactId,
  contactName,
  interactions
}: MetaprogramTemplateLibraryProps) {
  const [profile, setProfile] = useState<MetaprogramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MetaprogramTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [focusType, setFocusType] = useState<'motivation' | 'reference' | 'working'>('motivation');
  const [copied, setCopied] = useState(false);

  const { getContactMetaprogramProfile, analyzeContactInteractions, loading: analyzing } = useMetaprogramAnalysis();
  const { createUsage } = useTriggerHistory();

  useEffect(() => {
    loadProfile();
  }, [contactId]);

  const loadProfile = async () => {
    setIsLoading(true);
    const result = await getContactMetaprogramProfile(contactId);
    setProfile(result);
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    await analyzeContactInteractions(contactId, interactions);
    await loadProfile();
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return METAPROGRAM_TEMPLATES.filter(template => {
      // Category filter
      if (categoryFilter !== 'all' && template.category !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.baseTitle.toLowerCase().includes(query) ||
          template.scenario.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Get adapted message for current template and profile
  const getPreviewMessage = useMemo(() => {
    if (!selectedTemplate || !profile) return '';

    const messages = getAdaptedMessage(
      selectedTemplate,
      profile.motivationDirection,
      profile.referenceFrame,
      profile.workingStyle
    );

    let message = '';
    switch (focusType) {
      case 'motivation':
        message = messages.motivation;
        break;
      case 'reference':
        message = messages.reference;
        break;
      case 'working':
        message = messages.working;
        break;
    }

    // Replace variables
    Object.entries(variableValues).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
    });

    return message;
  }, [selectedTemplate, profile, focusType, variableValues]);

  const handleSelectTemplate = (template: MetaprogramTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables with defaults
    const defaults: Record<string, string> = { nome: contactName };
    template.variables.forEach(v => {
      if (!defaults[v]) defaults[v] = '';
    });
    setVariableValues(defaults);
  };

  const handleCopy = async () => {
    if (!getPreviewMessage) return;
    
    await navigator.clipboard.writeText(getPreviewMessage);
    setCopied(true);

    // Record usage
    if (selectedTemplate) {
      await createUsage({
        contact_id: contactId,
        trigger_type: 'personalization',
        template_title: selectedTemplate.baseTitle,
        context: getPreviewMessage
      });
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const renderProfileSummary = () => {
    if (!profile) return null;

    return (
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          {profile.motivationDirection === 'toward' ? (
            <Target className="h-4 w-4 text-emerald-600" />
          ) : (
            <Shield className="h-4 w-4 text-amber-600" />
          )}
          <span className="text-sm font-medium">
            {METAPROGRAM_LABELS.motivationDirection[profile.motivationDirection].name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {profile.referenceFrame === 'internal' ? (
            <Compass className="h-4 w-4 text-violet-600" />
          ) : (
            <Users className="h-4 w-4 text-sky-600" />
          )}
          <span className="text-sm font-medium">
            {METAPROGRAM_LABELS.referenceFrame[profile.referenceFrame].name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {profile.workingStyle === 'options' ? (
            <GitBranch className="h-4 w-4 text-fuchsia-600" />
          ) : (
            <List className="h-4 w-4 text-orange-600" />
          )}
          <span className="text-sm font-medium">
            {METAPROGRAM_LABELS.workingStyle[profile.workingStyle].name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates por Metaprogramas
          </CardTitle>
          {!profile && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || interactions.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              Analisar Perfil
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Analise o perfil de metaprogramas primeiro</p>
            <p className="text-sm mt-1">
              {interactions.length > 0 
                ? `${interactions.length} interações disponíveis para análise`
                : 'Adicione interações para habilitar a análise'}
            </p>
          </div>
        ) : (
          <>
            {renderProfileSummary()}

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_ICONS[value]}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Templates List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      selectedTemplate?.id === template.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[template.category]}
                        <span className="font-medium">{template.baseTitle}</span>
                      </div>
                      <Badge variant="outline">{CATEGORY_LABELS[template.category]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{template.scenario}</p>
                  </motion.div>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum template encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Template Editor Dialog */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && CATEGORY_ICONS[selectedTemplate.category]}
                {selectedTemplate?.baseTitle}
              </DialogTitle>
            </DialogHeader>

            {selectedTemplate && profile && (
              <div className="space-y-4">
                {/* Focus Type Selection */}
                <div>
                  <Label className="mb-2 block">Foco da Mensagem</Label>
                  <Tabs value={focusType} onValueChange={createMetaprogramFocusHandler(setFocusType)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="motivation" className="flex items-center gap-1">
                        {profile.motivationDirection === 'toward' ? <Target className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        Motivação
                      </TabsTrigger>
                      <TabsTrigger value="reference" className="flex items-center gap-1">
                        {profile.referenceFrame === 'internal' ? <Compass className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        Referência
                      </TabsTrigger>
                      <TabsTrigger value="working" className="flex items-center gap-1">
                        {profile.workingStyle === 'options' ? <GitBranch className="h-3 w-3" /> : <List className="h-3 w-3" />}
                        Estilo
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Variables */}
                <div>
                  <Label className="mb-2 block">Variáveis</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.variables.slice(0, 8).map((variable) => (
                      <div key={variable}>
                        <Label className="text-xs text-muted-foreground">{variable}</Label>
                        <Input
                          value={variableValues[variable] || ''}
                          onChange={(e) => setVariableValues(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                          placeholder={variable}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                  {selectedTemplate.variables.length > 8 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{selectedTemplate.variables.length - 8} variáveis adicionais
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div>
                  <Label className="mb-2 block">Prévia da Mensagem</Label>
                  <div className="relative">
                    <Textarea
                      value={getPreviewMessage}
                      readOnly
                      className="min-h-[150px] pr-12"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Adaptation Info */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Adaptação aplicada:</strong>
                    {' '}
                    {focusType === 'motivation' && (
                      <>
                        Mensagem focada em{' '}
                        <strong>{METAPROGRAM_LABELS.motivationDirection[profile.motivationDirection].name}</strong>
                        {' '}({profile.motivationConfidence}% confiança)
                      </>
                    )}
                    {focusType === 'reference' && (
                      <>
                        Referência{' '}
                        <strong>{METAPROGRAM_LABELS.referenceFrame[profile.referenceFrame].name}</strong>
                        {' '}({profile.referenceConfidence}% confiança)
                      </>
                    )}
                    {focusType === 'working' && (
                      <>
                        Estilo{' '}
                        <strong>{METAPROGRAM_LABELS.workingStyle[profile.workingStyle].name}</strong>
                        {' '}({profile.workingConfidence}% confiança)
                      </>
                    )}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Fechar
                  </Button>
                  <Button onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Mensagem
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
