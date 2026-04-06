import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Progressive Dashboard Skeleton — reveals sections in phases
 * Phase 0: instant → stats grid
 * Phase 1: 120ms → charts row 1
 * Phase 2: 250ms → charts row 2 + bottom
 */
const DashboardSkeleton = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div ref={ref} className="p-6 space-y-6">
      {/* Phase 0 — Stats Grid (instant) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {['Empresas', 'Contatos', 'Interações', 'Score'].map((label, i) => (
          <Card key={`stats-${i}`} className="overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 skeleton-progressive rounded-t-xl" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase 1 — Charts (120ms) */}
      {phase >= 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {[0, 1].map((i) => (
            <Card key={`chart-${i}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-end justify-around gap-2 pt-4">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="flex-1 flex flex-col items-center gap-2">
                      <Skeleton
                        className="w-full rounded-t-md skeleton-progressive"
                        style={{ height: `${30 + (j * 10)}%` }}
                      />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Phase 2 — Bottom Section (250ms) */}
      {phase >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
DashboardSkeleton.displayName = 'DashboardSkeleton';

export default DashboardSkeleton;
