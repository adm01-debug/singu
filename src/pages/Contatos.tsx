import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Building2,
  Search,
  Filter,
  Grid3X3,
  List,
  Heart,
  Linkedin,
  Instagram,
  Brain
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { mockContacts } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

const Contatos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredContacts = mockContacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.roleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <Header 
        title="Contatos" 
        subtitle={`${mockContacts.length} pessoas cadastradas`}
        showAddButton
        addButtonLabel="Novo Contato"
        onAddClick={() => console.log('Add contact')}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contacts Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/contatos/${contact.id}`}>
                  <Card className="h-full card-hover group cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header with gradient */}
                      <div className="h-16 bg-gradient-primary relative">
                        <div className="absolute -bottom-8 left-5">
                          <Avatar className="w-16 h-16 border-4 border-card shadow-medium">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                              {contact.firstName[0]}{contact.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="absolute top-3 right-3">
                          <RelationshipScore score={contact.relationshipScore} size="sm" />
                        </div>
                      </div>

                      <div className="pt-10 px-5 pb-5">
                        <div className="mb-3">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{contact.roleTitle}</p>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{contact.companyName}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <RoleBadge role={contact.role} />
                          <DISCBadge profile={contact.behavior.discProfile} size="sm" showLabel={false} />
                          <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                        </div>

                        <div className="mb-4">
                          <RelationshipStageBadge stage={contact.relationshipStage} />
                        </div>

                        {/* Hobbies */}
                        {contact.hobbies.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-4">
                            <Heart className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {contact.hobbies.slice(0, 2).join(', ')}
                              {contact.hobbies.length > 2 && ` +${contact.hobbies.length - 2}`}
                            </span>
                          </div>
                        )}

                        {/* Contact Methods */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                          {contact.whatsapp && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}
                          {contact.phone && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                          {contact.email && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                          {contact.linkedin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-info">
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          )}
                          {contact.instagram && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-500">
                              <Instagram className="w-4 h-4" />
                            </Button>
                          )}
                          <div className="ml-auto text-xs text-muted-foreground">
                            {contact.interactionCount} interações
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Link to={`/contatos/${contact.id}`}>
                  <Card className="card-hover cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">
                              {contact.firstName} {contact.lastName}
                            </h3>
                            <RoleBadge role={contact.role} />
                            <DISCBadge profile={contact.behavior.discProfile} size="sm" showLabel={false} />
                            <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{contact.roleTitle}</span>
                            <span>•</span>
                            <span>{contact.companyName}</span>
                            <span>•</span>
                            <RelationshipStageBadge stage={contact.relationshipStage} />
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                          {contact.hobbies.slice(0, 2).map(hobby => (
                            <Badge key={hobby} variant="secondary" className="text-xs">
                              {hobby}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {contact.interactionCount} interações
                          </div>
                          {contact.lastInteraction && (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })}
                            </div>
                          )}
                        </div>

                        <RelationshipScore score={contact.relationshipScore} size="sm" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum contato encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar sua busca ou adicione um novo contato.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Contatos;
