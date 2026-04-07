import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyStorytellingTabProps {
  storytellingTemplates: any[];
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

export default function CopyStorytellingTab({ storytellingTemplates, copiedId, copyToClipboard }: CopyStorytellingTabProps) {
  return (
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
              {template.elements.map((element: any, idx: number) => (
                <div
                  key={element.id}
                  className={cn(
                    "rounded p-2 flex items-start gap-2",
                    template.emotionalPeaks.includes(element.name)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/50'
                  )}
                >
                  <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">{idx + 1}</span>
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
                {template.bestFor.map((use: string) => (
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
  );
}
