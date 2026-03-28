import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const InsightsLoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-5 mb-2" />
            <Skeleton className="w-full h-4 mb-1" />
            <Skeleton className="w-2/3 h-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
