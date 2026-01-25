import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Users, 
  Telescope,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';

interface PositionAnalysis {
  position: 'first' | 'second' | 'third';
  perspective: string;
  insights: string[];
  blindSpots: string[];
  actions: string[];
}

interface PerceptualPositionsProps {
  contact: Contact;
  situation?: string;
  className?: string;
}

const POSITION_INFO = {
  first: {
    title: '1ª Posição - EU',
    subtitle: 'Sua perspectiva como vendedor',
    icon: <Eye className="h-5 w-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    questions: [
      'O que EU quero desta interação?',
      'Como EU me sinto sobre esta situação?',
      'Quais são MEUS objetivos e limites?',
      'O que EU preciso comunicar?'
    ]
  },
  second: {
    title: '2ª Posição - OUTRO',
    subtitle: `Perspectiva do cliente`,
    icon: <Users className="h-5 w-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    questions: [
      'O que o CLIENTE realmente quer?',
      'Como o CLIENTE se sente agora?',
      'Quais são os MEDOS do cliente?',
      'O que o CLIENTE precisa ouvir?'
    ]
  },
  third: {
    title: '3ª Posição - OBSERVADOR',
    subtitle: 'Visão externa e neutra',
    icon: <Telescope className="h-5 w-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    questions: [
      'O que um observador neutro veria?',
      'Qual padrão está se repetindo?',
      'O que nenhum dos dois está percebendo?',
      'Qual seria o conselho de um mentor?'
    ]
  }
};

const PerceptualPositions: React.FC<PerceptualPositionsProps> = ({
  contact,
  situation = '',
  className
}) => {
  const [currentPosition, setCurrentPosition] = useState<'first' | 'second' | 'third'>('first');
  const [analyses, setAnalyses] = useState<Record<string, PositionAnalysis>>({});
  const [currentNotes, setCurrentNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const saveAnalysis = () => {
    if (!currentNotes.trim()) return;

    const analysis: PositionAnalysis = {
      position: currentPosition,
      perspective: currentNotes,
      insights: extractInsights(currentNotes),
      blindSpots: extractBlindSpots(currentNotes, currentPosition),
      actions: extractActions(currentNotes)
    };

    setAnalyses(prev => ({
      ...prev,
      [currentPosition]: analysis
    }));
    setCurrentNotes('');
  };

  const extractInsights = (text: string): string[] => {
    const insights: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      if (/perceb|entend|not|importante|essencial|chave/i.test(sentence)) {
        insights.push(sentence.trim());
      }
    });

    return insights.slice(0, 3);
  };

  const extractBlindSpots = (text: string, position: string): string[] => {
    const blindSpots: string[] = [];
    
    if (position === 'first') {
      if (!/cliente|ele|ela|outro/i.test(text)) {
        blindSpots.push('Pode estar focando demais em si mesmo');
      }
    } else if (position === 'second') {
      if (!/eu|meu|minha|vendedor/i.test(text)) {
        blindSpots.push('Pode estar ignorando seus próprios limites');
      }
    } else {
      if (!/ambos|dois|relação/i.test(text)) {
        blindSpots.push('Pode estar favorecendo um lado');
      }
    }

    return blindSpots;
  };

  const extractActions = (text: string): string[] => {
    const actions: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (/dev|precis|fazer|agir|próximo|ação/i.test(sentence)) {
        actions.push(sentence.trim());
      }
    });

    return actions.slice(0, 2);
  };

  const generateIntegration = () => {
    if (Object.keys(analyses).length < 2) return null;

    const integration = {
      commonGround: 'Ambos querem uma solução que funcione',
      keyTension: analyses.first && analyses.second ? 
        'Equilibrar suas metas com as necessidades do cliente' : '',
      strategicAction: 'Use a perspectiva de observador para mediar',
      communicationShift: `Adapte sua comunicação para ${contact.firstName} baseado na 2ª posição`
    };

    return integration;
  };

  const positionInfo = POSITION_INFO[currentPosition];
  const integration = generateIntegration();

  return (
    <Card className={cn("border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-background", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-violet-400" />
            Posições Perceptuais
          </CardTitle>
          <Badge variant="outline" className="bg-violet-500/20">
            {Object.keys(analyses).length}/3 Analisadas
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Analise a comunicação sob 3 perspectivas: EU, {contact.firstName.toUpperCase()}, OBSERVADOR
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['first', 'second', 'third'] as const).map(pos => {
            const info = POSITION_INFO[pos];
            const hasAnalysis = analyses[pos];
            
            return (
              <button
                key={pos}
                onClick={() => setCurrentPosition(pos)}
                className={cn(
                  "p-3 rounded-lg border transition-all text-center",
                  currentPosition === pos ? `${info.bgColor} ${info.borderColor}` : 'bg-muted/30 border-transparent',
                  hasAnalysis && currentPosition !== pos && 'ring-2 ring-green-500/50'
                )}
              >
                <div className={cn("flex justify-center mb-1", info.color)}>
                  {info.icon}
                </div>
                <div className="text-xs font-medium">
                  {pos === 'first' ? 'EU' : pos === 'second' ? contact.firstName : 'Observador'}
                </div>
                {hasAnalysis && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Current Position Analysis */}
        <motion.div
          key={currentPosition}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn("rounded-lg p-4 border", positionInfo.bgColor, positionInfo.borderColor)}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={positionInfo.color}>{positionInfo.icon}</span>
            <div>
              <h4 className="font-medium text-sm">{positionInfo.title}</h4>
              <p className="text-xs text-muted-foreground">
                {currentPosition === 'second' 
                  ? `Perspectiva de ${contact.firstName}` 
                  : positionInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Guiding Questions */}
          <div className="space-y-1 mb-3">
            <div className="text-xs font-medium text-muted-foreground">Perguntas Guia:</div>
            {positionInfo.questions.map((q, idx) => (
              <div key={idx} className="text-xs flex items-start gap-1">
                <span className={positionInfo.color}>•</span>
                <span>{q.replace('CLIENTE', contact.firstName)}</span>
              </div>
            ))}
          </div>

          {/* Notes Input */}
          <Textarea
            placeholder={`O que você percebe a partir da ${positionInfo.title.toLowerCase()}?`}
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            className="min-h-[80px] text-sm bg-background/50"
          />

          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={saveAnalysis}
            disabled={!currentNotes.trim()}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Salvar Análise
          </Button>
        </motion.div>

        {/* Saved Analyses */}
        {Object.keys(analyses).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Insights por Posição
            </h4>
            
            {Object.entries(analyses).map(([pos, analysis]) => {
              const info = POSITION_INFO[pos as keyof typeof POSITION_INFO];
              return (
                <div key={pos} className="bg-muted/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={info.color}>{info.icon}</span>
                    <span className="font-medium text-xs">{info.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{analysis.perspective}</p>
                  
                  {analysis.insights.length > 0 && (
                    <div className="space-y-1">
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className="text-xs flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {analysis.blindSpots.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {analysis.blindSpots.map((spot, idx) => (
                        <div key={idx} className="text-xs flex items-start gap-1 text-yellow-400">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{spot}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Integration Summary */}
        {integration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg p-4 border border-violet-500/30"
          >
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-violet-400" />
              Síntese Integrativa
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 text-green-400 mt-1 shrink-0" />
                <div>
                  <span className="text-green-400 font-medium">Terreno Comum:</span>
                  <span className="text-muted-foreground ml-1">{integration.commonGround}</span>
                </div>
              </div>
              
              {integration.keyTension && (
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-yellow-400 font-medium">Tensão Chave:</span>
                    <span className="text-muted-foreground ml-1">{integration.keyTension}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 text-violet-400 mt-1 shrink-0" />
                <div>
                  <span className="text-violet-400 font-medium">Ação Estratégica:</span>
                  <span className="text-muted-foreground ml-1">{integration.strategicAction}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 text-blue-400 mt-1 shrink-0" />
                <div>
                  <span className="text-blue-400 font-medium">Mudança de Comunicação:</span>
                  <span className="text-muted-foreground ml-1">{integration.communicationShift}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerceptualPositions;
