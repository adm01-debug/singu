import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyHealthBadge } from '@/components/ui/company-health-score';
import { 
  Phone, Mail, Globe, MapPin, ExternalLink, DollarSign, Target, Shield, 
  Briefcase, FileText, Building2, Users, Hash, Calendar, Instagram, Linkedin,
  Facebook, Youtube, MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';
import type { CompanyPhone, CompanyEmail, CompanyAddress, CompanySocialMedia } from '@/hooks/useCompanyRelatedData';

type Company = Tables<'companies'>;
type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

export interface CompanyProfileCardProps {
  company: Company;
  contactCount: number;
  totalInteractions: number;
  avgRelationshipScore: number;
  phones?: CompanyPhone[];
  emails?: CompanyEmail[];
  addresses?: CompanyAddress[];
  socialMedia?: CompanySocialMedia[];
}

const platformIcon: Record<string, typeof Globe> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  website: Globe,
};

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
}

function formatPhone(num: string): string {
  const d = num.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return num;
}

export function CompanyProfileCard({ 
  company, contactCount, totalInteractions, avgRelationshipScore,
  phones = [], emails = [], addresses = [], socialMedia = [],
}: CompanyProfileCardProps) {
  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';
  const c = company as Record<string, unknown>;

  const primaryPhone = phones.find(p => p.is_primary) || phones[0];
  const primaryEmail = emails.find(e => e.is_primary) || emails[0];
  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
  const websiteEntry = socialMedia.find(s => s.plataforma === 'website');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ─── Main Profile Card ─── */}
      <Card className="overflow-visible">
        <CardContent className="pt-0">
          <div className="flex flex-col items-center -mt-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-strong border-4 border-card">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" loading="lazy" decoding="async" />
              ) : (
                safeInitial(company.name, 'E')
              )}
            </div>
            
            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              {c.nome_fantasia && c.nome_fantasia !== company.name && (
                <p className="text-sm text-muted-foreground">{String(c.nome_fantasia)}</p>
              )}
              <p className="text-muted-foreground">{company.industry}</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <CompanyHealthBadge financialHealth={healthStatus} />
                {c.status && (
                  <Badge variant={c.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                    {String(c.status).charAt(0).toUpperCase() + String(c.status).slice(1)}
                  </Badge>
                )}
                {c.is_customer && <Badge variant="outline" className="text-xs">Cliente</Badge>}
                {c.is_supplier && <Badge variant="outline" className="text-xs">Fornecedor</Badge>}
                {c.is_carrier && <Badge variant="outline" className="text-xs">Transportadora</Badge>}
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

            {/* ─── Contact Info (from normalized tables) ─── */}
            <div className="w-full space-y-3 mt-6 pt-6 border-t border-border">
              {primaryPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{formatPhone(primaryPhone.numero)}</span>
                  {primaryPhone.is_whatsapp && (
                    <Badge variant="outline" className="text-xs py-0">WhatsApp</Badge>
                  )}
                </div>
              )}
              {phones.length > 1 && (
                <div className="ml-7 space-y-1">
                  {phones.slice(1, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatPhone(p.numero)}</span>
                      <span className="text-muted-foreground/60">({p.phone_type?.replace('_', ' ')})</span>
                    </div>
                  ))}
                  {phones.length > 4 && (
                    <span className="text-xs text-muted-foreground/60">+{phones.length - 4} mais</span>
                  )}
                </div>
              )}

              {primaryEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{primaryEmail.email}</span>
                </div>
              )}
              {emails.length > 1 && (
                <div className="ml-7 space-y-1">
                  {emails.slice(1, 3).map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{e.email}</span>
                      <span className="text-muted-foreground/60">({e.email_type})</span>
                    </div>
                  ))}
                </div>
              )}

              {websiteEntry?.url && (
                <a 
                  href={websiteEntry.url.startsWith('http') ? websiteEntry.url : `https://${websiteEntry.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{websiteEntry.url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              )}

              {primaryAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {[
                      primaryAddress.logradouro,
                      primaryAddress.numero,
                      primaryAddress.bairro,
                      primaryAddress.cidade,
                      primaryAddress.estado,
                    ].filter(Boolean).join(', ')}
                    {primaryAddress.cep && ` - CEP ${primaryAddress.cep}`}
                  </span>
                </div>
              )}
            </div>

            {/* ─── Social Media ─── */}
            {socialMedia.filter(s => s.plataforma !== 'website').length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {socialMedia.filter(s => s.plataforma !== 'website').map(s => {
                    const Icon = platformIcon[s.plataforma] || Globe;
                    return (
                      <a
                        key={s.id}
                        href={s.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-md px-2 py-1"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {s.handle || s.plataforma}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-border">
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

      {/* ─── Dados Fiscais Card ─── */}
      {(c.cnpj || c.razao_social || c.situacao_rf || c.natureza_juridica_desc || c.capital_social) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Dados Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.cnpj && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">CNPJ</span>
                  <span className="text-sm font-mono">{formatCnpj(String(c.cnpj))}</span>
                </div>
              )}
              {c.razao_social && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Razão Social</span>
                  <span className="text-sm text-right">{String(c.razao_social)}</span>
                </div>
              )}
              {c.situacao_rf && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Situação RF</span>
                  <Badge variant={c.situacao_rf === 'ATIVA' ? 'default' : 'destructive'} className="text-xs">
                    {String(c.situacao_rf)}
                  </Badge>
                </div>
              )}
              {c.natureza_juridica_desc && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Nat. Jurídica</span>
                  <span className="text-sm text-right">{String(c.natureza_juridica_desc)}</span>
                </div>
              )}
              {c.porte_rf && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Porte</span>
                  <Badge variant="outline" className="text-xs">{String(c.porte_rf)}</Badge>
                </div>
              )}
              {c.capital_social && Number(c.capital_social) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capital Social</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(c.capital_social))}
                  </span>
                </div>
              )}
              {c.data_fundacao && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fundação</span>
                  <span className="text-sm">{String(c.data_fundacao)}</span>
                </div>
              )}
              {c.inscricao_estadual && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IE</span>
                  <span className="text-sm font-mono">{String(c.inscricao_estadual)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Estrutura & Classificação Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Informações do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.ramo_atividade && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ramo</span>
                <span className="text-sm">{String(c.ramo_atividade)}</span>
              </div>
            )}
            {c.nicho_cliente && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nicho</span>
                <Badge variant="outline" className="text-xs">{String(c.nicho_cliente)}</Badge>
              </div>
            )}
            {c.grupo_economico && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grupo Econômico</span>
                <span className="text-sm">{String(c.grupo_economico)}</span>
              </div>
            )}
            {c.tipo_cooperativa && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo Cooperativa</span>
                <Badge variant="outline" className="text-xs">{String(c.tipo_cooperativa)}</Badge>
              </div>
            )}
            {c.is_matriz !== null && c.is_matriz !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="text-xs">{c.is_matriz ? 'Matriz' : 'Filial'}</Badge>
              </div>
            )}
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

      {/* ─── Endereços extras ─── */}
      {addresses.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Endereços ({addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addresses.map((addr, idx) => (
                <div key={addr.id || idx} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
                    {addr.tipo || 'comercial'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {[addr.logradouro, addr.numero, addr.bairro, addr.cidade, addr.estado]
                      .filter(Boolean).join(', ')}
                    {addr.cep && ` - ${addr.cep}`}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
