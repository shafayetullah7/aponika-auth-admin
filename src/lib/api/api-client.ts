import { config } from "~/lib/config";
import { ApiError } from "./types";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  strict?: boolean;
  unwrapData?: boolean;
}

function getCookieFromStr(cookieStr: string, name: string): string | undefined {
  if (!cookieStr) return undefined;
  const regex = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`);
  const match = cookieStr.match(regex);
  return match ? match[1] : undefined;
}

function getUniversalCookie(name: string, headers?: Headers): string | undefined {
  if (typeof window !== "undefined") {
    return getCookieFromStr(document.cookie, name);
  }

  if (headers) {
    const cookieHeader = headers.get("cookie");
    if (cookieHeader) {
      return getCookieFromStr(cookieHeader, name);
    }
  }

  return undefined;
}

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

export const buildURL = (
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string => {
  const baseURL = config.api.baseUrl;
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

let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 1;

function getSetCookiesFromResponse(response: Response): string[] {
  const headersAny = response.headers as unknown as {
    getSetCookie?: () => string[];
  };

  if (typeof headersAny.getSetCookie === "function") {
    const cookies = headersAny.getSetCookie();
    if (cookies.length > 0) {
      return cookies;
    }
  }

  const raw = response.headers.get("set-cookie");
  return raw ? [raw] : [];
}

function parseSetCookiePair(
  setCookie: string,
): { name: string; value: string } | null {
  const part = setCookie.split(";")[0]?.trim();
  if (!part) return null;

  const eq = part.indexOf("=");
  if (eq <= 0) return null;

  return {
    name: part.slice(0, eq),
    value: part.slice(eq + 1),
  };
}

function mergeCookieHeader(
  existingCookieHeader: string | null,
  setCookies: string[],
): string {
  const jar = new Map<string, string>();

  if (existingCookieHeader) {
    for (const segment of existingCookieHeader.split(/;\s*/)) {
      const eq = segment.indexOf("=");
      if (eq > 0) {
        jar.set(segment.slice(0, eq), segment.slice(eq + 1));
      }
    }
  }

  for (const setCookie of setCookies) {
    const parsed = parseSetCookiePair(setCookie);
    if (parsed) {
      jar.set(parsed.name, parsed.value);
    }
  }

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function appendSetCookiesToSsrResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any,
  response: Response,
): Promise<void> {
  if (!import.meta.env.SSR || !event) {
    return;
  }

  const setCookies = getSetCookiesFromResponse(response);
  if (setCookies.length === 0) {
    return;
  }

  try {
    const { appendResponseHeader } = await import("vinxi/http");
    const isResponseFinished =
      event.nativeEvent.node.res.headersSent ||
      event.nativeEvent.node.res.writableEnded;

    if (isResponseFinished) {
      return;
    }

    for (const cookie of setCookies) {
      appendResponseHeader(event.nativeEvent, "Set-Cookie", cookie);
    }
  } catch {
    // Cookie sync is best-effort during SSR.
  }
}

export async function fetcher<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    params,
    strict = true,
    unwrapData = true,
    signal,
    ...fetchOptions
  } = options;
  const url = buildURL(endpoint, params);

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  if (import.meta.env.SSR) {
    try {
      const { getRequestEvent } = await import("solid-js/web");
      event = getRequestEvent();
      if (event && !headers.has("cookie")) {
        const cookie = event.request.headers.get("cookie");
        if (cookie) {
          headers.set("cookie", cookie);
        }
      }
    } catch {
      // Outside request context.
    }
  }

  const method = fetchOptions.method?.toUpperCase() || "GET";
  const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  if (stateChangingMethods.includes(method)) {
    const xsrfToken = getUniversalCookie("xsrf-token", headers);
    if (xsrfToken) {
      headers.set("X-XSRF-TOKEN", xsrfToken);
    }
  }

  const makeRequest = (opts: RequestInit, requestHeaders: Headers) =>
    fetch(url, {
      ...opts,
      headers: requestHeaders,
      credentials: "include",
      signal: createTimeoutSignal(signal),
    });

  try {
    let response = await makeRequest(fetchOptions, headers);

    const isAuthRoute =
      endpoint.startsWith("/admin/auth/login") ||
      endpoint.startsWith("/admin/auth/refresh") ||
      endpoint.startsWith("/admin/auth/register");

    if (response.status === 401 && strict && !isAuthRoute) {
      if (!isRefreshing && refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        isRefreshing = true;
        refreshAttempts++;

        const refreshHeaders = new Headers();
        const cookieHeader = headers.get("cookie");
        if (cookieHeader) {
          refreshHeaders.set("cookie", cookieHeader);
        }

        refreshPromise = fetch(`${config.api.baseUrl}/admin/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: refreshHeaders,
        }).finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      if (refreshPromise) {
        const refreshResponse = await refreshPromise;

        if (refreshResponse?.ok) {
          refreshAttempts = 0;
          await appendSetCookiesToSsrResponse(event, refreshResponse);

          const retryHeaders = new Headers(headers);
          const refreshedCookies = getSetCookiesFromResponse(refreshResponse);
          if (refreshedCookies.length > 0) {
            retryHeaders.set(
              "cookie",
              mergeCookieHeader(headers.get("cookie"), refreshedCookies),
            );
          }

          const newXsrfToken = getUniversalCookie("xsrf-token", retryHeaders);
          if (newXsrfToken && stateChangingMethods.includes(method)) {
            retryHeaders.set("X-XSRF-TOKEN", newXsrfToken);
          }
          response = await makeRequest(fetchOptions, retryHeaders);
        } else {
          refreshAttempts = 0;
          if (import.meta.env.SSR) {
            const { redirect } = await import("@solidjs/router");
            throw redirect("/login");
          }
          if (typeof window !== "undefined") {
            window.location.href = "/login";
            return {} as T;
          }
        }
      }
    }

    await appendSetCookiesToSsrResponse(event, response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData &&
        typeof errorData === "object" &&
        "message" in errorData &&
        typeof errorData.message === "string"
          ? errorData.message
          : `API Error: ${response.status}`;
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const result = await response.json().catch(() => ({}));

    if (!unwrapData) {
      return result as T;
    }

    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      "data" in result
    ) {
      return result.data as T;
    }

    return result as T;
  } catch (error) {
    if (error instanceof Response || error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  }
}

export const api = fetcher;

export async function fetchAbsolute<T>(
  absoluteUrl: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params: _params, strict: _strict, unwrapData: _unwrap, signal, ...init } =
    options;
  const headers = new Headers(init.headers);

  try {
    const response = await fetch(absoluteUrl, {
      ...init,
      headers,
      signal: createTimeoutSignal(signal),
    });

    if (!response.ok) {
      throw new ApiError(response.statusText || "Request failed", response.status);
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
