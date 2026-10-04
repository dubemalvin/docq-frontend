function extractMessage(data: unknown): string | null {
  if (Array.isArray(data)) return data.length ? String(data[0]) : null;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    for (const value of Object.values(record)) {
      if (Array.isArray(value) && value.length && typeof value[0] === "string") return value[0];
    }
  }
  return null;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(extractMessage(data) ?? `Request failed (${status})`);
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
    const {method = "GET", body, headers, signal} = options;
    const isSafe = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

    const response = await fetch(`/api${path}`, {
        method,
        credentials: "same-origin",
        signal,
            headers: {
                Accept: "application/json",
                // For FormData the browser must set Content-Type itself (it adds the multipart boundary)
                ...(body !== undefined && !(body instanceof FormData) ? {"Content-Type": "application/json"} : {}),
                ...(isSafe ? {} : {"X-CSRFToken": getCookie("csrftoken")}),
                ...headers,
            },
        body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });

    if (response.status === 204) return undefined as T;

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data);
    return data as T;
}
