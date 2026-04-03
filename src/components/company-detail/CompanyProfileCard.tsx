import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyHealthBadge } from '@/components/ui/company-health-score';
import { Phone, Mail, Globe, MapPin, ExternalLink, DollarSign, Target, Shield, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;
type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

interface CompanyProfileCardProps {
  company: Company;
  contactCount: number;
  totalInteractions: number;
  avgRelationshipScore: number;
}

export function CompanyProfileCard({ company, contactCount, totalInteractions, avgRelationshipScore }: CompanyProfileCardProps) {
  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-visible">
        <CardContent className="pt-0">
          <div className="flex flex-col items-center -mt-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-strong border-4 border-card">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                safeInitial(company.name, 'E')
              )}
            </div>
            
            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">{company.industry}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <CompanyHealthBadge financialHealth={healthStatus} />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{contactCount}</div>
                <div className="text-xs text-muted-foreground">Contatos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalInteractions}</div>
                <div className="text-xs text-muted-foreground">Interações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{avgRelationshipScore}%</div>
                <div className="text-xs text-muted-foreground">Score Médio</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="w-full space-y-3 mt-6 pt-6 border-t border-border">
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{company.email}</span>
                </div>
              )}
              {company.website && (
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{company.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {(company.city || company.state) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[company.address, company.city, company.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="w-full mt-6 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {company.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Informações do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.employee_count && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Funcionários</span>
                <Badge variant="outline">{company.employee_count}</Badge>
              </div>
            )}
            {company.annual_revenue && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Faturamento</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {company.annual_revenue}
                </Badge>
              </div>
            )}
            {company.challenges && company.challenges.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Target className="w-3 h-3" />
                  Desafios
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {company.challenges.map((challenge, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{challenge}</Badge>
                  ))}
                </div>
              </div>
            )}
            {company.competitors && company.competitors.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3" />
                  Concorrentes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {company.competitors.map((competitor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{competitor}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
