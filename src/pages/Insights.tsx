import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Heart,
  Briefcase,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioCompatibilityReport } from '@/components/triggers/PortfolioCompatibilityReport';
import { CompatibilityAlertsList } from '@/components/triggers/CompatibilityAlertsList';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { CarnegieDashboard } from '@/components/carnegie';
import {
  InsightsStatsCards,
  InsightsFilters,
  InsightCard,
  InsightsEmptyState,
  InsightsLoadingSkeleton,
} from '@/components/insights';
import type { AIInsight } from '@/components/insights';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type Company = Tables<'companies'>;

const Insights = () => {
  const { user, session } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fuzzy search with Fuse.js
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    results: fuzzyResults,
    isSearching,
    clearSearch,
  } = useFuzzySearch(insights, {
    keys: ['title', 'description', 'action_suggestion', 'category'],
    threshold: 0.3,
    minChars: 1,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [contactsRes, interactionsRes, companiesRes] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, email, company_id, relationship_score, sentiment, user_id, created_at').limit(50),
        supabase.from('interactions').select('id, contact_id, company_id, user_id, type, content, sentiment, channel, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('companies').select('id, name, status, is_customer, created_at').limit(20),
      ]);

      setContacts(contactsRes.data || []);
      setCompanies(companiesRes.data || []);

      // Generate initial insights if we have data
      if ((contactsRes.data?.length || 0) > 0 || (interactionsRes.data?.length || 0) > 0) {
        await generateInsights(contactsRes.data || [], interactionsRes.data || [], companiesRes.data || []);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (
    contactsData: Contact[],
    interactionsData: Interaction[],
    companiesData: Company[]
  ) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para gerar insights');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contacts: contactsData.map(c => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
              role: c.role_title,
              relationship_score: c.relationship_score,
              relationship_stage: c.relationship_stage,
              sentiment: c.sentiment,
              last_interaction: c.updated_at,
            })),
            interactions: interactionsData.map(i => ({
              id: i.id,
              type: i.type,
              title: i.title,
              content: i.content?.slice(0, 200),
              sentiment: i.sentiment,
              follow_up_required: i.follow_up_required,
              created_at: i.created_at,
              contact_id: i.contact_id,
            })),
            companies: companiesData.map(c => ({
              id: c.id,
              name: c.name,
              industry: c.industry,
              financial_health: c.financial_health,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);

      if (data.insights?.length > 0) {
        toast.success(`${data.insights.length} insights gerados com IA!`);
      } else {
        toast.info('Adicione mais dados para gerar insights personalizados');
      }
    } catch (error) {
      logger.error('Error generating insights:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar insights');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefreshInsights = async () => {
    try {
      const [contactsRes, interactionsRes, companiesRes] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, email, company_id, relationship_score, sentiment, user_id, created_at').limit(50),
        supabase.from('interactions').select('id, contact_id, company_id, user_id, type, content, sentiment, channel, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('companies').select('id, name, status, is_customer, created_at').limit(20),
      ]);

      await generateInsights(
        contactsRes.data || [],
        interactionsRes.data || [],
        companiesRes.data || []
      );
    } catch (error) {
      logger.error('Error refreshing insights:', error);
      toast.error('Erro ao atualizar insights. Tente novamente.');
    }
  };

  const filteredInsights = useMemo(() => {
    return fuzzyResults.filter(insight => {
      const matchesCategory = !selectedCategory || insight.category === selectedCategory;
      return matchesCategory;
    });
  }, [fuzzyResults, selectedCategory]);

  const getContactName = (contactId?: string) => {
    if (!contactId) return null;
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : null;
  };

  return (
    <AppLayout>
      <Header
        title="Insights com IA"
        subtitle="Análise inteligente dos seus relacionamentos e interações"
      />

      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />

        <Tabs defaultValue="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="insights" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Insights IA
              </TabsTrigger>
              <TabsTrigger value="compatibility" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Compatibilidade
              </TabsTrigger>
              <TabsTrigger value="carnegie" className="gap-2">
                <Heart className="w-4 h-4" />
                Carnegie
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={handleRefreshInsights}
              disabled={generating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
              {generating ? 'Gerando...' : 'Gerar Novos Insights'}
            </Button>
          </div>

          <TabsContent value="compatibility" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PortfolioCompatibilityReport />
              </div>
              <div>
                <CompatibilityAlertsList maxItems={10} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="carnegie" className="mt-0">
            <CarnegieDashboard />
          </TabsContent>

          <TabsContent value="insights" className="mt-0 space-y-6">
            <InsightsStatsCards insights={insights} />

            <InsightsFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isSearching={isSearching}
              clearSearch={clearSearch}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {(loading || generating) && <InsightsLoadingSkeleton />}

            {!loading && !generating && (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInsights.map((insight, index) => (
                    <InsightCard
                      key={`${insight.title}-${index}`}
                      insight={insight}
                      index={index}
                      contactName={getContactName(insight.contact_id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {!loading && !generating && filteredInsights.length === 0 && (
              <InsightsEmptyState
                hasInsights={insights.length > 0}
                generating={generating}
                onRefresh={handleRefreshInsights}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Insights;
