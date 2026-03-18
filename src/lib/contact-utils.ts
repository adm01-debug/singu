/**
 * Type-safe utilities for working with Contact behavior data
 */

import { Contact, ContactBehavior, VAKProfile, DISCProfile, DecisionRole, CareerStage, DecisionSpeed } from '@/types';
import { Json } from '@/integrations/supabase/types';

// Type for raw Supabase contact (from Tables<'contacts'>)
interface RawContact {
  behavior?: Json | null;
  [key: string]: unknown;
}

// Default VAK Profile
export const DEFAULT_VAK_PROFILE: VAKProfile = {
  visual: 33,
  auditory: 33,
  kinesthetic: 34,
  primary: 'V'
};

// Metaprogram Profile Interface - matches types/metaprograms.ts
export interface MetaprogramProfile {
  motivationDirection?: 'toward' | 'away_from' | 'balanced';
  referenceFrame?: 'internal' | 'external' | 'balanced';
  workingStyle?: 'options' | 'procedures' | 'balanced';
  chunkSize?: 'general' | 'specific' | 'balanced';
  actionFilter?: 'proactive' | 'reactive' | 'balanced';
  comparisonStyle?: 'sameness' | 'difference' | 'balanced';
}

// Extended behavior that includes optional NLP/metaprogram data
export interface ExtendedBehavior extends Partial<ContactBehavior> {
  vakProfile?: VAKProfile;
  metaprogramProfile?: MetaprogramProfile;
  disc?: DISCProfile;
}

/**
 * Safely extracts behavior from a contact with proper typing
 * Supports both app Contact type and raw Supabase Tables<'contacts'> type
 */
export function getContactBehavior(contact: Contact | RawContact | null | undefined): ExtendedBehavior | null {
  if (!contact) return null;
  
  const behavior = contact.behavior;
  if (behavior && typeof behavior === 'object' && !Array.isArray(behavior)) {
    return behavior as ExtendedBehavior;
  }
  
  return null;
}

/**
 * Gets VAK profile with fallback to defaults
 */
export function getVAKProfile(contact: Contact | RawContact | null | undefined): VAKProfile {
  const behavior = getContactBehavior(contact);
  return behavior?.vakProfile || DEFAULT_VAK_PROFILE;
}

/**
 * Gets the dominant VAK type
 */
export function getDominantVAK(contact: Contact | RawContact | null | undefined): 'V' | 'A' | 'K' {
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
export function getDISCProfile(contact: Contact | RawContact | null | undefined): DISCProfile | null {
  const behavior = getContactBehavior(contact);
  return behavior?.discProfile || behavior?.disc || null;
}

/**
 * Gets metaprogram profile with null fallback
 */
export function getMetaprogramProfile(contact: Contact | RawContact | null | undefined): MetaprogramProfile | null {
  const behavior = getContactBehavior(contact);
  return behavior?.metaprogramProfile || null;
}

/**
 * Gets DISC confidence score
 */
export function getDISCConfidence(contact: Contact | RawContact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.discConfidence || 0;
}

/**
 * Gets decision role with null fallback
 */
export function getDecisionRole(contact: Contact | RawContact | null | undefined): DecisionRole | null {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionRole || null;
}

/**
 * Gets career stage with null fallback
 */
export function getCareerStage(contact: Contact | RawContact | null | undefined): CareerStage | null {
  const behavior = getContactBehavior(contact);
  return behavior?.careerStage || null;
}

/**
 * Gets decision speed with null fallback
 */
export function getDecisionSpeed(contact: Contact | RawContact | null | undefined): DecisionSpeed | null {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionSpeed || null;
}

/**
 * Gets decision power (1-10 scale)
 */
export function getDecisionPower(contact: Contact | RawContact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.decisionPower || 5;
}

/**
 * Gets support level (1-10 scale)
 */
export function getSupportLevel(contact: Contact | RawContact | null | undefined): number {
  const behavior = getContactBehavior(contact);
  return behavior?.supportLevel || 5;
}

/**
 * Checks if contact has complete behavioral profile
 */
export function hasCompleteBehaviorProfile(contact: Contact | RawContact | null | undefined): boolean {
  const behavior = getContactBehavior(contact);
  if (!behavior) return false;
  
  return !!(
    behavior.discProfile && 
    behavior.vakProfile && 
    behavior.decisionRole
  );
}
