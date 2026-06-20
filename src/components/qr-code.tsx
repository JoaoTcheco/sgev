import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 96 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { margin: 0, width: size * 2, errorCorrectionLevel: "M" })
      .then((url) => { if (active) setSrc(url); })
      .catch(() => { if (active) setSrc(""); });
    return () => { active = false; };
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size }} className="bg-black/5" />;
  return <img src={src} alt="QR" width={size} height={size} style={{ width: size, height: size }} />;
}
