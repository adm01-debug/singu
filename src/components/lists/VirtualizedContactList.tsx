import { memo, useCallback, useRef, useEffect, CSSProperties, ReactElement } from 'react';
import { List, Grid, ListImperativeAPI, GridImperativeAPI } from 'react-window';
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

interface RowPropsData {
  contacts: Contact[];
  selectedIds: Set<string>;
  selectionMode: boolean;
  selectedIndex: number;
  getCompanyName: (companyId: string | null) => string | null;
  getLastInteractionDate: (contactId: string) => string | null;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
}

interface CellPropsData extends RowPropsData {
  columnCount: number;
}

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
  const listRef = useRef<ListImperativeAPI>(null);
  const gridRef = useRef<GridImperativeAPI>(null);

  const getColumnCount = useCallback(() => {
    if (!containerRef.current) return 3;
    const width = containerRef.current.offsetWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0) {
      if (viewMode === 'list' && listRef.current) {
        listRef.current.scrollToRow({ index: selectedIndex, align: 'smart' });
      } else if (viewMode === 'grid' && gridRef.current) {
        const columnCount = getColumnCount();
        const rowIndex = Math.floor(selectedIndex / columnCount);
        gridRef.current.scrollToRow({ index: rowIndex, align: 'smart' });
      }
    }
  }, [selectedIndex, viewMode, getColumnCount]);

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(contacts.length / columnCount);

  const rowPropsData: RowPropsData = {
    contacts, selectedIds, selectionMode, selectedIndex,
    getCompanyName, getLastInteractionDate, onSelect, onEdit, onDelete, onUpdate,
  };

  const cellPropsData: CellPropsData = { ...rowPropsData, columnCount };

  if (contacts.length === 0) return null;

  // Row renderer for List
  const RowComponent = ({ index, style, ...data }: { index: number; style: CSSProperties } & RowPropsData): ReactElement | null => {
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
  };

  // Cell renderer for Grid
  const CellComponent = ({ columnIndex, rowIndex, style, columnCount: colCount, ...data }: { columnIndex: number; rowIndex: number; style: CSSProperties } & CellPropsData): ReactElement | null => {
    const idx = rowIndex * colCount + columnIndex;
    const contact = data.contacts[idx];
    if (!contact) return <div style={style} />;
    return (
      <div style={style} className="p-2">
        <ContactCardWithContext
          contact={contact}
          companyName={data.getCompanyName(contact.company_id)}
          lastInteraction={data.getLastInteractionDate(contact.id)}
          index={idx}
          isSelected={data.selectedIds.has(contact.id)}
          isHighlighted={data.selectedIndex === idx}
          selectionMode={data.selectionMode}
          onSelect={data.onSelect}
          onEdit={data.onEdit}
          onDelete={data.onDelete}
          onUpdate={data.onUpdate}
          viewMode="grid"
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full" role="list" aria-label={`Lista de ${contacts.length} contatos`}>
      {viewMode === 'list' ? (
        <List
          listRef={listRef}
          rowComponent={RowComponent}
          rowProps={rowPropsData}
          rowCount={contacts.length}
          rowHeight={88}
          style={{ height: containerHeight, width: '100%' }}
          overscanCount={5}
          className="scrollbar-thin"
        />
      ) : (
        <Grid
          gridRef={gridRef}
          cellComponent={CellComponent}
          cellProps={cellPropsData}
          columnCount={columnCount}
          columnWidth={containerRef.current ? containerRef.current.offsetWidth / columnCount : 350}
          rowCount={rowCount}
          rowHeight={260}
          style={{ height: containerHeight, width: '100%' }}
          overscanCount={2}
          className="scrollbar-thin"
        />
      )}
    </div>
  );
}

export default VirtualizedContactList;
