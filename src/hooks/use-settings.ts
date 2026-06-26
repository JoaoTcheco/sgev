import { useQuery } from "@tanstack/react-query";
import { getPharmacySettings, type PharmacySettingsRow } from "@/lib/db";

export type ReceiptWidth = "58mm" | "80mm" | "a4";

export type PharmacySettings = PharmacySettingsRow;

export function usePharmacySettings() {
  return useQuery({
    queryKey: ["pharmacy-settings"],
    queryFn: () => getPharmacySettings(),
    staleTime: 60_000,
  });
}

export function receiptWidthClass(w: ReceiptWidth | undefined) {
  if (w === "58mm") return "w-[58mm] text-[10px]";
  if (w === "a4") return "w-[210mm] max-w-full text-sm";
  return "w-[80mm] text-[11px]";
}
