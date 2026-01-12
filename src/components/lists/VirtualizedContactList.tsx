import { memo, useCallback, useRef, useEffect } from 'react';
// @ts-ignore - react-window types
import { FixedSizeList as List, FixedSizeGrid as Grid } from 'react-window';
import { ContactCardWithContext } from '@/components/contact-card/ContactCardWithContext';
import type { Contact } from '@/hooks/useContacts';

interface VirtualizedContactListProps {
  contacts: Contact[];
  viewMode: 'grid' | 'list';
  selectedIds: Set<string>;
  selectionMode: boolean;
  selectedIndex: number;
  getCompanyName: (companyId: string | null) => string | null;
  getLastInteractionDate: (contactId: string) => string | null;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  containerHeight?: number;
}

// Memoized row component for list view
const ContactRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: VirtualizedContactListProps;
}) => {
  const contact = data.contacts[index];
  if (!contact) return null;

  return (
    <div style={style} className="px-1 py-1">
      <ContactCardWithContext
        contact={contact}
        companyName={data.getCompanyName(contact.company_id)}
        lastInteraction={data.getLastInteractionDate(contact.id)}
        index={index}
        isSelected={data.selectedIds.has(contact.id)}
        isHighlighted={data.selectedIndex === index}
        selectionMode={data.selectionMode}
        onSelect={data.onSelect}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
        onUpdate={data.onUpdate}
        viewMode="list"
      />
    </div>
  );
});
ContactRow.displayName = 'ContactRow';

// Memoized cell component for grid view
const ContactCell = memo(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: { 
  columnIndex: number; 
  rowIndex: number; 
  style: React.CSSProperties; 
  data: VirtualizedContactListProps & { columnCount: number };
}) => {
  const index = rowIndex * data.columnCount + columnIndex;
  const contact = data.contacts[index];
  if (!contact) return <div style={style} />;

  return (
    <div style={style} className="p-2">
      <ContactCardWithContext
        contact={contact}
        companyName={data.getCompanyName(contact.company_id)}
        lastInteraction={data.getLastInteractionDate(contact.id)}
        index={index}
        isSelected={data.selectedIds.has(contact.id)}
        isHighlighted={data.selectedIndex === index}
        selectionMode={data.selectionMode}
        onSelect={data.onSelect}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
        onUpdate={data.onUpdate}
        viewMode="grid"
      />
    </div>
  );
});
ContactCell.displayName = 'ContactCell';

export function VirtualizedContactList({
  contacts,
  viewMode,
  selectedIds,
  selectionMode,
  selectedIndex,
  getCompanyName,
  getLastInteractionDate,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  containerHeight = 600,
}: VirtualizedContactListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const gridRef = useRef<Grid>(null);

  // Calculate responsive column count
  const getColumnCount = useCallback(() => {
    if (!containerRef.current) return 3;
    const width = containerRef.current.offsetWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
  }, []);

  // Scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0) {
      if (viewMode === 'list' && listRef.current) {
        (listRef.current as any).scrollToItem(selectedIndex, 'smart');
      } else if (viewMode === 'grid' && gridRef.current) {
        const columnCount = getColumnCount();
        const rowIndex = Math.floor(selectedIndex / columnCount);
        (gridRef.current as any).scrollToItem({ rowIndex, columnIndex: 0, align: 'smart' });
      }
    }
  }, [selectedIndex, viewMode, getColumnCount]);

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(contacts.length / columnCount);

  const itemData = {
    contacts,
    selectedIds,
    selectionMode,
    selectedIndex,
    getCompanyName,
    getLastInteractionDate,
    onSelect,
    onEdit,
    onDelete,
    onUpdate,
    columnCount,
  };

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full"
      role="list"
      aria-label={`Lista de ${contacts.length} contatos`}
    >
      {viewMode === 'list' ? (
        <List
          ref={listRef}
          height={containerHeight}
          itemCount={contacts.length}
          itemSize={88}
          width="100%"
          itemData={itemData}
          overscanCount={5}
          className="scrollbar-thin"
        >
          {ContactRow}
        </List>
      ) : (
        <Grid
          ref={gridRef}
          columnCount={columnCount}
          columnWidth={containerRef.current ? containerRef.current.offsetWidth / columnCount : 350}
          height={containerHeight}
          rowCount={rowCount}
          rowHeight={260}
          width="100%"
          itemData={itemData}
          overscanRowCount={2}
          className="scrollbar-thin"
        >
          {ContactCell}
        </Grid>
      )}
    </div>
  );
}

export default VirtualizedContactList;
