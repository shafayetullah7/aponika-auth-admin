import { config } from "~/lib/config";
import { ApiError } from "./types";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export const buildURL = (
  baseURL: string,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string => {
  const base = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
  const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

function getRequestTimeout(): number {
  return import.meta.env.SSR
    ? config.api.timeout.server
    : config.api.timeout.client;
}

function createTimeoutSignal(userSignal?: AbortSignal | null): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(getRequestTimeout());

  if (!userSignal) {
    return timeoutSignal;
  }

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([userSignal, timeoutSignal]);
  }

  return userSignal;
}

async function injectSsrCookies(headers: Headers): Promise<void> {
  if (!import.meta.env.SSR || headers.has("cookie")) {
    return;
  }

  try {
    const { getRequestEvent } = await import("solid-js/web");
    const event = getRequestEvent();
    const cookie = event?.request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }
  } catch {
    // SSR context unavailable outside a request handler.
  }
}

async function executeFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params: _params, signal, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  await injectSsrCookies(headers);

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      headers,
      signal: createTimeoutSignal(signal),
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      const message =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : response.statusText || "Request failed";

      throw new ApiError(message, response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  }
}

export async function fetcher<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...init } = options;
  const url = buildURL(config.api.baseUrl, endpoint, params);
  return executeFetch<T>(url, init);
}

export async function fetchAbsolute<T>(
  absoluteUrl: string,
  options: FetchOptions = {},
): Promise<T> {
  return executeFetch<T>(absoluteUrl, options);
}

export const api = fetcher;
