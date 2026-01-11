// Security utilities for input sanitization and rate limiting

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
  
  return sanitized;
}

/**
 * Sanitize input for safe display (escapes HTML)
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return input.replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters except + and spaces
  return phone.replace(/[^\d+\s()-]/g, '').trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    // If it doesn't start with protocol, try adding https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return sanitizeUrl(`https://${url}`);
    }
    return '';
  }
}

/**
 * Rate limiter for client-side actions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, timeUntilReset);
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  clear(): void {
    this.attempts.clear();
  }
}

// Create singleton rate limiters for common actions
export const formSubmitLimiter = new RateLimiter(5, 60000); // 5 per minute
export const searchLimiter = new RateLimiter(30, 60000); // 30 per minute
export const apiCallLimiter = new RateLimiter(100, 60000); // 100 per minute

/**
 * Hook for rate limiting
 */
import { useState, useCallback } from 'react';

interface UseRateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  key?: string;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const { maxAttempts = 5, windowMs = 60000, key = 'default' } = options;
  const [limiter] = useState(() => new RateLimiter(maxAttempts, windowMs));
  const [isLimited, setIsLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const checkLimit = useCallback((): boolean => {
    const allowed = limiter.isAllowed(key);
    setIsLimited(!allowed);
    
    if (!allowed) {
      setRemainingTime(limiter.getRemainingTime(key));
    }
    
    return allowed;
  }, [limiter, key]);

  const reset = useCallback(() => {
    limiter.reset(key);
    setIsLimited(false);
    setRemainingTime(0);
  }, [limiter, key]);

  return {
    isLimited,
    remainingTime,
    checkLimit,
    reset,
  };
}

/**
 * Validate form data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateFormData(
  data: Record<string, unknown>,
  rules: Record<string, {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  }>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    // Required check
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'Campo obrigatório';
      continue;
    }
    
    // Skip other validations if empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    const strValue = String(value);
    
    // Min length
    if (fieldRules.minLength && strValue.length < fieldRules.minLength) {
      errors[field] = `Mínimo ${fieldRules.minLength} caracteres`;
      continue;
    }
    
    // Max length
    if (fieldRules.maxLength && strValue.length > fieldRules.maxLength) {
      errors[field] = `Máximo ${fieldRules.maxLength} caracteres`;
      continue;
    }
    
    // Pattern
    if (fieldRules.pattern && !fieldRules.pattern.test(strValue)) {
      errors[field] = 'Formato inválido';
      continue;
    }
    
    // Custom validation
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
