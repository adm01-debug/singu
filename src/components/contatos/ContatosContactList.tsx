import { List as VirtualList } from 'react-window';
import { UserPlus, Upload } from 'lucide-react';
import { ContactsGridSkeleton, ContactsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { ContactCardWithContext } from '@/components/contact-card/ContactCardWithContext';
import type { Contact, ContactUpdate } from '@/hooks/useContacts';

type ViewMode = 'grid' | 'list';

export interface ContatosContactListProps {
  loading: boolean;
  viewMode: ViewMode;
  contacts: Contact[];
  searchTerm: string;
  activeFilters: Record<string, string[]>;
  selectedIds: Set<string>;
  selectedIndex: number;
  selectionMode: boolean;
  getCompanyName: (companyId: string | null) => string | null;
  getLastInteractionDate: (contactId: string) => string | null;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: ContactUpdate) => Promise<Contact | null>;
  onOpenCreateForm: () => void;
  onClearSearch: () => void;
}

export const ContatosContactList = ({
  loading,
  viewMode,
  contacts,
  searchTerm,
  activeFilters,
  selectedIds,
  selectedIndex,
  selectionMode,
  getCompanyName,
  getLastInteractionDate,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  onOpenCreateForm,
  onClearSearch,
}: ContatosContactListProps) => {
  if (loading) {
    return viewMode === 'grid' ? <ContactsGridSkeleton /> : <ContactsListSkeleton />;
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact, index) => (
            <ContactCardWithContext
              key={contact.id}
              contact={contact}
              companyName={getCompanyName(contact.company_id)}
              lastInteraction={getLastInteractionDate(contact.id)}
              index={index}
              isSelected={selectedIds.has(contact.id)}
              isHighlighted={selectedIndex === index}
              selectionMode={selectionMode}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        contacts.length > 50 ? (
          <VirtualList
            rowCount={contacts.length}
            rowHeight={88}
            rowProps={{
              contacts,
              getCompanyName,
              getLastInteractionDate,
              selectedIds,
              selectedIndex,
              selectionMode,
              handleSelect: onSelect,
              setEditingContact: onEdit,
              setDeletingContact: onDelete,
              updateContact: onUpdate,
            }}
            style={{ height: Math.min(contacts.length * 88, 600) }}
            rowComponent={({ index, style, ...props }: { index: number; style: React.CSSProperties; [key: string]: unknown }) => {
              const contact = props.contacts[index];
              if (!contact) return null;
              return (
                <div style={style} className="pb-2">
                  <ContactCardWithContext
                    contact={contact}
                    companyName={props.getCompanyName(contact.company_id)}
                    lastInteraction={props.getLastInteractionDate(contact.id)}
                    index={index}
                    isSelected={props.selectedIds.has(contact.id)}
                    isHighlighted={props.selectedIndex === index}
                    selectionMode={props.selectionMode}
                    onSelect={props.handleSelect}
                    onEdit={props.setEditingContact}
                    onDelete={props.setDeletingContact}
                    onUpdate={props.updateContact}
                    viewMode="list"
                  />
                </div>
              );
            }}
          />
        ) : (
          <div className="space-y-2">
            {contacts.map((contact, index) => (
              <ContactCardWithContext
                key={contact.id}
                contact={contact}
                companyName={getCompanyName(contact.company_id)}
                lastInteraction={getLastInteractionDate(contact.id)}
                index={index}
                isSelected={selectedIds.has(contact.id)}
                isHighlighted={selectedIndex === index}
                selectionMode={selectionMode}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdate={onUpdate}
                viewMode="list"
              />
            ))}
          </div>
        )
      )}

      {contacts.length === 0 && !loading && (
        searchTerm || Object.keys(activeFilters).length > 0 ? (
          <SearchEmptyState
            searchTerm={searchTerm || 'filtros ativos'}
            onClearSearch={onClearSearch}
            entityName="contatos"
          />
        ) : (
          <EmptyState
            illustration="contacts"
            title="Sua rede de contatos começa aqui"
            description="Adicione seu primeiro contato para começar a gerenciar seus relacionamentos profissionais de forma inteligente."
            actions={[
              {
                label: 'Adicionar Contato',
                onClick: onOpenCreateForm,
                icon: UserPlus,
              },
              {
                label: 'Importar CSV',
                onClick: () => {},
                variant: 'outline',
                icon: Upload,
              },
            ]}
            tips={[
              'Adicione informações como cargo e empresa para contextualizar',
              'Use tags para organizar seus contatos por projeto ou área',
              'O perfil DISC ajuda a personalizar sua comunicação',
            ]}
          />
        )
      )}
    </>
  );
};
