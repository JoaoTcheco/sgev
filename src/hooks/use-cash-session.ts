import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-auth";

export type OpenSession = {
  id: string;
  opened_at: string;
  opening_amount: number;
} | null;

export function useOpenCashSession() {
  const { user } = useAuthUser();
  return useQuery<OpenSession>({
    queryKey: ["open-cash-session", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_sessions")
        .select("id, opened_at, opening_amount")
        .eq("user_id", user!.id)
        .eq("status", "open")
        .maybeSingle();
      if (error) throw error;
      return (data as OpenSession) ?? null;
    },
  });
}
