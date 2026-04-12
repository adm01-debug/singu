import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { ContactAvatarUpload } from '@/components/forms/ContactAvatarUpload';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/masked-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Loader2, Briefcase, Tag, FileText } from 'lucide-react';
import type { Contact } from '@/hooks/useContacts';
import type { Company } from '@/hooks/useCompanies';

// ─── Schema ────────────────────────────────────────────────────────
const contactSchema = z.object({
  // Dados Pessoais
  first_name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().trim().min(1, 'Sobrenome é obrigatório').max(50, 'Máximo 50 caracteres'),
  apelido: z.string().trim().max(50).optional().or(z.literal('')),
  nome_tratamento: z.string().trim().max(50).optional().or(z.literal('')),
  sexo: z.string().optional().or(z.literal('')),
  cpf: z.string().trim().max(14).optional().or(z.literal('')),
  birthday: z.string().optional(),

  // Profissional
  company_id: z.string().uuid('Selecione uma empresa').optional().nullable(),
  role: z.string().optional(),
  role_title: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  cargo: z.string().trim().max(100).optional().or(z.literal('')),
  departamento: z.string().trim().max(100).optional().or(z.literal('')),
  source: z.string().trim().max(100).optional().or(z.literal('')),
  relationship_stage: z.string().optional(),

  // Contato
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  whatsapp: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  linkedin: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  instagram: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  twitter: z.string().trim().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  avatar_url: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),

  // Detalhes
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  personal_notes: z.string().trim().max(2000).optional().or(z.literal('')),
  assinatura_contato: z.string().trim().max(500).optional().or(z.literal('')),
  tags_array: z.string().trim().max(500).optional().or(z.literal('')),
  interests_array: z.string().trim().max(500).optional().or(z.literal('')),
  hobbies: z.string().trim().max(500).optional().or(z.literal('')),
  family_info: z.string().trim().max(2000).optional().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact | null;
  companies: Company[];
  defaultCompanyId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const roleOptions = [
  { value: 'owner', label: 'Proprietário' },
  { value: 'manager', label: 'Gerente' },
  { value: 'buyer', label: 'Comprador' },
  { value: 'decision_maker', label: 'Decisor' },
  { value: 'influencer', label: 'Influenciador' },
  { value: 'contact', label: 'Contato' },
];

const relationshipStageOptions = [
  { value: 'unknown', label: 'Desconhecido' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualified_lead', label: 'Lead Qualificado' },
  { value: 'opportunity', label: 'Oportunidade' },
  { value: 'negotiation', label: 'Negociação' },
  { value: 'customer', label: 'Cliente' },
  { value: 'loyal_customer', label: 'Cliente Fiel' },
  { value: 'advocate', label: 'Advogado da Marca' },
  { value: 'at_risk', label: 'Em Risco' },
  { value: 'lost', label: 'Perdido' },
];

const sexoOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'NB', label: 'Não-binário' },
  { value: 'NI', label: 'Não informado' },
];

function getField(c: Record<string, unknown> | null | undefined, field: string, fallback = '') {
  if (!c) return fallback;
  return (c[field] as string) ?? fallback;
}

const parseCommaSeparated = (val: string | null | undefined): string[] | null => {
  if (!val || !val.trim()) return null;
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

export function ContactForm({ contact, companies, defaultCompanyId, onSubmit, onCancel, isSubmitting }: ContactFormProps) {
  const c = contact as Record<string, unknown> | null;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: getField(c, 'first_name'),
      last_name: getField(c, 'last_name'),
      apelido: getField(c, 'apelido'),
      nome_tratamento: getField(c, 'nome_tratamento'),
      sexo: getField(c, 'sexo'),
      cpf: getField(c, 'cpf'),
      birthday: getField(c, 'birthday'),
      company_id: getField(c, 'company_id') || defaultCompanyId || null,
      role: getField(c, 'role', 'contact'),
      role_title: getField(c, 'role_title'),
      cargo: getField(c, 'cargo'),
      departamento: getField(c, 'departamento'),
      source: getField(c, 'source'),
      relationship_stage: getField(c, 'relationship_stage', 'unknown'),
      email: getField(c, 'email'),
      phone: getField(c, 'phone'),
      whatsapp: getField(c, 'whatsapp'),
      linkedin: getField(c, 'linkedin'),
      instagram: getField(c, 'instagram'),
      twitter: getField(c, 'twitter'),
      notes: getField(c, 'notes'),
      personal_notes: getField(c, 'personal_notes'),
      assinatura_contato: getField(c, 'assinatura_contato'),
      tags_array: Array.isArray(c?.tags_array) ? (c.tags_array as string[]).join(', ') : '',
      interests_array: Array.isArray(c?.interests_array) ? (c.interests_array as string[]).join(', ') : '',
      hobbies: Array.isArray(c?.hobbies) ? (c.hobbies as string[]).join(', ') : getField(c, 'hobbies'),
      family_info: getField(c, 'family_info'),
    },
  });

  const draftKey = contact ? `contact-edit-${(contact as Record<string, unknown>).id}` : 'contact-new';
  const { clearDraft } = useFormDraft(form, { key: draftKey, enabled: !contact });

  // Smart Defaults: auto-copy phone → WhatsApp
  const phoneValue = useWatch({ control: form.control, name: 'phone' });
  const whatsappValue = useWatch({ control: form.control, name: 'whatsapp' });

  useEffect(() => {
    if (!contact && phoneValue && !whatsappValue) {
      form.setValue('whatsapp', phoneValue, { shouldDirty: false });
    }
  }, [phoneValue, contact, form, whatsappValue]);

  // Smart Defaults: suggest role_title based on company industry
  const selectedCompanyId = useWatch({ control: form.control, name: 'company_id' });
  const roleTitleValue = useWatch({ control: form.control, name: 'role_title' });

  const suggestedRoleTitle = useMemo(() => {
    if (contact || roleTitleValue) return null;
    const company = companies.find(comp => comp.id === selectedCompanyId);
    if (!company?.industry) return null;
    const suggestions: Record<string, string> = {
      'Tecnologia': 'Gerente de TI',
      'Saúde': 'Diretor Clínico',
      'Educação': 'Coordenador Pedagógico',
      'Varejo': 'Gerente Comercial',
      'Financeiro': 'Diretor Financeiro',
      'Jurídico': 'Advogado Sênior',
      'Marketing': 'Diretor de Marketing',
      'Indústria': 'Gerente de Produção',
      'Construção': 'Engenheiro de Obras',
      'Consultoria': 'Consultor Sênior',
    };
    return suggestions[company.industry] || null;
  }, [selectedCompanyId, companies, contact, roleTitleValue]);

  const selectedRole = useWatch({ control: form.control, name: 'role' });

  useEffect(() => {
    if (!contact && selectedRole === 'buyer') {
      form.setValue('relationship_stage', 'qualified_lead', { shouldDirty: false });
    }
  }, [selectedRole, contact, form]);

  const handleSubmit = async (data: ContactFormData) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
    // Convert comma-separated strings to arrays
    cleaned.tags_array = parseCommaSeparated(data.tags_array);
    cleaned.interests_array = parseCommaSeparated(data.interests_array);
    cleaned.hobbies = parseCommaSeparated(data.hobbies);
    await onSubmit(cleaned);
    clearDraft();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {contact ? 'Editar Contato' : 'Novo Contato'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {contact ? 'Atualize as informações do contato' : 'Preencha os dados do contato'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="pessoal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="pessoal" className="text-xs gap-1">
              <User className="w-3.5 h-3.5" />
              Pessoal
            </TabsTrigger>
            <TabsTrigger value="profissional" className="text-xs gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Profissional
            </TabsTrigger>
            <TabsTrigger value="contato" className="text-xs gap-1">
              <FileText className="w-3.5 h-3.5" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="text-xs gap-1">
              <Tag className="w-3.5 h-3.5" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          {/* ═══ ABA 1: DADOS PESSOAIS ═══ */}
          <TabsContent value="pessoal" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="João" autoComplete="given-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome *</FormLabel>
                  <FormControl><Input placeholder="Silva" autoComplete="family-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="apelido" render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido</FormLabel>
                  <FormControl><Input placeholder="Como é conhecido" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nome_tratamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Tratamento</FormLabel>
                  <FormControl><Input placeholder="Como prefere ser chamado" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Usado em comunicações personalizadas</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="sexo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sexoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="birthday" render={({ field }) => (
                <FormItem>
                  <FormLabel>Aniversário</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 2: PROFISSIONAL ═══ */}
          <TabsContent value="profissional" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map(comp => (
                        <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role_title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo (CRM)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={suggestedRoleTitle || "Gerente Comercial"}
                      {...field}
                      aria-describedby={suggestedRoleTitle ? "role-title-hint" : undefined}
                    />
                  </FormControl>
                  {suggestedRoleTitle && !field.value && (
                    <FormDescription id="role-title-hint" className="text-xs">
                      <button
                        type="button"
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => form.setValue('role_title', suggestedRoleTitle, { shouldDirty: true })}
                      >
                        Sugestão: {suggestedRoleTitle} ↵
                      </button>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cargo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo (Empresa)</FormLabel>
                  <FormControl><Input placeholder="Cargo na empresa" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Cargo oficial na empresa</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="departamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl><Input placeholder="Ex: Comercial, TI, RH" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="relationship_stage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estágio do Relacionamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationshipStageOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte / Origem</FormLabel>
                  <FormControl><Input placeholder="Ex: Marketing, Indicação, Evento" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Como este contato chegou</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 3: CONTATO ═══ */}
          <TabsContent value="contato" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="joao@empresa.com.br" type="email" inputMode="email" autoComplete="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value || ''}
                      onChange={(rawValue) => field.onChange(rawValue)}
                      countryCode="BR"
                      aria-describedby="phone-hint"
                    />
                  </FormControl>
                  <FormDescription id="phone-hint" className="text-xs">
                    Digite apenas os números
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value || ''}
                      onChange={(rawValue) => field.onChange(rawValue)}
                      countryCode="BR"
                      aria-describedby="whatsapp-hint"
                    />
                  </FormControl>
                  <FormDescription id="whatsapp-hint" className="text-xs">
                    Número com DDD para WhatsApp
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="linkedin" render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl><Input placeholder="linkedin.com/in/joaosilva" type="url" inputMode="url" autoComplete="url" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="instagram" render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl><Input placeholder="@joaosilva" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="twitter" render={({ field }) => (
                <FormItem>
                  <FormLabel>X (Twitter)</FormLabel>
                  <FormControl><Input placeholder="@joaosilva" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assinatura_contato" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Assinatura do Contato</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Assinatura usada em comunicações..." className="min-h-[60px]" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 4: DETALHES ═══ */}
          <TabsContent value="detalhes" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="tags_array" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Tags</FormLabel>
                  <FormControl><Input placeholder="Ex: VIP, Decisor, Agro (separadas por vírgula)" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Separar por vírgula</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="interests_array" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Interesses</FormLabel>
                  <FormControl><Input placeholder="Ex: Tecnologia, Inovação, Sustentabilidade (vírgula)" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Separar por vírgula</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="hobbies" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Hobbies</FormLabel>
                  <FormControl><Input placeholder="Ex: Futebol, Leitura, Viagens (separadas por vírgula)" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Separar por vírgula</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre o contato..." className="min-h-[80px]" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="personal_notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notas Pessoais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Preferências pessoais, observações privadas..." className="min-h-[80px]" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Informações pessoais para rapport</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="family_info" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Informações Familiares</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cônjuge, filhos, aniversários da família..." className="min-h-[60px]" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Informações sobre família para rapport e lembretes</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {contact ? 'Salvar Alterações' : 'Criar Contato'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
