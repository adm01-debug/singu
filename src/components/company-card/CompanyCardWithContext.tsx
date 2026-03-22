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
  TrendingUp,
  TrendingDown,
  Minus,
  Factory,
  Briefcase,
  ShoppingCart,
  Landmark,
  Cpu,
  HeartPulse,
  GraduationCap
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

const industryIcons: Record<string, React.ElementType> = {
  'Tecnologia': Cpu,
  'Saúde': HeartPulse,
  'Educação': GraduationCap,
  'Varejo': ShoppingCart,
  'Financeiro': Landmark,
  'Indústria': Factory,
  'Serviços': Briefcase,
};

interface CompanyCardWithContextProps {
  company: Company;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
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
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
}: CompanyCardWithContextProps) {
  const IndustryIcon = industryIcons[company.industry || ''] || Building2;
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  
  // Prefetch on hover
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
    } catch (error) {
      return false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
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
          "h-full card-hover group cursor-pointer",
          isHighlighted && "ring-2 ring-primary",
          isSelected && "bg-primary/5"
        )}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Selection Checkbox */}
                {selectionMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(company.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                
                <Link to={`/empresas/${company.id}`} className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name} 
                      className="w-12 h-12 rounded-xl object-cover shadow-glow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow ${company.logo_url ? 'hidden' : ''}`}>
                    {(company.name || 'E')[0]}
                  </div>
                  <div>
                    {isInlineEditing ? (
                      <InlineEdit
                        value={company.name}
                        onSave={(v) => handleInlineSave('name', v)}
                        className="font-semibold text-foreground"
                      />
                    ) : (
                      <h3 
                        className="font-semibold text-foreground group-hover:text-primary transition-colors"
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsInlineEditing(true);
                        }}
                      >
                        {company.name}
                      </h3>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <IndustryIcon className="w-3.5 h-3.5" />
                      <span>{company.industry || 'Sem segmento'}</span>
                    </div>
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
                    <span>{[company.city, company.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
              </div>

              {company.financial_health && company.financial_health !== 'unknown' && (
                <div className="mb-4">
                  <Badge 
                    variant="outline" 
                    className={
                      company.financial_health === 'excellent' || company.financial_health === 'good'
                        ? 'border-green-500/50 text-green-600 bg-green-500/10'
                        : company.financial_health === 'average'
                        ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
                        : 'border-red-500/50 text-red-600 bg-red-500/10'
                    }
                  >
                    {company.financial_health === 'excellent' ? 'Excelente' :
                     company.financial_health === 'good' ? 'Boa' :
                     company.financial_health === 'average' ? 'Regular' :
                     company.financial_health === 'poor' ? 'Ruim' : ''}
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

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>--</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(company.updated_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </QuickActionsMenu>
    </motion.div>
  );
}
