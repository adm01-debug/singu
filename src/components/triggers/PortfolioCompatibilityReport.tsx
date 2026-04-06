import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Eye,
  Star,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  Briefcase,
  Heart,
  Zap,
  Crown,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface PortfolioCompatibilityReportProps {
  className?: string;
}

interface SalespersonProfile {
  vakProfile: VAKType | null;
  discProfile: DISCProfile | null;
  metaprograms: {
    motivationDirection: string | null;
    referenceFrame: string | null;
    workingStyle: string | null;
    chunkSize: string | null;
    actionFilter: string | null;
    comparisonStyle: string | null;
  };
}

interface ContactWithCompatibility {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  discProfile: DISCProfile | null;
  vakProfile: VAKType | null;
  compatibilityScore: number;
  discScore: number;
  vakScore: number;
  metaprogramScore: number;
  level: 'excellent' | 'good' | 'moderate' | 'challenging';
  opportunities: string[];
  challenges: string[];
  relationshipScore: number | null;
  lastInteraction?: string;
}

interface PortfolioStats {
  total: number;
  excellent: number;
  good: number;
  moderate: number;
  challenging: number;
  averageCompatibility: number;
  topOpportunities: ContactWithCompatibility[];
  needsAttention: ContactWithCompatibility[];
}

// DISC Compatibility Matrix
const DISC_COMPATIBILITY: Record<DISCProfile, Record<DISCProfile, number>> = {
  D: { D: 60, I: 85, S: 50, C: 70 },
  I: { D: 85, I: 70, S: 80, C: 55 },
  S: { D: 50, I: 80, S: 75, C: 85 },
  C: { D: 70, I: 55, S: 85, C: 65 },
};

// VAK Compatibility
const VAK_COMPATIBILITY: Record<VAKType, Record<VAKType, number>> = {
  V: { V: 100, A: 70, K: 60, D: 75 },
  A: { V: 70, A: 100, K: 65, D: 80 },
  K: { V: 60, A: 65, K: 100, D: 55 },
  D: { V: 75, A: 80, K: 55, D: 100 },
};

const LEVEL_CONFIG = {
  excellent: {
    label: 'Excelente',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
    icon: CheckCircle2,
    description: 'Alta compatibilidade, comunicação natural',
  },
  good: {
    label: 'Boa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    icon: TrendingUp,
    description: 'Compatibilidade favorável com pequenos ajustes',
  },
  moderate: {
    label: 'Moderada',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    icon: AlertTriangle,
    description: 'Requer adaptação consciente',
  },
  challenging: {
    label: 'Desafiadora',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    icon: AlertTriangle,
    description: 'Demanda esforço extra de adaptação',
  },
};

function ContactCard({
  contact,
  expanded,
  onToggle,
  salespersonProfile,
}: {
  contact: ContactWithCompatibility;
  expanded: boolean;
  onToggle: () => void;
  salespersonProfile: SalespersonProfile | null;
}) {
  const levelConfig = LEVEL_CONFIG[contact.level];
  const LevelIcon = levelConfig.icon;

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-lg overflow-hidden transition-shadow',
        expanded && 'shadow-md'
      )}
    >
      <div
        className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              levelConfig.bgColor
            )}>
              <LevelIcon className={cn('w-5 h-5', levelConfig.color)} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {contact.firstName} {contact.lastName}
              </p>
              {contact.company && (
                <p className="text-xs text-muted-foreground truncate">
                  {contact.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {contact.discProfile && (
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', DISC_LABELS[contact.discProfile].color)}
                >
                  {contact.discProfile}
                </Badge>
              )}
              {contact.vakProfile && (
                <Badge variant="outline" className="text-xs">
                  {VAK_LABELS[contact.vakProfile].icon}
                </Badge>
              )}
            </div>

            <div className="text-right">
              <p className={cn('font-bold text-lg', levelConfig.color)}>
                {contact.compatibilityScore}%
              </p>
              <p className="text-xs text-muted-foreground">{levelConfig.label}</p>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t bg-muted/10 space-y-4">
              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">DISC</p>
                  <p className={cn(
                    'font-bold',
                    contact.discScore >= 70 ? 'text-green-600' :
                    contact.discScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.discScore > 0 ? `${contact.discScore}%` : '-'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">VAK</p>
                  <p className={cn(
                    'font-bold',
                    contact.vakScore >= 70 ? 'text-green-600' :
                    contact.vakScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.vakScore > 0 ? `${contact.vakScore}%` : '-'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-background border text-center">
                  <p className="text-xs text-muted-foreground mb-1">Meta</p>
                  <p className={cn(
                    'font-bold',
                    contact.metaprogramScore >= 70 ? 'text-green-600' :
                    contact.metaprogramScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {contact.metaprogramScore > 0 ? `${contact.metaprogramScore}%` : '-'}
                  </p>
                </div>
              </div>

              {/* Opportunities */}
              {contact.opportunities.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1 text-green-600">
                    <Sparkles className="w-3 h-3" />
                    Oportunidades
                  </p>
                  <ul className="space-y-1">
                    {contact.opportunities.map((opp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Challenges */}
              {contact.challenges.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    Desafios
                  </p>
                  <ul className="space-y-1">
                    {contact.challenges.map((ch, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                        {ch}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/contatos/${contact.id}`}>
                    Ver Perfil Completo
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatsOverview({ stats }: { stats: PortfolioStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.excellent.bgColor)}>
        <Crown className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
        <p className="text-2xl font-bold text-emerald-600">{stats.excellent}</p>
        <p className="text-xs text-muted-foreground">Excelentes</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.good.bgColor)}>
        <Star className="w-5 h-5 mx-auto mb-1 text-blue-600" />
        <p className="text-2xl font-bold text-blue-600">{stats.good}</p>
        <p className="text-xs text-muted-foreground">Boas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.moderate.bgColor)}>
        <Zap className="w-5 h-5 mx-auto mb-1 text-amber-600" />
        <p className="text-2xl font-bold text-amber-600">{stats.moderate}</p>
        <p className="text-xs text-muted-foreground">Moderadas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.challenging.bgColor)}>
        <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600" />
        <p className="text-2xl font-bold text-red-600">{stats.challenging}</p>
        <p className="text-xs text-muted-foreground">Desafiadoras</p>
      </div>
    </div>
  );
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

  // Fuzzy search with Fuse.js
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
      // Fetch salesperson profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .maybeSingle();

      const spProfile = profileData?.nlp_profile as unknown as SalespersonProfile | null;
      setSalespersonProfile(spProfile);

      // Fetch all contacts with behavior data
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, behavior, relationship_score, companies(name)')
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch VAK profiles for contacts
      const { data: vakData } = await supabase
        .from('vak_analysis_history')
        .select('contact_id, visual_score, auditory_score, kinesthetic_score, digital_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Create VAK map (latest analysis per contact)
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
            .sort(([,a], [,b]) => b - a)[0][0];
          vakMap.set(v.contact_id, primary);
        }
      });

      // Fetch metaprogram profiles
      const { data: metaData } = await supabase
        .from('metaprogram_analysis')
        .select('contact_id, toward_score, away_from_score, internal_score, external_score, options_score, procedures_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Create metaprogram map
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

      // Calculate compatibility for each contact
      const contactsWithCompatibility: ContactWithCompatibility[] = (contactsData || []).map((c) => {
        const behavior = c.behavior as { discProfile?: DISCProfile; disc_profile?: DISCProfile } | null;
        const discProfile = behavior?.discProfile || behavior?.disc_profile || null;
        const vakProfile = vakMap.get(c.id) || null;
        const metaProfile = metaMap.get(c.id);

        // Calculate scores
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
            if (spProfile.metaprograms.referenceFrame === metaProfile.reference) {
              metaMatches++;
            }
          }

          if (spProfile.metaprograms.workingStyle && metaProfile.working) {
            metaTotal++;
            if (spProfile.metaprograms.workingStyle === metaProfile.working) {
              metaMatches++;
            }
          }

          metaprogramScore = metaTotal > 0 ? Math.round((metaMatches / metaTotal) * 100) : 0;
        }

        // Calculate overall compatibility
        const scores = [discScore, vakScore, metaprogramScore].filter(s => s > 0);
        const compatibilityScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        // Determine level
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

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    // Start with fuzzy search results
    let result = [...fuzzyResults];

    // Filter by level
    if (filterLevel !== 'all') {
      result = result.filter((c) => c.level === filterLevel);
    }

    // Sort
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

  // Calculate stats
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
        {/* Stats Overview */}
        <StatsOverview stats={stats} />

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
          <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
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
                  <span className="text-sm font-semibold text-green-600">
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
                <ContactCard
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

function getDISCAdaptation(seller: DISCProfile, client: DISCProfile): string {
  const adaptations: Record<string, string> = {
    'D-S': 'Desacelere e demonstre segurança',
    'D-C': 'Traga mais dados e detalhes',
    'I-C': 'Seja mais objetivo e factual',
    'I-D': 'Foque em resultados rápidos',
    'S-D': 'Seja mais direto e decisivo',
    'S-I': 'Mostre mais entusiasmo',
    'C-I': 'Adicione conexão emocional',
    'C-D': 'Resuma e vá direto ao ponto',
  };
  return adaptations[`${seller}-${client}`] || 'Adapte seu estilo de comunicação';
}
