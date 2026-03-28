import { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MoreVertical 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { PriorityIndicator, PriorityBar } from '@/components/ui/priority-indicator';
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

export const ContactCardWithContext = memo(function ContactCardWithContext({
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

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
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
            "h-full card-hover group cursor-pointer overflow-hidden relative",
            isHighlighted && "ring-2 ring-primary",
            isSelected && "bg-primary/5"
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

            {/* Priority Bar at the top */}
            <PriorityBar 
              relationshipScore={contact.relationship_score || 0} 
              lastInteractionDate={lastInteraction}
              className="absolute top-0 left-0 right-0 z-10"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white dark:bg-background/80 dark:hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Mais opções"
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
                {/* Header with gradient */}
                <div className="h-16 bg-gradient-primary relative mt-1">
                  <div className="absolute -bottom-8 left-5">
                    <div className="relative">
                      <OptimizedAvatar 
                        src={contact.avatar_url || undefined}
                        alt={`${contact.first_name} ${contact.last_name}`}
                        fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                        size="lg"
                        className="w-16 h-16 border-4 border-card shadow-medium"
                      />
                      <div className="absolute -top-1 -right-1">
                        <PriorityIndicator 
                          relationshipScore={contact.relationship_score || 0}
                          lastInteractionDate={lastInteraction}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-10">
                    <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                  </div>
                </div>

                <div className="pt-10 px-5 pb-5">
                  <div className="mb-3">
                    {isInlineEditing ? (
                      <InlineEdit
                        value={`${contact.first_name} ${contact.last_name}`}
                        onSave={(v) => handleInlineSave('name', v)}
                        className="font-semibold text-foreground"
                      />
                    ) : (
                      <h3 
                        className="font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsInlineEditing(true);
                        }}
                      >
                        {contact.first_name} {contact.last_name}
                      </h3>
                    )}
                    <p className="text-sm text-muted-foreground">{contact.role_title || 'Sem cargo'}</p>
                  </div>

                  {companyName && (
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{companyName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                    {behavior?.discProfile && (
                      <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                    )}
                    <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} size="sm" />
                  </div>

                  <div className="mb-4">
                    <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <div className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(contact.updated_at), { locale: ptBR, addSuffix: true })}
                    </div>
                  </div>
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
          "card-hover cursor-pointer group overflow-hidden relative",
          isHighlighted && "ring-2 ring-primary",
          isSelected && "bg-primary/5"
        )}>
          {/* Priority Bar on left side */}
          <div className="absolute left-0 top-0 bottom-0 w-1">
            <PriorityBar 
              relationshipScore={contact.relationship_score || 0} 
              lastInteractionDate={lastInteraction}
              className="h-full w-full rounded-none"
            />
          </div>
          <CardContent className="p-4 pl-5">
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
                    <h3 className="font-semibold text-foreground truncate">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                    {behavior?.discProfile && (
                      <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                    )}
                    <SentimentIndicator sentiment={(contact.sentiment as SentimentType) || 'neutral'} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{contact.role_title || 'Sem cargo'}</span>
                    {companyName && (
                      <>
                        <span>•</span>
                        <span>{companyName}</span>
                      </>
                    )}
                    <span>•</span>
                    <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
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
                    aria-label="Mais opções"
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
});
