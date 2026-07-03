import { createFileRoute, Navigate } from "@tanstack/react-router";

// Página "Relatórios" foi substituída por "Estatística" (/estatisticas).
export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Estatística — PharmaSys" }] }),
  component: () => <Navigate to="/estatisticas" replace />,
});
