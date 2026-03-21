import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
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
import { User, Loader2 } from 'lucide-react';
import type { Contact } from '@/hooks/useContacts';
import type { Company } from '@/hooks/useCompanies';

const contactSchema = z.object({
  first_name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().trim().min(1, 'Sobrenome é obrigatório').max(50, 'Máximo 50 caracteres'),
  company_id: z.string().uuid('Selecione uma empresa').optional().nullable(),
  role: z.string().optional(),
  role_title: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  whatsapp: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  linkedin: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  instagram: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  birthday: z.string().optional(),
  relationship_stage: z.string().optional(),
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact | null;
  companies: Company[];
  defaultCompanyId?: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
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

export function ContactForm({ contact, companies, defaultCompanyId, onSubmit, onCancel, isSubmitting }: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name || '',
      last_name: contact?.last_name || '',
      company_id: contact?.company_id || defaultCompanyId || null,
      role: contact?.role || 'contact',
      role_title: contact?.role_title || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      whatsapp: contact?.whatsapp || '',
      linkedin: contact?.linkedin || '',
      instagram: contact?.instagram || '',
      birthday: contact?.birthday || '',
      relationship_stage: contact?.relationship_stage || 'unknown',
      notes: contact?.notes || '',
    },
  });

  // Auto-save draft (only for new contacts, not edits)
  const draftKey = contact ? `contact-edit-${contact.id}` : 'contact-new';
  const { clearDraft } = useFormDraft(form, { 
    key: draftKey, 
    enabled: !contact,
  });

  // Smart Defaults: auto-copy phone → WhatsApp when WhatsApp is empty
  const phoneValue = useWatch({ control: form.control, name: 'phone' });
  const whatsappValue = useWatch({ control: form.control, name: 'whatsapp' });
  
  useEffect(() => {
    if (!contact && phoneValue && !whatsappValue) {
      form.setValue('whatsapp', phoneValue, { shouldDirty: false });
    }
  }, [phoneValue, contact, form, whatsappValue]);

  // Smart Defaults: suggest role_title based on selected company industry
  const selectedCompanyId = useWatch({ control: form.control, name: 'company_id' });
  const roleTitleValue = useWatch({ control: form.control, name: 'role_title' });
  
  const suggestedRoleTitle = useMemo(() => {
    if (contact || roleTitleValue) return null;
    const company = companies.find(c => c.id === selectedCompanyId);
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

  // Smart Defaults: set relationship_stage to 'prospect' for new contacts
  const selectedRole = useWatch({ control: form.control, name: 'role' });

  useEffect(() => {
    if (!contact && selectedRole === 'buyer') {
      form.setValue('relationship_stage', 'qualified_lead', { shouldDirty: false });
    }
  }, [selectedRole, contact, form]);

  const handleSubmit = async (data: ContactFormData) => {
    const cleanedData = {
      ...data,
      company_id: data.company_id || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      linkedin: data.linkedin || null,
      instagram: data.instagram || null,
      birthday: data.birthday || null,
      role_title: data.role_title || null,
      notes: data.notes || null,
    };
    await onSubmit(cleanedData as ContactFormData);
    clearDraft(); // Clear draft on successful submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome *</FormLabel>
                <FormControl>
                  <Input placeholder="Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Gerente Comercial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship_stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estágio do Relacionamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationshipStageOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="joao@empresa.com.br" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aniversário</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <Input placeholder="linkedin.com/in/joaosilva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="@joaosilva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Observações sobre o contato..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
