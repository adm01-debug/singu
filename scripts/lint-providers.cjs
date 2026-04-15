#!/usr/bin/env node

/**
 * Script de lint para validar a ordem dos providers em App.tsx.
 * Uso: node scripts/lint-providers.js
 * 
 * Pode ser integrado a pre-commit hooks via husky/lint-staged.
 */

const fs = require('fs');
const path = require('path');

const APP_FILE = path.resolve(__dirname, '..', 'src', 'App.tsx');

const REQUIRED_ORDER = [
  'HelmetProvider',
  'ErrorBoundary',
  'QueryClientProvider',
  'BrowserRouter',
  'AuthProvider',
  'NavigationStackProvider',
];

const DEPENDENCIES = {
  AuthProvider: ['BrowserRouter', 'QueryClientProvider'],
  NavigationStackProvider: ['BrowserRouter'],
  EasterEggsProvider: ['AuthProvider'],
};

function main() {
  if (!fs.existsSync(APP_FILE)) {
    console.error('❌ App.tsx não encontrado em', APP_FILE);
    process.exit(1);
  }

  const content = fs.readFileSync(APP_FILE, 'utf-8');

  // Extract provider tags from JSX (simplified regex)
  const providerRegex = /<(HelmetProvider|ErrorBoundary|QueryClientProvider|CelebrationProvider|AriaLiveProvider|TooltipProvider|BrowserRouter|AuthProvider|NavigationStackProvider|EasterEggsProvider)\b/g;

  const found = [];
  let match;
  while ((match = providerRegex.exec(content)) !== null) {
    const name = match[1];
    if (!found.includes(name)) {
      found.push(name);
    }
  }

  let hasError = false;

  // Validate dependencies
  for (const [provider, deps] of Object.entries(DEPENDENCIES)) {
    const providerIndex = found.indexOf(provider);
    if (providerIndex === -1) continue;

    for (const dep of deps) {
      const depIndex = found.indexOf(dep);
      if (depIndex === -1 || depIndex > providerIndex) {
        console.error(`❌ ${provider} requer ${dep} como provider pai, mas ${dep} ${depIndex === -1 ? 'não foi encontrado' : 'aparece depois'}.`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error('\n🚨 Ordem de providers inválida em App.tsx!');
    console.error('Ordem esperada:', REQUIRED_ORDER.join(' → '));
    process.exit(1);
  }

  console.log('✅ Ordem de providers em App.tsx está correta.');
}

main();
