import type { QueryClient } from "@tanstack/react-query";

/**
 * Central invalidation helpers. Ensures a change in one part of the system
 * propagates to every page/query that depends on it.
 */

const SALE_KEYS = [
  ["pdv-products"],
  ["pdv-accounts"],
  ["stock"],
  ["alerts"],
  ["dashboard-admin"],
  ["financial-accounts"],
  ["account-movements"],
  ["session-live"],
  ["my-cash-sessions"],
  ["margens-batches"],
  ["estat-base"],
  ["estat"],
  ["history"],
  ["audit"],
] as const;

const STOCK_KEYS = [
  ["stock"],
  ["pdv-products"],
  ["entrada-products"],
  ["alerts"],
  ["dashboard-admin"],
  ["margens-batches"],
  ["financial-accounts"],
  ["account-movements"],
  ["estat-base"],
  ["estat"],
] as const;

const PRODUCT_KEYS = [
  ["stock"],
  ["pdv-products"],
  ["entrada-products"],
  ["alerts"],
  ["dashboard-admin"],
  ["margens-batches"],
] as const;

const CASH_KEYS = [
  ["my-cash-sessions"],
  ["session-live"],
  ["dashboard-admin"],
  ["financial-accounts"],
  ["account-movements"],
  ["estat-base"],
  ["estat"],
] as const;

const ACCOUNT_KEYS = [
  ["financial-accounts"],
  ["account-movements"],
  ["pdv-accounts"],
  ["dashboard-admin"],
  ["estat-base"],
  ["estat"],
] as const;

const SUPPLIER_KEYS = [
  ["suppliers"],
  ["suppliers-min"],
  ["suppliers-min-margens"],
] as const;

const CATEGORY_KEYS = [
  ["categories-min"],
  ["stock"],
] as const;

function invalidateAll(qc: QueryClient, keys: readonly (readonly string[])[]) {
  for (const k of keys) qc.invalidateQueries({ queryKey: k as unknown as string[] });
}

/** After a completed sale (process_sale). */
export const invalidateAfterSale = (qc: QueryClient) => invalidateAll(qc, SALE_KEYS);

/** After stock entry (add_batch_entry). */
export const invalidateAfterStockEntry = (qc: QueryClient) => invalidateAll(qc, STOCK_KEYS);

/** After creating/editing/deactivating a product. */
export const invalidateAfterProductChange = (qc: QueryClient) => invalidateAll(qc, PRODUCT_KEYS);

/** After opening/closing a cash session. */
export const invalidateAfterCashSession = (qc: QueryClient) => invalidateAll(qc, CASH_KEYS);

/** After adjusting/creating/deleting a financial account. */
export const invalidateAfterAccountChange = (qc: QueryClient) => invalidateAll(qc, ACCOUNT_KEYS);

/** After creating/editing/deactivating a supplier. */
export const invalidateAfterSupplierChange = (qc: QueryClient) => invalidateAll(qc, SUPPLIER_KEYS);

/** After creating/editing a category. */
export const invalidateAfterCategoryChange = (qc: QueryClient) => invalidateAll(qc, CATEGORY_KEYS);
