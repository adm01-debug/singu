import { useState, useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useDebounce } from './useDebounce';

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

interface FieldValidation {
  state: ValidationState;
  error: string | null;
  touched: boolean;
}

interface UseFormValidationOptions<T extends z.ZodType> {
  schema: T;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends z.ZodType>({
  schema,
  debounceMs = 300,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [validations, setValidations] = useState<Record<string, FieldValidation>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce values for validation
  const debouncedValues = useDebounce(values, debounceMs);

  // Validate a single field
  const validateField = useCallback((
    fieldName: string,
    value: unknown
  ): { valid: boolean; error: string | null } => {
    try {
      // Try to get the field schema if it's a ZodObject
      const schemaAny = schema as unknown as { shape?: Record<string, z.ZodType> };
      if (schemaAny.shape && schemaAny.shape[fieldName]) {
        schemaAny.shape[fieldName].parse(value);
      } else {
        // If not an object schema, validate the whole value
        schema.parse({ [fieldName]: value });
      }
      return { valid: true, error: null };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { valid: false, error: err.errors[0]?.message || 'Valor inválido' };
      }
      return { valid: false, error: 'Erro de validação' };
    }
  }, [schema]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    try {
      schema.parse(values);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newValidations: Record<string, FieldValidation> = {};
        err.errors.forEach((error) => {
          const fieldName = error.path.join('.');
          newValidations[fieldName] = {
            state: 'invalid',
            error: error.message,
            touched: true,
          };
        });
        setValidations((prev) => ({ ...prev, ...newValidations }));
      }
      return false;
    }
  }, [schema, values]);

  // Update field value
  const setValue = useCallback((fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    
    if (validateOnChange) {
      setValidations((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          state: 'validating',
          touched: true,
        },
      }));
    }
  }, [validateOnChange]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => {
    if (!validateOnBlur) return;

    const value = values[fieldName];
    const result = validateField(fieldName, value);
    
    setValidations((prev) => ({
      ...prev,
      [fieldName]: {
        state: result.valid ? 'valid' : 'invalid',
        error: result.error,
        touched: true,
      },
    }));
  }, [values, validateField, validateOnBlur]);

  // Validate on debounced value change
  useEffect(() => {
    if (!validateOnChange) return;

    Object.entries(debouncedValues).forEach(([fieldName, value]) => {
      const validation = validations[fieldName];
      if (validation?.state === 'validating') {
        const result = validateField(fieldName, value);
        setValidations((prev) => ({
          ...prev,
          [fieldName]: {
            state: result.valid ? 'valid' : 'invalid',
            error: result.error,
            touched: true,
          },
        }));
      }
    });
  }, [debouncedValues, validateField, validateOnChange, validations]);

  // Get field props helper
  const getFieldProps = useCallback((fieldName: string) => ({
    value: values[fieldName] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      setValue(fieldName, e.target.value),
    onBlur: () => handleBlur(fieldName),
  }), [values, setValue, handleBlur]);

  // Get field validation state
  const getFieldState = useCallback((fieldName: string): FieldValidation => {
    return validations[fieldName] || { state: 'idle', error: null, touched: false };
  }, [validations]);

  // Check if form is valid
  const isValid = useMemo(() => {
    const touched = Object.values(validations).filter(v => v.touched);
    if (touched.length === 0) return false;
    return touched.every(v => v.state === 'valid');
  }, [validations]);

  // Check if form has errors
  const hasErrors = useMemo(() => {
    return Object.values(validations).some(v => v.state === 'invalid');
  }, [validations]);

  // Reset form
  const reset = useCallback(() => {
    setValues({});
    setValidations({});
    setIsSubmitting(false);
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async (
    onSubmit: (data: z.infer<T>) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    if (!validateAll()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values as z.infer<T>);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll]);

  return {
    values,
    setValue,
    setValues,
    validations,
    getFieldProps,
    getFieldState,
    validateField,
    validateAll,
    handleBlur,
    handleSubmit,
    isValid,
    hasErrors,
    isSubmitting,
    reset,
  };
}

// Common validation schemas
export const validationSchemas = {
  email: z.string().email('Email inválido'),
  
  phone: z.string()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  
  whatsapp: z.string()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9[0-9]{4}[\s-]?[0-9]{4}$/, 'WhatsApp deve ter DDD + 9 dígitos')
    .optional()
    .or(z.literal('')),
  
  linkedin: z.string()
    .url('URL inválida')
    .refine((url) => url.includes('linkedin.com'), 'Deve ser um link do LinkedIn')
    .optional()
    .or(z.literal('')),
  
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  
  shortText: z.string().max(255, 'Texto muito longo'),
  
  longText: z.string().max(5000, 'Texto muito longo'),
  
  required: z.string().min(1, 'Campo obrigatório'),
};
