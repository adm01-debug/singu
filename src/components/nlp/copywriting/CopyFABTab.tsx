import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, ArrowRight } from 'lucide-react';

interface CopyFABTabProps {
  fabTemplates: any[];
}

export default function CopyFABTab({ fabTemplates }: CopyFABTabProps) {
  return (
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
              <div className="bg-info/10 rounded p-3">
                <span className="text-xs font-medium text-info">FEATURE</span>
                <p className="text-sm mt-1">{template.example.feature}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-warning/10 rounded p-3">
                <span className="text-xs font-medium text-warning">ADVANTAGE</span>
                <p className="text-sm mt-1">{template.example.advantage}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-success/10 rounded p-3">
                <span className="text-xs font-medium text-success">BENEFIT</span>
                <p className="text-sm mt-1">{template.example.benefit}</p>
                {template.example.emotionalHook && (
                  <Badge className="mt-2 bg-success">{template.example.emotionalHook}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
