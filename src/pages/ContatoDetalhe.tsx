import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';

const ContactDetailSkeleton = () => (
  <AppLayout>
    <div className="min-h-screen p-6">
      <Skeleton className="h-5 w-56 mb-4" />
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

const ContatoDetalhe = () => {
  const { id } = useParams();
  const { contact, company, loading, error } = useContactDetail(id);
  const { trackView } = useRecentlyViewed();

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

  if (loading) return <ContactDetailSkeleton />;

  if (error || !contact) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Contato não encontrado'}</p>
          <Link to="/contatos">
            <Button variant="link">Voltar para contatos</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <AppLayout>
      <div className="min-h-screen p-6">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/contatos" className="transition-colors hover:text-foreground">
                Contatos
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground">{fullName}</li>
          </ol>
        </nav>

        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-semibold text-foreground">{fullName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{contact.role_title || 'Sem cargo'}</p>

            <div className="mt-6 space-y-2 text-sm text-foreground">
              <p><strong>Email:</strong> {contact.email || '—'}</p>
              <p><strong>Telefone:</strong> {contact.phone || '—'}</p>
              <p><strong>WhatsApp:</strong> {contact.whatsapp || '—'}</p>
              <p><strong>Empresa:</strong> {company?.name || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ContatoDetalhe;
