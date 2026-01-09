import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Users,
  Edit,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { mockInteractions, mockContacts } from '@/data/mockData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InteractionType } from '@/types';

const interactionIcons: Record<InteractionType, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: MessageSquare,
};

const interactionColors: Record<InteractionType, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-pink-100 text-pink-600',
};

const interactionLabels: Record<InteractionType, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
  social: 'Social',
};

const Interacoes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<InteractionType | null>(null);

  const filteredInteractions = mockInteractions
    .filter(interaction => {
      const matchesSearch = interaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            interaction.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !selectedType || interaction.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const types: InteractionType[] = ['whatsapp', 'call', 'email', 'meeting', 'note'];

  return (
    <AppLayout>
      <Header 
        title="Interações" 
        subtitle="Histórico de comunicações com seus contatos"
        showAddButton
        addButtonLabel="Nova Interação"
        onAddClick={() => console.log('Add interaction')}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar interações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              Todos
            </Button>
            {types.map(type => {
              const Icon = interactionIcons[type];
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {interactionLabels[type]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {filteredInteractions.map((interaction, index) => {
              const contact = mockContacts.find(c => c.id === interaction.contactId);
              const Icon = interactionIcons[interaction.type];
              
              return (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative pl-16"
                >
                  <div className={`absolute left-2 top-4 w-10 h-10 rounded-full flex items-center justify-center ${interactionColors[interaction.type]} border-4 border-background z-10`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${interactionColors[interaction.type].replace('bg-', 'border-').replace('/10', '/50')}`}>
                              {interactionLabels[interaction.type]}
                            </Badge>
                            <SentimentIndicator sentiment={interaction.sentiment} size="sm" />
                          </div>
                          <h3 className="font-semibold text-foreground">{interaction.title}</h3>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {format(interaction.createdAt, "d MMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div>{formatDistanceToNow(interaction.createdAt, { locale: ptBR, addSuffix: true })}</div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{interaction.content}</p>

                      {interaction.duration && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Duração: {Math.floor(interaction.duration / 60)} min
                        </p>
                      )}

                      {interaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {interaction.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {contact && (
                        <div className="flex items-center gap-3 pt-3 border-t border-border">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {contact.firstName[0]}{contact.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{contact.companyName}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {filteredInteractions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma interação encontrada
            </h3>
            <p className="text-muted-foreground">
              Registre suas comunicações para manter o histórico atualizado.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Interacoes;
