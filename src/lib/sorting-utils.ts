/**
 * Type-safe sorting utilities for tables and lists
 */

/**
 * Gets a value from an object safely for sorting, returning a default for null/undefined
 */
export function getSortValue<T>(
  item: T, 
  key: keyof T, 
  defaultValue: string | number = ''
): string | number {
  const val = item[key];
  
  if (val === null || val === undefined) {
    return defaultValue;
  }
  
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return val;
  
  // For other types, convert to string
  return String(val);
}

/**
 * Compare two values for sorting
 */
export function compareValues(
  aVal: string | number,
  bVal: string | number,
  sortOrder: 'asc' | 'desc'
): number {
  // Numeric comparison
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  }
  
  // String comparison
  const strA = String(aVal);
  const strB = String(bVal);
  const comparison = strA.localeCompare(strB, 'pt-BR');
  return sortOrder === 'asc' ? comparison : -comparison;
}

/**
 * Compare dates for sorting
 */
export function compareDates(
  aVal: string | Date | null | undefined,
  bVal: string | Date | null | undefined,
  sortOrder: 'asc' | 'desc'
): number {
  const dateA = aVal ? new Date(aVal).getTime() : 0;
  const dateB = bVal ? new Date(bVal).getTime() : 0;
  return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
}

/**
 * Generic sort function for arrays
 */
export function sortArray<T>(
  items: T[],
  sortBy: keyof T,
  sortOrder: 'asc' | 'desc',
  options?: {
    dateFields?: (keyof T)[];
    numericFields?: (keyof T)[];
  }
): T[] {
  const { dateFields = [], numericFields = [] } = options || {};
  
  return [...items].sort((a, b) => {
    const aVal = getSortValue(a, sortBy);
    const bVal = getSortValue(b, sortBy);
    
    // Date comparison
    if (dateFields.includes(sortBy)) {
      return compareDates(aVal as string, bVal as string, sortOrder);
    }
    
    // Numeric comparison
    if (numericFields.includes(sortBy)) {
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }
    
    // Default comparison
    return compareValues(aVal, bVal, sortOrder);
  });
}
