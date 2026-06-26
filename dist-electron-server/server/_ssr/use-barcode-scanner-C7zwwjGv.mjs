import { r as reactExports } from "../_libs/react.mjs";
function useBarcodeScanner(onScan, options = {}) {
  const { minLength = 4, interKeyMs = 40, allowInInputs = false } = options;
  const bufferRef = reactExports.useRef("");
  const lastKeyRef = reactExports.useRef(0);
  reactExports.useEffect(() => {
    function onKeyDown(e) {
      if (!allowInInputs) {
        const t = e.target;
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
export {
  useBarcodeScanner as u
};
