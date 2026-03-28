import type { Tables } from '@/integrations/supabase/types';
import { Phone, Mail, Users, Video, MessageSquare } from 'lucide-react';
import { createElement } from 'react';

export type Interaction = Tables<'interactions'>;
export type Contact = Tables<'contacts'>;
export type Company = Tables<'companies'>;

export interface FollowUp extends Interaction {
  contact?: Contact | null;
  company?: Company | null;
}

export const interactionTypeIcons: Record<string, React.ReactNode> = {
  call: createElement(Phone, { className: 'w-4 h-4' }),
  email: createElement(Mail, { className: 'w-4 h-4' }),
  meeting: createElement(Users, { className: 'w-4 h-4' }),
  video_call: createElement(Video, { className: 'w-4 h-4' }),
  whatsapp: createElement(MessageSquare, { className: 'w-4 h-4' }),
  other: createElement(MessageSquare, { className: 'w-4 h-4' }),
};

export const interactionTypeLabels: Record<string, string> = {
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  video_call: 'Videochamada',
  whatsapp: 'WhatsApp',
  other: 'Outro',
};
