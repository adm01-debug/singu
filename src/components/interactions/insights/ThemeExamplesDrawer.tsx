import { memo, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTopicsCatalog } from "@/hooks/useConversationIntel";
import { extractExcerpts, type Excerpt } from "@/lib/insights/extractExcerpts";
import type { ThemeAggregate } from "@/hooks/useInteractionsInsights";

interface Props {
  theme: ThemeAggregate | null;
  onClose: () => void;
}

interface InteractionRow {
  id: string;
  title: string | null;
  type: string | null;
  created_at: string | null;
  content: string | null;
  transcription: string | null;
  contact_id: string | null;
  sentiment: string | null;
}

function normalizeKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MarkExcerpt = memo(function MarkExcerpt({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const re = new RegExp(`(${escapeRegex(term)})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-warning/30 text-foreground rounded px-0.5">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
});

const ExcerptItem = memo(function ExcerptItem({
  excerpt,
  interaction,
  onClose,
}: {
  excerpt: Excerpt;
  interaction: InteractionRow | undefined;
  onClose: () => void;
}) {
  return (
    <article className="rounded-md border border-border/60 bg-card p-3 space-y-2">
      <div className="flex gap-2">
        <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
        <p className="text-sm text-foreground leading-relaxed">
          <MarkExcerpt text={excerpt.text} term={excerpt.matchTerm} />
        </p>
      </div>
      <footer className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground truncate">
          {interaction?.title ?? "Sem título"} · {interaction?.type ?? "—"}
          {interaction?.created_at ? ` · ${new Date(interaction.created_at).toLocaleDateString("pt-BR")}` : ""}
        </span>
        {interaction?.contact_id && (
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1 shrink-0">
            <Link to={`/contatos/${interaction.contact_id}/ficha-360`} onClick={onClose}>
              Ficha 360 <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </footer>
    </article>
  );
});

export function ThemeExamplesDrawer({ theme, onClose }: Props) {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: topics } = useTopicsCatalog();

  useEffect(() => {
    if (!theme || !theme.examples.length) {
      setInteractions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, transcription, contact_id, sentiment")
        .in("id", theme.examples);
      if (!cancelled) {
        if (!error && Array.isArray(data)) setInteractions(data as InteractionRow[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theme]);

  const keywords = useMemo(() => {
    if (!theme) return [];
    const labelKey = normalizeKey(theme.label);
    if (Array.isArray(topics)) {
      const match = topics.find((t) => normalizeKey(t.label) === labelKey);
      if (match && Array.isArray(match.keywords) && match.keywords.length > 0) {
        return [theme.label, ...match.keywords];
      }
    }
    return [theme.label];
  }, [theme, topics]);

  const excerpts = useMemo(() => {
    if (!Array.isArray(interactions) || interactions.length === 0) return [];
    const sources = interactions.map((i) => ({
      id: i.id,
      text: (i.transcription && i.transcription.length > 0 ? i.transcription : i.content) ?? "",
    }));
    return extractExcerpts(sources, keywords, { totalCap: 5, maxPerSource: 2, window: 140 });
  }, [interactions, keywords]);

  const interactionMap = useMemo(() => {
    const m = new Map<string, InteractionRow>();
    for (const i of interactions) m.set(i.id, i);
    return m;
  }, [interactions]);

  const sourcesCount = useMemo(() => new Set(excerpts.map((e) => e.interactionId)).size, [excerpts]);

  return (
    <Sheet open={!!theme} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {theme?.label}
            {theme && (
              <Badge variant="outline" className="text-[10px]">
                {theme.category}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {theme ? `${theme.mentions} menções em ${theme.count} conversas` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando excertos…
            </div>
          )}

          {!loading && excerpts.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                {excerpts.length} excerto{excerpts.length === 1 ? "" : "s"} de {sourcesCount} conversa
                {sourcesCount === 1 ? "" : "s"}
              </p>
              {excerpts.map((ex, i) => (
                <ExcerptItem
                  key={`${ex.interactionId}-${ex.position}-${i}`}
                  excerpt={ex}
                  interaction={interactionMap.get(ex.interactionId)}
                  onClose={onClose}
                />
              ))}
            </>
          )}

          {!loading && excerpts.length === 0 && interactions.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground italic">
                Nenhuma menção literal encontrada nas transcrições. Mostrando interações relacionadas.
              </p>
              {interactions.map((ex) => (
                <article key={ex.id} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
                  <header className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">{ex.title ?? "Sem título"}</h4>
                    {ex.sentiment && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {ex.sentiment}
                      </Badge>
                    )}
                  </header>
                  {ex.content && <p className="text-xs text-muted-foreground line-clamp-3">{ex.content}</p>}
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
            </>
          )}

          {!loading && interactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum exemplo disponível.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
