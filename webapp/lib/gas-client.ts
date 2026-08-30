"use client";
// Browser-side helper for calling backend actions via the /api/gas proxy route.
// Never contains secrets — the proxy route attaches those server-side.

export class GasClientError extends Error {
  authError: boolean;
  constructor(message: string, authError = false) {
    super(message);
    this.name = "GasClientError";
    this.authError = authError;
  }
}

export async function gasCall<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new GasClientError(json.error || "Request failed", !!json.authError);
  }
  return json.data as T;
}

/** Convert a File object to a base64 string for upload actions (createPortfolioItem, etc.). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:<mime>;base64," prefix
      const base64 = result.substring(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
