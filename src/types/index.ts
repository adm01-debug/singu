// Core Types for RelateIQ System

export type ContactRole = 'owner' | 'manager' | 'buyer' | 'contact' | 'decision_maker' | 'influencer';

export type InteractionType = 'whatsapp' | 'call' | 'email' | 'meeting' | 'note' | 'social';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
  notes?: string;
  tags: string[];
  contactCount: number;
  lastInteraction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  role: ContactRole;
  roleTitle: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  avatar?: string;
  birthday?: Date;
  notes?: string;
  tags: string[];
  // Personality Insights
  communicationStyle?: 'formal' | 'casual' | 'technical' | 'emotional';
  preferredContactMethod?: 'whatsapp' | 'call' | 'email' | 'meeting';
  bestTimeToContact?: string;
  // Personal Interests
  hobbies: string[];
  interests: string[];
  familyInfo?: string;
  // Relationship
  relationshipScore: number; // 0-100
  lastInteraction?: Date;
  interactionCount: number;
  sentiment: SentimentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  contactId: string;
  companyId: string;
  type: InteractionType;
  title: string;
  content: string;
  audioUrl?: string;
  transcription?: string;
  sentiment: SentimentType;
  tags: string[];
  duration?: number; // in seconds for calls
  attachments?: string[];
  createdAt: Date;
}

export interface Insight {
  id: string;
  contactId: string;
  category: 'personality' | 'preference' | 'behavior' | 'opportunity';
  title: string;
  description: string;
  confidence: number; // 0-100
  source: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: 'company_created' | 'contact_created' | 'interaction_added' | 'insight_generated' | 'tag_added';
  entityType: 'company' | 'contact' | 'interaction';
  entityId: string;
  entityName: string;
  description: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  interactionsThisWeek: number;
  averageRelationshipScore: number;
  topCompanies: Company[];
  recentActivities: Activity[];
  upcomingFollowUps: Contact[];
}
