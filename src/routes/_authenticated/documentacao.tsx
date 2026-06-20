import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileText, FileDown, Loader2, Download, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/documentacao")({
  head: () => ({ meta: [{ title: "Documentação — PharmaSys" }] }),
  component: DocumentacaoPage,
});

const PAGES = [
  { file: "01-auth-login.png", title: "Autenticação", desc: "Página de entrada (login/registo)." },
  { file: "02-dashboard.png", title: "Dashboard", desc: "Resumo da operação do dia." },
  { file: "03-vendas-pdv.png", title: "Vendas (PDV)", desc: "Ponto de venda — pesquisa, carrinho e fecho." },
  { file: "04-caixa.png", title: "Caixa", desc: "Abertura e fecho de turno do operador." },
  { file: "05-validar-recibo.png", title: "Validar Recibo", desc: "Verifica autenticidade de um recibo." },
  { file: "06-alertas.png", title: "Alertas", desc: "Estoque baixo, próximos a vencer e vencidos." },
  { file: "07-estoque.png", title: "Estoque", desc: "Inventário, lotes, custos e validades." },
  { file: "08-estatisticas.png", title: "Estatísticas", desc: "KPIs, gráficos de vendas, margens e operadores." },
  { file: "09-contas.png", title: "Contas", desc: "Movimentos financeiros por forma de pagamento." },
  { file: "10-fornecedores.png", title: "Fornecedores", desc: "Cadastro de distribuidores e parceiros." },
  { file: "11-relatorios.png", title: "Relatórios", desc: "Relatório consolidado exportável em CSV." },
  { file: "12-utilizadores.png", title: "Utilizadores", desc: "CRUD de contas e perfis (admin)." },
  { file: "13-historico.png", title: "Histórico & Logs", desc: "Vendas recentes, movimentos e auditoria." },
  { file: "14-configuracoes.png", title: "Configurações", desc: "Dados da farmácia e configuração do recibo." },
];

async function signed(path: string, exp = 3600) {
  const { data, error } = await supabase.storage.from("docs").createSignedUrl(path, exp);
  if (error) throw error;
  return data.signedUrl;
}

function DocumentacaoPage() {
  const [zoom, setZoom] = useState<string | null>(null);

  const { data: docs } = useQuery({
    queryKey: ["docs-files"],
    queryFn: async () => ({
      docx: await signed("PharmaSys-Documentacao.docx", 60 * 60 * 24),
      pdf: await signed("PharmaSys-Documentacao.pdf", 60 * 60 * 24),
    }),
  });

  const { data: imgs, isLoading } = useQuery({
    queryKey: ["docs-images"],
    queryFn: async () => {
      const entries = await Promise.all(
        PAGES.map(async (p) => ({ ...p, url: await signed(`fotos/${p.file}`, 60 * 60 * 6) })),
      );
      return entries;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Documentação do sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manual completo do PharmaSys: páginas, botões, fluxos e perfis de utilizador.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild disabled={!docs}>
            <a href={docs?.pdf} target="_blank" rel="noreferrer">
              <FileText className="mr-2 h-4 w-4" /> Descarregar PDF
            </a>
          </Button>
          <Button asChild variant="secondary" disabled={!docs}>
            <a href={docs?.docx} target="_blank" rel="noreferrer">
              <FileDown className="mr-2 h-4 w-4" /> Descarregar Word
            </a>
          </Button>
          {!docs && <span className="text-xs text-muted-foreground self-center">A gerar links seguros…</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Galeria — todas as páginas do sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clique numa imagem para ampliar. {PAGES.length} ecrãs capturados.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {imgs?.map((p) => (
                <figure
                  key={p.file}
                  className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setZoom(p.url)}
                    className="block w-full overflow-hidden"
                    title="Clique para ampliar"
                  >
                    <img
                      src={p.url}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </button>
                  <figcaption className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{p.title}</span>
                      <a
                        href={p.url}
                        download={p.file}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        title="Descarregar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-5xl p-2">
          {zoom && <img src={zoom} alt="Pré-visualização" className="h-auto w-full rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
