import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyEmojiTabProps {
  discProfile: string;
  emojiContexts: any[];
  emojiSuggestions: any[];
  analyzeText: string;
  copyToClipboard: (text: string, id: string) => void;
}

export default function CopyEmojiTab({
  discProfile, emojiContexts, emojiSuggestions, analyzeText, copyToClipboard
}: CopyEmojiTabProps) {
  return (
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
                {isRecommended && <Badge className="bg-success text-xs">Recomendado</Badge>}
              </div>
              <div className="text-2xl mb-2 flex gap-1 flex-wrap">
                {context.emojis.map((emoji: string, i: number) => (
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
                <span className={discScore >= 70 ? 'text-success' : 'text-muted-foreground'}>
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
            {emojiSuggestions.map((suggestion: any, idx: number) => (
              <Badge
                key={idx}
                variant="secondary"
                className={cn("cursor-pointer", suggestion.impact === 'high' && 'bg-success/20')}
                onClick={() => copyToClipboard(suggestion.emoji, `sugg-${idx}`)}
              >
                {suggestion.emoji} {suggestion.position} - {suggestion.context}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
