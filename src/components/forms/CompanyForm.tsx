import { useState, useCallback } from 'react';
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
import { Building2, Loader2, FileText, Users, Landmark, Share2, MapPin, Phone, Mail, Tag, Globe, Sparkles, Hash, Calendar, Shield, Briefcase, Palette, GitMerge, ChevronRight } from 'lucide-react';
import type { Company } from '@/hooks/useCompanies';
import { CompanyLogoUpload } from '@/components/forms/CompanyLogoUpload';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CompanyPhonesForm } from '@/components/forms/company/CompanyPhonesForm';
import { CompanyEmailsForm } from '@/components/forms/company/CompanyEmailsForm';
import { CompanyAddressesForm } from '@/components/forms/company/CompanyAddressesForm';
import { CompanySocialMediaForm } from '@/components/forms/company/CompanySocialMediaForm';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/lib/utils';

// ─── Schema ────────────────────────────────────────────────────────
const companySchema = z.object({
  nome_crm: z.string().trim().min(1, 'Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
  nome_fantasia: z.string().trim().max(150).optional().or(z.literal('')),
  razao_social: z.string().trim().max(200).optional().or(z.literal('')),
  ramo_atividade: z.string().trim().max(150).optional().or(z.literal('')),
  nicho_cliente: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  website: z.string().trim().max(300).optional().or(z.literal('')),
  tags_array: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  cnpj: z.string().trim().max(20).optional().or(z.literal('')),
  cnpj_base: z.string().trim().max(10).optional().or(z.literal('')),
  capital_social: z.coerce.number().optional().or(z.literal(0)),
  natureza_juridica: z.string().trim().max(10).optional().or(z.literal('')),
  natureza_juridica_desc: z.string().trim().max(200).optional().or(z.literal('')),
  porte_rf: z.string().trim().max(50).optional().or(z.literal('')),
  situacao_rf: z.string().trim().max(20).optional().or(z.literal('')),
  situacao_rf_data: z.string().optional().or(z.literal('')),
  data_fundacao: z.string().optional().or(z.literal('')),
  inscricao_estadual: z.string().trim().max(30).optional().or(z.literal('')),
  inscricao_municipal: z.string().trim().max(30).optional().or(z.literal('')),
  is_customer: z.boolean().optional(),
  is_supplier: z.boolean().optional(),
  is_carrier: z.boolean().optional(),
  is_matriz: z.boolean().optional(),
  grupo_economico: z.string().trim().max(150).optional().or(z.literal('')),
  grupo_economico_id: z.string().trim().max(50).optional().or(z.literal('')),
  tipo_cooperativa: z.string().trim().max(100).optional().or(z.literal('')),
  numero_cooperativa: z.string().trim().max(50).optional().or(z.literal('')),
  employee_count: z.string().optional(),
  annual_revenue: z.string().trim().max(50).optional().or(z.literal('')),
  financial_health: z.string().optional(),
  cores_marca: z.string().trim().max(100).optional().or(z.literal('')),
  matriz_id: z.string().trim().max(50).optional().or(z.literal('')),
  central_id: z.string().trim().max(50).optional().or(z.literal('')),
  singular_id: z.string().trim().max(50).optional().or(z.literal('')),
  confederacao_id: z.string().trim().max(50).optional().or(z.literal('')),
  bitrix_company_id: z.coerce.number().optional().or(z.literal(0)),
  merge_notes: z.string().trim().max(2000).optional().or(z.literal('')),
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

function getCompanyField(company: Record<string, unknown> | null | undefined, field: string, fallback = '') {
  if (!company) return fallback;
  return (company[field] as string) ?? fallback;
}

/* ─── Section wrapper for visual grouping ─── */
function FormSection({ icon: Icon, title, children, className }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {children}
      </div>
    </div>
  );
}

export function CompanyForm({ company, onSubmit, onCancel, isSubmitting }: CompanyFormProps) {
  const c = company as Record<string, unknown> | null;
  const companyId = (c?.id as string) || undefined;
  const isEditing = !!company;
  const [logoUrl, setLogoUrl] = useState<string | null>((c?.logo_url as string) || null);

  const { data: ramosOptions = [], isLoading: ramosLoading } = useExternalLookup('companies', 'ramo_atividade');
  const { data: nichosOptions = [], isLoading: nichosLoading } = useExternalLookup('companies', 'nicho_cliente');

  const phonesHook = useCompanyPhones(companyId);
  const emailsHook = useCompanyEmails(companyId);
  const addressesHook = useCompanyAddresses(companyId);
  const socialMediaHook = useCompanySocialMedia(companyId);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      nome_crm: getCompanyField(c, 'nome_crm') || getCompanyField(c, 'name') || getCompanyField(c, 'nome_fantasia'),
      nome_fantasia: getCompanyField(c, 'nome_fantasia'),
      razao_social: getCompanyField(c, 'razao_social'),
      ramo_atividade: getCompanyField(c, 'ramo_atividade'),
      nicho_cliente: getCompanyField(c, 'nicho_cliente'),
      status: getCompanyField(c, 'status', 'ativo'),
      notes: getCompanyField(c, 'notes'),
      website: getCompanyField(c, 'website'),
      tags_array: Array.isArray(c?.tags_array) ? (c.tags_array as string[]) : [],
      challenges: Array.isArray(c?.challenges) ? (c.challenges as string[]) : [],
      competitors: Array.isArray(c?.competitors) ? (c.competitors as string[]) : [],
      cnpj: getCompanyField(c, 'cnpj'),
      cnpj_base: getCompanyField(c, 'cnpj_base'),
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
      grupo_economico_id: getCompanyField(c, 'grupo_economico_id'),
      tipo_cooperativa: getCompanyField(c, 'tipo_cooperativa'),
      numero_cooperativa: getCompanyField(c, 'numero_cooperativa'),
      employee_count: getCompanyField(c, 'employee_count'),
      annual_revenue: getCompanyField(c, 'annual_revenue'),
      financial_health: getCompanyField(c, 'financial_health', 'unknown'),
      cores_marca: getCompanyField(c, 'cores_marca'),
      matriz_id: getCompanyField(c, 'matriz_id'),
      central_id: getCompanyField(c, 'central_id'),
      singular_id: getCompanyField(c, 'singular_id'),
      confederacao_id: getCompanyField(c, 'confederacao_id'),
      bitrix_company_id: (c?.bitrix_company_id as number) ?? 0,
      merge_notes: getCompanyField(c, 'merge_notes'),
    },
  });

  const draftKey = company ? `company-edit-${(company as Record<string, unknown>).id}` : 'company-new';
  const { clearDraft } = useFormDraft(form, { key: draftKey, enabled: !company });

  const handleSubmit = async (data: CompanyFormData) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else if ((key === 'capital_social' || key === 'bitrix_company_id') && (value === 0 || value === null)) {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
    if (Array.isArray(data.tags_array) && data.tags_array.length === 0) cleaned.tags_array = null;
    if (Array.isArray(data.challenges) && data.challenges.length === 0) cleaned.challenges = null;
    if (Array.isArray(data.competitors) && data.competitors.length === 0) cleaned.competitors = null;
    cleaned.logo_url = logoUrl;
    delete cleaned.razao_social_fiscal;
    await onSubmit(cleaned);
    clearDraft();
  };

  const allTabs = [
    { value: 'basico', label: 'Básico', icon: Building2 },
    { value: 'fiscal', label: 'Fiscal', icon: FileText },
    { value: 'classificacao', label: 'Classificação', icon: Users },
    { value: 'estrutura', label: 'Estrutura', icon: Landmark },
    { value: 'telefones', label: 'Telefones', icon: Phone },
    { value: 'endereco', label: 'Endereços', icon: MapPin },
    { value: 'redes', label: 'Redes', icon: Share2 },
  ];

  const visibleTabs = isEditing ? allTabs : [allTabs[0]];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col max-h-[calc(90vh-2rem)]">
        {/* ─── Header ─── */}
        <div className="pb-4 mb-1 shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEditing ? 'Atualize as informações da empresa' : 'Preencha os dados da empresa'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Scrollable content ─── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          <Tabs defaultValue="basico" className="w-full">
            {visibleTabs.length > 1 && (
              <TabsList className="grid w-full mb-4 h-auto p-0.5 bg-muted/30 border border-border" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
                {visibleTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:border-border rounded-md">
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            {/* ═══ ABA 1: DADOS BÁSICOS ═══ */}
            <TabsContent value="basico" className="space-y-6 mt-0">
              {/* Identity Section */}
              <FormSection icon={Building2} title="Identificação">
                <div className="md:col-span-2 flex items-start gap-4">
                  <CompanyLogoUpload
                    logoUrl={logoUrl}
                    onLogoChange={setLogoUrl}
                    companyId={companyId}
                  />
                  <FormField control={form.control} name="nome_crm" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-foreground font-medium">Nome no CRM <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Nome usado internamente" className="h-11" {...field} /></FormControl>
                      <FormDescription className="text-xs">Nome principal exibido nas listagens e buscas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl><Input placeholder="Nome comercial" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="razao_social" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl><Input placeholder="Razão social completa" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <div className="h-px bg-border/50" />

              {/* Classification Section */}
              <FormSection icon={Briefcase} title="Classificação">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'ativo'}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
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

                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      Website
                    </FormLabel>
                    <FormControl><Input placeholder="https://www.empresa.com.br" type="url" inputMode="url" autoComplete="url" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <div className="h-px bg-border/50" />

              {/* Notes & Tags Section */}
              <FormSection icon={Tag} title="Anotações e Tags">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a empresa..." className="min-h-[100px] resize-y" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="tags_array" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Ex: VIP, Cooperativa, Agro — pressione Enter"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="challenges" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desafios</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Ex: Logística, Custos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="competitors" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concorrentes</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Ex: Empresa A, Empresa B"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              {/* Progressive Disclosure hint */}
              {!isEditing && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Após criar, você poderá adicionar <span className="text-foreground font-medium">dados fiscais, telefones, endereços e redes sociais</span>.</span>
                </div>
              )}
            </TabsContent>

            {/* ═══ ABA 2: DADOS FISCAIS ═══ */}
            <TabsContent value="fiscal" className="space-y-6 mt-0">
              <FormSection icon={Hash} title="CNPJ & Situação">
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input placeholder="00.000.000/0000-00" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="cnpj_base" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ Base</FormLabel>
                    <FormControl><Input placeholder="Ex: 12345678" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription className="text-xs">8 primeiros dígitos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="situacao_rf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação RF</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <FormControl><Input type="date" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <div className="h-px bg-border/50" />

              <FormSection icon={Landmark} title="Dados Legais">
                <FormField control={form.control} name="capital_social" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capital Social (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="natureza_juridica" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Natureza Jurídica (Código)</FormLabel>
                    <FormControl><Input placeholder="Ex: 2062" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="natureza_juridica_desc" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Natureza Jurídica (Descrição)</FormLabel>
                    <FormControl><Input placeholder="Ex: Sociedade Empresária LTDA" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="porte_rf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porte (Receita Federal)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Data de Fundação
                    </FormLabel>
                    <FormControl><Input type="date" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="inscricao_estadual" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição Estadual</FormLabel>
                    <FormControl><Input placeholder="IE" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="inscricao_municipal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição Municipal</FormLabel>
                    <FormControl><Input placeholder="IM" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>
            </TabsContent>

            {/* ═══ ABA 3: CLASSIFICAÇÃO ═══ */}
            <TabsContent value="classificacao" className="space-y-6 mt-0">
              <FormSection icon={Shield} title="Tipo de Parceiro">
                <div className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <FormField control={form.control} name="is_customer" render={({ field }) => (
                      <FormItem className="flex items-center gap-2.5 space-y-0">
                        <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm">Cliente Ativo</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_supplier" render={({ field }) => (
                      <FormItem className="flex items-center gap-2.5 space-y-0">
                        <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm">Fornecedor</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_carrier" render={({ field }) => (
                      <FormItem className="flex items-center gap-2.5 space-y-0">
                        <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm">Transportadora</FormLabel>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FormField control={form.control} name="is_matriz" render={({ field }) => (
                    <FormItem className="flex items-center gap-2.5 space-y-0 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer text-sm">É Matriz</FormLabel>
                      <FormDescription className="ml-1 text-xs">(desmarque para filial)</FormDescription>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="grupo_economico" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo Econômico</FormLabel>
                    <FormControl><Input placeholder="Ex: Coanorp Cooperativa" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="tipo_cooperativa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cooperativa</FormLabel>
                    <FormControl><Input placeholder="Ex: Singular, Central..." className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="numero_cooperativa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº da Cooperativa</FormLabel>
                    <FormControl><Input placeholder="Número de registro" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>
            </TabsContent>

            {/* ═══ ABA 4: ESTRUTURA ═══ */}
            <TabsContent value="estrutura" className="space-y-6 mt-0">
              <FormSection icon={Landmark} title="Financeiro & Porte">
                <FormField control={form.control} name="employee_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Funcionários</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <FormControl><Input placeholder="R$ 1-5M" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="financial_health" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saúde Financeira</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'unknown'}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <FormLabel className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                      Cores da Marca
                    </FormLabel>
                    <FormControl><Input placeholder="Ex: #0066CC, #FF6600" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormDescription className="text-xs">Cores da identidade visual</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <div className="h-px bg-border/50" />

              <FormSection icon={GitMerge} title="IDs Relacionais">
                <FormField control={form.control} name="matriz_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID da Matriz</FormLabel>
                    <FormControl><Input placeholder="UUID da empresa matriz" className="h-11 font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="grupo_economico_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Grupo Econômico</FormLabel>
                    <FormControl><Input placeholder="UUID do grupo" className="h-11 font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="central_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Central</FormLabel>
                    <FormControl><Input placeholder="UUID da central" className="h-11 font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="singular_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Singular</FormLabel>
                    <FormControl><Input placeholder="UUID da singular" className="h-11 font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="confederacao_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Confederação</FormLabel>
                    <FormControl><Input placeholder="UUID da confederação" className="h-11 font-mono text-xs" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bitrix_company_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bitrix Company ID</FormLabel>
                    <FormControl><Input type="number" placeholder="ID no Bitrix24" className="h-11" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="merge_notes" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas de Merge</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Histórico de fusões/merges desta empresa..." className="min-h-[80px] resize-y" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription className="text-xs">Registro de merges realizados</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>
            </TabsContent>

            {/* ═══ ABA 5: TELEFONES ═══ */}
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
                <EmptyTabPlaceholder icon={Phone} text="Salve a empresa primeiro para adicionar telefones" />
              )}
            </TabsContent>

            {/* ═══ ABA 6: ENDEREÇOS ═══ */}
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
                <EmptyTabPlaceholder icon={MapPin} text="Salve a empresa primeiro para adicionar endereços" />
              )}
            </TabsContent>

            {/* ═══ ABA 7: REDES SOCIAIS + EMAILS ═══ */}
            <TabsContent value="redes" className="space-y-6 mt-0">
              {companyId ? (
                <>
                  <FormSection icon={Mail} title="Emails">
                    <div className="md:col-span-2">
                      <CompanyEmailsForm
                        companyId={companyId}
                        emails={emailsHook.data}
                        onSave={async (email) => { await emailsHook.upsert.mutateAsync(email); }}
                        onDelete={async (id) => { await emailsHook.remove.mutateAsync(id); }}
                        isLoading={emailsHook.isLoading}
                      />
                    </div>
                  </FormSection>
                  <div className="h-px bg-border/50" />
                  <FormSection icon={Share2} title="Redes Sociais & Website">
                    <div className="md:col-span-2">
                      <CompanySocialMediaForm
                        companyId={companyId}
                        socialMedia={socialMediaHook.data}
                        onSave={async (item) => { await socialMediaHook.upsert.mutateAsync(item); }}
                        onDelete={async (id) => { await socialMediaHook.remove.mutateAsync(id); }}
                        isLoading={socialMediaHook.isLoading}
                      />
                    </div>
                  </FormSection>
                </>
              ) : (
                <EmptyTabPlaceholder icon={Share2} text="Salve a empresa primeiro para adicionar emails e redes sociais" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ─── Premium Sticky Footer ─── */}
        <div className="relative pt-4 shrink-0">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onCancel} className="px-6">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-8 h-11 shadow-lg shadow-primary/20 font-semibold">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

/* ─── Empty state for locked tabs ─── */
function EmptyTabPlaceholder({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[250px]">{text}</p>
    </div>
  );
}
