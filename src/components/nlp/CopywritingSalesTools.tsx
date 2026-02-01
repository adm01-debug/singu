// ==============================================
// COPYWRITING SALES TOOLS - Component
// Enterprise-grade copywriting panel
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Target, 
  Zap, 
  Users, 
  Sparkles,
  ArrowRight,
  Copy,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  LayoutList,
  Quote,
  Link2
} from 'lucide-react';
import { Contact } from '@/types';
import { useCopywritingTools } from '@/hooks/useCopywritingTools';
import { DEMO_CONTACT } from '@/lib/demo-contact';
import { toast } from 'sonner';

interface CopywritingSalesToolsProps {
  contact?: Contact;
}

export default function CopywritingSalesTools({ contact }: CopywritingSalesToolsProps) {
  const safeContact = contact || DEMO_CONTACT as unknown as Contact;
  const [activeTab, setActiveTab] = useState('fab');
  const [productInput, setProductInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const {
    fabTemplates,
    aidaTemplates,
    ctaTemplates,
    getRecommendedCTAs,
    headlineFormulas,
    transitionWords,
    persuasiveConnectors,
    powerWordsCategories,
    generateIdealForSection,
    discProfile,
    vakType
  } = useCopywritingTools(safeContact);

  const recommendedCTAs = useMemo(() => getRecommendedCTAs(3), [getRecommendedCTAs]);
  const idealForSection = useMemo(() => generateIdealForSection(productInput), [generateIdealForSection, productInput]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Copywriting Sales Tools
          <Badge variant="secondary" className="ml-2">
            {discProfile} | {vakType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="fab" className="text-xs">
              <LayoutList className="h-3 w-3 mr-1" />
              FAB
            </TabsTrigger>
            <TabsTrigger value="aida" className="text-xs">
              <ArrowRight className="h-3 w-3 mr-1" />
              AIDA
            </TabsTrigger>
            <TabsTrigger value="cta" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              CTAs
            </TabsTrigger>
            <TabsTrigger value="headlines" className="text-xs">
              <Quote className="h-3 w-3 mr-1" />
              Headlines
            </TabsTrigger>
            <TabsTrigger value="transitions" className="text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              Transições
            </TabsTrigger>
            <TabsTrigger value="segments" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Segmentos
            </TabsTrigger>
          </TabsList>

          {/* FAB Tab */}
          <TabsContent value="fab" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Estrutura FAB (Feature → Advantage → Benefit)
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Transforme características técnicas em benefícios emocionais
              </p>
              
              <ScrollArea className="h-[300px]">
                {fabTemplates.map((template, idx) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-blue-500/10 rounded p-3">
                        <span className="text-xs font-medium text-blue-600">FEATURE (Característica)</span>
                        <p className="text-sm mt-1">{template.example.feature}</p>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-amber-500/10 rounded p-3">
                        <span className="text-xs font-medium text-amber-600">ADVANTAGE (Vantagem)</span>
                        <p className="text-sm mt-1">{template.example.advantage}</p>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-green-500/10 rounded p-3">
                        <span className="text-xs font-medium text-green-600">BENEFIT (Benefício)</span>
                        <p className="text-sm mt-1">{template.example.benefit}</p>
                        {template.example.emotionalHook && (
                          <Badge className="mt-2 bg-green-600">{template.example.emotionalHook}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.powerWords.map(word => (
                        <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* AIDA Tab */}
          <TabsContent value="aida" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Estrutura AIDA (Attention → Interest → Desire → Action)
              </h4>
              
              <ScrollArea className="h-[350px]">
                {aidaTemplates.map((template) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{template.name}</h5>
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.channel}</Badge>
                        {template.targetProfile?.disc && (
                          <Badge>DISC: {template.targetProfile.disc}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {template.sections.map((section, idx) => (
                        <div 
                          key={section.stage}
                          className={`rounded p-3 ${
                            section.stage === 'attention' ? 'bg-red-500/10 border-l-4 border-red-500' :
                            section.stage === 'interest' ? 'bg-amber-500/10 border-l-4 border-amber-500' :
                            section.stage === 'desire' ? 'bg-blue-500/10 border-l-4 border-blue-500' :
                            'bg-green-500/10 border-l-4 border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase">
                              {section.stage === 'attention' ? '🎯 ATENÇÃO' :
                               section.stage === 'interest' ? '💡 INTERESSE' :
                               section.stage === 'desire' ? '🔥 DESEJO' : '👉 AÇÃO'}
                            </span>
                            <span className="text-xs text-muted-foreground">{section.duration}</span>
                          </div>
                          <p className="text-sm">{section.content}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.powerWords.slice(0, 3).map(word => (
                              <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Conversão estimada: {template.estimatedConversion}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          template.sections.map(s => s.content).join('\n\n'),
                          template.id
                        )}
                      >
                        {copiedId === template.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* CTA Tab */}
          <TabsContent value="cta" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                CTAs Recomendados para {discProfile}
              </h4>
              
              <ScrollArea className="h-[300px]">
                <div className="grid gap-3">
                  {recommendedCTAs.map((cta) => (
                    <div key={cta.id} className="bg-background rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          cta.type === 'primary' ? 'bg-primary' :
                          cta.type === 'urgent' ? 'bg-red-500' :
                          cta.type === 'soft' ? 'bg-blue-500' :
                          cta.type === 'exclusive' ? 'bg-purple-500' :
                          'bg-green-500'
                        }>
                          {cta.type.toUpperCase()}
                        </Badge>
                        <div className="flex gap-1">
                          {Array.from({ length: cta.urgencyLevel }).map((_, i) => (
                            <Zap key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      
                      <p className="font-medium text-sm mb-1">{cta.template}</p>
                      <p className="text-sm text-muted-foreground italic">"{cta.example}"</p>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>D: {cta.discCompatibility.D}%</span>
                          <span>I: {cta.discCompatibility.I}%</span>
                          <span>S: {cta.discCompatibility.S}%</span>
                          <span>C: {cta.discCompatibility.C}%</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(cta.example, cta.id)}
                        >
                          {copiedId === cta.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Todos os Templates de CTA</h5>
                <div className="flex flex-wrap gap-2">
                  {ctaTemplates.map(cta => (
                    <Badge 
                      key={cta.id} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => copyToClipboard(cta.example, `all-${cta.id}`)}
                    >
                      {cta.verb}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Headlines Tab */}
          <TabsContent value="headlines" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Quote className="h-4 w-4 text-primary" />
                Fórmulas de Headlines
              </h4>
              
              <ScrollArea className="h-[300px]">
                {headlineFormulas.map((formula) => (
                  <div key={formula.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{formula.type.replace('_', ' ').toUpperCase()}</Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Efetividade:</span>
                        {Array.from({ length: formula.effectiveness }).map((_, i) => (
                          <span key={i} className="text-amber-500">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="font-mono text-sm bg-muted p-2 rounded mb-2">{formula.formula}</p>
                    <p className="text-sm text-primary italic">"{formula.example}"</p>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formula.powerWordsToUse.map(word => (
                        <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={() => copyToClipboard(formula.example, formula.id)}
                    >
                      {copiedId === formula.id ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copiar exemplo
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Transitions Tab */}
          <TabsContent value="transitions" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Palavras de Transição & Conectores Persuasivos
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Transition Words */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Transições</h5>
                  <ScrollArea className="h-[250px]">
                    {transitionWords.slice(0, 10).map((tw, idx) => (
                      <div 
                        key={idx} 
                        className="bg-background rounded p-3 mb-2 border cursor-pointer hover:border-primary/50"
                        onClick={() => copyToClipboard(tw.word, `tw-${idx}`)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-primary">{tw.word}</span>
                          <Badge variant="outline" className="text-xs">{tw.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{tw.usage}</p>
                        <p className="text-xs italic mt-1">"{tw.example}"</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                
                {/* Persuasive Connectors */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Conectores Persuasivos</h5>
                  <ScrollArea className="h-[250px]">
                    {persuasiveConnectors.map((pc) => (
                      <div 
                        key={pc.id} 
                        className="bg-background rounded p-3 mb-2 border cursor-pointer hover:border-primary/50"
                        onClick={() => copyToClipboard(pc.phrase, pc.id)}
                      >
                        <span className="font-medium text-sm text-primary block mb-1">{pc.phrase}</span>
                        <p className="text-xs text-muted-foreground">{pc.purpose}</p>
                        <p className="text-xs italic mt-1">"{pc.example}"</p>
                        <Badge 
                          className={`mt-2 text-xs ${
                            pc.emotionalImpact === 'high' ? 'bg-green-500' :
                            pc.emotionalImpact === 'medium' ? 'bg-amber-500' : 'bg-gray-500'
                          }`}
                        >
                          Impacto: {pc.emotionalImpact}
                        </Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>

              {/* Power Words */}
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Power Words por Categoria</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(powerWordsCategories).map(([category, words]) => (
                    <div key={category} className="bg-background rounded p-2 border">
                      <span className="text-xs font-medium capitalize">{category}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {words.slice(0, 4).map(word => (
                          <Badge 
                            key={word} 
                            variant="secondary" 
                            className="text-xs cursor-pointer"
                            onClick={() => copyToClipboard(word, `pw-${word}`)}
                          >
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Segmentação "Ideal Para:"
              </h4>
              
              <div className="mb-4">
                <Input
                  placeholder="Descreva seu produto/serviço..."
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  className="mb-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Ideal Para
                  </h5>
                  <p className="text-sm font-medium mb-2">{idealForSection.primaryAudience}</p>
                  <ul className="space-y-1">
                    {idealForSection.secondaryAudiences.map((audience, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {audience}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Não é Ideal Para
                  </h5>
                  <ul className="space-y-1">
                    {idealForSection.notIdealFor.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-background rounded-lg p-4 border">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Perguntas Qualificadoras
                </h5>
                <ul className="space-y-2">
                  {idealForSection.qualifyingQuestions.map((question, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
