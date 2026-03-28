// Shared types and constants for DISC Analytics components

import { DISCProfile } from '@/types';

export interface ContactWithDISC {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  discProfile: DISCProfile;
  discConfidence?: number;
  relationshipScore: number;
  companyName?: string;
}

export const DISC_COLORS = {
  D: 'hsl(0, 84%, 60%)',      // Red
  I: 'hsl(45, 93%, 47%)',     // Yellow/Orange
  S: 'hsl(142, 76%, 36%)',    // Green
  C: 'hsl(217, 91%, 60%)'     // Blue
};

export const DISC_BG_COLORS = {
  D: 'bg-red-500/10 text-red-600',
  I: 'bg-amber-500/10 text-amber-600',
  S: 'bg-emerald-500/10 text-emerald-600',
  C: 'bg-blue-500/10 text-blue-600'
};

export interface DISCStats {
  totalProfiled: number;
  avgConfidence: number;
  mostCommon: DISCProfile;
  recentAnalyses: number;
}

export interface DistributionDataItem {
  name: string;
  value: number;
  profile: string;
  color: string;
}

export interface BlendDataItem {
  blend: string;
  count: number;
}

export interface RadarDataItem {
  profile: string;
  score: number;
  fullMark: number;
}
