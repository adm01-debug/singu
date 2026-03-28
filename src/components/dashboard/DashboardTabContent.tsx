import { useState, lazy } from 'react';
import { Calendar, BarChart3, Target, ShoppingBag } from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { LazySection } from '@/components/dashboard/LazySection';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { TabsContent } from '@/components/ui/tabs';
import {
  ActivityChart,
  RelationshipEvolutionChart,
  ContactDistributionChart,
  RelationshipScoreChart,
  SentimentChart,
  type PeriodFilter,
} from '@/components/dashboard/DashboardCharts';
import type { Contact, Interaction } from '@/types';

// Lazy-loaded components
const SmartRemindersPanel = lazy(() => import('@/components/smart-reminders/SmartRemindersPanel').then(m => ({ default: m.SmartRemindersPanel })));
const RelationshipStatsPanel = lazy(() => import('@/components/dashboard/RelationshipStatsPanel').then(m => ({ default: m.RelationshipStatsPanel })));
const PortfolioHealthDashboard = lazy(() => import('@/components/dashboard/PortfolioHealthDashboard').then(m => ({ default: m.PortfolioHealthDashboard })));
const HealthAlertsPanel = lazy(() => import('@/components/dashboard/HealthAlertsPanel').then(m => ({ default: m.HealthAlertsPanel })));
const ImportantDatesCalendar = lazy(() => import('@/components/dashboard/ImportantDatesCalendar').then(m => ({ default: m.ImportantDatesCalendar })));
const CompatibilityAlertsList = lazy(() => import('@/components/triggers/CompatibilityAlertsList').then(m => ({ default: m.CompatibilityAlertsList })));
const ClosingScoreAlertsList = lazy(() => import('@/components/analytics/ClosingScoreAlertsList').then(m => ({ default: m.ClosingScoreAlertsList })));
const ClosingScoreRanking = lazy(() => import('@/components/analytics/ClosingScoreRanking').then(m => ({ default: m.ClosingScoreRanking })));
const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));
const PurchasePatternsPanel = lazy(() => import('@/components/analytics/PurchasePatternsPanel').then(m => ({ default: m.PurchasePatternsPanel })));
const BehaviorAlertsPanel = lazy(() => import('@/components/analytics/BehaviorAlertsPanel').then(m => ({ default: m.BehaviorAlertsPanel })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));
const DISCCompatibilityAlerts = lazy(() => import('@/components/disc').then(m => ({ default: m.DISCCompatibilityAlerts })));

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

// --- Overview Tab ---

interface OverviewTabProps {
  mappedContacts: Contact[];
  mappedInteractions: Interaction[];
  recentActivityNode: React.ReactNode;
  topContactsNode: React.ReactNode;
}

export const OverviewTabContent = ({
  mappedContacts,
  mappedInteractions,
  recentActivityNode,
  topContactsNode,
}: OverviewTabProps) => (
  <TabsContent value="overview" className="space-y-6 mt-0">
    {/* Portfolio Health */}
    <DashboardErrorBoundary sectionName="Saúde do Portfólio">
      <LazySection fallbackVariant="card" fallbackHeight="h-48">
        <PortfolioHealthDashboard
          contacts={mappedContacts}
          interactions={mappedInteractions}
        />
      </LazySection>
    </DashboardErrorBoundary>

    {/* Important Dates */}
    <DashboardErrorBoundary sectionName="Datas Importantes">
      <LazySection fallbackVariant="list" fallbackHeight="h-48">
        <ImportantDatesCalendar
          contacts={mappedContacts}
          interactions={mappedInteractions}
        />
      </LazySection>
    </DashboardErrorBoundary>

    {/* Recent Activity + Top Contacts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DashboardErrorBoundary sectionName="Atividade Recente">
        {recentActivityNode}
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
        {topContactsNode}
      </DashboardErrorBoundary>
    </div>

    {/* Smart Reminders + Health Alerts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardErrorBoundary sectionName="Alertas e Lembretes">
        <div className="space-y-6">
          <LazySection fallbackVariant="list">
            <SmartRemindersPanel compact />
          </LazySection>
          <LazySection fallbackVariant="card">
            <HealthAlertsPanel />
          </LazySection>
        </div>
      </DashboardErrorBoundary>
      <DashboardErrorBoundary sectionName="Compatibilidade">
        <div className="space-y-6">
          <LazySection fallbackVariant="list">
            <DISCCompatibilityAlerts compact maxItems={3} />
          </LazySection>
          <LazySection fallbackVariant="list">
            <CompatibilityAlertsList maxItems={3} />
          </LazySection>
        </div>
      </DashboardErrorBoundary>
    </div>
  </TabsContent>
);

// --- Analytics Tab ---

export const AnalyticsTabContent = () => {
  const [period, setPeriod] = useState<PeriodFilter>('7d');

  return (
    <TabsContent value="analytics" className="space-y-6 mt-0">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-5 h-5" aria-hidden="true" />
          <Typography variant="body" className="font-medium">Período dos Gráficos</Typography>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(option.value)}
              className={`transition-all ${
                period === option.value
                  ? 'shadow-sm'
                  : 'hover:bg-secondary'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <DashboardErrorBoundary sectionName="Gráficos de Atividade">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityChart period={period} />
          <RelationshipEvolutionChart period={period} />
        </div>
      </DashboardErrorBoundary>

      {/* Charts Row 2 */}
      <DashboardErrorBoundary sectionName="Distribuição e Scores">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ContactDistributionChart />
          <RelationshipScoreChart period={period} />
          <SentimentChart period={period} />
        </div>
      </DashboardErrorBoundary>
    </TabsContent>
  );
};

// --- Relationships Tab ---

export const RelationshipsTabContent = () => (
  <TabsContent value="relationships" className="space-y-6 mt-0">
    {/* Relationship Statistics */}
    <DashboardErrorBoundary sectionName="Estatísticas de Relacionamento">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
        <Typography variant="h4" gradient>Estatísticas de Relacionamento</Typography>
      </div>
      <LazySection fallbackVariant="chart" fallbackHeight="h-64">
        <RelationshipStatsPanel />
      </LazySection>
    </DashboardErrorBoundary>

    {/* Closing Score */}
    <DashboardErrorBoundary sectionName="Score de Fechamento">
      <LazySection fallbackVariant="list">
        <ClosingScoreRanking maxItems={5} showStats={false} compact />
      </LazySection>
      <LazySection fallbackVariant="list" className="mt-6">
        <ClosingScoreAlertsList maxItems={3} compact />
      </LazySection>
    </DashboardErrorBoundary>
  </TabsContent>
);

// --- Intelligence Tab ---

export const IntelligenceTabContent = () => (
  <TabsContent value="intelligence" className="space-y-6 mt-0">
    {/* Purchase Patterns */}
    <DashboardErrorBoundary sectionName="Padrões de Compra">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
        <Typography variant="h4" gradient>Padrões de Compra e Comportamento</Typography>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazySection fallbackVariant="chart">
          <PurchasePatternsPanel compact />
        </LazySection>
        <LazySection fallbackVariant="card">
          <BehaviorAlertsPanel compact />
        </LazySection>
      </div>
    </DashboardErrorBoundary>

    {/* Business Intelligence */}
    <DashboardErrorBoundary sectionName="Inteligência de Negócios">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" aria-hidden="true" />
        <Typography variant="h4" gradient>Inteligência de Negócios</Typography>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LazySection fallbackVariant="chart">
          <ChurnPredictionPanel compact />
        </LazySection>
        <LazySection fallbackVariant="chart">
          <BestTimeToContactPanel compact />
        </LazySection>
        <LazySection fallbackVariant="chart">
          <DealVelocityPanel compact />
        </LazySection>
      </div>

      <div className="mt-6">
        <LazySection fallbackVariant="chart" fallbackHeight="h-64">
          <RFMAnalysisPanel compact />
        </LazySection>
      </div>
    </DashboardErrorBoundary>
  </TabsContent>
);
