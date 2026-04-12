import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";

export interface PurchasePattern {
  contactId: string;
  contactName: string;
  averageCycleDays: number;
  lastPurchaseDate: string;
  nextPredictedPurchase: string;
  daysSinceLastPurchase: number;
  daysUntilPredictedPurchase: number;
  purchaseFrequency: 'high' | 'medium' | 'low';
  totalPurchases: number;
  totalAmount: number;
  preferredProducts: string[];
  preferredCategories: string[];
  seasonalPattern?: string;
  isOverdue: boolean;
  confidence: number;
}

export interface CategoryPattern {
  category: string;
  totalPurchases: number;
  totalAmount: number;
  averageAmount: number;
  topContacts: { contactId: string; contactName: string; count: number }[];
}

export interface PurchasePrediction {
  contactId: string;
  contactName: string;
  predictedDate: string;
  confidence: number;
  suggestedProducts: string[];
  reason: string;
}

interface RawPurchase {
  id: string;
  contact_id: string;
  product_name: string;
  product_category?: string;
  amount?: number;
  purchase_date: string;
  contacts?: { id: string; first_name: string; last_name: string } | null;
  // External DB may have flat fields
  contact_name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

function getContactName(p: RawPurchase): string {
  if (p.contacts) return `${p.contacts.first_name} ${p.contacts.last_name}`;
  if (p.contact_name) return p.contact_name;
  if (p.first_name) return `${p.first_name} ${p.last_name || ''}`.trim();
  return 'Sem nome';
}

function analyzePurchases(purchases: RawPurchase[]) {
  const purchasesByContact = new Map<string, RawPurchase[]>();
  purchases.forEach(p => {
    const cid = p.contact_id;
    if (!purchasesByContact.has(cid)) purchasesByContact.set(cid, []);
    purchasesByContact.get(cid)!.push(p);
  });

  const patterns: PurchasePattern[] = [];

  purchasesByContact.forEach((contactPurchases, contactId) => {
    if (contactPurchases.length < 1) return;
    const contactName = getContactName(contactPurchases[0]);

    contactPurchases.sort((a, b) =>
      new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
    );

    let totalCycleDays = 0, cycleCount = 0;
    for (let i = 0; i < contactPurchases.length - 1; i++) {
      const diff = Math.floor(
        (new Date(contactPurchases[i].purchase_date).getTime() -
         new Date(contactPurchases[i + 1].purchase_date).getTime()) / 86400000
      );
      if (diff > 0 && diff < 365) { totalCycleDays += diff; cycleCount++; }
    }

    const averageCycleDays = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 30;
    const lastPurchaseDate = contactPurchases[0].purchase_date;
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(lastPurchaseDate).getTime()) / 86400000
    );

    const predictedDate = new Date(lastPurchaseDate);
    predictedDate.setDate(predictedDate.getDate() + averageCycleDays);
    const daysUntilPredictedPurchase = Math.floor(
      (predictedDate.getTime() - Date.now()) / 86400000
    );

    const totalAmount = contactPurchases.reduce((s, p) => s + (p.amount || 0), 0);
    const productCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    contactPurchases.forEach(p => {
      productCounts.set(p.product_name, (productCounts.get(p.product_name) || 0) + 1);
      if (p.product_category) categoryCounts.set(p.product_category, (categoryCounts.get(p.product_category) || 0) + 1);
    });

    const preferredProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    const preferredCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    const purchaseFrequency = averageCycleDays <= 30 ? 'high' : averageCycleDays <= 90 ? 'medium' : 'low';
    const confidence = Math.min(95, 50 + contactPurchases.length * 5 + cycleCount * 10);

    const monthCounts = new Map<number, number>();
    contactPurchases.forEach(p => {
      const m = new Date(p.purchase_date).getMonth();
      monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
    });
    let seasonalPattern: string | undefined;
    const sorted = [...monthCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] >= contactPurchases.length / 4) {
      const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      seasonalPattern = `Pico em ${months[sorted[0][0]]}`;
    }

    patterns.push({
      contactId, contactName, averageCycleDays, lastPurchaseDate,
      nextPredictedPurchase: predictedDate.toISOString(),
      daysSinceLastPurchase, daysUntilPredictedPurchase,
      purchaseFrequency, totalPurchases: contactPurchases.length,
      totalAmount, preferredProducts, preferredCategories,
      seasonalPattern, isOverdue: daysUntilPredictedPurchase < 0, confidence,
    });
  });

  patterns.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysUntilPredictedPurchase - b.daysUntilPredictedPurchase;
  });

  // Category patterns
  const categoryMap = new Map<string, { total: number; amount: number; contacts: Map<string, { name: string; count: number }> }>();
  purchases.forEach(p => {
    const cat = p.product_category || 'Sem categoria';
    if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, amount: 0, contacts: new Map() });
    const d = categoryMap.get(cat)!;
    d.total++; d.amount += p.amount || 0;
    const name = getContactName(p);
    const ex = d.contacts.get(p.contact_id);
    if (ex) ex.count++; else d.contacts.set(p.contact_id, { name, count: 1 });
  });

  const categoryPatterns: CategoryPattern[] = [...categoryMap.entries()].map(([category, d]) => ({
    category, totalPurchases: d.total, totalAmount: d.amount,
    averageAmount: d.total > 0 ? d.amount / d.total : 0,
    topContacts: [...d.contacts.entries()].map(([cid, { name, count }]) => ({ contactId: cid, contactName: name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
  }));

  const predictions: PurchasePrediction[] = patterns
    .filter(p => p.daysUntilPredictedPurchase <= 14)
    .map(p => ({
      contactId: p.contactId, contactName: p.contactName,
      predictedDate: p.nextPredictedPurchase, confidence: p.confidence,
      suggestedProducts: p.preferredProducts,
      reason: p.isOverdue ? `Compra atrasada há ${Math.abs(p.daysUntilPredictedPurchase)} dias` : `Baseado em ciclo médio de ${p.averageCycleDays} dias`,
    }));

  return { patterns, categoryPatterns, predictions };
}

export function usePurchasePatterns() {
  const { user } = useAuth();

  const { data, isLoading: loading, refetch: refresh } = useQuery({
    queryKey: ['purchase-patterns', user?.id],
    queryFn: async () => {
      // Try local first
      const { data: localData, error: localError } = await supabase
        .from('purchase_history')
        .select('*, contacts:contact_id (id, first_name, last_name)')
        .order('purchase_date', { ascending: false });

      if (!localError && localData && localData.length > 0) {
        return localData as RawPurchase[];
      }

      // Fallback to external
      const { data: extData, error: extError } = await queryExternalData<RawPurchase>({
        table: 'purchase_history',
        select: '*',
        order: { column: 'purchase_date', ascending: false },
        range: { from: 0, to: 499 },
      });

      if (extError) {
        logger.error('Error fetching purchase history:', extError);
        throw extError;
      }

      return extData || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const result = useMemo(() => {
    if (!data || data.length === 0) {
      return { patterns: [] as PurchasePattern[], categoryPatterns: [] as CategoryPattern[], predictions: [] as PurchasePrediction[] };
    }
    return analyzePurchases(data);
  }, [data]);

  const stats = useMemo(() => {
    const overdue = result.patterns.filter(p => p.isOverdue).length;
    const upcomingWeek = result.patterns.filter(p => !p.isOverdue && p.daysUntilPredictedPurchase <= 7).length;
    const highFrequency = result.patterns.filter(p => p.purchaseFrequency === 'high').length;
    const totalRevenue = result.patterns.reduce((s, p) => s + p.totalAmount, 0);
    return { overdue, upcomingWeek, highFrequency, totalRevenue, totalContacts: result.patterns.length };
  }, [result.patterns]);

  return { ...result, stats, loading, refresh };
}
