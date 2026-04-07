import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyCTATabProps {
  discProfile: string;
  recommendedCTAs: any[];
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

export default function CopyCTATab({ discProfile, recommendedCTAs, copiedId, copyToClipboard }: CopyCTATabProps) {
  return (
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
                  cta.type === 'urgent' && 'bg-destructive',
                  cta.type === 'soft' && 'bg-info',
                  cta.type === 'exclusive' && 'bg-secondary',
                  cta.type === 'social' && 'bg-primary',
                  cta.type === 'guarantee' && 'bg-success'
                )}>
                  {cta.type.toUpperCase()}
                </Badge>
                <div className="flex gap-1">
                  {Array.from({ length: cta.urgencyLevel }).map((_, i) => (
                    <Zap key={i} className="h-3 w-3 text-warning fill-warning" />
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
  );
}
