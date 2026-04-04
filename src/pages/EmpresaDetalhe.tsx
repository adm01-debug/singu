import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/navigation/PageHeader';
import { queryExternalData, updateExternalData } from '@/lib/externalData';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { useCompanyPhones, useCompanyEmails, useCompanyAddresses, useCompanySocialMedia } from '@/hooks/useCompanyRelatedData';
import type { CompanyPhone, CompanyEmail, CompanyAddress, CompanySocialMedia } from '@/hooks/useCompanyRelatedData';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Edit, Plus, MessageSquare,
  Network, BarChart3, Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { ContactForm } from '@/components/forms/ContactForm';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyHealthScore } from '@/components/ui/company-health-score';
import { StakeholderMap } from '@/components/stakeholders/StakeholderMap';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import { CompanyProfileCard } from '@/components/company-detail/CompanyProfileCard';
import { CompanyInsightsTab } from '@/components/company-detail/CompanyInsightsTab';
import { CompanyInteractionsTab } from '@/components/company-detail/CompanyInteractionsTab';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { DISCProfile } from '@/types';
import { logger } from "@/lib/logger";
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { DISCBadge } from '@/components/ui/disc-badge';
import { useToast } from '@/hooks/use-toast';

type Company = Tables<'companies'>;
type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

const EmpresaDetalhe = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackView } = useRecentlyViewed();
  const { records: luxRecords, latestRecord: luxRecord, loading: luxLoading, triggering: luxTriggering, triggerLux } = useLuxIntelligence('company', id);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ─── Normalized data hooks ───
  const phonesHook = useCompanyPhones(id);
  const emailsHook = useCompanyEmails(id);
  const addressesHook = useCompanyAddresses(id);
  const socialMediaHook = useCompanySocialMedia(id);

  const fetchCompanyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: companyResult, error: companyError } = await queryExternalData<Record<string, unknown>>({
        table: 'companies',
        filters: [{ type: 'eq', column: 'id', value: id }],
      });

      if (companyError) throw companyError;
      const raw = Array.isArray(companyResult) ? (companyResult.at(0) ?? null) : null;
      const companyData = raw ? {
        ...raw,
        name: (raw.nome_crm || raw.nome_fantasia || raw.razao_social || 'Sem nome') as string,
        industry: (raw.ramo_atividade || null) as string | null,
        tags: (raw.tags_array || []) as string[],
        challenges: (raw.challenges || []) as string[],
        competitors: (raw.competitors || []) as string[],
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
        const { data: contactsResult, error: contactsError } = await queryExternalData<Contact>({
          table: 'contacts',
          filters: [{ type: 'eq', column: 'company_id', value: id }],
          order: { column: 'relationship_score', ascending: false },
        });

        if (contactsError) throw contactsError;
        const normalizedContacts = (contactsResult || []).map((c: Record<string, unknown>) => ({
          ...c,
          first_name: c.first_name || c.nome || 'Sem',
          last_name: c.last_name || c.sobrenome || 'nome',
          tags: c.tags || [],
          hobbies: c.hobbies || [],
          interests: c.interests || [],
        })) as Contact[];
        setContacts(normalizedContacts);

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
    if (id && user) fetchCompanyData();
  }, [id, user, fetchCompanyData]);

  const stats = useMemo(() => {
    const avgScore = contacts.length > 0
      ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / contacts.length)
      : 0;
    const total = interactions.length;
    const positive = interactions.filter(i => i.sentiment === 'positive').length;
    const pending = interactions.filter(i => i.follow_up_required && !i.follow_up_date).length;
    const lastDate = total > 0 ? new Date(interactions[0]?.created_at || Date.now()) : null;
    const daysSince = lastDate
      ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;
    return { avgScore, total, positive, positiveRatio: total > 0 ? positive / total : 0, pending, daysSince };
  }, [contacts, interactions]);

  // ─── Edit handler: uses external data API ───
  const handleEditSubmit = async (data: Record<string, unknown>) => {
    if (!id) return;
    setEditSubmitting(true);
    try {
      const { name, industry, tags, phone, email, address, city, state, instagram, linkedin, facebook, youtube, twitter, tiktok, ...cleanData } = data as Record<string, unknown>;
      const { error } = await updateExternalData('companies', id, cleanData);
      if (error) throw error;
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      setIsEditOpen(false);
      fetchCompanyData();
    } catch (error) {
      logger.error('Error updating company:', error);
      toast({ title: 'Erro ao atualizar', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
          <Link to="/empresas"><Button>Voltar para Empresas</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';

  return (
    <>
    <AppLayout>
      <div className="min-h-screen pt-2 md:pt-4">
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <PageHeader backTo="/empresas" backLabel="Empresas" title={company.name} />
        </div>
        
        {/* Header gradient */}
        <div className="h-56 bg-gradient-primary relative z-0 overflow-hidden rounded-2xl mx-4 md:mx-6 mt-2">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LuxButton
              onClick={() => triggerLux({
                name: company.name,
                cnpj: company.cnpj,
                website: company.website,
                industry: company.industry,
              })}
              loading={luxTriggering}
              processing={luxRecord?.status === 'processing'}
              variant="header"
            />
            <Button
              className="bg-primary-foreground/10 backdrop-blur hover:bg-primary-foreground/20 text-primary-foreground border-0"
              onClick={() => setIsAddContactOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Contato
            </Button>
            <Button
              className="bg-primary-foreground/10 backdrop-blur hover:bg-primary-foreground/20 text-primary-foreground border-0"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="relative z-10 px-4 md:px-6 -mt-12 md:-mt-16 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Profile + Business */}
            <CompanyProfileCard
              company={company}
              contactCount={contacts.length}
              totalInteractions={stats.total}
              avgRelationshipScore={stats.avgScore}
              phones={phonesHook.data}
              emails={emailsHook.data}
              addresses={addressesHook.data}
              socialMedia={socialMediaHook.data}
            />

            {/* Right column: Tabs */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <CompanyHealthScore
                  financialHealth={healthStatus}
                  contactCount={contacts.length}
                  avgRelationshipScore={stats.avgScore}
                  totalInteractions={stats.total}
                  positiveInteractionsRatio={stats.positiveRatio}
                  pendingFollowUps={stats.pending}
                  daysSinceLastInteraction={stats.daysSince}
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
                    <span className="hidden sm:inline">Histórico ({stats.total})</span>
                    <span className="sm:hidden">{stats.total}</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="lux" className="flex items-center gap-2 text-accent-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Lux</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="mt-4">
                  <ContactsTabContent contacts={contacts} />
                </TabsContent>

                <TabsContent value="stakeholders" className="mt-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <StakeholderMap contacts={contacts} interactions={interactions} companyId={id} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="interactions" className="mt-4">
                  <CompanyInteractionsTab interactions={interactions} />
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <CompanyInsightsTab
                    companyId={company.id}
                    contacts={contacts}
                    avgRelationshipScore={stats.avgScore}
                    totalInteractions={stats.total}
                    positiveInteractions={stats.positive}
                    pendingFollowUps={stats.pending}
                  />
                </TabsContent>

                <TabsContent value="lux" className="mt-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card>
                      <CardContent className="pt-6">
                        <LuxIntelligencePanel
                          record={luxRecord}
                          records={luxRecords}
                          entityType="company"
                          loading={luxLoading}
                          onTrigger={() => triggerLux({
                            name: company.name,
                            cnpj: company.cnpj,
                            website: company.website,
                            industry: company.industry,
                          })}
                          triggering={luxTriggering}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>

              {company.notes && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Notas</h3>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p>
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
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
          isSubmitting={editSubmitting}
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
              const { error } = await supabase.from('contacts').insert({ ...data, user_id: user.id, company_id: id } as unknown as import('@/integrations/supabase/types').Database['public']['Tables']['contacts']['Insert']);
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

/* ── Contacts Tab sub-component ── */
function ContactsTabContent({ contacts }: { contacts: Contact[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                          fallback={safeInitial(contact.first_name)}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{contact.first_name} {contact.last_name}</h3>
                            <RoleBadge role={contact.role as import('@/types').ContactRole || 'contact'} />
                            {behavior?.discProfile && <DISCBadge profile={behavior.discProfile} size="sm" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{contact.role_title || 'Sem cargo'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                            <SentimentIndicator sentiment={(contact.sentiment as import('@/types').SentimentType) || 'neutral'} />
                            <RelationshipStageBadge stage={(contact.relationship_stage as import('@/types').RelationshipStage) || 'unknown'} size="sm" />
                          </div>
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                            {contact.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
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
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Nenhum contato vinculado</h3>
            <p className="text-sm text-muted-foreground">Adicione contatos para esta empresa</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default EmpresaDetalhe;
