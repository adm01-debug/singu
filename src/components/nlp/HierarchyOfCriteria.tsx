import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ListOrdered, 
  Plus, 
  GripVertical,
  Trash2,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';

interface Criterion {
  id: string;
  name: string;
  importance: number;
  detectedFrom?: string;
  howToAddress?: string;
}

interface HierarchyOfCriteriaProps {
  contact: Contact;
  initialCriteria?: Criterion[];
  onCriteriaChange?: (criteria: Criterion[]) => void;
  className?: string;
}

const COMMON_CRITERIA = [
  { name: 'Preço/Custo', howToAddress: 'Mostre ROI, compare com custo de não agir' },
  { name: 'Qualidade', howToAddress: 'Apresente certificações, garantias, materiais' },
  { name: 'Confiança/Segurança', howToAddress: 'Testemunhos, tempo de mercado, garantias' },
  { name: 'Rapidez/Prazo', howToAddress: 'Defina prazos claros, mostre cases de entrega' },
  { name: 'Suporte/Atendimento', howToAddress: 'Detalhe canais de suporte, SLAs' },
  { name: 'Inovação/Tecnologia', howToAddress: 'Mostre diferenciais técnicos, roadmap' },
  { name: 'Reputação/Marca', howToAddress: 'Apresente clientes conhecidos, prêmios' },
  { name: 'Facilidade de Uso', howToAddress: 'Demo, treinamento incluso, onboarding' },
  { name: 'Personalização', howToAddress: 'Mostre flexibilidade, cases customizados' },
  { name: 'Relacionamento', howToAddress: 'Demonstre interesse genuíno, follow-up' }
];

const HierarchyOfCriteria: React.FC<HierarchyOfCriteriaProps> = ({
  contact,
  initialCriteria = [],
  onCriteriaChange,
  className
}) => {
  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [newCriterion, setNewCriterion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addCriterion = (name: string, howToAddress?: string) => {
    const newItem: Criterion = {
      id: `crit-${Date.now()}`,
      name,
      importance: criteria.length + 1,
      howToAddress: howToAddress || 'A definir baseado em conversas'
    };
    
    const updated = [...criteria, newItem];
    setCriteria(updated);
    onCriteriaChange?.(updated);
    setNewCriterion('');
    setShowSuggestions(false);
  };

  const removeCriterion = (id: string) => {
    const updated = criteria.filter(c => c.id !== id).map((c, idx) => ({
      ...c,
      importance: idx + 1
    }));
    setCriteria(updated);
    onCriteriaChange?.(updated);
  };

  const moveCriterion = (id: string, direction: 'up' | 'down') => {
    const idx = criteria.findIndex(c => c.id === id);
    if (
      (direction === 'up' && idx === 0) || 
      (direction === 'down' && idx === criteria.length - 1)
    ) return;

    const newCriteria = [...criteria];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [newCriteria[idx], newCriteria[targetIdx]] = [newCriteria[targetIdx], newCriteria[idx]];
    
    const updated = newCriteria.map((c, i) => ({ ...c, importance: i + 1 }));
    setCriteria(updated);
    onCriteriaChange?.(updated);
  };

  const getImportanceColor = (importance: number) => {
    if (importance === 1) return 'text-yellow-400 bg-yellow-500/20';
    if (importance === 2) return 'text-orange-400 bg-orange-500/20';
    if (importance === 3) return 'text-blue-400 bg-blue-500/20';
    return 'text-muted-foreground bg-muted/50';
  };

  const getImportanceLabel = (importance: number) => {
    if (importance === 1) return 'Decisivo';
    if (importance === 2) return 'Muito Importante';
    if (importance === 3) return 'Importante';
    return 'Secundário';
  };

  return (
    <Card className={cn("border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-background", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-amber-400" />
            Hierarquia de Critérios
          </CardTitle>
          <Badge variant="outline" className="bg-amber-500/20">
            {criteria.length} critérios
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ordene os critérios de decisão de {contact.firstName} por importância
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Criterion */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar critério de decisão..."
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newCriterion && addCriterion(newCriterion)}
              className="flex-1"
            />
            <Button 
              size="sm" 
              onClick={() => newCriterion && addCriterion(newCriterion)}
              disabled={!newCriterion}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            {showSuggestions ? 'Ocultar' : 'Ver'} Critérios Comuns
          </Button>
        </div>

        {/* Suggested Criteria */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1"
            >
              {COMMON_CRITERIA.filter(cc => !criteria.some(c => c.name === cc.name)).map(cc => (
                <Button
                  key={cc.name}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => addCriterion(cc.name, cc.howToAddress)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cc.name}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Criteria List */}
        {criteria.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum critério adicionado ainda</p>
            <p className="text-xs mt-1">
              Adicione critérios detectados nas conversas com {contact.firstName}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {criteria.map((criterion, idx) => (
                <motion.div
                  key={criterion.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "bg-muted/30 rounded-lg p-3 border-l-4",
                    criterion.importance === 1 ? 'border-l-yellow-500' :
                    criterion.importance === 2 ? 'border-l-orange-500' :
                    criterion.importance === 3 ? 'border-l-blue-500' :
                    'border-l-muted'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveCriterion(criterion.id, 'up')}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveCriterion(criterion.id, 'down')}
                        disabled={idx === criteria.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getImportanceColor(criterion.importance)}>
                          #{criterion.importance}
                        </Badge>
                        <span className="font-medium text-sm">{criterion.name}</span>
                        {criterion.importance === 1 && (
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className={getImportanceColor(criterion.importance).split(' ')[0]}>
                          {getImportanceLabel(criterion.importance)}
                        </span>
                      </div>

                      {criterion.howToAddress && (
                        <div className="text-xs bg-amber-500/10 rounded p-2 mt-2">
                          <span className="text-amber-400 font-medium">Como abordar: </span>
                          <span className="text-muted-foreground">{criterion.howToAddress}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => removeCriterion(criterion.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Strategy Summary */}
        {criteria.length >= 2 && (
          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Estratégia de Abordagem
            </h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>
                <strong className="text-amber-400">Foco Principal:</strong>{' '}
                Lidere com <strong>{criteria[0]?.name}</strong> - este é o critério decisivo.
              </p>
              {criteria[1] && (
                <p>
                  <strong className="text-orange-400">Reforço:</strong>{' '}
                  Conecte com <strong>{criteria[1].name}</strong> para criar convicção.
                </p>
              )}
              {criteria.length > 3 && (
                <p className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-blue-400" />
                  <span>Critérios secundários ({criteria.slice(3).map(c => c.name).join(', ')}) são bons para diferenciação.</span>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HierarchyOfCriteria;
