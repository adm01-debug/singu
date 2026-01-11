import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Reusable container for page skeletons
const SkeletonPageContainer = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn("space-y-6", className)}
  >
    {children}
  </motion.div>
);

// Page Header Skeleton
const SkeletonPageHeader = ({ hasActions = true }: { hasActions?: boolean }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" variant="shimmer" />
      <Skeleton className="h-4 w-72" variant="shimmer" />
    </div>
    {hasActions && (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" variant="shimmer" />
        <Skeleton className="h-10 w-32" variant="shimmer" />
      </div>
    )}
  </div>
);

// Stats Grid Skeleton
const SkeletonStatsGrid = ({ count = 4 }: { count?: number }) => (
  <div className={cn(
    "grid gap-4",
    count <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  )}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <Skeleton className="h-8 w-16" variant="shimmer" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
          </div>
          <Skeleton className="h-3 w-32 mt-4" variant="shimmer" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Stat Card Skeleton (legacy support)
export const StatCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" variant="shimmer" />
          <Skeleton className="h-8 w-16" variant="shimmer" />
          <Skeleton className="h-3 w-20" variant="shimmer" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
      </div>
    </CardContent>
  </Card>
);

// Dashboard Stats Grid Skeleton (legacy support)
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// Chart Card Skeleton
export const ChartCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" variant="shimmer" />
        <Skeleton className="h-4 w-20" variant="shimmer" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-around gap-2 pt-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton 
              className="w-full rounded-t-md" 
              style={{ height: `${Math.random() * 60 + 40}%` }} 
              variant="shimmer"
            />
            <Skeleton className="h-3 w-8" variant="shimmer" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Contact Card Skeleton
export const ContactCardSkeleton = () => (
  <Card className="h-full overflow-hidden">
    <CardContent className="p-0">
      {/* Header gradient */}
      <Skeleton className="h-16 rounded-none" variant="shimmer" />
      
      {/* Avatar */}
      <div className="relative">
        <div className="absolute -top-8 left-5">
          <Skeleton className="w-16 h-16 rounded-full border-4 border-card" variant="shimmer" />
        </div>
      </div>
      
      <div className="pt-10 px-5 pb-5 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" variant="shimmer" />
          <Skeleton className="h-4 w-24" variant="shimmer" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
          <Skeleton className="h-4 w-28" variant="shimmer" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-6 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
        </div>
        
        <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <div className="ml-auto">
            <Skeleton className="h-4 w-20" variant="shimmer" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Company Card Skeleton
export const CompanyCardSkeleton = () => (
  <Card className="h-full">
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" variant="shimmer" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" variant="shimmer" />
            <Skeleton className="h-4 w-20" variant="shimmer" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" variant="shimmer" />
          <Skeleton className="h-4 w-32" variant="shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" variant="shimmer" />
          <Skeleton className="h-4 w-28" variant="shimmer" />
        </div>
      </div>
      
      <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
      
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Skeleton className="h-4 w-12" variant="shimmer" />
        <Skeleton className="h-4 w-24" variant="shimmer" />
      </div>
    </CardContent>
  </Card>
);

// Contacts Grid Skeleton
export const ContactsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <ContactCardSkeleton key={i} />
    ))}
  </div>
);

// Contacts List Skeleton
export const ContactsListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" variant="shimmer" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" variant="shimmer" />
                <Skeleton className="h-5 w-20 rounded-full" variant="shimmer" />
                <Skeleton className="h-5 w-5 rounded-full" variant="shimmer" />
              </div>
              <Skeleton className="h-4 w-48" variant="shimmer" />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1 text-right hidden sm:block">
                <Skeleton className="h-4 w-20" variant="shimmer" />
                <Skeleton className="h-3 w-16" variant="shimmer" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Companies Grid Skeleton
export const CompaniesGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <CompanyCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard Top Contacts Skeleton
export const TopContactsSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-6 w-48" variant="shimmer" />
      <Skeleton className="h-8 w-24" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" variant="shimmer" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" variant="shimmer" />
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" variant="shimmer" />
                <Skeleton className="h-5 w-5 rounded-full" variant="shimmer" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Insights Skeleton
export const InsightsSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-6 w-40" variant="shimmer" />
      <Skeleton className="h-8 w-24" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-border">
          <div className="flex items-start justify-between mb-2">
            <Skeleton className="h-5 w-24 rounded-full" variant="shimmer" />
            <Skeleton className="h-4 w-20" variant="shimmer" />
          </div>
          <Skeleton className="h-5 w-full mb-2" variant="shimmer" />
          <Skeleton className="h-4 w-3/4" variant="shimmer" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Activity Skeleton
export const ActivitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <Skeleton className="w-2 h-2 rounded-full" variant="shimmer" />
          <div className="flex-1 flex items-center justify-between">
            <Skeleton className="h-4 w-64" variant="shimmer" />
            <Skeleton className="h-4 w-24" variant="shimmer" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Interaction Card Skeleton
export const InteractionCardSkeleton = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" variant="shimmer" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" variant="shimmer" />
            <Skeleton className="h-4 w-24" variant="shimmer" />
          </div>
          <Skeleton className="h-4 w-32" variant="shimmer" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-md" variant="shimmer" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" variant="shimmer" />
        <Skeleton className="h-5 w-20 rounded-full" variant="shimmer" />
      </div>
    </CardContent>
  </Card>
);

// Interactions List Skeleton
export const InteractionsListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <InteractionCardSkeleton key={i} />
    ))}
  </div>
);

// Detail Page Header Skeleton
export const DetailHeaderSkeleton = () => (
  <div className="flex items-start gap-6 mb-8">
    <Skeleton className="w-24 h-24 rounded-2xl" variant="shimmer" />
    <div className="flex-1 space-y-3">
      <Skeleton className="h-8 w-48" variant="shimmer" />
      <Skeleton className="h-5 w-32" variant="shimmer" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
        <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
      </div>
    </div>
  </div>
);

// Calendar Skeleton
export const CalendarSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <div className="lg:col-span-3">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" variant="shimmer" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Week headers */}
          {[...Array(7)].map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 w-full rounded" variant="shimmer" />
          ))}
          {/* Calendar days */}
          {[...Array(35)].map((_, i) => (
            <Skeleton key={`day-${i}`} className="h-24 w-full rounded" variant="shimmer" />
          ))}
        </div>
      </Card>
    </div>
    <div>
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-4" variant="shimmer" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <Skeleton className="h-5 w-24" variant="shimmer" />
              <Skeleton className="h-4 w-full" variant="shimmer" />
              <Skeleton className="h-4 w-20" variant="shimmer" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ==================== NEW PAGE SKELETONS ====================

// Contacts Page Skeleton
export const ContactsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    
    {/* Filters */}
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-10 w-64" variant="shimmer" />
      <Skeleton className="h-10 w-32" variant="shimmer" />
      <Skeleton className="h-10 w-32" variant="shimmer" />
    </div>
    
    {/* Contacts Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </div>
  </SkeletonPageContainer>
);

// Companies Page Skeleton
export const CompaniesPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    
    {/* Stats */}
    <SkeletonStatsGrid count={3} />
    
    {/* Companies List */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" variant="shimmer" />
          <Skeleton className="h-10 w-40" variant="shimmer" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" variant="shimmer" />
                <Skeleton className="h-4 w-32" variant="shimmer" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </SkeletonPageContainer>
);

// Interactions Page Skeleton
export const InteractionsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    
    {/* Timeline */}
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                {i < 5 && <Skeleton className="h-16 w-0.5 mt-2" variant="shimmer" />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonAvatar size="sm" />
                    <Skeleton className="h-5 w-32" variant="shimmer" />
                  </div>
                  <Skeleton className="h-4 w-24" variant="shimmer" />
                </div>
                <Skeleton className="h-4 w-full" variant="shimmer" />
                <Skeleton className="h-4 w-3/4" variant="shimmer" />
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                  <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </SkeletonPageContainer>
);

// Analytics Page Skeleton
export const AnalyticsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    
    {/* Stats */}
    <SkeletonStatsGrid count={4} />
    
    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" variant="shimmer" />
              <Skeleton className="h-8 w-24" variant="shimmer" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" variant="shimmer" />
          </CardContent>
        </Card>
      ))}
    </div>
  </SkeletonPageContainer>
);

// Insights Page Skeleton
export const InsightsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    
    {/* Insights Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" variant="shimmer" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" variant="shimmer" />
                  <SkeletonText lines={2} />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-24" variant="shimmer" />
                    <Skeleton className="h-8 w-20" variant="shimmer" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonAvatar size="sm" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Calendar Page Skeleton
export const CalendarPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10" variant="shimmer" />
              <Skeleton className="h-6 w-40" variant="shimmer" />
              <Skeleton className="h-10 w-10" variant="shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" variant="shimmer" />
              <Skeleton className="h-10 w-24" variant="shimmer" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Day headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`header-${i}`} className="bg-muted p-2">
                <Skeleton className="h-4 w-8 mx-auto" variant="shimmer" />
              </div>
            ))}
            {/* Calendar days */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-card p-2 min-h-24">
                <Skeleton className="h-5 w-5 mb-2" variant="shimmer" />
                {i % 5 === 0 && <Skeleton className="h-4 w-full rounded" variant="shimmer" />}
                {i % 7 === 3 && <Skeleton className="h-4 w-3/4 rounded mt-1" variant="shimmer" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" variant="shimmer" />
                    <Skeleton className="h-3 w-20" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Settings Page Skeleton
export const SettingsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Settings Nav */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" variant="shimmer" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Settings Content */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-48" variant="shimmer" />
          <Skeleton className="h-4 w-72" variant="shimmer" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <Skeleton className="h-10 w-full" variant="shimmer" />
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-32" variant="shimmer" />
          </div>
        </CardContent>
      </Card>
    </div>
  </SkeletonPageContainer>
);

// Network Page Skeleton
export const NetworkPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" variant="shimmer" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" variant="shimmer" />
            <Skeleton className="h-10 w-10" variant="shimmer" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Network Graph Placeholder */}
        <div className="relative h-[500px] rounded-lg bg-muted/50 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Simulated network nodes */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <Skeleton className="h-12 w-12 rounded-full" variant="pulse" />
                </div>
              );
            })}
            <Skeleton className="h-16 w-16 rounded-full" variant="pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  </SkeletonPageContainer>
);

// Contact Detail Skeleton
export const ContactDetailSkeleton = () => (
  <SkeletonPageContainer>
    {/* Header */}
    <div className="flex items-start gap-6">
      <Skeleton className="h-24 w-24 rounded-2xl shrink-0" variant="shimmer" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-8 w-64" variant="shimmer" />
        <Skeleton className="h-5 w-48" variant="shimmer" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" variant="shimmer" />
        <Skeleton className="h-10 w-32" variant="shimmer" />
      </div>
    </div>
    
    {/* Tabs */}
    <div className="flex items-center gap-4 border-b pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24" variant="shimmer" />
      ))}
    </div>
    
    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" variant="shimmer" />
                    <Skeleton className="h-3 w-1/2" variant="shimmer" />
                  </div>
                  <Skeleton className="h-4 w-20" variant="shimmer" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" variant="shimmer" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" variant="shimmer" />
                <Skeleton className="h-4 w-32" variant="shimmer" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Page loading wrapper
export const PageSkeleton = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in">
    {children}
  </div>
);

// Export all page skeletons
export {
  SkeletonPageContainer,
  SkeletonPageHeader,
  SkeletonStatsGrid,
};
