/**
 * Demo contact for NLP training mode
 * Used when components are rendered without a specific contact
 */

import { Contact, ContactBehavior } from '@/types';

const DEMO_BEHAVIOR: ContactBehavior = {
  discProfile: 'D',
  discConfidence: 75,
  preferredChannel: 'email',
  formalityLevel: 3,
  decisionCriteria: ['quality', 'price'],
  needsApproval: false,
  decisionPower: 7,
  supportLevel: 6,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: [],
  competitorsUsed: [],
  vakProfile: {
    visual: 60,
    auditory: 25,
    kinesthetic: 15,
    primary: 'V'
  }
};

export const DEMO_CONTACT: Contact = {
  id: 'demo',
  firstName: 'Cliente',
  lastName: 'Exemplo',
  companyId: '',
  companyName: 'Demo Corp',
  role: 'decision_maker',
  roleTitle: 'Diretor',
  relationshipStage: 'prospect',
  relationshipScore: 65,
  sentiment: 'neutral',
  interactionCount: 5,
  tags: [],
  hobbies: [],
  interests: [],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: DEMO_BEHAVIOR
};
