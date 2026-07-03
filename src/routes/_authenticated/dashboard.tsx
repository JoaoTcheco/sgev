import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN, formatDateTime, mzParts, mzDaysAgoYMD, mzLocalToISO } from "@/lib/format";
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  TrendingUp,
  CalendarClock,
  Users,
  Wallet,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { useAuthUser, useProfile, useUserRoles, highestRole } from "@/hooks/use-auth";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PharmaSys" }] }),
  component: DashboardPage,
});

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Numerário",
  card: "Cartão",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transfer: "Transferência",
  credit: "Crédito",
  mixed: "Misto",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success, 142 71% 45%))",
  "hsl(var(--warning, 38 92% 50%))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent-foreground))",
];

function DashboardPage() {
  const { user } = useAuthUser();
  const { data: profile } = useProfile(user?.id);
  const { data: roles } = useUserRoles(user?.id);
  const role = highestRole(roles ?? []);
  const isAdmin = role === "admin" || role === "pharmacist";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-admin"],
    queryFn: async () => {
      const todayYMD = mzParts(new Date()).dayKey;
      const startTodayISO = mzLocalToISO(todayYMD, 0, 0, 0);
      const start7ISO = mzLocalToISO(mzDaysAgoYMD(6), 0, 0, 0);
      const start30ISO = mzLocalToISO(mzDaysAgoYMD(29), 0, 0, 0);

      const [salesTodayRes, sales7Res, sales30Res, alertsRes, productsRes, customersRes, expiringRes, recentSalesRes] =
        await Promise.all([
          supabase.from("sales").select("total, payment_method").eq("status", "completed").gte("created_at", startTodayISO),
          supabase.from("sales").select("total, created_at, payment_method").eq("status", "completed").gte("created_at", start7ISO),
          supabase.from("sales").select("id, total, created_at").eq("status", "completed").gte("created_at", start30ISO),
          supabase.from("alerts").select("id, severity, type").eq("resolved", false),
          supabase.from("products").select("id, name, min_stock, ideal_stock, active").eq("active", true),
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("batches").select("id, expiry_date, quantity, product_id").gt("quantity", 0),
          supabase
            .from("sales")
            .select("id, sale_number, total, payment_method, created_at, customer_id")
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

      const salesToday = salesTodayRes.data ?? [];
      const sales7 = sales7Res.data ?? [];
      const sales30 = sales30Res.data ?? [];
      const alerts = alertsRes.data ?? [];
      const products = productsRes.data ?? [];
      const batches = expiringRes.data ?? [];

      const totalToday = salesToday.reduce((a, s) => a + Number(s.total), 0);
      const total7 = sales7.reduce((a, s) => a + Number(s.total), 0);
      const total30 = sales30.reduce((a, s) => a + Number(s.total), 0);

      // Sales per day (last 7)
      const dayBuckets = new Map<string, { day: string; total: number; count: number }>();
      for (let i = 6; i >= 0; i--) {
        const ymd = mzDaysAgoYMD(i);
        dayBuckets.set(ymd, { day: ymd.slice(5), total: 0, count: 0 });
      }
      for (const s of sales7) {
        const key = mzParts(s.created_at as string).dayKey;
        const b = dayBuckets.get(key);
        if (b) {
          b.total += Number(s.total);
          b.count += 1;
        }
      }
      const salesSeries = Array.from(dayBuckets.values());

      // Payment method breakdown (last 7d)
      const payMap = new Map<string, number>();
      for (const s of sales7) {
        const k = (s.payment_method as string) ?? "cash";
        payMap.set(k, (payMap.get(k) ?? 0) + Number(s.total));
      }
      const paymentSeries = Array.from(payMap.entries())
        .map(([k, v]) => ({ name: PAYMENT_LABELS[k] ?? k, value: Number(v.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);

      // Top products (last 30d) — via sale_items joined to sales window
      const saleIds30 = sales30.map((s) => s.id);
      let topProducts: { name: string; qty: number; total: number }[] = [];
      if (saleIds30.length) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("product_name, quantity, total, sale_id")
          .in("sale_id", saleIds30);
        const map = new Map<string, { name: string; qty: number; total: number }>();
        for (const it of items ?? []) {
          const key = it.product_name as string;
          const cur = map.get(key) ?? { name: key, qty: 0, total: 0 };
          cur.qty += Number(it.quantity);
          cur.total += Number(it.total);
          map.set(key, cur);
        }
        topProducts = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
      }

      // Expiring in <= 60 days
      const now = new Date();
      const in60 = new Date(now.getTime() + 60 * 86400_000);
      const expiringSoon = batches.filter((b) => {
        if (!b.expiry_date) return false;
        const d = new Date(b.expiry_date as string);
        return d >= now && d <= in60;
      }).length;

      const lowStockCount = alerts.filter((a) => a.type === "low_stock" || a.type === "out_of_stock").length;
      const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

      const ticketMedioToday = salesToday.length ? totalToday / salesToday.length : 0;
      const avgDaily7 = total7 / 7;

      return {
        totalToday,
        salesTodayCount: salesToday.length,
        ticketMedioToday,
        total7,
        total30,
        avgDaily7,
        sales30Count: sales30.length,
        alertsActive: alerts.length,
        criticalAlerts,
        lowStockCount,
        expiringSoon,
        productsActive: products.length,
        customersCount: customersRes.count ?? 0,
        salesSeries,
        paymentSeries,
        topProducts,
        recentSales: recentSalesRes.data ?? [],
      };
    },
    refetchInterval: 60_000,
  });

  const firstName = profile?.full_name?.split(" ")[0] || "bem-vindo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName} 👋</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Visão geral da operação da farmácia." : "Resumo da operação de hoje."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/estatisticas">
              Estatísticas <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/vendas">Nova venda</Link>
          </Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturado hoje"
          value={formatMZN(data?.totalToday ?? 0)}
          subtitle={`${data?.salesTodayCount ?? 0} vendas · ticket ${formatMZN(data?.ticketMedioToday ?? 0)}`}
          icon={ShoppingCart}
          tone="primary"
        />
        <StatCard
          title="Últimos 7 dias"
          value={formatMZN(data?.total7 ?? 0)}
          subtitle={`Média/dia ${formatMZN(data?.avgDaily7 ?? 0)}`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Últimos 30 dias"
          value={formatMZN(data?.total30 ?? 0)}
          subtitle={`${data?.sales30Count ?? 0} vendas concluídas`}
          icon={Activity}
          tone="muted"
        />
        <StatCard
          title="Alertas activos"
          value={String(data?.alertsActive ?? 0)}
          subtitle={`${data?.criticalAlerts ?? 0} críticos · ${data?.lowStockCount ?? 0} de stock`}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat title="Produtos activos" value={String(data?.productsActive ?? 0)} icon={Package} />
        <MiniStat title="Clientes registados" value={String(data?.customersCount ?? 0)} icon={Users} />
        <MiniStat title="Lotes a expirar (60d)" value={String(data?.expiringSoon ?? 0)} icon={CalendarClock} />
        <MiniStat title="Ticket médio (hoje)" value={formatMZN(data?.ticketMedioToday ?? 0)} icon={Wallet} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendas — últimos 7 dias</CardTitle>
            <CardDescription>Faturação diária em MZN</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full"
              config={{ total: { label: "Faturação", color: "hsl(var(--primary))" } }}
            >
              <AreaChart data={data?.salesSeries ?? []}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fillTotal)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de pagamento</CardTitle>
            <CardDescription>Distribuição (7 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.paymentSeries ?? []).length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <ChartContainer className="h-[260px] w-full" config={{}}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={data?.paymentSeries ?? []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {(data?.paymentSeries ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="mt-3 space-y-1 text-sm">
              {(data?.paymentSeries ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {p.name}
                  </span>
                  <span className="font-medium tabular-nums">{formatMZN(p.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top products + Recent sales */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top produtos (30 dias)</CardTitle>
            <CardDescription>Por faturação</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.topProducts ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas no período.</p>
            ) : (
              <ChartContainer
                className="h-[260px] w-full"
                config={{ total: { label: "Faturação", color: "hsl(var(--primary))" } }}
              >
                <BarChart data={data?.topProducts ?? []} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendas recentes</CardTitle>
              <CardDescription>Últimas transacções concluídas</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/historico">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(data?.recentSales ?? []).length === 0 && !isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas recentes.</p>
            ) : (
              <ul className="divide-y">
                {(data?.recentSales ?? []).map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Venda #{s.sale_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(s.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatMZN(s.total)}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                        {PAYMENT_LABELS[s.payment_method] ?? s.payment_method}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
