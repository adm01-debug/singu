// Generation Profile Card
// Card expandido com perfil geracional completo

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  MessageSquare, 
  Target, 
  Brain, 
  Heart, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { GenerationProfile } from '@/types/generation';
import { GenerationBadge } from './GenerationBadge';

interface GenerationProfileCardProps {
  profile: GenerationProfile;
  age: number;
  confidence: number;
}

export function GenerationProfileCard({ profile, age, confidence }: GenerationProfileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{profile.icon}</span>
            <div>
              <CardTitle className="flex items-center gap-2">
                {profile.name}
                <Badge variant="secondary" className="text-xs">
                  {age} anos
                </Badge>
              </CardTitle>
              <CardDescription>
                Nascidos entre {profile.yearRange.start}-{profile.yearRange.end} • Confiança: {confidence}%
              </CardDescription>
            </div>
          </div>
          <GenerationBadge generation={profile.type} size="lg" />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs">Comunicação</TabsTrigger>
            <TabsTrigger value="triggers" className="text-xs">Gatilhos</TabsTrigger>
            <TabsTrigger value="neuro" className="text-xs">Neuro</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs">Vendas</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[300px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <Section title="Valores Centrais" icon={Heart}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.coreValues.map((value, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{value}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Eventos Formativos" icon={User}>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {profile.formativeEvents.map((event, i) => (
                    <li key={i}>• {event}</li>
                  ))}
                </ul>
              </Section>
              
              <Section title="Estilo de Trabalho" icon={TrendingUp}>
                <p className="text-sm text-muted-foreground">{profile.workStyle}</p>
              </Section>
              
              <Section title="Tomada de Decisão" icon={Brain}>
                <p className="text-sm text-muted-foreground">{profile.decisionMaking}</p>
              </Section>
            </TabsContent>
            
            <TabsContent value="communication" className="space-y-4">
              <Section title="Canais Preferidos" icon={CheckCircle2}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.preferredChannels.map((channel, i) => (
                    <Badge key={i} className="bg-green-100 text-green-700 text-xs">{channel}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Canais a Evitar" icon={AlertTriangle}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.avoidChannels.map((channel, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{channel}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Estilo de Comunicação" icon={MessageSquare}>
                <p className="text-sm text-muted-foreground">{profile.communicationStyle}</p>
              </Section>
              
              <Section title="Expectativa de Resposta" icon={Zap}>
                <p className="text-sm text-muted-foreground">{profile.responseExpectation}</p>
              </Section>
              
              <Section title="Preferência de Conteúdo" icon={Smartphone}>
                <p className="text-sm text-muted-foreground">{profile.contentPreference}</p>
              </Section>
            </TabsContent>
            
            <TabsContent value="triggers" className="space-y-4">
              <Section title="Gatilhos Efetivos" icon={CheckCircle2}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.effectiveTriggers.map((trigger, i) => (
                    <Badge key={i} className="bg-green-100 text-green-700 text-xs">{trigger}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Gatilhos Ineficazes" icon={AlertTriangle}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.ineffectiveTriggers.map((trigger, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{trigger}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Objeções Comuns" icon={MessageSquare}>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {profile.commonObjections.map((objection, i) => (
                    <li key={i} className="italic">"{objection}"</li>
                  ))}
                </ul>
              </Section>
              
              <Section title="Abordagem de Persuasão" icon={Target}>
                <p className="text-sm text-muted-foreground">{profile.persuasionApproach}</p>
              </Section>
            </TabsContent>
            
            <TabsContent value="neuro" className="space-y-4">
              <Section title="Cérebro Dominante" icon={Brain}>
                <Badge className={getBrainColor(profile.neuroProfile.dominantBrain)}>
                  {translateBrain(profile.neuroProfile.dominantBrain)}
                </Badge>
              </Section>
              
              <Section title="Motivadores-Chave" icon={Heart}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.neuroProfile.keyMotivators.map((mot, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{mot}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Gatilhos de Dopamina" icon={Zap}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.neuroProfile.dopamineTriggers.map((trigger, i) => (
                    <Badge key={i} className="bg-purple-100 text-purple-700 text-xs">{trigger}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Medos/Drivers" icon={AlertTriangle}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.neuroProfile.fearDrivers.map((fear, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{fear}</Badge>
                  ))}
                </div>
              </Section>
              
              <Section title="Tendência VAK" icon={User}>
                <p className="text-sm text-muted-foreground">
                  Dominante: <strong>{profile.vakTendencies.dominant}</strong> | 
                  Secundário: <strong>{profile.vakTendencies.secondary}</strong>
                </p>
                <div className="mt-2 space-y-1">
                  {profile.vakTendencies.languagePatterns.map((pattern, i) => (
                    <p key={i} className="text-xs text-muted-foreground italic">"{pattern}"</p>
                  ))}
                </div>
              </Section>
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-4">
              <Section title="Estratégias de Abertura" icon={MessageSquare}>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {profile.salesApproach.openingStrategies.map((strategy, i) => (
                    <li key={i}>• {strategy}</li>
                  ))}
                </ul>
              </Section>
              
              <Section title="Estilo de Apresentação" icon={Target}>
                <p className="text-sm text-muted-foreground">{profile.salesApproach.presentationStyle}</p>
              </Section>
              
              <Section title="Técnicas de Fechamento" icon={CheckCircle2}>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {profile.salesApproach.closingTechniques.map((technique, i) => (
                    <li key={i}>• {technique}</li>
                  ))}
                </ul>
              </Section>
              
              <Section title="Follow-up Preferido" icon={Zap}>
                <p className="text-sm text-muted-foreground">{profile.salesApproach.followUpPreference}</p>
              </Section>
              
              <Section title="Perfil Tecnológico" icon={Smartphone}>
                <p className="text-sm text-muted-foreground mb-2">
                  Fluência Digital: <strong>{translateFluency(profile.techProfile.digitalFluency)}</strong>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.techProfile.preferredPlatforms.map((platform, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{platform}</Badge>
                  ))}
                </div>
              </Section>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Componente auxiliar para seções
function Section({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {children}
    </div>
  );
}

function translateBrain(brain: string): string {
  const translations: Record<string, string> = {
    'reptilian': 'Reptiliano (Instinto)',
    'limbic': 'Límbico (Emoção)',
    'neocortex': 'Neocórtex (Razão)'
  };
  return translations[brain] || brain;
}

function getBrainColor(brain: string): string {
  const colors: Record<string, string> = {
    'reptilian': 'bg-red-100 text-red-700',
    'limbic': 'bg-orange-100 text-orange-700',
    'neocortex': 'bg-blue-100 text-blue-700'
  };
  return colors[brain] || '';
}

function translateFluency(fluency: string): string {
  const translations: Record<string, string> = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'native': 'Nativa'
  };
  return translations[fluency] || fluency;
}

export default GenerationProfileCard;
