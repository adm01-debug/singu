import { useState, useCallback } from 'react';
import { MessageAnalysis } from '@/types/nlp-advanced';
import { Contact, DISCProfile } from '@/types';
import { VAKType, VAK_PREDICATES } from '@/types/vak';
import { POWER_WORDS } from '@/data/nlpAdvancedData';
import { METAPROGRAM_KEYWORDS } from '@/types/metaprograms';
import { getDominantVAK, getDISCProfile as getBehaviorDISC, getMetaprogramProfile } from '@/lib/contact-utils';

export function usePersuasionScore(contact: Contact) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeMessage = useCallback((message: string): MessageAnalysis => {
    const vakType = getDominantVAK(contact) as VAKType;
    const discProfile = (getBehaviorDISC(contact) as DISCProfile) || 'D';
    const metaprogram = getMetaprogramProfile(contact);
    const motivationDirection = metaprogram?.motivationDirection || 'toward';
    const lowerMessage = message.toLowerCase();

    // Initialize scores
    let vakAlignment = 0;
    let discAlignment = 0;
    let metaprogramAlignment = 0;
    let emotionalImpact = 0;
    let clarity = 0;
    let callToAction = 0;

    const issues: MessageAnalysis['issues'] = [];
    const wordsToReplace: MessageAnalysis['wordsToReplace'] = [];
    const strengths: string[] = [];
    const missingElements: string[] = [];

    // Check VAK alignment
    const vakWords = VAK_PREDICATES[vakType] || [];
    const wrongVakTypes: VAKType[] = (['V', 'A', 'K', 'D'] as VAKType[]).filter(t => t !== vakType);
    
    let vakMatches = 0;
    let wrongVakMatches = 0;

    vakWords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) {
        vakMatches++;
      }
    });

    wrongVakTypes.forEach(wrongType => {
      const wrongWords = VAK_PREDICATES[wrongType] || [];
      wrongWords.forEach(word => {
        if (lowerMessage.includes(word.toLowerCase())) {
          wrongVakMatches++;
          const correctWord = vakWords[Math.floor(Math.random() * Math.min(5, vakWords.length))];
          wordsToReplace.push({
            original: word,
            suggested: correctWord,
            reason: `"${word}" é ${wrongType === 'V' ? 'visual' : wrongType === 'A' ? 'auditivo' : wrongType === 'K' ? 'cinestésico' : 'digital'}, mas ${contact.firstName} é ${vakType === 'V' ? 'Visual' : vakType === 'A' ? 'Auditivo' : vakType === 'K' ? 'Cinestésico' : 'Digital'}`
          });
        }
      });
    });

    vakAlignment = Math.min(100, vakMatches * 15 - wrongVakMatches * 10);
    if (vakAlignment < 0) vakAlignment = 0;

    if (vakMatches > 0) {
      strengths.push(`✓ Usa ${vakMatches} palavra(s) ${vakType === 'V' ? 'visual(is)' : vakType === 'A' ? 'auditiva(s)' : vakType === 'K' ? 'cinestésica(s)' : 'digital(is)'}`);
    } else {
      missingElements.push(`Adicione palavras ${vakType === 'V' ? 'visuais (ver, mostrar, claro)' : vakType === 'A' ? 'auditivas (ouvir, som, harmonia)' : vakType === 'K' ? 'cinestésicas (sentir, tocar, sólido)' : 'digitais (analisar, dados, lógico)'}`);
    }

    // Check DISC alignment
    const discWords = POWER_WORDS.disc[discProfile] || [];
    let discMatches = 0;

    discWords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) {
        discMatches++;
      }
    });

    discAlignment = Math.min(100, discMatches * 15);

    if (discMatches > 0) {
      strengths.push(`✓ Alinhado com perfil ${discProfile} (${discMatches} palavras-chave)`);
    } else {
      missingElements.push(`Adicione palavras do perfil ${discProfile}: ${discWords.slice(0, 4).join(', ')}`);
    }

    // Check metaprogram alignment
    const metaKeywords = motivationDirection === 'toward' 
      ? METAPROGRAM_KEYWORDS.toward 
      : METAPROGRAM_KEYWORDS.awayFrom;
    const wrongMetaKeywords = motivationDirection === 'toward' 
      ? METAPROGRAM_KEYWORDS.awayFrom 
      : METAPROGRAM_KEYWORDS.toward;

    let metaMatches = 0;
    let wrongMetaMatches = 0;

    metaKeywords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) metaMatches++;
    });

    wrongMetaKeywords.forEach(word => {
      if (lowerMessage.includes(word.toLowerCase())) {
        wrongMetaMatches++;
        const correctWord = metaKeywords[Math.floor(Math.random() * Math.min(5, metaKeywords.length))];
        wordsToReplace.push({
          original: word,
          suggested: correctWord,
          reason: `"${word}" é ${motivationDirection === 'toward' ? 'Afastar-se De' : 'Em Direção A'}, mas ${contact.firstName} é motivado por ${motivationDirection === 'toward' ? 'ganhos (Em Direção A)' : 'evitar problemas (Afastar-se De)'}`
        });
      }
    });

    metaprogramAlignment = Math.min(100, metaMatches * 15 - wrongMetaMatches * 10);
    if (metaprogramAlignment < 0) metaprogramAlignment = 0;

    if (metaMatches > 0) {
      strengths.push(`✓ Motivação ${motivationDirection === 'toward' ? 'positiva (ganhos)' : 'preventiva (evitar problemas)'}`);
    } else {
      missingElements.push(`Foque em ${motivationDirection === 'toward' ? 'GANHOS (alcançar, conquistar, crescer)' : 'EVITAR PROBLEMAS (resolver, eliminar, proteger)'}`);
    }

    // Check emotional impact
    const emotionalWords = ['incrível', 'fantástico', 'importante', 'especial', 'único', 'exclusivo', 'urgente', 'oportunidade', 'transformar'];
    const negativeWords = ['problema', 'risco', 'perda', 'custo', 'difícil', 'complicado'];
    
    let positiveEmotions = 0;
    let negativeEmotions = 0;

    emotionalWords.forEach(word => {
      if (lowerMessage.includes(word)) positiveEmotions++;
    });
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) negativeEmotions++;
    });

    if (motivationDirection === 'toward') {
      emotionalImpact = Math.min(100, positiveEmotions * 20 - negativeEmotions * 10);
    } else {
      emotionalImpact = Math.min(100, negativeEmotions * 15 + positiveEmotions * 10);
    }
    if (emotionalImpact < 0) emotionalImpact = 0;

    // Check clarity
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = message.length / Math.max(1, sentences.length);
    clarity = avgSentenceLength < 100 ? 90 : avgSentenceLength < 150 ? 70 : 50;

    if (clarity >= 80) {
      strengths.push('✓ Mensagem clara e objetiva');
    } else {
      issues.push({
        issue: 'Frases muito longas',
        severity: 'medium',
        suggestion: 'Divida em frases menores para facilitar leitura'
      });
    }

    // Check call to action
    const ctaPatterns = ['vamos', 'podemos', 'que tal', 'gostaria', 'confirma', 'agenda', 'fecha', 'próximo passo'];
    let hasCTA = false;

    ctaPatterns.forEach(pattern => {
      if (lowerMessage.includes(pattern)) hasCTA = true;
    });

    callToAction = hasCTA ? 90 : 20;

    if (hasCTA) {
      strengths.push('✓ Tem chamada para ação');
    } else {
      missingElements.push('Adicione uma chamada para ação clara');
      issues.push({
        issue: 'Sem chamada para ação',
        severity: 'high',
        suggestion: 'Termine com: "Vamos agendar?" ou "Posso te ligar amanhã?"'
      });
    }

    // Check if uses contact name
    if (message.includes(contact.firstName)) {
      strengths.push(`✓ Usa o nome ${contact.firstName} (personalização)`);
    } else {
      missingElements.push(`Use o nome "${contact.firstName}" para personalizar`);
    }

    // Calculate overall score
    const overallScore = Math.round(
      vakAlignment * 0.2 +
      discAlignment * 0.2 +
      metaprogramAlignment * 0.2 +
      emotionalImpact * 0.15 +
      clarity * 0.1 +
      callToAction * 0.15
    );

    // Generate optimized version
    let optimizedVersion = message;

    // Add name if missing
    if (!message.includes(contact.firstName)) {
      optimizedVersion = `${contact.firstName}, ` + optimizedVersion;
    }

    // Suggest word replacements
    wordsToReplace.slice(0, 3).forEach(({ original, suggested }) => {
      const regex = new RegExp(original, 'gi');
      optimizedVersion = optimizedVersion.replace(regex, suggested);
    });

    // Add CTA if missing
    if (!hasCTA) {
      optimizedVersion += discProfile === 'D' 
        ? ' Vamos fechar isso?'
        : discProfile === 'I'
        ? ' O que acha? Vamos conversar mais!'
        : discProfile === 'S'
        ? ' Posso te ajudar com mais alguma coisa?'
        : ' Faz sentido para você?';
    }

    return {
      originalMessage: message,
      overallScore,
      breakdown: {
        vakAlignment,
        discAlignment,
        metaprogramAlignment,
        emotionalImpact,
        clarity,
        callToAction
      },
      issues,
      optimizedVersion,
      wordsToReplace: wordsToReplace.slice(0, 5),
      missingElements,
      strengths
    };
  }, [contact]);

  return {
    analyzeMessage,
    analyzing
  };
}
