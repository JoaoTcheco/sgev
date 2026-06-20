import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({
  value,
  height = 50,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  format = "CODE128",
  className,
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  format?: string;
  className?: string;
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
      // Make SVG responsive: never overflow its container.
      const svg = ref.current;
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.maxHeight = `${height}px`;
      svg.style.display = "block";
    } catch {
      /* ignore invalid value */
    }
  }, [value, height, width, fontSize, displayValue, format]);
  return (
    <div className={className} style={{ width: "100%", lineHeight: 0 }}>
      <svg ref={ref} />
    </div>
  );
}
