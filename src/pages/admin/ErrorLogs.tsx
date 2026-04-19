/**
 * /admin/error-logs — visualizador dos últimos 100 erros capturados pelo
 * sistema local de errorReporting (persistidos em localStorage).
 * Acesso restrito a admins via useIsAdmin.
 */
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Navigate } from 'react-router-dom';
import { getErrorLogs, clearErrorLogs, type ErrorReport } from '@/lib/errorReporting';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SEVERITY_VARIANT: Record<ErrorReport['severity'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
  critical: 'destructive',
};

export default function ErrorLogsAdmin() {
  const { isAdmin, isLoading } = useIsAdmin();
  const [logs, setLogs] = useState<ErrorReport[]>(() => getErrorLogs());
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | ErrorReport['severity']>('all');
  const [source, setSource] = useState<'all' | 'errors' | 'web-vitals'>('all');

  const filtered = useMemo(() => {
    return logs
      .filter((l) => severity === 'all' || l.severity === severity)
      .filter((l) => {
        if (source === 'all') return true;
        const isVital = l.metadata && (l.metadata as Record<string, unknown>).source === 'web-vitals';
        return source === 'web-vitals' ? !!isVital : !isVital;
      })
      .filter((l) =>
        !search.trim() ? true : (l.message + (l.stack ?? '') + l.url).toLowerCase().includes(search.toLowerCase()),
      )
      .slice(-100)
      .reverse();
  }, [logs, search, severity, source]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const refresh = () => {
    setLogs(getErrorLogs());
    toast.success('Logs atualizados');
  };

  const clear = () => {
    clearErrorLogs();
    setLogs([]);
    toast.success('Logs limpos');
  };

  const severities: Array<'all' | ErrorReport['severity']> = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <>
      <Helmet>
        <title>Error Logs — Admin</title>
        <meta name="description" content="Painel admin de logs de erro capturados em produção." />
      </Helmet>
      <div className="container mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="size-6 text-destructive" />
              Error Logs
            </h1>
            <p className="text-sm text-muted-foreground">Últimos {filtered.length} de {logs.length} erros capturados.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="size-4 mr-2" /> Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={clear}>
              <Trash2 className="size-4 mr-2" /> Limpar
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Buscar por mensagem, URL ou stack…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          {severities.map((s) => (
            <Button
              key={s}
              variant={severity === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverity(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground">Fonte:</span>
          {(['all', 'errors', 'web-vitals'] as const).map((s) => (
            <Button
              key={s}
              variant={source === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSource(s)}
              className="capitalize"
            >
              {s === 'all' ? 'Todos' : s === 'errors' ? 'Erros' : 'Performance'}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhum erro registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((log) => (
                    <li key={log.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant={SEVERITY_VARIANT[log.severity]} className="capitalize">{log.severity}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="font-medium mt-2 break-words">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={log.url}>{log.url}</p>
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Stack trace</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Metadata</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
