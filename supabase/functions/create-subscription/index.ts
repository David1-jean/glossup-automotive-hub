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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) throw new Error("Não autenticado");

    // Get user profile to find oficina
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("oficina_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.oficina_id) throw new Error("Oficina não encontrada");

    // Get oficina info
    const { data: oficina } = await supabaseAdmin
      .from("oficinas")
      .select("nome, email")
      .eq("id", profile.oficina_id)
      .single();

    const { back_url } = await req.json();

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("Token do Mercado Pago não configurado");

    // Create preapproval (recurring subscription) via Mercado Pago API
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reason: `AutoLustre Pro - ${oficina?.nome || "Oficina"}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 59.99,
          currency_id: "BRL",
        },
        payer_email: profile.email || user.email,
        back_url: back_url || "https://glossup-automotive-hub.lovable.app/",
        status: "pending",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP error:", JSON.stringify(data));
      throw new Error(data.message || "Erro ao criar assinatura no Mercado Pago");
    }

    // Save the preapproval_id to the oficina for tracking
    await supabaseAdmin
      .from("oficinas")
      .update({ 
        plano: "pro",
      })
      .eq("id", profile.oficina_id);

    return new Response(JSON.stringify({ 
      init_point: data.init_point,
      id: data.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("create-subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
