import { Calendar, Cake, Thermometer, Star } from 'lucide-react';

export const typeIcons = {
  follow_up: Calendar,
  birthday: Cake,
  decay: Thermometer,
  milestone: Star
};

export const typeLabels = {
  follow_up: 'Follow-up',
  birthday: 'Aniversário',
  decay: 'Esfriando',
  milestone: 'Marco'
};

export const typeColors = {
  follow_up: 'text-blue-500 bg-blue-500/10',
  birthday: 'text-amber-500 bg-amber-500/10',
  decay: 'text-red-500 bg-red-500/10',
  milestone: 'text-emerald-500 bg-emerald-500/10'
};

export const priorityColors = {
  high: 'border-l-red-500 bg-red-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-emerald-500 bg-emerald-500/5'
};

export const priorityBadgeColors = {
  high: 'bg-red-500/10 text-red-600 border-red-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
};
