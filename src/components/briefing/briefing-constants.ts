import { Phone, Calendar, Video, Eye, Ear, Hand, Cpu } from 'lucide-react';

export const interactionTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  video_call: Video,
};

export const vakIcons: Record<string, React.ElementType> = {
  Visual: Eye,
  Auditory: Ear,
  Kinesthetic: Hand,
  Digital: Cpu,
};

export const vakColors: Record<string, string> = {
  Visual: 'text-blue-500 bg-blue-500/10',
  Auditory: 'text-purple-500 bg-purple-500/10',
  Kinesthetic: 'text-orange-500 bg-orange-500/10',
  Digital: 'text-green-500 bg-green-500/10',
};
