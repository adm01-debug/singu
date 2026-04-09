import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

interface PushPayload {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

async function sendWebPush(subscription: Subscription, payload: PushPayload): Promise<boolean> {
  try {
    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data || {},
      tag: payload.tag || 'notification',
      requireInteraction: payload.requireInteraction || false
    });

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: pushData
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        console.log('Subscription expired, should be removed');
        return false;
      }
      const errText = await response.text();
      console.error('Push failed:', response.status, errText);
      return false;
    }
    await response.text(); // consume body

    return true;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const authenticatedUserId = authResult;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let payload: PushPayload;
    try {
      payload = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }
    
    if (!payload.title || !payload.body) {
      return jsonError('Title and body are required', 400);
    }

    // Only allow sending to self — prevent cross-user notification abuse
    const targetUserId = payload.userId || authenticatedUserId;
    if (targetUserId !== authenticatedUserId) {
      return jsonError('Cannot send notifications to other users', 403);
    }

    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return jsonOk({ success: true, message: 'No subscriptions found', sent: 0 });
    }

    const results = await Promise.all(
      subscriptions.map(sub => sendWebPush(sub, payload))
    );

    const successCount = results.filter(Boolean).length;

    return jsonOk({ 
      success: true, 
      sent: successCount,
      total: subscriptions.length
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(errorMessage, 500);
  }
});
