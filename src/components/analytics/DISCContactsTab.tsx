import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { cn } from '@/lib/utils';
import { ContactWithDISC } from './DISCAnalyticsTypes';

interface DISCContactsTabProps {
  contacts: ContactWithDISC[];
}

export const DISCContactsTab = ({ contacts }: DISCContactsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contatos Perfilados</CardTitle>
        <CardDescription>
          Lista de contatos com analise DISC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {contacts
              .sort((a, b) => b.relationshipScore - a.relationshipScore)
              .map(contact => (
                <Link
                  key={contact.id}
                  to={`/contatos/${contact.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <OptimizedAvatar
                    src={contact.avatar}
                    alt={`${contact.firstName} ${contact.lastName}`}
                    fallback={`${(contact.firstName || '?')[0]}${(contact.lastName || '?')[0]}`}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.companyName || 'Sem empresa'}
                    </p>
                  </div>
                  <DISCBadge profile={contact.discProfile} size="sm" />
                  {contact.discConfidence && (
                    <Badge variant="outline" className="text-xs">
                      {contact.discConfidence}% conf.
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      contact.relationshipScore >= 70 ? 'bg-emerald-500/10 text-emerald-600' :
                      contact.relationshipScore >= 40 ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    )}
                  >
                    {contact.relationshipScore}%
                  </Badge>
                </Link>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
