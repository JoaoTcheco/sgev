import { T as TSS_SERVER_FUNCTION, c as createServerFn } from "./server-IW2mgyey.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-BqeR1Qdv.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, e as enumType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./createMiddleware-BvN2ghIY.mjs";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
async function assertAdmin(context) {
  const {
    data,
    error
  } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem executar esta ação");
}
async function audit(actorId, entityId, action, details) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  await supabaseAdmin.from("audit_logs").insert({
    user_id: actorId,
    entity: "user",
    entity_id: entityId,
    action,
    details
  });
}
const createUserInput = objectType({
  email: stringType().email(),
  password: stringType().min(8),
  full_name: stringType().min(2).max(120),
  role: enumType(["admin", "pharmacist", "cashier"])
});
const adminCreateUser_createServerFn_handler = createServerRpc({
  id: "7cdf308c08cefa76b5aff91881d47d0a7c38e57c538ac8578cbcc0b0323f57c2",
  name: "adminCreateUser",
  filename: "src/lib/admin-users.functions.ts"
}, (opts) => adminCreateUser.__executeServer(opts));
const adminCreateUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => createUserInput.parse(data)).handler(adminCreateUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    data: created,
    error
  } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name
    }
  });
  if (error) throw new Error(error.message);
  const newUserId = created.user?.id;
  if (!newUserId) throw new Error("Falha ao criar utilizador");
  await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
  const {
    error: insErr
  } = await supabaseAdmin.from("user_roles").insert({
    user_id: newUserId,
    role: data.role
  });
  if (insErr) throw new Error(insErr.message);
  await audit(context.userId, newUserId, "create", {
    email: data.email,
    role: data.role
  });
  return {
    id: newUserId,
    email: data.email
  };
});
const resetPasswordInput = objectType({
  user_id: stringType().uuid(),
  password: stringType().min(8)
});
const adminResetPassword_createServerFn_handler = createServerRpc({
  id: "1ba075863237a617a5df5843a787f269ad588c4ff8323a63623b448c2d427495",
  name: "adminResetPassword",
  filename: "src/lib/admin-users.functions.ts"
}, (opts) => adminResetPassword.__executeServer(opts));
const adminResetPassword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => resetPasswordInput.parse(data)).handler(adminResetPassword_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  if (data.user_id === context.userId) {
    throw new Error("Use o seu perfil para alterar a própria palavra-passe");
  }
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    error
  } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
    password: data.password
  });
  if (error) throw new Error(error.message);
  await audit(context.userId, data.user_id, "reset_password", {});
  return {
    ok: true
  };
});
const updateUserInput = objectType({
  user_id: stringType().uuid(),
  full_name: stringType().min(2).max(120).optional(),
  email: stringType().email().optional()
});
const adminUpdateUser_createServerFn_handler = createServerRpc({
  id: "7e44cff770ce63c7f54ff4f42a5f1198b6c13b6bb706edd2e84253ce3272ea47",
  name: "adminUpdateUser",
  filename: "src/lib/admin-users.functions.ts"
}, (opts) => adminUpdateUser.__executeServer(opts));
const adminUpdateUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => updateUserInput.parse(data)).handler(adminUpdateUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  if (data.email) {
    const {
      error
    } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      email: data.email,
      email_confirm: true,
      user_metadata: data.full_name ? {
        full_name: data.full_name
      } : void 0
    });
    if (error) throw new Error(error.message);
  } else if (data.full_name) {
    const {
      error
    } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      user_metadata: {
        full_name: data.full_name
      }
    });
    if (error) throw new Error(error.message);
  }
  const patch = {
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (data.full_name) patch.full_name = data.full_name;
  if (data.email) patch.email = data.email;
  const {
    error: pErr
  } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
  if (pErr) throw new Error(pErr.message);
  await audit(context.userId, data.user_id, "update", {
    full_name: data.full_name,
    email: data.email
  });
  return {
    ok: true
  };
});
const deleteUserInput = objectType({
  user_id: stringType().uuid()
});
const adminDeleteUser_createServerFn_handler = createServerRpc({
  id: "31cd0087befaea9f28691dcd70f4a21113aea1822989cc6cf42e905d3993bf14",
  name: "adminDeleteUser",
  filename: "src/lib/admin-users.functions.ts"
}, (opts) => adminDeleteUser.__executeServer(opts));
const adminDeleteUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => deleteUserInput.parse(data)).handler(adminDeleteUser_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context);
  if (data.user_id === context.userId) {
    throw new Error("Não pode eliminar a própria conta");
  }
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const {
    data: target
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user_id);
  const targetIsAdmin = (target ?? []).some((r) => r.role === "admin");
  if (targetIsAdmin) {
    const {
      count
    } = await supabaseAdmin.from("user_roles").select("user_id", {
      count: "exact",
      head: true
    }).eq("role", "admin");
    if ((count ?? 0) <= 1) {
      throw new Error("Não é possível eliminar o último administrador");
    }
  }
  const {
    data: snapshot
  } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", data.user_id).maybeSingle();
  const {
    error
  } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
  if (error) throw new Error(error.message);
  await audit(context.userId, data.user_id, "delete", snapshot ?? {});
  return {
    ok: true
  };
});
export {
  adminCreateUser_createServerFn_handler,
  adminDeleteUser_createServerFn_handler,
  adminResetPassword_createServerFn_handler,
  adminUpdateUser_createServerFn_handler
};
