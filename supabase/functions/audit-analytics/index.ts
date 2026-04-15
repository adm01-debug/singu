import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 30 days of audit logs for this user
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs, error } = await supabase
      .from("audit_log")
      .select("entity_type, action, created_at, user_id")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Top entities
    const entityCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    (logs || []).forEach((log: { entity_type: string; action: string; created_at: string }) => {
      entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      const hour = new Date(log.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const topEntities = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([entity, count]) => ({ entity, count }));

    const operationsByType = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }));

    const activityByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourCounts[h] || 0,
    }));

    return new Response(
      JSON.stringify({
        total_logs: (logs || []).length,
        top_entities: topEntities,
        operations_by_type: operationsByType,
        activity_by_hour: activityByHour,
        period: "30d",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
