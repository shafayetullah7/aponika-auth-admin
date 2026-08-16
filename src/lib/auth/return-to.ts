const DEFAULT_RETURN_TO = "/";

const ALLOWED_RETURN_TO_PREFIXES = ["/", "/users", "/clients", "/audit"] as const;

const BLOCKED_PREFIXES = ["/login", "/register"] as const;

function isBlockedReturnTo(path: string): boolean {
  return BLOCKED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isAllowedInternalPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  if (isBlockedReturnTo(path)) {
    return false;
  }

  return ALLOWED_RETURN_TO_PREFIXES.some((prefix) => {
    if (prefix === "/") {
      return path === "/";
    }

    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

export function safeReturnTo(
  value: string | string[] | undefined,
  fallback: string = DEFAULT_RETURN_TO,
): string {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !isAllowedInternalPath(raw)) {
    return fallback;
  }

  return raw;
}

export function buildAuthPathWithReturnTo(
  path: string,
  returnTo: string | string[] | undefined,
): string {
  const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!raw || !isAllowedInternalPath(raw)) {
    return path;
  }

  const params = new URLSearchParams();
  params.set("returnTo", raw);
  return `${path}?${params.toString()}`;
}

export function appendQueryParam(
  path: string,
  key: string,
  value: string,
): string {
  const url = new URL(path, "http://local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}
