import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({
  value,
  height = 50,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  format = "CODE128",
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  format?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        height,
        width,
        fontSize,
        displayValue,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      /* ignore invalid value */
    }
  }, [value, height, width, fontSize, displayValue, format]);
  return <svg ref={ref} />;
}
