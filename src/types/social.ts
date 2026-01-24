// Tipos para o sistema de monitoramento de redes sociais

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram';

export type LifeEventType = 
  | 'promotion'
  | 'new_job'
  | 'company_change'
  | 'certification'
  | 'education'
  | 'anniversary'
  | 'post_viral'
  | 'engagement_spike';

export type InfluenceLevel = 
  | 'thought_leader'
  | 'active_contributor'
  | 'passive_observer'
  | 'lurker';

export interface PersonalityTraits {
  openness: { score: number; indicators: string[] };
  conscientiousness: { score: number; indicators: string[] };
  extraversion: { score: number; indicators: string[] };
  agreeableness: { score: number; indicators: string[] };
  neuroticism: { score: number; indicators: string[] };
}

export interface CommunicationStyle {
  formality: 'formal' | 'informal' | 'balanced';
  approach: 'technical' | 'emotional' | 'balanced';
  directness: 'direct' | 'indirect' | 'balanced';
  preferred_format: 'visual' | 'textual' | 'balanced';
  tips: string[];
}

export interface SalesInsights {
  best_approaches: string[];
  rapport_topics: string[];
  decision_triggers: string[];
  avoid: string[];
  optimal_contact_time: string;
  preferred_channel: string;
}

export const LIFE_EVENT_CONFIG: Record<LifeEventType, {
  icon: string;
  color: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
}> = {
  promotion: {
    icon: '🎉',
    color: 'bg-success/10 text-success border-success/20',
    label: 'Promoção',
    priority: 'high',
  },
  new_job: {
    icon: '💼',
    color: 'bg-info/10 text-info border-info/20',
    label: 'Novo Emprego',
    priority: 'high',
  },
  company_change: {
    icon: '🏢',
    color: 'bg-warning/10 text-warning border-warning/20',
    label: 'Mudança de Empresa',
    priority: 'high',
  },
  certification: {
    icon: '📜',
    color: 'bg-primary/10 text-primary border-primary/20',
    label: 'Nova Certificação',
    priority: 'medium',
  },
  education: {
    icon: '🎓',
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    label: 'Educação',
    priority: 'medium',
  },
  anniversary: {
    icon: '🎂',
    color: 'bg-accent/10 text-accent-foreground border-accent/20',
    label: 'Aniversário de Empresa',
    priority: 'medium',
  },
  post_viral: {
    icon: '🔥',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    label: 'Post Viral',
    priority: 'high',
  },
  engagement_spike: {
    icon: '📈',
    color: 'bg-success/10 text-success border-success/20',
    label: 'Crescimento de Engajamento',
    priority: 'low',
  },
};

export const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: string;
  icon: string;
  color: string;
  placeholder: string;
}> = {
  linkedin: {
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: 'text-[#0A66C2]',
    placeholder: 'https://linkedin.com/in/username',
  },
  twitter: {
    name: 'Twitter/X',
    icon: 'Twitter',
    color: 'text-[#1DA1F2]',
    placeholder: 'https://twitter.com/username',
  },
  instagram: {
    name: 'Instagram',
    icon: 'Instagram',
    color: 'text-[#E4405F]',
    placeholder: 'https://instagram.com/username',
  },
};

export const INFLUENCE_LEVEL_CONFIG: Record<InfluenceLevel, {
  label: string;
  description: string;
  color: string;
}> = {
  thought_leader: {
    label: 'Líder de Pensamento',
    description: 'Cria conteúdo original, alta visibilidade',
    color: 'bg-success text-success-foreground',
  },
  active_contributor: {
    label: 'Contribuidor Ativo',
    description: 'Engaja frequentemente, compartilha insights',
    color: 'bg-info text-info-foreground',
  },
  passive_observer: {
    label: 'Observador Passivo',
    description: 'Consome mais do que produz',
    color: 'bg-warning text-warning-foreground',
  },
  lurker: {
    label: 'Lurker',
    description: 'Presença mínima nas redes',
    color: 'bg-muted text-muted-foreground',
  },
};
