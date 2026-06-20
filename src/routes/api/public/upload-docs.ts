import { createFileRoute } from "@tanstack/react-router";

// TEMP one-off: upload pre-staged files from /tmp/up to bucket 'docs'.
export const Route = createFileRoute("/api/public/upload-docs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-setup-token") !== "doc-screenshots-2026") {
          return new Response("forbidden", { status: 403 });
        }
        const fs = await import("fs");
        const path = await import("path");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const dir = "/tmp/up";
        const mime: Record<string, string> = {
          ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ".pdf": "application/pdf",
          ".png": "image/png",
        };
        const out: any[] = [];
        for (const f of fs.readdirSync(dir)) {
          const isImg = f.endsWith(".png");
          const dest = isImg ? `fotos/${f}` : f;
          const ext = path.extname(f);
          const { error } = await supabaseAdmin.storage.from("docs").upload(
            dest,
            fs.readFileSync(path.join(dir, f)),
            { contentType: mime[ext], upsert: true },
          );
          out.push({ f, dest, error: error?.message ?? null });
        }
        return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
