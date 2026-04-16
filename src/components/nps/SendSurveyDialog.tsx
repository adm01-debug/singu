import { useState } from 'react';
import { useNpsSurveys } from '@/hooks/useNpsSurveys';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useContacts } from '@/hooks/useContacts';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function SendSurveyDialog({ open, onOpenChange }: Props) {
  const { contacts } = useContacts();
  const { createSurvey, isCreating } = useNpsSurveys();
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('email');
  const [search, setSearch] = useState('');

  const filtered = (contacts ?? []).filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 50);

  const handleSend = async () => {
    if (!contactId) return;
    await createSurvey({ contact_id: contactId, channel });
    onOpenChange(false);
    setContactId('');
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Pesquisa NPS/CSAT</DialogTitle>
          <DialogDescription>Envie uma pesquisa de satisfação para um contato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Buscar contato</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite o nome…" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Contato</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {filtered.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.email ? ` — ${c.email}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Canal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSend} disabled={!contactId || isCreating}>Enviar Pesquisa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
