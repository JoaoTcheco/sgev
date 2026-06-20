import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY: one-off password reset for documentation screenshots.
// Delete after use.
export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-setup-token");
        if (token !== "doc-screenshots-2026") {
          return new Response("forbidden", { status: 403 });
        }
        const body = (await request.json()) as { email: string; password: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list, error: lerr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (lerr) return new Response(lerr.message, { status: 500 });
        const u = list.users.find((x) => x.email?.toLowerCase() === body.email.toLowerCase());
        if (!u) return new Response("user not found", { status: 404 });
        const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, { password: body.password });
        if (error) return new Response(error.message, { status: 500 });
        return new Response(JSON.stringify({ ok: true, id: u.id }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
