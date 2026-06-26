import { useQuery } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/use-auth";
import { useDesktopAuth } from "@/hooks/use-desktop-auth";
import { getOpenCashSession } from "@/lib/db";
import { isDesktop } from "@/lib/desktop";

export type OpenSession = {
  id: string;
  opened_at: string;
  opening_amount: number;
} | null;

export function useOpenCashSession() {
  const { user } = useAuthUser();
  const { user: dUser } = useDesktopAuth();
  const userId = isDesktop() ? dUser?.id : user?.id;
  return useQuery<OpenSession>({
    queryKey: ["open-cash-session", userId],
    enabled: !!userId,
    refetchInterval: 30000,
    queryFn: async () => {
      const row = await getOpenCashSession(userId!);
      return (row as OpenSession) ?? null;
    },
  });
}
