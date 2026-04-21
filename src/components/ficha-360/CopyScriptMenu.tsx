import { memo, useMemo, useState } from 'react';
import { Copy, ChevronDown, MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  generateScripts,
  type ScriptChannel,
  type ScriptContext,
  type GeneratedScript,
} from '@/lib/scriptGenerator';

interface Props {
  passoId: string;
  firstName: string;
  sentiment: ScriptContext['sentiment'];
  bestTime?: string | null;
  daysSinceLast?: number | null;
  cadenceDays?: number | null;
  fallbackScript?: string;
}

const channelMeta: Record<ScriptChannel, { label: string; icon: typeof Mail }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'E-mail', icon: Mail },
  call: { label: 'Ligação', icon: Phone },
};

function CopyScriptMenuComponent({
  passoId,
  firstName,
  sentiment,
  bestTime,
  daysSinceLast,
  cadenceDays,
  fallbackScript,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ScriptChannel>('whatsapp');

  const scripts = useMemo<GeneratedScript[]>(() => {
    const list = generateScripts({
      passoId,
      firstName,
      sentiment,
      bestTime,
      daysSinceLast,
      cadenceDays,
    });
    if (list.length === 0 && fallbackScript) {
      return [{ channel: 'whatsapp', body: fallbackScript, toneLabel: 'Cordial' }];
    }
    return list;
  }, [passoId, firstName, sentiment, bestTime, daysSinceLast, cadenceDays, fallbackScript]);

  const byChannel = useMemo(() => {
    const map: Partial<Record<ScriptChannel, GeneratedScript>> = {};
    for (const s of scripts) map[s.channel] = s;
    return map;
  }, [scripts]);

  const copy = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Script de ${label} copiado`);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="ghost">
          <Copy className="h-3 w-3" />
          Copiar script
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-3" align="start">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ScriptChannel)}>
          <TabsList className="grid w-full grid-cols-3 min-h-9 p-1">
            {(Object.keys(channelMeta) as ScriptChannel[]).map((c) => {
              const Icon = channelMeta[c].icon;
              return (
                <TabsTrigger key={c} value={c} className="text-xs min-h-7 px-2">
                  <Icon className="h-3 w-3 mr-1" />
                  {channelMeta[c].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(channelMeta) as ScriptChannel[]).map((c) => {
            const s = byChannel[c];
            const Icon = channelMeta[c].icon;
            return (
              <TabsContent key={c} value={c} className="space-y-2 mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    <Icon className="h-2.5 w-2.5 mr-1" />
                    {channelMeta[c].label}
                  </Badge>
                  {s && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/30 text-primary">
                      Tom: {s.toneLabel}
                    </Badge>
                  )}
                </div>

                {!s ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sem script disponível para este canal.
                  </p>
                ) : (
                  <>
                    {c === 'email' && s.subject && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Assunto</label>
                        <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium">
                          {s.subject}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {c === 'call' ? 'Roteiro' : c === 'email' ? 'Corpo do e-mail' : 'Mensagem'}
                      </label>
                      <Textarea
                        readOnly
                        value={s.body}
                        className="text-xs font-mono resize-none min-h-[140px]"
                        rows={c === 'email' ? 8 : 6}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {c === 'email' && s.subject ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => copy(s.subject!, 'assunto')}
                        >
                          Copiar só o assunto
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {s.body.length} caracteres
                        </span>
                      )}
                      <Button
                        size="xs"
                        onClick={() =>
                          copy(
                            c === 'email' && s.subject ? `Assunto: ${s.subject}\n\n${s.body}` : s.body,
                            channelMeta[c].label,
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export const CopyScriptMenu = memo(CopyScriptMenuComponent);
