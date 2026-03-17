import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { useProactiveIntelligence } from '@/hooks/useProactiveIntelligence';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import { ProactiveIntelligencePanel } from '@/components/proactive-intelligence/ProactiveIntelligencePanel';
import {
  ContactDetailHeader,
  ContactOverviewTab,
  ContactInteractionsTab,
  ContactBehavioralTab,
  ContactIntelligenceTab,
  ContactCommercialTab,
} from '@/components/contact-detail';

const ContactDetailSkeleton = () => (
  <AppLayout>
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      <Skeleton className="h-5 w-56" />
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  </AppLayout>
);

const ContatoDetalhe = () => {
  const { id } = useParams();
  const { contact, company, interactions, insights, alerts, loading, error, refetch, dismissAlert, dismissInsight } = useContactDetail(id);
  const { trackView } = useRecentlyViewed();
  const { records: luxRecords, latestRecord, loading: luxLoading, triggering, triggerLux } = useLuxIntelligence('contact', id);
  const proactiveIntelligence = useProactiveIntelligence(contact, interactions);

  useEffect(() => {
    if (contact && id) {
      trackView({
        id,
        type: 'contact',
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        subtitle: contact.role_title || undefined,
        avatarUrl: contact.avatar_url || undefined,
      });
    }
  }, [contact, id, trackView]);

  const handleTriggerLux = () => {
    if (!contact) return;
    triggerLux({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      linkedin: contact.linkedin,
      instagram: contact.instagram,
      twitter: contact.twitter,
      company_name: company?.name,
    });
  };

  if (loading) return <ContactDetailSkeleton />;

  if (error || !contact) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Contato não encontrado'}</p>
          <Link to="/contatos">
            <Button variant="link">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar para contatos
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isProcessing = latestRecord?.status === 'processing';

  return (
    <AppLayout>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        {/* Breadcrumb + Lux */}
        <nav aria-label="breadcrumb" className="flex items-center justify-between">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/contatos" className="transition-colors hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Contatos
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground">
              {contact.first_name} {contact.last_name}
            </li>
          </ol>
          <LuxButton
            onClick={handleTriggerLux}
            loading={triggering}
            processing={isProcessing}
            variant="header"
          />
        </nav>

        {/* Header Card */}
        <ContactDetailHeader
          contact={contact}
          company={company}
          interactionCount={interactions.length}
        />

        {/* Proactive Intelligence Panel */}
        <ProactiveIntelligencePanel
          data={proactiveIntelligence}
          contactName={`${contact.first_name} ${contact.last_name}`}
        />

        {/* Tab Navigation */}
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="interacoes" className="text-xs sm:text-sm">
              Interações ({interactions.length})
            </TabsTrigger>
            <TabsTrigger value="comportamental" className="text-xs sm:text-sm">Comportamental</TabsTrigger>
            <TabsTrigger value="inteligencia" className="text-xs sm:text-sm">Inteligência</TabsTrigger>
            <TabsTrigger value="comercial" className="text-xs sm:text-sm">Comercial</TabsTrigger>
            <TabsTrigger value="lux" className="text-xs sm:text-sm">Lux Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <ContactOverviewTab
              contact={contact}
              company={company}
              insights={insights}
              alerts={alerts}
              onDismissAlert={dismissAlert}
              onDismissInsight={dismissInsight}
            />
          </TabsContent>

          <TabsContent value="interacoes">
            <ContactInteractionsTab
              interactions={interactions}
              contact={contact}
              companyId={contact.company_id}
              onInteractionAdded={refetch}
            />
          </TabsContent>

          <TabsContent value="comportamental">
            <ContactBehavioralTab contact={contact} />
          </TabsContent>

          <TabsContent value="inteligencia">
            <ContactIntelligenceTab contactId={contact.id} />
          </TabsContent>

          <TabsContent value="comercial">
            <ContactCommercialTab contactId={contact.id} />
          </TabsContent>

          <TabsContent value="lux">
            <Card>
              <CardContent className="pt-6">
                <LuxIntelligencePanel
                  record={latestRecord}
                  records={luxRecords}
                  entityType="contact"
                  loading={luxLoading}
                  onTrigger={handleTriggerLux}
                  triggering={triggering}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ContatoDetalhe;
