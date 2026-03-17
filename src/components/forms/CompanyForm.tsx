import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Building2, Loader2 } from 'lucide-react';
import type { Company } from '@/hooks/useCompanies';

const companySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  industry: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  website: z.string().trim().url('URL inválida').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  address: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  city: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  state: z.string().trim().max(2, 'Máximo 2 caracteres').optional(),
  employee_count: z.string().optional(),
  annual_revenue: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  financial_health: z.string().optional(),
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const employeeCountOptions = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-100', label: '51-100' },
  { value: '101-500', label: '101-500' },
  { value: '500+', label: '500+' },
];

const financialHealthOptions = [
  { value: 'growing', label: 'Em Crescimento' },
  { value: 'stable', label: 'Estável' },
  { value: 'cutting', label: 'Em Retração' },
  { value: 'unknown', label: 'Desconhecido' },
];

export function CompanyForm({ company, onSubmit, onCancel, isSubmitting }: CompanyFormProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      industry: company?.industry || '',
      website: company?.website || '',
      phone: company?.phone || '',
      email: company?.email || '',
      address: company?.address || '',
      city: company?.city || '',
      state: company?.state || '',
      employee_count: company?.employee_count || '',
      annual_revenue: company?.annual_revenue || '',
      financial_health: company?.financial_health || 'unknown',
      notes: company?.notes || '',
    },
  });

  // Auto-save draft (only for new companies)
  const draftKey = company ? `company-edit-${company.id}` : 'company-new';
  const { clearDraft } = useFormDraft(form, {
    key: draftKey,
    enabled: !company,
  });

    // Clean optional empty strings
    const cleanedData = {
      ...data,
      website: data.website || null,
      email: data.email || null,
      industry: data.industry || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      employee_count: data.employee_count || null,
      annual_revenue: data.annual_revenue || null,
      notes: data.notes || null,
    };
    await onSubmit(cleanedData as CompanyFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {company ? 'Editar Empresa' : 'Nova Empresa'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {company ? 'Atualize as informações da empresa' : 'Preencha os dados da empresa'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome da Empresa *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Tech Solutions LTDA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Segmento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Tecnologia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplo.com.br" {...field} />
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
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
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
                  <Input placeholder="contato@empresa.com.br" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Paulista, 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="São Paulo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="SP" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employee_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Funcionários</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeeCountOptions.map(option => (
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
            name="annual_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faturamento Anual</FormLabel>
                <FormControl>
                  <Input placeholder="R$ 1-5M" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="financial_health"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saúde Financeira</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {financialHealthOptions.map(option => (
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
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Observações sobre a empresa..." 
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
            {company ? 'Salvar Alterações' : 'Criar Empresa'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
