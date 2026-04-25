import { memo, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, Loader2, Quote, RotateCcw, Eraser } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTopicsCatalog } from "@/hooks/useConversationIntel";
import { extractExcerpts, type Excerpt } from "@/lib/insights/extractExcerpts";
import { pickTopPassages } from "@/lib/insights/pickTopPassages";
import {
  DEFAULT_EXCERPT_PRESET,
  EXCERPT_PRESET_STORAGE_KEY,
  getExcerptWindow,
  getFallbackWindow,
  isExcerptWindowPreset,
  type ExcerptWindowPreset,
} from "@/lib/insights/excerptWindow";
import { cn } from "@/lib/utils";
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

function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Conta ocorrências whole-word de cada termo dentro de `text` (acento-insensível).
 * Retorna um Map<keywordOriginal, count> preservando o termo informado pelo chamador.
 */
function countTermMatches(text: string, terms: string[]): Map<string, number> {
  const result = new Map<string, number>();
  if (!text) return result;
  const norm = normalizeText(text);
  for (const t of terms) {
    const trimmed = typeof t === "string" ? t.trim() : "";
    if (trimmed.length < 2) {
      result.set(t, 0);
      continue;
    }
    const re = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])(${escapeRegex(normalizeText(trimmed))})(?=$|[^\\p{L}\\p{N}])`,
      "giu",
    );
    let count = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(norm)) !== null) {
      count += 1;
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
    result.set(t, count);
  }
  return result;
}

interface Segment {
  text: string;
  isMatch: boolean;
}

const MarkExcerpt = memo(function MarkExcerpt({ text, terms }: { text: string; terms: string[] }) {
  const segments = useMemo<Segment[]>(() => {
    if (!text) return [];
    const cleaned = Array.from(
      new Map(
        terms
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length >= 2)
          .map((t) => [normalizeText(t), t] as const),
      ).values(),
    ).sort((a, b) => b.length - a.length);

    if (cleaned.length === 0) return [{ text, isMatch: false }];

    const escaped = cleaned.map((t) => escapeRegex(normalizeText(t)));
    const re = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])(${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`,
      "giu",
    );
    const norm = normalizeText(text);
    const out: Segment[] = [];
    let cursor = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(norm)) !== null) {
      const start = m.index + (m[0].length - m[1].length);
      const end = start + m[1].length;
      if (start > cursor) out.push({ text: text.slice(cursor, start), isMatch: false });
      out.push({ text: text.slice(start, end), isMatch: true });
      cursor = end;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor), isMatch: false });
    return out;
  }, [text, terms]);

  if (segments.length === 0) return <>{text}</>;
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark key={i} className="bg-warning/30 text-foreground rounded px-0.5">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
});

const ExcerptItem = memo(function ExcerptItem({
  excerpt,
  interaction,
  terms,
  matchCount,
  onClose,
}: {
  excerpt: Excerpt;
  interaction: InteractionRow | undefined;
  terms: string[];
  matchCount?: number;
  onClose: () => void;
}) {
  return (
    <article className="rounded-md border border-border/60 bg-card p-3 space-y-2">
      <div className="flex gap-2">
        <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
        <p className="text-sm text-foreground leading-relaxed">
          <MarkExcerpt text={excerpt.text} terms={terms} />
        </p>
        {typeof matchCount === "number" && matchCount > 0 && (
          <Badge
            variant="outline"
            className="h-5 shrink-0 text-[10px] bg-warning/10 border-warning/40"
            title={`${matchCount} ocorrência${matchCount === 1 ? "" : "s"} de keywords neste trecho`}
          >
            {matchCount}
          </Badge>
        )}
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

  const [preset, setPreset] = useState<ExcerptWindowPreset>(() => {
    if (typeof window === "undefined") return DEFAULT_EXCERPT_PRESET;
    try {
      const v = window.localStorage.getItem(EXCERPT_PRESET_STORAGE_KEY);
      return isExcerptWindowPreset(v) ? v : DEFAULT_EXCERPT_PRESET;
    } catch {
      return DEFAULT_EXCERPT_PRESET;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(EXCERPT_PRESET_STORAGE_KEY, preset);
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [preset]);

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

  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Reset seleção sempre que o conjunto de keywords mudar (novo tema/catálogo).
  useEffect(() => {
    setSelectedKeywords(new Set(keywords.map((k) => normalizeKey(k))));
  }, [keywords]);

  const effectiveKeywords = useMemo(
    () => keywords.filter((k) => selectedKeywords.has(normalizeKey(k))),
    [keywords, selectedKeywords],
  );

  const allCleared = selectedKeywords.size === 0;
  const allSelected = selectedKeywords.size === keywords.length && keywords.length > 0;

  const toggleKeyword = (kw: string) => {
    const key = normalizeKey(kw);
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearKeywords = () => setSelectedKeywords(new Set());
  const restoreKeywords = () =>
    setSelectedKeywords(new Set(keywords.map((k) => normalizeKey(k))));

  const excerpts = useMemo(() => {
    if (!Array.isArray(interactions) || interactions.length === 0) return [];
    if (effectiveKeywords.length === 0) return [];
    const sources = interactions.map((i) => ({
      id: i.id,
      text: (i.transcription && i.transcription.length > 0 ? i.transcription : i.content) ?? "",
    }));
    return extractExcerpts(sources, effectiveKeywords, {
      totalCap: 5,
      maxPerSource: 2,
      window: getExcerptWindow(preset),
    });
  }, [interactions, effectiveKeywords, preset]);

  const fallbackPassages = useMemo(() => {
    if (excerpts.length > 0) return [];
    if (!Array.isArray(interactions) || interactions.length === 0) return [];
    const sources = interactions.map((i) => ({
      id: i.id,
      text: (i.transcription && i.transcription.length > 0 ? i.transcription : i.content) ?? "",
    }));
    return pickTopPassages(sources, {
      totalCap: 5,
      maxPerSource: 2,
      window: getFallbackWindow(preset),
    });
  }, [excerpts, interactions, preset]);

  const isFallback = excerpts.length === 0 && fallbackPassages.length > 0;
  const displayItems = excerpts.length > 0 ? excerpts : fallbackPassages;

  const interactionMap = useMemo(() => {
    const m = new Map<string, InteractionRow>();
    for (const i of interactions) m.set(i.id, i);
    return m;
  }, [interactions]);

  const sourcesCount = useMemo(
    () => new Set(displayItems.map((e) => e.interactionId)).size,
    [displayItems],
  );

  // Contagem de matches de keywords por excerto exibido (chave = mesma usada no map JSX).
  const perExcerptCounts = useMemo(() => {
    const out = new Map<string, number>();
    if (isFallback || effectiveKeywords.length === 0) return out;
    displayItems.forEach((ex, i) => {
      const counts = countTermMatches(ex.text, effectiveKeywords);
      let total = 0;
      counts.forEach((n) => (total += n));
      out.set(`${ex.interactionId}-${ex.position}-${i}`, total);
    });
    return out;
  }, [displayItems, effectiveKeywords, isFallback]);

  // Resumo agregado: quais keywords foram efetivamente encontradas e quantas vezes (somando excertos exibidos).
  const keywordSummary = useMemo(() => {
    const totals = new Map<string, number>();
    for (const kw of effectiveKeywords) totals.set(kw, 0);
    if (isFallback || effectiveKeywords.length === 0) {
      return { totals, found: [] as Array<{ term: string; count: number }>, totalMatches: 0 };
    }
    for (const ex of displayItems) {
      const counts = countTermMatches(ex.text, effectiveKeywords);
      counts.forEach((n, term) => totals.set(term, (totals.get(term) ?? 0) + n));
    }
    const found = Array.from(totals.entries())
      .filter(([, n]) => n > 0)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);
    const totalMatches = found.reduce((acc, f) => acc + f.count, 0);
    return { totals, found, totalMatches };
  }, [displayItems, effectiveKeywords, isFallback]);

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
          <div
            className="flex items-center gap-1.5 pt-1"
            role="group"
            aria-label="Tamanho do trecho exibido"
            title="Tamanho do trecho exibido"
          >
            <span className="text-[10px] text-muted-foreground mr-1">Trecho:</span>
            {(["short", "medium", "long"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                aria-pressed={preset === p}
                className={cn(
                  "h-6 px-2 rounded text-[11px] font-medium border transition-colors",
                  preset === p
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30",
                )}
              >
                {p === "short" ? "Curto" : p === "medium" ? "Médio" : "Longo"}
              </button>
            ))}
          </div>

          {keywords.length > 0 && (
            <div className="pt-2 space-y-1.5" role="group" aria-label="Filtro de keywords destacadas">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Keywords destacadas{" "}
                  <span className="text-muted-foreground/70">
                    ({selectedKeywords.size}/{keywords.length})
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {!allSelected && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] gap-1"
                      onClick={restoreKeywords}
                      title="Restaurar todas as keywords"
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1"
                    onClick={clearKeywords}
                    disabled={allCleared}
                    title="Remover todas as keywords selecionadas"
                  >
                    <Eraser className="h-3 w-3" /> Limpar filtros
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw) => {
                  const key = normalizeKey(kw);
                  const active = selectedKeywords.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleKeyword(kw)}
                      aria-pressed={active}
                      className={cn(
                        "h-6 px-2 rounded-full text-[11px] font-medium border transition-colors",
                        active
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 line-through opacity-70",
                      )}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando excertos…
            </div>
          )}

          {!loading && displayItems.length > 0 && (
            <>
              {isFallback && (
                <div className="flex gap-2 items-start rounded-md bg-muted/40 border border-border/60 p-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sem menções diretas das keywords deste tema. Mostrando as {displayItems.length} passagens
                    mais relevantes das conversas.
                  </p>
                </div>
              )}
              {!isFallback && (
                <p className="text-xs text-muted-foreground">
                  {displayItems.length} excerto{displayItems.length === 1 ? "" : "s"} de {sourcesCount} conversa
                  {sourcesCount === 1 ? "" : "s"}
                </p>
              )}
              {displayItems.map((ex, i) => (
                <ExcerptItem
                  key={`${ex.interactionId}-${ex.position}-${i}`}
                  excerpt={ex}
                  interaction={interactionMap.get(ex.interactionId)}
                  terms={isFallback ? [] : effectiveKeywords}
                  onClose={onClose}
                />
              ))}
            </>
          )}

          {!loading && displayItems.length === 0 && interactions.length > 0 && (
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
