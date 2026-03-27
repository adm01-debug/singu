import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RFM_SEGMENTS, RFMSegment, RFMAnalysis, RFMAction, CommunicationPriority } from '@/types/rfm';
import { SEGMENT_ICONS } from './RFMConstants';

interface RFMActionsOverviewProps {
  rfmData: RFMAnalysis[];
}

export function RFMActionsOverview({ rfmData }: RFMActionsOverviewProps) {
  const actionsByPriority = useMemo(() => {
    const urgent: { contactId: string; segment: RFMSegment; actions: RFMAction[]; priority: CommunicationPriority }[] = [];
    const high: typeof urgent = [];
    const medium: typeof urgent = [];

    rfmData.forEach(rfm => {
      const item = {
        contactId: rfm.contactId,
        segment: rfm.segment,
        actions: rfm.recommendedActions,
        priority: rfm.communicationPriority
      };

      if (rfm.communicationPriority === 'urgent') urgent.push(item);
      else if (rfm.communicationPriority === 'high') high.push(item);
      else medium.push(item);
    });

    return { urgent, high, medium };
  }, [rfmData]);

  return (
    <div className="space-y-6">
      {/* Urgent Actions */}
      {actionsByPriority.urgent.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Ações Urgentes ({actionsByPriority.urgent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionsByPriority.urgent.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-background rounded-lg">
                  <div className={`p-2 rounded-lg ${RFM_SEGMENTS[item.segment as RFMSegment].bgColor}`}>
                    {SEGMENT_ICONS[item.segment as RFMSegment]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.actions[0]?.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.actions[0]?.description}
                    </div>
                  </div>
                  <Link to={`/contatos/${item.contactId}`}>
                    <Button size="sm">Ver Contato</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority */}
      {actionsByPriority.high.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Bell className="h-5 w-5" />
              Alta Prioridade ({actionsByPriority.high.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionsByPriority.high.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {SEGMENT_ICONS[item.segment as RFMSegment]}
                    <span>{item.actions[0]?.action}</span>
                  </div>
                  <Link to={`/contatos/${item.contactId}`}>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
