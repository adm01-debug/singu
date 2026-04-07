import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle, AlertTriangle, Target, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyTemplateTabProps {
  type: 'pas' | '4ps' | 'aida';
  templates: any[];
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

const tabConfig = {
  pas: {
    icon: AlertTriangle,
    title: 'PAS (Problem → Agitate → Solution)',
    description: 'Identifique o problema, agite a dor, apresente a solução',
    stageLabels: { problem: '❌ PROBLEMA', agitate: '🔥 AGITAR', solution: '✅ SOLUÇÃO' },
    stageColors: {
      problem: 'bg-destructive/10 border-destructive',
      agitate: 'bg-accent/10 border-accent/30',
      solution: 'bg-success/10 border-success',
    },
  },
  '4ps': {
    icon: Target,
    title: '4Ps (Promise → Picture → Proof → Push)',
    description: 'Promessa forte, visualização do futuro, prova social, empurrão final',
    stageLabels: { promise: '🎯 PROMESSA', picture: '💭 PINTURA', proof: '✅ PROVA', push: '👉 EMPURRÃO' },
    stageColors: {
      promise: 'bg-secondary/10 border-secondary',
      picture: 'bg-info/10 border-info',
      proof: 'bg-success/10 border-success/30',
      push: 'bg-destructive/10 border-destructive',
    },
  },
  aida: {
    icon: Sparkles,
    title: 'Estrutura AIDA',
    description: '',
    stageLabels: { attention: 'ATTENTION', interest: 'INTEREST', desire: 'DESIRE', action: 'ACTION' },
    stageColors: {
      attention: 'bg-destructive/10 border-destructive',
      interest: 'bg-warning/10 border-warning/30',
      desire: 'bg-info/10 border-info',
      action: 'bg-success/10 border-success',
    },
  },
};

export default function CopyTemplateTab({ type, templates, copiedId, copyToClipboard }: CopyTemplateTabProps) {
  const config = tabConfig[type];
  const Icon = config.icon;

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {config.title}
      </h4>
      {config.description && (
        <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
      )}

      <ScrollArea className="h-[400px]">
        {templates.map((template) => (
          <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">{template.name}</h5>
              <div className="flex gap-2">
                <Badge variant="outline">{template.channel}</Badge>
                {template.targetProfile?.disc && <Badge>DISC: {template.targetProfile.disc}</Badge>}
              </div>
            </div>

            <div className="space-y-3">
              {template.sections.map((section: any) => (
                <div
                  key={section.stage}
                  className={cn(
                    "rounded p-3 border-l-4",
                    (config.stageColors as any)[section.stage] || 'bg-muted'
                  )}
                >
                  <span className="text-xs font-medium uppercase block mb-1">
                    {(config.stageLabels as any)[section.stage] || section.stage.toUpperCase()}
                  </span>
                  <p className="text-sm">{section.content}</p>
                  {section.techniques && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {section.techniques.map((tech: string) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  )}
                  {section.powerWords && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {section.powerWords.slice(0, 4).map((word: string) => (
                        <Badge key={word} variant="secondary" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              {template.estimatedConversion && (
                <span className="text-xs text-muted-foreground">
                  Conversão estimada: {template.estimatedConversion}%
                </span>
              )}
              {template.bestFor && (
                <div className="flex flex-wrap gap-1">
                  {template.bestFor.map((use: string) => (
                    <Badge key={use} variant="outline" className="text-xs">{use}</Badge>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(
                  template.sections.map((s: any) => s.content).join('\n\n'),
                  template.id
                )}
              >
                {copiedId === template.id ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copiar Script
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
