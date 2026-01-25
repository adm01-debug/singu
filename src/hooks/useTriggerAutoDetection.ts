// ==============================================
// TRIGGER AUTO DETECTION - Enterprise Feature
// Automatically detects mental triggers in text/interactions
// ==============================================

import { useCallback } from 'react';
import { TriggerType } from '@/types/triggers';
import { AdvancedTriggerType, AllTriggerTypes } from '@/types/triggers-advanced';

// Combined type for pattern keys (triggers we detect)
type DetectableTrigger = TriggerType | AdvancedTriggerType;

interface TriggerDetectionResult {
  triggerId: DetectableTrigger;
  confidence: number; // 0-100
  matchedPatterns: string[];
  context: string;
  position: { start: number; end: number };
}

interface DetectionAnalysis {
  detectedTriggers: TriggerDetectionResult[];
  dominantTriggers: DetectableTrigger[];
  triggerDensity: number; // triggers per 100 words
  effectiveness: 'low' | 'medium' | 'high' | 'excellent';
  suggestions: {
    missing: DetectableTrigger[];
    overused: DetectableTrigger[];
    conflicts: [DetectableTrigger, DetectableTrigger][];
  };
}

// Pattern definitions for each trigger type
const TRIGGER_PATTERNS: Record<string, { keywords: string[]; phrases: RegExp[]; weight: number }> = {
  // === BASIC TRIGGERS ===
  scarcity: {
    keywords: ['último', 'últimos', 'restam', 'apenas', 'limitado', 'exclusivo', 'raro', 'esgotando', 'vagas', 'poucos'],
    phrases: [/apenas \d+/, /últim[oa]s? \d+/, /restam apenas/, /por tempo limitado/, /vagas limitadas/i],
    weight: 1.2
  },
  urgency: {
    keywords: ['agora', 'hoje', 'imediato', 'urgente', 'prazo', 'deadline', 'rápido', 'já', 'imediatamente', 'antes'],
    phrases: [/só até/, /válido até/, /expira em/, /nas próximas \d+ horas/, /até amanhã/i],
    weight: 1.2
  },
  social_proof: {
    keywords: ['clientes', 'empresas', 'pessoas', 'milhares', 'centenas', 'outros', 'mercado', 'referência'],
    phrases: [/\d+\+? (clientes|empresas|pessoas)/, /líderes (do|de) mercado/, /cases de sucesso/, /empresas como/i],
    weight: 1.0
  },
  authority: {
    keywords: ['especialista', 'expert', 'certificado', 'premiado', 'reconhecido', 'líder', 'referência', 'PhD', 'doutor'],
    phrases: [/anos de experiência/, /certificad[oa] (em|por)/, /reconhecid[oa] (como|por)/, /prêmio/i],
    weight: 1.1
  },
  reciprocity: {
    keywords: ['grátis', 'gratuito', 'presente', 'bônus', 'brinde', 'oferta', 'cortesia', 'sem custo'],
    phrases: [/sem compromisso/, /como cortesia/, /presente para você/, /bônus exclusivo/i],
    weight: 1.0
  },
  commitment: {
    keywords: ['compromisso', 'acordo', 'combinado', 'promessa', 'palavra', 'comprometido'],
    phrases: [/você concorda/, /como combinamos/, /conforme prometido/, /você disse que/i],
    weight: 0.9
  },
  liking: {
    keywords: ['parceria', 'juntos', 'time', 'equipe', 'colaboração', 'sintonia', 'alinhados'],
    phrases: [/trabalhar juntos/, /parceria de sucesso/, /em comum/, /assim como você/i],
    weight: 0.8
  },
  contrast: {
    keywords: ['comparado', 'diferente', 'versus', 'enquanto', 'contrário', 'porém', 'entretanto'],
    phrases: [/em vez de/, /ao contrário de/, /diferente de/, /comparado (a|com)/i],
    weight: 0.9
  },
  novelty: {
    keywords: ['novo', 'novidade', 'inovador', 'revolucionário', 'inédito', 'lançamento', 'atualizado'],
    phrases: [/acabamos de lançar/, /nova versão/, /tecnologia de ponta/, /primeira vez/i],
    weight: 1.0
  },
  anticipation: {
    keywords: ['imagine', 'visualize', 'pense', 'quando', 'futuro', 'amanhã', 'daqui'],
    phrases: [/imagine (você|sua empresa)/, /daqui a \d+ meses/, /quando você/, /no futuro/i],
    weight: 1.0
  },
  exclusivity: {
    keywords: ['exclusivo', 'selecionado', 'VIP', 'premium', 'elite', 'seleto', 'restrito'],
    phrases: [/grupo seleto/, /acesso exclusivo/, /convite especial/, /apenas para/i],
    weight: 1.1
  },
  story: {
    keywords: ['história', 'conta', 'aconteceu', 'situação', 'caso', 'exemplo', 'cliente'],
    phrases: [/deixa eu contar/, /um cliente nosso/, /aconteceu com/, /história real/i],
    weight: 0.9
  },
  fear: {
    keywords: ['risco', 'perigo', 'problema', 'prejuízo', 'perder', 'ficar para trás', 'consequência'],
    phrases: [/você pode perder/, /risco de/, /ficar para trás/, /enquanto seus concorrentes/i],
    weight: 1.3
  },
  curiosity: {
    keywords: ['segredo', 'descobrir', 'revelar', 'método', 'estratégia', 'como', 'porque'],
    phrases: [/quer saber (como|por que)/, /o segredo é/, /vou te revelar/, /descubra como/i],
    weight: 1.0
  },
  guarantee: {
    keywords: ['garantia', 'garantido', 'risco zero', 'devolvemos', 'reembolso', 'satisfação'],
    phrases: [/garantia de \d+ dias/, /risco zero/, /dinheiro de volta/, /satisfação garantida/i],
    weight: 1.0
  },
  community: {
    keywords: ['comunidade', 'grupo', 'membros', 'rede', 'networking', 'pertencer', 'família'],
    phrases: [/fazer parte/, /nossa comunidade/, /rede de/, /grupo exclusivo/i],
    weight: 0.9
  },
  simplicity: {
    keywords: ['simples', 'fácil', 'rápido', 'prático', 'direto', 'sem complicação', 'descomplicado'],
    phrases: [/em \d+ passos/, /sem burocracia/, /de forma simples/, /fácil de/i],
    weight: 0.8
  },
  specificity: {
    keywords: ['exatamente', 'precisamente', 'específico', 'detalhado', 'passo a passo'],
    phrases: [/\d+,\d+%/, /exatamente \d+/, /passo a passo/, /especificamente/i],
    weight: 1.0
  },
  why: {
    keywords: ['porque', 'motivo', 'razão', 'propósito', 'objetivo', 'causa'],
    phrases: [/porque (nós|você|isso)/, /o motivo é/, /a razão/, /por isso/i],
    weight: 0.8
  },
  pain_solution: {
    keywords: ['problema', 'dor', 'frustração', 'dificuldade', 'desafio', 'solução', 'resolver'],
    phrases: [/você está (cansado|frustrado)/, /já tentou/, /não consegue/, /a solução para/i],
    weight: 1.2
  },
  transformation: {
    keywords: ['transformar', 'mudar', 'evoluir', 'crescer', 'melhorar', 'resultado', 'sucesso'],
    phrases: [/de .* para/, /sua transformação/, /resultados como/, /antes e depois/i],
    weight: 1.1
  },
  comparison: {
    keywords: ['melhor', 'superior', 'diferente', 'único', 'incomparável', 'líder'],
    phrases: [/melhor que/, /diferente (de|dos) outros/, /único (que|no)/, /líder em/i],
    weight: 0.9
  },
  
  // === ADVANCED TRIGGERS ===
  future_pacing: {
    keywords: ['imagine', 'visualize', 'quando', 'daqui', 'futuro', 'depois'],
    phrases: [/imagine (você|sua empresa) daqui/, /quando (você|vocês) (tiver|conseguir)/, /no futuro próximo/i],
    weight: 1.3
  },
  pattern_interrupt: {
    keywords: ['espere', 'pare', 'atenção', 'diferente', 'inusitado', 'surpreendente'],
    phrases: [/mas espere/, /antes de continuar/, /isso vai te surpreender/, /você sabia que/i],
    weight: 1.2
  },
  nested_loops: {
    keywords: ['história', 'conta', 'lembra', 'falando nisso', 'aliás', 'voltando'],
    phrases: [/isso me lembra/, /falando nisso/, /voltando ao que/, /como eu estava dizendo/i],
    weight: 1.1
  },
  paradox_double_bind: {
    keywords: ['qualquer', 'ambos', 'tanto', 'seja', 'escolha', 'opção'],
    phrases: [/você pode (escolher|optar)/, /tanto faz se/, /de qualquer forma/, /seja .* ou/i],
    weight: 1.3
  },
  loss_aversion: {
    keywords: ['perder', 'perda', 'prejuízo', 'custo', 'desperdício', 'nunca mais'],
    phrases: [/você está perdendo/, /o custo de não/, /prejuízo de/, /desperdiçando/i],
    weight: 1.4
  },
  identity_shift: {
    keywords: ['tipo', 'pessoa', 'profissional', 'líder', 'empreendedor', 'vencedor'],
    phrases: [/você é (o tipo de|uma) pessoa/, /profissionais como você/, /líderes que/, /você se vê como/i],
    weight: 1.3
  },
  tribal_belonging: {
    keywords: ['nós', 'nosso', 'juntos', 'comunidade', 'tribo', 'movimento', 'família'],
    phrases: [/fazer parte de/, /você é um de nós/, /nossa tribo/, /juntos somos/i],
    weight: 1.2
  },
  cognitive_ease: {
    keywords: ['simples', 'fácil', 'claro', 'óbvio', 'natural', 'intuitivo', 'automático'],
    phrases: [/é simples assim/, /naturalmente você/, /de forma automática/, /sem esforço/i],
    weight: 1.0
  },
  
  // === EXTENDED TRIGGERS ===
  priming: {
    keywords: ['qualidade', 'excelência', 'sucesso', 'resultado', 'conquista', 'vitória'],
    phrases: [/pense em (qualidade|sucesso)/, /quando você pensa em/, /associado a/i],
    weight: 1.2
  },
  anchoring: {
    keywords: ['originalmente', 'normal', 'regular', 'antes', 'era', 'costumava'],
    phrases: [/de R?\$?\d+ por (apenas )?R?\$?\d+/, /originalmente/, /valor normal/, /economia de/i],
    weight: 1.3
  },
  decoy_effect: {
    keywords: ['plano', 'opção', 'pacote', 'básico', 'intermediário', 'premium', 'recomendado'],
    phrases: [/plano (básico|intermediário|premium)/, /opção recomendada/, /mais popular/i],
    weight: 1.2
  },
  framing: {
    keywords: ['economia', 'ganho', 'investimento', 'retorno', 'benefício', 'vantagem'],
    phrases: [/você economiza/, /seu ganho será/, /retorno de \d+%/, /investimento de apenas/i],
    weight: 1.1
  },
  curiosity_gap: {
    keywords: ['segredo', 'revelação', 'descoberta', 'surpresa', 'incrível', 'impressionante'],
    phrases: [/você não vai acreditar/, /a verdade sobre/, /o que ninguém conta/, /o segredo que/i],
    weight: 1.2
  },
  peak_end_rule: {
    keywords: ['memorável', 'inesquecível', 'experiência', 'momento', 'impressão', 'lembrança'],
    phrases: [/momento especial/, /experiência única/, /você vai lembrar/, /impressão final/i],
    weight: 1.0
  },
  endowment_effect: {
    keywords: ['seu', 'sua', 'próprio', 'personalizado', 'exclusivo', 'dedicado'],
    phrases: [/já é seu/, /sua própria/, /feito para você/, /personalizado para/i],
    weight: 1.1
  },
  sunk_cost: {
    keywords: ['investiu', 'dedicou', 'tempo', 'esforço', 'energia', 'já', 'até aqui'],
    phrases: [/você já investiu/, /depois de tudo/, /chegou até aqui/, /não desperdice/i],
    weight: 1.2
  },
  bandwagon: {
    keywords: ['todos', 'maioria', 'tendência', 'popular', 'viral', 'movimento', 'onda'],
    phrases: [/todo mundo está/, /a maioria das empresas/, /tendência (do|de) mercado/, /não fique para trás/i],
    weight: 1.1
  },
  halo_effect: {
    keywords: ['marca', 'reconhecida', 'premiada', 'renomada', 'respeitada', 'referência'],
    phrases: [/marca (líder|reconhecida)/, /premiada (como|por)/, /referência (em|no)/i],
    weight: 1.0
  },
  contrast_principle: {
    keywords: ['antes', 'depois', 'sem', 'com', 'diferença', 'comparação', 'versus'],
    phrases: [/antes vs depois/, /com vs sem/, /a diferença entre/, /compare você mesmo/i],
    weight: 1.1
  },
  unity: {
    keywords: ['nós', 'juntos', 'parceria', 'time', 'família', 'comunidade', 'unidos'],
    phrases: [/somos parceiros/, /estamos juntos/, /nossa família/, /unidos (por|em)/i],
    weight: 1.0
  }
};

// Trigger conflict matrix
const TRIGGER_CONFLICTS: [DetectableTrigger, DetectableTrigger][] = [
  ['scarcity', 'exclusivity'],
  ['urgency', 'anticipation'],
  ['loss_aversion', 'guarantee'],
  ['cognitive_ease', 'curiosity_gap'],
  ['anchoring', 'specificity']
];

export function useTriggerAutoDetection() {
  
  const detectTriggers = useCallback((text: string): DetectionAnalysis => {
    if (!text || text.length < 20) {
      return {
        detectedTriggers: [],
        dominantTriggers: [],
        triggerDensity: 0,
        effectiveness: 'low',
        suggestions: { missing: [], overused: [], conflicts: [] }
      };
    }

    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const wordCount = text.split(/\s+/).length;
    const detectedTriggers: TriggerDetectionResult[] = [];
    const triggerCounts: Record<string, number> = {};

    // Scan for each trigger type
    Object.entries(TRIGGER_PATTERNS).forEach(([triggerId, patterns]) => {
      const matches: { pattern: string; index: number }[] = [];
      
      // Check keywords
      patterns.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let index = normalizedText.indexOf(normalizedKeyword);
        while (index !== -1) {
          matches.push({ pattern: keyword, index });
          index = normalizedText.indexOf(normalizedKeyword, index + 1);
        }
      });

      // Check regex phrases
      patterns.phrases.forEach(regex => {
        const match = regex.exec(normalizedText);
        if (match) {
          matches.push({ pattern: match[0], index: match.index });
        }
      });

      if (matches.length > 0) {
        // Calculate confidence based on matches and weight
        const baseConfidence = Math.min(matches.length * 25, 80);
        const weightedConfidence = Math.round(baseConfidence * patterns.weight);
        const finalConfidence = Math.min(weightedConfidence, 95);

        const firstMatch = matches[0];
        const contextStart = Math.max(0, firstMatch.index - 30);
        const contextEnd = Math.min(text.length, firstMatch.index + 50);

        detectedTriggers.push({
          triggerId: triggerId as DetectableTrigger,
          confidence: finalConfidence,
          matchedPatterns: [...new Set(matches.map(m => m.pattern))],
          context: text.substring(contextStart, contextEnd).trim(),
          position: { start: firstMatch.index, end: firstMatch.index + firstMatch.pattern.length }
        });

        triggerCounts[triggerId] = matches.length;
      }
    });

    // Sort by confidence
    detectedTriggers.sort((a, b) => b.confidence - a.confidence);

    // Calculate trigger density
    const triggerDensity = (detectedTriggers.length / wordCount) * 100;

    // Identify dominant triggers (top 3 with confidence > 50)
    const dominantTriggers = detectedTriggers
      .filter(t => t.confidence >= 50)
      .slice(0, 3)
      .map(t => t.triggerId);

    // Find overused triggers (more than 3 occurrences)
    const overused = Object.entries(triggerCounts)
      .filter(([_, count]) => count > 3)
      .map(([id]) => id as DetectableTrigger);

    // Find conflicts
    const detectedIds = detectedTriggers.map(t => t.triggerId);
    const conflicts = TRIGGER_CONFLICTS.filter(
      ([a, b]) => detectedIds.includes(a) && detectedIds.includes(b)
    );

    // Suggest missing high-impact triggers
    const highImpactTriggers: DetectableTrigger[] = [
      'scarcity', 'urgency', 'social_proof', 'authority', 'loss_aversion',
      'future_pacing', 'anchoring', 'framing'
    ];
    const missing = highImpactTriggers.filter(t => !detectedIds.includes(t));

    // Calculate effectiveness
    let effectiveness: 'low' | 'medium' | 'high' | 'excellent' = 'low';
    if (detectedTriggers.length >= 5 && dominantTriggers.length >= 2 && conflicts.length === 0) {
      effectiveness = 'excellent';
    } else if (detectedTriggers.length >= 3 && dominantTriggers.length >= 1) {
      effectiveness = 'high';
    } else if (detectedTriggers.length >= 2) {
      effectiveness = 'medium';
    }

    return {
      detectedTriggers,
      dominantTriggers,
      triggerDensity: Math.round(triggerDensity * 100) / 100,
      effectiveness,
      suggestions: {
        missing: missing.slice(0, 5),
        overused,
        conflicts
      }
    };
  }, []);

  // Analyze effectiveness of trigger usage
  const getEffectivenessScore = useCallback((analysis: DetectionAnalysis): number => {
    let score = 0;
    
    // Base score from detected triggers
    score += analysis.detectedTriggers.length * 5;
    
    // Bonus for high-confidence triggers
    score += analysis.detectedTriggers.filter(t => t.confidence >= 70).length * 10;
    
    // Bonus for dominant triggers
    score += analysis.dominantTriggers.length * 15;
    
    // Penalty for conflicts
    score -= analysis.suggestions.conflicts.length * 20;
    
    // Penalty for overuse
    score -= analysis.suggestions.overused.length * 10;
    
    // Optimal density bonus (2-5 triggers per 100 words)
    if (analysis.triggerDensity >= 2 && analysis.triggerDensity <= 5) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }, []);

  // Get recommendations based on analysis
  const getRecommendations = useCallback((analysis: DetectionAnalysis): string[] => {
    const recommendations: string[] = [];

    if (analysis.detectedTriggers.length === 0) {
      recommendations.push('Nenhum gatilho detectado. Considere adicionar elementos de persuasão.');
    }

    if (analysis.suggestions.conflicts.length > 0) {
      recommendations.push(`⚠️ Conflitos detectados: ${analysis.suggestions.conflicts.map(([a, b]) => `${a} vs ${b}`).join(', ')}`);
    }

    if (analysis.suggestions.overused.length > 0) {
      recommendations.push(`⚠️ Gatilhos superutilizados: ${analysis.suggestions.overused.join(', ')}. Risco de saturação.`);
    }

    if (analysis.suggestions.missing.length > 0 && analysis.detectedTriggers.length < 3) {
      recommendations.push(`💡 Considere adicionar: ${analysis.suggestions.missing.slice(0, 3).join(', ')}`);
    }

    if (analysis.triggerDensity > 8) {
      recommendations.push('⚠️ Densidade muito alta. Risco de parecer manipulativo.');
    }

    if (analysis.effectiveness === 'excellent') {
      recommendations.push('✅ Excelente uso de gatilhos! Combinação equilibrada e eficaz.');
    }

    return recommendations;
  }, []);

  return {
    detectTriggers,
    getEffectivenessScore,
    getRecommendations
  };
}
