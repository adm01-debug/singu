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
  Instagram,
  Twitter,
  Star,
  Edit,
  Plus,
  Sparkles,
  User,
  Users,
  Briefcase
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockContacts, mockInteractions, mockInsights } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const ContatoDetalhe = () => {
  const { id } = useParams();
  const contact = mockContacts.find(c => c.id === id);
  
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

  return (
    <AppLayout>
      <div className="min-h-screen">
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
          <div className="absolute top-4 right-4">
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
                      
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <RoleBadge role={contact.role} />
                        <SentimentIndicator sentiment={contact.sentiment} showLabel size="sm" />
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{contact.companyName}</span>
                      </div>
                    </div>

                    <div className="w-full mt-6">
                      <RelationshipScore score={contact.relationshipScore} size="lg" showLabel />
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
                      {contact.bestTimeToContact && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Melhor horário: {contact.bestTimeToContact}</span>
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
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About / Personality */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Sobre {contact.firstName}
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

                    {/* Communication Style */}
                    {contact.communicationStyle && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Estilo de Comunicação</h4>
                        <Badge variant="outline" className="capitalize">
                          {contact.communicationStyle === 'formal' && 'Formal'}
                          {contact.communicationStyle === 'casual' && 'Casual'}
                          {contact.communicationStyle === 'technical' && 'Técnico'}
                          {contact.communicationStyle === 'emotional' && 'Emocional'}
                        </Badge>
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tabs for Interactions and Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
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
                    <div className="flex justify-end mb-4">
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Registrar Interação
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {contactInteractions.map((interaction, index) => {
                        const Icon = interactionIcons[interaction.type];
                        const colorClass = interactionColors[interaction.type];
                        
                        return (
                          <motion.div
                            key={interaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="card-hover">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className={`p-2.5 rounded-xl ${colorClass}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium text-foreground">{interaction.title}</h4>
                                      <div className="flex items-center gap-2">
                                        <SentimentIndicator sentiment={interaction.sentiment} size="sm" />
                                        <span className="text-xs text-muted-foreground">
                                          {format(interaction.createdAt, "d MMM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{interaction.content}</p>
                                    {interaction.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-3">
                                        {interaction.tags.map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                      {contactInteractions.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Nenhuma interação registrada ainda</p>
                        </div>
                      )}
                    </div>
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
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {insight.confidence}% confiança
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{insight.description}</p>
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
    </AppLayout>
  );
};

export default ContatoDetalhe;
