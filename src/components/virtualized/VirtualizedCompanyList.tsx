import { memo, useCallback } from 'react';
import { List, RowComponentProps } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CompanyHealthBadge } from '@/components/ui/company-health-score';
import { Building2, Globe, MapPin, Users } from 'lucide-react';
import { CSSProperties } from 'react';

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  employee_count?: string | null;
  logo_url?: string | null;
  financial_health?: string | null;
  tags?: string[] | null;
}

interface VirtualizedCompanyListProps {
  companies: Company[];
  height: number;
  onCompanyClick?: (companyId: string) => void;
  className?: string;
}

interface RowProps {
  companies: Company[];
  onCompanyClick: (companyId: string) => void;
}

const CompanyRow = memo(({ 
  index, 
  style, 
  companies, 
  onCompanyClick 
}: { 
  index: number; 
  style: CSSProperties; 
  companies: Company[]; 
  onCompanyClick: (companyId: string) => void;
}) => {
  const company = companies[index];

  if (!company) return null;

  const initials = company.name.slice(0, 2).toUpperCase();

  return (
    <div style={style} className="px-2 py-1">
      <Card
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
        onClick={() => onCompanyClick(company.id)}
      >
        <div className="flex items-center gap-4 p-4 h-full">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-sm text-muted-foreground truncate">
                {company.industry}
              </p>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 text-sm text-muted-foreground">
            {(company.city || company.state) && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {[company.city, company.state].filter(Boolean).join(', ')}
              </span>
            )}
            {company.employee_count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.employee_count}
              </span>
            )}
            {company.website && (
              <span className="flex items-center gap-1 truncate max-w-32">
                <Globe className="h-3 w-3" />
                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {company.financial_health && (
              <CompanyHealthBadge 
                financialHealth={company.financial_health as 'growing' | 'stable' | 'cutting' | 'unknown'} 
                size="sm"
              />
            )}
            {company.tags && company.tags.length > 0 && (
              <div className="flex gap-1">
                {company.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {company.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{company.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

CompanyRow.displayName = 'CompanyRow';

// Row component wrapper for react-window
function RowComponent(props: RowComponentProps<RowProps>) {
  const { index, style, companies, onCompanyClick } = props;
  return (
    <CompanyRow 
      index={index} 
      style={style} 
      companies={companies} 
      onCompanyClick={onCompanyClick} 
    />
  );
}

export function VirtualizedCompanyList({
  companies,
  height,
  onCompanyClick,
  className,
}: VirtualizedCompanyListProps) {
  const navigate = useNavigate();

  const handleCompanyClick = useCallback((companyId: string) => {
    if (onCompanyClick) {
      onCompanyClick(companyId);
    } else {
      navigate(`/empresas/${companyId}`);
    }
  }, [navigate, onCompanyClick]);

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nenhuma empresa encontrada
      </div>
    );
  }

  return (
    <List<RowProps>
      className={className}
      style={{ height, width: '100%' }}
      rowCount={companies.length}
      rowHeight={88}
      rowComponent={RowComponent}
      rowProps={{
        companies,
        onCompanyClick: handleCompanyClick,
      }}
      overscanCount={5}
    />
  );
}

export default VirtualizedCompanyList;
