import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root } from "../_libs/radix-ui__react-separator.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const Separator = reactExports.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    decorative,
    orientation,
    className: cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    ),
    ...props
  }
));
Separator.displayName = Root.displayName;
export {
  Separator as S
};
