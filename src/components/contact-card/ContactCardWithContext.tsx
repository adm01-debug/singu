import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MoreVertical,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { PriorityIndicator } from '@/components/ui/priority-indicator';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionsMenu } from '@/components/context-menu/QuickActionsMenu';
import { InlineEdit } from '@/components/inline-edit/InlineEdit';
import { usePrefetch, usePrefetchOnHover } from '@/hooks/usePrefetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contact } from '@/hooks/useContacts';
import type { ContactRole, SentimentType, DISCProfile, RelationshipStage } from '@/types';
import { cn } from '@/lib/utils';
import { formatContactName, toTitleCase } from '@/lib/formatters';

/** Subtle dot color for stage — Discord/Vercel flat style */
function getStageDotColor(stage?: string | null): string {
  switch (stage) {
    case 'advocate':
    case 'loyal_customer':
    case 'customer':
      return 'bg-emerald-500';
    case 'negotiation':
      return 'bg-violet-500';
    case 'opportunity':
      return 'bg-amber-500';
    case 'qualified_lead':
      return 'bg-blue-500';
    case 'prospect':
      return 'bg-muted-foreground';
    case 'at_risk':
      return 'bg-destructive';
    case 'lost':
      return 'bg-muted-foreground/50';
    default:
      return 'bg-muted-foreground/40';
  }
}

interface ContactCardWithContextProps {
  contact: Contact;
  companyName: string | null;
  lastInteraction: string | null;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  viewMode: 'grid' | 'list';
}

export function ContactCardWithContext({
  contact,
  companyName,
  lastInteraction,
  index,
  isSelected,
  isHighlighted,
  selectionMode,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  viewMode,
}: ContactCardWithContextProps) {
  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Prefetch on hover
  const { prefetchContact, prefetchInteractions } = usePrefetch();
  const prefetchFn = useCallback(() => {
    prefetchContact(contact.id);
    prefetchInteractions(contact.id);
  }, [contact.id, prefetchContact, prefetchInteractions]);
  
  const hoverProps = usePrefetchOnHover(prefetchFn, 150);

  const handleInlineSave = async (field: string, value: string): Promise<boolean> => {
    try {
      if (field === 'name') {
        const parts = value.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await onUpdate(contact.id, { first_name: firstName, last_name: lastName });
      } else if (field === 'email') {
        await onUpdate(contact.id, { email: value });
      } else if (field === 'role_title') {
        await onUpdate(contact.id, { role_title: value });
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
        {...hoverProps}
      >
        <QuickActionsMenu
          entityType="contact"
          entityId={contact.id}
          entityName={`${contact.first_name} ${contact.last_name}`}
          email={contact.email}
          phone={contact.phone}
          whatsapp={contact.whatsapp}
          linkedin={contact.linkedin}
          onEdit={() => onEdit(contact)}
          onDelete={() => onDelete(contact)}
        >
          <Card className={cn(
            "h-full group cursor-pointer overflow-hidden relative transition-colors duration-150",
            "border border-border/30 hover:border-border/60",
            "bg-card/60",
            isHighlighted && "ring-1 ring-primary/50",
            isSelected && "bg-primary/5 border-primary/30"
          )}>
            {/* Selection Checkbox */}
            {selectionMode && (
              <div className="absolute top-3 left-3 z-20">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Priority indicator — subtle dot, not bar */}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-3 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white dark:bg-background/80 dark:hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(contact)}
                  className="text-destructive"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
              <Link to={`/contatos/${contact.id}`}>
              <CardContent className="p-0">
                {/* Stage dot indicator */}

                <div className="px-4 pt-4 pb-3.5">
                  {/* Row 1: Avatar + Name + Score */}
                  <div className="flex items-start gap-2.5">
                    <OptimizedAvatar 
                      src={contact.avatar_url || undefined}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                      size="md"
                      className="w-10 h-10 border-2 border-primary/15 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {isInlineEditing ? (
                        <InlineEdit
                          value={`${contact.first_name} ${contact.last_name}`}
                          onSave={(v) => handleInlineSave('name', v)}
                          className="font-semibold text-foreground text-sm"
                        />
                      ) : (() => {
                        const displayName = formatContactName(contact.first_name, contact.last_name);
                        const isGenericName = displayName === 'Contato';
                        return isGenericName ? (
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer group/name"
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsInlineEditing(true);
                            }}
                          >
                            <span className="text-sm font-medium text-muted-foreground/60 italic group-hover/name:text-primary/70 transition-colors">
                              Adicionar nome
                            </span>
                            <span className="text-xs text-primary/50 opacity-0 group-hover/name:opacity-100 transition-opacity">✏️</span>
                          </div>
                        ) : (
                          <h3 
                            className="font-semibold text-sm leading-tight transition-colors cursor-pointer text-foreground group-hover:text-primary"
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsInlineEditing(true);
                            }}
                          >
                            {displayName}
                          </h3>
                        );
                      })()}
                      {/* Subtitle: role_title or company */}
                      {(contact.role_title || companyName) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {contact.role_title && companyName 
                            ? `${contact.role_title} · ${toTitleCase(companyName)}`
                            : contact.role_title || (companyName ? toTitleCase(companyName) : '')
                          }
                        </p>
                      )}
                      {/* Company row (only if role_title was shown and we also have company) */}
                      {!contact.role_title && companyName && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span className="text-xs text-muted-foreground truncate">{toTitleCase(companyName)}</span>
                        </div>
                      )}
                    </div>
                    {/* Compact score */}
                    <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                  </div>

                  {/* Row 2: Badges — compact, single line */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                    {behavior?.discProfile && (
                      <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                    )}
                    {/* Timestamp pushed to right */}
                    {(() => {
                      const daysSince = Math.floor((Date.now() - new Date(contact.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                      const urgencyColor = daysSince <= 7 ? 'text-muted-foreground' : daysSince <= 14 ? 'text-warning' : 'text-destructive';
                      return (
                        <span className={`ml-auto text-[10px] tabular-nums ${urgencyColor}`}>
                          {formatDistanceToNow(new Date(contact.updated_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Row 3: Quick actions — visible on hover */}
                  {(contact.email || contact.phone || contact.whatsapp) && (
                    <div className="flex items-center gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title={`Email: ${contact.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title={`Ligar: ${contact.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {contact.whatsapp && (
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                          title={`WhatsApp: ${contact.whatsapp}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground/50">Ações rápidas</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        </QuickActionsMenu>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ x: 4 }}
      {...hoverProps}
    >
      <QuickActionsMenu
        entityType="contact"
        entityId={contact.id}
        entityName={`${contact.first_name} ${contact.last_name}`}
        email={contact.email}
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        linkedin={contact.linkedin}
        onEdit={() => onEdit(contact)}
        onDelete={() => onDelete(contact)}
      >
        <Card className={cn(
          "cursor-pointer group overflow-hidden relative transition-colors duration-150",
          "border border-border/30 hover:border-border/60 hover:bg-muted/20",
          "bg-card/60",
          isHighlighted && "ring-1 ring-primary/50",
          isSelected && "bg-primary/5 border-primary/30"
        )}>
          <CardContent className="p-4 pl-4">
            <div className="flex items-center gap-4">
              {/* Selection Checkbox */}
              {selectionMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <Link to={`/contatos/${contact.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative">
                  <OptimizedAvatar 
                    src={contact.avatar_url || undefined}
                    alt={`${contact.first_name} ${contact.last_name}`}
                    fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                    size="md"
                    className="w-12 h-12 border-2 border-primary/20"
                  />
                  <div className="absolute -top-1 -right-1">
                    <PriorityIndicator 
                      relationshipScore={contact.relationship_score || 0}
                      lastInteractionDate={lastInteraction}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const displayName = formatContactName(contact.first_name, contact.last_name);
                      const isGenericName = displayName === 'Contato';
                      return isGenericName ? (
                        <span className="font-medium text-muted-foreground/60 italic truncate">
                          Adicionar nome ✏️
                        </span>
                      ) : (
                        <h3 className="font-semibold truncate text-foreground">
                          {displayName}
                        </h3>
                      );
                    })()}
                    <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                    {/* Desktop: show all badges inline */}
                    <span className="hidden sm:contents">
                      {behavior?.discProfile && (
                        <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                      )}
                      <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} size="sm" />
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="truncate">{contact.role_title || contact.email || ''}</span>
                    {companyName && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate">{toTitleCase(companyName)}</span>
                      </>
                    )}
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                    </span>
                  </div>
                </div>

                <RelationshipScore score={contact.relationship_score || 0} size="sm" />
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(contact)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(contact)}
                    className="text-destructive"
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </QuickActionsMenu>
    </motion.div>
  );
}
