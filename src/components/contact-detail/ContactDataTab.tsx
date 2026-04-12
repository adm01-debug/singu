import { useState, useEffect } from 'react';
import {
  Phone, Mail, MapPin, Globe, Users, Clock, Shield, CheckCircle2,
  MessageSquare, Star, ExternalLink, Copy, Check, AlertTriangle,
  Linkedin, Instagram, Facebook, Twitter, Youtube, Calendar, Building2,
  BadgeCheck, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { queryExternalData } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import type { Contact } from '@/hooks/useContactDetail';

// ─── Types from external DB ───────────────────────────────────

interface ExternalPhone {
  id: string;
  contact_id: string;
  phone_type: string;
  numero: string;
  numero_normalizado?: string;
  numero_e164?: string;
  is_primary?: boolean;
  is_whatsapp?: boolean;
  is_verified?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExternalEmail {
  id: string;
  contact_id: string;
  email_type: string;
  email: string;
  email_normalizado?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExternalAddress {
  id: string;
  contact_id: string;
  tipo?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
  cidade_ibge?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  google_place_id?: string;
  tipo_logradouro?: string;
  ponto_referencia?: string;
  is_primary?: boolean;
  fonte?: string;
  origem?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExternalSocialMedia {
  id: string;
  contact_id: string;
  plataforma: string;
  handle?: string;
  url?: string;
  nome_perfil?: string;
  is_verified?: boolean;
  is_active?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  origem?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

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
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  website: Globe,
  whatsapp: MessageSquare,
};

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const color = value >= 80 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-destructive';
  return (
    <span className={cn('text-xs font-medium', color)}>{value}%</span>
  );
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

// ─── Component ────────────────────────────────────────────────

interface Props {
  contact: Contact;
}

export function ContactDataTab({ contact }: Props) {
  const { user } = useAuth();
  const [phones, setPhones] = useState<ExternalPhone[]>([]);
  const [emails, setEmails] = useState<ExternalEmail[]>([]);
  const [addresses, setAddresses] = useState<ExternalAddress[]>([]);
  const [socials, setSocials] = useState<ExternalSocialMedia[]>([]);
  const [relatives, setRelatives] = useState<Tables<'contact_relatives'>[]>([]);
  const [cadence, setCadence] = useState<Tables<'contact_cadence'> | null>(null);
  const [preferences, setPreferences] = useState<Tables<'contact_preferences'> | null>(null);
  const [timeAnalysis, setTimeAnalysis] = useState<Tables<'contact_time_analysis'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!contact.id) return;
    setLoading(true);

    const contactFilter = [{ type: 'eq' as const, column: 'contact_id', value: contact.id }];

    const fetchAll = async () => {
      const [phonesRes, emailsRes, addrRes, socialRes] = await Promise.all([
        queryExternalData<ExternalPhone>({ table: 'contact_phones', filters: contactFilter, order: { column: 'is_primary', ascending: false }, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalEmail>({ table: 'contact_emails', filters: contactFilter, order: { column: 'is_primary', ascending: false }, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalAddress>({ table: 'contact_addresses', filters: contactFilter, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalSocialMedia>({ table: 'contact_social_media', filters: contactFilter, range: { from: 0, to: 49 } }),
      ]);

      setPhones(phonesRes.data || []);
      setEmails(emailsRes.data || []);
      setAddresses(addrRes.data || []);
      setSocials(socialRes.data || []);

      // Local DB tables
      if (user) {
        const [relRes, cadRes, prefRes, timeRes] = await Promise.all([
          supabase.from('contact_relatives').select('*').eq('contact_id', contact.id).order('name'),
          supabase.from('contact_cadence').select('*').eq('contact_id', contact.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('contact_preferences').select('*').eq('contact_id', contact.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('contact_time_analysis').select('*').eq('contact_id', contact.id).eq('user_id', user.id),
        ]);
        setRelatives(relRes.data || []);
        setCadence(cadRes.data);
        setPreferences(prefRes.data);
        setTimeAnalysis(timeRes.data || []);
      }

      setLoading(false);
    };

    fetchAll();
  }, [contact.id, user]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
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

  return (
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
                {p.contexto && (
                  <p className="text-[10px] text-muted-foreground">{p.contexto}</p>
                )}
                {p.observacao && (
                  <p className="text-[10px] text-muted-foreground italic">{p.observacao}</p>
                )}
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
                {e.contexto && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{e.contexto}</p>
                )}
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
                    <a
                      href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
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
                  {s.nome_perfil && s.handle && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.nome_perfil}</p>
                  )}
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
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-warning" />
            Relacionados ({relatives.length})
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
                <Badge variant="secondary" className="text-[10px] capitalize">{rel.relationship_type}</Badge>
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

          {!cadence && !preferences && (
            <p className="text-xs text-muted-foreground text-center py-2">Sem preferências configuradas</p>
          )}
        </CardContent>
      </Card>

      {/* ═══ ANÁLISE TEMPORAL ═══ */}
      {timeAnalysis.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-success" />
              Análise Temporal — Melhores Horários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {timeAnalysis
                .filter(t => (t.total_attempts || 0) > 0)
                .sort((a, b) => {
                  const rateA = (a.success_count || 0) / (a.total_attempts || 1);
                  const rateB = (b.success_count || 0) / (b.total_attempts || 1);
                  return rateB - rateA;
                })
                .slice(0, 10)
                .map((t) => {
                  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const rate = Math.round(((t.success_count || 0) / (t.total_attempts || 1)) * 100);
                  const color = rate >= 70 ? 'border-success/30 text-success' : rate >= 40 ? 'border-warning/30 text-warning' : 'border-muted';
                  return (
                    <Badge key={t.id} variant="outline" className={cn('text-xs', color)}>
                      {days[t.day_of_week]} {t.hour_of_day}h — {rate}% ({t.total_attempts} tentativas)
                      {t.avg_response_time_minutes != null && ` · ${t.avg_response_time_minutes}min resp.`}
                    </Badge>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
