import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Mail, MessageSquare } from 'lucide-react';

interface ChannelPreview {
  channel: string;
  formattedText: string;
  characterCount: number;
  characterLimit?: number;
  isWithinLimit: boolean;
  suggestions: string[];
  preview: { backgroundColor?: string };
}

interface Props {
  analyzeText: string;
  onTextChange: (text: string) => void;
  channelPreviews: ChannelPreview[];
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <Smartphone className="h-4 w-4 text-success" />,
  email: <Mail className="h-4 w-4 text-info" />,
  instagram: <Smartphone className="h-4 w-4 text-primary" />,
  linkedin: <Smartphone className="h-4 w-4 text-info" />,
  sms: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
};

export function CopywritingPreviewTab({ analyzeText, onTextChange, channelPreviews }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Texto para Preview:</label>
        <Textarea
          placeholder="Cole seu texto para ver como fica em cada canal..."
          value={analyzeText}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {channelPreviews.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelPreviews.slice(0, 5).map((preview) => (
            <div key={preview.channel} className="bg-background rounded-lg border overflow-hidden">
              <div className="bg-muted px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {channelIcons[preview.channel] || <MessageSquare className="h-4 w-4" />}
                  <span className="font-medium capitalize">{preview.channel}</span>
                </div>
                <Badge variant={preview.isWithinLimit ? 'secondary' : 'destructive'} className="text-xs">
                  {preview.characterCount}{preview.characterLimit ? `/${preview.characterLimit}` : ''}
                </Badge>
              </div>

              <div
                className="p-3"
                style={{ backgroundColor: preview.preview.backgroundColor || 'transparent' }}
              >
                {preview.channel === 'whatsapp' ? (
                  <div className="bg-card rounded-lg p-3 max-w-[250px] ml-auto">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                <div className="px-3 py-2 bg-warning/10 text-xs">
                  {preview.suggestions.map((s, i) => (
                    <p key={i} className="text-warning">⚠️ {s}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
