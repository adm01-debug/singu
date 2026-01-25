import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Building2, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Clock,
  Heart,
  Linkedin,
  Star,
  Edit,
  Sparkles,
  User,
  Users,
  Brain,
  Target,
  AlertCircle,
  Zap,
  Shield,
  Bell,
  Package,
  Settings2,
  CalendarHeart,
  CalendarClock
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DynamicBreadcrumbs } from '@/components/layout/DynamicBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge, DISCChart } from '@/components/ui/disc-badge';
import { RelationshipStageBadge, RelationshipFunnel } from '@/components/ui/relationship-stage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BehaviorProfileForm } from '@/components/contacts/BehaviorProfileForm';
import { NextActionSuggestion } from '@/components/contacts/NextActionSuggestion';
import { InteractionTimeline } from '@/components/contacts/InteractionTimeline';
import { InteractionForm } from '@/components/forms/InteractionForm';
import { AIWritingAssistant } from '@/components/contacts/AIWritingAssistant';
import { ClientTriggerPanel } from '@/components/triggers/ClientTriggerPanel';
import { PersuasionTemplates } from '@/components/triggers/PersuasionTemplates';
import { TriggerUsageHistory } from '@/components/triggers/TriggerUsageHistory';
import { VAKTemplateLibrary } from '@/components/triggers/VAKTemplateLibrary';
import { SleightOfMouthLibrary } from '@/components/triggers/SleightOfMouthLibrary';
import { MetaprogramProfileCard } from '@/components/triggers/MetaprogramProfileCard';
import { MetaprogramTemplateLibrary } from '@/components/triggers/MetaprogramTemplateLibrary';
import { VAKProfileCard } from '@/components/contacts/VAKProfileCard';
import { UnifiedNLPDashboard } from '@/components/triggers/UnifiedNLPDashboard';
import { SalesIntelligenceDashboard } from '@/components/triggers/SalesIntelligenceDashboard';
import { QuickNLPInsights } from '@/components/triggers/QuickNLPInsights';
import { ExecutiveBehaviorSummary } from '@/components/profile/ExecutiveBehaviorSummary';
import { ClosingScorePanel } from '@/components/analytics/ClosingScorePanel';
import { EmotionalIntelligencePanel } from '@/components/analytics/EmotionalIntelligencePanel';
import { CognitiveBiasesPanel } from '@/components/analytics/CognitiveBiasesPanel';
import { BehaviorEvolutionChart } from '@/components/analytics/BehaviorEvolutionChart';
import { UnifiedBehavioralProfilePanel } from '@/components/analytics/UnifiedBehavioralProfilePanel';
import { ApproachRecommendationPanel } from '@/components/analytics/ApproachRecommendationPanel';
import { ClientHealthPanel } from '@/components/analytics/ClientHealthPanel';
import { PersonalizedOffersPanel } from '@/components/analytics/PersonalizedOffersPanel';
import { ImportantDatesPanel } from '@/components/analytics/ImportantDatesPanel';
import { SatisfactionScorePanel } from '@/components/analytics/SatisfactionScorePanel';
import { PurchasePatternsPanel } from '@/components/analytics/PurchasePatternsPanel';
import { BehaviorAlertsPanel } from '@/components/analytics/BehaviorAlertsPanel';
import { PurchaseHistoryForm } from '@/components/forms/PurchaseHistoryForm';
import { CommunicationPreferencesForm } from '@/components/forms/CommunicationPreferencesForm';
import { LifeEventForm } from '@/components/forms/LifeEventForm';
import { ContactPreferencesPanel } from '@/components/preferences/ContactPreferencesPanel';
import { SocialProfilesPanel } from '@/components/social/SocialProfilesPanel';
import { RFMAnalysisPanel } from '@/components/analytics/RFMAnalysisPanel';
import DISCProfileExpanded from '@/components/profile/DISCProfileExpanded';
import { 
  DISCEvolutionTimeline, 
  DISCSalesScriptGenerator, 
  DISCTemplateLibrary,
  DISCCompatibilityAlerts
} from '@/components/disc';
import {
  NLPEvolutionTimeline,
  NLPTrainingMode,
  UnifiedScriptGenerator,
  CommunicationCoherencePanel,
  NLPConversionMetrics
} from '@/components/nlp';
import {
  NeuroDecisionPath,
  PainClaimGainBuilder,
  NeuroEnrichedTriggers,
  NeuroCompatibilityAnalysis,
  NeuroScore,
  NeuroAlerts,
  NeuroRadarChart,
  NeuroTimeline,
  NeuroScriptGenerator
} from '@/components/neuromarketing';
import { CadenceSettingsDialog } from '@/components/cadence/CadenceSettingsDialog';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useContacts, Contact as ContactFromHook } from '@/hooks/useContacts';
import { useDISCAutoAnalysis } from '@/hooks/useDISCAutoAnalysis';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DECISION_ROLE_LABELS, 
  DECISION_SPEED_LABELS, 
  CAREER_STAGE_LABELS,
  DECISION_CRITERIA_LABELS,
  ContactBehavior,
  CompanyHealth
} from '@/types';

const interactionIcons = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Star,
};

const interactionColors = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-pink-100 text-pink-600',
};

const lifeEventIcons: Record<string, string> = {
  birthday: '🎂',
  anniversary: '🎉',
  promotion: '🚀',
  travel: '✈️',
  family: '👨‍👩‍👧‍👦',
  achievement: '🏆',
  other: '📌',
};

// Helper function to transform database contact to component-compatible format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformContact = (contact: any, companyName?: string) => {
  const behavior = contact.behavior || {};
  return {
    id: contact.id,
    companyId: contact.company_id,
    companyName: companyName || '',
    firstName: contact.first_name,
    lastName: contact.last_name,
    role: contact.role || 'contact',
    roleTitle: contact.role_title || '',
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    linkedin: contact.linkedin,
    instagram: contact.instagram,
    twitter: contact.twitter,
    avatar: contact.avatar_url,
    birthday: contact.birthday ? new Date(contact.birthday) : undefined,
    notes: contact.notes,
    tags: contact.tags || [],
    hobbies: contact.hobbies || [],
    interests: contact.interests || [],
    familyInfo: contact.family_info,
    personalNotes: contact.personal_notes,
    relationshipStage: contact.relationship_stage || 'unknown',
    relationshipScore: contact.relationship_score || 0,
    sentiment: contact.sentiment || 'neutral',
    interactionCount: 0,
    behavior: {
      discProfile: behavior.discProfile || null,
      discConfidence: behavior.discConfidence || 0,
      discNotes: behavior.discNotes,
      vakProfile: behavior.vakProfile,
      primaryMotivation: behavior.primaryMotivation,
      primaryFear: behavior.primaryFear,
      careerStage: behavior.careerStage,
      currentPressure: behavior.currentPressure,
      professionalGoals: behavior.professionalGoals,
      preferredChannel: behavior.preferredChannel || 'email',
      messageStyle: behavior.messageStyle,
      avgResponseTimeHours: behavior.avgResponseTimeHours,
      bestContactWindow: behavior.bestContactWindow,
      formalityLevel: behavior.formalityLevel || 3,
      decisionSpeed: behavior.decisionSpeed,
      decisionCriteria: behavior.decisionCriteria || [],
      needsApproval: behavior.needsApproval || false,
      approverContactId: behavior.approverContactId,
      budgetAuthority: behavior.budgetAuthority,
      decisionRole: behavior.decisionRole,
      decisionPower: behavior.decisionPower || 5,
      supportLevel: behavior.supportLevel || 5,
      influencedByIds: behavior.influencedByIds || [],
      influencesIds: behavior.influencesIds || [],
      companyFinancialHealth: behavior.companyFinancialHealth,
      currentChallenges: behavior.currentChallenges || [],
      competitorsUsed: behavior.competitorsUsed || [],
      bestTimeToApproach: behavior.bestTimeToApproach,
      seasonalNotes: behavior.seasonalNotes,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lifeEvents: (contact.life_events || []).map((e: any) => ({
      id: e.id || crypto.randomUUID(),
      type: e.type || 'other',
      title: e.title || '',
      date: new Date(e.date || Date.now()),
      notes: e.notes,
      reminder: e.reminder || false,
    })),
    createdAt: new Date(contact.created_at),
    updatedAt: new Date(contact.updated_at),
  };
};

// Helper function to transform database interaction to component-compatible format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInteraction = (interaction: any) => ({
  id: interaction.id,
  contactId: interaction.contact_id,
  companyId: interaction.company_id,
  type: interaction.type,
  title: interaction.title,
  content: interaction.content || '',
  audioUrl: interaction.audio_url,
  transcription: interaction.transcription,
  sentiment: interaction.sentiment || 'neutral',
  tags: interaction.tags || [],
  duration: interaction.duration,
  attachments: interaction.attachments,
  initiatedBy: interaction.initiated_by || 'us',
  responseTime: interaction.response_time,
  keyInsights: interaction.key_insights,
  followUpRequired: interaction.follow_up_required || false,
  followUpDate: interaction.follow_up_date ? new Date(interaction.follow_up_date) : undefined,
  createdAt: new Date(interaction.created_at),
});

// Loading skeleton component
const ContactDetailSkeleton = () => (
  <AppLayout>
    <div className="min-h-screen">
      <div className="px-6 pt-4">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="h-48 bg-gradient-primary relative" />
      <div className="px-6 -mt-24 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center -mt-16">
                <Skeleton className="w-32 h-32 rounded-full" />
                <Skeleton className="h-6 w-40 mt-4" />
                <Skeleton className="h-4 w-32 mt-2" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-24 w-full mt-6" />
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
);

const ContatoDetalhe = () => {
  const { id } = useParams();
  const { 
    contact: rawContact, 
    company: rawCompany, 
    interactions: rawInteractions, 
    insights, 
    alerts, 
    loading, 
    error,
    updateBehavior,
    refetch
  } = useContactDetail(id);
  
  const { contacts: allContacts } = useContacts();
  
  const [isEditingBehavior, setIsEditingBehavior] = useState(false);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);

  // Show loading state
  if (loading) {
    return <ContactDetailSkeleton />;
  }

  // Show error state
  if (error || !rawContact) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Contato não encontrado'}</p>
          <Link to="/contatos">
            <Button variant="link">Voltar para contatos</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Transform data to component-compatible format
  const contact = transformContact(rawContact, rawCompany?.name);
  const contactInteractions = rawInteractions.map(transformInteraction);
  const contactInsights = insights;
  const contactAlerts = alerts;

  const handleSaveBehavior = async (behavior: ContactBehavior) => {
    await updateBehavior(behavior as unknown as Record<string, unknown>);
    setIsEditingBehavior(false);
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Breadcrumbs */}
        <div className="px-6 pt-4">
          <DynamicBreadcrumbs 
            items={[{ label: 'Contatos', href: '/contatos' }]} 
            currentPage={`${contact.firstName} ${contact.lastName}`} 
          />
        </div>
        
        {/* Header with gradient background */}
        <div className="h-48 bg-gradient-primary relative">
          <div className="absolute top-4 left-4">
            <Link to="/contatos">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {contactAlerts.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2 text-white text-sm">
                <Bell className="w-4 h-4" />
                {contactAlerts.length} alerta{contactAlerts.length > 1 ? 's' : ''}
              </div>
            )}
            <Button className="bg-white/10 backdrop-blur hover:bg-white/20 text-white border-0">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="px-6 -mt-24 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-visible">
                <CardContent className="pt-0">
                  <div className="flex flex-col items-center -mt-16">
                    <OptimizedAvatar 
                      src={contact.avatar} 
                      alt={`${contact.firstName} ${contact.lastName}`}
                      fallback={`${contact.firstName[0]}${contact.lastName[0]}`}
                      size="xl"
                      className="border-4 border-card shadow-strong w-32 h-32"
                    />
                    
                    <div className="text-center mt-4">
                      <h1 className="text-2xl font-bold text-foreground">
                        {contact.firstName} {contact.lastName}
                      </h1>
                      <p className="text-muted-foreground">{contact.roleTitle}</p>
                      
                      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                        <RoleBadge role={contact.role} />
                        {contact.behavior?.discProfile && (
                          <DISCBadge profile={contact.behavior.discProfile} size="sm" showLabel={false} />
                        )}
                        <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-3">
                        <RelationshipStageBadge stage={contact.relationshipStage} />
                      </div>

                      {contact.companyName && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{contact.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full mt-6">
                      <RelationshipScore score={contact.relationshipScore} size="lg" showLabel />
                    </div>

                    {/* Relationship Funnel */}
                    <div className="w-full mt-4">
                      <RelationshipFunnel currentStage={contact.relationshipStage} />
                    </div>

                    {/* Contact Actions */}
                    <div className="grid grid-cols-4 gap-2 w-full mt-6">
                      {contact.whatsapp && (
                        <Button variant="outline" size="icon" className="h-12 w-full hover:bg-success/10 hover:text-success hover:border-success">
                          <MessageSquare className="w-5 h-5" />
                        </Button>
                      )}
                      {contact.phone && (
                        <Button variant="outline" size="icon" className="h-12 w-full hover:bg-info/10 hover:text-info hover:border-info">
                          <Phone className="w-5 h-5" />
                        </Button>
                      )}
                      {contact.email && (
                        <Button variant="outline" size="icon" className="h-12 w-full hover:bg-primary/10 hover:text-primary hover:border-primary">
                          <Mail className="w-5 h-5" />
                        </Button>
                      )}
                      {contact.linkedin && (
                        <Button variant="outline" size="icon" className="h-12 w-full hover:bg-info/10 hover:text-info hover:border-info">
                          <Linkedin className="w-5 h-5" />
                        </Button>
                      )}
                    </div>

                    {/* AI Writing Assistant Button */}
                    <Button 
                      onClick={() => setShowWritingAssistant(prev => !prev)}
                      className="w-full mt-4 gap-2 bg-gradient-primary hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4" />
                      {showWritingAssistant ? 'Fechar Assistente' : 'Assistente de Escrita IA'}
                    </Button>

                    {/* Cadence Setting */}
                    <div className="w-full mt-4 pt-4 border-t border-border">
                      <CadenceSettingsDialog
                        contactId={contact.id}
                        contactName={`${contact.firstName} ${contact.lastName}`}
                        trigger={
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                            <CalendarClock className="w-4 h-4" />
                            Definir Cadência de Contato
                          </Button>
                        }
                      />
                    </div>

                    {/* Quick Action Forms */}
                    <div className="w-full mt-4 pt-4 border-t border-border space-y-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Cadastro Rápido</p>
                      <div className="grid grid-cols-1 gap-2">
                        <PurchaseHistoryForm 
                          contactId={contact.id}
                          trigger={
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                              <Package className="w-4 h-4" />
                              Registrar Compra
                            </Button>
                          }
                        />
                        <CommunicationPreferencesForm 
                          contactId={contact.id}
                          trigger={
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                              <Settings2 className="w-4 h-4" />
                              Preferências de Contato
                            </Button>
                          }
                        />
                        <LifeEventForm 
                          contactId={contact.id}
                          trigger={
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                              <CalendarHeart className="w-4 h-4" />
                              Evento Importante
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="w-full space-y-3 mt-6 pt-6 border-t border-border">
                      {contact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{contact.email}</span>
                        </div>
                      )}
                      {contact.birthday && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{format(contact.birthday, "d 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                      )}
                      {contact.behavior?.bestContactWindow && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Melhor horário: {contact.behavior.bestContactWindow}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {contact.tags.length > 0 && (
                      <div className="w-full mt-6 pt-6 border-t border-border">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.map(tag => (
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

              {/* Alerts Card */}
              {contactAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Card className="mt-4 border-warning/50 bg-warning/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-warning">
                        <AlertCircle className="w-4 h-4" />
                        Alertas Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contactAlerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="p-2 rounded-lg bg-card border border-border">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Writing Assistant */}
              {showWritingAssistant && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AIWritingAssistant 
                    contact={contact}
                    interactions={contactInteractions}
                    onClose={() => setShowWritingAssistant(false)}
                  />
                </motion.div>
              )}

              {/* Contact Preferences Panel */}
              <ContactPreferencesPanel
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* Social Media Monitoring Panel */}
              <SocialProfilesPanel
                contactId={contact.id}
                linkedinUrl={contact.linkedin}
                twitterUrl={contact.twitter}
                instagramUrl={contact.instagram}
              />

              {/* RFM Analysis - Individual Contact */}
              <RFMAnalysisPanel contactId={contact.id} />

              {/* Quick NLP Insights - Resumo no Topo */}
              <QuickNLPInsights 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* Unified Behavioral Profile Panel - All 10 Frameworks */}
              <UnifiedBehavioralProfilePanel 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* Executive Behavior Summary - Consolidated Profile */}
              <ExecutiveBehaviorSummary 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* === NEUROMARKETING SECTION === */}
              
              {/* Neuro Score + Alerts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Neuro Score - Unified Score */}
                <NeuroScore
                  contactId={contact.id}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  discProfile={contact.behavior?.discProfile}
                  interactions={contactInteractions.map(i => ({
                    content: i.content,
                    transcription: i.transcription,
                    createdAt: i.createdAt.toISOString()
                  }))}
                />

                {/* Neuro Alerts - Real-time Neural Insights */}
                <NeuroAlerts
                  contactId={contact.id}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  discProfile={contact.behavior?.discProfile}
                  interactions={contactInteractions.map(i => ({
                    content: i.content,
                    transcription: i.transcription,
                    createdAt: i.createdAt.toISOString()
                  }))}
                  maxAlerts={5}
                />
              </div>

              {/* Neuro Radar + Timeline Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Neuro Radar Chart - 3-Brain Visualization */}
                <NeuroRadarChart
                  contactId={contact.id}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  discProfile={contact.behavior?.discProfile}
                  interactions={contactInteractions.map(i => ({
                    content: i.content,
                    transcription: i.transcription
                  }))}
                />

                {/* Neuro Timeline - Evolution History */}
                <NeuroTimeline
                  contactId={contact.id}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  discProfile={contact.behavior?.discProfile}
                  interactions={contactInteractions.map(i => ({
                    id: i.id,
                    content: i.content,
                    transcription: i.transcription,
                    createdAt: i.createdAt.toISOString()
                  }))}
                  maxEntries={5}
                />
              </div>

              {/* Neuro Script Generator - Brain-Optimized Communication */}
              <NeuroScriptGenerator
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
                discProfile={contact.behavior?.discProfile}
                interactions={contactInteractions.map(i => ({
                  content: i.content,
                  transcription: i.transcription
                }))}
              />

              {/* Neuro Decision Path - Brain System Analysis */}
              <NeuroDecisionPath
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
                discProfile={contact.behavior?.discProfile}
                interactions={contactInteractions.map(i => ({
                  content: i.content,
                  transcription: i.transcription
                }))}
              />

              {/* Pain-Claim-Gain Builder - SalesBrain Framework */}
              <PainClaimGainBuilder
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* Neuro-Enriched Triggers */}
              <NeuroEnrichedTriggers discProfile={contact.behavior?.discProfile} />

              {/* Neuro Compatibility Analysis */}
              <NeuroCompatibilityAnalysis
                salespersonDISC="I"
                contactDISC={contact.behavior?.discProfile as 'D' | 'I' | 'S' | 'C' | null}
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* === END NEUROMARKETING SECTION === */}

              {/* DISC Enterprise Profile - Advanced Behavioral Analysis */}
              <DISCProfileExpanded 
                contact={contact}
                onUpdate={refetch}
              />

              {/* DISC Evolution Timeline */}
              <DISCEvolutionTimeline contactId={contact.id} />

              {/* DISC Sales Script Generator */}
              <DISCSalesScriptGenerator contact={contact} />

              {/* DISC Template Library */}
              <DISCTemplateLibrary filterProfile={contact.behavior?.discProfile || undefined} />

              {/* DISC Compatibility Alerts for this Contact */}
              <DISCCompatibilityAlerts maxItems={3} />

              {/* Approach Recommendation Panel - AI Strategy */}
              <ApproachRecommendationPanel 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* Client Health Panel */}
              <ClientHealthPanel 
                contact={contact}
                interactions={contactInteractions}
              />

              {/* Satisfaction Score Panel */}
              <SatisfactionScorePanel 
                contact={contact}
                interactions={contactInteractions}
              />

              {/* Personalized Offers Panel */}
              <PersonalizedOffersPanel 
                contact={contact}
                interactions={contactInteractions}
              />

              {/* Purchase Patterns Panel */}
              <PurchasePatternsPanel />

              {/* Behavior Alerts Panel */}
              <BehaviorAlertsPanel />

              {/* Important Dates Panel */}
              <ImportantDatesPanel 
                contacts={allContacts.map(c => transformContact(c))}
                interactions={contactInteractions}
                singleContact={contact}
              />

              {/* AI Next Action Suggestion */}
              <NextActionSuggestion 
                contact={contact}
                interactions={contactInteractions}
                company={rawCompany ? {
                  id: rawCompany.id,
                  name: rawCompany.name,
                  industry: rawCompany.industry || '',
                  website: rawCompany.website,
                  phone: rawCompany.phone,
                  email: rawCompany.email,
                  address: rawCompany.address,
                  city: rawCompany.city,
                  state: rawCompany.state,
                  notes: rawCompany.notes,
                  tags: rawCompany.tags || [],
                  contactCount: 0,
                  financialHealth: (rawCompany.financial_health as CompanyHealth) || 'unknown',
                  employeeCount: rawCompany.employee_count,
                  annualRevenue: rawCompany.annual_revenue,
                  competitors: rawCompany.competitors || [],
                  challenges: rawCompany.challenges || [],
                  createdAt: new Date(rawCompany.created_at),
                  updatedAt: new Date(rawCompany.updated_at),
                } : undefined}
              />

              {/* Unified NLP Dashboard */}
              <UnifiedNLPDashboard 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription
                }))}
              />

              {/* AI Closing Score */}
              <ClosingScorePanel 
                contactId={contact.id} 
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* Emotional Intelligence Analysis (Goleman's 5 Pillars) */}
              <EmotionalIntelligencePanel 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* Cognitive Biases Detection */}
              <CognitiveBiasesPanel 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* Behavior Evolution Chart */}
              <BehaviorEvolutionChart 
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* Sales Intelligence Dashboard - Raio-X Completo */}
              <SalesIntelligenceDashboard 
                contact={contact}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription,
                  createdAt: i.createdAt.toISOString()
                }))}
              />

              {/* VAK Profile (PNL) */}
              <VAKProfileCard contact={contact} />

              {/* NLP Evolution Timeline - Tracks VAK/Emotional shifts over time */}
              <NLPEvolutionTimeline contactId={contact.id} />

              {/* Unified Script Generator - DISC + VAK + Metaprograms */}
              <UnifiedScriptGenerator contact={contact} />

              {/* Communication Coherence Panel - Message Alignment Checker */}
              <CommunicationCoherencePanel contact={contact} />

              {/* VAK Template Library */}
              <VAKTemplateLibrary contact={contact} />

              {/* Metaprograms Profile */}
              <MetaprogramProfileCard
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription
                }))}
              />

              {/* Metaprogram Templates */}
              <MetaprogramTemplateLibrary
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
                interactions={contactInteractions.map(i => ({
                  id: i.id,
                  content: i.content,
                  transcription: i.transcription
                }))}
              />

              {/* Sleight of Mouth Library */}
              <SleightOfMouthLibrary contact={contact} />

              {/* Mental Triggers Panel */}
              <ClientTriggerPanel contact={contact} />

              {/* Persuasion Templates */}
              <PersuasionTemplates contact={contact} />

              {/* Trigger Usage History */}
              <TriggerUsageHistory 
                contactId={contact.id} 
                contactName={`${contact.firstName} ${contact.lastName}`}
              />

              {/* Behavioral Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Perfil Comportamental
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingBehavior(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DISC Profile */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Perfil DISC</h4>
                          <DISCBadge 
                            profile={contact.behavior?.discProfile} 
                            confidence={contact.behavior?.discConfidence}
                            size="md"
                          />
                          {contact.behavior?.discNotes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {contact.behavior.discNotes}
                            </p>
                          )}
                        </div>
                        <DISCChart profile={contact.behavior?.discProfile} />
                      </div>

                      {/* Decision Making */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            Tomada de Decisão
                          </h4>
                          <div className="space-y-3">
                            {contact.behavior?.decisionRole && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Papel:</span>
                                <Badge variant="outline">
                                  {DECISION_ROLE_LABELS[contact.behavior.decisionRole]}
                                </Badge>
                              </div>
                            )}
                            {contact.behavior?.decisionSpeed && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Velocidade:</span>
                                <Badge variant="secondary">
                                  {DECISION_SPEED_LABELS[contact.behavior.decisionSpeed]}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Poder:</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-4 rounded-sm ${
                                      i < (contact.behavior?.decisionPower || 0)
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Apoio:</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-4 rounded-sm ${
                                      i < (contact.behavior?.supportLevel || 0)
                                        ? 'bg-success'
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {contact.behavior?.decisionCriteria && contact.behavior.decisionCriteria.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Critérios de Decisão (por prioridade)
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {contact.behavior.decisionCriteria.map((criteria, index) => (
                                <Badge key={criteria} variant="outline" className="text-xs">
                                  <span className="mr-1 text-primary font-bold">{index + 1}.</span>
                                  {DECISION_CRITERIA_LABELS[criteria as keyof typeof DECISION_CRITERIA_LABELS] || criteria}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Motivations Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                      {contact.behavior?.primaryMotivation && (
                        <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                          <h4 className="text-sm font-medium text-success mb-1 flex items-center gap-1.5">
                            <Zap className="w-4 h-4" />
                            Motivação Principal
                          </h4>
                          <p className="text-sm text-foreground">{contact.behavior.primaryMotivation}</p>
                        </div>
                      )}
                      {contact.behavior?.primaryFear && (
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                          <h4 className="text-sm font-medium text-destructive mb-1 flex items-center gap-1.5">
                            <Shield className="w-4 h-4" />
                            Medo/Preocupação
                          </h4>
                          <p className="text-sm text-foreground">{contact.behavior.primaryFear}</p>
                        </div>
                      )}
                    </div>

                    {/* Context Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {contact.behavior?.careerStage && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Carreira</p>
                          <p className="text-sm font-medium">{CAREER_STAGE_LABELS[contact.behavior.careerStage]}</p>
                        </div>
                      )}
                      {contact.behavior?.budgetAuthority && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Orçamento</p>
                          <p className="text-sm font-medium">{contact.behavior.budgetAuthority}</p>
                        </div>
                      )}
                      {contact.behavior?.avgResponseTimeHours && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Tempo de Resposta</p>
                          <p className="text-sm font-medium">~{contact.behavior.avgResponseTimeHours}h</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* About / Personal Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Notes */}
                    {contact.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Observações</h4>
                        <p className="text-foreground">{contact.notes}</p>
                      </div>
                    )}

                    {/* Hobbies & Interests */}
                    <div className="grid grid-cols-2 gap-4">
                      {contact.hobbies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-destructive" />
                            Hobbies
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {contact.hobbies.map(hobby => (
                              <Badge key={hobby} variant="secondary" className="text-xs">
                                {hobby}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {contact.interests.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-warning" />
                            Interesses
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {contact.interests.map(interest => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Family Info */}
                    {contact.familyInfo && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Família</h4>
                        <p className="text-foreground text-sm">{contact.familyInfo}</p>
                      </div>
                    )}

                    {/* Life Events */}
                    {contact.lifeEvents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Próximos Eventos
                        </h4>
                        <div className="space-y-2">
                          {contact.lifeEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                              <span className="text-2xl">{lifeEventIcons[event.type] || '📌'}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(event.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  {event.notes && ` • ${event.notes}`}
                                </p>
                              </div>
                              {event.reminder && (
                                <Bell className="w-4 h-4 text-warning" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tabs for Interactions and Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Tabs defaultValue="interactions" className="w-full">
                  <TabsList className="w-full justify-start bg-card border-b border-border rounded-none px-0">
                    <TabsTrigger value="interactions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Interações ({contactInteractions.length})
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Insights ({contactInsights.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="interactions" className="mt-4">
                    <InteractionTimeline 
                      interactions={contactInteractions}
                      onAddInteraction={() => setShowAddInteraction(true)}
                    />
                  </TabsContent>

                  <TabsContent value="insights" className="mt-4">
                    <div className="space-y-4">
                      {contactInsights.map((insight, index) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="card-hover border-warning/30 bg-warning/5">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-warning/10">
                                  <Sparkles className="w-5 h-5 text-warning" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{insight.title}</h4>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {insight.category === 'opportunity' && 'Oportunidade'}
                                        {insight.category === 'personality' && 'Personalidade'}
                                        {insight.category === 'preference' && 'Preferência'}
                                        {insight.category === 'behavior' && 'Comportamento'}
                                        {insight.category === 'risk' && 'Risco'}
                                        {insight.category === 'relationship' && 'Relacionamento'}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {insight.confidence}% confiança
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                                  {insight.action_suggestion && (
                                    <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20">
                                      <p className="text-xs font-medium text-primary mb-1">🎯 Ação sugerida:</p>
                                      <p className="text-xs text-foreground">{insight.action_suggestion}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Fonte: {insight.source}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                      {contactInsights.length === 0 && (
                        <div className="text-center py-8">
                          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Nenhum insight gerado ainda</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Profile Edit Dialog */}
      <Dialog open={isEditingBehavior} onOpenChange={setIsEditingBehavior}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <BehaviorProfileForm
            behavior={contact.behavior}
            onSave={handleSaveBehavior}
            onCancel={() => setIsEditingBehavior(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Interaction Dialog */}
      <Dialog open={showAddInteraction} onOpenChange={setShowAddInteraction}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <InteractionForm
            contacts={[{ 
              id: contact.id, 
              first_name: contact.firstName, 
              last_name: contact.lastName,
              email: contact.email || null,
              phone: contact.phone || null,
              company_id: contact.companyId || null,
              user_id: rawContact?.user_id || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar_url: contact.avatar || null,
              behavior: rawContact?.behavior || null,
              birthday: contact.birthday ? contact.birthday.toISOString() : null,
              family_info: contact.familyInfo || null,
              hobbies: contact.hobbies || null,
              instagram: contact.instagram || null,
              interests: contact.interests || null,
              life_events: null,
              linkedin: contact.linkedin || null,
              notes: contact.notes || null,
              personal_notes: contact.personalNotes || null,
              relationship_score: contact.relationshipScore || null,
              relationship_stage: contact.relationshipStage || null,
              role: contact.role || null,
              role_title: contact.roleTitle || null,
              sentiment: contact.sentiment || null,
              tags: contact.tags || null,
              twitter: contact.twitter || null,
              whatsapp: contact.whatsapp || null,
            } satisfies ContactFromHook]}
            defaultContactId={contact.id}
            defaultCompanyId={contact.companyId}
            onSubmit={async () => {
              setShowAddInteraction(false);
              refetch();
            }}
            onCancel={() => setShowAddInteraction(false)}
            isSubmitting={isSubmittingInteraction}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ContatoDetalhe;
