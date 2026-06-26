// PharmaSys Desktop - SPA entry (renderer dentro do Electron).
// Usa hash history para suportar carregamento via file://.
import "../../src/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "../../src/routeTree.gen";

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  context: { queryClient },
  history: createHashHistory(),
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}

const el = document.getElementById("root")!;
ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
