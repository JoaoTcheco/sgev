import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-D9M-ftIG.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_u1EXWn.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import { u as useDesktopAuth, g as getDesktopUser, i as isDesktop, d as desktopSignIn, a as desktopBootstrap } from "./router-DE-fAUtY.mjs";
import "../_libs/jsbarcode.mjs";
import { L as LoaderCircle, P as Pill, M as Monitor } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
function AuthPage() {
  const navigate = useNavigate();
  const desktop = isDesktop();
  const desktopAuth = useDesktopAuth();
  const [loading, setLoading] = reactExports.useState(false);
  const [checking, setChecking] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (desktop) {
      if (getDesktopUser()) navigate({
        to: "/dashboard",
        replace: true
      });
      else setChecking(false);
      return;
    }
    supabase.auth.getUser().then(({
      data
    }) => {
      if (data.user) navigate({
        to: "/dashboard",
        replace: true
      });
      else setChecking(false);
    });
  }, [navigate, desktop]);
  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    setLoading(true);
    try {
      if (desktop) {
        await desktopSignIn(email, password);
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
      toast.success("Sessão iniciada");
      navigate({
        to: "/dashboard",
        replace: true
      });
    } catch (err) {
      toast.error("Falha ao entrar", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }
  async function handleSignup(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const fullName = String(form.get("full_name") || "");
    setLoading(true);
    try {
      if (desktop) {
        await desktopBootstrap({
          full_name: fullName,
          email,
          password
        });
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
      }
      toast.success("Conta criada", {
        description: "Sessão iniciada com sucesso."
      });
      navigate({
        to: "/dashboard",
        replace: true
      });
    } catch (err) {
      toast.error("Falha no registo", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }
  if (checking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) });
  }
  const defaultTab = desktop && desktopAuth.bootstrapNeeded ? "signup" : "login";
  const bootstrapMode = desktop && desktopAuth.bootstrapNeeded === true;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-col items-center gap-2 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pill, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "PharmaSys" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Gestão de vendas e estoque para farmácias" }),
        desktop && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-3 w-3" }),
          " Modo desktop — 100% offline"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: bootstrapMode ? "Primeiro arranque" : "Bem-vindo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: bootstrapMode ? "Crie a conta de administrador desta farmácia. Esta conta ficará guardada apenas neste computador." : "Entre com a sua conta ou registe-se para começar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: defaultTab, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "login", disabled: bootstrapMode, children: "Entrar" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signup", children: bootstrapMode ? "Criar admin" : "Registar" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "login", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-email", children: "E-mail" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "login-email", name: "email", type: "email", required: true, autoComplete: "email" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-password", children: "Palavra-passe" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "login-password", name: "password", type: "password", required: true, autoComplete: "current-password" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "w-full", disabled: loading, children: [
              loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Entrar"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "signup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "signup-name", children: "Nome completo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "signup-name", name: "full_name", type: "text", required: true, autoComplete: "name" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "signup-email", children: "E-mail" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "signup-email", name: "email", type: "email", required: true, autoComplete: "email" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "signup-password", children: "Palavra-passe" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "signup-password", name: "password", type: "password", required: true, minLength: 6, autoComplete: "new-password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: bootstrapMode ? "Mínimo 6 caracteres. Anote num local seguro — não há recuperação por email no modo offline." : "Mínimo de 6 caracteres. O primeiro utilizador registado torna-se Administrador." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "w-full", disabled: loading, children: [
              loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              bootstrapMode ? "Criar administrador" : "Criar conta"
            ] })
          ] }) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-right" })
  ] });
}
export {
  AuthPage as component
};
