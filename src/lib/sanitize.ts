import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML user-generated para prevenir XSS.
 * Usa DOMPurify com configuração restritiva por padrão.
 */
export function sanitizeHtml(dirty: string, options?: Record<string, unknown>): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    RETURN_TRUSTED_TYPE: false,
    ...options,
  }) as string;
}

/**
 * Sanitiza texto puro removendo qualquer HTML.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}

/**
 * Sanitiza URL para prevenir javascript: e data: protocols.
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim();
  if (/^(javascript|data|vbscript):/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}
