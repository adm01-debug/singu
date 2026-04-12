import { useState } from 'react';
import {
  Phone, Mail, MapPin, Globe, Users, Clock,
  MessageSquare, Star, ExternalLink, Copy, Check, AlertTriangle,
  Linkedin, Instagram, Facebook, Twitter, Youtube, Building2,
  BadgeCheck, Plus, Trash2, BarChart3, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContactRelationalData, useRelativeMutations } from '@/hooks/useContactRelationalData';
import type { ExternalPhone, ExternalSocialMedia } from '@/hooks/useContactRelationalData';
import type { Contact } from '@/hooks/useContactDetail';
import type { Json } from '@/integrations/supabase/types';

// ─── Helpers ──────────────────────────────────────────────────

const PHONE_TYPE_LABELS: Record<string, string> = {
  fixo_comercial: 'Fixo Comercial',
  celular_corporativo: 'Celular Corp.',
  celular_pessoal: 'Celular Pessoal',
  fixo_residencial: 'Fixo Residencial',
  fax: 'Fax',
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
  corporativo: 'Corporativo',
  pessoal: 'Pessoal',
  financeiro: 'Financeiro',
  nfe: 'NF-e',
  marketing: 'Marketing',
};

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin, instagram: Instagram, facebook: Facebook,
  twitter: Twitter, x: Twitter, youtube: Youtube,
  website: Globe, whatsapp: MessageSquare,
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const color = value >= 80 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-destructive';
  return <span className={cn('text-xs font-medium', color)}>{value}%</span>;
}

function PrimaryBadge({ isPrimary }: { isPrimary?: boolean }) {
  if (!isPrimary) return null;
  return <Badge variant="outline" className="text-xs border-primary/30 text-primary"><Star className="h-3 w-3 mr-0.5" />Principal</Badge>;
}

function VerifiedBadge({ isVerified }: { isVerified?: boolean }) {
  if (!isVerified) return null;
  return <BadgeCheck className="h-3.5 w-3.5 text-success" />;
}

function SourceBadge({ fonte }: { fonte?: string }) {
  if (!fonte) return null;
  return <Badge variant="secondary" className="text-[10px]">{fonte.replace(/_/g, ' ')}</Badge>;
}

function formatPhoneDisplay(phone: ExternalPhone): string {
  return phone.numero_e164 || phone.numero_normalizado || phone.numero;
}

// ─── Summary Strip ────────────────────────────────────────────

function DataSummaryStrip({ counts }: { counts: { phones: number; emails: number; addresses: number; socials: number; relatives: number; hasTime: boolean } }) {
  const items = [
    { icon: Phone, label: 'Telefones', count: counts.phones, color: 'text-primary' },
    { icon: Mail, label: 'Emails', count: counts.emails, color: 'text-info' },
    { icon: MapPin, label: 'Endereços', count: counts.addresses, color: 'text-accent' },
    { icon: Globe, label: 'Sociais', count: counts.socials, color: 'text-secondary' },
    { icon: Users, label: 'Relacionados', count: counts.relatives, color: 'text-warning' },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <Card className="mb-4">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{total} registros</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <item.icon className={cn('h-3.5 w-3.5', item.color)} />
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </div>
          ))}
          {counts.hasTime && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Heatmap</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Heatmap Grid ─────────────────────────────────────────────

function TimeHeatmapGrid({ data }: { data: { day_of_week: number; hour_of_day: number; success_count: number | null; total_attempts: number | null; avg_response_time_minutes: number | null }[] }) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6h-22h
  const dataMap = new Map<string, { rate: number; attempts: number; avgResp: number | null }>();
  let maxAttempts = 1;

  data.forEach((d) => {
    const attempts = d.total_attempts || 0;
    const success = d.success_count || 0;
    if (attempts > 0) {
      dataMap.set(`${d.day_of_week}-${d.hour_of_day}`, {
        rate: Math.round((success / attempts) * 100),
        attempts,
        avgResp: d.avg_response_time_minutes,
      });
      if (attempts > maxAttempts) maxAttempts = attempts;
    }
  });

  const getColor = (rate: number, attempts: number) => {
    const opacity = Math.min(0.3 + (attempts / maxAttempts) * 0.7, 1);
    if (rate >= 70) return `rgba(34, 197, 94, ${opacity})`;
    if (rate >= 40) return `rgba(234, 179, 8, ${opacity})`;
    if (rate > 0) return `rgba(239, 68, 68, ${opacity})`;
    return 'transparent';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Header */}
        <div className="flex gap-0.5 mb-1">
          <div className="w-8 flex-shrink-0" />
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">{h}h</div>
          ))}
        </div>
        {/* Rows */}
        {DAY_LABELS.map((day, dayIdx) => (
          <div key={dayIdx} className="flex gap-0.5 mb-0.5">
            <div className="w-8 flex-shrink-0 text-[10px] text-muted-foreground flex items-center">{day}</div>
            {hours.map((hour) => {
              const cell = dataMap.get(`${dayIdx}-${hour}`);
              return (
                <div
                  key={hour}
                  className="flex-1 aspect-square rounded-sm border border-border/50 relative group cursor-default"
                  style={{ backgroundColor: cell ? getColor(cell.rate, cell.attempts) : undefined }}
                  title={cell ? `${day} ${hour}h: ${cell.rate}% sucesso (${cell.attempts} tentativas)${cell.avgResp != null ? ` · ${cell.avgResp}min resp.` : ''}` : `${day} ${hour}h: sem dados`}
                />
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }} />
            <span className="text-[10px] text-muted-foreground">≥70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }} />
            <span className="text-[10px] text-muted-foreground">40-69%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
            <span className="text-[10px] text-muted-foreground">&lt;40%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Relative Dialog ──────────────────────────────────────

function AddRelativeDialog({ contactId, onAdd }: { contactId: string; onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', relationship_type: 'conjuge', phone: '', email: '',
    occupation: '', company: '', notes: '', is_decision_influencer: false,
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAdd({
      ...form,
      name: form.name.trim(),
      phone: form.phone || undefined,
      email: form.email || undefined,
      occupation: form.occupation || undefined,
      company: form.company || undefined,
      notes: form.notes || undefined,
    });
    setForm({ name: '', relationship_type: 'conjuge', phone: '', email: '', occupation: '', company: '', notes: '', is_decision_influencer: false });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm">Novo Relacionado</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Nome *" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
          <Select value={form.relationship_type} onValueChange={(v) => setForm(p => ({ ...p, relationship_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['conjuge', 'filho', 'filha', 'pai', 'mae', 'irmao', 'irma', 'socio', 'assistente', 'outro'].map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Profissão" value={form.occupation} onChange={(e) => setForm(p => ({ ...p, occupation: e.target.value }))} />
            <Input placeholder="Empresa" value={form.company} onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))} />
          </div>
          <Input placeholder="Notas" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={form.is_decision_influencer} onChange={(e) => setForm(p => ({ ...p, is_decision_influencer: e.target.checked }))} className="rounded" />
            Influenciador de decisão
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Response Rate Chart ──────────────────────────────────────

function ResponseRateChart({ rates }: { rates: Json }) {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return null;
  const entries = Object.entries(rates as Record<string, number>).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  const maxRate = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground font-medium">Taxa de resposta por canal</span>
      {entries.map(([channel, rate]) => (
        <div key={channel} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 capitalize truncate">{channel}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(rate / maxRate) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-foreground font-medium w-8 text-right">{rate}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

interface Props {
  contact: Contact;
}

export function ContactDataTab({ contact }: Props) {
  const { data, isLoading } = useContactRelationalData(contact.id);
  const { addRelative, deleteRelative } = useRelativeMutations(contact.id);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { phones, emails, addresses, socials, relatives, cadence, preferences, commPreferences, timeAnalysis } = data;

  return (
    <div>
      {/* ═══ SUMMARY STRIP ═══ */}
      <DataSummaryStrip counts={{
        phones: phones.length,
        emails: emails.length,
        addresses: addresses.length,
        socials: socials.length,
        relatives: relatives.length,
        hasTime: timeAnalysis.length > 0,
      }} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ═══ TELEFONES ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-primary" />
              Telefones ({phones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {phones.length > 0 ? phones.map((p) => (
              <div key={p.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a href={`tel:${formatPhoneDisplay(p)}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {p.numero}
                    </a>
                    <PrimaryBadge isPrimary={p.is_primary} />
                    <VerifiedBadge isVerified={p.is_verified} />
                    {p.is_whatsapp && (
                      <a href={`https://wa.me/${(p.numero_e164 || p.numero).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success cursor-pointer">
                          <MessageSquare className="h-2.5 w-2.5 mr-0.5" />WhatsApp
                        </Badge>
                      </a>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      {PHONE_TYPE_LABELS[p.phone_type] || p.phone_type}
                    </Badge>
                    <ConfidenceBadge value={p.confiabilidade} />
                    <SourceBadge fonte={p.fonte} />
                  </div>
                  {p.numero_e164 && p.numero_e164 !== p.numero && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">E.164: {p.numero_e164}</p>
                  )}
                  {p.contexto && <p className="text-[10px] text-muted-foreground">{p.contexto}</p>}
                  {p.observacao && <p className="text-[10px] text-muted-foreground italic">{p.observacao}</p>}
                </div>
                <button
                  onClick={() => copyToClipboard(formatPhoneDisplay(p), `phone-${p.id}`)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                >
                  {copiedField === `phone-${p.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum telefone registrado</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ EMAILS ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-info" />
              Emails ({emails.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emails.length > 0 ? emails.map((e) => (
              <div key={e.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a href={`mailto:${e.email}`} className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[200px]">
                      {e.email}
                    </a>
                    <PrimaryBadge isPrimary={e.is_primary} />
                    <VerifiedBadge isVerified={e.is_verified} />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      {EMAIL_TYPE_LABELS[e.email_type] || e.email_type}
                    </Badge>
                    <ConfidenceBadge value={e.confiabilidade} />
                    <SourceBadge fonte={e.fonte} />
                  </div>
                  {e.contexto && <p className="text-[10px] text-muted-foreground mt-0.5">{e.contexto}</p>}
                </div>
                <button
                  onClick={() => copyToClipboard(e.email, `email-${e.id}`)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                >
                  {copiedField === `email-${e.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum email registrado</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ ENDEREÇOS ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-accent" />
              Endereços ({addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addresses.length > 0 ? addresses.map((a) => {
              const fullAddress = [a.logradouro, a.numero, a.complemento, a.bairro].filter(Boolean).join(', ');
              const cityState = [a.cidade, a.estado].filter(Boolean).join(' - ');
              return (
                <div key={a.id} className="rounded-lg border p-2.5 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <PrimaryBadge isPrimary={a.is_primary} />
                    {a.tipo && <Badge variant="secondary" className="text-[10px] capitalize">{a.tipo}</Badge>}
                    <SourceBadge fonte={a.fonte || a.origem} />
                  </div>
                  {fullAddress && <p className="text-foreground text-xs">{fullAddress}</p>}
                  {cityState && <p className="text-xs text-muted-foreground">{cityState}{a.pais && a.pais !== 'Brasil' ? ` - ${a.pais}` : ''}</p>}
                  {a.cep && <p className="text-[10px] text-muted-foreground">CEP: {a.cep}</p>}
                  {a.ponto_referencia && <p className="text-[10px] text-muted-foreground italic">Ref: {a.ponto_referencia}</p>}
                  {a.cidade_ibge && <p className="text-[10px] text-muted-foreground">IBGE: {a.cidade_ibge}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {a.latitude && a.longitude && (
                      <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />Mapa
                      </a>
                    )}
                    {a.google_maps_url && (
                      <a href={a.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <ExternalLink className="h-2.5 w-2.5" />Google Maps
                      </a>
                    )}
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum endereço registrado</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ REDES SOCIAIS ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-secondary" />
              Redes Sociais ({socials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {socials.length > 0 ? socials.map((s) => {
              const PlatformIcon = PLATFORM_ICONS[s.plataforma] || Globe;
              return (
                <div key={s.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px] flex items-center gap-0.5">
                          {s.handle || s.nome_perfil || s.plataforma}
                          <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">{s.handle || s.nome_perfil || s.plataforma}</span>
                      )}
                      <VerifiedBadge isVerified={s.is_verified} />
                      {s.is_active === false && (
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Inativo</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] capitalize">{s.plataforma}</Badge>
                      <ConfidenceBadge value={s.confiabilidade} />
                      <SourceBadge fonte={s.fonte || s.origem} />
                    </div>
                    {s.nome_perfil && s.handle && <p className="text-[10px] text-muted-foreground mt-0.5">{s.nome_perfil}</p>}
                    {s.contexto && <p className="text-[10px] text-muted-foreground">{s.contexto}</p>}
                    {s.observacoes && <p className="text-[10px] text-muted-foreground italic">{s.observacoes}</p>}
                  </div>
                  {s.url && (
                    <button
                      onClick={() => copyToClipboard(s.url!, `social-${s.id}`)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                    >
                      {copiedField === `social-${s.id}` ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              );
            }) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma rede social registrada</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ FAMILIARES / RELACIONADOS ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-warning" />
                Relacionados ({relatives.length})
              </div>
              <AddRelativeDialog
                contactId={contact.id}
                onAdd={(d) => addRelative.mutate(d as any)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatives.length > 0 ? relatives.map((rel) => (
              <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{rel.name}</span>
                    {rel.is_decision_influencer && (
                      <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Influenciador
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">{rel.relationship_type}</Badge>
                    <button
                      onClick={() => deleteRelative.mutate(rel.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  {rel.age != null && <span>Idade: {rel.age}</span>}
                  {rel.birthday && <span>Nasc: {format(new Date(rel.birthday), 'dd/MM/yyyy')}</span>}
                  {rel.occupation && <span>Profissão: {rel.occupation}</span>}
                  {rel.company && (
                    <span className="flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5" />{rel.company}
                    </span>
                  )}
                  {rel.phone && (
                    <a href={`tel:${rel.phone}`} className="flex items-center gap-0.5 hover:text-primary">
                      <Phone className="h-2.5 w-2.5" />{rel.phone}
                    </a>
                  )}
                  {rel.email && (
                    <a href={`mailto:${rel.email}`} className="flex items-center gap-0.5 hover:text-primary truncate">
                      <Mail className="h-2.5 w-2.5" />{rel.email}
                    </a>
                  )}
                </div>
                {rel.notes && <p className="text-[10px] text-muted-foreground italic">{rel.notes}</p>}
              </div>
            )) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum relacionado registrado</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ CADÊNCIA & PREFERÊNCIAS ═══ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-info" />
              Cadência & Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cadence ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium">A cada {cadence.cadence_days} dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prioridade</span>
                  <Badge variant="outline" className="text-xs capitalize">{cadence.priority || 'medium'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto-lembrete</span>
                  <Badge variant={cadence.auto_remind ? 'default' : 'secondary'} className="text-xs">
                    {cadence.auto_remind ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {cadence.next_contact_due && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Próximo contato</span>
                    <span className="text-xs">{format(new Date(cadence.next_contact_due), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {cadence.last_contact_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Último contato</span>
                    <span className="text-xs">{formatDistanceToNow(new Date(cadence.last_contact_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                )}
                {cadence.notes && <p className="text-xs text-muted-foreground italic border-t pt-2">{cadence.notes}</p>}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">Sem cadência configurada</p>
            )}

            {preferences && (
              <>
                <Separator />
                <div className="space-y-2">
                  {preferences.preferred_channel && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Canal preferido</span>
                      <Badge variant="outline" className="text-xs capitalize">{preferences.preferred_channel}</Badge>
                    </div>
                  )}
                  {(preferences.preferred_days?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Dias preferidos</span>
                      <div className="mt-0.5 flex gap-1 flex-wrap">
                        {preferences.preferred_days?.map((d: string) => (
                          <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(preferences.preferred_times?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Horários preferidos</span>
                      <div className="mt-0.5 flex gap-1 flex-wrap">
                        {preferences.preferred_times?.map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(preferences.avoid_days?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Dias a evitar</span>
                      <div className="mt-0.5 flex gap-1 flex-wrap">
                        {preferences.avoid_days?.map((d: string) => (
                          <Badge key={d} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(preferences.avoid_times?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Horários a evitar</span>
                      <div className="mt-0.5 flex gap-1 flex-wrap">
                        {preferences.avoid_times?.map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {preferences.restrictions && (
                    <div>
                      <span className="text-xs text-muted-foreground">Restrições</span>
                      <p className="text-xs text-foreground">{preferences.restrictions}</p>
                    </div>
                  )}
                  {preferences.communication_tips && (
                    <div>
                      <span className="text-xs text-muted-foreground">Dicas de comunicação</span>
                      <p className="text-xs text-foreground">{preferences.communication_tips}</p>
                    </div>
                  )}
                  {preferences.personal_notes && (
                    <div>
                      <span className="text-xs text-muted-foreground">Notas pessoais</span>
                      <p className="text-xs text-foreground italic">{preferences.personal_notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── Communication Preferences (response rates) ─── */}
            {commPreferences && (
              <>
                <Separator />
                <div className="space-y-2">
                  {commPreferences.contact_frequency && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Frequência de contato</span>
                      <Badge variant="outline" className="text-xs capitalize">{commPreferences.contact_frequency}</Badge>
                    </div>
                  )}
                  {commPreferences.preferred_time_start && commPreferences.preferred_time_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Janela horária</span>
                      <span className="text-xs">{commPreferences.preferred_time_start} – {commPreferences.preferred_time_end}</span>
                    </div>
                  )}
                  {commPreferences.notes && (
                    <div>
                      <span className="text-xs text-muted-foreground">Observações</span>
                      <p className="text-xs text-foreground italic">{commPreferences.notes}</p>
                    </div>
                  )}
                  <ResponseRateChart rates={commPreferences.response_rate_by_channel} />
                </div>
              </>
            )}

            {!cadence && !preferences && !commPreferences && (
              <p className="text-xs text-muted-foreground text-center py-2">Sem preferências configuradas</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ ANÁLISE TEMPORAL — HEATMAP ═══ */}
        {timeAnalysis.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4 text-success" />
                Mapa de Engajamento — Melhores Horários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeHeatmapGrid data={timeAnalysis} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
