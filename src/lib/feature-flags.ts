type FeatureFlag =
  | 'DISC_ANALYSIS'
  | 'RFM_SCORING'
  | 'NLP_ANALYTICS'
  | 'COMMUNICATION_TRAINING'
  | 'EXTERNAL_DATA_SYNC'
  | 'PUSH_NOTIFICATIONS'
  | 'WEEKLY_DIGEST'
  | 'VOICE_TO_TEXT'
  | 'AI_INSIGHTS';

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  DISC_ANALYSIS: true,
  RFM_SCORING: true,
  NLP_ANALYTICS: true,
  COMMUNICATION_TRAINING: true,
  EXTERNAL_DATA_SYNC: true,
  PUSH_NOTIFICATIONS: true,
  WEEKLY_DIGEST: true,
  VOICE_TO_TEXT: true,
  AI_INSIGHTS: true,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Check env override first
  const envKey = `VITE_FF_${flag}`;
  const envValue = import.meta.env[envKey];
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  return DEFAULT_FLAGS[flag] ?? false;
}

export function getAllFlags(): Record<FeatureFlag, boolean> {
  return Object.keys(DEFAULT_FLAGS).reduce((acc, key) => {
    acc[key as FeatureFlag] = isFeatureEnabled(key as FeatureFlag);
    return acc;
  }, {} as Record<FeatureFlag, boolean>);
}
