/**
 * Componente de Card de Contato otimizado com React.memo
 * Evita re-renders desnecessários em listas grandes
 */

import { memo, useCallback } from 'react';
import { ContactCardWithContext } from './ContactCardWithContext';
import type { Contact } from '@/hooks/useContacts';

interface ContactCardMemoProps {
  contact: Contact;
  companyName: string | null;
  lastInteraction: string | null;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  viewMode: 'grid' | 'list';
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
}

// Função de comparação customizada para evitar re-renders
function arePropsEqual(
  prevProps: ContactCardMemoProps,
  nextProps: ContactCardMemoProps
): boolean {
  // Comparar propriedades primitivas primeiro (mais rápido)
  if (
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isHighlighted !== nextProps.isHighlighted ||
    prevProps.selectionMode !== nextProps.selectionMode ||
    prevProps.viewMode !== nextProps.viewMode ||
    prevProps.index !== nextProps.index ||
    prevProps.companyName !== nextProps.companyName ||
    prevProps.lastInteraction !== nextProps.lastInteraction
  ) {
    return false;
  }

  // Comparar contact por referência e campos críticos
  if (prevProps.contact !== nextProps.contact) {
    // Se a referência mudou, verificar se os dados realmente mudaram
    const prevContact = prevProps.contact;
    const nextContact = nextProps.contact;
    
    if (
      prevContact.id !== nextContact.id ||
      prevContact.first_name !== nextContact.first_name ||
      prevContact.last_name !== nextContact.last_name ||
      prevContact.email !== nextContact.email ||
      prevContact.phone !== nextContact.phone ||
      prevContact.role !== nextContact.role ||
      prevContact.relationship_score !== nextContact.relationship_score ||
      prevContact.sentiment !== nextContact.sentiment ||
      prevContact.avatar_url !== nextContact.avatar_url ||
      prevContact.updated_at !== nextContact.updated_at
    ) {
      return false;
    }
  }

  // Callbacks são estáveis se usarem useCallback no componente pai
  // Não comparamos por referência para evitar re-renders desnecessários
  
  return true;
}

/**
 * ContactCardMemo - Versão otimizada do ContactCard com memoização
 * 
 * Uso:
 * - Em listas virtualizadas ou com muitos itens
 * - Quando re-renders frequentes impactam performance
 * 
 * A função arePropsEqual evita re-renders quando:
 * - Apenas callbacks mudam (mas dados são os mesmos)
 * - Dados do contato são idênticos (mesmo que referência seja diferente)
 */
export const ContactCardMemo = memo(function ContactCardMemo({
  contact,
  companyName,
  lastInteraction,
  index,
  isSelected,
  isHighlighted,
  selectionMode,
  viewMode,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
}: ContactCardMemoProps) {
  // Wrap callbacks para estabilizar referências
  const handleSelect = useCallback(
    (id: string, selected: boolean) => onSelect(id, selected),
    [onSelect]
  );

  const handleEdit = useCallback(
    (c: Contact) => onEdit(c),
    [onEdit]
  );

  const handleDelete = useCallback(
    (c: Contact) => onDelete(c),
    [onDelete]
  );

  const handleUpdate = useCallback(
    (id: string, data: Partial<Contact>) => onUpdate(id, data),
    [onUpdate]
  );

  return (
    <ContactCardWithContext
      contact={contact}
      companyName={companyName}
      lastInteraction={lastInteraction}
      index={index}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      selectionMode={selectionMode}
      viewMode={viewMode}
      onSelect={handleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  );
}, arePropsEqual);

export default ContactCardMemo;
