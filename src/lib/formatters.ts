/**
 * Converts a string to Title Case, handling special cases for Brazilian naming.
 * "PAC SANTA MÔNICA-PR" → "Pac Santa Mônica - PR"
 * "COOPERATIVA DE CRÉDITO" → "Cooperativa de Crédito"
 */
const LOWERCASE_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
]);

const UPPERCASE_WORDS = new Set([
  'PR', 'SP', 'RJ', 'MG', 'RS', 'SC', 'BA', 'CE', 'PE', 'GO', 'DF', 'ES', 'MA', 'PA',
  'PB', 'PI', 'RN', 'SE', 'AL', 'AM', 'AP', 'AC', 'RO', 'RR', 'TO', 'MT', 'MS',
  'PAC', 'SICOOB', 'SICREDI', 'CRESOL', 'UNICRED', 'CNPJ', 'CPF', 'LTDA', 'SA', 'ME', 'EPP',
]);

export function toTitleCase(str: string): string {
  if (!str) return str;
  
  // Strip leading numeric prefix like "05 - " for cleaner display
  const stripped = str.replace(/^\d+\s*[-–—]\s*/, '');
  let input = stripped || str;

  // Remove redundant city/state suffix after " - " (e.g. "PAC IPUA - IPUA/SP" → "PAC IPUA")
  // Pattern: " - CityName/UF" or " - CityName-UF" where it duplicates info
  const dashParts = input.split(/\s+[-–—]\s+/);
  if (dashParts.length === 2) {
    const suffix = dashParts[1].replace(/[\/\-]\s*[A-Za-z]{2}$/, '').trim().toLowerCase();
    const mainLower = dashParts[0].toLowerCase();
    // If the suffix is contained in the main name, it's redundant — strip it but keep the UF
    if (mainLower.includes(suffix) && suffix.length >= 3) {
      const ufMatch = dashParts[1].match(/[\/\-]\s*([A-Za-z]{2})$/);
      input = dashParts[0] + (ufMatch ? ' - ' + ufMatch[1].toUpperCase() : '');
    }
  }
  
  // Skip if string already looks well-formatted
  const words = input.split(/\s+/);
  const hasLongAllCapsWord = words.some(w => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w) && !UPPERCASE_WORDS.has(w));
  const isAllLower = input === input.toLowerCase();
  
  // Only transform if there are problematic patterns
  if (!hasLongAllCapsWord && !isAllLower) return input;

  return input
    .toLowerCase()
    .split(/(\s+|-+|\/+)/)
    .map((word, index) => {
      const upperWord = word.toUpperCase();
      
      // Keep separators as-is
      if (/^[\s\-\/]+$/.test(word)) return word;
      
      // Keep known uppercase words
      if (UPPERCASE_WORDS.has(upperWord)) return upperWord;
      
      // Keep state abbreviations (2-letter after separator)
      if (word.length === 2 && /^[a-z]{2}$/.test(word)) {
        const upper = word.toUpperCase();
        if (UPPERCASE_WORDS.has(upper)) return upper;
      }
      
      // Lowercase articles/prepositions (except first word)
      if (index > 0 && LOWERCASE_WORDS.has(word)) return word;
      
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

/**
 * Returns a color class based on a score (0-10 scale)
 */
export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (score <= 2) return { bg: 'bg-destructive', text: 'text-destructive-foreground', border: 'border-destructive/30', ring: 'ring-destructive/20' };
  if (score <= 4) return { bg: 'bg-warning', text: 'text-warning-foreground', border: 'border-warning/30', ring: 'ring-warning/20' };
  if (score <= 6) return { bg: 'bg-info', text: 'text-info-foreground', border: 'border-info/30', ring: 'ring-info/20' };
  if (score <= 8) return { bg: 'bg-success', text: 'text-success-foreground', border: 'border-success/30', ring: 'ring-success/20' };
  return { bg: 'bg-success', text: 'text-success-foreground', border: 'border-success/30', ring: 'ring-success/20' };
}

/**
 * Returns a score color for relationship scores (0-100)
 */
export function getRelationshipScoreColor(score: number): string {
  if (score <= 20) return 'text-destructive';
  if (score <= 40) return 'text-warning';
  if (score <= 60) return 'text-info';
  if (score <= 80) return 'text-success';
  return 'text-success';
}
