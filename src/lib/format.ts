// Formatação padrão do sistema — Moçambique.
// Fuso horário: Africa/Maputo (UTC+2, sem DST). Moeda: Metical (MZN).
export const APP_TIMEZONE = "Africa/Maputo";
export const APP_LOCALE = "pt-MZ";
export const APP_CURRENCY = "MZN";

export function formatMZN(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "0,00 MT";
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: APP_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(d);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(d);
}

// ---------- Helpers de calendário no fuso de Moçambique ----------
// Devolvem os componentes locais (ano/mês/dia/hora/dia-da-semana) de uma
// data ISO/UTC já convertida para Africa/Maputo — usar sempre estes helpers
// em vez de `d.getHours()` / `d.getFullYear()` (que dependem do fuso do SO).

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export type MZParts = {
  year: number; month: number; day: number;
  hour: number; minute: number; weekday: number;
  dayKey: string;   // YYYY-MM-DD (Maputo)
  monthKey: string; // YYYY-MM (Maputo)
};

export function mzParts(value: string | Date): MZParts {
  const d = typeof value === "string" ? new Date(value) : value;
  const parts = partsFmt.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour) % 24; // Intl pode devolver "24" à meia-noite
  const minute = Number(map.minute);
  const weekday = WEEKDAY_INDEX[map.weekday] ?? 0;
  const dayKey = `${map.year}-${map.month}-${map.day}`;
  const monthKey = `${map.year}-${map.month}`;
  return { year, month, day, hour, minute, weekday, dayKey, monthKey };
}

// Converte uma data local Maputo (YYYY-MM-DD + hora/min) para ISO UTC.
// Africa/Maputo é UTC+2 sem DST, portanto subtraímos 2h.
export function mzLocalToISO(dateYMD: string, hour = 0, minute = 0, second = 0): string {
  const [y, m, d] = dateYMD.split("-").map(Number);
  const utcMs = Date.UTC(y, (m - 1), d, hour - 2, minute, second);
  return new Date(utcMs).toISOString();
}

export function mzTodayYMD(): string {
  return mzParts(new Date()).dayKey;
}

export function mzDaysAgoYMD(n: number): string {
  const today = mzParts(new Date());
  // Constrói meio-dia Maputo para evitar salto de dia por DST (não existe cá, mas seguro)
  const utc = Date.UTC(today.year, today.month - 1, today.day - n, 12, 0, 0);
  return mzParts(new Date(utc)).dayKey;
}
