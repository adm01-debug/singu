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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar as CalendarIcon,
  Search,
  MessageCircle,
  Phone,
  Mic,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ObjectionAggregate } from "@/hooks/useInteractionsInsights";

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

const PAGE_SIZE = 10;

/** Buckets de tipo expostos como filtros no modal. */
type TypeBucket = "whatsapp" | "call" | "audio" | "transcript" | "other";

const TYPE_BUCKETS: { key: TypeBucket; label: string; Icon: typeof MessageCircle }[] = [
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { key: "call", label: "Ligação", Icon: Phone },
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
  if (t.includes("call") || t.includes("ligaca") || t.includes("ligação") || t.includes("phone"))
    return "call";
  return "other";
}

function ObjectionExamplesModalImpl({ objection, onClose }: Props) {
  const ids = useMemo(
    () => (objection && Array.isArray(objection.examples) ? objection.examples : []),
    [objection],
  );
  const idsKey = ids.join(",");
  const objectionKey = objection?.objection ?? "";

  // Filtros de busca por data, tipo e paginação
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TypeBucket>>(new Set());
  const [page, setPage] = useState(1);

  // Reseta filtros e página ao abrir nova objeção
  useEffect(() => {
    setDateFrom("");
    setDateTo("");
    setSelectedTypes(new Set());
    setPage(1);
  }, [objectionKey]);

  const { data: examples = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["objection-examples-full", objectionKey, idsKey],
    enabled: !!objection && ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Example[]> => {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, title, type, created_at, content, contact_id, sentiment")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? (data as Example[]) : [];
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
      audio: 0,
      transcript: 0,
      other: 0,
    };
    for (const ex of dateFiltered) counts[bucketOf(ex.type)] += 1;
    return counts;
  }, [dateFiltered]);

  // Aplica filtro de tipo (multi-seleção) sobre o conjunto já filtrado por data.
  const filtered = useMemo(() => {
    if (selectedTypes.size === 0) return dateFiltered;
    return dateFiltered.filter((ex) => selectedTypes.has(bucketOf(ex.type)));
  }, [dateFiltered, selectedTypes]);

  // Reset de página quando filtros mudam ou resultado encolhe
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, selectedTypes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const hasFilters = !!dateFrom || !!dateTo || selectedTypes.size > 0;
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedTypes(new Set());
  };

  const toggleType = (key: TypeBucket) => {
    setSelectedTypes((prev) => {
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
            pageItems.map((ex) => (
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
        </div>

        {/* Paginação */}
        {!isLoading && !isError && filtered.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Página {safePage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-8 gap-1"
              >
                Próxima
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const ObjectionExamplesModal = memo(ObjectionExamplesModalImpl);
