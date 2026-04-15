import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

interface RouteRequest {
  action: "distribute" | "redistribute" | "reset_daily";
  contact_id?: string;
  company_id?: string;
  rule_id?: string;
  role_filter?: "sdr" | "closer" | "any";
  inactivity_days?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Token inválido" }, 401);
    }

    const body: RouteRequest = await req.json();
    const { action } = body;

    switch (action) {
      case "distribute":
        return await handleDistribute(supabase, user.id, body);
      case "redistribute":
        return await handleRedistribute(supabase, user.id, body);
      case "reset_daily":
        return await handleResetDaily(supabase);
      default:
        return json({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (e) {
    console.error("[lead-routing] Error:", e);
    return json({ error: "Erro interno" }, 500);
  }
});

async function handleDistribute(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: RouteRequest
) {
  const roleFilter = body.role_filter ?? "any";

  // Get eligible members
  let query = supabase
    .from("sales_team_members")
    .select("*")
    .eq("is_active", true);

  if (roleFilter !== "any") {
    query = query.eq("role", roleFilter);
  }

  const { data: members, error: mErr } = await query
    .order("last_assigned_at", { ascending: true, nullsFirst: true });

  if (mErr) return json({ error: mErr.message }, 500);
  if (!members || members.length === 0) {
    return json({ error: "Nenhum vendedor elegível disponível" }, 400);
  }

  // Filter by capacity and vacation
  const now = new Date();
  const eligible = members.filter((m: Record<string, unknown>) => {
    const leadsToday = (m.leads_today as number) ?? 0;
    const maxDay = (m.max_leads_day as number) ?? 10;
    const currentCount = (m.current_lead_count as number) ?? 0;
    const maxTotal = (m.max_leads_total as number) ?? 50;

    if (leadsToday >= maxDay || currentCount >= maxTotal) return false;

    const vacStart = m.vacation_start as string | null;
    const vacEnd = m.vacation_end as string | null;
    if (vacStart && vacEnd) {
      if (now >= new Date(vacStart) && now <= new Date(vacEnd)) return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return json({ error: "Todos os vendedores atingiram o limite ou estão em férias" }, 400);
  }

  // Weighted selection: sort by (last_assigned_at ASC, weight DESC)
  eligible.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aTime = a.last_assigned_at ? new Date(a.last_assigned_at as string).getTime() : 0;
    const bTime = b.last_assigned_at ? new Date(b.last_assigned_at as string).getTime() : 0;
    const timeDiff = aTime - bTime;
    const weightDiff = ((b.weight as number) ?? 5) - ((a.weight as number) ?? 5);
    return timeDiff + weightDiff * -100_000;
  });

  const selected = eligible[0];
  const selectedId = selected.id as string;

  // Create assignment
  const { error: assignErr } = await supabase
    .from("lead_assignments")
    .insert({
      user_id: userId,
      contact_id: body.contact_id ?? null,
      company_id: body.company_id ?? null,
      assigned_to: selectedId,
      assignment_type: "auto_weighted",
      status: "active",
      routing_rule_id: body.rule_id ?? null,
      sla_deadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
    });

  if (assignErr) return json({ error: assignErr.message }, 500);

  // Update member counts
  await supabase
    .from("sales_team_members")
    .update({
      current_lead_count: ((selected.current_lead_count as number) ?? 0) + 1,
      leads_today: ((selected.leads_today as number) ?? 0) + 1,
      last_assigned_at: new Date().toISOString(),
    })
    .eq("id", selectedId);

  return json({
    success: true,
    assigned_to: selectedId,
    member_name: selected.name as string,
  });
}

async function handleRedistribute(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: RouteRequest
) {
  const inactivityDays = body.inactivity_days ?? 7;
  const cutoff = new Date(Date.now() - inactivityDays * 86400_000).toISOString();

  // Find stale assignments
  const { data: stale, error: staleErr } = await supabase
    .from("lead_assignments")
    .select("*")
    .eq("status", "active")
    .is("first_contact_at", null)
    .lt("created_at", cutoff)
    .limit(50);

  if (staleErr) return json({ error: staleErr.message }, 500);
  if (!stale || stale.length === 0) {
    return json({ redistributed: 0, message: "Nenhum lead inativo encontrado" });
  }

  let redistributed = 0;

  for (const assignment of stale) {
    // Mark old assignment as expired
    await supabase
      .from("lead_assignments")
      .update({ status: "expired" })
      .eq("id", assignment.id);

    // Decrement old owner count
    if (assignment.assigned_to) {
      const { data: oldMember } = await supabase
        .from("sales_team_members")
        .select("current_lead_count")
        .eq("id", assignment.assigned_to)
        .single();

      if (oldMember) {
        await supabase
          .from("sales_team_members")
          .update({
            current_lead_count: Math.max(0, (oldMember.current_lead_count ?? 0) - 1),
          })
          .eq("id", assignment.assigned_to);
      }
    }

    // Log redistribution
    await supabase.from("redistribution_log").insert({
      user_id: userId,
      contact_id: assignment.contact_id,
      company_id: assignment.company_id,
      from_member_id: assignment.assigned_to,
      reason: "inactivity",
      auto_triggered: true,
      inactivity_days: inactivityDays,
    });

    redistributed++;
  }

  return json({ redistributed, message: `${redistributed} leads redistribuídos` });
}

async function handleResetDaily(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc("reset_daily_lead_counts");
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, reset_count: data });
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
