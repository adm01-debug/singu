import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OfferSuggestion {
  contactId: string;
  offerName: string;
  offerCategory: string;
  reason: string;
  confidenceScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let requestBody: { userId?: string; contactId?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body
    }

    const { userId, contactId } = requestBody;

    console.log('Generating offer suggestions...');

    // Build query for contacts
    let contactsQuery = supabase.from('contacts').select('*');
    if (userId) contactsQuery = contactsQuery.eq('user_id', userId);
    if (contactId) contactsQuery = contactsQuery.eq('id', contactId);
    
    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get purchase history for all contacts
    const contactIds = contacts.map(c => c.id);
    const { data: purchases } = await supabase
      .from('purchase_history')
      .select('*')
      .in('contact_id', contactIds)
      .order('purchase_date', { ascending: false });

    // Get interactions for context
    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get existing offer suggestions to avoid duplicates
    const { data: existingOffers } = await supabase
      .from('offer_suggestions')
      .select('contact_id, offer_name')
      .in('contact_id', contactIds)
      .eq('status', 'pending');

    const existingOffersSet = new Set(
      (existingOffers || []).map(o => `${o.contact_id}-${o.offer_name}`)
    );

    // Define offer catalog (in production, this would come from a products table)
    const offerCatalog = [
      { name: 'Upgrade para Plano Premium', category: 'Upgrade', targetScore: 70, keywords: ['crescimento', 'expansão', 'mais recursos'] },
      { name: 'Treinamento Avançado', category: 'Serviço', targetScore: 60, keywords: ['dificuldade', 'aprender', 'capacitar'] },
      { name: 'Consultoria Personalizada', category: 'Consultoria', targetScore: 80, keywords: ['estratégia', 'otimização', 'resultados'] },
      { name: 'Plano Anual com Desconto', category: 'Renovação', targetScore: 50, keywords: ['custo', 'economia', 'orçamento'] },
      { name: 'Módulo de Integração', category: 'Addon', targetScore: 65, keywords: ['integrar', 'automatizar', 'conectar'] },
      { name: 'Suporte Premium 24/7', category: 'Suporte', targetScore: 55, keywords: ['urgência', 'problema', 'ajuda'] },
      { name: 'Licenças Adicionais', category: 'Expansão', targetScore: 60, keywords: ['equipe', 'colaboradores', 'usuários'] },
      { name: 'Migração de Dados', category: 'Serviço', targetScore: 45, keywords: ['migrar', 'transferir', 'importar'] },
    ];

    const suggestions: OfferSuggestion[] = [];

    for (const contact of contacts) {
      const contactPurchases = (purchases || []).filter(p => p.contact_id === contact.id);
      const contactInteractions = (interactions || []).filter(i => i.contact_id === contact.id);
      
      // Analyze interaction content for keywords
      const interactionText = contactInteractions
        .map(i => `${i.content || ''} ${i.transcription || ''}`)
        .join(' ')
        .toLowerCase();

      // Check for renewal opportunities
      const now = new Date();
      const upcomingRenewals = contactPurchases.filter(p => {
        if (!p.renewal_date) return false;
        const renewalDate = new Date(p.renewal_date);
        const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 60;
      });

      // Generate suggestions based on various signals
      for (const offer of offerCatalog) {
        const key = `${contact.id}-${offer.name}`;
        if (existingOffersSet.has(key)) continue;

        let confidence = 30; // Base confidence
        let reasons: string[] = [];

        // Relationship score factor
        const score = contact.relationship_score || 50;
        if (score >= offer.targetScore) {
          confidence += 15;
          reasons.push(`Bom score de relacionamento (${score})`);
        }

        // Keyword matching
        const matchedKeywords = offer.keywords.filter(kw => interactionText.includes(kw));
        if (matchedKeywords.length > 0) {
          confidence += matchedKeywords.length * 10;
          reasons.push(`Interesse detectado: ${matchedKeywords.join(', ')}`);
        }

        // Purchase history analysis
        if (contactPurchases.length > 0) {
          const hasCategory = contactPurchases.some(p => 
            p.product_category?.toLowerCase() === offer.category.toLowerCase()
          );
          if (hasCategory) {
            confidence += 10;
            reasons.push(`Histórico de compras similares`);
          }

          // High-value customer
          const totalSpent = contactPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          if (totalSpent > 10000) {
            confidence += 10;
            reasons.push(`Cliente de alto valor`);
          }
        }

        // Renewal timing
        if (offer.category === 'Renovação' && upcomingRenewals.length > 0) {
          confidence += 25;
          reasons.push(`Renovação próxima em ${upcomingRenewals.length} produto(s)`);
        }

        // Role-based factor
        if (contact.role === 'decision_maker' || contact.role === 'owner') {
          confidence += 10;
          reasons.push(`Decisor/proprietário`);
        }

        // Sentiment factor
        if (contact.sentiment === 'positive') {
          confidence += 10;
          reasons.push(`Sentimento positivo`);
        } else if (contact.sentiment === 'negative') {
          confidence -= 20;
        }

        // Only suggest if confidence is reasonable
        if (confidence >= 50 && reasons.length >= 2) {
          suggestions.push({
            contactId: contact.id,
            offerName: offer.name,
            offerCategory: offer.category,
            reason: reasons.slice(0, 3).join('. ') + '.',
            confidenceScore: Math.min(100, confidence),
          });
        }
      }
    }

    // Sort by confidence and limit
    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);
    const topSuggestions = suggestions.slice(0, 50);

    // Insert suggestions into database
    if (topSuggestions.length > 0) {
      const insertData = topSuggestions.map(s => ({
        user_id: userId || contacts.find(c => c.id === s.contactId)?.user_id,
        contact_id: s.contactId,
        offer_name: s.offerName,
        offer_category: s.offerCategory,
        reason: s.reason,
        confidence_score: s.confidenceScore,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }));

      const { error: insertError } = await supabase
        .from('offer_suggestions')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting suggestions:', insertError);
      }
    }

    console.log(`Generated ${topSuggestions.length} offer suggestions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestionsGenerated: topSuggestions.length,
        suggestions: topSuggestions 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating offer suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
