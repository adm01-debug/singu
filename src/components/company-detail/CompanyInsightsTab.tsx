import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { DISCProfile } from '@/types';

type Contact = Tables<'contacts'>;

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

interface CompanyInsightsTabProps {
  companyId: string;
  contacts: Contact[];
  avgRelationshipScore: number;
  totalInteractions: number;
  positiveInteractions: number;
  pendingFollowUps: number;
}

export function CompanyInsightsTab({ 
  companyId, contacts, avgRelationshipScore, 
  totalInteractions, positiveInteractions, pendingFollowUps 
}: CompanyInsightsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AccountChurnPredictionPanel companyId={companyId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Relationship Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Saúde do Relacionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{avgRelationshipScore}%</div>
            <p className="text-sm text-muted-foreground">
              Score médio de relacionamento com {contacts.length} contatos
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0%</span><span>100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                  style={{ width: `${avgRelationshipScore}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Interações</span>
                <span className="font-semibold">{totalInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interações Positivas</span>
                <span className="font-semibold text-success">{positiveInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Follow-ups Pendentes</span>
                <span className={`font-semibold ${pendingFollowUps > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {pendingFollowUps}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos Chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contacts.slice(0, 6).map(contact => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  return (
                    <Link key={contact.id} to={`/contatos/${contact.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <OptimizedAvatar 
                          src={contact.avatar_url || undefined}
                          alt={`${contact.first_name} ${contact.last_name}`}
                          fallback={`${safeInitial(contact.first_name)}${safeInitial(contact.last_name)}`}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <div className="flex items-center gap-1">
                            {behavior?.discProfile && (
                              <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                            )}
                            <span className="text-xs text-muted-foreground">{contact.relationship_score}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
