import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmailFinder } from "@/hooks/useEnrichmentSuite";

export function EmailFinderWidget({ contactId = null }: { contactId?: string | null }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domain, setDomain] = useState("");
  const { mutate, data, isPending } = useEmailFinder();

  const submit = () => firstName && lastName && domain && mutate({ firstName, lastName, domain, contactId });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4 text-info" /> Encontrar Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" className="h-9 text-sm" />
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" className="h-9 text-sm" />
        </div>
        <div className="flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="empresa.com" className="h-9 text-sm" />
          <Button size="sm" onClick={submit} disabled={!firstName || !lastName || !domain || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
        {data?.best && (
          <div className="rounded-lg border bg-success/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">{data.best.email}</span>
              <Badge variant="outline">Confiança {data.best.score}</Badge>
            </div>
          </div>
        )}
        {data?.candidates && data.candidates.length > 1 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Ver {data.candidates.length} candidatos</summary>
            <ul className="mt-2 space-y-1">
              {data.candidates.slice(0, 8).map((c) => (
                <li key={c.email} className="flex justify-between font-mono">
                  <span>{c.email}</span>
                  <span className="text-muted-foreground">{c.score}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
