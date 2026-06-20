import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem executar esta ação");
}

async function audit(
  actorId: string,
  entityId: string,
  action: string,
  details: Record<string, unknown>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    user_id: actorId,
    entity: "user",
    entity_id: entityId,
    action,
    details,
  });
}

const createUserInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2).max(120),
  role: z.enum(["admin", "pharmacist", "cashier"]),
});

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newUserId = created.user?.id;
    if (!newUserId) throw new Error("Falha ao criar utilizador");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: data.role });
    if (insErr) throw new Error(insErr.message);

    await audit(context.userId, newUserId, "create", { email: data.email, role: data.role });
    return { id: newUserId, email: data.email };
  });

const resetPasswordInput = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(8),
});

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => resetPasswordInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("Use o seu perfil para alterar a própria palavra-passe");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await audit(context.userId, data.user_id, "reset_password", {});
    return { ok: true };
  });

const updateUserInput = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
});

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        email: data.email,
        email_confirm: true,
        user_metadata: data.full_name ? { full_name: data.full_name } : undefined,
      });
      if (error) throw new Error(error.message);
    } else if (data.full_name) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        user_metadata: { full_name: data.full_name },
      });
      if (error) throw new Error(error.message);
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.full_name) patch.full_name = data.full_name;
    if (data.email) patch.email = data.email;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", data.user_id);
    if (pErr) throw new Error(pErr.message);

    await audit(context.userId, data.user_id, "update", {
      full_name: data.full_name,
      email: data.email,
    });
    return { ok: true };
  });

const deleteUserInput = z.object({ user_id: z.string().uuid() });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("Não pode eliminar a própria conta");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Block deleting the last remaining admin
    const { data: target } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    const targetIsAdmin = (target ?? []).some((r: any) => r.role === "admin");
    if (targetIsAdmin) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        throw new Error("Não é possível eliminar o último administrador");
      }
    }

    const { data: snapshot } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);

    await audit(context.userId, data.user_id, "delete", snapshot ?? {});
    return { ok: true };
  });
