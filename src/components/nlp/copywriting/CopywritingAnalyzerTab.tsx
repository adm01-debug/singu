import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  persuasionScore: number;
  clarityScore: number;
  emotionalScore: number;
  ctaStrength: number;
  readability: {
    fleschScore: number;
    level: string;
    recommendation: string;
    avgSentenceLength: number;
    avgWordLength: number;
    complexWordPercentage: number;
  };
  triggerDensity: {
    saturationLevel: string;
    triggersPerSentence: number;
    recommendation: string;
    dominantTriggers: string[];
    missingTriggers: string[];
  };
  issues: Array<{ issue: string; suggestion: string; severity: string }>;
  strengths: string[];
}

interface Props {
  analyzeText: string;
  onTextChange: (text: string) => void;
  analysisResult: AnalysisResult | null;
}

function getScoreColor(score: number) {
  if (score >= 60) return 'text-success';
  if (score >= 20) return 'text-warning';
  return 'text-destructive';
}

export function CopywritingAnalyzerTab({ analyzeText, onTextChange, analysisResult }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Cole seu texto para análise:</label>
        <Textarea
          placeholder="Cole aqui o texto que deseja analisar (mínimo 20 caracteres)..."
          value={analyzeText}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">{analyzeText.length} caracteres</p>
      </div>

      {analysisResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Persuasão', score: analysisResult.persuasionScore },
              { label: 'Clareza', score: analysisResult.clarityScore },
              { label: 'Emocional', score: analysisResult.emotionalScore },
              { label: 'CTA', score: analysisResult.ctaStrength },
            ].map(({ label, score }) => (
              <div key={label} className="bg-muted/50 rounded-lg p-3 text-center">
                <span className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</span>
                <p className="text-xs text-muted-foreground">{label}</p>
                <Progress value={score} className="h-1 mt-1" />
              </div>
            ))}
          </div>

          {/* Readability */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Legibilidade (Flesch PT-BR)
            </h4>
            <div className="flex items-center gap-4">
              <div className={cn("text-3xl font-bold", getScoreColor(analysisResult.readability.fleschScore))}>
                {analysisResult.readability.fleschScore}
              </div>
              <div>
                <Badge className={cn(
                  analysisResult.readability.level === 'muito_facil' || analysisResult.readability.level === 'facil' ? 'bg-success' :
                  analysisResult.readability.level === 'medio' ? 'bg-warning' :
                  analysisResult.readability.level === 'dificil' ? 'bg-accent' : 'bg-destructive'
                )}>
                  {analysisResult.readability.level.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{analysisResult.readability.recommendation}</p>
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
                analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'bg-success' :
                analysisResult.triggerDensity.saturationLevel === 'low' ? 'bg-warning' : 'bg-destructive'
              )}>
                {analysisResult.triggerDensity.saturationLevel === 'optimal' ? 'ÓTIMO' :
                 analysisResult.triggerDensity.saturationLevel === 'low' ? 'BAIXO' : 'ALTO'}
              </Badge>
              <span className="text-sm">{analysisResult.triggerDensity.triggersPerSentence} gatilhos/frase</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{analysisResult.triggerDensity.recommendation}</p>
            {analysisResult.triggerDensity.dominantTriggers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-muted-foreground">Presentes:</span>
                {analysisResult.triggerDensity.dominantTriggers.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs bg-success/20 text-success">{t}</Badge>
                ))}
              </div>
            )}
            {analysisResult.triggerDensity.missingTriggers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Faltando:</span>
                {analysisResult.triggerDensity.missingTriggers.slice(0, 4).map(t => (
                  <Badge key={t} variant="outline" className="text-xs border-destructive/30 text-destructive">{t}</Badge>
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
                        issue.severity === 'high' ? 'text-destructive' : 'text-warning'
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
              <div className="bg-success/10 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Pontos Fortes
                </h4>
                <ul className="space-y-1">
                  {analysisResult.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
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
  );
}
