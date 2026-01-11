import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronUp, ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// RESPONSIVE TABLE SYSTEM - Pilar 8.1
// ============================================

const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "",
        striped: "[&_tbody_tr:nth-child(odd)]:bg-muted/30",
        bordered: "[&_td]:border [&_th]:border",
        compact: "[&_td]:py-2 [&_td]:px-2 [&_th]:py-2 [&_th]:px-2",
      },
      responsive: {
        stack: "md:table",
        scroll: "block overflow-x-auto",
        cards: "md:table",
      }
    },
    defaultVariants: {
      variant: "default",
      responsive: "stack",
    }
  }
);

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {
  stickyHeader?: boolean;
}

const ResponsiveTable = React.forwardRef<HTMLTableElement, ResponsiveTableProps>(
  ({ className, variant, responsive, stickyHeader, ...props }, ref) => (
    <div className={cn(
      "relative w-full",
      responsive === "scroll" && "overflow-x-auto"
    )}>
      <table 
        ref={ref} 
        className={cn(tableVariants({ variant, responsive }), className)} 
        {...props} 
      />
    </div>
  ),
);
ResponsiveTable.displayName = "ResponsiveTable";

// Sortable Header
interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableHeaderProps>(
  ({ className, sortKey, currentSort, onSort, children, ...props }, ref) => {
    const isActive = currentSort?.key === sortKey;
    const direction = isActive ? currentSort.direction : null;

    return (
      <th
        ref={ref}
        className={cn(
          "h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none",
          "transition-colors hover:bg-muted/50",
          "[&:has([role=checkbox])]:pr-0",
          isActive && "text-foreground bg-muted/30",
          className,
        )}
        onClick={() => onSort?.(sortKey)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          <span className="inline-flex">
            {!isActive && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            {direction === 'asc' && <ChevronUp className="h-4 w-4" />}
            {direction === 'desc' && <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </th>
    );
  },
);
SortableTableHead.displayName = "SortableTableHead";

// Mobile Card Row - transforms table row to card on mobile
interface MobileCardRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  columns: { key: string; label: string; }[];
  data: Record<string, React.ReactNode>;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MobileCardRow = React.forwardRef<HTMLTableRowElement, MobileCardRowProps>(
  ({ className, columns, data, onView, onEdit, onDelete, ...props }, ref) => (
    <>
      {/* Desktop Row */}
      <tr
        ref={ref}
        className={cn(
          "hidden md:table-row border-b transition-colors",
          "hover:bg-row-hover data-[state=selected]:bg-row-selected",
          className
        )}
        {...props}
      >
        {columns.map((col) => (
          <td key={col.key} className="p-4 align-middle">
            {data[col.key]}
          </td>
        ))}
        {(onView || onEdit || onDelete) && (
          <td className="p-4 align-middle">
            <RowActions onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </td>
        )}
      </tr>

      {/* Mobile Card */}
      <tr className="md:hidden border-b">
        <td colSpan={columns.length + 1} className="p-0">
          <motion.div
            className="p-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-4">
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  {col.label}
                </span>
                <span className="text-sm text-right">
                  {data[col.key]}
                </span>
              </div>
            ))}
            {(onView || onEdit || onDelete) && (
              <div className="flex justify-end gap-2 pt-2 border-t">
                {onView && (
                  <Button size="sm" variant="ghost" onClick={onView}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
                {onEdit && (
                  <Button size="sm" variant="ghost" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </td>
      </tr>
    </>
  ),
);
MobileCardRow.displayName = "MobileCardRow";

// Row Actions Dropdown
interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function RowActions({ onView, onEdit, onDelete }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Expandable Row
interface ExpandableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  expandedContent: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableRow = React.forwardRef<HTMLTableRowElement, ExpandableRowProps>(
  ({ className, children, expandedContent, defaultExpanded = false, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
      <>
        <tr
          ref={ref}
          className={cn(
            "border-b transition-colors cursor-pointer",
            "hover:bg-row-hover",
            isExpanded && "bg-row-selected",
            className
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          {...props}
        >
          <td className="p-2 w-10">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </td>
          {children}
        </tr>
        <AnimatePresence>
          {isExpanded && (
            <tr>
              <td colSpan={100} className="p-0">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-muted/20"
                >
                  <div className="p-4">
                    {expandedContent}
                  </div>
                </motion.div>
              </td>
            </tr>
          )}
        </AnimatePresence>
      </>
    );
  },
);
ExpandableRow.displayName = "ExpandableRow";

// Table with Selection
interface SelectableTableProps {
  children: React.ReactNode;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

function SelectableTable({ children, selectedIds, onSelectionChange }: SelectableTableProps) {
  const selectAll = () => {
    // Implementation would depend on row IDs
  };

  const clearSelection = () => {
    onSelectionChange(new Set());
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center justify-between z-10"
          >
            <span className="text-sm font-medium">
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={clearSelection}>
                Limpar seleção
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

// Sticky Column Table
const StickyColumnTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative overflow-x-auto">
      <table 
        ref={ref} 
        className={cn(
          "w-full caption-bottom text-sm",
          "[&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-10 [&_th:first-child]:bg-background",
          "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-background",
          "[&_th:first-child]:after:absolute [&_th:first-child]:after:right-0 [&_th:first-child]:after:top-0 [&_th:first-child]:after:h-full [&_th:first-child]:after:w-px [&_th:first-child]:after:bg-border",
          "[&_td:first-child]:after:absolute [&_td:first-child]:after:right-0 [&_td:first-child]:after:top-0 [&_td:first-child]:after:h-full [&_td:first-child]:after:w-px [&_td:first-child]:after:bg-border",
          className
        )} 
        {...props} 
      />
    </div>
  ),
);
StickyColumnTable.displayName = "StickyColumnTable";

// Virtual Table for large datasets (placeholder for virtualization)
interface VirtualTableProps {
  data: unknown[];
  rowHeight: number;
  containerHeight: number;
  renderRow: (item: unknown, index: number) => React.ReactNode;
}

function VirtualTable({ data, rowHeight, containerHeight, renderRow }: VirtualTableProps) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / rowHeight) + 1,
    data.length
  );
  
  const visibleItems = data.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: data.length * rowHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => renderRow(item, startIndex + index))}
        </div>
      </div>
    </div>
  );
}

// Table Empty State
interface TableEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function TableEmptyState({ icon, title, description, action }: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={100}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
          {icon && (
            <div className="mb-4 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
          )}
          {action}
        </motion.div>
      </td>
    </tr>
  );
}

// Loading Table Rows
function TableLoadingRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export {
  ResponsiveTable,
  SortableTableHead,
  MobileCardRow,
  RowActions,
  ExpandableRow,
  SelectableTable,
  StickyColumnTable,
  VirtualTable,
  TableEmptyState,
  TableLoadingRows,
};
