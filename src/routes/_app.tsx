import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, Package, Layers, Truck, Users, ShoppingCart,
  Receipt, Bell, BarChart3, UserCog, LogOut, Pill, Loader2,
} from "lucide-react";
import { useAuth, roleLabel } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pdv", label: "PDV / Vendas", icon: ShoppingCart },
  { to: "/products", label: "Produtos", icon: Package },
  { to: "/batches", label: "Estoque & Lotes", icon: Layers },
  { to: "/suppliers", label: "Fornecedores", icon: Truck, staff: true },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/sales", label: "Histórico de Vendas", icon: Receipt },
  { to: "/alerts", label: "Alertas", icon: Bell },
  { to: "/reports", label: "Relatórios", icon: BarChart3, staff: true },
  { to: "/users", label: "Usuários", icon: UserCog, admin: true },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!auth.loading && !auth.user) navigate({ to: "/auth" });
  }, [auth.loading, auth.user, navigate]);

  if (auth.loading || !auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => {
    if ("admin" in item && item.admin) return auth.isAdmin;
    if ("staff" in item && item.staff) return auth.isStaff;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold p-6 border-b border-sidebar-border">
          <Pill className="h-6 w-6 text-primary" /> FarmaGest
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{auth.profile?.full_name ?? auth.user.email}</p>
            <p className="text-xs text-sidebar-foreground/60">
              {auth.highestRole ? roleLabel[auth.highestRole] : "Sem papel"}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={async () => { await auth.signOut(); navigate({ to: "/auth" }); }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
