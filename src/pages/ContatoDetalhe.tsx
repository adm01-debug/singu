import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Video } from 'lucide-react';
import { formatContactName, pluralize } from '@/lib/formatters';
import { PageHeader } from '@/components/navigation/PageHeader';
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
  ContactDataTab,
} from '@/components/contact-detail';
import { RelationshipTimeline } from '@/components/contact-detail/RelationshipTimeline';
import { MeetingMode } from '@/components/contact-detail/MeetingMode';

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
  const [meetingMode, setMeetingMode] = useState(false);

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
    <>
    <AppLayout>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        {/* Breadcrumb + Lux */}
        <PageHeader
          backTo="/contatos"
          backLabel="Contatos"
          title={formatContactName(contact.first_name, contact.last_name)}
          actions={
            <LuxButton
              onClick={handleTriggerLux}
              loading={triggering}
              processing={isProcessing}
              variant="header"
            />
          }
        />

        {/* Header Card */}
        <ContactDetailHeader
          contact={contact}
          company={company}
          interactionCount={interactions.length}
        />

        {/* Meeting Mode Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMeetingMode(true)}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
            Modo Reunião
          </Button>
        </div>

        {/* Proactive Intelligence Panel */}
        <ProactiveIntelligencePanel
          data={proactiveIntelligence}
          contactName={formatContactName(contact.first_name, contact.last_name)}
        />

        {/* Tab Navigation */}
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="w-full overflow-x-auto scrollbar-hide flex h-auto gap-1 bg-muted/50 p-1 md:flex-wrap">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="interacoes" className="text-xs sm:text-sm">
              {pluralize(interactions.length, 'Interação', 'Interações')}
            </TabsTrigger>
            <TabsTrigger value="comportamental" className="text-xs sm:text-sm">Comportamental</TabsTrigger>
            <TabsTrigger value="inteligencia" className="text-xs sm:text-sm">Inteligência</TabsTrigger>
            <TabsTrigger value="comercial" className="text-xs sm:text-sm">Comercial</TabsTrigger>
            <TabsTrigger value="lux" className="text-xs sm:text-sm">Lux Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <div className="space-y-4">
              <ContactOverviewTab
                contact={contact}
                company={company}
                insights={insights}
                alerts={alerts}
                onDismissAlert={dismissAlert}
                onDismissInsight={dismissInsight}
              />
              <RelationshipTimeline
                interactions={interactions}
                contact={contact}
              />
            </div>
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
            <ContactIntelligenceTab
              contactId={contact.id}
              contactName={formatContactName(contact.first_name, contact.last_name)}
              linkedinUrl={contact.linkedin}
              websiteUrl={company?.website}
            />
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

    {/* Meeting Mode Overlay */}
    <MeetingMode
      contact={contact}
      interactions={interactions}
      open={meetingMode}
      onClose={() => setMeetingMode(false)}
    />
    </>
  );
};

export default ContatoDetalhe;
