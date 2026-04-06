import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  MoreVertical,
  Factory,
  Briefcase,
  ShoppingCart,
  Landmark,
  Cpu,
  HeartPulse,
  GraduationCap,
  
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/formatters';

/** Strip leading numeric prefix like "05 - " or "32 - " from company names for display */
function getAvatarInitial(name: string): string {
  const cleaned = name.replace(/^\d+\s*[-–—]\s*/, '');
  return (cleaned || name || 'E')[0].toUpperCase();
}

const industryIcons: Record<string, React.ElementType> = {
  'Tecnologia': Cpu,
  'Saúde': HeartPulse,
  'Educação': GraduationCap,
  'Varejo': ShoppingCart,
  'Financeiro': Landmark,
  'Indústria': Factory,
  'Serviços': Briefcase,
};

/* ── Health Score Ring with semantic colors ── */
const healthRingConfig: Record<string, { color: string; label: string; percent: number }> = {
  excellent: { color: 'text-success', label: 'Excelente', percent: 100 },
  good:      { color: 'text-success', label: 'Boa', percent: 85 },
  growing:   { color: 'text-success', label: 'Crescendo', percent: 75 },
  stable:    { color: 'text-info', label: 'Estável', percent: 60 },
  average:   { color: 'text-warning', label: 'Regular', percent: 45 },
  declining: { color: 'text-warning', label: 'Declínio', percent: 30 },
  poor:      { color: 'text-destructive', label: 'Ruim', percent: 15 },
  critical:  { color: 'text-destructive', label: 'Crítica', percent: 5 },
};

function HealthRing({ health, status }: { health: string | null; status: string | null }) {
  const config = healthRingConfig[health || ''];
  
  // Derive visual from status if no financial_health
  const derivedConfig = config || (
    status === 'active' || status === 'ativo'
      ? { color: 'text-success', label: 'Ativo', percent: 70 }
      : status === 'inactive' || status === 'inativo'
      ? { color: 'text-destructive', label: 'Inativo', percent: 15 }
      : status === 'prospect' || status === 'prospecto'
      ? { color: 'text-info', label: 'Prospecto', percent: 50 }
      : null
  );

  if (!derivedConfig) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
        <span className="text-xs">Sem dados</span>
      </div>
    );
  }

  // Simple dot indicator instead of SVG ring for cleaner look
  const dotColorMap: Record<string, string> = {
    'text-success': 'bg-success',
    'text-info': 'bg-info',
    'text-warning': 'bg-warning',
    'text-destructive': 'bg-destructive',
  };
  const dotColor = dotColorMap[derivedConfig.color] || 'bg-primary';

  return (
    <div className={cn('flex items-center gap-1.5', derivedConfig.color)}>
      <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      <span className="text-xs font-medium">{derivedConfig.label}</span>
    </div>
  );
}

/* ── Health badge ── */
const healthBadgeConfig: Record<string, { className: string; label: string }> = {
  excellent: { className: 'border-success/50 text-success bg-success/10', label: 'Excelente' },
  good:      { className: 'border-success/50 text-success bg-success/10', label: 'Boa' },
  growing:   { className: 'border-success/50 text-success bg-success/10', label: 'Crescendo' },
  stable:    { className: 'border-info/50 text-info bg-info/10', label: 'Estável' },
  average:   { className: 'border-warning/50 text-warning bg-warning/10', label: 'Regular' },
  declining: { className: 'border-warning/50 text-warning bg-warning/10', label: 'Em Declínio' },
  poor:      { className: 'border-destructive/50 text-destructive bg-destructive/10', label: 'Ruim' },
  critical:  { className: 'border-destructive/50 text-destructive bg-destructive/10', label: 'Crítica' },
};

/* ── Deterministic avatar color from name hash ── */
function hashStringToHue(str: string): number {
  // Use FNV-1a for better distribution with similar prefixes
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 360;
}

function getAvatarGradient(health: string | null, status: string | null, name?: string): string {
  if (health === 'excellent' || health === 'good' || health === 'growing') return 'from-success to-success/70';
  if (health === 'stable') return 'from-info to-primary';
  if (health === 'average') return 'from-warning to-warning/70';
  if (health === 'declining' || health === 'poor' || health === 'critical') return 'from-destructive to-destructive/70';
  if (status === 'inactive' || status === 'inativo') return 'from-destructive/80 to-destructive/60';
  // For active/prospect/unknown — use deterministic color from name
  return 'from-primary to-primary/70';
}

function getAvatarStyle(health: string | null, status: string | null, name: string): React.CSSProperties | undefined {
  // Only apply custom color when there's no health-based color or inactive status
  if (health && healthRingConfig[health]) return undefined;
  if (status === 'inactive' || status === 'inativo') return undefined;
  // Deterministic color from company name for visual variety
  const hue = hashStringToHue(name);
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 55%, 45%), hsl(${(hue + 40) % 360}, 50%, 35%))`,
  };
}

interface CompanyCardWithContextProps {
  company: Company;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  contactCount?: number;
  lastInteractionDays?: number | null;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onUpdate: (id: string, data: Partial<Company>) => Promise<Company | null>;
}

export function CompanyCardWithContext({
  company,
  index,
  isSelected,
  isHighlighted,
  selectionMode,
  contactCount = 0,
  lastInteractionDays,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
}: CompanyCardWithContextProps) {
  const IndustryIcon = industryIcons[company.industry || ''] || Building2;
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  
  const { prefetchCompany } = usePrefetch();
  const prefetchFn = useCallback(() => {
    prefetchCompany(company.id);
  }, [company.id, prefetchCompany]);
  
  const hoverProps = usePrefetchOnHover(prefetchFn, 150);

  const handleInlineSave = async (field: string, value: string): Promise<boolean> => {
    try {
      if (field === 'name') {
        await onUpdate(company.id, { name: value });
      } else if (field === 'email') {
        await onUpdate(company.id, { email: value });
      } else if (field === 'phone') {
        await onUpdate(company.id, { phone: value });
      }
      return true;
    } catch {
      return false;
    }
  };

  const displayName = toTitleCase(company.name);
  const hasSegment = !!company.industry;
  const healthConfig = healthBadgeConfig[company.financial_health || ''];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ scale: 1.01, y: -2 }}
      {...hoverProps}
    >
      <QuickActionsMenu
        entityType="company"
        entityId={company.id}
        entityName={company.name}
        email={company.email}
        phone={company.phone}
        onEdit={() => onEdit(company)}
        onDelete={() => onDelete(company)}
      >
        <Card className={cn(
          "h-full card-hover group cursor-pointer transition-all duration-200 overflow-hidden",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
          isHighlighted && "ring-2 ring-primary",
          isSelected && "bg-primary/5"
        )}>
          {/* Status color bar — uses deterministic color for visual variety */}
          {(() => {
            const hue = hashStringToHue(company.name);
            const barStyle = company.is_customer 
              ? { background: `linear-gradient(90deg, hsl(var(--success)), hsl(var(--success) / 0.5))` }
              : { background: `linear-gradient(90deg, hsl(${hue}, 50%, 45%), hsl(${(hue + 60) % 360}, 45%, 40%))` };
            return <div className="h-1.5 w-full" style={barStyle} />;
          })()}
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                {selectionMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(company.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                
                <Link to={`/empresas/${company.id}`} className="flex items-center gap-3 min-w-0">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={displayName} 
                      className="w-12 h-12 rounded-xl object-cover shadow-soft"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div 
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold text-lg shadow-soft',
                      getAvatarGradient(company.financial_health, company.status, company.name),
                      company.logo_url && 'hidden'
                    )}
                    style={getAvatarStyle(company.financial_health, company.status, company.name)}
                  >
                    {getAvatarInitial(company.name)}
                  </div>
                  <div className="min-w-0">
                    {isInlineEditing ? (
                      <InlineEdit
                        value={company.name}
                        onSave={(v) => handleInlineSave('name', v)}
                        className="font-semibold text-foreground"
                      />
                    ) : (
                      <h3 
                        className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2"
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsInlineEditing(true);
                        }}
                      >
                        {displayName}
                      </h3>
                    )}
                    {hasSegment && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <IndustryIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{company.industry}</span>
                      </div>
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] font-semibold mt-1 w-fit',
                        company.is_customer 
                          ? 'border-success/40 text-success bg-success/10' 
                          : 'border-primary/40 text-primary bg-primary/10'
                      )}
                    >
                      {company.is_customer ? 'Cliente' : 'Prospect'}
                    </Badge>
                  </div>
                </Link>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(company); }}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.preventDefault(); onDelete(company); }}
                    className="text-destructive"
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link to={`/empresas/${company.id}`}>
              <div className="space-y-2 mb-4">
                {(company.city || company.state) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{[company.city, company.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
              </div>

              {healthConfig && (
                <div className="mb-4">
                  <Badge variant="outline" className={healthConfig.className}>
                    {healthConfig.label}
                  </Badge>
                </div>
              )}

              {company.tags && company.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {company.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {company.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{company.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Inline Metrics */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {contactCount} {contactCount === 1 ? 'contato' : 'contatos'}
                </span>
                {lastInteractionDays !== null && lastInteractionDays !== undefined && (
                  <span className={lastInteractionDays > 14 ? 'text-warning' : lastInteractionDays > 30 ? 'text-destructive' : ''}>
                    {lastInteractionDays === 0 ? 'Interação hoje' : `${lastInteractionDays}d sem interação`}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <HealthRing health={company.financial_health} status={company.status} />
                {(() => {
                  const daysSince = Math.floor((Date.now() - new Date(company.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                  const urgencyColor = daysSince <= 3 ? 'text-success' : daysSince <= 7 ? 'text-muted-foreground' : daysSince <= 14 ? 'text-warning' : 'text-destructive';
                  return (
                    <span className={`text-xs ${urgencyColor}`}>
                      {formatDistanceToNow(new Date(company.updated_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  );
                })()}
              </div>
            </Link>
          </CardContent>
        </Card>
      </QuickActionsMenu>
    </motion.div>
  );
}
