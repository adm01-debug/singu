import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Polyfill ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

// ─── Helpers ────────────────────────────────────────────────────
const mockSubmit = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();

function renderForm(company?: any) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CompanyForm
          company={company}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Full external DB company record (simulates data from external-data edge function)
const fullExternalCompany = {
  id: '53486360-6508-4a92-ae37-a20c17a28d17',
  name: 'Cocamar - Lobato/PR',
  nome_crm: 'Cocamar - Lobato/PR',
  nome_fantasia: 'Cocamar',
  razao_social: 'COCAMAR COOPERATIVA AGROINDUSTRIAL',
  cnpj: '79.114.450/0284-18',
  cnpj_base: '79114450',
  ramo_atividade: 'Cooperativas Agroindustrial',
  nicho_cliente: 'Agro',
  industry: 'Cooperativas Agroindustrial',
  website: 'https://www.coanorp.com.br/',
  phone: '(44) 3261-8000',
  email: 'contato@cocamar.com.br',
  address: 'PR 458 S/N',
  city: 'Lobato',
  state: 'PR',
  status: 'ativo',
  situacao_rf: 'ATIVA',
  situacao_rf_data: '2026-03-01',
  capital_social: 319967786.74,
  natureza_juridica: '2143',
  natureza_juridica_desc: 'Cooperativa',
  porte_rf: 'GRANDE',
  data_fundacao: '1963-03-27',
  grupo_economico: 'Coanorp Cooperativa',
  grupo_economico_id: '9338a177-8645-4600-9817-cb0f6bf1069b',
  is_customer: true,
  is_supplier: false,
  is_carrier: false,
  is_matriz: false,
  tipo_cooperativa: 'Singular',
  numero_cooperativa: '12345',
  inscricao_estadual: '123456789',
  inscricao_municipal: '987654',
  cores_marca: '#009639, #FFFFFF',
  employee_count: '500+',
  annual_revenue: 'R$ 5B+',
  financial_health: 'growing',
  notes: 'Maior cooperativa agroindustrial do Paraná',
  tags: ['agro', 'cooperativa'],
  extra_data_rf: { enriched_at: '2026-03-01', source: 'BigQuery_RFB_n8n' },
  logo_url: 'https://example.com/logo.png',
  user_id: 'test-user-id',
  created_at: '2026-02-04T11:22:11.77795+00:00',
  updated_at: '2026-02-11T10:43:13.658791+00:00',
};

// Minimal company (only required fields)
const minimalCompany = {
  id: 'min-id',
  name: 'Empresa Mínima',
  user_id: 'test-user',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

// Company with null/undefined fields
const nullFieldsCompany = {
  id: 'null-id',
  name: 'Empresa Nulos',
  nome_fantasia: null,
  razao_social: undefined,
  cnpj: null,
  capital_social: null,
  is_customer: null,
  is_supplier: undefined,
  status: null,
  financial_health: null,
  user_id: 'test-user',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// SECTION 1: RENDERING TESTS
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Rendering', () => {
  it('renders create mode with correct title', () => {
    renderForm();
    expect(screen.getByText('Nova Empresa')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados da empresa')).toBeInTheDocument();
  });

  it('renders edit mode with correct title', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Atualize as informações da empresa')).toBeInTheDocument();
  });

  it('renders all 7 tabs', () => {
    renderForm();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Fiscal')).toBeInTheDocument();
    expect(screen.getByText('Classif.')).toBeInTheDocument();
    expect(screen.getByText('Estrutura')).toBeInTheDocument();
    expect(screen.getByText('Telefones')).toBeInTheDocument();
    expect(screen.getByText('Endereços')).toBeInTheDocument();
    expect(screen.getByText('Redes')).toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    renderForm();
    expect(screen.getByText('Criar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('shows "Salvar Alterações" in edit mode', () => {
    renderForm(fullExternalCompany);
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('renders Básico tab fields by default', () => {
    renderForm();
    expect(screen.getByText('Nome no CRM *')).toBeInTheDocument();
    expect(screen.getByText('Nome Fantasia')).toBeInTheDocument();
    expect(screen.getByText('Razão Social')).toBeInTheDocument();
    expect(screen.getByText('Nome no CRM')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    // Telefone is now a separate tab.toBeInTheDocument();
    // Email removed from basico.toBeInTheDocument();
    // Endereço is now a separate tab.toBeInTheDocument();
    // Cidade in endereco tab.toBeInTheDocument();
    // Estado in endereco tab.toBeInTheDocument();
    expect(screen.getByText('Notas')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Ramo de Atividade')).toBeInTheDocument();
    expect(screen.getByText('Nicho do Cliente')).toBeInTheDocument();
    // Segmento removed.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 2: TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Tab Navigation', () => {
  it('switches to Fiscal tab and shows fiscal fields', async () => {
    renderForm();
    await userEvent.click(screen.getByText('Fiscal'));
    expect(screen.getByText('CNPJ')).toBeInTheDocument();
    expect(screen.getByText('Situação RF')).toBeInTheDocument();
    expect(screen.getByText('Capital Social (R$)')).toBeInTheDocument();
    expect(screen.getByText('Natureza Jurídica (Código)')).toBeInTheDocument();
    expect(screen.getByText('Natureza Jurídica (Descrição)')).toBeInTheDocument();
    expect(screen.getByText('Porte (Receita Federal)')).toBeInTheDocument();
    expect(screen.getByText('Data de Fundação')).toBeInTheDocument();
    expect(screen.getByText('Inscrição Estadual')).toBeInTheDocument();
    expect(screen.getByText('Inscrição Municipal')).toBeInTheDocument();
  });

  it('switches to Classificação tab and shows classification fields', async () => {
    renderForm();
    await userEvent.click(screen.getByText('Classif.'));
    expect(screen.getByText('Tipo de Parceiro')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor')).toBeInTheDocument();
    expect(screen.getByText('Transportadora')).toBeInTheDocument();
    expect(screen.getByText('É Matriz')).toBeInTheDocument();
    expect(screen.getByText('Grupo Econômico')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Cooperativa')).toBeInTheDocument();
    expect(screen.getByText('Nº da Cooperativa')).toBeInTheDocument();
  });

  it('switches to Estrutura tab and shows structure fields', async () => {
    renderForm();
    await userEvent.click(screen.getByText('Estrutura'));
    expect(screen.getByText('Nº Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Faturamento Anual')).toBeInTheDocument();
    expect(screen.getByText('Saúde Financeira')).toBeInTheDocument();
    expect(screen.getByText('Cores da Marca')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 3: DEFAULT VALUES (EDIT MODE)
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Default Values Population', () => {
  it('populates basic fields from full external company', () => {
    renderForm(fullExternalCompany);
    // name and nome_crm both have the same value, so use getAllBy
    const cocamarFields = screen.getAllByDisplayValue('Cocamar - Lobato/PR');
    expect(cocamarFields.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('Cocamar')).toBeInTheDocument(); // nome_fantasia
    expect(screen.getByDisplayValue('COCAMAR COOPERATIVA AGROINDUSTRIAL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://www.coanorp.com.br/')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(44) 3261-8000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('contato@cocamar.com.br')).toBeInTheDocument();
  });

  it('populates fiscal fields from full external company', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByText('Fiscal'));
    expect(screen.getByDisplayValue('79.114.450/0284-18')).toBeInTheDocument();
    expect(screen.getByDisplayValue('319967786.74')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2143')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cooperativa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('987654')).toBeInTheDocument();
  });

  it('populates classification fields from full external company', async () => {
    renderForm(fullExternalCompany);
    await userEvent.click(screen.getByText('Classif.'));

    // is_customer should be checked
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "Cliente" (is_customer = true)
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it('handles minimal company without crashing', () => {
    expect(() => renderForm(minimalCompany)).not.toThrow();
    expect(screen.getByDisplayValue('Empresa Mínima')).toBeInTheDocument();
  });

  it('handles null/undefined fields gracefully', () => {
    expect(() => renderForm(nullFieldsCompany)).not.toThrow();
    expect(screen.getByDisplayValue('Empresa Nulos')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: FORM VALIDATION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Validation', () => {
  it('requires company name', async () => {
    renderForm();
    const submitBtn = screen.getByText('Criar Empresa');
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    await userEvent.type(nameInput, 'Test Co');
    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br');
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('validates website URL format', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    await userEvent.type(nameInput, 'Test Co');
    const websiteInput = screen.getByPlaceholderText('https://exemplo.com.br');
    await userEvent.type(websiteInput, 'not-a-url');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(screen.getByText('URL inválida')).toBeInTheDocument();
    });
  });

  it('accepts valid email', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    await userEvent.type(nameInput, 'Test Co');
    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br');
    await userEvent.type(emailInput, 'valid@test.com');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('allows empty optional fields', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    await userEvent.type(nameInput, 'Minimal Company');
    await userEvent.click(screen.getByText('Criar Empresa'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('enforces max 2 chars for state', () => {
    renderForm();
    const stateInput = screen.getByPlaceholderText('SP');
    expect(stateInput).toHaveAttribute('maxLength', '2');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: FORM SUBMISSION
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Submission', () => {
  it('calls onSubmit with cleaned data (empty strings → null)', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    await userEvent.type(nameInput, 'Nova Empresa Teste');
    await userEvent.click(screen.getByText('Criar Empresa'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.name).toBe('Nova Empresa Teste');
      // Empty optional fields should be null
      expect(submitted.website).toBeNull();
      expect(submitted.email).toBeNull();
      expect(submitted.cnpj).toBeNull();
      expect(submitted.razao_social).toBeNull();
      expect(submitted.grupo_economico).toBeNull();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderForm();
    await userEvent.click(screen.getByText('Cancelar'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    render(
      <BrowserRouter>
        <CompanyForm onSubmit={mockSubmit} onCancel={mockCancel} isSubmitting={true} />
      </BrowserRouter>
    );
    const submitBtn = screen.getByText('Criar Empresa');
    expect(submitBtn.closest('button')).toBeDisabled();
  });

  it('shows loading spinner when isSubmitting', () => {
    render(
      <BrowserRouter>
        <CompanyForm onSubmit={mockSubmit} onCancel={mockCancel} isSubmitting={true} />
      </BrowserRouter>
    );
    // Loader2 icon should be present (svg with animate-spin)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 6: NULL SAFETY & EDGE CASES
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Null Safety & Edge Cases', () => {
  it('renders with undefined company (create mode)', () => {
    expect(() => renderForm(undefined)).not.toThrow();
  });

  it('renders with null company (create mode)', () => {
    expect(() => renderForm(null)).not.toThrow();
  });

  it('handles company with all fields as null', () => {
    const allNulls = {
      id: 'all-null',
      name: 'Test',
      nome_fantasia: null, razao_social: null, nome_crm: null,
      cnpj: null, ramo_atividade: null, nicho_cliente: null,
      capital_social: null, situacao_rf: null, situacao_rf_data: null,
      porte_rf: null, natureza_juridica: null, natureza_juridica_desc: null,
      data_fundacao: null, grupo_economico: null, is_customer: null,
      is_supplier: null, is_carrier: null, is_matriz: null,
      tipo_cooperativa: null, numero_cooperativa: null,
      inscricao_estadual: null, inscricao_municipal: null,
      cores_marca: null, status: null, financial_health: null,
      employee_count: null, annual_revenue: null,
      website: null, phone: null, email: null, address: null,
      city: null, state: null, notes: null,
      user_id: 'u', created_at: '', updated_at: '',
    };
    expect(() => renderForm(allNulls)).not.toThrow();
  });

  it('handles company with extra unknown fields without crashing', () => {
    const withExtras = {
      ...minimalCompany,
      unknown_field_1: 'foo',
      unknown_field_2: 42,
      deeply_nested: { a: { b: { c: 1 } } },
    };
    expect(() => renderForm(withExtras)).not.toThrow();
  });

  it('handles capital_social as 0', () => {
    const zeroCapital = { ...minimalCompany, capital_social: 0 };
    expect(() => renderForm(zeroCapital)).not.toThrow();
  });

  it('handles capital_social as very large number', () => {
    const huge = { ...minimalCompany, capital_social: 999999999999.99 };
    expect(() => renderForm(huge)).not.toThrow();
  });

  it('handles boolean fields as undefined', () => {
    const undefinedBooleans = {
      ...minimalCompany,
      is_customer: undefined,
      is_supplier: undefined,
      is_carrier: undefined,
      is_matriz: undefined,
    };
    expect(() => renderForm(undefinedBooleans)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 7: DATA MAPPING (EXTERNAL → LOCAL)
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — External Data Mapping', () => {
  it('maps nome_crm as primary name when name is empty', () => {
    const ext = { ...minimalCompany, name: '', nome_crm: 'CRM Name', nome_fantasia: 'Fantasy', razao_social: 'Legal' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    expect(nameInput).toHaveValue('CRM Name');
  });

  it('uses name field when available', () => {
    const ext = { ...minimalCompany, name: 'Direct Name', nome_crm: 'CRM Name' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    expect(nameInput).toHaveValue('Direct Name');
  });

  it('falls back to nome_fantasia when name and nome_crm are empty', () => {
    const ext = { ...minimalCompany, name: '', nome_crm: '', nome_fantasia: 'Fantasy Name', razao_social: 'Legal' };
    renderForm(ext);
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    expect(nameInput).toHaveValue('Fantasy Name');
  });

  it('preserves all external fields in edit mode', async () => {
    renderForm(fullExternalCompany);

    // ramo_atividade and industry share the same value, so use getAllBy
    const ramoFields = screen.getAllByDisplayValue('Cooperativas Agroindustrial');
    expect(ramoFields.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('Agro')).toBeInTheDocument(); // nicho_cliente

    // Fiscal tab
    await userEvent.click(screen.getByText('Fiscal'));
    expect(screen.getByDisplayValue('79.114.450/0284-18')).toBeInTheDocument();

    // Classificação tab
    await userEvent.click(screen.getByText('Classif.'));
    expect(screen.getByDisplayValue('Coanorp Cooperativa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Singular')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();

    // Estrutura tab
    await userEvent.click(screen.getByText('Estrutura'));
    expect(screen.getByDisplayValue('#009639, #FFFFFF')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 8: SCHEMA ALIGNMENT
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Schema Alignment with External DB', () => {
  const externalFields = [
    'nome_crm', 'nome_fantasia', 'razao_social', 'cnpj', 'ramo_atividade',
    'nicho_cliente', 'capital_social', 'status', 'situacao_rf', 'situacao_rf_data',
    'porte_rf', 'natureza_juridica', 'natureza_juridica_desc', 'data_fundacao',
    'grupo_economico', 'is_customer', 'is_supplier', 'is_carrier', 'is_matriz',
    'tipo_cooperativa', 'numero_cooperativa', 'inscricao_estadual', 'inscricao_municipal',
    'cores_marca', 'website', 'employee_count', 'annual_revenue', 'financial_health',
  ];

  it.each(externalFields)('form schema includes field: %s', (field) => {
    // Verify the form renders without error when the field is set
    const company = { ...minimalCompany, [field]: field === 'capital_social' ? 100 : field.includes('is_') ? true : 'test-value' };
    expect(() => renderForm(company)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 9: STRESS & BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════
describe('CompanyForm — Stress & Boundary', () => {
  it('handles name at max length (100 chars)', () => {
    const longName = 'A'.repeat(100);
    renderForm({ ...minimalCompany, name: longName });
    expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
  });

  it('handles notes at max length (2000 chars)', () => {
    const longNotes = 'N'.repeat(2000);
    renderForm({ ...minimalCompany, notes: longNotes });
    expect(screen.getByDisplayValue(longNotes)).toBeInTheDocument();
  });

  it('handles CNPJ with special characters', () => {
    renderForm({ ...minimalCompany, cnpj: '79.114.450/0284-18' });
    // Should not crash
  });

  it('handles rapid tab switching', async () => {
    renderForm(fullExternalCompany);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByText('Fiscal'));
      await userEvent.click(screen.getByText('Classif.'));
      await userEvent.click(screen.getByText('Estrutura'));
      await userEvent.click(screen.getByText('Básico'));
    }
    // Should still be functional
    expect(screen.getByText('Nome no CRM *')).toBeInTheDocument();
  });

  it('renders 10 forms concurrently without error', () => {
    const { unmount } = render(
      <BrowserRouter>
        {Array.from({ length: 10 }, (_, i) => (
          <CompanyForm
            key={i}
            company={{ ...fullExternalCompany, id: `id-${i}` } as any}
            onSubmit={mockSubmit}
            onCancel={mockCancel}
          />
        ))}
      </BrowserRouter>
    );
    expect(screen.getAllByText('Editar Empresa')).toHaveLength(10);
    unmount();
  });
});
