
User wants Territory Optimization AI module. Backend edge function + UI hub + route. Need to design plan.

Existing: useTerritories hook (returns Territory[] with company_count, contact_count, deal_count, total_revenue, assigned_to), useTerritoryPerformance (conversion_rate, avg_deal_size). Sales team members have territories[]. AdminLayout + sidebar pattern exists.

Plan scope:
1. Edge function `territory-optimization` (Lovable AI for recommendations, Gini calc in Deno)
2. Hook `useTerritoryOptimization`
3. Page `/territory-optimization` with banner, KPIs, recommendations, chart, table
4. Route guard (admin/manager) + sidebar entry + breadcrumb
