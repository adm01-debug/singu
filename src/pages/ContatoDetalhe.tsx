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
  Plus,
  Sparkles,
  User,
  Users,
  Brain,
  Target,
  AlertCircle,
  Zap,
  TrendingUp,
  Shield,
  Bell
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DynamicBreadcrumbs } from '@/components/layout/DynamicBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge, DISCChart } from '@/components/ui/disc-badge';
import { RelationshipStageBadge, RelationshipFunnel } from '@/components/ui/relationship-stage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BehaviorProfileForm } from '@/components/contacts/BehaviorProfileForm';
import { NextActionSuggestion } from '@/components/contacts/NextActionSuggestion';
import { InteractionTimeline } from '@/components/contacts/InteractionTimeline';
import { AIWritingAssistant } from '@/components/contacts/AIWritingAssistant';
import { mockContacts, mockInteractions, mockInsights, mockAlerts, mockCompanies } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DECISION_ROLE_LABELS, 
  DECISION_SPEED_LABELS, 
  CAREER_STAGE_LABELS,
  DECISION_CRITERIA_LABELS,
  ContactBehavior
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

const lifeEventIcons = {
  birthday: '🎂',
  anniversary: '🎉',
  promotion: '🚀',
  travel: '✈️',
  family: '👨‍👩‍👧‍👦',
  achievement: '🏆',
  other: '📌',
};

const ContatoDetalhe = () => {
  const { id } = useParams();
  const [contact, setContact] = useState(mockContacts.find(c => c.id === id));
  const [isEditingBehavior, setIsEditingBehavior] = useState(false);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  
  if (!contact) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Contato não encontrado</p>
          <Link to="/contatos">
            <Button variant="link">Voltar para contatos</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const contactInteractions = mockInteractions.filter(i => i.contactId === id);
  const contactInsights = mockInsights.filter(i => i.contactId === id);
  const contactAlerts = mockAlerts.filter(a => a.contactId === id && !a.dismissed);
  const contactCompany = mockCompanies.find(c => c.id === contact.companyId);

  const handleSaveBehavior = (behavior: ContactBehavior) => {
    setContact(prev => prev ? { ...prev, behavior } : prev);
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
                    <Avatar className="w-32 h-32 border-4 border-card shadow-strong">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center mt-4">
                      <h1 className="text-2xl font-bold text-foreground">
                        {contact.firstName} {contact.lastName}
                      </h1>
                      <p className="text-muted-foreground">{contact.roleTitle}</p>
                      
                      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                        <RoleBadge role={contact.role} />
                        <DISCBadge profile={contact.behavior.discProfile} size="sm" showLabel={false} />
                        <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-3">
                        <RelationshipStageBadge stage={contact.relationshipStage} />
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{contact.companyName}</span>
                      </div>
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
                      {contact.behavior.bestContactWindow && (
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

              {/* AI Next Action Suggestion */}
              <NextActionSuggestion 
                contact={contact}
                interactions={contactInteractions}
                company={contactCompany}
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
                            profile={contact.behavior.discProfile} 
                            confidence={contact.behavior.discConfidence}
                            size="md"
                          />
                          {contact.behavior.discNotes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {contact.behavior.discNotes}
                            </p>
                          )}
                        </div>
                        <DISCChart profile={contact.behavior.discProfile} />
                      </div>

                      {/* Decision Making */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            Tomada de Decisão
                          </h4>
                          <div className="space-y-3">
                            {contact.behavior.decisionRole && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Papel:</span>
                                <Badge variant="outline">
                                  {DECISION_ROLE_LABELS[contact.behavior.decisionRole]}
                                </Badge>
                              </div>
                            )}
                            {contact.behavior.decisionSpeed && (
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
                                      i < contact.behavior.decisionPower
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
                                      i < contact.behavior.supportLevel
                                        ? 'bg-success'
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {contact.behavior.decisionCriteria.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Critérios de Decisão (por prioridade)
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {contact.behavior.decisionCriteria.map((criteria, index) => (
                                <Badge key={criteria} variant="outline" className="text-xs">
                                  <span className="mr-1 text-primary font-bold">{index + 1}.</span>
                                  {DECISION_CRITERIA_LABELS[criteria]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Motivations Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                      {contact.behavior.primaryMotivation && (
                        <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                          <h4 className="text-sm font-medium text-success mb-1 flex items-center gap-1.5">
                            <Zap className="w-4 h-4" />
                            Motivação Principal
                          </h4>
                          <p className="text-sm text-foreground">{contact.behavior.primaryMotivation}</p>
                        </div>
                      )}
                      {contact.behavior.primaryFear && (
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
                      {contact.behavior.careerStage && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Carreira</p>
                          <p className="text-sm font-medium">{CAREER_STAGE_LABELS[contact.behavior.careerStage]}</p>
                        </div>
                      )}
                      {contact.behavior.budgetAuthority && (
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Orçamento</p>
                          <p className="text-sm font-medium">{contact.behavior.budgetAuthority}</p>
                        </div>
                      )}
                      {contact.behavior.avgResponseTimeHours && (
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
                              <span className="text-2xl">{lifeEventIcons[event.type]}</span>
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
                      onAddInteraction={() => {
                        // TODO: Open add interaction dialog
                        console.log('Add interaction');
                      }}
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
                                  {insight.actionSuggestion && (
                                    <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20">
                                      <p className="text-xs font-medium text-primary mb-1">🎯 Ação sugerida:</p>
                                      <p className="text-xs text-foreground">{insight.actionSuggestion}</p>
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
    </AppLayout>
  );
};

export default ContatoDetalhe;
