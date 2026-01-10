import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  FileText,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Mail,
  Phone,
  Users,
  Edit3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { PersuasionTemplate, MENTAL_TRIGGERS } from '@/types/triggers';
import { toast } from 'sonner';

interface PersuasionTemplatesProps {
  contact: Contact;
  className?: string;
}

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Users,
  any: FileText,
};

const channelLabels = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  call: 'Ligação',
  meeting: 'Reunião',
  any: 'Universal',
};

interface TemplateFillerProps {
  template: PersuasionTemplate;
  contact: Contact;
  onClose: () => void;
}

function TemplateFiller({ template, contact, onClose }: TemplateFillerProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      // Pré-preenche algumas variáveis conhecidas
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa_cliente') initial[v] = contact.companyName;
      else initial[v] = '';
    });
    return initial;
  });
  
  const [copied, setCopied] = useState(false);
  
  const filledTemplate = template.template.replace(
    /\{(\w+)\}/g, 
    (match, key) => variables[key] || match
  );
  
  const allFilled = template.variables.every(v => variables[v]?.trim());
  
  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {template.variables.map(variable => (
          <div key={variable}>
            <Label htmlFor={variable} className="text-sm capitalize">
              {variable.replace(/_/g, ' ')}
            </Label>
            <Input
              id={variable}
              value={variables[variable] || ''}
              onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
              placeholder={`Digite ${variable.replace(/_/g, ' ')}`}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      
      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea
          value={filledTemplate}
          readOnly
          className="mt-1 h-32 bg-secondary/30"
        />
      </div>
      
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas:</p>
          <ul className="space-y-1">
            {template.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={handleCopy} 
          disabled={!allFilled}
          className="flex-1 gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar Mensagem'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

export function PersuasionTemplates({ contact, className }: PersuasionTemplatesProps) {
  const { allTemplates, analysis } = useClientTriggers(contact);
  const [selectedTemplate, setSelectedTemplate] = useState<PersuasionTemplate | null>(null);
  
  // Filtra templates relevantes para o contato
  const relevantTemplates = allTemplates.filter(t => 
    t.discProfile === null || t.discProfile === contact.behavior?.discProfile
  );
  
  // Agrupa por gatilho
  const templatesByTrigger = relevantTemplates.reduce((acc, template) => {
    if (!acc[template.trigger]) acc[template.trigger] = [];
    acc[template.trigger].push(template);
    return acc;
  }, {} as Record<string, PersuasionTemplate[]>);
  
  // Ordena pelos gatilhos mais recomendados
  const sortedTriggers = Object.keys(templatesByTrigger).sort((a, b) => {
    const scoreA = analysis?.primaryTriggers.find(t => t.trigger.id === a)?.matchScore || 0;
    const scoreB = analysis?.primaryTriggers.find(t => t.trigger.id === b)?.matchScore || 0;
    return scoreB - scoreA;
  });
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Templates de Persuasão
          <Badge variant="secondary" className="ml-auto">
            {relevantTemplates.length} templates
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedTriggers.map(triggerId => {
              const trigger = MENTAL_TRIGGERS[triggerId as keyof typeof MENTAL_TRIGGERS];
              const templates = templatesByTrigger[triggerId];
              const suggestion = analysis?.primaryTriggers.find(t => t.trigger.id === triggerId);
              
              if (!trigger) return null;
              
              return (
                <motion.div
                  key={triggerId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div className={cn(
                    'p-3 flex items-center gap-3',
                    trigger.color
                  )}>
                    <span className="text-xl">{trigger.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{trigger.name}</h4>
                      <p className="text-xs opacity-80">{trigger.description}</p>
                    </div>
                    {suggestion && (
                      <Badge variant="secondary" className="bg-background/50">
                        {suggestion.matchScore}% match
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-3 space-y-2 bg-card">
                    {templates.map(template => {
                      const ChannelIcon = channelIcons[template.channel];
                      
                      return (
                        <Dialog key={template.id}>
                          <DialogTrigger asChild>
                            <div 
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors group"
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <div className="p-1.5 rounded bg-secondary/50">
                                <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{template.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {channelLabels[template.channel]}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </DialogTrigger>
                          
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-xl">{trigger.icon}</span>
                                {template.title}
                              </DialogTitle>
                            </DialogHeader>
                            <TemplateFiller 
                              template={template} 
                              contact={contact}
                              onClose={() => setSelectedTemplate(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
