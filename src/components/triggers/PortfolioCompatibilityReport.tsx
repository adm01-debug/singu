import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Brain, Search, RefreshCw, X,
  Filter, SortAsc, SortDesc, Crown, Heart,
  ArrowRight, Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DISCProfile } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

import {
  SalespersonProfile,
  ContactWithCompatibility,
  PortfolioStats,
  DISC_COMPATIBILITY,
  VAK_COMPATIBILITY,
  getDISCAdaptation,
} from './portfolio/portfolioTypes';
import { PortfolioContactCard } from './portfolio/PortfolioContactCard';
import { PortfolioStatsOverview } from './portfolio/PortfolioStatsOverview';

interface PortfolioCompatibilityReportProps {
  className?: string;
}

export function PortfolioCompatibilityReport({ className }: PortfolioCompatibilityReportProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salespersonProfile, setSalespersonProfile] = useState<SalespersonProfile | null>(null);
  const [contacts, setContacts] = useState<ContactWithCompatibility[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'compatibility' | 'name' | 'relationship'>('compatibility');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    results: fuzzyResults,
    isSearching,
    clearSearch,
  } = useFuzzySearch(contacts, {
    keys: ['firstName', 'lastName', 'company'],
    threshold: 0.3,
    minChars: 1,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .maybeSingle();

      const spProfile = profileData?.nlp_profile as unknown as SalespersonProfile | null;
      setSalespersonProfile(spProfile);

      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, behavior, relationship_score, companies(name)')
        .eq('user_id', user.id);

      if (error) throw error;

      const { data: vakData } = await supabase
        .from('vak_analysis_history')
        .select('contact_id, visual_score, auditory_score, kinesthetic_score, digital_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const vakMap = new Map<string, VAKType>();
      vakData?.forEach((v) => {
        if (!vakMap.has(v.contact_id)) {
          const scores = {
            V: v.visual_score || 0,
            A: v.auditory_score || 0,
            K: v.kinesthetic_score || 0,
            D: v.digital_score || 0,
          };
          const primary = (Object.entries(scores) as [VAKType, number][])
            .sort(([, a], [, b]) => b - a)[0][0];
          vakMap.set(v.contact_id, primary);
        }
      });

      const { data: metaData } = await supabase
        .from('metaprogram_analysis')
        .select('contact_id, toward_score, away_from_score, internal_score, external_score, options_score, procedures_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const metaMap = new Map<string, { motivation: string; reference: string; working: string }>();
      metaData?.forEach((m) => {
        if (!metaMap.has(m.contact_id)) {
          metaMap.set(m.contact_id, {
            motivation: (m.toward_score || 0) > (m.away_from_score || 0) ? 'toward' : 'away_from',
            reference: (m.internal_score || 0) > (m.external_score || 0) ? 'internal' : 'external',
            working: (m.options_score || 0) > (m.procedures_score || 0) ? 'options' : 'procedures',
          });
        }
      });

      const contactsWithCompatibility: ContactWithCompatibility[] = (contactsData || []).map((c) => {
        const behavior = c.behavior as { discProfile?: DISCProfile; disc_profile?: DISCProfile } | null;
        const discProfile = behavior?.discProfile || behavior?.disc_profile || null;
        const vakProfile = vakMap.get(c.id) || null;
        const metaProfile = metaMap.get(c.id);

        let discScore = 0;
        let vakScore = 0;
        let metaprogramScore = 0;
        const opportunities: string[] = [];
        const challenges: string[] = [];

        if (spProfile?.discProfile && discProfile) {
          discScore = DISC_COMPATIBILITY[spProfile.discProfile][discProfile];
          if (discScore >= 80) {
            opportunities.push(`Perfil ${discProfile} tem ótima sintonia com você (${spProfile.discProfile})`);
          } else if (discScore < 60) {
            challenges.push(`Adapte-se ao perfil ${discProfile}: ${getDISCAdaptation(spProfile.discProfile, discProfile)}`);
          }
        }

        if (spProfile?.vakProfile && vakProfile) {
          vakScore = VAK_COMPATIBILITY[spProfile.vakProfile][vakProfile];
          if (vakScore >= 80) {
            opportunities.push(`Comunicação ${VAK_LABELS[vakProfile].name} alinhada com a sua`);
          } else if (vakScore < 70) {
            challenges.push(`Use mais linguagem ${VAK_LABELS[vakProfile].name.toLowerCase()} nas conversas`);
          }
        }

        if (spProfile?.metaprograms && metaProfile) {
          let metaMatches = 0;
          let metaTotal = 0;

          if (spProfile.metaprograms.motivationDirection && metaProfile.motivation) {
            metaTotal++;
            if (spProfile.metaprograms.motivationDirection === metaProfile.motivation) {
              metaMatches++;
              opportunities.push(`Motivação alinhada: foco em ${metaProfile.motivation === 'toward' ? 'ganhos' : 'evitar problemas'}`);
            } else {
              challenges.push(`Ajuste a motivação: cliente foca em ${metaProfile.motivation === 'toward' ? 'objetivos' : 'evitar problemas'}`);
            }
          }

          if (spProfile.metaprograms.referenceFrame && metaProfile.reference) {
            metaTotal++;
            if (spProfile.metaprograms.referenceFrame === metaProfile.reference) metaMatches++;
          }

          if (spProfile.metaprograms.workingStyle && metaProfile.working) {
            metaTotal++;
            if (spProfile.metaprograms.workingStyle === metaProfile.working) metaMatches++;
          }

          metaprogramScore = metaTotal > 0 ? Math.round((metaMatches / metaTotal) * 100) : 0;
        }

        const scores = [discScore, vakScore, metaprogramScore].filter(s => s > 0);
        const compatibilityScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        let level: ContactWithCompatibility['level'] = 'moderate';
        if (compatibilityScore >= 80) level = 'excellent';
        else if (compatibilityScore >= 65) level = 'good';
        else if (compatibilityScore >= 45) level = 'moderate';
        else level = 'challenging';

        return {
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          company: (c.companies as { name: string } | null)?.name,
          discProfile,
          vakProfile,
          compatibilityScore,
          discScore,
          vakScore,
          metaprogramScore,
          level,
          opportunities,
          challenges,
          relationshipScore: c.relationship_score,
        };
      });

      setContacts(contactsWithCompatibility);
    } catch (error) {
      logger.error('Error loading portfolio data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    let result = [...fuzzyResults];

    if (filterLevel !== 'all') {
      result = result.filter((c) => c.level === filterLevel);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'compatibility') {
        comparison = a.compatibilityScore - b.compatibilityScore;
      } else if (sortBy === 'name') {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'relationship') {
        comparison = (a.relationshipScore || 0) - (b.relationshipScore || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [fuzzyResults, filterLevel, sortBy, sortOrder]);

  const stats = useMemo<PortfolioStats>(() => {
    const withProfile = contacts.filter((c) => c.compatibilityScore > 0);
    return {
      total: withProfile.length,
      excellent: contacts.filter((c) => c.level === 'excellent').length,
      good: contacts.filter((c) => c.level === 'good').length,
      moderate: contacts.filter((c) => c.level === 'moderate').length,
      challenging: contacts.filter((c) => c.level === 'challenging').length,
      averageCompatibility:
        withProfile.length > 0
          ? Math.round(withProfile.reduce((sum, c) => sum + c.compatibilityScore, 0) / withProfile.length)
          : 0,
      topOpportunities: contacts
        .filter((c) => c.level === 'excellent' || c.level === 'good')
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 5),
      needsAttention: contacts
        .filter((c) => c.level === 'challenging')
        .sort((a, b) => a.compatibilityScore - b.compatibilityScore)
        .slice(0, 5),
    };
  }, [contacts]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!salespersonProfile?.discProfile && !salespersonProfile?.vakProfile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Relatório de Compatibilidade da Carteira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Configure seu perfil PNL para ver a compatibilidade com seus clientes
            </p>
            <Button variant="outline" asChild>
              <Link to="/configuracoes">
                Configurar Meu Perfil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Relatório de Compatibilidade
            </CardTitle>
            <CardDescription>
              Análise completa da sua carteira de clientes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <PortfolioStatsOverview stats={stats} />

        {/* Average Compatibility */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="font-semibold">Compatibilidade Média da Carteira</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {stats.averageCompatibility}%
            </Badge>
          </div>
          <Progress value={stats.averageCompatibility} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.total} clientes com perfil PNL configurado
          </p>
        </motion.div>

        {/* Top Opportunities */}
        {stats.topOpportunities.length > 0 && (
          <div className="p-4 rounded-lg border border-success dark:border-success bg-success dark:bg-success/20">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-success dark:text-success">
              <Crown className="w-4 h-4" />
              Melhores Oportunidades
            </h4>
            <div className="space-y-2">
              {stats.topOpportunities.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{c.firstName} {c.lastName}</span>
                    {c.discProfile && (
                      <Badge variant="outline" className="text-xs">
                        {c.discProfile}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-success">
                    {c.compatibilityScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente... (tolerante a erros)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 ${isSearching ? 'pr-9' : ''}`}
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
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="good">Boa</SelectItem>
              <SelectItem value="moderate">Moderada</SelectItem>
              <SelectItem value="challenging">Desafiadora</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">Compatibilidade</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="relationship">Score de Relacionamento</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Contact List */}
        <ScrollArea className="h-[400px] pr-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterLevel !== 'all'
                  ? 'Nenhum cliente encontrado com os filtros aplicados'
                  : 'Nenhum cliente com perfil PNL configurado'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <PortfolioContactCard
                  key={contact.id}
                  contact={contact}
                  expanded={expandedContact === contact.id}
                  onToggle={() =>
                    setExpandedContact(expandedContact === contact.id ? null : contact.id)
                  }
                  salespersonProfile={salespersonProfile}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
