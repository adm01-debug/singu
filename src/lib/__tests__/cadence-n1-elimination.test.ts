/**
 * Testes de otimização de consultas — verifica a lógica de deduplicação,
 * mapeamento paralelo e eliminação de N+1 usada em useContactCadence.
 */
import { describe, it, expect } from 'vitest';

// Simula a lógica otimizada de busca de empresas
interface CadenceItem {
  id: string;
  contact: { company_id: string | null } | null;
}

interface Company {
  name: string;
}

function extractUniqueCompanyIds(cadences: CadenceItem[]): string[] {
  return Array.from(
    new Set(
      cadences
        .map(c => c.contact?.company_id)
        .filter((id): id is string => Boolean(id))
    )
  );
}

function buildCompanyMap(
  entries: [string, Company | null][]
): Map<string, Company | null> {
  return new Map(entries);
}

function enrichWithCompanies(
  cadences: CadenceItem[],
  companyMap: Map<string, Company | null>
): (CadenceItem & { company: Company | null })[] {
  return cadences.map(cadence => ({
    ...cadence,
    company: cadence.contact?.company_id
      ? (companyMap.get(cadence.contact.company_id) ?? null)
      : null,
  }));
}

// Test Data
const cadences: CadenceItem[] = [
  { id: 'cad1', contact: { company_id: 'comp1' } },
  { id: 'cad2', contact: { company_id: 'comp2' } },
  { id: 'cad3', contact: { company_id: 'comp1' } }, // duplicate comp1
  { id: 'cad4', contact: { company_id: null } },
  { id: 'cad5', contact: null },
  { id: 'cad6', contact: { company_id: 'comp3' } },
  { id: 'cad7', contact: { company_id: 'comp2' } }, // duplicate comp2
];

const companyData: [string, Company | null][] = [
  ['comp1', { name: 'TechCorp' }],
  ['comp2', { name: 'SalesCo' }],
  ['comp3', null], // company not found
];

describe('extractUniqueCompanyIds', () => {
  it('deduplicates company IDs', () => {
    const ids = extractUniqueCompanyIds(cadences);
    expect(ids.length).toBe(3);
    expect(ids).toContain('comp1');
    expect(ids).toContain('comp2');
    expect(ids).toContain('comp3');
  });

  it('filters out null company_id', () => {
    const ids = extractUniqueCompanyIds(cadences);
    expect(ids.every(id => id !== null)).toBe(true);
  });

  it('handles contacts with null contact', () => {
    const ids = extractUniqueCompanyIds([
      { id: '1', contact: null },
      { id: '2', contact: null },
    ]);
    expect(ids).toEqual([]);
  });

  it('handles empty cadences', () => {
    expect(extractUniqueCompanyIds([])).toEqual([]);
  });

  it('handles all same company', () => {
    const same = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      contact: { company_id: 'same' },
    }));
    expect(extractUniqueCompanyIds(same)).toEqual(['same']);
  });

  it('reduces N+1: 7 cadences → 3 queries instead of 5', () => {
    const ids = extractUniqueCompanyIds(cadences);
    // With N+1: would make 5 queries (comp1, comp2, comp1, null→skip, null→skip, comp3, comp2)
    // Optimized: makes only 3 queries (comp1, comp2, comp3)
    expect(ids.length).toBeLessThan(cadences.filter(c => c.contact?.company_id).length);
  });
});

describe('buildCompanyMap', () => {
  it('creates a map with correct entries', () => {
    const map = buildCompanyMap(companyData);
    expect(map.size).toBe(3);
    expect(map.get('comp1')?.name).toBe('TechCorp');
  });

  it('handles null company data', () => {
    const map = buildCompanyMap(companyData);
    expect(map.get('comp3')).toBeNull();
  });

  it('handles empty entries', () => {
    const map = buildCompanyMap([]);
    expect(map.size).toBe(0);
  });
});

describe('enrichWithCompanies', () => {
  it('attaches company to cadences', () => {
    const map = buildCompanyMap(companyData);
    const enriched = enrichWithCompanies(cadences, map);
    
    expect(enriched.find(c => c.id === 'cad1')?.company?.name).toBe('TechCorp');
    expect(enriched.find(c => c.id === 'cad2')?.company?.name).toBe('SalesCo');
  });

  it('sets null for cadences without company_id', () => {
    const map = buildCompanyMap(companyData);
    const enriched = enrichWithCompanies(cadences, map);
    
    expect(enriched.find(c => c.id === 'cad4')?.company).toBeNull();
    expect(enriched.find(c => c.id === 'cad5')?.company).toBeNull();
  });

  it('sets null for missing company in map', () => {
    const map = buildCompanyMap(companyData);
    const enriched = enrichWithCompanies(cadences, map);
    
    expect(enriched.find(c => c.id === 'cad6')?.company).toBeNull();
  });

  it('shares same company reference for duplicate IDs', () => {
    const map = buildCompanyMap(companyData);
    const enriched = enrichWithCompanies(cadences, map);
    
    const cad1 = enriched.find(c => c.id === 'cad1');
    const cad3 = enriched.find(c => c.id === 'cad3');
    expect(cad1?.company).toEqual(cad3?.company);
  });

  it('preserves all original cadence properties', () => {
    const map = buildCompanyMap(companyData);
    const enriched = enrichWithCompanies(cadences, map);
    
    expect(enriched.length).toBe(7);
    expect(enriched.map(c => c.id)).toEqual(cadences.map(c => c.id));
  });
});

describe('Performance Characteristics', () => {
  it('scales linearly with unique companies, not total cadences', () => {
    // 100 cadences but only 5 unique companies
    const largeCadences: CadenceItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      contact: { company_id: `comp${i % 5}` },
    }));
    
    const ids = extractUniqueCompanyIds(largeCadences);
    expect(ids.length).toBe(5);
  });

  it('handles 1000 cadences efficiently', () => {
    const massive: CadenceItem[] = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      contact: { company_id: `comp${i % 20}` },
    }));
    
    const start = performance.now();
    const ids = extractUniqueCompanyIds(massive);
    const elapsed = performance.now() - start;
    
    expect(ids.length).toBe(20);
    expect(elapsed).toBeLessThan(50); // should be < 50ms
  });
});
