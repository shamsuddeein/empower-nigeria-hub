/**
 * CSV serialization according to RFC 4180 with spreadsheet formula injection neutralization.
 */

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Neutralizes dangerous formula prefixes in customer-controlled cells.
 * Prepends a single quote (') so spreadsheets treat it as plain text.
 */
export function sanitizeCellForSpreadsheet(val: string): string {
  if (!val) return "";
  const firstChar = val.charAt(0);
  if (FORMULA_PREFIXES.includes(firstChar)) {
    return "'" + val;
  }
  return val;
}

/**
 * Escapes an individual cell value according to RFC 4180:
 * - Sanitizes formula injection if sanitizeFormulas is true.
 * - If value contains commas, quotes, or newlines, escapes quotes and wraps in double quotes.
 */
export function escapeCsvCell(raw: unknown, sanitizeFormulas = true): string {
  if (raw == null) return "";
  let str = String(raw);

  if (sanitizeFormulas) {
    str = sanitizeCellForSpreadsheet(str);
  }

  const needsQuotes = /[",\r\n]/.test(str);
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a list of records into a valid RFC 4180 CSV string.
 */
export function serializeToCsv<T extends Record<string, unknown>>(
  columns: { key: keyof T | string; label: string; sanitize?: boolean }[],
  data: T[]
): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.label, false)).join(",");
  const rows = data.map((item) =>
    columns
      .map((c) => {
        const val = item[c.key as keyof T];
        return escapeCsvCell(val, c.sanitize ?? true);
      })
      .join(",")
  );

  return [headerLine, ...rows].join("\r\n");
}

export interface DownloadCsvOptions {
  filename: string;
  headers?: string[];
  rows?: (string | number | boolean | null | undefined)[][];
  csvContent?: string;
}

/**
 * Browser helper to trigger an RFC 4180 CSV file download.
 * Accepts either:
 * 1) downloadCsv({ filename, headers, rows })
 * 2) downloadCsv(filename, headers, rows)
 * 3) downloadCsv(filename, rawCsvContentString)
 */
export function downloadCsv(
  optionsOrFilename: string | DownloadCsvOptions,
  csvContentOrHeaders?: string | string[],
  maybeRows?: (string | number | boolean | null | undefined)[][]
): void {
  let filename: string;
  let csvContent: string;

  if (typeof optionsOrFilename === "object") {
    filename = optionsOrFilename.filename;
    if (optionsOrFilename.csvContent) {
      csvContent = optionsOrFilename.csvContent;
    } else {
      const headerLine = (optionsOrFilename.headers || []).map((h) => escapeCsvCell(h, false)).join(",");
      const rowLines = (optionsOrFilename.rows || []).map((r) =>
        r.map((cell) => escapeCsvCell(cell, true)).join(",")
      );
      csvContent = [headerLine, ...rowLines].filter(Boolean).join("\r\n");
    }
  } else {
    filename = optionsOrFilename;
    if (Array.isArray(csvContentOrHeaders)) {
      const headerLine = csvContentOrHeaders.map((h) => escapeCsvCell(h, false)).join(",");
      const rowLines = (maybeRows || []).map((r) =>
        r.map((cell) => escapeCsvCell(cell, true)).join(",")
      );
      csvContent = [headerLine, ...rowLines].filter(Boolean).join("\r\n");
    } else {
      csvContent = csvContentOrHeaders || "";
    }
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
