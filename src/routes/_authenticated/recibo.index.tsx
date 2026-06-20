import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Receipt, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

export const Route = createFileRoute("/_authenticated/recibo/")({
  head: () => ({ meta: [{ title: "Validar Recibo — PharmaSys" }] }),
  component: ReciboLookup,
});

function ReciboLookup() {
  const navigate = useNavigate();
  const [ref, setRef] = useState("");
  const [listening, setListening] = useState(true);

  useBarcodeScanner((code) => {
    toast.success(`Código lido: ${code}`);
    navigate({ to: "/recibo/$ref", params: { ref: code } });
  }, { minLength: 6 });

  useEffect(() => { setListening(true); }, []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = ref.trim();
    if (!v) return;
    navigate({ to: "/recibo/$ref", params: { ref: v } });
  }
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 py-3 text-sm">
          <ScanLine className={`h-5 w-5 ${listening ? "text-emerald-600 animate-pulse" : "text-muted-foreground"}`} />
          <div>
            <div className="font-medium">Leitor de código de barras ativo</div>
            <div className="text-xs text-muted-foreground">Aponte o leitor para o recibo — a validação abre automaticamente.</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Validar recibo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Introduza o número (ex.: <code>REC-2026-000001</code>) ou utilize o leitor de código de barras impresso no recibo.
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
