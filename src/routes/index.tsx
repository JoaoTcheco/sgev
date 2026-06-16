import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Pill, ShieldCheck, BarChart3, Bell, Package, ShoppingCart, Layers,
  ArrowRight, Check, Sparkles, Zap, TrendingUp, Clock, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmaGest — Gestão completa de farmácia" },
      { name: "description", content: "Controle estoque, vendas, lotes, validades e relatórios da sua farmácia em um único sistema moderno." },
      { property: "og:title", content: "FarmaGest — Gestão de farmácia" },
      { property: "og:description", content: "Estoque por lote, PDV ágil, alertas e relatórios. Tudo em um só lugar." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Package, title: "Estoque por lote", desc: "Lote, validade e localização. Saída FEFO automática para evitar perdas." },
  { icon: ShoppingCart, title: "PDV ágil", desc: "Atalhos de teclado, leitor de código de barras e múltiplas formas de pagamento." },
  { icon: Layers, title: "Caixa & carteira", desc: "Venda a caixa fechada ou em frações (carteiras), com baixa proporcional no estoque." },
  { icon: Bell, title: "Alertas inteligentes", desc: "Estoque mínimo e vencimentos próximos calculados em tempo real." },
  { icon: BarChart3, title: "Relatórios estratégicos", desc: "Top vendas, ticket médio, formas de pagamento e exportação CSV." },
  { icon: ShieldCheck, title: "3 níveis de acesso", desc: "Admin, farmacêutico e caixa com permissões granulares e auditoria." },
];

const STATS = [
  { value: "FEFO", label: "Saída automática", icon: Zap },
  { value: "100%", label: "Rastreabilidade", icon: ShieldCheck },
  { value: "Real-time", label: "Alertas e KPIs", icon: TrendingUp },
  { value: "24/7", label: "Disponível", icon: Clock },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-lg shadow-primary/30">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
            FarmaGest
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
            <Button asChild className="shadow-md shadow-primary/20">
              <Link to="/dashboard">Abrir sistema <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-2/20 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Novo · PDV com caixa e carteira
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
                Sua farmácia,<br />
                <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-5 bg-clip-text text-transparent">
                  inteligente de verdade.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Estoque por lote e validade, PDV ágil com leitor de código de barras,
                alertas em tempo real e relatórios estratégicos. Tudo num só sistema.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="shadow-lg shadow-primary/30">
                  <Link to="/dashboard">Explorar sistema <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">Criar conta</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                {["Sem cartão de crédito", "Setup em minutos", "Suporte em PT-BR"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-success" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Mock dashboard card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-chart-2/30 rounded-3xl blur-2xl opacity-60" />
              <div className="relative bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Vendas hoje</p>
                    <p className="text-3xl font-extrabold tracking-tight">R$ 4.829,50</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-success/15 text-success flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +18%
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 h-32 items-end">
                  {[40, 65, 50, 80, 45, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-md bg-gradient-to-t from-primary/30 to-primary" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { icon: ShoppingCart, label: "Vendas", value: "127" },
                    { icon: Package, label: "Produtos", value: "1.284" },
                    { icon: Bell, label: "Alertas", value: "3" },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/40 rounded-xl p-3">
                      <s.icon className="h-4 w-4 text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS strip */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Recursos</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">
              Tudo para gerir sua farmácia.
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Pensado para o dia a dia: rápido, claro e à prova de erros.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/15 text-primary grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="bg-muted/30 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Como funciona</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Comece em 3 passos</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { n: "01", title: "Cadastre produtos & fornecedores", desc: "Importação rápida, código de barras e categorização completa." },
                { n: "02", title: "Receba estoque por lote", desc: "Registre lote, validade e custo. O sistema cuida do FEFO." },
                { n: "03", title: "Venda no PDV e acompanhe", desc: "Vendas com baixa automática, alertas e relatórios prontos." },
              ].map((s) => (
                <div key={s.n} className="bg-card border border-border rounded-2xl p-7 relative overflow-hidden">
                  <span className="absolute -top-4 -right-2 text-7xl font-black text-primary/10">{s.n}</span>
                  <div className="relative">
                    <p className="text-sm font-bold text-primary mb-2">PASSO {s.n}</p>
                    <h3 className="font-bold text-xl mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Planos</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Simples e transparente</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "Grátis", desc: "Para começar", features: ["1 usuário", "Até 100 produtos", "PDV básico", "Relatórios essenciais"], cta: "Começar agora" },
              { name: "Pro", price: "R$ 89", per: "/mês", desc: "Mais popular", features: ["Usuários ilimitados", "Produtos ilimitados", "PDV completo + atalhos", "Todos os relatórios", "Alertas em tempo real"], cta: "Assinar Pro", featured: true },
              { name: "Business", price: "R$ 199", per: "/mês", desc: "Múltiplas filiais", features: ["Tudo do Pro", "Múltiplas filiais", "Integrações", "Suporte prioritário"], cta: "Falar com vendas" },
            ].map((p) => (
              <div key={p.name} className={`relative rounded-2xl p-7 border ${p.featured ? "border-primary bg-gradient-to-b from-primary/5 to-transparent shadow-xl shadow-primary/10" : "border-border bg-card"}`}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground">Mais popular</span>}
                <p className="font-bold text-lg">{p.name}</p>
                <p className="text-xs text-muted-foreground mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.featured ? "default" : "outline"} className="w-full">
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto rounded-3xl p-12 md:p-16 bg-gradient-to-br from-primary via-chart-2 to-chart-5 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="relative">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Pronto para modernizar sua farmácia?
              </h2>
              <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8">
                Entre agora e explore todos os recursos do sistema sem compromisso.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/dashboard">Abrir o sistema <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link to="/auth">Criar conta gratuita</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Pill className="h-5 w-5 text-primary" /> FarmaGest
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FarmaGest. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">Sistema</Link>
            <Link to="/auth" className="hover:text-foreground">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
