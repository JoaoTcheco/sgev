import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/recibo/")({
  head: () => ({ meta: [{ title: "Validar Recibo — PharmaSys" }] }),
  component: ReciboLookup,
});

function ReciboLookup() {
  const navigate = useNavigate();
  const [ref, setRef] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = ref.trim();
    if (!v) return;
    navigate({ to: "/recibo/$ref", params: { ref: v } });
  }
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Validar recibo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Introduza o número do recibo (ex.: <code>REC-2026-000001</code>) ou leia o código QR impresso para abrir os detalhes da venda.
          </p>
          <form onSubmit={go} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="REC-2026-000001" className="pl-9" autoFocus />
            </div>
            <Button type="submit">Procurar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
