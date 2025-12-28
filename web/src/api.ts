/**
 * Small fetch wrapper shared by auth + recipes.
 * - Always sends JSON by default
 * - Parses JSON safely
 * - Throws a typed-ish error object on non-2xx responses
 */

export type ApiError = {
  status: number;
  data: any;
  message: string;
};

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  const res = await fetch(path, { ...opts, headers });

  // Some endpoints may return an empty body (rare). We handle both.
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      data,
      message: data?.error ? String(data.error) : `Request failed: ${res.status}`,
    };
    throw err;
  }

  return data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    // If server returns HTML error pages (e.g. stack traces), still provide something useful.
    return { error: text };
  }
}
