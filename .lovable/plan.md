
# Plano: Modo de Testes (sandbox de cenários) na Ficha 360

## Contexto

`computeProntidaoScore` é puro e já depende só de `profile` + `intelligence` + `weights`. Hoje não há jeito de validar visualmente "se eu mudar o sentimento para negativo, o score cai e a recomendação muda?" sem editar dados reais. Vamos adicionar um **modo simulação** que injeta um `profile`/`intelligence` sintético no recálculo, sem tocar no banco.

## Decisão de escopo

- **Local**: client-side puro, ativado por toggle. Persiste em `sessionStorage` (não polui sessões futuras nem outros contatos).
- **Reaproveita**: `computeProntidaoScore`, `computeProntidaoTrend`, `ScoreProntidaoCard`, `ProntidaoTrendChart` — todos já recalculam ao vivo via `useMemo`.
- **Não afeta**: dados reais, edge functions, `ProximaAcaoCTA` (continua usando contato real — a IA não deve ser alimentada com cenário fake).
- **Indicador**: quando ativo, banner amarelo no topo + badge "Simulação" nos cards afetados.

## Implementação

### 1. Novo store: `src/stores/useSimulationStore.ts` (~70 linhas)

```ts
interface SimulationOverrides {
  cadence_days: number | null;
  last_contact_at_days_ago: number | null; // mais legível que ISO
  sentiment: 'positivo' | 'neutro' | 'misto' | 'negativo' | null;
  best_channel: string | null;
  best_time: string | null;
}
interface State {
  enabled: boolean;
  overrides: SimulationOverrides;
  presetName: string | null;
  setEnabled(v: boolean): void;
  setOverride<K extends keyof SimulationOverrides>(k: K, v: SimulationOverrides[K]): void;
  applyPreset(name: string, o: SimulationOverrides): void;
  reset(): void;
}
```

- Zustand com `persist` + `createJSONStorage(() => sessionStorage)` (chave `singu-prontidao-sim`).
- Default: `enabled=false`, todos overrides `null`.

### 2. Novo helper: `src/lib/prontidaoSimulation.ts` (~50 linhas)

- `applySimulation(profile, intelligence, overrides)` retorna `{ profile, intelligence }` mesclados:
  - `cadence_days`: override quando não-null
  - `last_contact_at`: ISO calculado a partir de `Date.now() - daysAgo*86400000`
  - `sentiment` em `profile`
  - `best_channel`/`best_time` em `intelligence`
- Cenários presets exportados:
  - **"Sentimento negativo"**: `sentiment='negativo'`
  - **"Sem cadência"**: `cadence_days=null` + `last_contact_at_days_ago=null`
  - **"Última interação antiga"**: `last_contact_at_days_ago=90`
  - **"Atrasado vs cadência"**: `cadence_days=7`, `last_contact_at_days_ago=21`
  - **"Tudo verde"**: `cadence_days=7`, `daysAgo=2`, `sentiment='positivo'`, `best_channel='WhatsApp'`, `best_time='manhã'`
  - **"Sem canal preferido"**: `best_channel=null`, `best_time=null`

### 3. Novo componente: `src/components/ficha-360/SimulationModePanel.tsx` (~220 linhas)

Card colapsável (variant `outlined`, header com ícone `FlaskConical` + Switch "Modo de testes"):

- **Header**: Switch para ligar/desligar + botão `Restaurar`.
- **Quando ativo**:
  - Linha de **presets** (chips clicáveis): 6 presets do helper.
  - Grid 2 colunas com controles:
    - **Sentimento**: `Select` (positivo/neutro/misto/negativo/sem dado).
    - **Cadência (dias)**: `Input` numérico + checkbox "sem cadência".
    - **Última interação (dias atrás)**: `Slider` 0–180 + label "Há X dias" / "Sem registro".
    - **Canal preferido**: `Input` texto (ou null).
    - **Melhor horário**: `Input` texto (ou null).
  - Rodapé: badge "Score simulado: X (era Y)" comparando com cálculo real, e indicação do preset ativo.
- Tudo PT-BR, tokens semânticos, flat, `React.memo`.

### 4. Integração: `src/pages/Ficha360.tsx`

- Importar `useSimulationStore`, `applySimulation`, `SimulationModePanel`.
- Calcular **dois** profiles/intel: `realProfile/realIntel` (originais) e `effectiveProfile/effectiveIntel` (com simulação aplicada se `enabled`).
- Substituir as entradas de `computeProntidaoScore`, `computeProntidaoTrend` e `computeProximosPassos` pelas versões `effective*`.
- Manter `ProximaAcaoCTA` consumindo o contato real (não recebe simulação — IA usa dados reais do CRM).
- Inserir `<SimulationModePanel realProfile={profile} realIntel={intelligence} realScore={realProntidao.score} simulatedScore={prontidao.score} />` **logo após** `PageHeader` e antes do header sticky, para destaque.
- Quando `enabled`, adicionar **banner sticky no topo**: `<div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground flex items-center gap-2"><FlaskConical /> Modo de testes ativo — score e recomendações refletem cenário simulado, não os dados reais.</div>`

### 5. Marcadores visuais nos cards afetados (opcional, via prop)

- `ScoreProntidaoCard` e `ProntidaoTrendChart` recebem prop opcional `simulated?: boolean`; quando `true`, exibem badge `"Simulação"` (variant outline, `text-warning`) ao lado do título. Implementação leve, sem refactor.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (warning/muted/primary)
- Flat, sem shadow/gradient
- `React.memo` no painel
- Zero novas queries de rede
- `sessionStorage` (não persiste entre dias)
- Backward compat: nada muda quando `enabled=false`

## Arquivos tocados

**Criados (3):**
- `src/stores/useSimulationStore.ts`
- `src/lib/prontidaoSimulation.ts`
- `src/components/ficha-360/SimulationModePanel.tsx`

**Editados (3):**
- `src/pages/Ficha360.tsx` — calcular `effective*`, montar painel + banner
- `src/components/ficha-360/ScoreProntidaoCard.tsx` — prop `simulated` + badge
- `src/components/ficha-360/ProntidaoTrendChart.tsx` — prop `simulated` + badge

## Critério de fechamento

(a) Painel "Modo de testes" aparece no topo da Ficha 360 com Switch on/off, (b) ao ligar, banner warning sticky aparece e cards afetados ganham badge "Simulação", (c) 6 presets clicáveis aplicam cenários instantaneamente, (d) controles individuais (sentimento/cadência/dias atrás/canal/horário) recalculam score, breakdown, recomendação, fator mais fraco e curva de tendência ao vivo, (e) painel mostra "Score simulado: X (era Y)" comparando com real, (f) `ProximaAcaoCTA` continua usando dados reais (não é afetado pela simulação), (g) ao desligar Switch ou clicar Restaurar, tudo volta ao estado real sem refresh, (h) preferência persiste em sessionStorage só durante a sessão, (i) zero novas queries de rede, (j) zero regressão em qualquer card existente quando o modo está desligado.
