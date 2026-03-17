import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { queryExternalData } from '@/lib/externalData';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Building2, 
  Phone, 
  Mail,
  Globe,
  MapPin,
  Users,
  Edit,
  Plus,
  MessageSquare,
  DollarSign,
  Target,
  Shield,
  ExternalLink,
  BarChart3,
  Briefcase,
  Network,
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { ContactForm } from '@/components/forms/ContactForm';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { DISCBadge } from '@/components/ui/disc-badge';
import { CompanyHealthScore, CompanyHealthBadge } from '@/components/ui/company-health-score';
import { StakeholderMap } from '@/components/stakeholders/StakeholderMap';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import type { ContactRole, SentimentType, DISCProfile, RelationshipStage } from '@/types';
import { logger } from '@/lib/logger';

type Company = Tables<'companies'>;
type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

const interactionIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-pink-100 text-pink-600',
};

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

const EmpresaDetalhe = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { trackView } = useRecentlyViewed();
  const { records: luxRecords, latestRecord: luxRecord, loading: luxLoading, triggering: luxTriggering, triggerLux } = useLuxIntelligence('company', id);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch company from external DB
      const { data: companyResult, error: companyError } = await queryExternalData<any>({
        table: 'companies',
        filters: [{ type: 'eq', column: 'id', value: id }],
      });

      if (companyError) throw companyError;
      const raw = Array.isArray(companyResult) ? (companyResult.at(0) ?? null) : null;
      const companyData = raw ? {
        ...raw,
        name: raw.nome_crm || raw.nome_fantasia || raw.razao_social || raw.name || 'Sem nome',
        industry: raw.ramo_atividade || raw.industry || null,
        city: raw.city || null,
        state: raw.state || null,
        phone: raw.phone || null,
        email: raw.email || null,
        tags: raw.tags_array || raw.tags || [],
        challenges: raw.challenges || [],
        competitors: raw.competitors || [],
      } as Company : null;
      setCompany(companyData);

      if (companyData && id) {
        trackView({
          id,
          type: 'company',
          name: companyData.name,
          subtitle: companyData.industry || undefined,
          avatarUrl: companyData.logo_url || undefined,
        });
      }

      if (companyData) {
        // Fetch contacts for this company from external DB
        const { data: contactsResult, error: contactsError } = await queryExternalData<Contact>({
          table: 'contacts',
          filters: [{ type: 'eq', column: 'company_id', value: id }],
          order: { column: 'relationship_score', ascending: false },
        });

        if (contactsError) throw contactsError;
        // Normalize external contact data
        const normalizedContacts = (contactsResult || []).map((c: any) => ({
          ...c,
          first_name: c.first_name || c.nome || 'Sem',
          last_name: c.last_name || c.sobrenome || 'nome',
          tags: c.tags || [],
          hobbies: c.hobbies || [],
          interests: c.interests || [],
        })) as Contact[];
        setContacts(normalizedContacts);

        // Fetch interactions from local DB (these are user-created)
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('interactions')
          .select('*')
          .eq('company_id', id!)
          .order('created_at', { ascending: false })
          .limit(20);

        if (interactionsError) throw interactionsError;
        setInteractions(interactionsData || []);
      }
    } catch (error) {
      logger.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user, trackView]);

  useEffect(() => {
    if (id && user) {
      fetchCompanyData();
    }
  }, [id, user, fetchCompanyData]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!company) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
          <p className="text-muted-foreground mb-4">A empresa que você procura não existe ou foi removida.</p>
          <Link to="/empresas">
            <Button>Voltar para Empresas</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';

  // Calculate aggregated stats
  const avgRelationshipScore = contacts.length > 0 
    ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / contacts.length)
    : 0;

  const totalInteractions = interactions.length;
  const positiveInteractions = interactions.filter(i => i.sentiment === 'positive').length;
  const positiveInteractionsRatio = totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;
  const pendingFollowUps = interactions.filter(i => i.follow_up_required && !i.follow_up_date).length;
  
  // Calculate days since last interaction
  const lastInteractionDate = interactions.length > 0 
    ? new Date(interactions.at(0)?.created_at || Date.now()) 
    : null;
  const daysSinceLastInteraction = lastInteractionDate 
    ? Math.floor((Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return (
    <>
    <AppLayout>
      <div className="min-h-screen pt-2 md:pt-4">
        {/* Breadcrumbs */}
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link to="/empresas" className="transition-colors hover:text-foreground">Empresas</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground">{company.name}</li>
            </ol>
          </nav>
        </div>
        
        {/* Header with gradient background */}
        <div className="h-56 bg-gradient-primary relative z-0 overflow-hidden rounded-2xl mx-4 md:mx-6 mt-2">
          <div className="absolute top-4 left-4">
            <Link to="/empresas">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LuxButton
              onClick={() => triggerLux({
                name: company.name,
                cnpj: (company as Record<string, unknown>).cnpj as string | undefined,
                website: company.website,
                industry: company.industry,
                city: company.city,
                state: company.state,
              })}
              loading={luxTriggering}
              processing={luxRecord?.status === 'processing'}
              variant="header"
            />
            <Button
              className="bg-white/10 backdrop-blur hover:bg-white/20 text-white border-0"
              onClick={() => setIsAddContactOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Contato
            </Button>
            <Button
              className="bg-white/10 backdrop-blur hover:bg-white/20 text-white border-0"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="relative z-10 px-4 md:px-6 -mt-12 md:-mt-16 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-visible">
                <CardContent className="pt-0">
                  <div className="flex flex-col items-center -mt-8">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl shadow-strong border-4 border-card">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        safeInitial(company.name, 'E')
                      )}
                    </div>
                    
                    <div className="text-center mt-4">
                      <h1 className="text-2xl font-bold text-foreground">
                        {company.name}
                      </h1>
                      <p className="text-muted-foreground">{company.industry}</p>
                      
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <CompanyHealthBadge financialHealth={healthStatus} />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{contacts.length}</div>
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
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
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
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {challenge}
                            </Badge>
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
                            <Badge key={idx} variant="outline" className="text-xs">
                              {competitor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Health Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <CompanyHealthScore
                  financialHealth={healthStatus}
                  contactCount={contacts.length}
                  avgRelationshipScore={avgRelationshipScore}
                  totalInteractions={totalInteractions}
                  positiveInteractionsRatio={positiveInteractionsRatio}
                  pendingFollowUps={pendingFollowUps}
                  daysSinceLastInteraction={daysSinceLastInteraction}
                />
              </motion.div>

              <Tabs defaultValue="contacts" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="contacts" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Contatos ({contacts.length})</span>
                    <span className="sm:hidden">{contacts.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="stakeholders" className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <span className="hidden sm:inline">Stakeholders</span>
                  </TabsTrigger>
                  <TabsTrigger value="interactions" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Histórico ({totalInteractions})</span>
                    <span className="sm:hidden">{totalInteractions}</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="lux" className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Lux</span>
                  </TabsTrigger>
                </TabsList>

                {/* Contacts Tab */}
                <TabsContent value="contacts" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {contacts.length > 0 ? (
                      <div className="space-y-3">
                        {contacts.map((contact, index) => {
                          const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                          return (
                            <motion.div
                              key={contact.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <Link to={`/contatos/${contact.id}`}>
                                <Card className="card-hover cursor-pointer">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                      <OptimizedAvatar 
                                        src={contact.avatar_url || undefined}
                                        alt={`${contact.first_name} ${contact.last_name}`}
                                        fallback={`${safeInitial(contact.first_name)}${safeInitial(contact.last_name)}`}
                                        size="md"
                                        className="w-12 h-12"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-semibold text-foreground">
                                            {contact.first_name} {contact.last_name}
                                          </h3>
                                          <RoleBadge role={(contact.role as ContactRole) || 'contact'} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{contact.role_title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <RelationshipStageBadge 
                                            stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} 
                                          />
                                          {behavior?.discProfile && (
                                            <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                                          )}
                                          <SentimentIndicator
                                            sentiment={(contact.sentiment as SentimentType) || 'neutral'} 
                                            size="sm" 
                                          />
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {contact.updated_at && formatDistanceToNow(new Date(contact.updated_at), { 
                                            locale: ptBR, 
                                            addSuffix: true 
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhum contato cadastrado</h3>
                          <p className="text-muted-foreground mb-4">
                            Adicione contatos para gerenciar seus relacionamentos com esta empresa.
                          </p>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Contato
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {/* Stakeholders Tab */}
                <TabsContent value="stakeholders" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StakeholderMap contacts={contacts} interactions={interactions} companyId={id} />
                  </motion.div>
                </TabsContent>

                {/* Interactions Tab */}
                <TabsContent value="interactions" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {interactions.length > 0 ? (
                      <div className="space-y-3">
                        {interactions.map((interaction, index) => {
                          const Icon = interactionIcons[interaction.type] || MessageSquare;
                          const colorClass = interactionColors[interaction.type] || interactionColors.note;
                          
                          return (
                            <motion.div
                              key={interaction.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <Card className="card-hover">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{interaction.title}</h4>
                                        <SentimentIndicator 
                                          sentiment={(interaction.sentiment as SentimentType) || 'neutral'} 
                                          size="sm" 
                                        />
                                        {interaction.follow_up_required && (
                                          <Badge variant="outline" className="text-warning border-warning">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Follow-up
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {interaction.content}
                                      </p>
                                      {interaction.key_insights && interaction.key_insights.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {interaction.key_insights.map((insight, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {insight}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                      <p>{format(new Date(interaction.created_at), "d MMM", { locale: ptBR })}</p>
                                      <p>{format(new Date(interaction.created_at), "HH:mm")}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhuma interação registrada</h3>
                          <p className="text-muted-foreground mb-4">
                            Registre suas interações para manter o histórico de relacionamento.
                          </p>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Registrar Interação
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Account Churn Prediction Panel */}
                    <AccountChurnPredictionPanel companyId={company.id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Relationship Health */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            Saúde do Relacionamento
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground mb-2">
                            {avgRelationshipScore}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Score médio de relacionamento com {contacts.length} contatos
                          </p>
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                                style={{ width: `${avgRelationshipScore}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Engagement Stats */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Engajamento
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Interações</span>
                              <span className="font-semibold">{totalInteractions}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Interações Positivas</span>
                              <span className="font-semibold text-success">{positiveInteractions}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Follow-ups Pendentes</span>
                              <span className={`font-semibold ${pendingFollowUps > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                                {pendingFollowUps}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Key Contacts */}
                      <Card className="md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Contatos Chave
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {contacts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {contacts.slice(0, 6).map(contact => {
                                const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                                return (
                                  <Link key={contact.id} to={`/contatos/${contact.id}`}>
                                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                      <OptimizedAvatar 
                                        src={contact.avatar_url || undefined}
                                        alt={`${contact.first_name} ${contact.last_name}`}
                                        fallback={`${safeInitial(contact.first_name)}${safeInitial(contact.last_name)}`}
                                        size="sm"
                                        className="w-8 h-8"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {contact.first_name} {contact.last_name}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {behavior?.discProfile && (
                                            <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {contact.relationship_score}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum contato cadastrado
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Lux Intelligence Tab */}
                <TabsContent value="lux" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <LuxIntelligencePanel
                          record={luxRecord}
                          records={luxRecords}
                          entityType="company"
                          loading={luxLoading}
                          onTrigger={() => triggerLux({
                            name: company.name,
                            cnpj: (company as Record<string, unknown>).cnpj as string | undefined,
                            website: company.website,
                            industry: company.industry,
                            city: company.city,
                            state: company.state,
                          })}
                          triggering={luxTriggering}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>

              {/* Notes Section */}
              {company.notes && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                        Notas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {company.notes}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>

    {/* Edit Company Dialog */}
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CompanyForm
          company={company}
          onSubmit={async (data) => {
            try {
              const { error } = await supabase
                .from('companies')
                .update(data)
                .eq('id', id!);
              if (error) throw error;
              setIsEditOpen(false);
              fetchCompanyData();
            } catch (error) {
              logger.error('Error updating company:', error);
            }
          }}
          onCancel={() => setIsEditOpen(false)}
          isSubmitting={false}
        />
      </DialogContent>
    </Dialog>

    {/* Add Contact Dialog */}
    <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ContactForm
          companies={company ? [company] : []}
          defaultCompanyId={id}
          onSubmit={async (data) => {
            if (!user) return;
            try {
              const { error } = await supabase
                .from('contacts')
                .insert({ ...data, user_id: user.id, company_id: id } as Record<string, unknown>);
              if (error) throw error;
              setIsAddContactOpen(false);
              fetchCompanyData();
            } catch (error) {
              logger.error('Error adding contact:', error);
            }
          }}
          onCancel={() => setIsAddContactOpen(false)}
          isSubmitting={false}
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EmpresaDetalhe;
