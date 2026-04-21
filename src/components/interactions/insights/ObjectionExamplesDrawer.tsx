import { memo, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
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

const MAX_EXAMPLES = 20;

function ObjectionExamplesDrawerImpl({ objection, onClose }: Props) {
  const ids = useMemo(
    () => (objection && Array.isArray(objection.examples) ? objection.examples.slice(0, MAX_EXAMPLES) : []),
    [objection],
  );
  const idsKey = ids.join(",");
  const objectionKey = objection?.objection ?? "";

  const { data: examples = [], isLoading } = useQuery({
    queryKey: ["objection-examples", objectionKey, idsKey],
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

  return (
    <Sheet open={!!objection} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="line-clamp-2">Conversas mencionando esta objeção</SheetTitle>
          <SheetDescription>
            {objection ? (
              <>
                <span className="block text-foreground font-medium mb-0.5 line-clamp-2">{objection.objection}</span>
                {objection.count} {objection.count === 1 ? "menção" : "menções"} · {objection.handled}/{objection.count} tratadas
              </>
            ) : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-11/12" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!isLoading && examples.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum exemplo disponível.</p>
          )}
          {!isLoading && examples.map((ex) => (
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
          {!isLoading && objection && objection.examples.length > MAX_EXAMPLES && (
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Mostrando {MAX_EXAMPLES} de {objection.examples.length} conversas
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const ObjectionExamplesDrawer = memo(ObjectionExamplesDrawerImpl);
