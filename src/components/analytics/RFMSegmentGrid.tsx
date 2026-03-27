import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RFM_SEGMENTS, RFMSegment } from '@/types/rfm';
import { SEGMENT_ICONS } from './RFMConstants';

interface SegmentCardProps {
  segmentKey: RFMSegment;
  segment: typeof RFM_SEGMENTS[RFMSegment];
  count: number;
  percentage: number;
  icon: React.ReactNode;
}

function SegmentCard({ segmentKey, segment, count, percentage, icon }: SegmentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${segment.bgColor} ${segment.color}`}>
            {icon}
          </div>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold">{segment.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
        </div>
        <div className="mt-4">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{percentage}% do total</span>
            <span className="text-xs text-muted-foreground">{segment.actionFocus}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RFMSegmentGridProps {
  segmentDistribution: Record<string, number>;
  totalAnalyzed: number;
}

export function RFMSegmentGrid({ segmentDistribution, totalAnalyzed }: RFMSegmentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(RFM_SEGMENTS).map(([key, segment]) => {
        const count = segmentDistribution[key as RFMSegment] || 0;
        const percentage = totalAnalyzed > 0
          ? Math.round((count / totalAnalyzed) * 100)
          : 0;

        return (
          <SegmentCard
            key={key}
            segmentKey={key as RFMSegment}
            segment={segment}
            count={count}
            percentage={percentage}
            icon={SEGMENT_ICONS[key as RFMSegment]}
          />
        );
      })}
    </div>
  );
}
