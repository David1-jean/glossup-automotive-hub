import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const { type, data } = body;

    // Handle subscription notifications
    if (type === "subscription_preapproval" && data?.id) {
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!accessToken) throw new Error("Token não configurado");

      // Fetch subscription details from MP
      const response = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const subscription = await response.json();
      console.log("Subscription details:", JSON.stringify(subscription));

      const payerEmail = subscription.payer_email;
      if (!payerEmail) {
        console.log("No payer email found");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the profile by email to get oficina_id
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("oficina_id")
        .eq("email", payerEmail);

      const oficinaId = profiles?.[0]?.oficina_id;
      if (!oficinaId) {
        console.log("No oficina found for email:", payerEmail);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map MP status to our status
      let statusAssinatura = "trial";
      let ativa = false;
      const now = new Date().toISOString();

      if (subscription.status === "authorized") {
        statusAssinatura = "ativa";
        ativa = true;
      } else if (subscription.status === "paused" || subscription.status === "cancelled") {
        statusAssinatura = "inativa";
        ativa = false;
      } else if (subscription.status === "pending") {
        statusAssinatura = "trial";
        ativa = true;
      }

      // Calculate next expiry: 30 days from now for active
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 30);

      const updatePayload: Record<string, any> = {
        status_assinatura: statusAssinatura,
        ativa,
      };

      if (statusAssinatura === "ativa") {
        updatePayload.data_vencimento = vencimento.toISOString();
      }

      const { error } = await supabaseAdmin
        .from("oficinas")
        .update(updatePayload)
        .eq("id", oficinaId);

      if (error) {
        console.error("Update error:", error);
      } else {
        console.log(`Oficina ${oficinaId} updated to ${statusAssinatura}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
