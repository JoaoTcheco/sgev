import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-sm text-destructive", children: [
  "Erro ao carregar recibo: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
