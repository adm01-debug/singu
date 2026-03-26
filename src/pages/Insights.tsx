import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  Brain, 
  TrendingUp, 
  Search, 
  RefreshCw,
  AlertTriangle, 
  Heart,
  Lightbulb,
  Zap,
  CheckCircle2,
  Clock,
  User,
  Building2,
  ArrowRight,
  Briefcase,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioCompatibilityReport } from '@/components/triggers/PortfolioCompatibilityReport';
import { CompatibilityAlertsList } from '@/components/triggers/CompatibilityAlertsList';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { CarnegieDashboard } from '@/components/carnegie';
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

interface AIInsight {
  category: string;
  title: string;
  description: string;
  action_suggestion: string;
  confidence: number;
  actionable: boolean;
  contact_id?: string;
  priority: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  personality: Brain,
  preference: Target,
  behavior: TrendingUp,
  opportunity: Sparkles,
  risk: AlertTriangle,
  relationship: Heart,
  sentiment: Lightbulb,
  action: Zap,
};

const categoryColors: Record<string, string> = {
  personality: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  preference: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  behavior: 'bg-green-500/10 text-green-500 border-green-500/20',
  opportunity: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  risk: 'bg-red-500/10 text-red-500 border-red-500/20',
  relationship: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  sentiment: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  action: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

const categoryLabels: Record<string, string> = {
  personality: 'Personalidade',
  preference: 'Preferência',
  behavior: 'Comportamento',
  opportunity: 'Oportunidade',
  risk: 'Risco',
  relationship: 'Relacionamento',
  sentiment: 'Sentimento',
  action: 'Ação',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/30',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  low: 'bg-green-500/10 text-green-500 border-green-500/30',
};

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

  const categories = Object.keys(categoryLabels);

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

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.category === 'opportunity').length}
                </p>
                <p className="text-sm text-muted-foreground">Oportunidades</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.category === 'risk').length}
                </p>
                <p className="text-sm text-muted-foreground">Riscos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.actionable).length}
                </p>
                <p className="text-sm text-muted-foreground">Acionáveis</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insights... (tolerante a erros)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isSearching ? 'pr-10' : ''}`}
            />
            {isSearching && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex items-center gap-2 pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map(category => {
                const Icon = categoryIcons[category] || Lightbulb;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="gap-1.5 whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {categoryLabels[category]}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Loading State */}
        {(loading || generating) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="w-24 h-6 rounded-full" />
                  </div>
                  <Skeleton className="w-3/4 h-5 mb-2" />
                  <Skeleton className="w-full h-4 mb-1" />
                  <Skeleton className="w-2/3 h-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Insights Grid */}
        {!loading && !generating && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInsights.map((insight, index) => {
                const Icon = categoryIcons[insight.category] || Lightbulb;
                const contactName = getContactName(insight.contact_id);
                
                return (
                  <motion.div
                    key={`${insight.title}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "p-3 rounded-xl transition-transform group-hover:scale-110",
                            categoryColors[insight.category]?.split(' ')[0] || 'bg-primary/10'
                          )}>
                            <Icon className={cn(
                              "w-5 h-5",
                              categoryColors[insight.category]?.split(' ')[1] || 'text-primary'
                            )} />
                          </div>
                          <div className="flex items-center gap-2">
                            {insight.priority && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", priorityColors[insight.priority])}
                              >
                                {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", categoryColors[insight.category])}
                            >
                              {categoryLabels[insight.category] || insight.category}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {insight.description}
                        </p>

                        {insight.action_suggestion && (
                          <div className="p-3 rounded-lg bg-muted/50 mb-4">
                            <div className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-foreground">
                                {insight.action_suggestion}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-4">
                            {contactName && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <User className="w-3.5 h-3.5" />
                                <span>{contactName}</span>
                              </div>
                            )}
                            {insight.actionable && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Acionável
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Confiança</span>
                            <div className="w-16">
                              <Progress value={insight.confidence} className="h-1.5" />
                            </div>
                            <span className="text-xs font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && !generating && filteredInsights.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {insights.length === 0 ? 'Nenhum insight gerado' : 'Nenhum insight encontrado'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {insights.length === 0 
                ? 'Adicione contatos e registre interações para que a IA possa gerar insights personalizados sobre seus relacionamentos.'
                : 'Tente ajustar os filtros de busca para encontrar insights.'}
            </p>
            {insights.length === 0 && (
              <Button onClick={handleRefreshInsights} disabled={generating} className="gap-2">
                <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
                Tentar Gerar Insights
              </Button>
            )}
          </motion.div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Insights;
