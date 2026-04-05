import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MessageSquare, Linkedin, Instagram, Twitter,
  Building2, Briefcase, Calendar, Edit2, ExternalLink, Copy, Check
} from 'lucide-react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { queryExternalData } from '@/lib/externalData';
import { formatContactName, pluralize } from '@/lib/formatters';
import type { Contact, Company } from '@/hooks/useContactDetail';

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  unknown: { label: 'Desconhecido', color: 'bg-muted text-muted-foreground' },
  prospect: { label: 'Prospect', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  qualified_lead: { label: 'Lead Qualificado', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  opportunity: { label: 'Oportunidade', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  negotiation: { label: 'Negociação', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  customer: { label: 'Cliente', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  loyal_customer: { label: 'Cliente Fiel', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  advocate: { label: 'Advogado', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  at_risk: { label: 'Em Risco', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const ROLE_CONFIG: Record<string, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  buyer: 'Comprador',
  contact: 'Contato',
  decision_maker: 'Decisor',
  influencer: 'Influenciador',
};

const DISC_COLORS: Record<string, string> = {
  D: 'bg-red-500',
  I: 'bg-yellow-500',
  S: 'bg-green-500',
  C: 'bg-blue-500',
};

interface Props {
  contact: Contact;
  company: Company | null;
  interactionCount: number;
  onEdit?: () => void;
}

export function ContactDetailHeader({ contact, company, interactionCount, onEdit }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const fullName = formatContactName(contact.first_name, contact.last_name);
  const stage = STAGE_CONFIG[contact.relationship_stage || 'unknown'] || STAGE_CONFIG.unknown;
  const behavior = contact.behavior as Record<string, unknown> | null;
  const discProfile = behavior?.discProfile as string | null;

  // Fetch normalized phones/emails from external DB
  useEffect(() => {
    const fetchNormalized = async () => {
      const contactFilter = [{ type: 'eq' as const, column: 'contact_id', value: contact.id }];
      const [phonesRes, emailsRes] = await Promise.all([
        queryExternalData<{ phone: string; label?: string }>({ table: 'contact_phones', filters: contactFilter }),
        queryExternalData<{ email: string; label?: string }>({ table: 'contact_emails', filters: contactFilter }),
      ]);
      if (phonesRes.data) setExtraPhones(phonesRes.data.map(p => p.phone).filter(Boolean));
      if (emailsRes.data) setExtraEmails(emailsRes.data.map(e => e.email).filter(Boolean));
    };
    fetchNormalized();
  }, [contact.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Build channels from contact fields + normalized external tables
  const baseChannels = [
    { icon: Mail, value: contact.email, label: 'Email', href: `mailto:${contact.email}` },
    { icon: Phone, value: contact.phone, label: 'Telefone', href: `tel:${contact.phone}` },
    { icon: MessageSquare, value: contact.whatsapp, label: 'WhatsApp', href: `https://wa.me/${contact.whatsapp?.replace(/\D/g, '')}` },
    { icon: Linkedin, value: contact.linkedin, label: 'LinkedIn', href: contact.linkedin },
    { icon: Instagram, value: contact.instagram, label: 'Instagram', href: `https://instagram.com/${contact.instagram?.replace('@', '')}` },
    { icon: Twitter, value: contact.twitter, label: 'Twitter', href: `https://twitter.com/${contact.twitter?.replace('@', '')}` },
  ].filter(c => c.value);

  // Add extra phones/emails not already shown
  const existingPhones = new Set([contact.phone, contact.whatsapp].filter(Boolean).map(p => p!.replace(/\D/g, '')));
  const existingEmails = new Set([contact.email].filter(Boolean).map(e => e!.toLowerCase()));

  const extraPhoneChannels = extraPhones
    .filter(p => !existingPhones.has(p.replace(/\D/g, '')))
    .map((p, i) => ({ icon: Phone, value: p, label: `Tel ${i + 2}`, href: `tel:${p}` }));

  const extraEmailChannels = extraEmails
    .filter(e => !existingEmails.has(e.toLowerCase()))
    .map((e, i) => ({ icon: Mail, value: e, label: `Email ${i + 2}`, href: `mailto:${e}` }));

  const contactChannels = [...baseChannels, ...extraPhoneChannels, ...extraEmailChannels];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar + DISC indicator */}
        <div className="relative flex-shrink-0">
          <OptimizedAvatar
            src={contact.avatar_url}
            alt={fullName}
            fallback={`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`}
            className="h-20 w-20 text-2xl"
          />
          {discProfile && (
            <div className={cn(
              'absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ring-2 ring-card',
              DISC_COLORS[discProfile] || 'bg-muted'
            )}>
              {discProfile}
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {contact.role_title && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {contact.role_title}
                  </span>
                )}
                {company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {company.name}
                  </span>
                )}
                {contact.role && ROLE_CONFIG[contact.role] && (
                  <Badge variant="outline" className="text-xs">
                    {ROLE_CONFIG[contact.role]}
                  </Badge>
                )}
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-shrink-0">
                <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            )}
          </div>

          {/* Metrics row */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Badge className={cn('text-xs font-medium', stage.color)}>
              {stage.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              <RelationshipScore score={contact.relationship_score || 0} size="sm" showMilestone />
            </div>
            <SentimentIndicator sentiment={(contact.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral'} size="sm" />
            <span className="text-xs text-muted-foreground">
              {interactionCount} interações
            </span>
            {contact.birthday && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(contact.birthday), "dd/MM/yyyy")}
              </span>
            )}
          </div>

          {/* Contact channels */}
          {contactChannels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <TooltipProvider>
                {contactChannels.map(({ icon: Icon, value, label, href }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="max-w-[120px] truncate">{value}</span>
                          {href?.startsWith('http') && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                        </a>
                        <button
                          onClick={() => copyToClipboard(value!, label)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {copiedField === label ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {contact.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
