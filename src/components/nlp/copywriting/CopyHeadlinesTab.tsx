import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Quote, Copy, CheckCircle } from 'lucide-react';

interface CopyHeadlinesTabProps {
  headlineFormulas: any[];
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

export default function CopyHeadlinesTab({ headlineFormulas, copiedId, copyToClipboard }: CopyHeadlinesTabProps) {
  return (
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
                  <span key={i} className="text-warning text-xs">★</span>
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
  );
}
