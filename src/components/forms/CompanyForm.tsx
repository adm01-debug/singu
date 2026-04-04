import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useExternalLookup } from '@/hooks/useExternalLookup';
import { useCompanyPhones, useCompanyEmails, useCompanyAddresses, useCompanySocialMedia } from '@/hooks/useCompanyRelatedData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  FormDescription,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Loader2, FileText, Users, Landmark, Share2, MapPin, Phone, Mail } from 'lucide-react';
import type { Company } from '@/hooks/useCompanies';
import { CompanyLogoUpload } from '@/components/forms/CompanyLogoUpload';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CompanyPhonesForm } from '@/components/forms/company/CompanyPhonesForm';
import { CompanyEmailsForm } from '@/components/forms/company/CompanyEmailsForm';
import { CompanyAddressesForm } from '@/components/forms/company/CompanyAddressesForm';
import { CompanySocialMediaForm } from '@/components/forms/company/CompanySocialMediaForm';

// ─── Schema ────────────────────────────────────────────────────────
const companySchema = z.object({
  // Dados Básicos
  nome_crm: z.string().trim().min(1, 'Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
  nome_fantasia: z.string().trim().max(150).optional().or(z.literal('')),
  razao_social: z.string().trim().max(200).optional().or(z.literal('')),
  ramo_atividade: z.string().trim().max(150).optional().or(z.literal('')),
  nicho_cliente: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),

  // Dados Fiscais
  cnpj: z.string().trim().max(20).optional().or(z.literal('')),
  razao_social_fiscal: z.string().optional(),
  capital_social: z.coerce.number().optional().or(z.literal(0)),
  natureza_juridica: z.string().trim().max(10).optional().or(z.literal('')),
  natureza_juridica_desc: z.string().trim().max(200).optional().or(z.literal('')),
  porte_rf: z.string().trim().max(50).optional().or(z.literal('')),
  situacao_rf: z.string().trim().max(20).optional().or(z.literal('')),
  situacao_rf_data: z.string().optional().or(z.literal('')),
  data_fundacao: z.string().optional().or(z.literal('')),
  inscricao_estadual: z.string().trim().max(30).optional().or(z.literal('')),
  inscricao_municipal: z.string().trim().max(30).optional().or(z.literal('')),

  // Classificação
  is_customer: z.boolean().optional(),
  is_supplier: z.boolean().optional(),
  is_carrier: z.boolean().optional(),
  is_matriz: z.boolean().optional(),
  grupo_economico: z.string().trim().max(150).optional().or(z.literal('')),
  tipo_cooperativa: z.string().trim().max(100).optional().or(z.literal('')),
  numero_cooperativa: z.string().trim().max(50).optional().or(z.literal('')),

  // Estrutura
  employee_count: z.string().optional(),
  annual_revenue: z.string().trim().max(50).optional().or(z.literal('')),
  financial_health: z.string().optional(),
  cores_marca: z.string().trim().max(100).optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: any) => Promise<void>;
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

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
];

const situacaoRfOptions = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'BAIXADA', label: 'Baixada' },
  { value: 'INAPTA', label: 'Inapta' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'NULA', label: 'Nula' },
];

const porteRfOptions = [
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME - Microempresa' },
  { value: 'EPP', label: 'EPP - Empresa de Pequeno Porte' },
  { value: 'MEDIO', label: 'Médio Porte' },
  { value: 'GRANDE', label: 'Grande Porte' },
  { value: 'DEMAIS', label: 'Demais' },
];

// Helper to safely read any company field (handles external data mapping)
function getCompanyField(company: Record<string, unknown> | null | undefined, field: string, fallback = '') {
  if (!company) return fallback;
  return (company[field] as string) ?? fallback;
}

export function CompanyForm({ company, onSubmit, onCancel, isSubmitting }: CompanyFormProps) {
  const c = company as Record<string, unknown> | null;
  const companyId = (c?.id as string) || undefined;
  const [logoUrl, setLogoUrl] = useState<string | null>((c?.logo_url as string) || null);

  const { data: ramosOptions = [], isLoading: ramosLoading } = useExternalLookup('companies', 'ramo_atividade');
  const { data: nichosOptions = [], isLoading: nichosLoading } = useExternalLookup('companies', 'nicho_cliente');

  // ─── Related data hooks (normalized tables) ───
  const phonesHook = useCompanyPhones(companyId);
  const emailsHook = useCompanyEmails(companyId);
  const addressesHook = useCompanyAddresses(companyId);
  const socialMediaHook = useCompanySocialMedia(companyId);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nome_crm: getCompanyField(c, 'nome_crm') || getCompanyField(c, 'name') || getCompanyField(c, 'nome_fantasia'),
      nome_fantasia: getCompanyField(c, 'nome_fantasia'),
      razao_social: getCompanyField(c, 'razao_social'),
      ramo_atividade: getCompanyField(c, 'ramo_atividade'),
      nicho_cliente: getCompanyField(c, 'nicho_cliente'),
      status: getCompanyField(c, 'status', 'ativo'),
      notes: getCompanyField(c, 'notes'),
      cnpj: getCompanyField(c, 'cnpj'),
      capital_social: (c?.capital_social as number) ?? 0,
      natureza_juridica: getCompanyField(c, 'natureza_juridica'),
      natureza_juridica_desc: getCompanyField(c, 'natureza_juridica_desc'),
      porte_rf: getCompanyField(c, 'porte_rf'),
      situacao_rf: getCompanyField(c, 'situacao_rf'),
      situacao_rf_data: getCompanyField(c, 'situacao_rf_data'),
      data_fundacao: getCompanyField(c, 'data_fundacao'),
      inscricao_estadual: getCompanyField(c, 'inscricao_estadual'),
      inscricao_municipal: getCompanyField(c, 'inscricao_municipal'),
      is_customer: (c?.is_customer as boolean) ?? false,
      is_supplier: (c?.is_supplier as boolean) ?? false,
      is_carrier: (c?.is_carrier as boolean) ?? false,
      is_matriz: (c?.is_matriz as boolean) ?? undefined,
      grupo_economico: getCompanyField(c, 'grupo_economico'),
      tipo_cooperativa: getCompanyField(c, 'tipo_cooperativa'),
      numero_cooperativa: getCompanyField(c, 'numero_cooperativa'),
      employee_count: getCompanyField(c, 'employee_count'),
      annual_revenue: getCompanyField(c, 'annual_revenue'),
      financial_health: getCompanyField(c, 'financial_health', 'unknown'),
      cores_marca: getCompanyField(c, 'cores_marca'),
    },
  });

  const draftKey = company ? `company-edit-${(company as Record<string, unknown>).id}` : 'company-new';
  const { clearDraft } = useFormDraft(form, { key: draftKey, enabled: !company });

  const handleSubmit = async (data: CompanyFormData) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else if (key === 'capital_social' && (value === 0 || value === null)) {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
    cleaned.logo_url = logoUrl;
    cleaned.name = cleaned.nome_crm || cleaned.nome_fantasia || 'Sem nome';
    await onSubmit(cleaned);
    clearDraft();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Header */}
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

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 mb-4">
            <TabsTrigger value="basico" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="text-xs gap-1">
              <FileText className="w-3.5 h-3.5" />
              Fiscal
            </TabsTrigger>
            <TabsTrigger value="classificacao" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              Classif.
            </TabsTrigger>
            <TabsTrigger value="estrutura" className="text-xs gap-1">
              <Landmark className="w-3.5 h-3.5" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="telefones" className="text-xs gap-1">
              <Phone className="w-3.5 h-3.5" />
              Telefones
            </TabsTrigger>
            <TabsTrigger value="endereco" className="text-xs gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Endereços
            </TabsTrigger>
            <TabsTrigger value="redes" className="text-xs gap-1">
              <Share2 className="w-3.5 h-3.5" />
              Redes
            </TabsTrigger>
          </TabsList>

          {/* ═══ ABA 1: DADOS BÁSICOS ═══ */}
          <TabsContent value="basico" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo + Nome no CRM */}
              <div className="md:col-span-2 flex items-start gap-4">
                <CompanyLogoUpload
                  logoUrl={logoUrl}
                  onLogoChange={setLogoUrl}
                  companyId={companyId}
                />
                <FormField control={form.control} name="nome_crm" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nome no CRM *</FormLabel>
                    <FormControl><Input placeholder="Nome usado internamente" {...field} /></FormControl>
                    <FormDescription>Nome exibido nas listagens</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia</FormLabel>
                  <FormControl><Input placeholder="Nome comercial" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="razao_social" render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl><Input placeholder="Razão social completa" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'ativo'}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="ramo_atividade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ramo de Atividade</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={ramosOptions}
                      isLoading={ramosLoading}
                      placeholder="Selecione o ramo"
                      searchPlaceholder="Buscar ramo..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nicho_cliente" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nicho do Cliente</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={nichosOptions}
                      isLoading={nichosLoading}
                      placeholder="Selecione o nicho"
                      searchPlaceholder="Buscar nicho..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre a empresa..." className="min-h-[80px]" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 2: DADOS FISCAIS ═══ */}
          <TabsContent value="fiscal" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="cnpj" render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="situacao_rf" render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação RF</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {situacaoRfOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="situacao_rf_data" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Situação RF</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="capital_social" render={({ field }) => (
                <FormItem>
                  <FormLabel>Capital Social (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="natureza_juridica" render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza Jurídica (Código)</FormLabel>
                  <FormControl><Input placeholder="Ex: 2062" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="natureza_juridica_desc" render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza Jurídica (Descrição)</FormLabel>
                  <FormControl><Input placeholder="Ex: Sociedade Empresária LTDA" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="porte_rf" render={({ field }) => (
                <FormItem>
                  <FormLabel>Porte (Receita Federal)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {porteRfOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="data_fundacao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fundação</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="inscricao_estadual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Estadual</FormLabel>
                  <FormControl><Input placeholder="IE" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="inscricao_municipal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Municipal</FormLabel>
                  <FormControl><Input placeholder="IM" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 3: CLASSIFICAÇÃO ═══ */}
          <TabsContent value="classificacao" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-3">
                <p className="text-sm font-medium text-foreground">Tipo de Parceiro</p>
                <div className="flex flex-wrap gap-6">
                  <FormField control={form.control} name="is_customer" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer">Cliente</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="is_supplier" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer">Fornecedor</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="is_carrier" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer">Transportadora</FormLabel>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="md:col-span-2">
                <FormField control={form.control} name="is_matriz" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal cursor-pointer">É Matriz</FormLabel>
                    <FormDescription className="ml-2">(desmarque para filial)</FormDescription>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="grupo_economico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Econômico</FormLabel>
                  <FormControl><Input placeholder="Ex: Coanorp Cooperativa" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tipo_cooperativa" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cooperativa</FormLabel>
                  <FormControl><Input placeholder="Ex: Singular, Central..." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="numero_cooperativa" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº da Cooperativa</FormLabel>
                  <FormControl><Input placeholder="Número de registro" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 4: ESTRUTURA ═══ */}
          <TabsContent value="estrutura" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="employee_count" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Funcionários</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeeCountOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="annual_revenue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Faturamento Anual</FormLabel>
                  <FormControl><Input placeholder="R$ 1-5M" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="financial_health" render={({ field }) => (
                <FormItem>
                  <FormLabel>Saúde Financeira</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'unknown'}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {financialHealthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cores_marca" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cores da Marca</FormLabel>
                  <FormControl><Input placeholder="Ex: #0066CC, #FF6600" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Cores principais da identidade visual</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </TabsContent>

          {/* ═══ ABA 5: TELEFONES (normalizado) ═══ */}
          <TabsContent value="telefones" className="mt-0">
            {companyId ? (
              <CompanyPhonesForm
                companyId={companyId}
                phones={phonesHook.data}
                onSave={async (phone) => { await phonesHook.upsert.mutateAsync(phone); }}
                onDelete={async (id) => { await phonesHook.remove.mutateAsync(id); }}
                isLoading={phonesHook.isLoading}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Salve a empresa primeiro para adicionar telefones
              </div>
            )}
          </TabsContent>

          {/* ═══ ABA 6: ENDEREÇOS (normalizado) ═══ */}
          <TabsContent value="endereco" className="mt-0">
            {companyId ? (
              <CompanyAddressesForm
                companyId={companyId}
                addresses={addressesHook.data}
                onSave={async (addr) => { await addressesHook.upsert.mutateAsync(addr); }}
                onDelete={async (id) => { await addressesHook.remove.mutateAsync(id); }}
                isLoading={addressesHook.isLoading}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Salve a empresa primeiro para adicionar endereços
              </div>
            )}
          </TabsContent>

          {/* ═══ ABA 7: REDES SOCIAIS + EMAILS (normalizado) ═══ */}
          <TabsContent value="redes" className="space-y-6 mt-0">
            {companyId ? (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Emails
                  </h4>
                  <CompanyEmailsForm
                    companyId={companyId}
                    emails={emailsHook.data}
                    onSave={async (email) => { await emailsHook.upsert.mutateAsync(email); }}
                    onDelete={async (id) => { await emailsHook.remove.mutateAsync(id); }}
                    isLoading={emailsHook.isLoading}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" /> Redes Sociais & Website
                  </h4>
                  <CompanySocialMediaForm
                    companyId={companyId}
                    socialMedia={socialMediaHook.data}
                    onSave={async (item) => { await socialMediaHook.upsert.mutateAsync(item); }}
                    onDelete={async (id) => { await socialMediaHook.remove.mutateAsync(id); }}
                    isLoading={socialMediaHook.isLoading}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Salve a empresa primeiro para adicionar emails e redes sociais
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
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
