import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReceiptWidth = "58mm" | "80mm" | "a4";

export interface PharmacySettings {
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
  receipt_width: ReceiptWidth;
  receipt_header: string | null;
  receipt_footer: string | null;
  show_pharmacist: boolean;
}

export function usePharmacySettings() {
  return useQuery({
    queryKey: ["pharmacy-settings"],
    queryFn: async (): Promise<PharmacySettings | null> => {
      const { data, error } = await supabase
        .from("pharmacy_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as PharmacySettings | null;
    },
    staleTime: 60_000,
  });
}

export function receiptWidthClass(w: ReceiptWidth | undefined) {
  if (w === "58mm") return "w-[58mm] text-[10px]";
  if (w === "a4") return "w-[210mm] max-w-full text-sm";
  return "w-[80mm] text-[11px]";
}
