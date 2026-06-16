import { createFileRoute, Link } from "@tanstack/react-router";
import { Pill, ShieldCheck, BarChart3, Bell, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmaGest — Gestão completa de farmácia" },
      { name: "description", content: "Controle estoque, vendas, lotes e validades em um só sistema." },
      { property: "og:title", content: "FarmaGest" },
      { property: "og:description", content: "Gestão completa de farmácia." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <Pill className="h-6 w-6" /> FarmaGest
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
            <Button asChild><Link to="/auth">Começar</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              Sistema completo de gestão farmacêutica
            </span>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Sua farmácia,<br />sob controle total.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Estoque por lote e validade, ponto de venda ágil, alertas inteligentes
              e relatórios estratégicos. Tudo o que você precisa, num só lugar.
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild><Link to="/auth">Criar conta gratuita</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/auth">Já tenho conta</Link></Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-accent rounded-3xl p-8 aspect-square flex items-center justify-center">
            <Pill className="h-48 w-48 text-primary" strokeWidth={1} />
          </div>
        </section>

        <section className="bg-secondary/40 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Recursos principais</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Package, title: "Estoque por lote", desc: "Controle por lote, validade e localização. Saída FEFO automática." },
                { icon: ShoppingCart, title: "PDV completo", desc: "Vendas ágeis, múltiplas formas de pagamento e cupom impresso." },
                { icon: Bell, title: "Alertas inteligentes", desc: "Estoque mínimo e proximidade de vencimento — você nunca é pego de surpresa." },
                { icon: BarChart3, title: "Relatórios estratégicos", desc: "Mais vendidos, menos vendidos, lucratividade e muito mais." },
                { icon: ShieldCheck, title: "3 níveis de acesso", desc: "Administrador, farmacêutico e caixa, com permissões granulares." },
                { icon: Pill, title: "Cadastro completo", desc: "Princípio ativo, tarja, receita, código de barras — controle total." },
              ].map((f) => (
                <div key={f.title} className="bg-card rounded-2xl p-6 border">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground text-center">
          © FarmaGest — Sistema de gestão farmacêutica
        </div>
      </footer>
    </div>
  );
}
