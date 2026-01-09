import { motion } from 'framer-motion';
import { Sparkles, User, Target, Brain, TrendingUp, Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockInsights, mockContacts } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const categoryIcons = {
  personality: Brain,
  preference: Target,
  behavior: TrendingUp,
  opportunity: Sparkles,
};

const categoryColors = {
  personality: 'bg-purple-100 text-purple-700 border-purple-200',
  preference: 'bg-blue-100 text-blue-700 border-blue-200',
  behavior: 'bg-green-100 text-green-700 border-green-200',
  opportunity: 'bg-amber-100 text-amber-700 border-amber-200',
};

const categoryLabels = {
  personality: 'Personalidade',
  preference: 'Preferência',
  behavior: 'Comportamento',
  opportunity: 'Oportunidade',
};

const Insights = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredInsights = mockInsights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          insight.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || insight.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['personality', 'preference', 'behavior', 'opportunity'] as const;

  return (
    <AppLayout>
      <Header 
        title="Insights" 
        subtitle="Inteligência gerada sobre seus contatos"
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => {
              const Icon = categoryIcons[category];
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {categoryLabels[category]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((insight, index) => {
            const contact = mockContacts.find(c => c.id === insight.contactId);
            const Icon = categoryIcons[insight.category];
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl ${categoryColors[insight.category].split(' ').slice(0, 1).join(' ')}`}>
                        <Icon className={`w-5 h-5 ${categoryColors[insight.category].split(' ').slice(1, 2).join(' ')}`} />
                      </div>
                      <Badge variant="outline" className={`text-xs ${categoryColors[insight.category]}`}>
                        {categoryLabels[insight.category]}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>

                    {contact && (
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{contact.companyName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-success">
                            {insight.confidence}% confiança
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(insight.createdAt, { locale: ptBR, addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">Fonte:</span> {insight.source}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum insight encontrado
            </h3>
            <p className="text-muted-foreground">
              Os insights são gerados automaticamente com base nas interações.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Insights;
