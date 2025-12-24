import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WebhookInfo = {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    ip_address?: string;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    allowed_updates?: string[];
  };
  description?: string;
};

async function getWebhookInfo(botToken: string): Promise<WebhookInfo> {
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
    method: "GET",
  });
  const json = await resp.json();
  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const DUBAI = Deno.env.get("DUBAI_TELEGRAM_BOT_TOKEN");
    const ENG = Deno.env.get("TELEGRAM_BOT_TOKEN_ENG");
    const VN = Deno.env.get("VIETNAM_BOT_TOKEN");

    const results: any = {};

    if (DUBAI) results.dubai = await getWebhookInfo(DUBAI);
    else results.dubai = { ok: false, description: "DUBAI_TELEGRAM_BOT_TOKEN not set" };

    if (ENG) results.dubai_eng = await getWebhookInfo(ENG);
    else results.dubai_eng = { ok: false, description: "TELEGRAM_BOT_TOKEN_ENG not set" };

    if (VN) results.vietnam = await getWebhookInfo(VN);
    else results.vietnam = { ok: false, description: "VIETNAM_BOT_TOKEN not set" };

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-webhook-status error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
