/**
 * Componente de Card de Empresa otimizado com React.memo
 * Evita re-renders desnecessários em listas grandes
 */

import { memo, useCallback } from 'react';
import { CompanyCardWithContext } from './CompanyCardWithContext';
import type { Company } from '@/hooks/useCompanies';

interface CompanyCardMemoProps {
  company: Company;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onUpdate: (id: string, data: Partial<Company>) => Promise<Company | null>;
}

// Função de comparação customizada para evitar re-renders
function arePropsEqual(
  prevProps: CompanyCardMemoProps,
  nextProps: CompanyCardMemoProps
): boolean {
  // Comparar propriedades primitivas primeiro (mais rápido)
  if (
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isHighlighted !== nextProps.isHighlighted ||
    prevProps.selectionMode !== nextProps.selectionMode ||
    prevProps.index !== nextProps.index
  ) {
    return false;
  }

  // Comparar company por referência e campos críticos
  if (prevProps.company !== nextProps.company) {
    const prevCompany = prevProps.company;
    const nextCompany = nextProps.company;
    
    if (
      prevCompany.id !== nextCompany.id ||
      prevCompany.name !== nextCompany.name ||
      prevCompany.industry !== nextCompany.industry ||
      prevCompany.email !== nextCompany.email ||
      prevCompany.phone !== nextCompany.phone ||
      prevCompany.website !== nextCompany.website ||
      prevCompany.logo_url !== nextCompany.logo_url ||
      prevCompany.financial_health !== nextCompany.financial_health ||
      prevCompany.updated_at !== nextCompany.updated_at
    ) {
      return false;
    }
  }

  return true;
}

/**
 * CompanyCardMemo - Versão otimizada do CompanyCard com memoização
 */
export const CompanyCardMemo = memo(function CompanyCardMemo({
  company,
  index,
  isSelected,
  isHighlighted,
  selectionMode,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
}: CompanyCardMemoProps) {
  const handleSelect = useCallback(
    (id: string, selected: boolean) => onSelect(id, selected),
    [onSelect]
  );

  const handleEdit = useCallback(
    (c: Company) => onEdit(c),
    [onEdit]
  );

  const handleDelete = useCallback(
    (c: Company) => onDelete(c),
    [onDelete]
  );

  const handleUpdate = useCallback(
    (id: string, data: Partial<Company>) => onUpdate(id, data),
    [onUpdate]
  );

  return (
    <CompanyCardWithContext
      company={company}
      index={index}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      selectionMode={selectionMode}
      onSelect={handleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  );
}, arePropsEqual);

export default CompanyCardMemo;
