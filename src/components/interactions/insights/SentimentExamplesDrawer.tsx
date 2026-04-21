import { memo, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { SentimentOverall } from "@/hooks/useConversationIntel";

interface Props {
  bucket: SentimentOverall | null;
  interactionIds: string[];
  onClose: () => void;
}

interface Example {
  id: string;
  title: string | null;
  type: string | null;
  created_at: string | null;
  content: string | null;
  contact_id: string | null;
  sentiment: string | null;
}

const LABELS: Record<SentimentOverall, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
  mixed: "Misto",
};

const BADGE_VARIANTS: Record<SentimentOverall, "default" | "secondary" | "destructive" | "outline"> = {
  positive: "default",
  neutral: "secondary",
  negative: "destructive",
  mixed: "outline",
};

const MAX_EXAMPLES = 20;

function SentimentExamplesDrawerImpl({ bucket, interactionIds, onClose }: Props) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = Array.isArray(interactionIds) ? interactionIds : [];
  const totalCount = ids.length;
  const limitedIds = ids.slice(0, MAX_EXAMPLES);

  useEffect(() => {
    if (!bucket || limitedIds.length === 0) {
      setExamples([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, contact_id, sentiment")
        .in("id", limitedIds)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (!error && Array.isArray(data)) setExamples(data as Example[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, limitedIds.join(",")]);

  return (
    <Sheet open={!!bucket} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            Conversas com sentimento
            {bucket && <Badge variant={BADGE_VARIANTS[bucket]} className="text-[10px]">{LABELS[bucket]}</Badge>}
          </SheetTitle>
          <SheetDescription>
            {bucket ? `${totalCount} ${totalCount === 1 ? "conversa" : "conversas"} no período` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando exemplos…
            </div>
          )}
          {!loading && examples.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum exemplo disponível.</p>
          )}
          {!loading && examples.map((ex) => (
            <article key={ex.id} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
              <header className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">{ex.title ?? "Sem título"}</h4>
                {ex.sentiment && (
                  <Badge variant="outline" className="text-[10px] capitalize">{ex.sentiment}</Badge>
                )}
              </header>
              {ex.content && (
                <p className="text-xs text-muted-foreground line-clamp-3">{ex.content}</p>
              )}
              <footer className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  {ex.type} · {ex.created_at ? new Date(ex.created_at).toLocaleDateString("pt-BR") : ""}
                </span>
                {ex.contact_id && (
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1">
                    <Link to={`/contatos/${ex.contact_id}/ficha-360`} onClick={onClose}>
                      Ficha 360 <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </footer>
            </article>
          ))}
          {!loading && totalCount > MAX_EXAMPLES && (
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Mostrando {MAX_EXAMPLES} de {totalCount} conversas
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const SentimentExamplesDrawer = memo(SentimentExamplesDrawerImpl);
