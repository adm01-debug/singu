import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Mail, MessageSquare } from 'lucide-react';

interface CopyChannelPreviewTabProps {
  analyzeText: string;
  setAnalyzeText: (text: string) => void;
  channelPreviews: any[];
}

export default function CopyChannelPreviewTab({
  analyzeText, setAnalyzeText, channelPreviews
}: CopyChannelPreviewTabProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <Smartphone className="h-4 w-4 text-success" />;
      case 'email': return <Mail className="h-4 w-4 text-info" />;
      case 'instagram': return <Smartphone className="h-4 w-4 text-primary" />;
      case 'linkedin': return <Smartphone className="h-4 w-4 text-info" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Texto para Preview:</label>
        <Textarea
          placeholder="Cole seu texto para ver como fica em cada canal..."
          value={analyzeText}
          onChange={(e) => setAnalyzeText(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {channelPreviews.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelPreviews.slice(0, 5).map((preview) => (
            <div key={preview.channel} className="bg-background rounded-lg border overflow-hidden">
              <div className="bg-muted px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChannelIcon(preview.channel)}
                  <span className="font-medium capitalize">{preview.channel}</span>
                </div>
                <Badge variant={preview.isWithinLimit ? 'secondary' : 'destructive'} className="text-xs">
                  {preview.characterCount}{preview.characterLimit ? `/${preview.characterLimit}` : ''}
                </Badge>
              </div>

              <div className="p-3" style={{ backgroundColor: preview.preview.backgroundColor || 'transparent' }}>
                {preview.channel === 'whatsapp' ? (
                  <div className="bg-card rounded-lg p-3 shadow-sm max-w-[250px] ml-auto">
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
                  {preview.suggestions.map((s: string, i: number) => (
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
