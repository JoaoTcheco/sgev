import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PackagePlus,
  AlertTriangle,
  BarChart3,
  Users,
  History,
  Wallet,
  Truck,
  
  LogOut,
  Pill,
  Settings,
  Receipt,
  Banknote,
  Percent,
} from "lucide-react";


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles, useProfile, highestRole, roleLabel } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; roles: Array<"admin" | "pharmacist" | "cashier"> };

const OPERATIONAL: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "pharmacist", "cashier"] },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart, roles: ["admin", "pharmacist", "cashier"] },
  { title: "Caixa", url: "/caixa", icon: Banknote, roles: ["admin", "pharmacist", "cashier"] },
  { title: "Validar Recibo", url: "/recibo", icon: Receipt, roles: ["admin", "pharmacist", "cashier"] },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle, roles: ["admin", "pharmacist", "cashier"] },
  { title: "Estoque", url: "/estoque", icon: Package, roles: ["admin", "pharmacist"] },
  { title: "Entrada", url: "/entrada", icon: PackagePlus, roles: ["admin", "pharmacist"] },
  { title: "Estatísticas", url: "/estatisticas", icon: BarChart3, roles: ["admin", "pharmacist"] },
];




const MANAGEMENT: Item[] = [
  { title: "Contas", url: "/contas", icon: Wallet, roles: ["admin", "pharmacist"] },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck, roles: ["admin", "pharmacist"] },
  { title: "Margens & Custos", url: "/margens", icon: Percent, roles: ["admin", "pharmacist"] },
];


const ADMIN: Item[] = [
  { title: "Utilizadores", url: "/utilizadores", icon: Users, roles: ["admin"] },
  { title: "Histórico & Logs", url: "/historico", icon: History, roles: ["admin"] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] },
];



export function AppSidebar() {
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const { data: profile } = useProfile(user?.id);
  const role = highestRole(roles);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const visible = (items: Item[]) => items.filter((i) => role && i.roles.includes(role));

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const renderGroup = (label: string, items: Item[]) => {
    const list = visible(items);
    if (list.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {list.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Pill className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">PharmaSys</span>
            <span className="text-xs text-sidebar-foreground/60">Gestão Farmácia</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operação", OPERATIONAL)}
        {renderGroup("Gestão", MANAGEMENT)}
        {renderGroup("Administração", ADMIN)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col gap-2 px-2 py-2">
          <div className="flex flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {profile?.full_name || user?.email || "Utilizador"}
            </span>
            <span className="text-xs text-sidebar-foreground/60">{roleLabel(role)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
