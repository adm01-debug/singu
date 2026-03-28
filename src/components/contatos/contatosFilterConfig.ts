import { Crown, Briefcase, ShoppingCart, User } from 'lucide-react';
import type { FilterConfig, SortOption } from '@/components/filters/AdvancedFilters';

export const filterConfigs: FilterConfig[] = [
  {
    key: 'role',
    label: 'Papel',
    multiple: true,
    options: [
      { value: 'owner', label: 'Proprietário', icon: Crown },
      { value: 'manager', label: 'Gerente', icon: Briefcase },
      { value: 'buyer', label: 'Comprador', icon: ShoppingCart },
      { value: 'contact', label: 'Contato', icon: User },
    ],
  },
  {
    key: 'sentiment',
    label: 'Sentimento',
    multiple: false,
    options: [
      { value: 'positive', label: 'Positivo' },
      { value: 'neutral', label: 'Neutro' },
      { value: 'negative', label: 'Negativo' },
    ],
  },
  {
    key: 'relationship_stage',
    label: 'Estágio',
    multiple: true,
    options: [
      { value: 'lead', label: 'Lead' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'negotiation', label: 'Negociação' },
      { value: 'client', label: 'Cliente' },
      { value: 'partner', label: 'Parceiro' },
      { value: 'churned', label: 'Inativo' },
      { value: 'unknown', label: 'Desconhecido' },
    ],
  },
];

export const sortOptions: SortOption[] = [
  { value: 'first_name', label: 'Nome' },
  { value: 'relationship_score', label: 'Score de Relacionamento' },
  { value: 'created_at', label: 'Data de Criação' },
  { value: 'updated_at', label: 'Última Atualização' },
];
