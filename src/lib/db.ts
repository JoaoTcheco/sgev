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
