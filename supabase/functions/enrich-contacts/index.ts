import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      throw new Error('External database credentials not configured');
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    // Get local contacts that need enrichment (missing company_id or stage = unknown)
    const { data: localContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, whatsapp, company_id, email, role_title, relationship_stage')
      .or('company_id.is.null,relationship_stage.eq.unknown');

    if (fetchError) {
      throw new Error(`Error fetching local contacts: ${fetchError.message}`);
    }

    if (!localContacts || localContacts.length === 0) {
      return jsonResponse({ status: 'success', message: 'No contacts to enrich', enriched: 0 });
    }

    console.log(`Found ${localContacts.length} contacts to enrich`);

    let enrichedCount = 0;
    let errorCount = 0;
    const results: Array<{ contactId: string; name: string; status: string; details?: string }> = [];

    for (const contact of localContacts) {
      try {
        const phoneNumber = contact.whatsapp || contact.phone;
        if (!phoneNumber) {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'skipped', details: 'No phone number' });
          continue;
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Build phone variants
        const phoneVariants = [cleanPhone];
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
          phoneVariants.push(cleanPhone.substring(2));
        }
        if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
          phoneVariants.push('55' + cleanPhone);
        }

        let extContact: any = null;

        // Search external DB for each phone variant
        for (const variant of phoneVariants) {
          const { data: extResults, error: extError } = await externalSupabase
            .from('contacts')
            .select('id, company_id, first_name, last_name, cargo, whatsapp, phone, email')
            .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
            .limit(1);

          if (extError) {
            console.error(`External search error for ${variant}:`, extError.message);
            continue;
          }

          if (extResults && extResults.length > 0) {
            extContact = extResults[0];
            break;
          }
        }

        if (!extContact) {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'not_found', details: `Phone: ${cleanPhone}` });
          continue;
        }

        // Build update object with enriched data
        const updates: Record<string, any> = {};

        // Update name if current is generic (WhatsApp + number)
        if (contact.first_name === 'WhatsApp' && extContact.first_name) {
          updates.first_name = extContact.first_name;
          updates.last_name = extContact.last_name || '';
        }

        // Update company_id if missing
        if (!contact.company_id && extContact.company_id) {
          updates.company_id = extContact.company_id;
        }

        // Update email if missing
        if (!contact.email && extContact.email) {
          updates.email = extContact.email;
        }

        // Update role_title from cargo
        if (!contact.role_title && extContact.cargo) {
          updates.role_title = extContact.cargo;
        }

        // Update relationship stage from unknown
        if (contact.relationship_stage === 'unknown') {
          updates.relationship_stage = 'known';
        }

        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length > 1) { // more than just updated_at
          const { error: updateError } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', contact.id);

          if (updateError) {
            console.error(`Error updating contact ${contact.id}:`, updateError.message);
            results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'error', details: updateError.message });
            errorCount++;
          } else {
            enrichedCount++;
            const enrichedFields = Object.keys(updates).filter(k => k !== 'updated_at');
            results.push({ contactId: contact.id, name: extContact.first_name || contact.first_name, status: 'enriched', details: `Fields: ${enrichedFields.join(', ')}` });
            console.log(`Enriched contact ${contact.id}: ${enrichedFields.join(', ')}`);
          }
        } else {
          results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'already_complete', details: 'External match found but no new data' });
        }

      } catch (contactError) {
        const msg = contactError instanceof Error ? contactError.message : 'Unknown error';
        console.error(`Error processing contact ${contact.id}:`, msg);
        results.push({ contactId: contact.id, name: `${contact.first_name} ${contact.last_name}`, status: 'error', details: msg });
        errorCount++;
      }
    }

    console.log(`Enrichment complete: ${enrichedCount} enriched, ${errorCount} errors, ${localContacts.length} total`);

    return jsonResponse({
      status: 'success',
      total: localContacts.length,
      enriched: enrichedCount,
      errors: errorCount,
      results,
    });

  } catch (error) {
    console.error('Enrich contacts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
