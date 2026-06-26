import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { l as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from "./card-DQ5v2DYb.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-RrXKMtST.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { S as Switch } from "./switch-CQ4rbtn8.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { D as Dialog, e as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-8XiXuMbO.mjs";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DdaAQQFU.mjs";
import { n as formatDateTime, i as isDesktop, o as desktop, k as adminSetUserRole, m as adminSetUserActive, g as getDesktopUser, j as listAdminUsers, q as listAdminAuditLogs } from "./router-DE-fAUtY.mjs";
import { u as useAuthUser, a as useUserRoles, h as highestRole, r as roleLabel } from "./use-auth-ButDQezc.mjs";
import { c as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-IW2mgyey.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-BqeR1Qdv.mjs";
import "../_libs/jsbarcode.mjs";
import "../_libs/seroval.mjs";
import { p as Lock, U as Users, H as History, q as UserPlus, L as LoaderCircle, r as ShieldCheck, s as ShieldOff, t as Pencil, K as KeyRound, i as Trash2 } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
import "./client-D9M-ftIG.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "./createMiddleware-BvN2ghIY.mjs";
function useServerFn(serverFn) {
  const router = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const createUserInput = objectType({
  email: stringType().email(),
  password: stringType().min(8),
  full_name: stringType().min(2).max(120),
  role: enumType(["admin", "pharmacist", "cashier"])
});
const adminCreateUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => createUserInput.parse(data)).handler(createSsrRpc("7cdf308c08cefa76b5aff91881d47d0a7c38e57c538ac8578cbcc0b0323f57c2"));
const resetPasswordInput = objectType({
  user_id: stringType().uuid(),
  password: stringType().min(8)
});
const adminResetPassword = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => resetPasswordInput.parse(data)).handler(createSsrRpc("1ba075863237a617a5df5843a787f269ad588c4ff8323a63623b448c2d427495"));
const updateUserInput = objectType({
  user_id: stringType().uuid(),
  full_name: stringType().min(2).max(120).optional(),
  email: stringType().email().optional()
});
const adminUpdateUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => updateUserInput.parse(data)).handler(createSsrRpc("7e44cff770ce63c7f54ff4f42a5f1198b6c13b6bb706edd2e84253ce3272ea47"));
const deleteUserInput = objectType({
  user_id: stringType().uuid()
});
const adminDeleteUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => deleteUserInput.parse(data)).handler(createSsrRpc("31cd0087befaea9f28691dcd70f4a21113aea1822989cc6cf42e905d3993bf14"));
const ROLES = ["admin", "pharmacist", "cashier"];
function useAdminFns() {
  const createWeb = useServerFn(adminCreateUser);
  const resetWeb = useServerFn(adminResetPassword);
  const updateWeb = useServerFn(adminUpdateUser);
  const deleteWeb = useServerFn(adminDeleteUser);
  const actor = () => {
    const id = getDesktopUser()?.id;
    if (!id) throw new Error("Sessão desktop inválida");
    return id;
  };
  return {
    create: (data) => isDesktop() ? desktop.admin.createUser({
      actor_id: actor(),
      ...data
    }) : createWeb({
      data
    }),
    reset: (data) => isDesktop() ? desktop.admin.resetPassword({
      actor_id: actor(),
      ...data
    }) : resetWeb({
      data
    }),
    update: (data) => isDesktop() ? desktop.admin.updateUser({
      actor_id: actor(),
      ...data
    }) : updateWeb({
      data
    }),
    remove: (data) => isDesktop() ? desktop.admin.deleteUser({
      actor_id: actor(),
      ...data
    }) : deleteWeb({
      data
    })
  };
}
function UtilizadoresPage() {
  const {
    user
  } = useAuthUser();
  const {
    data: myRoles = []
  } = useUserRoles(user?.id);
  const isAdmin = highestRole(myRoles) === "admin";
  const queryClient = useQueryClient();
  const {
    data = [],
    isLoading
  } = useQuery({
    queryKey: ["users-admin", isDesktop() ? "desktop" : "web"],
    queryFn: () => listAdminUsers()
  });
  const adminCount = data.filter((u) => u.roles.includes("admin")).length;
  const fns = useAdminFns();
  const [createOpen, setCreateOpen] = reactExports.useState(false);
  const [resetUser, setResetUser] = reactExports.useState(null);
  const [editUser, setEditUser] = reactExports.useState(null);
  const [deleteUser, setDeleteUser] = reactExports.useState(null);
  const [auditOpen, setAuditOpen] = reactExports.useState(false);
  const invalidate = () => queryClient.invalidateQueries({
    queryKey: ["users-admin"]
  });
  const setRole = useMutation({
    mutationFn: ({
      userId,
      role
    }) => adminSetUserRole(userId, role),
    onSuccess: () => {
      toast.success("Perfil atualizado");
      invalidate();
    },
    onError: (e) => toast.error("Falha ao alterar perfil", {
      description: e.message
    })
  });
  const setActive = useMutation({
    mutationFn: ({
      userId,
      active
    }) => adminSetUserActive(userId, active),
    onSuccess: (_d, v) => {
      toast.success(v.active ? "Utilizador ativado" : "Utilizador desativado");
      invalidate();
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  const deleteMut = useMutation({
    mutationFn: (userId) => fns.remove({
      user_id: userId
    }),
    onSuccess: () => {
      toast.success("Utilizador eliminado");
      setDeleteUser(null);
      invalidate();
    },
    onError: (e) => toast.error("Falha ao eliminar", {
      description: e.message
    })
  });
  if (!isAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-amber-500/40 bg-amber-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-2 py-6 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-5 w-5" }),
      " Apenas administradores podem aceder a esta página."
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }),
            " Utilizadores"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            data.length,
            " utilizadores · ",
            adminCount,
            " administrador(es)"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setAuditOpen(true), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "mr-2 h-4 w-4" }),
            " Auditoria"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-2 h-4 w-4" }),
              " Novo utilizador"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreateUserDialog, { onClose: () => setCreateOpen(false), createFn: fns.create, onCreated: invalidate })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Nome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "E-mail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Perfil" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Estado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Criado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: data.map((u) => {
          const top = highestRole(u.roles);
          const isSelf = u.id === user?.id;
          const isLastAdmin = top === "admin" && adminCount <= 1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: !u.active ? "opacity-60" : "", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "font-medium", children: [
              u.full_name ?? "—",
              isSelf && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-2 text-[10px]", children: "Você" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: u.email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: top ?? "", onValueChange: (v) => setRole.mutate({
              userId: u.id,
              role: v
            }), disabled: isSelf || isLastAdmin || setRole.isPending, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-[150px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sem perfil" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ROLES.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r, children: roleLabel(r) }, r)) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              u.active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-1 h-3 w-3" }),
                " Ativo"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldOff, { className: "mr-1 h-3 w-3" }),
                " Desativado"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: u.active, disabled: isSelf || isLastAdmin || setActive.isPending, onCheckedChange: (checked) => setActive.mutate({
                userId: u.id,
                active: checked
              }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: formatDateTime(u.created_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setEditUser(u), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setResetUser(u), disabled: isSelf, children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:text-destructive", onClick: () => setDeleteUser(u), disabled: isSelf || isLastAdmin, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
            ] }) })
          ] }, u.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!resetUser, onOpenChange: (o) => !o && setResetUser(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResetPasswordDialog, { user: resetUser, resetFn: fns.reset, onClose: () => setResetUser(null) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editUser, onOpenChange: (o) => !o && setEditUser(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EditUserDialog, { user: editUser, updateFn: fns.update, onClose: () => setEditUser(null), onSaved: invalidate }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteUser, onOpenChange: (o) => !o && setDeleteUser(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Eliminar utilizador?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          "Esta ação é permanente. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: deleteUser?.full_name ?? deleteUser?.email }),
          " perderá imediatamente o acesso. Movimentos e vendas anteriores permanecem no histórico."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogAction, { className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", onClick: (e) => {
          e.preventDefault();
          if (deleteUser) deleteMut.mutate(deleteUser.id);
        }, disabled: deleteMut.isPending, children: [
          deleteMut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          " Eliminar"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: auditOpen, onOpenChange: setAuditOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuditDialog, { open: auditOpen }) })
  ] });
}
function CreateUserDialog({
  onClose,
  createFn,
  onCreated
}) {
  const [form, setForm] = reactExports.useState({
    email: "",
    password: "",
    full_name: "",
    role: "cashier"
  });
  const mut = useMutation({
    mutationFn: () => createFn(form),
    onSuccess: () => {
      toast.success("Utilizador criado", {
        description: form.email
      });
      onCreated();
      onClose();
    },
    onError: (e) => toast.error("Falha ao criar", {
      description: e.message
    })
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Novo utilizador" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome completo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.full_name, onChange: (e) => setForm({
          ...form,
          full_name: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "E-mail" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({
          ...form,
          email: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Palavra-passe inicial" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", minLength: 8, value: form.password, onChange: (e) => setForm({
          ...form,
          password: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Perfil" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.role, onValueChange: (v) => setForm({
          ...form,
          role: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ROLES.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r, children: roleLabel(r) }, r)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => mut.mutate(), disabled: mut.isPending || !form.email || form.password.length < 8 || !form.full_name, children: [
        mut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Criar utilizador"
      ] })
    ] })
  ] });
}
function EditUserDialog({
  user,
  updateFn,
  onClose,
  onSaved
}) {
  const [fullName, setFullName] = reactExports.useState(user?.full_name ?? "");
  const [email, setEmail] = reactExports.useState(user?.email ?? "");
  const mut = useMutation({
    mutationFn: () => updateFn({
      user_id: user.id,
      full_name: fullName !== user?.full_name ? fullName : void 0,
      email: email !== user?.email ? email : void 0
    }),
    onSuccess: () => {
      toast.success("Utilizador atualizado");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error("Falha ao atualizar", {
      description: e.message
    })
  });
  if (!user) return null;
  const changed = fullName !== (user.full_name ?? "") || email !== (user.email ?? "");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar utilizador" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome completo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: fullName, onChange: (e) => setFullName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "E-mail" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => mut.mutate(), disabled: mut.isPending || !changed || fullName.length < 2 || !email.includes("@"), children: [
        mut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Guardar"
      ] })
    ] })
  ] });
}
function ResetPasswordDialog({
  user,
  resetFn,
  onClose
}) {
  const [password, setPassword] = reactExports.useState("");
  const mut = useMutation({
    mutationFn: () => resetFn({
      user_id: user.id,
      password
    }),
    onSuccess: () => {
      toast.success("Palavra-passe redefinida");
      setPassword("");
      onClose();
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  if (!user) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Redefinir palavra-passe" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Utilizador: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.full_name ?? user.email })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nova palavra-passe" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", minLength: 8, value: password, onChange: (e) => setPassword(e.target.value) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => mut.mutate(), disabled: mut.isPending || password.length < 8, children: [
        mut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Redefinir"
      ] })
    ] })
  ] });
}
function AuditDialog({
  open
}) {
  const {
    data = [],
    isLoading
  } = useQuery({
    queryKey: ["audit-users", isDesktop() ? "desktop" : "web"],
    enabled: open,
    queryFn: () => listAdminAuditLogs()
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Auditoria de utilizadores" }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-sm text-muted-foreground", children: "Sem registos." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[60vh] overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Quando" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Ação" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Detalhes" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: data.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "whitespace-nowrap text-xs", children: formatDateTime(l.created_at) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: l.action }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: l.details ? JSON.stringify(l.details) : "—" })
      ] }, l.id)) })
    ] }) })
  ] });
}
export {
  UtilizadoresPage as component
};
