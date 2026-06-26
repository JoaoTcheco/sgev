import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { I as redirect } from "../_libs/tanstack__router-core.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-D9M-ftIG.mjs";
import { J as JsBarcode } from "../_libs/jsbarcode.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const appCss = "/assets/styles-Cp25kgk7.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$i = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$i.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
const $$splitComponentImporter$h = () => import("./auth-CdGCLJ-A.mjs");
const Route$h = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "Entrar — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
function getBridge() {
  if (typeof window === "undefined") return null;
  return window.pharmasys ?? null;
}
function isDesktop() {
  return !!getBridge();
}
async function call(channel, payload) {
  const b = getBridge();
  if (!b) throw new Error("Aplicação desktop não detectada");
  try {
    return await b.query(channel, payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[desktop] ${channel} falhou:`, msg);
    throw new Error(msg);
  }
}
const desktop = {
  isDesktop,
  auth: {
    bootstrapNeeded: () => call("auth.bootstrap-needed"),
    createFirstAdmin: (input) => call("auth.create-first-admin", input),
    signIn: (input) => call("auth.sign-in", input),
    changePassword: (input) => call("auth.change-password", input)
  },
  admin: {
    listUsers: () => call(
      "admin.list-users"
    ),
    createUser: (input) => call("admin.create-user", input),
    setRole: (input) => call("admin.set-role", input),
    setActive: (input) => call("admin.set-active", input),
    resetPassword: (input) => call("admin.reset-password", input),
    updateUser: (input) => call("admin.update-user", input),
    deleteUser: (input) => call("admin.delete-user", input),
    auditLogs: () => call(
      "admin.audit-logs"
    )
  },
  // SQL directo (para queries complexas)
  select: (sql, params = []) => call("select", { sql, params }),
  get: (sql, params = []) => call("get", { sql, params }),
  run: (sql, params = []) => call("run", { sql, params }),
  // CRUD por tabela
  insert: (table, values) => call("insert", { table, values }),
  update: (table, id, values) => call("update", { table, id, values }),
  remove: (table, id) => call("delete", { table, id }),
  // RPCs
  rpc: {
    processSale: (input) => call("rpc.process-sale", input),
    openCashSession: (input) => call("rpc.open-cash-session", input),
    closeCashSession: (input) => call("rpc.close-cash-session", input),
    addBatch: (input) => call("rpc.add-batch", input),
    refreshAlerts: () => call("rpc.refresh-alerts")
  },
  backup: {
    now: () => getBridge().backupNow(),
    restore: () => getBridge().restoreBackup(),
    openFolder: () => getBridge().openBackupsFolder(),
    openLogs: () => getBridge().openLogsFolder()
  }
};
const KEY = "pharmasys.session";
function getDesktopUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setDesktopUser(user) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("pharmasys.auth-change"));
}
async function desktopSignIn(email, password) {
  const user = await desktop.auth.signIn({ email, password });
  setDesktopUser(user);
  return user;
}
async function desktopBootstrap(input) {
  const user = await desktop.auth.createFirstAdmin(input);
  setDesktopUser(user);
  return user;
}
function desktopSignOut() {
  setDesktopUser(null);
}
function useDesktopAuth() {
  const [user, setUser] = reactExports.useState(() => getDesktopUser());
  const [bootstrapNeeded, setBootstrapNeeded] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!isDesktop()) {
      setBootstrapNeeded(false);
      return;
    }
    desktop.auth.bootstrapNeeded().then(setBootstrapNeeded).catch(() => setBootstrapNeeded(false));
    const onChange = () => setUser(getDesktopUser());
    window.addEventListener("pharmasys.auth-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pharmasys.auth-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return { user, bootstrapNeeded, isDesktop: isDesktop() };
}
const $$splitComponentImporter$g = () => import("./route-LTeuHWva.mjs");
const Route$g = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (isDesktop()) {
      const u = getDesktopUser();
      if (!u) throw redirect({
        to: "/auth"
      });
      return {
        user: {
          id: u.id,
          email: u.email
        }
      };
    }
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    return {
      user: data.user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./index-BTU5dmpx.mjs");
const Route$f = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({
      to: "/auth"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./vendas-BbbDt-hx.mjs");
const Route$e = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [{
      title: "Vendas — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./utilizadores-jN4kEUHx.mjs");
const Route$d = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({
    meta: [{
      title: "Utilizadores — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./relatorios-BftIYOkO.mjs");
const Route$c = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [{
      title: "Relatórios — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./historico-Dgiidm9P.mjs");
const Route$b = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [{
      title: "Histórico — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./fornecedores-srH9v6w3.mjs");
const Route$a = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [{
      title: "Fornecedores — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./estoque-B0cKOGu0.mjs");
const Route$9 = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [{
      title: "Estoque — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./estatisticas-CUVDdVYP.mjs");
const Route$8 = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({
    meta: [{
      title: "Estatísticas — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./entrada-ChJkOLyY.mjs");
const Route$7 = createFileRoute("/_authenticated/entrada")({
  head: () => ({
    meta: [{
      title: "Entrada de Mercadoria — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./dashboard-BmbwsYzK.mjs");
const Route$6 = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{
      title: "Dashboard — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./contas-Bji5u_61.mjs");
const Route$5 = createFileRoute("/_authenticated/contas")({
  head: () => ({
    meta: [{
      title: "Contas — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
function normalizeDesktopProduct(p, batches) {
  return {
    id: p.id,
    name: p.name,
    sale_price: Number(p.price ?? 0),
    sub_unit_price: p.sub_price != null ? Number(p.sub_price) : null,
    sub_unit_label: p.sub_unit_label ?? null,
    unit: p.unit ?? "cx",
    pack_size: Number(p.pack_size ?? 1),
    requires_prescription: !!p.requires_prescription,
    barcode: p.barcode ?? null,
    batches: batches.map((b) => ({ quantity: Number(b.quantity), expiry_date: b.expiry_date }))
  };
}
async function listPosProducts(search) {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term ? `SELECT * FROM products WHERE active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name LIMIT 40` : `SELECT * FROM products WHERE active = 1 ORDER BY name LIMIT 40`;
    const params = term ? [`%${term}%`, `%${term}%`] : [];
    const rows = await desktop.select(sql, params);
    if (rows.length === 0) return [];
    const ids = rows.map((r) => `'${r.id.replace(/'/g, "''")}'`).join(",");
    const batches = await desktop.select(
      `SELECT product_id, quantity, expiry_date FROM batches WHERE product_id IN (${ids}) AND quantity > 0`
    );
    const byProd = /* @__PURE__ */ new Map();
    for (const b of batches) {
      const list = byProd.get(b.product_id) ?? [];
      list.push(b);
      byProd.set(b.product_id, list);
    }
    return rows.map((r) => normalizeDesktopProduct(r, byProd.get(r.id) ?? []));
  }
  let q = supabase.from("products").select(
    "id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, barcode, batches(quantity, expiry_date)"
  ).eq("active", true).order("name").limit(40);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
async function findProductByBarcode(code) {
  if (isDesktop()) {
    const p = await desktop.get("SELECT * FROM products WHERE barcode = ? AND active = 1", [code]);
    if (!p) return null;
    const batches = await desktop.select(
      "SELECT quantity, expiry_date FROM batches WHERE product_id = ? AND quantity > 0",
      [p.id]
    );
    return normalizeDesktopProduct(p, batches);
  }
  const { data, error } = await supabase.from("products").select(
    "id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, barcode, batches(quantity, expiry_date)"
  ).eq("barcode", code).eq("active", true).maybeSingle();
  if (error) throw error;
  return data ?? null;
}
async function processSale(input) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    const payment_method2 = input.paymentKind === "cash" ? "cash" : input.wallet;
    const res = await desktop.rpc.processSale({
      user_id: userId,
      customer_id: null,
      payment_method: payment_method2,
      discount: input.discount,
      items: input.items,
      amount_received: input.amountReceived ?? null,
      change_due: input.changeDue ?? null
    });
    return { saleId: res.id, receipt_number: res.receipt_number };
  }
  const WALLET_TO_ENUM = {
    bank: "debit",
    mpesa: "pix",
    emola: "other"
  };
  const payment_method = input.paymentKind === "cash" ? "cash" : WALLET_TO_ENUM[input.wallet];
  const { data, error } = await supabase.rpc("process_sale", {
    p_customer_id: null,
    p_payment_method: payment_method,
    p_discount: input.discount,
    p_items: input.items
  });
  if (error) throw error;
  const saleId = data;
  const { data: sale } = await supabase.from("sales").select("receipt_number").eq("id", saleId).maybeSingle();
  return { saleId, receipt_number: sale?.receipt_number ?? null };
}
async function listMyCashSessions(userId) {
  if (isDesktop()) {
    const rows = await desktop.select(
      `SELECT id, opened_at, closed_at, opening_amount, counted_amount, expected_amount, difference, notes, status
       FROM cash_sessions WHERE user_id = ? ORDER BY opened_at DESC LIMIT 20`,
      [userId]
    );
    return rows;
  }
  const { data, error } = await supabase.from("cash_sessions").select("id, opened_at, closed_at, opening_amount, counted_amount, expected_amount, difference, notes, status").eq("user_id", userId).order("opened_at", { ascending: false }).limit(20);
  if (error) throw error;
  return data ?? [];
}
async function getOpenCashSession(userId) {
  if (isDesktop()) {
    const row = await desktop.get(
      `SELECT id, opened_at, opening_amount FROM cash_sessions WHERE user_id = ? AND status = 'open'`,
      [userId]
    );
    return row ?? null;
  }
  const { data, error } = await supabase.from("cash_sessions").select("id, opened_at, opening_amount").eq("user_id", userId).eq("status", "open").maybeSingle();
  if (error) throw error;
  return data ?? null;
}
async function listSessionSales(sessionId) {
  if (isDesktop()) {
    return desktop.select(
      "SELECT total, payment_method, status FROM sales WHERE cash_session_id = ? AND status = 'completed'",
      [sessionId]
    );
  }
  const { data, error } = await supabase.from("sales").select("total, payment_method, status").eq("cash_session_id", sessionId).eq("status", "completed");
  if (error) throw error;
  return data ?? [];
}
async function openCashSession(opening) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.openCashSession({ user_id: userId, opening_amount: opening });
  }
  const { error } = await supabase.rpc("open_cash_session", { p_opening: opening });
  if (error) throw error;
}
async function closeCashSession(counted, notes) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.closeCashSession({ user_id: userId, counted_amount: counted, notes });
  }
  const { error } = await supabase.rpc("close_cash_session", { p_counted: counted, p_notes: notes });
  if (error) throw error;
}
async function listSuppliersMin() {
  if (isDesktop()) {
    const rows = await desktop.select(
      "SELECT id, name AS legal_name FROM suppliers WHERE active = 1 ORDER BY name"
    );
    return rows;
  }
  const { data, error } = await supabase.from("suppliers").select("id, legal_name").eq("active", true).order("legal_name");
  if (error) throw error;
  return data ?? [];
}
async function listEntradaProducts(search) {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term ? `SELECT id, name, barcode, price AS sale_price, unit, NULL as manufacturer
         FROM products WHERE active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name LIMIT 30` : `SELECT id, name, barcode, price AS sale_price, unit, NULL as manufacturer
         FROM products WHERE active = 1 ORDER BY name LIMIT 30`;
    const params = term ? [`%${term}%`, `%${term}%`] : [];
    return desktop.select(sql, params);
  }
  let q = supabase.from("products").select("id, name, manufacturer, barcode, sale_price, unit").eq("active", true).order("name").limit(30);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
async function addBatchEntry(input) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.addBatch({ user_id: userId, ...input });
  }
  const { error } = await supabase.rpc("add_batch_entry", {
    p_product_id: input.product_id,
    p_supplier_id: input.supplier_id,
    p_batch_number: input.batch_number,
    p_expiry_date: input.expiry_date,
    p_quantity: input.quantity,
    p_cost_price: input.cost_price
  });
  if (error) throw error;
}
function mapDesktopStock(p, batches) {
  return {
    id: p.id,
    name: p.name,
    manufacturer: p.manufacturer ?? null,
    unit: p.unit ?? "cx",
    pack_size: Number(p.pack_size ?? 1),
    min_stock: Number(p.min_stock ?? 0),
    ideal_stock: Number(p.ideal_stock ?? 0),
    sale_price: Number(p.price ?? 0),
    cost_price: Number(p.cost_price ?? 0),
    tarja: p.tarja ?? null,
    active: !!p.active,
    barcode: p.barcode ?? null,
    category_id: p.category_id ?? null,
    active_ingredient: p.active_ingredient ?? null,
    requires_prescription: !!p.requires_prescription,
    sub_unit_label: p.sub_unit_label ?? null,
    sub_unit_price: p.sub_price != null ? Number(p.sub_price) : null,
    batches: batches.map((b) => ({ id: b.id, expiry_date: b.expiry_date, quantity: Number(b.quantity) }))
  };
}
async function listStockProducts(search) {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term ? `SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? OR manufacturer LIKE ? ORDER BY name LIMIT 200` : `SELECT * FROM products ORDER BY name LIMIT 200`;
    const params = term ? [`%${term}%`, `%${term}%`, `%${term}%`] : [];
    const rows = await desktop.select(sql, params);
    if (rows.length === 0) return [];
    const ids = rows.map((r) => `'${r.id.replace(/'/g, "''")}'`).join(",");
    const batches = await desktop.select(
      `SELECT id, product_id, expiry_date, quantity FROM batches WHERE product_id IN (${ids})`
    );
    const byProd = /* @__PURE__ */ new Map();
    for (const b of batches) {
      const list = byProd.get(b.product_id) ?? [];
      list.push(b);
      byProd.set(b.product_id, list);
    }
    return rows.map((r) => mapDesktopStock(r, byProd.get(r.id) ?? []));
  }
  let q = supabase.from("products").select(
    "id, name, manufacturer, unit, pack_size, min_stock, ideal_stock, sale_price, cost_price, tarja, active, barcode, category_id, active_ingredient, requires_prescription, sub_unit_label, sub_unit_price, batches(id, expiry_date, quantity)"
  ).order("name").limit(200);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
async function listCategoriesMin() {
  if (isDesktop()) {
    const rows = await desktop.select("SELECT id, name FROM categories ORDER BY name");
    return rows;
  }
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}
async function saveProduct(p) {
  if (isDesktop()) {
    const values = {
      name: p.name,
      manufacturer: p.manufacturer,
      unit: p.unit,
      pack_size: p.pack_size,
      min_stock: p.min_stock,
      ideal_stock: p.ideal_stock,
      cost_price: p.cost_price,
      price: p.sale_price,
      sub_price: p.sub_unit_price,
      sub_unit_label: p.sub_unit_label,
      tarja: p.tarja,
      active: p.active ? 1 : 0,
      barcode: p.barcode,
      category_id: p.category_id,
      active_ingredient: p.active_ingredient,
      requires_prescription: p.requires_prescription ? 1 : 0
    };
    if (p.id) {
      await desktop.update("products", p.id, values);
    } else {
      await desktop.insert("products", values);
    }
    return;
  }
  const payload = {
    name: p.name,
    manufacturer: p.manufacturer,
    unit: p.unit,
    pack_size: p.pack_size,
    min_stock: p.min_stock,
    ideal_stock: p.ideal_stock,
    cost_price: p.cost_price,
    sale_price: p.sale_price,
    sub_unit_price: p.sub_unit_price,
    sub_unit_label: p.sub_unit_label,
    tarja: p.tarja,
    active: p.active,
    barcode: p.barcode,
    category_id: p.category_id,
    active_ingredient: p.active_ingredient,
    requires_prescription: p.requires_prescription
  };
  if (p.id) {
    const { error } = await supabase.from("products").update(payload).eq("id", p.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw error;
  }
}
async function deleteOrDisableProduct(id) {
  if (isDesktop()) {
    try {
      await desktop.remove("products", id);
      return "deleted";
    } catch {
      await desktop.update("products", id, { active: 0 });
      return "disabled";
    }
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    const { error: e2 } = await supabase.from("products").update({ active: false }).eq("id", id);
    if (e2) throw e2;
    return "disabled";
  }
  return "deleted";
}
async function assignProductBarcode(id, barcode) {
  if (isDesktop()) {
    await desktop.update("products", id, { barcode });
    return;
  }
  const { error } = await supabase.from("products").update({ barcode }).eq("id", id);
  if (error) throw error;
}
async function listAdminUsers() {
  if (isDesktop()) {
    return await desktop.admin.listUsers();
  }
  const [{ data: profiles, error }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, active, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role")
  ]);
  if (error) throw error;
  if (rErr) throw rErr;
  const map = /* @__PURE__ */ new Map();
  for (const r of roles ?? []) {
    const list = map.get(r.user_id) ?? [];
    list.push(r.role);
    map.set(r.user_id, list);
  }
  return (profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
}
function actorId() {
  const id = getDesktopUser()?.id;
  if (!id) throw new Error("Sessão desktop inválida");
  return id;
}
async function adminSetUserRole(userId, role) {
  if (isDesktop()) {
    await desktop.admin.setRole({ actor_id: actorId(), user_id: userId, role });
    return;
  }
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  if (error) throw error;
}
async function adminSetUserActive(userId, active) {
  if (isDesktop()) {
    await desktop.admin.setActive({ actor_id: actorId(), user_id: userId, active });
    return;
  }
  const { error } = await supabase.rpc("admin_set_user_active", { p_user_id: userId, p_active: active });
  if (error) throw error;
}
async function listAdminAuditLogs() {
  if (isDesktop()) {
    const rows = await desktop.admin.auditLogs();
    return rows.map((r) => ({
      ...r,
      details: r.details ? safeParse(r.details) : null
    }));
  }
  const { data, error } = await supabase.from("audit_logs").select("id, user_id, entity_id, action, details, created_at").eq("entity", "user").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}
function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
async function listAlerts() {
  if (isDesktop()) {
    const rows = await desktop.select(
      `SELECT id, type, severity, message, created_at, resolved FROM alerts
       WHERE resolved = 0 ORDER BY severity DESC, created_at DESC LIMIT 200`
    );
    return rows.map((r) => ({ ...r, resolved: !!r.resolved }));
  }
  const { data, error } = await supabase.from("alerts").select("id, type, severity, message, created_at, resolved").eq("resolved", false).order("severity", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}
async function refreshAlerts() {
  if (isDesktop()) {
    await desktop.rpc.refreshAlerts();
    return;
  }
  const { error } = await supabase.rpc("refresh_alerts");
  if (error) throw error;
}
async function resolveAlert(id) {
  if (isDesktop()) {
    await desktop.update("alerts", id, { resolved: 1 });
    return;
  }
  const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
  if (error) throw error;
}
function mapDesktopSupplier(r) {
  return {
    id: r.id,
    legal_name: r.name,
    tax_id: r.nuit ?? null,
    contact_name: r.contact ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    address: r.address ?? null,
    active: !!r.active
  };
}
async function listSuppliers() {
  if (isDesktop()) {
    const rows = await desktop.select("SELECT * FROM suppliers ORDER BY name");
    return rows.map(mapDesktopSupplier);
  }
  const { data, error } = await supabase.from("suppliers").select("*").order("legal_name");
  if (error) throw error;
  return data ?? [];
}
async function saveSupplier(p) {
  if (isDesktop()) {
    const values = {
      name: p.legal_name ?? "",
      nuit: p.tax_id ?? null,
      contact: p.contact_name ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      address: p.address ?? null,
      active: p.active ? 1 : 0
    };
    if (p.id) await desktop.update("suppliers", p.id, values);
    else await desktop.insert("suppliers", values);
    return;
  }
  if (p.id) {
    const { error } = await supabase.from("suppliers").update(p).eq("id", p.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("suppliers").insert(p);
    if (error) throw error;
  }
}
function mapDesktopSettings(r) {
  const size = (r.receipt_size ?? "80mm").toLowerCase();
  const width = size === "a4" || size === "58mm" || size === "80mm" ? size : "80mm";
  return {
    id: true,
    name: r.name ?? "Farmácia",
    slogan: null,
    nuit: r.nuit ?? null,
    address: r.address ?? null,
    city: null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    website: null,
    logo_url: r.logo_url ?? null,
    receipt_width: width,
    receipt_header: r.receipt_header ?? null,
    receipt_footer: r.receipt_footer ?? null,
    show_pharmacist: false
  };
}
async function getPharmacySettings() {
  if (isDesktop()) {
    const row = await desktop.get("SELECT * FROM pharmacy_settings WHERE id = 1");
    return row ? mapDesktopSettings(row) : null;
  }
  const { data, error } = await supabase.from("pharmacy_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;
  return data ?? null;
}
async function listSalesHistory(limit = 30) {
  if (isDesktop()) {
    const rows = await desktop.select(
      `SELECT id, receipt_number, total, status, created_at FROM sales ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({ ...r, sale_number: null, total: Number(r.total) }));
  }
  const { data, error } = await supabase.from("sales").select("id, receipt_number, sale_number, total, status, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
async function listStockMovementsHistory(limit = 50) {
  if (isDesktop()) {
    const rows = await desktop.select(
      `SELECT m.id, m.type, m.quantity, m.reason, m.created_at, p.name AS product_name
       FROM stock_movements m LEFT JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({ ...r, products: { name: r.product_name } }));
  }
  const { data, error } = await supabase.from("stock_movements").select("id, type, quantity, reason, created_at, products(name)").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
async function listAuditLogsHistory(limit = 50) {
  if (isDesktop()) {
    return desktop.select(
      `SELECT id, entity, action, created_at, details FROM audit_logs ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }
  const { data, error } = await supabase.from("audit_logs").select("id, entity, action, created_at, details").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
async function getDashboardStats() {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const sinceIso = today.toISOString();
  if (isDesktop()) {
    const sinceLocal = sinceIso.slice(0, 10) + " 00:00:00";
    const sales2 = await desktop.select(
      `SELECT total FROM sales WHERE status = 'completed' AND created_at >= ?`,
      [sinceLocal]
    );
    const alerts2 = await desktop.select(`SELECT severity FROM alerts WHERE resolved = 0`);
    const products = await desktop.select(`SELECT id FROM products WHERE active = 1`);
    const totalSales2 = sales2.reduce((a, s) => a + Number(s.total), 0);
    return {
      salesCount: sales2.length,
      totalSales: totalSales2,
      ticketMedio: sales2.length ? totalSales2 / sales2.length : 0,
      alertsActive: alerts2.length,
      alertsCritical: alerts2.filter((a) => a.severity === "critical").length,
      productsActive: products.length
    };
  }
  const [salesRes, alertsRes, productsRes] = await Promise.all([
    supabase.from("sales").select("total").eq("status", "completed").gte("created_at", sinceIso),
    supabase.from("alerts").select("id, severity").eq("resolved", false),
    supabase.from("products").select("id").eq("active", true)
  ]);
  const sales = salesRes.data ?? [];
  const alerts = alertsRes.data ?? [];
  const totalSales = sales.reduce((a, s) => a + Number(s.total), 0);
  return {
    salesCount: sales.length,
    totalSales,
    ticketMedio: sales.length ? totalSales / sales.length : 0,
    alertsActive: alerts.length,
    alertsCritical: alerts.filter((a) => a.severity === "critical").length,
    productsActive: productsRes.data?.length ?? 0
  };
}
async function getStatsBundle(days) {
  const now = Date.now();
  const since = new Date(now - days * 864e5).toISOString();
  const prevFrom = new Date(now - days * 2 * 864e5).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    const prevFromLocal = prevFrom.slice(0, 19).replace("T", " ");
    const sales2 = await desktop.select(
      `SELECT id, total, created_at, payment_method, user_id FROM sales WHERE status = 'completed' AND created_at >= ?`,
      [sinceLocal]
    );
    const prevSales2 = await desktop.select(
      `SELECT total FROM sales WHERE status = 'completed' AND created_at >= ? AND created_at < ?`,
      [prevFromLocal, sinceLocal]
    );
    const items2 = await desktop.select(
      `SELECT si.product_id, si.product_name, si.quantity, si.total, s.created_at
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= ? LIMIT 10000`,
      [sinceLocal]
    );
    const products2 = await desktop.select(
      `SELECT id, cost_price, category_id, pack_size FROM products`
    );
    const categories2 = await desktop.select(`SELECT id, name FROM categories`);
    const profiles2 = await desktop.select(`SELECT id, full_name, email FROM profiles`);
    return { sales: sales2, prevSales: prevSales2, items: items2, products: products2, categories: categories2, profiles: profiles2 };
  }
  const [sales, prevSales, items, products, categories, profiles] = await Promise.all([
    supabase.from("sales").select("id, total, created_at, payment_method, user_id, status").gte("created_at", since).eq("status", "completed"),
    supabase.from("sales").select("id, total").gte("created_at", prevFrom).lt("created_at", since).eq("status", "completed"),
    supabase.from("sale_items").select("product_id, product_name, quantity, unit_price, total, created_at").gte("created_at", since).limit(1e4),
    supabase.from("products").select("id, cost_price, category_id, pack_size"),
    supabase.from("categories").select("id, name"),
    supabase.from("profiles").select("id, full_name, email")
  ]);
  for (const r of [sales, prevSales, items, products, categories, profiles]) {
    if (r.error) throw r.error;
  }
  return {
    sales: sales.data ?? [],
    prevSales: prevSales.data ?? [],
    items: items.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    profiles: profiles.data ?? []
  };
}
async function listAccounts30d() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    const rows = await desktop.select(
      `SELECT id, total, payment_method, created_at, status, receipt_number FROM sales
       WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200`,
      [sinceLocal]
    );
    return rows.map((r) => ({ ...r, sale_number: r.receipt_number, total: Number(r.total) }));
  }
  const { data, error } = await supabase.from("sales").select("id, sale_number, total, payment_method, created_at, status").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}
async function listReportSales30d() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    return desktop.select(
      `SELECT si.product_name, si.quantity, si.total, si.unit_price, s.created_at
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= ? LIMIT 5000`,
      [sinceLocal]
    );
  }
  const { data, error } = await supabase.from("sale_items").select("product_name, quantity, total, unit_price, created_at").gte("created_at", since).limit(5e3);
  if (error) throw error;
  return data ?? [];
}
async function getSaleByRef(ref) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  if (isDesktop()) {
    const sale2 = await desktop.get(
      isUuid ? `SELECT * FROM sales WHERE id = ?` : `SELECT * FROM sales WHERE receipt_number = ?`,
      [ref]
    );
    if (!sale2) return null;
    const items = await desktop.select(
      `SELECT id, product_name, quantity, unit_price, total, unit_label, unit_kind FROM sale_items WHERE sale_id = ?`,
      [sale2.id]
    );
    let operator2 = null;
    if (sale2.user_id) {
      operator2 = await desktop.get(`SELECT full_name, email FROM profiles WHERE id = ?`, [sale2.user_id]) ?? null;
    }
    return { ...sale2, sale_items: items, operator: operator2 };
  }
  const base = supabase.from("sales").select(
    "id, receipt_number, created_at, subtotal, discount, total, payment_method, status, user_id, sale_items(id, product_name, quantity, unit_price, total, unit_label, unit_kind)"
  );
  const { data: sale, error } = isUuid ? await base.eq("id", ref).maybeSingle() : await base.eq("receipt_number", ref).maybeSingle();
  if (error) throw error;
  if (!sale) return null;
  let operator = null;
  if (sale.user_id) {
    const { data: prof } = await supabase.from("profiles").select("full_name, email").eq("id", sale.user_id).maybeSingle();
    operator = prof;
  }
  return { ...sale, operator };
}
function usePharmacySettings() {
  return useQuery({
    queryKey: ["pharmacy-settings"],
    queryFn: () => getPharmacySettings(),
    staleTime: 6e4
  });
}
function receiptWidthClass(w) {
  if (w === "58mm") return "w-[58mm] text-[10px]";
  if (w === "a4") return "w-[210mm] max-w-full text-sm";
  return "w-[80mm] text-[11px]";
}
function formatMZN(value) {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return "0,00 MT";
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}
function formatDate(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
}
function formatDateTime(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}
function Barcode({
  value,
  height = 50,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  format = "CODE128",
  className
}) {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        height,
        width,
        fontSize,
        displayValue,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000"
      });
      const svg = ref.current;
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.maxHeight = `${height}px`;
      svg.style.display = "block";
    } catch {
    }
  }, [value, height, width, fontSize, displayValue, format]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, style: { width: "100%", lineHeight: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ref }) });
}
const $$splitComponentImporter$4 = () => import("./configuracoes-hRkTUC-E.mjs");
const Route$4 = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [{
      title: "Configurações — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
function ReceiptBody(props) {
  const {
    s,
    items,
    subtotal,
    discount,
    total,
    paymentLabel,
    received,
    change,
    saleId,
    receiptNumber,
    operatorName,
    at
  } = props;
  const ref = receiptNumber || `REC-${saleId.slice(0, 8).toUpperCase()}`;
  const barcodeHeight = s.receipt_width === "a4" ? 70 : s.receipt_width === "58mm" ? 45 : 55;
  const barcodeWidth = s.receipt_width === "58mm" ? 0.9 : s.receipt_width === "80mm" ? 1.2 : 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${receiptWidthClass(s.receipt_width)} bg-white p-3 font-mono leading-snug text-black shadow-sm`, children: [
    s.logo_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.logo_url, alt: s.name, className: "max-h-14 object-contain" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-bold tracking-tight", children: s.name }),
      s.slogan && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] italic opacity-80", children: s.slogan }),
      s.address && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: s.address }),
      s.city && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: s.city }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
        s.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Tel: ",
          s.phone
        ] }),
        s.phone && s.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: " · " }),
        s.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: s.email })
      ] }),
      s.nuit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
        "NUIT: ",
        s.nuit
      ] }),
      s.receipt_header && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] whitespace-pre-line", children: s.receipt_header })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center font-bold", children: "RECIBO DE VENDA" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Nº ",
        ref
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatDateTime(at) })
    ] }),
    s.show_pharmacist && operatorName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
      "Operador: ",
      operatorName
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-[10px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5", children: "Descrição" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "Qtd" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "P.Unit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "Total" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "align-top", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-0.5 pr-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "leading-tight", children: it.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[9px] opacity-70", children: [
            "(",
            it.unit_label,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: it.quantity }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: formatMZN(it.unit_price) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: formatMZN(it.quantity * it.unit_price) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Subtotal", value: formatMZN(subtotal) }),
    discount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Desconto", value: `− ${formatMZN(discount)}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "TOTAL", value: formatMZN(total), bold: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Pagamento", value: paymentLabel }),
    received != null && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Entregue", value: formatMZN(received) }),
    change != null && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Troco", value: formatMZN(change), bold: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "barcode-block w-full bg-white px-1 py-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode, { value: ref, height: barcodeHeight, width: barcodeWidth, displayValue: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-center text-[11px] font-mono font-bold tracking-widest", children: ref }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-[9px] opacity-70", children: "Leia o código de barras para validar este recibo" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    s.receipt_footer && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-[10px] whitespace-pre-line", children: s.receipt_footer }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-center text-[9px] opacity-70", children: [
      "Documento não fiscal · ",
      s.name
    ] })
  ] });
}
function Row({
  label,
  value,
  bold
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex justify-between ${bold ? "font-bold" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: value })
  ] });
}
function Dashed() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-1 border-t border-dashed border-black/60" });
}
const $$splitComponentImporter$3 = () => import("./caixa-CEC3EU2P.mjs");
const Route$3 = createFileRoute("/_authenticated/caixa")({
  head: () => ({
    meta: [{
      title: "Caixa — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./alertas-MPsbaNPz.mjs");
const Route$2 = createFileRoute("/_authenticated/alertas")({
  head: () => ({
    meta: [{
      title: "Alertas — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./recibo.index-DVZXvhEt.mjs");
const Route$1 = createFileRoute("/_authenticated/recibo/")({
  head: () => ({
    meta: [{
      title: "Validar Recibo — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitNotFoundComponentImporter = () => import("./recibo._ref-jrmjF9HA.mjs");
const $$splitErrorComponentImporter = () => import("./recibo._ref-B0_fi_4F.mjs");
const $$splitComponentImporter = () => import("./recibo._ref-4hlVH-Mv.mjs");
const Route = createFileRoute("/_authenticated/recibo/$ref")({
  head: () => ({
    meta: [{
      title: "Validar Recibo — PharmaSys"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
const AuthRoute = Route$h.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$i
});
const AuthenticatedRouteRoute = Route$g.update({
  id: "/_authenticated",
  getParentRoute: () => Route$i
});
const IndexRoute = Route$f.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$i
});
const AuthenticatedVendasRoute = Route$e.update({
  id: "/vendas",
  path: "/vendas",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedUtilizadoresRoute = Route$d.update({
  id: "/utilizadores",
  path: "/utilizadores",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRelatoriosRoute = Route$c.update({
  id: "/relatorios",
  path: "/relatorios",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedHistoricoRoute = Route$b.update({
  id: "/historico",
  path: "/historico",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedFornecedoresRoute = Route$a.update({
  id: "/fornecedores",
  path: "/fornecedores",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEstoqueRoute = Route$9.update({
  id: "/estoque",
  path: "/estoque",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEstatisticasRoute = Route$8.update({
  id: "/estatisticas",
  path: "/estatisticas",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEntradaRoute = Route$7.update({
  id: "/entrada",
  path: "/entrada",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedDashboardRoute = Route$6.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedContasRoute = Route$5.update({
  id: "/contas",
  path: "/contas",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedConfiguracoesRoute = Route$4.update({
  id: "/configuracoes",
  path: "/configuracoes",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedCaixaRoute = Route$3.update({
  id: "/caixa",
  path: "/caixa",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAlertasRoute = Route$2.update({
  id: "/alertas",
  path: "/alertas",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedReciboIndexRoute = Route$1.update({
  id: "/recibo/",
  path: "/recibo/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedReciboRefRoute = Route.update({
  id: "/recibo/$ref",
  path: "/recibo/$ref",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRouteRouteChildren = {
  AuthenticatedAlertasRoute,
  AuthenticatedCaixaRoute,
  AuthenticatedConfiguracoesRoute,
  AuthenticatedContasRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedEntradaRoute,
  AuthenticatedEstatisticasRoute,
  AuthenticatedEstoqueRoute,
  AuthenticatedFornecedoresRoute,
  AuthenticatedHistoricoRoute,
  AuthenticatedRelatoriosRoute,
  AuthenticatedUtilizadoresRoute,
  AuthenticatedVendasRoute,
  AuthenticatedReciboRefRoute,
  AuthenticatedReciboIndexRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute
};
const routeTree = Route$i._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  listSuppliersMin as A,
  listCategoriesMin as B,
  addBatchEntry as C,
  saveProduct as D,
  deleteOrDisableProduct as E,
  assignProductBarcode as F,
  Barcode as G,
  getStatsBundle as H,
  listEntradaProducts as I,
  getDashboardStats as J,
  listAccounts30d as K,
  receiptWidthClass as L,
  listMyCashSessions as M,
  listSessionSales as N,
  openCashSession as O,
  closeCashSession as P,
  listAlerts as Q,
  ReceiptBody as R,
  refreshAlerts as S,
  resolveAlert as T,
  Route as U,
  getSaleByRef as V,
  router as W,
  desktopBootstrap as a,
  desktopSignOut as b,
  getOpenCashSession as c,
  desktopSignIn as d,
  usePharmacySettings as e,
  formatMZN as f,
  getDesktopUser as g,
  findProductByBarcode as h,
  isDesktop as i,
  listAdminUsers as j,
  adminSetUserRole as k,
  listPosProducts as l,
  adminSetUserActive as m,
  formatDateTime as n,
  desktop as o,
  processSale as p,
  listAdminAuditLogs as q,
  listReportSales30d as r,
  formatDate as s,
  listStockMovementsHistory as t,
  useDesktopAuth as u,
  listAuditLogsHistory as v,
  listSalesHistory as w,
  listSuppliers as x,
  saveSupplier as y,
  listStockProducts as z
};
