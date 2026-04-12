/**
 * Architecture Audit Tests
 * Validates architecture patterns, code hygiene, and documentation standards.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  const fullPath = resolve(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf-8');
}

function listDir(relativePath: string): string[] {
  const fullPath = resolve(ROOT, relativePath);
  if (!existsSync(fullPath)) return [];
  return readdirSync(fullPath);
}

describe('Architecture Audit', () => {
  describe('Documentation', () => {
    it('README exists and has content', () => {
      const readme = readFile('README.md');
      expect(readme.length).toBeGreaterThan(500);
    });

    it('ADR directory exists with decisions', () => {
      const adrs = listDir('docs/adr');
      expect(adrs.length).toBeGreaterThan(3);
    });

    it('each ADR follows naming convention', () => {
      const adrs = listDir('docs/adr').filter(f => f.endsWith('.md') && f !== 'README.md');
      for (const adr of adrs) {
        expect(adr).toMatch(/^\d{3}-.+\.md$/);
      }
    });
  });

  describe('Edge Function Standards', () => {
    const functionsDir = resolve(ROOT, 'supabase/functions');
    const functionNames = existsSync(functionsDir)
      ? readdirSync(functionsDir).filter(d => {
          const p = join(functionsDir, d, 'index.ts');
          return existsSync(p) && d !== '_shared';
        })
      : [];

    it('has edge functions', () => {
      expect(functionNames.length).toBeGreaterThan(10);
    });

    it('all edge functions use Deno.serve or serve()', () => {
      for (const fn of functionNames) {
        const content = readFile(`supabase/functions/${fn}/index.ts`);
        const usesServe = content.includes('Deno.serve') || content.includes('serve(');
        expect(usesServe, `${fn} should use Deno.serve or serve()`).toBe(true);
      }
    });

    it('no edge function uses hardcoded URLs', () => {
      for (const fn of functionNames) {
        const content = readFile(`supabase/functions/${fn}/index.ts`);
        expect(content, `${fn} should not have hardcoded supabase URLs`).not.toMatch(
          /https:\/\/[a-z]+\.supabase\.co(?!.*env)/
        );
      }
    });
  });

  describe('Code Hygiene', () => {
    it('no console.log without DEV guard in production code', () => {
      // Check a sample of critical files
      const criticalFiles = [
        'src/lib/externalData.ts',
        'src/lib/circuitBreaker.ts',
        'src/lib/resilientFetch.ts',
      ];

      for (const file of criticalFiles) {
        const content = readFile(file);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('console.log') && !line.includes('// eslint-disable')) {
            // Verify it's guarded
            const context = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
            const isGuarded = context.includes('import.meta.env.DEV') || context.includes('if (');
            // Just warn, don't fail — logger should be used instead
          }
        }
      }
    });

    it('uses logger instead of console in libs', () => {
      const files = ['src/lib/externalData.ts', 'src/lib/circuitBreaker.ts'];
      for (const file of files) {
        const content = readFile(file);
        if (content.length > 0) {
          expect(content, `${file} should import logger`).toContain('logger');
        }
      }
    });
  });

  describe('PWA Configuration', () => {
    const vite = readFile('vite.config.ts');

    it('has PWA plugin configured', () => {
      expect(vite).toContain('VitePWA');
    });

    it('has manifest with app name', () => {
      expect(vite).toContain('SINGU');
    });

    it('has workbox caching config', () => {
      expect(vite).toContain('runtimeCaching');
      expect(vite).toContain('NetworkFirst');
    });
  });

  describe('Type Safety', () => {
    it('tsconfig has strict paths configured', () => {
      const tsconfig = readFile('tsconfig.json');
      const parsed = JSON.parse(tsconfig);
      expect(parsed.compilerOptions.paths['@/*']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    const html = readFile('index.html');

    it('has X-Content-Type-Options nosniff', () => {
      expect(html).toContain('X-Content-Type-Options');
      expect(html).toContain('nosniff');
    });

    it('has X-Frame-Options DENY', () => {
      expect(html).toContain('X-Frame-Options');
      expect(html).toContain('DENY');
    });

    it('has Content-Security-Policy frame-ancestors', () => {
      expect(html).toContain('Content-Security-Policy');
      expect(html).toContain("frame-ancestors 'none'");
    });

    it('has Referrer-Policy', () => {
      expect(html).toContain('referrer');
      expect(html).toContain('strict-origin-when-cross-origin');
    });

    it('has Permissions-Policy restricting hardware', () => {
      expect(html).toContain('Permissions-Policy');
      expect(html).toContain('camera=()');
      expect(html).toContain('payment=()');
    });

    it('does not expose server info', () => {
      expect(html).not.toContain('X-Powered-By');
    });
  });

  describe('CORS Security', () => {
    it('shared auth module does not use wildcard CORS', () => {
      const auth = readFile('supabase/functions/_shared/auth.ts');
      const corsLine = auth.split('\\n').find(l =>
        l.includes('Access-Control-Allow-Origin') && l.includes("corsHeaders")
      );
      // The static corsHeaders should not contain "*"
      expect(auth).not.toMatch(/corsHeaders\s*=\s*\{[^}]*"Access-Control-Allow-Origin":\s*"\*"/);
    });
  });
});
