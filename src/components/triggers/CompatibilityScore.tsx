import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Brain,
  Eye,
  Ear,
  Hand,
  Target,
  Shield,
  Compass,
  GitBranch,
  Zap,
  Link,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAKProfile, VAK_LABELS } from '@/types/vak';
import { MetaprogramProfile, METAPROGRAM_LABELS } from '@/types/metaprograms';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface CompatibilityScoreProps {
  contact: Contact;
  vakProfile: VAKProfile | null;
  metaprogramProfile: MetaprogramProfile | null;
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

interface CompatibilityFactor {
  name: string;
  score: number;
  maxScore: number;
  icon: typeof Brain;
  color: string;
  insight: string;
  tip: string;
}

// DISC Compatibility Matrix (how well different profiles work together)
const DISC_COMPATIBILITY: Record<DISCProfile, Record<DISCProfile, number>> = {
  D: { D: 60, I: 85, S: 50, C: 70 }, // D works best with I
  I: { D: 85, I: 70, S: 80, C: 55 }, // I works well with D and S
  S: { D: 50, I: 80, S: 75, C: 85 }, // S works best with C and I
  C: { D: 70, I: 55, S: 85, C: 65 }, // C works best with S
};

// VAK Natural compatibility (same VAK is easiest, but adaptability matters)
const VAK_COMPATIBILITY: Record<VAKType, Record<VAKType, number>> = {
  V: { V: 100, A: 70, K: 60, D: 75 },
  A: { V: 70, A: 100, K: 65, D: 80 },
  K: { V: 60, A: 65, K: 100, D: 55 },
  D: { V: 75, A: 80, K: 55, D: 100 },
};

export function CompatibilityScore({
  contact,
  vakProfile,
  metaprogramProfile,
  className,
}: CompatibilityScoreProps) {
  const { user } = useAuth();
  const [salespersonProfile, setSalespersonProfile] = useState<SalespersonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSalespersonProfile();
    }
  }, [user]);

  const fetchSalespersonProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .single();

      if (!error && data?.nlp_profile) {
        const profile = data.nlp_profile as unknown as SalespersonProfile;
        setSalespersonProfile(profile);
      }
    } catch (err) {
      logger.error('Error fetching salesperson profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const contactDISC = contact.behavior?.discProfile as DISCProfile | undefined;

  // Calculate compatibility factors
  const compatibilityFactors = useMemo<CompatibilityFactor[]>(() => {
    const factors: CompatibilityFactor[] = [];

    if (!salespersonProfile) return factors;

    // 1. VAK Compatibility
    if (salespersonProfile.vakProfile && vakProfile?.primary) {
      const vakScore = VAK_COMPATIBILITY[salespersonProfile.vakProfile][vakProfile.primary];
      const isSameVAK = salespersonProfile.vakProfile === vakProfile.primary;
      
      factors.push({
        name: 'Linguagem VAK',
        score: vakScore,
        maxScore: 100,
        icon: Eye,
        color: isSameVAK ? 'text-emerald-600' : vakScore >= 70 ? 'text-blue-600' : 'text-amber-600',
        insight: isSameVAK 
          ? `Ambos são ${VAK_LABELS[vakProfile.primary].fullName}s - comunicação natural!`
          : `Você: ${VAK_LABELS[salespersonProfile.vakProfile].name} → Cliente: ${VAK_LABELS[vakProfile.primary].name}`,
        tip: isSameVAK 
          ? 'Use sua linguagem natural, vocês se entendem bem.'
          : `Adapte sua comunicação para usar mais predicados ${VAK_LABELS[vakProfile.primary].name.toLowerCase()}s.`,
      });
    }

    // 2. DISC Compatibility
    if (salespersonProfile.discProfile && contactDISC) {
      const discScore = DISC_COMPATIBILITY[salespersonProfile.discProfile][contactDISC];
      const isSameDISC = salespersonProfile.discProfile === contactDISC;
      
      factors.push({
        name: 'Perfil DISC',
        score: discScore,
        maxScore: 100,
        icon: Target,
        color: discScore >= 80 ? 'text-emerald-600' : discScore >= 60 ? 'text-blue-600' : 'text-amber-600',
        insight: isSameDISC
          ? `Ambos são ${DISC_LABELS[contactDISC].name}s - sintonia comportamental!`
          : `Você: ${salespersonProfile.discProfile} (${DISC_LABELS[salespersonProfile.discProfile].name}) → Cliente: ${contactDISC} (${DISC_LABELS[contactDISC].name})`,
        tip: getDISCTip(salespersonProfile.discProfile, contactDISC),
      });
    }

    // 3. Motivation Direction Compatibility
    if (salespersonProfile.metaprograms?.motivationDirection && metaprogramProfile?.motivationDirection) {
      const sellerMot = salespersonProfile.metaprograms.motivationDirection;
      const clientMot = metaprogramProfile.motivationDirection;
      const isSame = sellerMot === clientMot || sellerMot === 'balanced' || clientMot === 'balanced';
      
      factors.push({
        name: 'Direção Motivacional',
        score: isSame ? 90 : 50,
        maxScore: 100,
        icon: Zap,
        color: isSame ? 'text-emerald-600' : 'text-amber-600',
        insight: isSame
          ? 'Motivação alinhada - fácil de persuadir.'
          : `Você foca em "${sellerMot}" mas cliente foca em "${clientMot}"`,
        tip: isSame
          ? 'Continue usando sua abordagem natural.'
          : clientMot === 'toward' 
            ? 'Foque em OBJETIVOS e GANHOS ao invés de problemas.'
            : 'Foque em PROBLEMAS a EVITAR ao invés de ganhos.',
      });
    }

    // 4. Reference Frame Compatibility
    if (salespersonProfile.metaprograms?.referenceFrame && metaprogramProfile?.referenceFrame) {
      const sellerRef = salespersonProfile.metaprograms.referenceFrame;
      const clientRef = metaprogramProfile.referenceFrame;
      const isSame = sellerRef === clientRef || sellerRef === 'balanced' || clientRef === 'balanced';
      
      factors.push({
        name: 'Quadro de Referência',
        score: isSame ? 85 : 55,
        maxScore: 100,
        icon: Compass,
        color: isSame ? 'text-emerald-600' : 'text-amber-600',
        insight: isSame
          ? 'Referência alinhada - validação natural.'
          : `Você usa ref. ${sellerRef} mas cliente usa ref. ${clientRef}`,
        tip: isSame
          ? 'Continue com sua estratégia de validação.'
          : clientRef === 'internal' 
            ? 'Deixe-o decidir sozinho, não force opiniões externas.'
            : 'Use mais dados, depoimentos e referências externas.',
      });
    }

    // 5. Working Style Compatibility
    if (salespersonProfile.metaprograms?.workingStyle && metaprogramProfile?.workingStyle) {
      const sellerWork = salespersonProfile.metaprograms.workingStyle;
      const clientWork = metaprogramProfile.workingStyle;
      const isSame = sellerWork === clientWork || sellerWork === 'balanced' || clientWork === 'balanced';
      
      factors.push({
        name: 'Estilo de Trabalho',
        score: isSame ? 85 : 55,
        maxScore: 100,
        icon: GitBranch,
        color: isSame ? 'text-emerald-600' : 'text-amber-600',
        insight: isSame
          ? 'Estilos compatíveis - apresentação fluida.'
          : `Você prefere ${sellerWork} mas cliente prefere ${clientWork}`,
        tip: isSame
          ? 'Continue com seu estilo natural de apresentação.'
          : clientWork === 'options' 
            ? 'Ofereça alternativas e flexibilidade.'
            : 'Apresente um processo estruturado passo a passo.',
      });
    }

    return factors;
  }, [salespersonProfile, vakProfile, metaprogramProfile, contactDISC]);

  // Calculate overall compatibility score
  const overallScore = useMemo(() => {
    if (compatibilityFactors.length === 0) return 0;
    
    const totalScore = compatibilityFactors.reduce((sum, f) => sum + f.score, 0);
    const maxScore = compatibilityFactors.reduce((sum, f) => sum + f.maxScore, 0);
    
    return Math.round((totalScore / maxScore) * 100);
  }, [compatibilityFactors]);

  // Get score level
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Boa', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
    if (score >= 40) return { label: 'Moderada', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: AlertTriangle };
    return { label: 'Desafiadora', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
  };

  const scoreLevel = getScoreLevel(overallScore);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salespersonProfile?.vakProfile && !salespersonProfile?.discProfile) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" />
            Compatibilidade Vendedor-Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Brain className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Configure seu perfil PNL para ver a compatibilidade
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/configuracoes">Configurar Meu Perfil</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vakProfile?.primary && !contactDISC && !metaprogramProfile) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" />
            Compatibilidade Vendedor-Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Analise o perfil do contato para calcular compatibilidade
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />
          Compatibilidade Vendedor-Cliente
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  A compatibilidade é calculada comparando seu perfil PNL (VAK, DISC, Metaprogramas) 
                  com o perfil do cliente para identificar desafios e oportunidades de comunicação.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-xs">
          Baseada em VAK, DISC e Metaprogramas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn('p-4 rounded-lg border-2', scoreLevel.bgColor, 'border-current/20')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <scoreLevel.icon className={cn('w-5 h-5', scoreLevel.color)} />
              <span className={cn('font-semibold', scoreLevel.color)}>
                Compatibilidade {scoreLevel.label}
              </span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {overallScore}%
            </Badge>
          </div>
          <Progress value={overallScore} className="h-2" />
        </motion.div>

        {/* Profile Comparison */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Você</p>
            <div className="flex gap-1">
              {salespersonProfile?.vakProfile && (
                <Badge variant="outline" className="text-xs">
                  {VAK_LABELS[salespersonProfile.vakProfile].icon}
                </Badge>
              )}
              {salespersonProfile?.discProfile && (
                <Badge variant="outline" className="text-xs">
                  {salespersonProfile.discProfile}
                </Badge>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{contact.firstName}</p>
            <div className="flex gap-1">
              {vakProfile?.primary && (
                <Badge variant="outline" className="text-xs">
                  {VAK_LABELS[vakProfile.primary].icon}
                </Badge>
              )}
              {contactDISC && (
                <Badge variant="outline" className="text-xs">
                  {contactDISC}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Compatibility Factors */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Fatores de Compatibilidade:</p>
          
          {compatibilityFactors.map((factor, i) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <factor.icon className={cn('w-4 h-4', factor.color)} />
                  <span className="text-sm font-medium">{factor.name}</span>
                </div>
                <Badge variant="outline" className={cn('text-xs', factor.color)}>
                  {factor.score}%
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">{factor.insight}</p>
              
              <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-primary/5">
                <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-primary">{factor.tip}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getDISCTip(seller: DISCProfile, client: DISCProfile): string {
  const tips: Record<string, string> = {
    'D-D': 'Dois Dominantes podem colidir. Seja direto mas deixe espaço para ele liderar.',
    'D-I': 'Excelente combinação! Você traz foco, ele traz energia. Mantenha o ritmo.',
    'D-S': 'Desacelere. Seu cliente precisa de segurança e tempo para decidir.',
    'D-C': 'Traga dados e detalhes. Ele precisa de precisão para confiar.',
    'I-D': 'Ótima energia! Seja mais objetivo e focado em resultados.',
    'I-I': 'Muita diversão, pouca execução. Mantenha o foco no objetivo.',
    'I-S': 'Boa sintonia! Não pressione demais, respeite o ritmo dele.',
    'I-C': 'Ele pode achar você "superficial". Traga mais fatos e detalhes.',
    'S-D': 'Desafio: ele é rápido, você é cauteloso. Prepare-se antecipadamente.',
    'S-I': 'Boa conexão emocional. Canalize a energia dele em ações.',
    'S-S': 'Conforto excessivo pode travar a venda. Dê um empurrão gentil.',
    'S-C': 'Sintonia natural. Ambos gostam de processo e segurança.',
    'C-D': 'Ele quer velocidade, você quer análise. Dê resumos executivos.',
    'C-I': 'Ele é emocional, você é lógico. Equilibre dados com entusiasmo.',
    'C-S': 'Vocês se entendem bem. Não deixe a venda arrastar demais.',
    'C-C': 'Análise paralisia! Estabeleça deadline para decisão.',
  };
  
  return tips[`${seller}-${client}`] || 'Adapte sua comunicação ao perfil do cliente.';
}
