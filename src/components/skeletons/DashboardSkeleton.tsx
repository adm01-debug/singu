import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard complete skeleton
const DashboardSkeleton = React.forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="p-6 space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Contatos', 'Empresas', 'Interações', 'Score Médio'].map((label, i) => (
          <Card key={`stats-card-${i}`} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-32 rounded" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={`chart-row1-${i}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around gap-2 pt-4">
                {[...Array(7)].map((_, j) => (
                  <div key={`bar-${i}-${j}`} className="flex-1 flex flex-col items-center gap-2">
                    <Skeleton 
                      className="w-full rounded-t-md" 
                      style={{ height: `${40 + (j * 8)}%` }} 
                    />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pie chart skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <Skeleton className="w-48 h-48 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Bar chart skeletons */}
        {[...Array(2)].map((_, i) => (
          <Card key={`bar-chart-${i}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {[...Array(5)].map((_, j) => (
                  <div key={`bar-item-${i}-${j}`} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 flex-1 rounded" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contacts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={`contact-${i}`} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-1 text-right hidden sm:block">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`insight-${i}`} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={`activity-${i}`} className="flex items-center gap-4 p-3 rounded-lg">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1 flex items-center justify-between">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
});
DashboardSkeleton.displayName = 'DashboardSkeleton';

export default DashboardSkeleton;
