import { useMemo } from 'react';
import { ClientDictionary, WordUsage } from '@/types/nlp-advanced';
import { Contact } from '@/types';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

// Common stopwords to filter out
const STOPWORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'para', 'com', 'em', 'que', 'é',
  'um', 'uma', 'os', 'as', 'no', 'na', 'por', 'mais', 'se', 'como',
  'mas', 'foi', 'ao', 'ele', 'ela', 'entre', 'quando', 'muito', 'nos',
  'já', 'eu', 'também', 'só', 'seu', 'sua', 'ou', 'ser', 'porque',
  'isso', 'você', 'essa', 'esse', 'são', 'está', 'tem', 'ter', 'não',
  'sim', 'ok', 'tá', 'né', 'aí', 'então', 'assim', 'bem', 'aqui', 'lá'
]);

export function useClientDictionary(contact: Contact, interactions: Interaction[]) {
  const clientDictionary = useMemo((): ClientDictionary => {
    const wordCounts = new Map<string, { count: number; contexts: string[]; lastUsed: string }>();
    const expressionCounts = new Map<string, { count: number; contexts: string[]; lastUsed: string }>();
    
    // Common expressions to look for
    const commonExpressions = [
      'com certeza', 'sem dúvida', 'pode ser', 'vamos ver', 'deixa eu ver',
      'faz sentido', 'não sei', 'vou pensar', 'muito bom', 'interessante',
      'me conta', 'pode me', 'quero saber', 'preciso de', 'gostaria de',
      'na verdade', 'por exemplo', 'tipo assim', 'basicamente', 'resumindo',
      'pra ser sincero', 'sinceramente', 'honestamente', 'olha só', 'escuta',
      'sabe o que', 'deixa eu te falar', 'vou te contar'
    ];

    // Technical terms to identify
    const techTermPatterns = [
      /ROI/gi, /KPI/gi, /B2B/gi, /B2C/gi, /CRM/gi, /ERP/gi, /SaaS/gi,
      /\d+%/g, /R\$[\d.,]+/gi, /deadline/gi, /budget/gi, /forecast/gi,
      /pipeline/gi, /leads/gi, /churn/gi, /CAC/gi, /LTV/gi, /MRR/gi
    ];

    // Analyze each interaction
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const timestamp = interaction.createdAt || new Date().toISOString();
      const words = text.toLowerCase()
        .replace(/[.,!?;:()[\]{}""'']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w));

      // Count individual words
      words.forEach(word => {
        const existing = wordCounts.get(word);
        if (existing) {
          existing.count++;
          if (existing.contexts.length < 3) {
            existing.contexts.push(text.substring(0, 100));
          }
          existing.lastUsed = timestamp;
        } else {
          wordCounts.set(word, { count: 1, contexts: [text.substring(0, 100)], lastUsed: timestamp });
        }
      });

      // Find expressions
      const lowerText = text.toLowerCase();
      commonExpressions.forEach(expr => {
        if (lowerText.includes(expr)) {
          const existing = expressionCounts.get(expr);
          if (existing) {
            existing.count++;
            existing.lastUsed = timestamp;
          } else {
            expressionCounts.set(expr, { count: 1, contexts: [text.substring(0, 100)], lastUsed: timestamp });
          }
        }
      });
    });

    // Convert to WordUsage arrays
    const allWords: WordUsage[] = Array.from(wordCounts.entries())
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        context: data.contexts,
        sentiment: determineSentiment(word),
        lastUsed: data.lastUsed,
        engagementLevel: calculateEngagement(word, data.count)
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Favorite words (high frequency, positive/neutral)
    const favoriteWords = allWords
      .filter(w => w.sentiment !== 'negative' && w.frequency >= 2)
      .slice(0, 10);

    // Favorite expressions
    const favoriteExpressions: WordUsage[] = Array.from(expressionCounts.entries())
      .map(([expr, data]) => ({
        word: expr,
        frequency: data.count,
        context: data.contexts,
        sentiment: determineSentiment(expr),
        lastUsed: data.lastUsed,
        engagementLevel: calculateEngagement(expr, data.count)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);

    // Words to avoid (negative sentiment or low engagement)
    const avoidWords = allWords
      .filter(w => w.sentiment === 'negative')
      .slice(0, 5);

    // Tech terms used
    const techTermsUsed: WordUsage[] = [];
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      techTermPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const existing = techTermsUsed.find(t => t.word.toLowerCase() === match.toLowerCase());
            if (existing) {
              existing.frequency++;
            } else {
              techTermsUsed.push({
                word: match,
                frequency: 1,
                context: [text.substring(0, 100)],
                sentiment: 'neutral',
                lastUsed: interaction.createdAt || new Date().toISOString(),
                engagementLevel: 70
              });
            }
          });
        }
      });
    });

    // Emotional triggers
    const emotionalWords = [
      'preocupado', 'animado', 'frustrado', 'feliz', 'ansioso', 'satisfeito',
      'empolgado', 'decepcionado', 'confiante', 'inseguro', 'otimista', 'pessimista'
    ];

    const emotionalTriggers: WordUsage[] = allWords
      .filter(w => emotionalWords.includes(w.word))
      .slice(0, 5);

    // Determine vocabulary style
    let formalCount = 0;
    let informalCount = 0;
    const technicalCount = techTermsUsed.length;

    const formalWords = ['prezado', 'cordialmente', 'atenciosamente', 'conforme', 'mediante', 'portanto'];
    const informalWords = ['oi', 'valeu', 'beleza', 'show', 'top', 'massa', 'legal', 'blz'];

    allWords.forEach(w => {
      if (formalWords.includes(w.word)) formalCount += w.frequency;
      if (informalWords.includes(w.word)) informalCount += w.frequency;
    });

    let vocabularyStyle: ClientDictionary['vocabularyStyle'] = 'mixed';
    if (technicalCount > 5) vocabularyStyle = 'technical';
    else if (formalCount > informalCount * 2) vocabularyStyle = 'formal';
    else if (informalCount > formalCount * 2) vocabularyStyle = 'informal';
    else if (informalCount > formalCount) vocabularyStyle = 'casual';

    // Determine communication tempo based on average message length
    const avgLength = interactions.reduce((sum, i) => {
      const text = i.content || i.transcription || '';
      return sum + text.split(' ').length;
    }, 0) / Math.max(1, interactions.length);

    const communicationTempo: ClientDictionary['communicationTempo'] = 
      avgLength < 20 ? 'fast' : avgLength < 50 ? 'moderate' : 'slow';

    // Preferred greetings and closings
    const greetingPatterns = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'fala'];
    const closingPatterns = ['abraço', 'obrigado', 'valeu', 'até mais', 'tchau', 'beijo', 'att'];

    const preferredGreetings = greetingPatterns.filter(g => 
      allWords.some(w => w.word.includes(g)) || favoriteExpressions.some(e => e.word.includes(g))
    );

    const preferredClosings = closingPatterns.filter(c => 
      allWords.some(w => w.word.includes(c)) || favoriteExpressions.some(e => e.word.includes(c))
    );

    // Top engagement words
    const topEngagementWords = allWords
      .filter(w => w.engagementLevel >= 70)
      .map(w => w.word)
      .slice(0, 10);

    return {
      favoriteWords,
      favoriteExpressions,
      avoidWords,
      techTermsUsed: techTermsUsed.slice(0, 8),
      emotionalTriggers,
      vocabularyStyle,
      communicationTempo,
      preferredGreetings: preferredGreetings.length > 0 ? preferredGreetings : ['Olá'],
      preferredClosings: preferredClosings.length > 0 ? preferredClosings : ['Abraço'],
      topEngagementWords
    };
  }, [contact, interactions]);

  return { clientDictionary };
}

function determineSentiment(word: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'ótimo', 'excelente', 'incrível', 'perfeito', 'maravilhoso', 'fantástico',
    'bom', 'legal', 'bacana', 'show', 'top', 'massa', 'adorei', 'amei',
    'sucesso', 'conquista', 'resultado', 'crescimento', 'oportunidade'
  ];

  const negativeWords = [
    'problema', 'ruim', 'péssimo', 'terrível', 'horrível', 'difícil',
    'complicado', 'frustrado', 'decepcionado', 'irritado', 'cansado',
    'perda', 'risco', 'medo', 'preocupado', 'fracasso', 'erro'
  ];

  if (positiveWords.some(p => word.includes(p))) return 'positive';
  if (negativeWords.some(n => word.includes(n))) return 'negative';
  return 'neutral';
}

function calculateEngagement(word: string, frequency: number): number {
  // Higher frequency = higher engagement
  // Certain words indicate higher engagement
  const highEngagementWords = [
    'interessante', 'perfeito', 'adorei', 'vamos', 'fechou', 'quero',
    'preciso', 'urgente', 'importante', 'prioridade'
  ];

  let base = Math.min(100, frequency * 15);
  if (highEngagementWords.some(h => word.includes(h))) {
    base += 20;
  }

  return Math.min(100, base);
}
