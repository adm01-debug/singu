import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, Clock, RefreshCw, Users, TrendingUp,
  Cake, Target, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { WeeklyReportData } from '@/hooks/useWeeklyReport';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Content Toggle
interface ContentToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ContentToggle({ icon, label, description, checked, onCheckedChange }: ContentToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// Stat Card
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
}

export function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg border text-center ${variant === 'warning' ? 'border-warning/50 bg-warning/5' : 'bg-secondary/30'}`}>
      <div className="flex items-center justify-center mb-2 text-muted-foreground">{icon}</div>
      <p className={`text-2xl font-bold ${variant === 'warning' ? 'text-warning' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// Report Preview
interface ReportPreviewData {
  stats?: { totalInteractions?: number; newContacts?: number; upcomingBirthdays?: number; atRiskContacts?: number };
  highlights?: string[];
  recommendations?: string[];
}

export function ReportPreview({ data, generating }: { data: ReportPreviewData | null; generating: boolean }) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Gerando relatório...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Nenhum relatório gerado ainda</p>
        <p className="text-sm text-muted-foreground">Clique em "Gerar Agora" para visualizar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Interações" value={data.stats?.totalInteractions || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Novos Contatos" value={data.stats?.newContacts || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Aniversários" value={data.stats?.upcomingBirthdays || 0} icon={<Cake className="h-4 w-4" />} />
        <StatCard label="Em Risco" value={data.stats?.atRiskContacts || 0} icon={<AlertTriangle className="h-4 w-4" />} variant={(data.stats?.atRiskContacts ?? 0) > 5 ? 'warning' : 'default'} />
      </div>

      {(data.highlights?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Destaques</h4>
          <div className="space-y-2">
            {data.highlights!.map((highlight: string, i: number) => (
              <div key={`highlight-${i}-${highlight.slice(0, 15)}`} className="p-3 rounded-lg bg-success/10 text-sm">{highlight}</div>
            ))}
          </div>
        </div>
      )}

      {(data.recommendations?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Recomendações</h4>
          <div className="space-y-2">
            {data.recommendations!.map((rec: string, i: number) => (
              <div key={`rec-${i}-${rec.slice(0, 15)}`} className="p-3 rounded-lg bg-warning/10 text-sm flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />{rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Report History
export function ReportHistory({ reports }: { reports: WeeklyReportData[] }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum relatório no histórico</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="p-4 rounded-lg border hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  Semana de {format(new Date(report.period_start), "dd 'de' MMM", { locale: ptBR })}
                </span>
              </div>
              <Badge variant={report.status === 'sent' ? 'default' : report.status === 'generated' ? 'secondary' : 'outline'} className="text-xs">
                {report.status === 'sent' ? 'Enviado' : report.status === 'generated' ? 'Gerado' : 'Pendente'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
