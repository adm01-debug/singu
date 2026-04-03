// ==============================================
// COPYWRITING SALES TOOLS - Enhanced Component
// Enterprise-grade copywriting panel with all features
// ==============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  Link2,
  BarChart3,
  Smartphone,
  Mail,
  BookOpen,
  Wand2,
  AlertTriangle,
  TrendingUp,
  Smile,
  Eye,
  PenTool
} from 'lucide-react';
import { Contact } from '@/types';
import { useCopywritingTools } from '@/hooks/useCopywritingTools';
import { useCopywritingAdvanced } from '@/hooks/useCopywritingAdvanced';
import { DEMO_CONTACT } from '@/lib/demo-contact';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopywritingSalesToolsProps {
  contact?: Contact;
}

export default function CopywritingSalesTools({ contact }: CopywritingSalesToolsProps) {
  const safeContact = contact || DEMO_CONTACT as unknown as Contact;
  const [activeTab, setActiveTab] = useState('analyzer');
  const [analyzeText, setAnalyzeText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Basic copywriting tools
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

  // Advanced copywriting tools
  const {
    analyzeCopy,
    pasTemplates,
    fourPsTemplates,
    storytellingTemplates,
    emojiContexts,
    getEmojiSuggestions,
    generateChannelPreviews
  } = useCopywritingAdvanced(safeContact);

  const recommendedCTAs = useMemo(() => getRecommendedCTAs(3), [getRecommendedCTAs]);
  const idealForSection = useMemo(() => generateIdealForSection(), [generateIdealForSection]);

  // Analysis results
  const analysisResult = useMemo(() => {
    if (analyzeText.length < 20) return null;
    return analyzeCopy(analyzeText);
  }, [analyzeText, analyzeCopy]);

  const emojiSuggestions = useMemo(() => {
    if (analyzeText.length < 10) return [];
    return getEmojiSuggestions(analyzeText, 'whatsapp');
  }, [analyzeText, getEmojiSuggestions]);

  const channelPreviews = useMemo(() => {
    if (analyzeText.length < 10) return [];
    return generateChannelPreviews(analyzeText);
  }, [analyzeText, generateChannelPreviews]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-success';
    if (score >= 40) return 'text-warning';
    if (score >= 20) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-emerald-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5 text-primary" />
          Copywriting Sales Tools
          <Badge variant="secondary" className="ml-2">
            {discProfile} | {vakType}
          </Badge>
          <Badge className="bg-primary/20 text-primary">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 mb-4 h-auto flex-wrap">
            <TabsTrigger value="analyzer" className="text-xs px-2 py-1.5">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analisador
            </TabsTrigger>
            <TabsTrigger value="pas" className="text-xs px-2 py-1.5">
              <AlertTriangle className="h-3 w-3 mr-1" />
              PAS
            </TabsTrigger>
            <TabsTrigger value="4ps" className="text-xs px-2 py-1.5">
              <Target className="h-3 w-3 mr-1" />
              4Ps
            </TabsTrigger>
            <TabsTrigger value="story" className="text-xs px-2 py-1.5">
              <BookOpen className="h-3 w-3 mr-1" />
              Story
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-1.5">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="fab" className="text-xs px-2 py-1.5">
              <LayoutList className="h-3 w-3 mr-1" />
              FAB
            </TabsTrigger>
            <TabsTrigger value="aida" className="text-xs px-2 py-1.5">
              <ArrowRight className="h-3 w-3 mr-1" />
              AIDA
            </TabsTrigger>
            <TabsTrigger value="cta" className="text-xs px-2 py-1.5">
              <Zap className="h-3 w-3 mr-1" />
              CTAs
            </TabsTrigger>
            <TabsTrigger value="emoji" className="text-xs px-2 py-1.5">
              <Smile className="h-3 w-3 mr-1" />
              Emoji
            </TabsTrigger>
            <TabsTrigger value="headlines" className="text-xs px-2 py-1.5">
              <Quote className="h-3 w-3 mr-1" />
              Headlines
            </TabsTrigger>
          </TabsList>

          {/* ANALYZER TAB */}
          <TabsContent value="analyzer" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cole seu texto para análise:</label>
                <Textarea
                  placeholder="Cole aqui o texto que deseja analisar (mínimo 20 caracteres)..."
                  value={analyzeText}
                  onChange={(e) => setAnalyzeText(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {analyzeText.length} caracteres
                </p>
              </div>

              {analysisResult && (
                <div className="space-y-4">
                  {/* Score Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className={cn("text-2xl font-bold", getScoreColor(analysisResult.persuasionScore))}>
                        {analysisResult.persuasionScore}
                      </span>
                      <p className="text-xs text-muted-foreground">Persuasão</p>
                      <Progress value={analysisResult.persuasionScore} className="h-1 mt-1" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className={cn("text-2xl font-bold", getScoreColor(analysisResult.clarityScore))}>
                        {analysisResult.clarityScore}
                      </span>
                      <p className="text-xs text-muted-foreground">Clareza</p>
                      <Progress value={analysisResult.clarityScore} className="h-1 mt-1" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className={cn("text-2xl font-bold", getScoreColor(analysisResult.emotionalScore))}>
                        {analysisResult.emotionalScore}
                      </span>
                      <p className="text-xs text-muted-foreground">Emocional</p>
                      <Progress value={analysisResult.emotionalScore} className="h-1 mt-1" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className={cn("text-2xl font-bold", getScoreColor(analysisResult.ctaStrength))}>
                        {analysisResult.ctaStrength}
                      </span>
                      <p className="text-xs text-muted-foreground">CTA</p>
                      <Progress value={analysisResult.ctaStrength} className="h-1 mt-1" />
                    </div>
                  </div>

                  {/* Readability */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Legibilidade (Flesch PT-BR)
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-3xl font-bold",
                        getScoreColor(analysisResult.readability.fleschScore)
                      )}>
                        {analysisResult.readability.fleschScore}
                      </div>
                      <div>
                        <Badge className={cn(
                          analysisResult.readability.level === 'muito_facil' ? 'bg-green-500' :
                          analysisResult.readability.level === 'facil' ? 'bg-emerald-500' :
                          analysisResult.readability.level === 'medio' ? 'bg-yellow-500' :
                          analysisResult.readability.level === 'dificil' ? 'bg-orange-500' : 'bg-red-500'
                        )}>
                          {analysisResult.readability.level.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analysisResult.readability.recommendation}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div className="bg-background rounded p-2">
                        <span className="font-medium">{analysisResult.readability.avgSentenceLength}</span>
                        <span className="text-muted-foreground ml-1">palavras/frase</span>
                      </div>
                      <div className="bg-background rounded p-2">
                        <span className="font-medium">{analysisResult.readability.avgWordLength}</span>
                        <span className="text-muted-foreground ml-1">letras/palavra</span>
                      </div>
                      <div className="bg-background rounded p-2">
                        <span className="font-medium">{analysisResult.readability.complexWordPercentage}%</span>
                        <span className="text-muted-foreground ml-1">palavras complexas</span>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Density */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Densidade de Gatilhos
                    </h4>
                    <div className="flex items-center gap-4 mb-3">
                      <Badge className={cn(
                        analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'bg-green-500' :
                        analysisResult.triggerDensity.saturationLevel === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                      )}>
                        {analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'ÓTIMO' :
                         analysisResult.triggerDensity.saturationLevel === 'low' ? 'BAIXO' : 'ALTO'}
                      </Badge>
                      <span className="text-sm">
                        {analysisResult.triggerDensity.triggersPerSentence} gatilhos/frase
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {analysisResult.triggerDensity.recommendation}
                    </p>
                    {analysisResult.triggerDensity.dominantTriggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">Presentes:</span>
                        {analysisResult.triggerDensity.dominantTriggers.map(t => (
                          <Badge key={t} variant="secondary" className="text-xs bg-success/20 text-success">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {analysisResult.triggerDensity.missingTriggers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Faltando:</span>
                        {analysisResult.triggerDensity.missingTriggers.slice(0, 4).map(t => (
                          <Badge key={t} variant="outline" className="text-xs border-destructive/30 text-destructive">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Issues & Strengths */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysisResult.issues.length > 0 && (
                      <div className="bg-destructive/10 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Pontos a Melhorar
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm">
                              <span className={cn(
                                "font-medium",
                                issue.severity === 'high' ? 'text-destructive' :
                                issue.severity === 'medium' ? 'text-warning' : 'text-warning'
                              )}>
                                {issue.issue}
                              </span>
                              <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.strengths.length > 0 && (
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Pontos Fortes
                        </h4>
                        <ul className="space-y-1">
                          {analysisResult.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PAS TAB */}
          <TabsContent value="pas" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                PAS (Problem → Agitate → Solution)
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Identifique o problema, agite a dor, apresente a solução
              </p>
              
              <ScrollArea className="h-[400px]">
                {pasTemplates.map((template) => (
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

                    <div className="space-y-3">
                      {template.sections.map((section) => (
                        <div 
                          key={section.stage}
                          className={cn(
                            "rounded p-3 border-l-4",
                            section.stage === 'problem' ? 'bg-red-500/10 border-red-500' :
                            section.stage === 'agitate' ? 'bg-orange-500/10 border-orange-500' :
                            'bg-green-500/10 border-green-500'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase">
                              {section.stage === 'problem' ? '❌ PROBLEMA' :
                               section.stage === 'agitate' ? '🔥 AGITAR' : '✅ SOLUÇÃO'}
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: section.emotionalIntensity }).map((_, i) => (
                                <span key={i} className="text-orange-500 text-xs">●</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm">{section.content}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.techniques.map(tech => (
                              <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
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

          {/* 4Ps TAB */}
          <TabsContent value="4ps" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                4Ps (Promise → Picture → Proof → Push)
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Promessa forte, visualização do futuro, prova social, empurrão final
              </p>
              
              <ScrollArea className="h-[400px]">
                {fourPsTemplates.map((template) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge variant="outline">{template.channel}</Badge>
                    </div>

                    <div className="space-y-3">
                      {template.sections.map((section) => (
                        <div 
                          key={section.stage}
                          className={cn(
                            "rounded p-3 border-l-4",
                            section.stage === 'promise' ? 'bg-purple-500/10 border-purple-500' :
                            section.stage === 'picture' ? 'bg-blue-500/10 border-blue-500' :
                            section.stage === 'proof' ? 'bg-emerald-500/10 border-emerald-500' :
                            'bg-red-500/10 border-red-500'
                          )}
                        >
                          <span className="text-xs font-medium uppercase block mb-1">
                            {section.stage === 'promise' ? '🎯 PROMESSA' :
                             section.stage === 'picture' ? '💭 PINTURA' :
                             section.stage === 'proof' ? '✅ PROVA' : '👉 EMPURRÃO'}
                          </span>
                          <p className="text-sm">{section.content}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.powerWords.slice(0, 4).map(word => (
                              <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">Ideal para:</span>
                      {template.bestFor.map(use => (
                        <Badge key={use} variant="outline" className="text-xs">{use}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* STORYTELLING TAB */}
          <TabsContent value="story" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Estruturas de Storytelling
              </h4>
              
              <ScrollArea className="h-[400px]">
                {storytellingTemplates.map((template) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge className="bg-primary/20 text-primary">{template.arc.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                    <div className="space-y-2 mb-3">
                      {template.elements.map((element, idx) => (
                        <div 
                          key={element.id}
                          className={cn(
                            "rounded p-2 flex items-start gap-2",
                            template.emotionalPeaks.includes(element.name) 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'bg-muted/50'
                          )}
                        >
                          <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium">{element.name}</span>
                            {template.emotionalPeaks.includes(element.name) && (
                              <Badge className="ml-2 text-xs bg-primary">Pico Emocional</Badge>
                            )}
                            <p className="text-xs text-muted-foreground">{element.description}</p>
                            <p className="text-xs italic text-primary mt-1">"{element.example}"</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted rounded p-3">
                      <span className="text-xs font-medium">Exemplo Completo:</span>
                      <p className="text-sm mt-1">{template.example}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.bestFor.map(use => (
                          <Badge key={use} variant="outline" className="text-xs">{use}</Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(template.example, template.id)}
                      >
                        {copiedId === template.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* MULTI-CHANNEL PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Texto para Preview:</label>
                <Textarea
                  placeholder="Cole seu texto para ver como fica em cada canal..."
                  value={analyzeText}
                  onChange={(e) => setAnalyzeText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {channelPreviews.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelPreviews.slice(0, 5).map((preview) => (
                    <div 
                      key={preview.channel}
                      className="bg-background rounded-lg border overflow-hidden"
                    >
                      <div className="bg-muted px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {preview.channel === 'whatsapp' && <Smartphone className="h-4 w-4 text-green-500" />}
                          {preview.channel === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                          {preview.channel === 'instagram' && <Smartphone className="h-4 w-4 text-pink-500" />}
                          {preview.channel === 'linkedin' && <Smartphone className="h-4 w-4 text-blue-600" />}
                          {preview.channel === 'sms' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                          <span className="font-medium capitalize">{preview.channel}</span>
                        </div>
                        <Badge variant={preview.isWithinLimit ? 'secondary' : 'destructive'} className="text-xs">
                          {preview.characterCount}{preview.characterLimit ? `/${preview.characterLimit}` : ''}
                        </Badge>
                      </div>
                      
                      <div 
                        className="p-3"
                        style={{
                          backgroundColor: preview.preview.backgroundColor || 'transparent'
                        }}
                      >
                        {preview.channel === 'whatsapp' ? (
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[250px] ml-auto">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {preview.formattedText.substring(0, 200)}
                              {preview.formattedText.length > 200 && '...'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {preview.formattedText.substring(0, 200)}
                            {preview.formattedText.length > 200 && '...'}
                          </p>
                        )}
                      </div>

                      {preview.suggestions.length > 0 && (
                        <div className="px-3 py-2 bg-yellow-500/10 text-xs">
                          {preview.suggestions.map((s, i) => (
                            <p key={i} className="text-yellow-700">⚠️ {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* EMOJI TAB */}
          <TabsContent value="emoji" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Smile className="h-4 w-4 text-primary" />
                Emoji Intelligence
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Emojis contextuais adaptados ao perfil {discProfile}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {emojiContexts.map((context) => {
                  const discScore = context.discCompatibility[discProfile as keyof typeof context.discCompatibility];
                  const isRecommended = discScore >= 70;
                  
                  return (
                    <div 
                      key={context.category}
                      className={cn(
                        "bg-background rounded-lg p-3 border",
                        isRecommended && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{context.category}</span>
                        {isRecommended && (
                          <Badge className="bg-green-500 text-xs">Recomendado</Badge>
                        )}
                      </div>
                      <div className="text-2xl mb-2 flex gap-1 flex-wrap">
                        {context.emojis.map((emoji, i) => (
                          <span 
                            key={i}
                            className="cursor-pointer hover:scale-125 transition-transform"
                            onClick={() => copyToClipboard(emoji, `emoji-${context.category}-${i}`)}
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{context.usage}</p>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className={discScore >= 70 ? 'text-green-600' : 'text-muted-foreground'}>
                          DISC: {discScore}%
                        </span>
                        <span className="text-muted-foreground">
                          WA: {context.channelCompatibility.whatsapp}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {emojiSuggestions.length > 0 && analyzeText && (
                <div className="mt-4 bg-background rounded-lg p-4 border">
                  <h5 className="font-medium mb-2">Sugestões para seu texto:</h5>
                  <div className="flex flex-wrap gap-2">
                    {emojiSuggestions.map((suggestion, idx) => (
                      <Badge 
                        key={idx}
                        variant="secondary"
                        className={cn(
                          "cursor-pointer",
                          suggestion.impact === 'high' && 'bg-green-500/20'
                        )}
                        onClick={() => copyToClipboard(suggestion.emoji, `sugg-${idx}`)}
                      >
                        {suggestion.emoji} {suggestion.position} - {suggestion.context}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* FAB TAB */}
          <TabsContent value="fab" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Estrutura FAB (Feature → Advantage → Benefit)
              </h4>
              
              <ScrollArea className="h-[300px]">
                {fabTemplates.map((template) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-blue-500/10 rounded p-3">
                        <span className="text-xs font-medium text-blue-600">FEATURE</span>
                        <p className="text-sm mt-1">{template.example.feature}</p>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-amber-500/10 rounded p-3">
                        <span className="text-xs font-medium text-amber-600">ADVANTAGE</span>
                        <p className="text-sm mt-1">{template.example.advantage}</p>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-green-500/10 rounded p-3">
                        <span className="text-xs font-medium text-green-600">BENEFIT</span>
                        <p className="text-sm mt-1">{template.example.benefit}</p>
                        {template.example.emotionalHook && (
                          <Badge className="mt-2 bg-green-600">{template.example.emotionalHook}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* AIDA TAB */}
          <TabsContent value="aida" className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Estrutura AIDA
              </h4>
              
              <ScrollArea className="h-[350px]">
                {aidaTemplates.map((template) => (
                  <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge>{template.channel}</Badge>
                    </div>

                    <div className="space-y-2">
                      {template.sections.map((section) => (
                        <div 
                          key={section.stage}
                          className={cn(
                            "rounded p-3 border-l-4",
                            section.stage === 'attention' ? 'bg-red-500/10 border-red-500' :
                            section.stage === 'interest' ? 'bg-amber-500/10 border-amber-500' :
                            section.stage === 'desire' ? 'bg-blue-500/10 border-blue-500' :
                            'bg-green-500/10 border-green-500'
                          )}
                        >
                          <span className="text-xs font-medium uppercase">
                            {section.stage.toUpperCase()}
                          </span>
                          <p className="text-sm mt-1">{section.content}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => copyToClipboard(
                        template.sections.map(s => s.content).join('\n\n'),
                        template.id
                      )}
                    >
                      {copiedId === template.id ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copiar Script
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* CTA TAB */}
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
                        <Badge className={cn(
                          cta.type === 'primary' && 'bg-primary',
                          cta.type === 'urgent' && 'bg-red-500',
                          cta.type === 'soft' && 'bg-blue-500',
                          cta.type === 'exclusive' && 'bg-purple-500',
                          cta.type === 'social' && 'bg-pink-500',
                          cta.type === 'guarantee' && 'bg-green-500'
                        )}>
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
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => copyToClipboard(cta.example, cta.id)}
                      >
                        {copiedId === cta.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* HEADLINES TAB */}
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
                        {Array.from({ length: formula.effectiveness }).map((_, i) => (
                          <span key={i} className="text-amber-500 text-xs">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="font-mono text-sm bg-muted p-2 rounded mb-2">{formula.formula}</p>
                    <p className="text-sm text-primary italic">"{formula.example}"</p>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={() => copyToClipboard(formula.example, formula.id)}
                    >
                      {copiedId === formula.id ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copiar
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
