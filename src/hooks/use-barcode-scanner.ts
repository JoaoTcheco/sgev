import { useEffect, useRef } from "react";

/**
 * Detects input from a hardware barcode scanner (USB HID keyboard emulation).
 * Scanners type characters very fast (<30ms between keys) and end with Enter.
 * Calls `onScan` with the accumulated value when a complete scan is detected.
 *
 * Ignores typing in input/textarea/contenteditable to avoid hijacking forms.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options: { minLength?: number; interKeyMs?: number; allowInInputs?: boolean } = {},
) {
  const { minLength = 4, interKeyMs = 40, allowInInputs = false } = options;
  const bufferRef = useRef<string>("");
  const lastKeyRef = useRef<number>(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!allowInInputs) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
          return;
        }
      }
      const now = Date.now();
      const gap = now - lastKeyRef.current;
      lastKeyRef.current = now;

      if (e.key === "Enter") {
        const code = bufferRef.current;
        bufferRef.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          onScan(code);
        }
        return;
      }

      if (gap > 500) bufferRef.current = "";

      if (e.key.length === 1 && gap < interKeyMs * 6) {
        bufferRef.current += e.key;
      } else if (e.key.length === 1) {
        bufferRef.current = e.key;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onScan, minLength, interKeyMs, allowInInputs]);
}
