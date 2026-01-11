/**
 * Type-safe utilities for working with Contact behavior data
 */

import { Contact, ContactBehavior, VAKProfile, DISCProfile, DecisionRole, CareerStage, DecisionSpeed } from '@/types';

// Default VAK Profile
export const DEFAULT_VAK_PROFILE: VAKProfile = {
  visual: 33,
  auditory: 33,
  kinesthetic: 34,
  primary: 'V'
};

// Metaprogram Profile Interface
export interface MetaprogramProfile {
  motivationDirection?: 'toward' | 'away';
  referenceFrame?: 'internal' | 'external';
  sortingStyle?: 'options' | 'procedures';
  chunkSize?: 'big_picture' | 'details';
  timeOrientation?: 'past' | 'present' | 'future';
}

// Extended behavior that includes optional NLP/metaprogram data
export interface ExtendedBehavior extends Partial<ContactBehavior> {
  vakProfile?: VAKProfile;
  metaprogramProfile?: MetaprogramProfile;
  disc?: DISCProfile;
}

/**
 * Safely extracts behavior from a contact with proper typing
 */
export function getContactBehavior(contact: Contact | null | undefined): ExtendedBehavior | null {
  if (!contact) return null;
  
  if (contact.behavior && typeof contact.behavior === 'object') {
    return contact.behavior as ExtendedBehavior;
  }
  
  return null;
}

/**
 * Gets VAK profile with fallback to defaults
 */
export function getVAKProfile(contact: Contact | null | undefined): VAKProfile {
  const behavior = getContactBehavior(contact);
  return behavior?.vakProfile || DEFAULT_VAK_PROFILE;
}

/**
 * Gets the dominant VAK type
 */
export function getDominantVAK(contact: Contact | null | undefined): 'V' | 'A' | 'K' {
  const vakProfile = getVAKProfile(contact);
  
  if (vakProfile.primary) return vakProfile.primary;
  
  if (vakProfile.visual >= vakProfile.auditory && vakProfile.visual >= vakProfile.kinesthetic) {
    return 'V';
  }
  if (vakProfile.auditory >= vakProfile.kinesthetic) {
    return 'A';
  }
  return 'K';
}

/**
 * Gets DISC profile with null fallback
 */
export function getDISCProfile(contact: Contact | null | undefined): DISCProfile {
  const behavior = getContactBehavior(contact);
  return behavior?.discProfile || behavior?.disc || null;
}

/**
 * Gets metaprogram profile with null fallback
 */
export function getMetaprogramProfile(contact: Contact | null | undefined): MetaprogramProfile | null {
  const behavior = getContactBehavior(contact);
  return behavior?.metaprogramProfile || null;
}

/**
 * Gets DISC confidence score
 */
export function getDISCConfidence(contact: Contact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.discConfidence || 0;
}

/**
 * Gets decision role with null fallback
 */
export function getDecisionRole(contact: Contact | null | undefined): DecisionRole | null {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionRole || null;
}

/**
 * Gets career stage with null fallback
 */
export function getCareerStage(contact: Contact | null | undefined): CareerStage | null {
  const behavior = getContactBehavior(contact);
  return behavior?.careerStage || null;
}

/**
 * Gets decision speed with null fallback
 */
export function getDecisionSpeed(contact: Contact | null | undefined): DecisionSpeed | null {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionSpeed || null;
}

/**
 * Gets decision power (1-10 scale)
 */
export function getDecisionPower(contact: Contact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionPower || 5;
}

/**
 * Gets support level (1-10 scale)
 */
export function getSupportLevel(contact: Contact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.supportLevel || 5;
}

/**
 * Checks if contact has complete behavioral profile
 */
export function hasCompleteBehaviorProfile(contact: Contact | null | undefined): boolean {
  const behavior = getContactBehavior(contact);
  if (!behavior) return false;
  
  return !!(
    behavior.discProfile && 
    behavior.vakProfile && 
    behavior.decisionRole
  );
}
