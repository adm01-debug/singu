// ==============================================
// COPYWRITING SALES TOOLS - Refactored Orchestrator
// Enterprise-grade copywriting panel with modular tabs
// ==============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, AlertTriangle, Target, BookOpen, Eye,
  LayoutList, ArrowRight, Zap, Smile, Quote, PenTool
} from 'lucide-react';
import { Contact } from '@/types';
import { useCopywritingTools } from '@/hooks/useCopywritingTools';
import { useCopywritingAdvanced } from '@/hooks/useCopywritingAdvanced';
import { DEMO_CONTACT } from '@/lib/demo-contact';
import { toast } from 'sonner';

import CopyAnalyzerTab from './copywriting/CopyAnalyzerTab';
import CopyTemplateTab from './copywriting/CopyTemplateTab';
import CopyStorytellingTab from './copywriting/CopyStorytellingTab';
import CopyChannelPreviewTab from './copywriting/CopyChannelPreviewTab';
import CopyEmojiTab from './copywriting/CopyEmojiTab';
import CopyFABTab from './copywriting/CopyFABTab';
import CopyCTATab from './copywriting/CopyCTATab';
import CopyHeadlinesTab from './copywriting/CopyHeadlinesTab';

interface CopywritingSalesToolsProps {
  contact?: Contact;
}

export default function CopywritingSalesTools({ contact }: CopywritingSalesToolsProps) {
  const safeContact = contact || DEMO_CONTACT as unknown as Contact;
  const [activeTab, setActiveTab] = useState('analyzer');
  const [analyzeText, setAnalyzeText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const {
    fabTemplates, aidaTemplates, ctaTemplates, getRecommendedCTAs,
    headlineFormulas, discProfile, vakType
  } = useCopywritingTools(safeContact);

  const {
    analyzeCopy, pasTemplates, fourPsTemplates,
    storytellingTemplates, emojiContexts, getEmojiSuggestions,
    generateChannelPreviews
  } = useCopywritingAdvanced(safeContact);

  const recommendedCTAs = useMemo(() => getRecommendedCTAs(3), [getRecommendedCTAs]);

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
    if (score >= 60) return 'text-success';
    if (score >= 20) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 60) return 'bg-success';
    if (score >= 20) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5 text-primary" />
          Copywriting Sales Tools
          <Badge variant="secondary" className="ml-2">{discProfile} | {vakType}</Badge>
          <Badge className="bg-primary/20 text-primary">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 mb-4 h-auto flex-wrap">
            <TabsTrigger value="analyzer" className="text-xs px-2 py-1.5">
              <BarChart3 className="h-3 w-3 mr-1" />Analisador
            </TabsTrigger>
            <TabsTrigger value="pas" className="text-xs px-2 py-1.5">
              <AlertTriangle className="h-3 w-3 mr-1" />PAS
            </TabsTrigger>
            <TabsTrigger value="4ps" className="text-xs px-2 py-1.5">
              <Target className="h-3 w-3 mr-1" />4Ps
            </TabsTrigger>
            <TabsTrigger value="story" className="text-xs px-2 py-1.5">
              <BookOpen className="h-3 w-3 mr-1" />Story
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-1.5">
              <Eye className="h-3 w-3 mr-1" />Preview
            </TabsTrigger>
            <TabsTrigger value="fab" className="text-xs px-2 py-1.5">
              <LayoutList className="h-3 w-3 mr-1" />FAB
            </TabsTrigger>
            <TabsTrigger value="aida" className="text-xs px-2 py-1.5">
              <ArrowRight className="h-3 w-3 mr-1" />AIDA
            </TabsTrigger>
            <TabsTrigger value="cta" className="text-xs px-2 py-1.5">
              <Zap className="h-3 w-3 mr-1" />CTAs
            </TabsTrigger>
            <TabsTrigger value="emoji" className="text-xs px-2 py-1.5">
              <Smile className="h-3 w-3 mr-1" />Emoji
            </TabsTrigger>
            <TabsTrigger value="headlines" className="text-xs px-2 py-1.5">
              <Quote className="h-3 w-3 mr-1" />Headlines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="space-y-4">
            <CopyAnalyzerTab
              analyzeText={analyzeText}
              setAnalyzeText={setAnalyzeText}
              analysisResult={analysisResult}
              getScoreColor={getScoreColor}
              getScoreBg={getScoreBg}
            />
          </TabsContent>

          <TabsContent value="pas" className="space-y-4">
            <CopyTemplateTab type="pas" templates={pasTemplates} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>

          <TabsContent value="4ps" className="space-y-4">
            <CopyTemplateTab type="4ps" templates={fourPsTemplates} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>

          <TabsContent value="story" className="space-y-4">
            <CopyStorytellingTab storytellingTemplates={storytellingTemplates} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <CopyChannelPreviewTab analyzeText={analyzeText} setAnalyzeText={setAnalyzeText} channelPreviews={channelPreviews} />
          </TabsContent>

          <TabsContent value="emoji" className="space-y-4">
            <CopyEmojiTab
              discProfile={discProfile}
              emojiContexts={emojiContexts}
              emojiSuggestions={emojiSuggestions}
              analyzeText={analyzeText}
              copyToClipboard={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="fab" className="space-y-4">
            <CopyFABTab fabTemplates={fabTemplates} />
          </TabsContent>

          <TabsContent value="aida" className="space-y-4">
            <CopyTemplateTab type="aida" templates={aidaTemplates} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>

          <TabsContent value="cta" className="space-y-4">
            <CopyCTATab discProfile={discProfile} recommendedCTAs={recommendedCTAs} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>

          <TabsContent value="headlines" className="space-y-4">
            <CopyHeadlinesTab headlineFormulas={headlineFormulas} copiedId={copiedId} copyToClipboard={copyToClipboard} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
