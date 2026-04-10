import { useMemo } from 'react';
import { Building2, HeartPulse, Landmark, MapPin, Package, Truck, Users } from 'lucide-react';
import type { FilterConfig, SortOption } from '@/components/filters/AdvancedFilters';
import { useExternalLookup } from '@/hooks/useExternalLookup';

const MAX_LOOKUP_OPTIONS = 60;

const statusFallback = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
];

const situacaoRfFallback = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'BAIXADA', label: 'Baixada' },
  { value: 'INAPTA', label: 'Inapta' },
  { value: 'SUSPENSA', label: 'Suspensa' },
  { value: 'NULA', label: 'Nula' },
];

const porteRfFallback = [
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME - Microempresa' },
  { value: 'EPP', label: 'EPP - Pequeno Porte' },
  { value: 'MEDIO', label: 'Médio Porte' },
  { value: 'GRANDE', label: 'Grande Porte' },
  { value: 'DEMAIS', label: 'Demais' },
];

const financialHealthFallback = [
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Boa' },
  { value: 'growing', label: 'Em Crescimento' },
  { value: 'stable', label: 'Estável' },
  { value: 'average', label: 'Regular' },
  { value: 'cutting', label: 'Em Retração' },
  { value: 'poor', label: 'Ruim' },
  { value: 'unknown', label: 'Desconhecida' },
];

const employeeCountFallback = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-100', label: '51-100' },
  { value: '101-500', label: '101-500' },
  { value: '500+', label: '500+' },
];

const healthLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Boa',
  growing: 'Em Crescimento',
  stable: 'Estável',
  average: 'Regular',
  cutting: 'Em Retração',
  poor: 'Ruim',
  unknown: 'Desconhecida',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  suspenso: 'Suspenso',
};

const situacaoRfLabels: Record<string, string> = {
  ATIVA: 'Ativa',
  BAIXADA: 'Baixada',
  INAPTA: 'Inapta',
  SUSPENSA: 'Suspensa',
  NULA: 'Nula',
};

const porteRfLabels: Record<string, string> = {
  MEI: 'MEI',
  ME: 'ME - Microempresa',
  EPP: 'EPP - Pequeno Porte',
  MEDIO: 'Médio Porte',
  GRANDE: 'Grande Porte',
  DEMAIS: 'Demais',
};

function normalizeLookupValues(values?: string[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .slice(0, MAX_LOOKUP_OPTIONS);
}

function buildLookupOptions(
  values: string[] | undefined,
  fallback: FilterConfig['options'] = [],
  labels: Record<string, string> = {}
) {
  const normalizedValues = normalizeLookupValues(values);
  const fallbackMap = new Map(fallback.map((option) => [option.value, option]));

  const mergedFallback = fallback.map((option) => ({
    ...option,
    label: labels[option.value] || option.label,
  }));

  const dynamicOptions = normalizedValues
    .filter((value) => !fallbackMap.has(value))
    .map((value) => ({ value, label: labels[value] || value }));

  return [...mergedFallback, ...dynamicOptions];
}

export const companySortOptions: SortOption[] = [
  { value: 'updated_at', label: 'Última Atualização' },
  { value: 'name', label: 'Nome' },
  { value: 'status', label: 'Status' },
  { value: 'ramo_atividade', label: 'Ramo de Atividade' },
  { value: 'grupo_economico', label: 'Grupo Econômico' },
  { value: 'financial_health', label: 'Saúde Financeira' },
  { value: 'employee_count', label: 'Faixa de Funcionários' },
];

export function useCompanyFilterOptions() {
  const { data: ramoValues = [] } = useExternalLookup('companies', 'ramo_atividade');
  const { data: nichoValues = [] } = useExternalLookup('companies', 'nicho_cliente');
  const { data: grupoValues = [] } = useExternalLookup('companies', 'grupo_economico');
  const { data: cooperativaValues = [] } = useExternalLookup('companies', 'tipo_cooperativa');
  const { data: naturezaValues = [] } = useExternalLookup('companies', 'natureza_juridica_desc');
  const { data: statusValues = [] } = useExternalLookup('companies', 'status');
  const { data: situacaoValues = [] } = useExternalLookup('companies', 'situacao_rf');
  const { data: porteValues = [] } = useExternalLookup('companies', 'porte_rf');
  const { data: healthValues = [] } = useExternalLookup('companies', 'financial_health');
  const { data: employeeCountValues = [] } = useExternalLookup('companies', 'employee_count');
  const { data: cityValues = [] } = useExternalLookup('companies', 'city');
  const { data: stateValues = [] } = useExternalLookup('companies', 'state');

  return useMemo<FilterConfig[]>(() => {
    const filters: FilterConfig[] = [
      {
        key: 'is_customer',
        label: 'Tipo',
        multiple: false,
        options: [
          { value: 'true', label: 'Cliente', icon: Users },
          { value: 'false', label: 'Prospect', icon: Building2 },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        multiple: true,
        options: buildLookupOptions(statusValues, statusFallback, statusLabels),
      },
      {
        key: 'ramo_atividade',
        label: 'Ramo',
        multiple: true,
        options: buildLookupOptions(ramoValues),
      },
      {
        key: 'nicho_cliente',
        label: 'Nicho',
        multiple: true,
        options: buildLookupOptions(nichoValues),
      },
      {
        key: 'grupo_economico',
        label: 'Grupo Econômico',
        multiple: true,
        options: buildLookupOptions(grupoValues),
      },
      {
        key: 'tipo_cooperativa',
        label: 'Cooperativa',
        multiple: true,
        options: buildLookupOptions(cooperativaValues),
      },
      {
        key: 'natureza_juridica_desc',
        label: 'Natureza Jurídica',
        multiple: true,
        options: buildLookupOptions(naturezaValues),
      },
      {
        key: 'situacao_rf',
        label: 'Situação RF',
        multiple: true,
        options: buildLookupOptions(situacaoValues, situacaoRfFallback, situacaoRfLabels),
      },
      {
        key: 'porte_rf',
        label: 'Porte RF',
        multiple: true,
        options: buildLookupOptions(porteValues, porteRfFallback, porteRfLabels),
      },
      {
        key: 'financial_health',
        label: 'Saúde Financeira',
        multiple: true,
        options: buildLookupOptions(healthValues, financialHealthFallback, healthLabels),
      },
      {
        key: 'employee_count',
        label: 'Funcionários',
        multiple: true,
        options: buildLookupOptions(employeeCountValues, employeeCountFallback),
      },
      {
        key: 'city',
        label: 'Cidade',
        multiple: true,
        options: buildLookupOptions(cityValues).map((option) => ({ ...option, icon: MapPin })),
      },
      ...(stateValues.length > 0
        ? [
            {
              key: 'state' as const,
              label: 'UF',
              multiple: true,
              options: buildLookupOptions(stateValues).map((option) => ({ ...option, icon: MapPin })),
            },
          ]
        : []),
      {
        key: 'is_supplier',
        label: 'Fornecedor',
        multiple: false,
        options: [
          { value: 'true', label: 'Sim', icon: Package },
          { value: 'false', label: 'Não', icon: Package },
        ],
      },
      {
        key: 'is_carrier',
        label: 'Transportadora',
        multiple: false,
        options: [
          { value: 'true', label: 'Sim', icon: Truck },
          { value: 'false', label: 'Não', icon: Truck },
        ],
      },
      {
        key: 'is_matriz',
        label: 'Estrutura',
        multiple: false,
        options: [
          { value: 'true', label: 'Matriz', icon: Landmark },
          { value: 'false', label: 'Filial', icon: Building2 },
        ],
      },
    ];

    return filters.filter((filter) => filter.options.length > 0);
  }, [
    cooperativaValues,
    employeeCountValues,
    grupoValues,
    healthValues,
    naturezaValues,
    nichoValues,
    porteValues,
    ramoValues,
    situacaoValues,
    cityValues,
    stateValues,
    statusValues,
  ]);
}