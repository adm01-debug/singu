/**
 * Componente de Card de Interação otimizado com React.memo
 * Evita re-renders desnecessários em listas grandes
 */

import { memo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Video, 
  Users, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { cn } from '@/lib/utils';
import type { Interaction } from '@/hooks/useInteractions';
import type { SentimentType } from '@/types';

interface InteractionCardMemoProps {
  interaction: Interaction;
  contactName: string;
  companyName?: string;
  index: number;
  isHighlighted?: boolean;
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (interaction: Interaction) => void;
  viewMode?: 'grid' | 'list';
}

const TYPE_CONFIG = {
  call: { icon: Phone, label: 'Ligação', color: 'text-blue-500 bg-blue-500/10' },
  email: { icon: Mail, label: 'Email', color: 'text-purple-500 bg-purple-500/10' },
  meeting: { icon: Users, label: 'Reunião', color: 'text-green-500 bg-green-500/10' },
  video_call: { icon: Video, label: 'Videochamada', color: 'text-orange-500 bg-orange-500/10' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-500 bg-emerald-500/10' },
  other: { icon: Calendar, label: 'Outro', color: 'text-muted-foreground bg-muted' },
} as const;

// Função de comparação customizada
function arePropsEqual(
  prevProps: InteractionCardMemoProps,
  nextProps: InteractionCardMemoProps
): boolean {
  if (
    prevProps.isHighlighted !== nextProps.isHighlighted ||
    prevProps.index !== nextProps.index ||
    prevProps.contactName !== nextProps.contactName ||
    prevProps.companyName !== nextProps.companyName ||
    prevProps.viewMode !== nextProps.viewMode
  ) {
    return false;
  }

  if (prevProps.interaction !== nextProps.interaction) {
    const prev = prevProps.interaction;
    const next = nextProps.interaction;
    
    if (
      prev.id !== next.id ||
      prev.title !== next.title ||
      prev.type !== next.type ||
      prev.content !== next.content ||
      prev.sentiment !== next.sentiment ||
      prev.created_at !== next.created_at ||
      prev.duration !== next.duration ||
      prev.follow_up_required !== next.follow_up_required ||
      prev.follow_up_date !== next.follow_up_date
    ) {
      return false;
    }
    
    // Comparar arrays de tags
    const prevTags = prev.tags ?? [];
    const nextTags = next.tags ?? [];
    if (prevTags.length !== nextTags.length || !prevTags.every((t, i) => t === nextTags[i])) {
      return false;
    }
  }

  return true;
}

/**
 * InteractionCardMemo - Versão otimizada do InteractionCard com memoização
 */
export const InteractionCardMemo = memo(function InteractionCardMemo({
  interaction,
  contactName,
  companyName,
  index,
  isHighlighted = false,
  onEdit,
  onDelete,
  viewMode = 'list',
}: InteractionCardMemoProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(interaction);
  }, [onEdit, interaction]);

  const handleDelete = useCallback(() => {
    onDelete?.(interaction);
  }, [onDelete, interaction]);

  const config = TYPE_CONFIG[interaction.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.other;
  const Icon = config.icon;

  const formattedDate = format(new Date(interaction.created_at), "d 'de' MMM 'às' HH:mm", {
    locale: ptBR,
  });

  const isCompact = viewMode === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          isHighlighted && 'ring-2 ring-primary shadow-lg',
          isCompact ? 'p-3' : ''
        )}
      >
        {isCompact ? (
          // Layout compacto para lista
          <div className="flex items-center gap-4">
            <div className={cn('p-2 rounded-lg shrink-0', config.color)}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{interaction.title}</h4>
                {interaction.sentiment && (
                  <SentimentIndicator sentiment={interaction.sentiment as SentimentType} size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {contactName}{companyName ? ` · ${companyName}` : ''} · {formattedDate}
              </p>
            </div>

            {interaction.duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {interaction.duration}min
              </div>
            )}

            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          // Layout completo para grid
          <>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{interaction.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {contactName}{companyName ? ` · ${companyName}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {interaction.sentiment && (
                    <SentimentIndicator sentiment={interaction.sentiment as SentimentType} />
                  )}
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {interaction.content && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {interaction.content}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>{formattedDate}</span>
                  {interaction.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {interaction.duration}min
                    </span>
                  )}
                </div>
                
                {interaction.follow_up_required && (
                  <Badge variant="outline" className="text-xs">
                    Follow-up pendente
                  </Badge>
                )}
              </div>

              {interaction.tags && interaction.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  {interaction.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {interaction.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{interaction.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </motion.div>
  );
}, arePropsEqual);

export default InteractionCardMemo;
