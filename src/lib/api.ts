export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed (${status})`;
    super(detail);
    this.status = status;
    this.data = data;
  }
}

function getCookie(name: string): string {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

type Options = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, headers, signal } = options;
  const isSafe = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(isSafe ? {} : { "X-CSRFToken": getCookie("csrftoken") }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}