import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useContactRelationalData, useRelativeMutations } from '@/hooks/useContactRelationalData';
import type { Contact } from '@/hooks/useContactDetail';

import { DataSummaryStrip } from './data-tab/DataSummaryStrip';
import { PhonesCard } from './data-tab/PhonesCard';
import { EmailsCard } from './data-tab/EmailsCard';
import { AddressesCard } from './data-tab/AddressesCard';
import { SocialsCard } from './data-tab/SocialsCard';
import { RelativesCard } from './data-tab/RelativesCard';
import { CadencePreferencesCard } from './data-tab/CadencePreferencesCard';
import { TimeHeatmapCard } from './data-tab/TimeHeatmapCard';
import { SocialMediaExternalCard } from './data-tab/SocialMediaExternalCard';
import { ContactEnrichedCard } from './data-tab/ContactEnrichedCard';

interface Props {
  contact: Contact;
}

export function ContactDataTab({ contact }: Props) {
  const { data, isLoading } = useContactRelationalData(contact.id);
  const { addRelative, deleteRelative } = useRelativeMutations(contact.id);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { phones, emails, addresses, socials, relatives, cadence, preferences, commPreferences, timeAnalysis } = data;

  return (
    <div>
      <DataSummaryStrip counts={{
        phones: phones.length,
        emails: emails.length,
        addresses: addresses.length,
        socials: socials.length,
        relatives: relatives.length,
        hasTime: timeAnalysis.length > 0,
      }} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PhonesCard phones={phones} copiedField={copiedField} onCopy={copyToClipboard} />
        <EmailsCard emails={emails} copiedField={copiedField} onCopy={copyToClipboard} />
        <AddressesCard addresses={addresses} />
        <SocialsCard socials={socials} copiedField={copiedField} onCopy={copyToClipboard} />
        <RelativesCard
          relatives={relatives}
          contactId={contact.id}
          onAdd={(d) => addRelative.mutate(d as any)}
          onDelete={(id) => deleteRelative.mutate(id)}
        />
        <CadencePreferencesCard cadence={cadence} preferences={preferences} commPreferences={commPreferences} />
        <TimeHeatmapCard data={timeAnalysis} />
        <SocialMediaExternalCard contactId={contact.id} />
        <ContactEnrichedCard contactId={contact.id} />
      </div>
    </div>
  );
}
