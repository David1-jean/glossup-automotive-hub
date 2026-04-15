import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const respond = (success: boolean, payload: Record<string, unknown>) =>
  new Response(JSON.stringify({ success, ...payload }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin_master
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Não autenticado");

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isAdmin = callerRoles?.some((r: any) => r.role === "admin_master");
    if (!isAdmin) throw new Error("Sem permissão");

    const { email, password, full_name, oficina_id, role } = await req.json();

    if (!email || !password) throw new Error("E-mail e senha são obrigatórios");

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, oficina_id },
    });

    if (createError) {
      if ((createError as { code?: string }).code === "email_exists") {
        return respond(false, {
          error: "Este e-mail já está cadastrado. Use outro e-mail para o gerente ou redefina a senha do usuário existente.",
          diagnostics: {
            domain: "manager-creation",
            error_stage: "create_auth_user",
            error_code: "email_exists",
            email,
          },
        });
      }

      throw createError;
    }

    const userId = newUser.user?.id;
    if (!userId) {
      return respond(false, {
        error: "Não foi possível concluir a criação do gerente.",
        diagnostics: {
          domain: "manager-creation",
          error_stage: "missing_user_id",
          email,
        },
      });
    }

    // Wait for trigger to fire, then ensure profile + role exist
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Upsert profile (in case trigger didn't fire or was slow)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        oficina_id,
        full_name: full_name || "",
        email,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      throw new Error("Erro ao criar perfil do usuário: " + profileError.message);
    }

    // Set the correct role
    const targetRole = role || "consultor";

    // Try to update existing role first (created by trigger)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRole) {
      // Update existing role
      if (targetRole !== "consultor") {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .update({ role: targetRole })
          .eq("user_id", userId);
        if (roleError) {
          console.error("Role update error:", roleError);
        }
      }
    } else {
      // Insert role (trigger didn't create one)
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: targetRole });
      if (roleError) {
        console.error("Role insert error:", roleError);
      }
    }

    return respond(true, {
      user_id: userId,
    });
  } catch (error: any) {
    console.error("create-user error:", error);
    return respond(false, {
      error: error?.message || "Erro interno ao criar gerente",
      diagnostics: {
        domain: "manager-creation",
        error_stage: "unexpected_exception",
      },
    });
  }
});
