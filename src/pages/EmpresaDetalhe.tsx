import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { queryExternalData } from '@/lib/externalData';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Edit,
  MessageSquare,
  Network,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { ContactForm } from '@/components/forms/ContactForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyHealthScore } from '@/components/ui/company-health-score';
import { StakeholderMap } from '@/components/stakeholders/StakeholderMap';
import { EmpresaHeader } from '@/components/empresa/EmpresaHeader';
import { EmpresaProfileCard } from '@/components/empresa/EmpresaProfileCard';
import { EmpresaContactsTab } from '@/components/empresa/EmpresaContactsTab';
import { EmpresaInteractionsTab } from '@/components/empresa/EmpresaInteractionsTab';
import { EmpresaInsightsTab } from '@/components/empresa/EmpresaInsightsTab';
import { EmpresaLuxTab } from '@/components/empresa/EmpresaLuxTab';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Company = Tables<'companies'>;
type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

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
    if (!id) return;
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
        const normalizedContacts = (contactsResult || []).map((c: Record<string, unknown>) => ({
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
          .eq('company_id', id)
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

  const buildLuxPayload = useCallback(() => ({
    name: company?.name ?? '',
    cnpj: (company as Record<string, unknown> | null)?.cnpj as string | undefined,
    website: company?.website,
    industry: company?.industry,
    city: company?.city,
    state: company?.state,
  }), [company]);

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
        <EmpresaHeader
          company={company}
          onAddContact={() => setIsAddContactOpen(true)}
          onEdit={() => setIsEditOpen(true)}
          onTriggerLux={() => triggerLux(buildLuxPayload())}
          luxTriggering={luxTriggering}
          luxProcessing={luxRecord?.status === 'processing'}
        />

        <div className="relative z-10 px-4 md:px-6 -mt-12 md:-mt-16 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile Card */}
            <EmpresaProfileCard
              company={company}
              healthStatus={healthStatus}
              contactsCount={contacts.length}
              totalInteractions={totalInteractions}
              avgRelationshipScore={avgRelationshipScore}
            />

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

                <TabsContent value="contacts" className="mt-4">
                  <EmpresaContactsTab contacts={contacts} />
                </TabsContent>

                <TabsContent value="stakeholders" className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StakeholderMap contacts={contacts} interactions={interactions} companyId={id} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="interactions" className="mt-4">
                  <EmpresaInteractionsTab interactions={interactions} />
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <EmpresaInsightsTab
                    companyId={company.id}
                    contacts={contacts}
                    avgRelationshipScore={avgRelationshipScore}
                    totalInteractions={totalInteractions}
                    positiveInteractions={positiveInteractions}
                    pendingFollowUps={pendingFollowUps}
                  />
                </TabsContent>

                <TabsContent value="lux" className="mt-4">
                  <EmpresaLuxTab
                    luxRecord={luxRecord}
                    luxRecords={luxRecords}
                    luxLoading={luxLoading}
                    luxTriggering={luxTriggering}
                    onTriggerLux={() => triggerLux(buildLuxPayload())}
                  />
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
                .eq('id', id);
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
