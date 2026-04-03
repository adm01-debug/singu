/**
 * Converts a string to Title Case, handling special cases for Brazilian naming.
 * "PAC SANTA MÔNICA-PR" → "Pac Santa Mônica - PR"
 * "COOPERATIVA DE CRÉDITO" → "Cooperativa de Crédito"
 * "Pac Guará - Guara/sp" → "Pac Guará - SP"
 */
const LOWERCASE_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
]);

const UPPERCASE_WORDS = new Set([
  'PR', 'SP', 'RJ', 'MG', 'RS', 'SC', 'BA', 'CE', 'PE', 'GO', 'DF', 'ES', 'MA', 'PA',
  'PB', 'PI', 'RN', 'SE', 'AL', 'AM', 'AP', 'AC', 'RO', 'RR', 'TO', 'MT', 'MS',
  'PAC', 'SICOOB', 'SICREDI', 'CRESOL', 'UNICRED', 'CNPJ', 'CPF', 'LTDA', 'SA', 'ME', 'EPP',
]);

/** Normalize to ASCII for comparison (strips accents) */
const normalizeForCompare = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function toTitleCase(str: string): string {
  if (!str) return str;
  
  // Strip leading numeric prefix like "05 - " for cleaner display
  const stripped = str.replace(/^\d+\s*[-–—]\s*/, '');
  let input = stripped || str;

  // Remove redundant city/state suffix after " - " (e.g. "PAC IPUA - IPUA/SP" → "PAC IPUA - SP")
  const dashParts = input.split(/\s+[-–—]\s+/);
  if (dashParts.length >= 2) {
    const lastPart = dashParts[dashParts.length - 1];
    const mainParts = dashParts.slice(0, -1).join(' - ');
    const suffix = normalizeForCompare(lastPart.replace(/[\/\-]\s*[A-Za-z]{2}$/, '').trim());
    const mainNorm = normalizeForCompare(mainParts);
    if (mainNorm.includes(suffix) && suffix.length >= 3) {
      const ufMatch = lastPart.match(/[\/\-]\s*([A-Za-z]{2})$/);
      const existingUf = mainParts.match(/\s*[-–—]\s*([A-Z]{2})$/);
      if (existingUf) {
        input = mainParts;
      } else {
        input = mainParts + (ufMatch ? ' - ' + ufMatch[1].toUpperCase() : '');
      }
    }
  }
  
  // ALWAYS normalize — convert to title case regardless of current casing
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
 * Format a contact display name, handling edge cases:
 * - "WhatsApp 5518991665844" → "(55) 18991-665844"
 * - Email-only → extract name from local part
 * - Empty / "Sem nome" → "Contato"
 */
export function formatContactName(firstName?: string | null, lastName?: string | null): string {
  const full = `${firstName || ''} ${lastName || ''}`.trim();
  
  if (!full || full === 'Sem nome') return 'Contato';
  
  // WhatsApp + phone number
  if (/^whatsapp\s+\d{8,}/i.test(full)) {
    const phone = full.replace(/^whatsapp\s+/i, '');
    return formatPhoneDisplay(phone);
  }
  
  // Pure phone number as name
  if (/^\+?\d{10,}$/.test(full.replace(/\s/g, ''))) {
    return formatPhoneDisplay(full.replace(/\s/g, ''));
  }
  
  // Email as name
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(full)) {
    const local = full.split('@')[0];
    return local
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  return full;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
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
