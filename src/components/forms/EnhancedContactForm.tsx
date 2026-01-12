import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { User, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { Contact } from '@/hooks/useContacts';
import type { Company } from '@/hooks/useCompanies';

// Enhanced schema with real-time validation
const contactSchema = z.object({
  first_name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  last_name: z.string()
    .trim()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  company_id: z.string().uuid('Selecione uma empresa').optional().nullable(),
  role: z.string().optional(),
  role_title: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  email: z.string()
    .trim()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  whatsapp: z.string()
    .trim()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9[0-9]{4}[\s-]?[0-9]{4}$/, 'WhatsApp deve ter DDD + 9 dígitos')
    .optional()
    .or(z.literal('')),
  linkedin: z.string()
    .trim()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  instagram: z.string().trim().max(50, 'Máximo 50 caracteres').optional(),
  birthday: z.string().optional(),
  relationship_stage: z.string().optional(),
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Validated input component with real-time feedback
interface ValidatedInputProps {
  name: keyof ContactFormData;
  control: any;
  label: string;
  placeholder?: string;
  type?: string;
  schema: z.ZodTypeAny;
  className?: string;
}

function ValidatedInput({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  schema,
  className,
}: ValidatedInputProps) {
  const value = useWatch({ control, name });
  const debouncedValue = useDebounce(value, 300);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!debouncedValue || debouncedValue === '') {
      setValidationState('idle');
      setErrorMessage('');
      return;
    }

    try {
      schema.parse(debouncedValue);
      setValidationState('valid');
      setErrorMessage('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationState('invalid');
        setErrorMessage(error.errors[0]?.message || 'Valor inválido');
      }
    }
  }, [debouncedValue, schema]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="flex items-center gap-2">
        {label}
        <AnimatePresence mode="wait">
          {validationState === 'valid' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-success"
            >
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          )}
          {validationState === 'invalid' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-destructive"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Label>
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              className={cn(
                'transition-all duration-200',
                validationState === 'invalid' && 'border-destructive focus-visible:ring-destructive',
                validationState === 'valid' && 'border-success focus-visible:ring-success'
              )}
            />
          )}
        />
        <AnimatePresence>
          {validationState === 'valid' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-success"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {validationState === 'invalid' && errorMessage && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-xs text-destructive"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface EnhancedContactFormProps {
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

export function EnhancedContactForm({
  contact,
  companies,
  defaultCompanyId,
  onSubmit,
  onCancel,
  isSubmitting,
}: EnhancedContactFormProps) {
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
    mode: 'onChange',
  });

  const [formProgress, setFormProgress] = useState(0);

  // Calculate form completion progress
  useEffect(() => {
    const values = form.watch();
    const requiredFields = ['first_name', 'last_name'];
    const optionalFields = ['email', 'phone', 'whatsapp', 'company_id', 'role_title'];
    
    let filled = 0;
    requiredFields.forEach(field => {
      if (values[field as keyof ContactFormData]) filled += 2;
    });
    optionalFields.forEach(field => {
      if (values[field as keyof ContactFormData]) filled += 1;
    });
    
    const maxScore = requiredFields.length * 2 + optionalFields.length;
    setFormProgress(Math.min(100, Math.round((filled / maxScore) * 100)));
  }, [form.watch()]);

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
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {contact ? 'Atualize as informações do contato' : 'Preencha os dados do contato'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${formProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-medium">{formProgress}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          name="first_name"
          control={form.control}
          label="Nome *"
          placeholder="João"
          schema={contactSchema.shape.first_name}
        />

        <ValidatedInput
          name="last_name"
          control={form.control}
          label="Sobrenome *"
          placeholder="Silva"
          schema={contactSchema.shape.last_name}
        />

        <Controller
          name="company_id"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <ValidatedInput
          name="role_title"
          control={form.control}
          label="Cargo"
          placeholder="Gerente Comercial"
          schema={contactSchema.shape.role_title}
        />

        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label>Tipo de Contato</Label>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <Controller
          name="relationship_stage"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label>Estágio do Relacionamento</Label>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipStageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <ValidatedInput
          name="email"
          control={form.control}
          label="Email"
          placeholder="joao@empresa.com.br"
          type="email"
          schema={contactSchema.shape.email}
        />

        <ValidatedInput
          name="phone"
          control={form.control}
          label="Telefone"
          placeholder="(11) 99999-9999"
          schema={contactSchema.shape.phone}
        />

        <ValidatedInput
          name="whatsapp"
          control={form.control}
          label="WhatsApp"
          placeholder="(11) 99999-9999"
          schema={contactSchema.shape.whatsapp}
        />

        <Controller
          name="birthday"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label>Aniversário</Label>
              <Input type="date" {...field} />
            </div>
          )}
        />

        <ValidatedInput
          name="linkedin"
          control={form.control}
          label="LinkedIn"
          placeholder="https://linkedin.com/in/joaosilva"
          schema={contactSchema.shape.linkedin}
        />

        <ValidatedInput
          name="instagram"
          control={form.control}
          label="Instagram"
          placeholder="@joaosilva"
          schema={contactSchema.shape.instagram}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observações sobre o contato..."
                className="min-h-[100px]"
                {...field}
              />
              <p className="text-xs text-muted-foreground text-right">
                {(field.value?.length || 0)}/1000 caracteres
              </p>
            </div>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {contact ? 'Salvar Alterações' : 'Criar Contato'}
        </Button>
      </div>
    </form>
  );
}
