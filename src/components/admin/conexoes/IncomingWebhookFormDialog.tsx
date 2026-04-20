import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIncomingWebhooks, type WebhookTargetEntity } from '@/hooks/useIncomingWebhooks';
import { Loader2, Save, Info } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhookId: string | null;
}

const ENTITIES: { value: WebhookTargetEntity; label: string }[] = [
  { value: 'contact', label: 'Contato (contacts)' },
  { value: 'company', label: 'Empresa (companies)' },
  { value: 'deal', label: 'Deal (deals)' },
  { value: 'interaction', label: 'Interação (interactions)' },
  { value: 'note', label: 'Nota (notes)' },
  { value: 'custom', label: 'Custom (apenas log)' },
];

export function IncomingWebhookFormDialog({ open, onOpenChange, webhookId }: Props) {
  const { webhooks, upsert } = useIncomingWebhooks();
  const existing = webhooks.find(w => w.id === webhookId);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [targetEntity, setTargetEntity] = useState<WebhookTargetEntity>(existing?.target_entity ?? 'contact');
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [allowedOrigins, setAllowedOrigins] = useState((existing?.allowed_origins ?? []).join(', '));
  const [fieldMappingRaw, setFieldMappingRaw] = useState(
    JSON.stringify(existing?.field_mapping ?? { first_name: 'name', email: 'email' }, null, 2),
  );
  const [mappingError, setMappingError] = useState<string | null>(null);

  const handleSave = async () => {
    let mapping: Record<string, string> = {};
    try {
      mapping = JSON.parse(fieldMappingRaw);
      setMappingError(null);
    } catch {
      setMappingError('JSON inválido no mapeamento');
      return;
    }
    await upsert.mutateAsync({
      id: webhookId ?? undefined,
      name: name.trim(),
      description: description.trim() || null,
      target_entity: targetEntity,
      is_active: isActive,
      allowed_origins: allowedOrigins.split(',').map(s => s.trim()).filter(Boolean),
      field_mapping: mapping,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{webhookId ? 'Editar' : 'Novo'} webhook entrante</DialogTitle>
          <DialogDescription>
            Outros sistemas chamam este endpoint com POST + JSON. O payload é mapeado e inserido na entidade alvo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Form Site Lovable" />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="wh-active" />
              <Label htmlFor="wh-active">Ativo</Label>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description ?? ''} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div>
            <Label>Entidade Alvo *</Label>
            <Select value={targetEntity} onValueChange={(v) => setTargetEntity(v as WebhookTargetEntity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITIES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Origens permitidas (CSV, opcional)</Label>
            <Input value={allowedOrigins} onChange={e => setAllowedOrigins(e.target.value)} placeholder="lovable.app, meusite.com" />
            <p className="text-xs text-muted-foreground mt-1">Vazio = aceitar de qualquer origem.</p>
          </div>

          <div>
            <Label>Mapeamento de campos (JSON)</Label>
            <Textarea
              value={fieldMappingRaw}
              onChange={e => setFieldMappingRaw(e.target.value)}
              rows={6} className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              <code>{'{ "destino": "caminho.no.payload" }'}</code> — ex: <code>{'{ "first_name": "lead.nome" }'}</code>
            </p>
            {mappingError && <p className="text-xs text-destructive mt-1">{mappingError}</p>}
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Após salvar, copie a URL pública do card e configure no sistema de origem.
              Inclua o token na URL (path) ou no header <code>X-Webhook-Token</code>.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={upsert.isPending || !name.trim()}>
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
