import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileJson, FileText, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ExportFormat = 'csv' | 'json' | 'xlsx';
type ExportEntity = 'contacts' | 'companies' | 'interactions';

interface ExportConfig {
  format: ExportFormat;
  entities: ExportEntity[];
  includeRelations: boolean;
  dateRange?: { start: Date; end: Date };
}

export function DataExporter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    entities: ['contacts'],
    includeRelations: true,
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const formatIcons = {
    csv: FileSpreadsheet,
    json: FileJson,
    xlsx: FileText,
  };

  const toggleEntity = (entity: ExportEntity) => {
    setConfig(prev => ({
      ...prev,
      entities: prev.entities.includes(entity)
        ? prev.entities.filter(e => e !== entity)
        : [...prev.entities, entity],
    }));
  };

  const fetchData = async (entity: ExportEntity) => {
    if (!user) return [];

    let query;
    switch (entity) {
      case 'contacts':
        query = supabase
          .from('contacts')
          .select(config.includeRelations 
            ? '*, company:companies(id, name)' 
            : '*'
          )
          .eq('user_id', user.id);
        break;
      case 'companies':
        query = supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id);
        break;
      case 'interactions':
        query = supabase
          .from('interactions')
          .select(config.includeRelations 
            ? '*, contact:contacts(id, first_name, last_name)' 
            : '*'
          )
          .eq('user_id', user.id);
        break;
    }

    const { data } = await query;
    return data || [];
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (config.entities.length === 0) {
      toast.error('Selecione pelo menos uma entidade para exportar');
      return;
    }

    setExporting(true);
    setProgress(0);
    setCompleted(false);

    try {
      const allData: Record<string, any[]> = {};
      const progressStep = 100 / config.entities.length;

      for (let i = 0; i < config.entities.length; i++) {
        const entity = config.entities[i];
        allData[entity] = await fetchData(entity);
        setProgress((i + 1) * progressStep);
        await new Promise(r => setTimeout(r, 300)); // Small delay for UX
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      
      if (config.format === 'json') {
        const content = JSON.stringify(allData, null, 2);
        downloadFile(content, `relateiq-export-${timestamp}.json`, 'application/json');
      } else if (config.format === 'csv') {
        // Export each entity as separate file for CSV
        for (const [entity, data] of Object.entries(allData)) {
          if (data.length > 0) {
            const csv = convertToCSV(data);
            downloadFile(csv, `relateiq-${entity}-${timestamp}.csv`, 'text/csv');
          }
        }
      }

      setCompleted(true);
      toast.success('Dados exportados com sucesso!');
      
      setTimeout(() => {
        setOpen(false);
        setExporting(false);
        setCompleted(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados');
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Exporte seus dados para análise externa ou backup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              value={config.format}
              onValueChange={(v) => setConfig(prev => ({ ...prev, format: v as ExportFormat }))}
              className="grid grid-cols-3 gap-3"
            >
              {(['csv', 'json'] as const).map((format) => {
                const Icon = formatIcons[format];
                return (
                  <Label
                    key={format}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                      config.format === format
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={format} className="sr-only" />
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium uppercase">{format}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Entity Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Dados para exportar</Label>
            <div className="space-y-2">
              {([
                { id: 'contacts', label: 'Contatos' },
                { id: 'companies', label: 'Empresas' },
                { id: 'interactions', label: 'Interações' },
              ] as const).map((entity) => (
                <div key={entity.id} className="flex items-center gap-3">
                  <Checkbox
                    id={entity.id}
                    checked={config.entities.includes(entity.id)}
                    onCheckedChange={() => toggleEntity(entity.id)}
                  />
                  <Label htmlFor={entity.id} className="cursor-pointer">
                    {entity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Include Relations */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="relations"
              checked={config.includeRelations}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, includeRelations: !!checked }))
              }
            />
            <Label htmlFor="relations" className="cursor-pointer">
              Incluir relacionamentos
            </Label>
          </div>

          {/* Export Progress */}
          <AnimatePresence>
            {exporting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completed ? 'Concluído!' : 'Exportando...'}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting || config.entities.length === 0}>
            {exporting ? (
              completed ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Concluído
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              )
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
