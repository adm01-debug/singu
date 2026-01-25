// ==============================================
// EXTENDED CARNEGIE ANALYSIS HOOK
// Unified analysis for all 14 additional principles
// ==============================================

import { useCallback, useMemo } from 'react';
import { Contact } from '@/types';
import { ExtendedCarnegieScore } from '@/types/carnegie-extended';
import { detectCriticalLanguage, calculateCriticismScore, getCriticismTone } from '@/data/carnegieCriticismDetector';
import { detectEagerWants, getEagerWantsByDISC } from '@/data/carnegieEagerWant';
import { countInterestIndicators, calculateInterestScore, getInterestLevel } from '@/data/carnegieGenuineInterest';
import { suggestYesQuestions, calculateYesReadiness } from '@/data/carnegieYesLadder';
import { analyzeOwnershipLanguage, getTechniquesForDISC } from '@/data/carnegieOwnershipTransfer';
import { analyzeEmpathyInText, getEmpathyForSituation } from '@/data/carnegieEmpathyTemplates';
import { analyzeStorytellingInText, getStoriesForDISC } from '@/data/carnegieStorytelling';
import { calculateEncouragementScore, detectDiscouragement } from '@/data/carnegieEncouragement';
import { analyzeQuestionInfluence, suggestQuestions } from '@/data/carnegieQuestionInfluence';
import { getDISCProfile } from '@/lib/contact-utils';

export function useExtendedCarnegieAnalysis(contact: Contact | null) {
  const discProfile = contact ? (getDISCProfile(contact) as 'D' | 'I' | 'S' | 'C') || 'S' : 'S';

  // Analyze text for all extended principles
  const analyzeText = useCallback((text: string): ExtendedCarnegieScore => {
    // 1. Criticism Analysis
    const criticismScore = calculateCriticismScore(text);
    
    // 2. Eager Want Detection
    const detectedWants = detectEagerWants(text);
    const eagerWantScore = detectedWants.length > 0 ? 70 + (detectedWants.length * 10) : 40;
    
    // 3. Genuine Interest
    const interestCounts = countInterestIndicators(text);
    const interestScore = calculateInterestScore(interestCounts);
    
    // 4. Positivity (simple detection)
    const positivityPatterns = /(!|incrível|ótimo|excelente|parabéns|adorei)/gi;
    const positivityMatches = text.match(positivityPatterns) || [];
    const positivityScore = Math.min(100, 50 + positivityMatches.length * 15);
    
    // 5. Name Personalization (check for name usage)
    const nameScore = contact?.firstName && text.includes(contact.firstName) ? 80 : 40;
    
    // 6. Interest Alignment
    const alignmentScore = 60; // Would need client interests to calculate properly
    
    // 7. Argument Avoidance
    const argumentPatterns = /mas você|você está errado|não é assim/gi;
    const argumentMatches = text.match(argumentPatterns) || [];
    const argumentScore = Math.max(0, 100 - argumentMatches.length * 25);
    
    // 8. Judgment-Free
    const judgmentScore = criticismScore; // Related to criticism
    
    // 9. Yes-Ladder
    const yesQuestions = (text.match(/\bcerto\?|né\?|correto\?|faz sentido\?/gi) || []).length;
    const yesScore = calculateYesReadiness(yesQuestions);
    
    // 10. Ownership Transfer
    const ownership = analyzeOwnershipLanguage(text);
    const ownershipScore = ownership.ownershipGiven ? 85 : 50 - ownership.problematicPhrases.length * 10;
    
    // 11. Perspective Taking
    const perspectivePatterns = /do seu ponto|na sua visão|você deve sentir|imagino como/gi;
    const perspectiveMatches = text.match(perspectivePatterns) || [];
    const perspectiveScore = 40 + perspectiveMatches.length * 20;
    
    // 12. Empathy
    const empathy = analyzeEmpathyInText(text);
    
    // 13. Storytelling
    const storytelling = analyzeStorytellingInText(text);
    
    // 14. Challenge (for D profiles)
    const challengePatterns = /desafio|você consegue|aposto que|prove que/gi;
    const challengeScore = discProfile === 'D' ? 50 + (text.match(challengePatterns) || []).length * 15 : 50;
    
    // 15. Indirect Feedback
    const indirectScore = criticismScore; // Related
    
    // 16. Question Influence
    const questionInfluence = analyzeQuestionInfluence(text);
    
    // 17. Encouragement
    const encouragementScore = calculateEncouragementScore(text);
    
    // 18. Motivation Alignment
    const motivationScore = eagerWantScore; // Related to eager wants

    // Calculate overall
    const scores = {
      criticismAvoidance: criticismScore,
      eagerWantArousal: eagerWantScore,
      genuineInterest: interestScore,
      positivitySmile: positivityScore,
      namePersonalization: nameScore,
      interestAlignment: alignmentScore,
      argumentAvoidance: argumentScore,
      judgmentFreeLanguage: judgmentScore,
      yesLadder: yesScore,
      ownershipTransfer: Math.max(0, ownershipScore),
      perspectiveTaking: Math.min(100, perspectiveScore),
      empathyExpression: empathy.empathyScore,
      storytelling: storytelling.score,
      challengeTrigger: challengeScore,
      indirectFeedback: indirectScore,
      questionInfluence: questionInfluence.score,
      encouragement: encouragementScore,
      motivationAlignment: motivationScore
    };

    const overall = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    );

    const level = 
      overall >= 85 ? 'master' :
      overall >= 70 ? 'expert' :
      overall >= 55 ? 'proficient' :
      overall >= 40 ? 'developing' : 'novice';

    // Find top strengths and improvements
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topStrengths = sortedScores.slice(0, 3).map(([key]) => key);
    const priorityImprovements = sortedScores.slice(-3).map(([key]) => key);

    return {
      overall,
      components: scores,
      level,
      topStrengths,
      priorityImprovements
    };
  }, [contact?.first_name, discProfile]);

  // Get DISC-adapted resources
  const getResources = useMemo(() => ({
    eagerWants: getEagerWantsByDISC(discProfile).slice(0, 3),
    ownershipTechniques: getTechniquesForDISC(discProfile),
    storyTemplates: getStoriesForDISC(discProfile),
    questionPatterns: suggestQuestions('', discProfile)
  }), [discProfile]);

  return {
    analyzeText,
    discProfile,
    resources: getResources,
    // Expose individual analyzers
    analyzeCriticism: detectCriticalLanguage,
    analyzeEmpathy: analyzeEmpathyInText,
    analyzeStorytelling: analyzeStorytellingInText,
    analyzeQuestions: analyzeQuestionInfluence,
    detectEagerWants,
    getEmpathyPhrases: getEmpathyForSituation
  };
}
