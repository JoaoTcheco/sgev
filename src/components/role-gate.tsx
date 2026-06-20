import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthUser, useUserRoles, highestRole, type AppRole } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function RoleGate({
  allow,
  children,
}: {
  allow: AppRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const { data: roles = [], isLoading } = useUserRoles(user?.id);
  if (loading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const top = highestRole(roles);
  if (!top || !allow.includes(top)) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex flex-col items-start gap-3 py-6 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="h-5 w-5" /> Acesso restrito
          </div>
          <p className="text-muted-foreground">
            Esta secção está disponível apenas para perfis: {allow.join(", ")}.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">Voltar ao painel</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
