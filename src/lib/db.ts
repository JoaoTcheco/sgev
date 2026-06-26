// Unified data layer — routes to local SQLite (Electron) or Supabase (web).
// Each function returns the same shape regardless of backend so call sites
// stay identical.
import { supabase } from "@/integrations/supabase/client";
import { desktop, isDesktop } from "@/lib/desktop";
import { getDesktopUser } from "@/hooks/use-desktop-auth";

export type PaymentKind = "cash" | "digital";
export type DigitalWallet = "bank" | "mpesa" | "emola";

// Resolve current user id (works in both modes).
export async function currentUserId(): Promise<string | null> {
  if (isDesktop()) return getDesktopUser()?.id ?? null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ===== Produtos (PDV) =====
type PosProduct = {
  id: string;
  name: string;
  sale_price: number;
  sub_unit_price: number | null;
  sub_unit_label: string | null;
  unit: string | null;
  pack_size: number;
  requires_prescription: boolean;
  barcode?: string | null;
  batches: Array<{ quantity: number; expiry_date: string }>;
};

function normalizeDesktopProduct(p: any, batches: any[]): PosProduct {
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
    batches: batches.map((b: any) => ({ quantity: Number(b.quantity), expiry_date: b.expiry_date })),
  };
}

export async function listPosProducts(search: string): Promise<PosProduct[]> {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term
      ? `SELECT * FROM products WHERE active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name LIMIT 40`
      : `SELECT * FROM products WHERE active = 1 ORDER BY name LIMIT 40`;
    const params = term ? [`%${term}%`, `%${term}%`] : [];
    const rows = await desktop.select<any>(sql, params);
    if (rows.length === 0) return [];
    const ids = rows.map((r) => `'${r.id.replace(/'/g, "''")}'`).join(",");
    const batches = await desktop.select<any>(
      `SELECT product_id, quantity, expiry_date FROM batches WHERE product_id IN (${ids}) AND quantity > 0`,
    );
    const byProd = new Map<string, any[]>();
    for (const b of batches) {
      const list = byProd.get(b.product_id) ?? [];
      list.push(b);
      byProd.set(b.product_id, list);
    }
    return rows.map((r) => normalizeDesktopProduct(r, byProd.get(r.id) ?? []));
  }
  let q = supabase
    .from("products")
    .select(
      "id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, barcode, batches(quantity, expiry_date)",
    )
    .eq("active", true)
    .order("name")
    .limit(40);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as PosProduct[];
}

export async function findProductByBarcode(code: string): Promise<PosProduct | null> {
  if (isDesktop()) {
    const p = await desktop.get<any>("SELECT * FROM products WHERE barcode = ? AND active = 1", [code]);
    if (!p) return null;
    const batches = await desktop.select<any>(
      "SELECT quantity, expiry_date FROM batches WHERE product_id = ? AND quantity > 0",
      [p.id],
    );
    return normalizeDesktopProduct(p, batches);
  }
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, barcode, batches(quantity, expiry_date)",
    )
    .eq("barcode", code)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as PosProduct | null;
}

// ===== Venda =====
export type SaleItemInput = {
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_kind: "pack" | "sub";
};

export async function processSale(input: {
  paymentKind: PaymentKind;
  wallet: DigitalWallet;
  discount: number;
  items: SaleItemInput[];
  amountReceived?: number | null;
  changeDue?: number | null;
}): Promise<{ saleId: string; receipt_number: string | null }> {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    const payment_method = input.paymentKind === "cash" ? "cash" : input.wallet;
    const res = await desktop.rpc.processSale({
      user_id: userId,
      customer_id: null,
      payment_method,
      discount: input.discount,
      items: input.items,
      amount_received: input.amountReceived ?? null,
      change_due: input.changeDue ?? null,
    });
    return { saleId: res.id, receipt_number: res.receipt_number };
  }
  const WALLET_TO_ENUM: Record<DigitalWallet, "debit" | "pix" | "other"> = {
    bank: "debit",
    mpesa: "pix",
    emola: "other",
  };
  const payment_method = input.paymentKind === "cash" ? "cash" : WALLET_TO_ENUM[input.wallet];
  const { data, error } = await supabase.rpc("process_sale", {
    p_customer_id: null as unknown as string,
    p_payment_method: payment_method,
    p_discount: input.discount,
    p_items: input.items as any,
  });
  if (error) throw error;
  const saleId = data as string;
  const { data: sale } = await supabase.from("sales").select("receipt_number").eq("id", saleId).maybeSingle();
  return { saleId, receipt_number: (sale?.receipt_number as string | null) ?? null };
}

// ===== Caixa =====
export type CashSessionRow = {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  counted_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  notes: string | null;
  status: "open" | "closed";
};

export async function listMyCashSessions(userId: string): Promise<CashSessionRow[]> {
  if (isDesktop()) {
    const rows = await desktop.select<any>(
      `SELECT id, opened_at, closed_at, opening_amount, counted_amount, expected_amount, difference, notes, status
       FROM cash_sessions WHERE user_id = ? ORDER BY opened_at DESC LIMIT 20`,
      [userId],
    );
    return rows as CashSessionRow[];
  }
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_amount, counted_amount, expected_amount, difference, notes, status")
    .eq("user_id", userId)
    .order("opened_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as CashSessionRow[];
}

export async function getOpenCashSession(userId: string) {
  if (isDesktop()) {
    const row = await desktop.get<any>(
      `SELECT id, opened_at, opening_amount FROM cash_sessions WHERE user_id = ? AND status = 'open'`,
      [userId],
    );
    return row ?? null;
  }
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_amount")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listSessionSales(sessionId: string) {
  if (isDesktop()) {
    return desktop.select<any>(
      "SELECT total, payment_method, status FROM sales WHERE cash_session_id = ? AND status = 'completed'",
      [sessionId],
    );
  }
  const { data, error } = await supabase
    .from("sales")
    .select("total, payment_method, status")
    .eq("cash_session_id", sessionId)
    .eq("status", "completed");
  if (error) throw error;
  return data ?? [];
}

export async function openCashSession(opening: number) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.openCashSession({ user_id: userId, opening_amount: opening });
  }
  const { error } = await supabase.rpc("open_cash_session", { p_opening: opening });
  if (error) throw error;
}

export async function closeCashSession(counted: number, notes: string) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.closeCashSession({ user_id: userId, counted_amount: counted, notes });
  }
  const { error } = await supabase.rpc("close_cash_session", { p_counted: counted, p_notes: notes });
  if (error) throw error;
}

// ===== Fornecedores =====
export async function listSuppliersMin(): Promise<Array<{ id: string; legal_name: string }>> {
  if (isDesktop()) {
    const rows = await desktop.select<any>(
      "SELECT id, name AS legal_name FROM suppliers WHERE active = 1 ORDER BY name",
    );
    return rows as Array<{ id: string; legal_name: string }>;
  }
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, legal_name")
    .eq("active", true)
    .order("legal_name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; legal_name: string }>;
}

// ===== Entrada (busca de produtos) =====
export async function listEntradaProducts(search: string) {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term
      ? `SELECT id, name, barcode, price AS sale_price, unit, NULL as manufacturer
         FROM products WHERE active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name LIMIT 30`
      : `SELECT id, name, barcode, price AS sale_price, unit, NULL as manufacturer
         FROM products WHERE active = 1 ORDER BY name LIMIT 30`;
    const params = term ? [`%${term}%`, `%${term}%`] : [];
    return desktop.select<any>(sql, params);
  }
  let q = supabase
    .from("products")
    .select("id, name, manufacturer, barcode, sale_price, unit")
    .eq("active", true)
    .order("name")
    .limit(30);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function addBatchEntry(input: {
  product_id: string;
  supplier_id: string | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}) {
  if (isDesktop()) {
    const userId = getDesktopUser()?.id;
    if (!userId) throw new Error("Sessão desktop inválida");
    return desktop.rpc.addBatch({ user_id: userId, ...input });
  }
  const { error } = await supabase.rpc("add_batch_entry", {
    p_product_id: input.product_id,
    p_supplier_id: input.supplier_id as unknown as string,
    p_batch_number: input.batch_number,
    p_expiry_date: input.expiry_date,
    p_quantity: input.quantity,
    p_cost_price: input.cost_price,
  });
  if (error) throw error;
}

// ===== Estoque (CRUD de produtos) =====
export type StockProductRow = {
  id: string;
  name: string;
  manufacturer: string | null;
  unit: string | null;
  pack_size: number;
  min_stock: number;
  ideal_stock: number;
  sale_price: number;
  cost_price: number;
  tarja: "livre" | "amarela" | "vermelha" | "preta" | null;
  active: boolean;
  barcode: string | null;
  category_id: string | null;
  active_ingredient: string | null;
  requires_prescription: boolean;
  sub_unit_label: string | null;
  sub_unit_price: number | null;
  batches: { id: string; expiry_date: string; quantity: number }[] | null;
};

function mapDesktopStock(p: any, batches: any[]): StockProductRow {
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
    tarja: (p.tarja ?? null) as StockProductRow["tarja"],
    active: !!p.active,
    barcode: p.barcode ?? null,
    category_id: p.category_id ?? null,
    active_ingredient: p.active_ingredient ?? null,
    requires_prescription: !!p.requires_prescription,
    sub_unit_label: p.sub_unit_label ?? null,
    sub_unit_price: p.sub_price != null ? Number(p.sub_price) : null,
    batches: batches.map((b: any) => ({ id: b.id, expiry_date: b.expiry_date, quantity: Number(b.quantity) })),
  };
}

export async function listStockProducts(search: string): Promise<StockProductRow[]> {
  if (isDesktop()) {
    const term = search.trim();
    const sql = term
      ? `SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? OR manufacturer LIKE ? ORDER BY name LIMIT 200`
      : `SELECT * FROM products ORDER BY name LIMIT 200`;
    const params = term ? [`%${term}%`, `%${term}%`, `%${term}%`] : [];
    const rows = await desktop.select<any>(sql, params);
    if (rows.length === 0) return [];
    const ids = rows.map((r) => `'${r.id.replace(/'/g, "''")}'`).join(",");
    const batches = await desktop.select<any>(
      `SELECT id, product_id, expiry_date, quantity FROM batches WHERE product_id IN (${ids})`,
    );
    const byProd = new Map<string, any[]>();
    for (const b of batches) {
      const list = byProd.get(b.product_id) ?? [];
      list.push(b);
      byProd.set(b.product_id, list);
    }
    return rows.map((r) => mapDesktopStock(r, byProd.get(r.id) ?? []));
  }
  let q = supabase
    .from("products")
    .select(
      "id, name, manufacturer, unit, pack_size, min_stock, ideal_stock, sale_price, cost_price, tarja, active, barcode, category_id, active_ingredient, requires_prescription, sub_unit_label, sub_unit_price, batches(id, expiry_date, quantity)",
    )
    .order("name")
    .limit(200);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as StockProductRow[];
}

export async function listCategoriesMin(): Promise<Array<{ id: string; name: string }>> {
  if (isDesktop()) {
    const rows = await desktop.select<any>("SELECT id, name FROM categories ORDER BY name");
    return rows as Array<{ id: string; name: string }>;
  }
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export type ProductInput = {
  id?: string;
  name: string;
  manufacturer: string | null;
  unit: string;
  pack_size: number;
  min_stock: number;
  ideal_stock: number;
  cost_price: number;
  sale_price: number;
  tarja: StockProductRow["tarja"];
  active: boolean;
  barcode: string;
  category_id: string | null;
  active_ingredient: string | null;
  requires_prescription: boolean;
  sub_unit_label: string | null;
  sub_unit_price: number | null;
};

export async function saveProduct(p: ProductInput): Promise<void> {
  if (isDesktop()) {
    const values: Record<string, unknown> = {
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
      requires_prescription: p.requires_prescription ? 1 : 0,
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
    requires_prescription: p.requires_prescription,
  };
  if (p.id) {
    const { error } = await supabase.from("products").update(payload).eq("id", p.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw error;
  }
}

export async function deleteOrDisableProduct(id: string): Promise<"deleted" | "disabled"> {
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

export async function assignProductBarcode(id: string, barcode: string): Promise<void> {
  if (isDesktop()) {
    await desktop.update("products", id, { barcode });
    return;
  }
  const { error } = await supabase.from("products").update({ barcode }).eq("id", id);
  if (error) throw error;
}

// ===== Admin: gestão de utilizadores =====
export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  roles: Array<"admin" | "pharmacist" | "cashier">;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  if (isDesktop()) {
    return (await desktop.admin.listUsers()) as AdminUserRow[];
  }
  const [{ data: profiles, error }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, active, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw error;
  if (rErr) throw rErr;
  const map = new Map<string, AdminUserRow["roles"]>();
  for (const r of roles ?? []) {
    const list = map.get(r.user_id) ?? [];
    list.push(r.role as AdminUserRow["roles"][number]);
    map.set(r.user_id, list);
  }
  return (profiles ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] }));
}

function actorId(): string {
  const id = getDesktopUser()?.id;
  if (!id) throw new Error("Sessão desktop inválida");
  return id;
}

export async function adminSetUserRole(userId: string, role: AdminUserRow["roles"][number]) {
  if (isDesktop()) {
    await desktop.admin.setRole({ actor_id: actorId(), user_id: userId, role });
    return;
  }
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  if (error) throw error;
}

export async function adminSetUserActive(userId: string, active: boolean) {
  if (isDesktop()) {
    await desktop.admin.setActive({ actor_id: actorId(), user_id: userId, active });
    return;
  }
  const { error } = await supabase.rpc("admin_set_user_active", { p_user_id: userId, p_active: active });
  if (error) throw error;
}

export type AdminAuditRow = {
  id: string;
  user_id: string | null;
  entity_id: string | null;
  action: string;
  details: any;
  created_at: string;
  actor_name?: string | null;
};

export async function listAdminAuditLogs(): Promise<AdminAuditRow[]> {
  if (isDesktop()) {
    const rows = await desktop.admin.auditLogs();
    return rows.map((r) => ({
      ...r,
      details: r.details ? safeParse(r.details) : null,
    }));
  }
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, entity_id, action, details, created_at")
    .eq("entity", "user")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AdminAuditRow[];
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}


// ===== Alertas =====
export type AlertRow = {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean;
};

export async function listAlerts(): Promise<AlertRow[]> {
  if (isDesktop()) {
    const rows = await desktop.select<any>(
      `SELECT id, type, severity, message, created_at, resolved FROM alerts
       WHERE resolved = 0 ORDER BY severity DESC, created_at DESC LIMIT 200`,
    );
    return rows.map((r) => ({ ...r, resolved: !!r.resolved })) as AlertRow[];
  }
  const { data, error } = await supabase
    .from("alerts")
    .select("id, type, severity, message, created_at, resolved")
    .eq("resolved", false)
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AlertRow[];
}

export async function refreshAlerts(): Promise<void> {
  if (isDesktop()) {
    await desktop.rpc.refreshAlerts();
    return;
  }
  const { error } = await supabase.rpc("refresh_alerts");
  if (error) throw error;
}

export async function resolveAlert(id: string): Promise<void> {
  if (isDesktop()) {
    await desktop.update("alerts", id, { resolved: 1 });
    return;
  }
  const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
  if (error) throw error;
}

// ===== Fornecedores (CRUD) =====
export type SupplierRow = {
  id: string;
  legal_name: string;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
};

function mapDesktopSupplier(r: any): SupplierRow {
  return {
    id: r.id,
    legal_name: r.name,
    tax_id: r.nuit ?? null,
    contact_name: r.contact ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    address: r.address ?? null,
    active: !!r.active,
  };
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  if (isDesktop()) {
    const rows = await desktop.select<any>("SELECT * FROM suppliers ORDER BY name");
    return rows.map(mapDesktopSupplier);
  }
  const { data, error } = await supabase.from("suppliers").select("*").order("legal_name");
  if (error) throw error;
  return (data ?? []) as SupplierRow[];
}

export async function saveSupplier(p: Partial<SupplierRow> & { id?: string }): Promise<void> {
  if (isDesktop()) {
    const values = {
      name: p.legal_name ?? "",
      nuit: p.tax_id ?? null,
      contact: p.contact_name ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      address: p.address ?? null,
      active: p.active ? 1 : 0,
    };
    if (p.id) await desktop.update("suppliers", p.id, values);
    else await desktop.insert("suppliers", values);
    return;
  }
  if (p.id) {
    const { error } = await supabase.from("suppliers").update(p).eq("id", p.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("suppliers").insert(p as any);
    if (error) throw error;
  }
}

// ===== Definições da farmácia =====
export type PharmacySettingsRow = {
  id: boolean;
  name: string;
  slogan: string | null;
  nuit: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  receipt_width: "58mm" | "80mm" | "a4";
  receipt_header: string | null;
  receipt_footer: string | null;
  show_pharmacist: boolean;
};

function mapDesktopSettings(r: any): PharmacySettingsRow {
  const size = (r.receipt_size ?? "80mm").toLowerCase();
  const width = size === "a4" || size === "58mm" || size === "80mm" ? (size as "58mm" | "80mm" | "a4") : "80mm";
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
    show_pharmacist: false,
  };
}

export async function getPharmacySettings(): Promise<PharmacySettingsRow | null> {
  if (isDesktop()) {
    const row = await desktop.get<any>("SELECT * FROM pharmacy_settings WHERE id = 1");
    return row ? mapDesktopSettings(row) : null;
  }
  const { data, error } = await supabase.from("pharmacy_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;
  return (data ?? null) as PharmacySettingsRow | null;
}

// ===== Histórico / Dashboard / Estatísticas / Contas / Relatórios / Recibo =====

export type SaleHistoryRow = {
  id: string;
  receipt_number: string | null;
  sale_number: number | null;
  total: number;
  status: string;
  created_at: string;
};

export async function listSalesHistory(limit = 30): Promise<SaleHistoryRow[]> {
  if (isDesktop()) {
    const rows = await desktop.select<any>(
      `SELECT id, receipt_number, total, status, created_at FROM sales ORDER BY created_at DESC LIMIT ?`,
      [limit],
    );
    return rows.map((r) => ({ ...r, sale_number: null, total: Number(r.total) }));
  }
  const { data, error } = await supabase
    .from("sales")
    .select("id, receipt_number, sale_number, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SaleHistoryRow[];
}

export async function listStockMovementsHistory(limit = 50) {
  if (isDesktop()) {
    const rows = await desktop.select<any>(
      `SELECT m.id, m.type, m.quantity, m.reason, m.created_at, p.name AS product_name
       FROM stock_movements m LEFT JOIN products p ON p.id = m.product_id
       ORDER BY m.created_at DESC LIMIT ?`,
      [limit],
    );
    return rows.map((r) => ({ ...r, products: { name: r.product_name } }));
  }
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, type, quantity, reason, created_at, products(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listAuditLogsHistory(limit = 50) {
  if (isDesktop()) {
    return desktop.select<any>(
      `SELECT id, entity, action, created_at, details FROM audit_logs ORDER BY created_at DESC LIMIT ?`,
      [limit],
    );
  }
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, entity, action, created_at, details")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type DashboardStats = {
  salesCount: number;
  totalSales: number;
  ticketMedio: number;
  alertsActive: number;
  alertsCritical: number;
  productsActive: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sinceIso = today.toISOString();
  if (isDesktop()) {
    const sinceLocal = sinceIso.slice(0, 10) + " 00:00:00";
    const sales = await desktop.select<any>(
      `SELECT total FROM sales WHERE status = 'completed' AND created_at >= ?`,
      [sinceLocal],
    );
    const alerts = await desktop.select<any>(`SELECT severity FROM alerts WHERE resolved = 0`);
    const products = await desktop.select<any>(`SELECT id FROM products WHERE active = 1`);
    const totalSales = sales.reduce((a, s: any) => a + Number(s.total), 0);
    return {
      salesCount: sales.length,
      totalSales,
      ticketMedio: sales.length ? totalSales / sales.length : 0,
      alertsActive: alerts.length,
      alertsCritical: alerts.filter((a: any) => a.severity === "critical").length,
      productsActive: products.length,
    };
  }
  const [salesRes, alertsRes, productsRes] = await Promise.all([
    supabase.from("sales").select("total").eq("status", "completed").gte("created_at", sinceIso),
    supabase.from("alerts").select("id, severity").eq("resolved", false),
    supabase.from("products").select("id").eq("active", true),
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
    productsActive: productsRes.data?.length ?? 0,
  };
}

export type StatsBundle = {
  sales: Array<{ id: string; total: number; created_at: string; payment_method: string; user_id: string }>;
  prevSales: Array<{ total: number }>;
  items: Array<{ product_id: string; product_name: string; quantity: number; total: number; created_at: string }>;
  products: Array<{ id: string; cost_price: number; category_id: string | null; pack_size: number }>;
  categories: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; full_name: string | null; email: string | null }>;
};

export async function getStatsBundle(days: number): Promise<StatsBundle> {
  const now = Date.now();
  const since = new Date(now - days * 86400_000).toISOString();
  const prevFrom = new Date(now - days * 2 * 86400_000).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    const prevFromLocal = prevFrom.slice(0, 19).replace("T", " ");
    const sales = await desktop.select<any>(
      `SELECT id, total, created_at, payment_method, user_id FROM sales WHERE status = 'completed' AND created_at >= ?`,
      [sinceLocal],
    );
    const prevSales = await desktop.select<any>(
      `SELECT total FROM sales WHERE status = 'completed' AND created_at >= ? AND created_at < ?`,
      [prevFromLocal, sinceLocal],
    );
    const items = await desktop.select<any>(
      `SELECT si.product_id, si.product_name, si.quantity, si.total, s.created_at
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= ? LIMIT 10000`,
      [sinceLocal],
    );
    const products = await desktop.select<any>(
      `SELECT id, cost_price, category_id, pack_size FROM products`,
    );
    const categories = await desktop.select<any>(`SELECT id, name FROM categories`);
    const profiles = await desktop.select<any>(`SELECT id, full_name, email FROM profiles`);
    return { sales, prevSales, items, products, categories, profiles };
  }
  const [sales, prevSales, items, products, categories, profiles] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, created_at, payment_method, user_id, status")
      .gte("created_at", since)
      .eq("status", "completed"),
    supabase
      .from("sales")
      .select("id, total")
      .gte("created_at", prevFrom)
      .lt("created_at", since)
      .eq("status", "completed"),
    supabase
      .from("sale_items")
      .select("product_id, product_name, quantity, unit_price, total, created_at")
      .gte("created_at", since)
      .limit(10000),
    supabase.from("products").select("id, cost_price, category_id, pack_size"),
    supabase.from("categories").select("id, name"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);
  for (const r of [sales, prevSales, items, products, categories, profiles]) {
    if (r.error) throw r.error;
  }
  return {
    sales: (sales.data ?? []) as any,
    prevSales: (prevSales.data ?? []) as any,
    items: (items.data ?? []) as any,
    products: (products.data ?? []) as any,
    categories: (categories.data ?? []) as any,
    profiles: (profiles.data ?? []) as any,
  };
}

export async function listAccounts30d() {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    const rows = await desktop.select<any>(
      `SELECT id, total, payment_method, created_at, status, receipt_number FROM sales
       WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200`,
      [sinceLocal],
    );
    return rows.map((r) => ({ ...r, sale_number: r.receipt_number, total: Number(r.total) }));
  }
  const { data, error } = await supabase
    .from("sales")
    .select("id, sale_number, total, payment_method, created_at, status")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function listReportSales30d() {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  if (isDesktop()) {
    const sinceLocal = since.slice(0, 19).replace("T", " ");
    return desktop.select<any>(
      `SELECT si.product_name, si.quantity, si.total, si.unit_price, s.created_at
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= ? LIMIT 5000`,
      [sinceLocal],
    );
  }
  const { data, error } = await supabase
    .from("sale_items")
    .select("product_name, quantity, total, unit_price, created_at")
    .gte("created_at", since)
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

export type SaleDetail = {
  id: string;
  receipt_number: string | null;
  created_at: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  user_id: string | null;
  sale_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
    unit_label: string | null;
    unit_kind: string | null;
  }>;
  operator: { full_name: string | null; email: string | null } | null;
};

export async function getSaleByRef(ref: string): Promise<SaleDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  if (isDesktop()) {
    const sale = await desktop.get<any>(
      isUuid ? `SELECT * FROM sales WHERE id = ?` : `SELECT * FROM sales WHERE receipt_number = ?`,
      [ref],
    );
    if (!sale) return null;
    const items = await desktop.select<any>(
      `SELECT id, product_name, quantity, unit_price, total, unit_label, unit_kind FROM sale_items WHERE sale_id = ?`,
      [sale.id],
    );
    let operator: { full_name: string | null; email: string | null } | null = null;
    if (sale.user_id) {
      operator =
        (await desktop.get<any>(`SELECT full_name, email FROM profiles WHERE id = ?`, [sale.user_id])) ?? null;
    }
    return { ...sale, sale_items: items, operator } as SaleDetail;
  }
  const base = supabase
    .from("sales")
    .select(
      "id, receipt_number, created_at, subtotal, discount, total, payment_method, status, user_id, sale_items(id, product_name, quantity, unit_price, total, unit_label, unit_kind)",
    );
  const { data: sale, error } = isUuid
    ? await base.eq("id", ref).maybeSingle()
    : await base.eq("receipt_number", ref).maybeSingle();
  if (error) throw error;
  if (!sale) return null;
  let operator: { full_name: string | null; email: string | null } | null = null;
  if (sale.user_id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", sale.user_id)
      .maybeSingle();
    operator = prof as any;
  }
  return { ...(sale as any), operator } as SaleDetail;
}


