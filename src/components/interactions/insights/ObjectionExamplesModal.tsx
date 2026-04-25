import { memo, useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  RotateCcw,
  Calendar as CalendarIcon,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Mic,
  FileText,
  HelpCircle,
  Building2,
  Briefcase,
  Smile,
  Frown,
  Meh,
  Sparkles,
  ThumbsUp,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ObjectionAggregate } from "@/hooks/useInteractionsInsights";
import { cn } from "@/lib/utils";
import { useObjectionExampleFeedback } from "@/hooks/useObjectionExampleFeedback";
import { useDebounce } from "@/hooks/useDebounce";

/** Lowercase + remove diacríticos para busca tolerante a acentuação. */
function normalizeText(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface Props {
  objection: ObjectionAggregate | null;
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

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role_title: string | null;
  company: { name: string | null; nome_fantasia: string | null } | null;
}

interface ContactSummary {
  name: string | null;
  role: string | null;
  company: string | null;
}

/** Tamanho de cada lote incremental do "Carregar mais". */
const PAGE_SIZE = 20;

/** Buckets de tipo expostos como filtros no modal. */
type TypeBucket = "whatsapp" | "call" | "email" | "audio" | "transcript" | "other";

const TYPE_BUCKETS: { key: TypeBucket; label: string; Icon: typeof MessageCircle }[] = [
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { key: "call", label: "Ligação", Icon: Phone },
  { key: "email", label: "E-mail", Icon: Mail },
  { key: "audio", label: "Áudio", Icon: Mic },
  { key: "transcript", label: "Transcrição", Icon: FileText },
  { key: "other", label: "Outros", Icon: HelpCircle },
];

/**
 * Normaliza o `type` cru da interação para um bucket exibido nos filtros.
 * Cobre variações comuns (ex.: `voice_call`, `audio_message`, `meeting_transcript`).
 */
function bucketOf(rawType: string | null | undefined): TypeBucket {
  const t = (rawType ?? "").toLowerCase().trim();
  if (!t) return "other";
  if (t.includes("whatsapp") || t === "wa") return "whatsapp";
  if (t.includes("transcri")) return "transcript";
  if (t.includes("audio") || t.includes("áudio") || t.includes("voice")) return "audio";
  if (t.includes("email") || t.includes("e-mail") || t.includes("mail")) return "email";
  if (t.includes("call") || t.includes("ligaca") || t.includes("ligação") || t.includes("phone"))
    return "call";
  return "other";
}

/** Buckets de sentimento expostos como filtros no modal. */
type SentimentBucket = "positive" | "neutral" | "negative" | "unknown";

const SENTIMENT_BUCKETS: { key: SentimentBucket; label: string; Icon: typeof Smile; cls: string }[] = [
  { key: "positive", label: "Positivo", Icon: Smile, cls: "text-success" },
  { key: "neutral", label: "Neutro", Icon: Meh, cls: "text-muted-foreground" },
  { key: "negative", label: "Negativo", Icon: Frown, cls: "text-destructive" },
  { key: "unknown", label: "Sem análise", Icon: Sparkles, cls: "text-muted-foreground" },
];

/** Normaliza o `sentiment` cru para um dos buckets do filtro. */
function sentimentBucketOf(raw: string | null | undefined): SentimentBucket {
  const v = (raw ?? "").toLowerCase().trim();
  if (!v) return "unknown";
  if (v.includes("posit") || v.includes("favor") || v === "good" || v === "bom") return "positive";
  if (v.includes("neg") || v.includes("ruim") || v.includes("bad") || v === "mau") return "negative";
  if (v.includes("neutr") || v === "ok") return "neutral";
  return "unknown";
}

/** Mapeia rótulos de sentimento para ícone + cor semântica (mini-resumo do contato). */
function sentimentStyle(s: string): { Icon: typeof Smile; cls: string; label: string } {
  const v = s.toLowerCase();
  if (v.includes("posit") || v.includes("favor") || v === "good")
    return { Icon: Smile, cls: "text-success", label: s };
  if (v.includes("neg") || v.includes("ruim") || v.includes("bad"))
    return { Icon: Frown, cls: "text-destructive", label: s };
  return { Icon: Meh, cls: "text-muted-foreground", label: s };
}

function ObjectionExamplesModalImpl({ objection, onClose }: Props) {
  const ids = useMemo(
    () => (objection && Array.isArray(objection.examples) ? objection.examples : []),
    [objection],
  );
  const idsKey = ids.join(",");
  const objectionKey = objection?.objection ?? "";

  // Feedback "Útil" — alimenta o ranqueamento das próximas respostas sugeridas.
  const feedback = useObjectionExampleFeedback({
    objection: objection?.objection ?? null,
    category: objection?.category ?? null,
  });

  // Filtros de busca por data, tipo, sentimento e texto
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TypeBucket>>(new Set());
  const [selectedSentiments, setSelectedSentiments] = useState<Set<SentimentBucket>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 200);
  const normalizedSearch = useMemo(() => normalizeText(debouncedSearch.trim()), [debouncedSearch]);

  // Reseta filtros ao abrir nova objeção
  useEffect(() => {
    setDateFrom("");
    setDateTo("");
    setSelectedTypes(new Set());
    setSelectedSentiments(new Set());
    setSearchQuery("");
  }, [objectionKey]);

  const totalIds = ids.length;

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery<Example[], Error, { pages: Example[][]; pageParams: number[] }, readonly unknown[], number>({
    queryKey: ["objection-examples-full", objectionKey, idsKey],
    enabled: !!objection && totalIds > 0,
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
    getNextPageParam: (_last, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.length, 0);
      return loaded < totalIds ? loaded : undefined;
    },
    queryFn: async ({ pageParam }): Promise<Example[]> => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const slice = ids.slice(offset, offset + PAGE_SIZE);
      if (slice.length === 0) return [];
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, contact_id, sentiment")
        .in("id", slice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? (data as Example[]) : [];
    },
  });

  // Achata todas as páginas carregadas até o momento.
  const examples = useMemo<Example[]>(
    () => (data?.pages ?? []).flat(),
    [data?.pages],
  );
  const loadedCount = examples.length;

  // IDs únicos de contatos presentes nos exemplos (para buscar mini-resumo).
  const contactIds = useMemo(() => {
    const set = new Set<string>();
    for (const ex of examples) if (ex.contact_id) set.add(ex.contact_id);
    return Array.from(set);
  }, [examples]);
  const contactIdsKey = contactIds.join(",");

  const { data: contactsMap = {} } = useQuery({
    queryKey: ["objection-examples-contacts", contactIdsKey],
    enabled: contactIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Record<string, ContactSummary>> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, role_title, company:companies(name, nome_fantasia)")
        .in("id", contactIds);
      if (error) throw error;
      const map: Record<string, ContactSummary> = {};
      for (const c of (data ?? []) as ContactRow[]) {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || null;
        const company = c.company?.nome_fantasia || c.company?.name || null;
        map[c.id] = { name, role: c.role_title ?? null, company };
      }
      return map;
    },
  });

  // Filtro por intervalo de datas (inclusivo) — base para os contadores de tipo.
  const dateFiltered = useMemo(() => {
    if (!dateFrom && !dateTo) return examples;
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity;
    return examples.filter((ex) => {
      if (!ex.created_at) return false;
      const t = new Date(ex.created_at).getTime();
      return t >= fromTs && t <= toTs;
    });
  }, [examples, dateFrom, dateTo]);

  // Contagens por bucket recalculadas dinamicamente sobre o intervalo de datas.
  const typeCounts = useMemo(() => {
    const counts: Record<TypeBucket, number> = {
      whatsapp: 0,
      call: 0,
      email: 0,
      audio: 0,
      transcript: 0,
      other: 0,
    };
    for (const ex of dateFiltered) counts[bucketOf(ex.type)] += 1;
    return counts;
  }, [dateFiltered]);

  // Aplica filtro de tipo (multi-seleção) sobre o conjunto já filtrado por data.
  const typeFiltered = useMemo(() => {
    if (selectedTypes.size === 0) return dateFiltered;
    return dateFiltered.filter((ex) => selectedTypes.has(bucketOf(ex.type)));
  }, [dateFiltered, selectedTypes]);

  // Contagens de sentimento recalculadas sobre data + tipo aplicados.
  const sentimentCounts = useMemo(() => {
    const counts: Record<SentimentBucket, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      unknown: 0,
    };
    for (const ex of typeFiltered) counts[sentimentBucketOf(ex.sentiment)] += 1;
    return counts;
  }, [typeFiltered]);

  // Aplica filtro de sentimento (multi-seleção) sobre o conjunto já filtrado por data + tipo.
  const sentimentFiltered = useMemo(() => {
    if (selectedSentiments.size === 0) return typeFiltered;
    return typeFiltered.filter((ex) => selectedSentiments.has(sentimentBucketOf(ex.sentiment)));
  }, [typeFiltered, selectedSentiments]);

  // Aplica busca textual (título + conteúdo) como último estágio do funil.
  const filtered = useMemo(() => {
    if (!normalizedSearch) return sentimentFiltered;
    return sentimentFiltered.filter((ex) => {
      const hay = `${normalizeText(ex.title)} ${normalizeText(ex.content)}`;
      return hay.includes(normalizedSearch);
    });
  }, [sentimentFiltered, normalizedSearch]);

  // Itens renderizados = todos os carregados que passaram nos filtros.
  const pageItems = filtered;

  /**
   * Sentimento predominante por contato — calculado sobre o conjunto já filtrado
   * por data + tipo, para refletir o que o usuário está vendo.
   */
  const sentimentByContact = useMemo(() => {
    const tally: Record<string, Record<string, number>> = {};
    for (const ex of filtered) {
      if (!ex.contact_id || !ex.sentiment) continue;
      const key = ex.sentiment.toLowerCase();
      tally[ex.contact_id] ??= {};
      tally[ex.contact_id][key] = (tally[ex.contact_id][key] ?? 0) + 1;
    }
    const result: Record<string, { sentiment: string; count: number; total: number }> = {};
    for (const [cid, counts] of Object.entries(tally)) {
      let top = "";
      let topCount = 0;
      let total = 0;
      for (const [s, c] of Object.entries(counts)) {
        total += c;
        if (c > topCount) {
          top = s;
          topCount = c;
        }
      }
      if (top) result[cid] = { sentiment: top, count: topCount, total };
    }
    return result;
  }, [filtered]);

  const hasFilters =
    !!dateFrom ||
    !!dateTo ||
    selectedTypes.size > 0 ||
    selectedSentiments.size > 0 ||
    !!normalizedSearch;
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedTypes(new Set());
    setSelectedSentiments(new Set());
    setSearchQuery("");
  };

  const toggleType = (key: TypeBucket) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSentiment = (key: SentimentBucket) => {
    setSelectedSentiments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Dialog open={!!objection} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">Conversas mencionando esta objeção</DialogTitle>
          <DialogDescription asChild>
            <div>
              {objection && (
                <>
                  <span className="block text-foreground font-medium mb-0.5 line-clamp-2">
                    {objection.objection}
                  </span>
                  <span className="text-xs">
                    {objection.count} {objection.count === 1 ? "menção" : "menções"} ·{" "}
                    {objection.handled}/{objection.count} tratadas
                    {feedback.usefulCount > 0 && (
                      <>
                        {" · "}
                        <span className="inline-flex items-center gap-1 text-success">
                          <ThumbsUp className="h-3 w-3 fill-current" />
                          {feedback.usefulCount} {feedback.usefulCount === 1 ? "útil" : "úteis"}
                        </span>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Filtros por data */}
        <div className="flex flex-wrap items-end gap-3 border-b border-border/60 pb-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="objection-date-from" className="text-[11px] text-muted-foreground">
              <CalendarIcon className="h-3 w-3 inline mr-1" />
              De
            </Label>
            <Input
              id="objection-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs w-[150px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="objection-date-to" className="text-[11px] text-muted-foreground">
              <CalendarIcon className="h-3 w-3 inline mr-1" />
              Até
            </Label>
            <Input
              id="objection-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs w-[150px]"
            />
          </div>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
          <div className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <>
                {filtered.length} {filtered.length === 1 ? "conversa" : "conversas"}
                {hasFilters && examples.length !== filtered.length && (
                  <> de {examples.length}</>
                )}
              </>
            )}
          </div>
        </div>

        {/* Filtros por tipo de interação — contagens recalculadas no intervalo de datas */}
        {!isLoading && dateFiltered.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 pt-2"
            role="group"
            aria-label="Filtrar por tipo de interação"
          >
            <span className="text-[11px] text-muted-foreground mr-1">Tipo:</span>
            {TYPE_BUCKETS.map(({ key, label, Icon }) => {
              const count = typeCounts[key];
              const active = selectedTypes.has(key);
              const disabled = count === 0 && !active;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleType(key)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 px-2 rounded-full border text-[11px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-foreground/80 hover:bg-muted",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-background",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                  <span className="tabular-nums opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filtros por sentimento — contagens recalculadas sobre data + tipo */}
        {!isLoading && typeFiltered.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 pt-1"
            role="group"
            aria-label="Filtrar por sentimento"
          >
            <span className="text-[11px] text-muted-foreground mr-1">Sentimento:</span>
            {SENTIMENT_BUCKETS.map(({ key, label, Icon, cls }) => {
              const count = sentimentCounts[key];
              const active = selectedSentiments.has(key);
              const disabled = count === 0 && !active;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSentiment(key)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 px-2 rounded-full border text-[11px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-foreground/80 hover:bg-muted",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-background",
                  )}
                >
                  <Icon className={cn("h-3 w-3", !active && cls)} />
                  {label}
                  <span className="tabular-nums opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lista paginada */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pt-3 space-y-3 min-h-0">
          {isLoading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-11/12" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!isLoading && isError && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-destructive">Não foi possível carregar as conversas.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <Search className="h-8 w-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Nenhuma conversa encontrada no intervalo selecionado."
                  : "Nenhum exemplo disponível."}
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {!isLoading &&
            !isError &&
            pageItems.map((ex) => {
              const contact = ex.contact_id ? contactsMap[ex.contact_id] : undefined;
              const dom = ex.contact_id ? sentimentByContact[ex.contact_id] : undefined;
              const sentStyle = dom ? sentimentStyle(dom.sentiment) : null;
              const hasMiniSummary =
                contact?.name || contact?.role || contact?.company || sentStyle;
              return (
                <article
                  key={ex.id}
                  className="rounded-md border border-border/60 bg-card p-3 space-y-2"
                >
                  <header className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {ex.title ?? "Sem título"}
                    </h4>
                    {ex.sentiment && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {ex.sentiment}
                      </Badge>
                    )}
                  </header>

                  {hasMiniSummary && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      {contact?.name && (
                        <span className="font-medium text-foreground/90 truncate max-w-[180px]">
                          {contact.name}
                        </span>
                      )}
                      {contact?.role && (
                        <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          {contact.role}
                        </span>
                      )}
                      {contact?.company && (
                        <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {contact.company}
                        </span>
                      )}
                      {sentStyle && dom && (
                        <span
                          className={cn("inline-flex items-center gap-1 capitalize", sentStyle.cls)}
                          title={`Sentimento predominante deste contato (${dom.count}/${dom.total} interações neste filtro)`}
                        >
                          <sentStyle.Icon className="h-3 w-3 shrink-0" />
                          {sentStyle.label}
                        </span>
                      )}
                    </div>
                  )}

                  {ex.content && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{ex.content}</p>
                  )}
                  <footer className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {ex.type}
                      {ex.created_at && (
                        <>
                          {" · "}
                          {new Date(ex.created_at).toLocaleDateString("pt-BR")}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const isUseful = feedback.usefulByInteraction.get(ex.id) === true;
                        const pending =
                          feedback.toggle.isPending &&
                          feedback.toggle.variables?.interactionId === ex.id;
                        return (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            aria-pressed={isUseful}
                            onClick={() =>
                              feedback.toggle.mutate({
                                interactionId: ex.id,
                                isUseful: !isUseful,
                              })
                            }
                            title={
                              isUseful
                                ? "Desmarcar como útil"
                                : "Marcar como útil — vamos priorizar exemplos parecidos"
                            }
                            className={cn(
                              "h-7 text-xs gap-1",
                              isUseful && "text-success hover:text-success",
                            )}
                          >
                            {pending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ThumbsUp
                                className={cn("h-3 w-3", isUseful && "fill-current")}
                              />
                            )}
                            {isUseful ? "Útil" : "Marcar útil"}
                          </Button>
                        );
                      })()}
                      {ex.contact_id && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          title="Abrir esta conversa na Ficha 360 (rola até o trecho)"
                        >
                          <Link
                            to={`/contatos/${ex.contact_id}/ficha-360?focus=${ex.id}`}
                            onClick={onClose}
                          >
                            Abrir na Ficha 360 <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
        </div>

        {/* Carregar mais (incremental) */}
        {!isLoading && !isError && totalIds > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-3 gap-3">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {loadedCount < totalIds ? (
                <>
                  Carregadas {loadedCount} de {totalIds}
                  {hasFilters && filtered.length !== loadedCount && (
                    <> · {filtered.length} no filtro atual</>
                  )}
                </>
              ) : (
                <>
                  Todas as {totalIds} {totalIds === 1 ? "conversa" : "conversas"} carregadas
                </>
              )}
            </span>
            {hasNextPage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="h-8 gap-1"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Carregar mais
                <span className="text-muted-foreground tabular-nums">
                  ({Math.min(PAGE_SIZE, totalIds - loadedCount)})
                </span>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const ObjectionExamplesModal = memo(ObjectionExamplesModalImpl);
