import { useEffect, useState, useCallback } from "react";

export type LabelMode = "a4" | "thermal";

export interface LabelSettings {
  mode: LabelMode;
  printerName: string; // hint shown to user; browser dialog still chooses

  // A4 grid
  a4: {
    columns: number;          // 1..6
    marginMm: number;         // page margin
    gapMm: number;            // gap between labels
    labelHeightMm: number;    // each label height
    showPrice: boolean;
    showBatch: boolean;
    showExpiry: boolean;
  };

  // Thermal roll (single-label continuous)
  thermal: {
    widthMm: number;          // label width
    heightMm: number;         // label height
    marginMm: number;         // inner padding
    barcodeHeightMm: number;
    fontSizePt: number;
    showPrice: boolean;
    showBatch: boolean;
    showExpiry: boolean;
  };
}

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  mode: "a4",
  printerName: "",
  a4: {
    columns: 3,
    marginMm: 8,
    gapMm: 3,
    labelHeightMm: 30,
    showPrice: true,
    showBatch: true,
    showExpiry: true,
  },
  thermal: {
    widthMm: 50,
    heightMm: 30,
    marginMm: 2,
    barcodeHeightMm: 12,
    fontSizePt: 8,
    showPrice: false,
    showBatch: true,
    showExpiry: true,
  },
};

const KEY = "pharmasys.label-settings.v1";

function read(): LabelSettings {
  if (typeof window === "undefined") return DEFAULT_LABEL_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LABEL_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_LABEL_SETTINGS,
      ...parsed,
      a4: { ...DEFAULT_LABEL_SETTINGS.a4, ...(parsed.a4 ?? {}) },
      thermal: { ...DEFAULT_LABEL_SETTINGS.thermal, ...(parsed.thermal ?? {}) },
    } as LabelSettings;
  } catch {
    return DEFAULT_LABEL_SETTINGS;
  }
}

export function getLabelSettings(): LabelSettings {
  return read();
}

export function useLabelSettings() {
  const [settings, setSettings] = useState<LabelSettings>(() => read());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setSettings(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<LabelSettings> | ((s: LabelSettings) => LabelSettings)) => {
    setSettings((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
    setSettings(DEFAULT_LABEL_SETTINGS);
  }, []);

  return { settings, update, reset };
}
