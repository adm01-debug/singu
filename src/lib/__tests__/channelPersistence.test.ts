import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  readAppliedCanais,
  writeAppliedCanais,
  clearAppliedCanais,
} from '@/lib/channelPersistence';

const KEY = 'channel-applied-canais';

describe('channelPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('writeAppliedCanais([]) remove a chave', () => {
    localStorage.setItem(KEY, JSON.stringify({ canais: ['email'], ts: Date.now() }));
    writeAppliedCanais([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('writeAppliedCanais salva valores válidos com timestamp', () => {
    writeAppliedCanais(['email', 'whatsapp']);
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.canais).toEqual(['email', 'whatsapp']);
    expect(typeof parsed.ts).toBe('number');
  });

  it('writeAppliedCanais filtra valores inválidos antes de gravar', () => {
    writeAppliedCanais(['email', 'garbage', 'note']);
    const parsed = JSON.parse(localStorage.getItem(KEY)!);
    expect(parsed.canais).toEqual(['email', 'note']);
  });

  it('writeAppliedCanais remove chave se só houver lixo', () => {
    localStorage.setItem(KEY, JSON.stringify({ canais: ['email'], ts: Date.now() }));
    writeAppliedCanais(['garbage', 'foo']);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('readAppliedCanais filtra valores inválidos na leitura', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ canais: ['email', 'garbage'], ts: Date.now() })
    );
    expect(readAppliedCanais()).toEqual(['email']);
  });

  it('readAppliedCanais retorna null e limpa após TTL expirado', () => {
    const oldTs = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem(KEY, JSON.stringify({ canais: ['email'], ts: oldTs }));
    expect(readAppliedCanais()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('readAppliedCanais retorna null se chave não existe', () => {
    expect(readAppliedCanais()).toBeNull();
  });

  it('readAppliedCanais retorna null para JSON corrompido', () => {
    localStorage.setItem(KEY, '{not valid json');
    expect(readAppliedCanais()).toBeNull();
  });

  it('readAppliedCanais retorna null para shape inválido', () => {
    localStorage.setItem(KEY, JSON.stringify({ foo: 'bar' }));
    expect(readAppliedCanais()).toBeNull();
  });

  it('clearAppliedCanais remove a chave', () => {
    localStorage.setItem(KEY, JSON.stringify({ canais: ['email'], ts: Date.now() }));
    clearAppliedCanais();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
