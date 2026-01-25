import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Anchor, 
  Plus, 
  Trash2,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Heart,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { DEMO_CONTACT } from '@/lib/demo-contact';

interface AnchorRecord {
  id: string;
  type: 'positive' | 'negative';
  trigger: string;
  emotionalState: string;
  context: string;
  strength: 1 | 2 | 3;
  detectedAt: string;
  howToActivate?: string;
}

interface AnchorTrackingSystemProps {
  contact?: Contact;
  anchors?: AnchorRecord[];
  onAnchorsChange?: (anchors: AnchorRecord[]) => void;
  className?: string;
}

const COMMON_POSITIVE_ANCHORS = [
  { trigger: 'Mencionar família', state: 'Orgulho/Amor', activate: 'Pergunte sobre os filhos/cônjuge' },
  { trigger: 'Falar de conquistas', state: 'Confiança', activate: 'Relembre sucessos passados' },
  { trigger: 'Elogios sinceros', state: 'Receptividade', activate: 'Reconheça algo específico' },
  { trigger: 'Usar o nome', state: 'Conexão', activate: 'Use o nome dele várias vezes' },
  { trigger: 'Humor leve', state: 'Relaxamento', activate: 'Faça uma piada leve' }
];

const COMMON_NEGATIVE_ANCHORS = [
  { trigger: 'Pressão de tempo', state: 'Ansiedade', avoid: 'Não diga "precisa decidir agora"' },
  { trigger: 'Falar de concorrentes', state: 'Defensividade', avoid: 'Evite comparações diretas' },
  { trigger: 'Perguntas invasivas', state: 'Fechamento', avoid: 'Não force intimidade' },
  { trigger: 'Jargões técnicos', state: 'Confusão', avoid: 'Simplifique a linguagem' }
];

const AnchorTrackingSystem: React.FC<AnchorTrackingSystemProps> = ({
  contact,
  anchors: initialAnchors = [],
  onAnchorsChange,
  className
}) => {
  const [anchors, setAnchors] = useState<AnchorRecord[]>(initialAnchors);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnchor, setNewAnchor] = useState({
    type: 'positive' as 'positive' | 'negative',
    trigger: '',
    emotionalState: '',
    context: ''
  });

  const positiveAnchors = anchors.filter(a => a.type === 'positive');
  const negativeAnchors = anchors.filter(a => a.type === 'negative');

  const addAnchor = () => {
    if (!newAnchor.trigger || !newAnchor.emotionalState) return;

    const anchor: AnchorRecord = {
      id: `anchor-${Date.now()}`,
      type: newAnchor.type,
      trigger: newAnchor.trigger,
      emotionalState: newAnchor.emotionalState,
      context: newAnchor.context,
      strength: 2,
      detectedAt: new Date().toISOString()
    };

    const updated = [...anchors, anchor];
    setAnchors(updated);
    onAnchorsChange?.(updated);
    setNewAnchor({ type: 'positive', trigger: '', emotionalState: '', context: '' });
    setShowAddForm(false);
  };

  const addFromSuggestion = (type: 'positive' | 'negative', item: any) => {
    const anchor: AnchorRecord = {
      id: `anchor-${Date.now()}`,
      type,
      trigger: item.trigger,
      emotionalState: item.state,
      context: 'Âncora comum sugerida',
      strength: 2,
      detectedAt: new Date().toISOString(),
      howToActivate: type === 'positive' ? item.activate : item.avoid
    };

    const updated = [...anchors, anchor];
    setAnchors(updated);
    onAnchorsChange?.(updated);
  };

  const removeAnchor = (id: string) => {
    const updated = anchors.filter(a => a.id !== id);
    setAnchors(updated);
    onAnchorsChange?.(updated);
  };

  const updateStrength = (id: string, strength: 1 | 2 | 3) => {
    const updated = anchors.map(a => a.id === id ? { ...a, strength } : a);
    setAnchors(updated);
    onAnchorsChange?.(updated);
  };

  const getStrengthLabel = (strength: number) => {
    switch (strength) {
      case 1: return 'Fraca';
      case 2: return 'Moderada';
      case 3: return 'Forte';
      default: return 'Moderada';
    }
  };

  const getStrengthColor = (strength: number, type: string) => {
    if (type === 'positive') {
      switch (strength) {
        case 1: return 'bg-green-500/20';
        case 2: return 'bg-green-500/40';
        case 3: return 'bg-green-500/60';
      }
    } else {
      switch (strength) {
        case 1: return 'bg-red-500/20';
        case 2: return 'bg-red-500/40';
        case 3: return 'bg-red-500/60';
      }
    }
  };

  return (
    <Card className={cn("border-teal-500/30 bg-gradient-to-br from-teal-950/20 to-background", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Anchor className="h-5 w-5 text-teal-400" />
            Anchor Tracking System
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/20 text-green-400">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {positiveAnchors.length}
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 text-red-400">
              <ThumbsDown className="h-3 w-3 mr-1" />
              {negativeAnchors.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Rastreie âncoras emocionais de {contact.firstName} - o que ativa estados positivos e negativos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Anchor Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {showAddForm ? 'Cancelar' : 'Adicionar Âncora'}
        </Button>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/30 rounded-lg p-3 space-y-3"
            >
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newAnchor.type === 'positive' ? 'default' : 'outline'}
                  onClick={() => setNewAnchor(prev => ({ ...prev, type: 'positive' }))}
                  className="flex-1"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Positiva
                </Button>
                <Button
                  size="sm"
                  variant={newAnchor.type === 'negative' ? 'default' : 'outline'}
                  onClick={() => setNewAnchor(prev => ({ ...prev, type: 'negative' }))}
                  className="flex-1"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Negativa
                </Button>
              </div>
              
              <Input
                placeholder="Gatilho (ex: mencionar família)"
                value={newAnchor.trigger}
                onChange={(e) => setNewAnchor(prev => ({ ...prev, trigger: e.target.value }))}
              />
              <Input
                placeholder="Estado emocional ativado (ex: alegria)"
                value={newAnchor.emotionalState}
                onChange={(e) => setNewAnchor(prev => ({ ...prev, emotionalState: e.target.value }))}
              />
              <Input
                placeholder="Contexto onde foi detectado (opcional)"
                value={newAnchor.context}
                onChange={(e) => setNewAnchor(prev => ({ ...prev, context: e.target.value }))}
              />
              <Button size="sm" onClick={addAnchor} className="w-full">
                Salvar Âncora
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Positive Anchors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-400" />
            Âncoras Positivas (Ativar)
          </h4>
          
          {positiveAnchors.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
              <p className="mb-2">Nenhuma âncora positiva registrada. Sugestões comuns:</p>
              <div className="flex flex-wrap gap-1">
                {COMMON_POSITIVE_ANCHORS.filter(
                  ca => !anchors.some(a => a.trigger === ca.trigger)
                ).slice(0, 3).map((ca, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => addFromSuggestion('positive', ca)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {ca.trigger}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {positiveAnchors.map(anchor => (
                <motion.div
                  key={anchor.id}
                  layout
                  className="bg-green-500/10 rounded-lg p-3 border border-green-500/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-sm">{anchor.trigger}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        → Ativa: <span className="text-green-400">{anchor.emotionalState}</span>
                      </div>
                      {anchor.howToActivate && (
                        <div className="text-xs bg-green-500/20 rounded p-1.5 mt-2">
                          💡 {anchor.howToActivate}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(s => (
                          <button
                            key={s}
                            onClick={() => updateStrength(anchor.id, s as 1 | 2 | 3)}
                            className={cn(
                              "w-2 h-4 rounded-sm transition-colors",
                              s <= anchor.strength ? 'bg-green-400' : 'bg-muted/50'
                            )}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeAnchor(anchor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Negative Anchors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Âncoras Negativas (Evitar)
          </h4>
          
          {negativeAnchors.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
              <p className="mb-2">Nenhuma âncora negativa registrada. Armadilhas comuns:</p>
              <div className="flex flex-wrap gap-1">
                {COMMON_NEGATIVE_ANCHORS.filter(
                  ca => !anchors.some(a => a.trigger === ca.trigger)
                ).slice(0, 3).map((ca, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 border-red-500/30"
                    onClick={() => addFromSuggestion('negative', ca)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {ca.trigger}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {negativeAnchors.map(anchor => (
                <motion.div
                  key={anchor.id}
                  layout
                  className="bg-red-500/10 rounded-lg p-3 border border-red-500/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-400" />
                        <span className="font-medium text-sm">{anchor.trigger}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        → Ativa: <span className="text-red-400">{anchor.emotionalState}</span>
                      </div>
                      {anchor.howToActivate && (
                        <div className="text-xs bg-red-500/20 rounded p-1.5 mt-2">
                          ⚠️ {anchor.howToActivate}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(s => (
                          <button
                            key={s}
                            onClick={() => updateStrength(anchor.id, s as 1 | 2 | 3)}
                            className={cn(
                              "w-2 h-4 rounded-sm transition-colors",
                              s <= anchor.strength ? 'bg-red-400' : 'bg-muted/50'
                            )}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeAnchor(anchor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Strategy Summary */}
        {(positiveAnchors.length > 0 || negativeAnchors.length > 0) && (
          <div className="bg-teal-500/10 rounded-lg p-3 border border-teal-500/30">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-teal-400" />
              Estratégia de Âncoras para {contact.firstName}
            </h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              {positiveAnchors.length > 0 && (
                <p>
                  <span className="text-green-400">✓ ATIVAR:</span>{' '}
                  {positiveAnchors.slice(0, 3).map(a => a.trigger).join(', ')}
                </p>
              )}
              {negativeAnchors.length > 0 && (
                <p>
                  <span className="text-red-400">✗ EVITAR:</span>{' '}
                  {negativeAnchors.slice(0, 3).map(a => a.trigger).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnchorTrackingSystem;
