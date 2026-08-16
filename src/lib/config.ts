function resolveApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_ORIGIN;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3010/api/v1";

  try {
    return new URL(baseUrl).origin;
  } catch {
    return "http://localhost:3010";
  }
}

const apiOrigin = resolveApiOrigin();

export const config = {
  api: {
    origin: apiOrigin,
    baseUrl: import.meta.env.VITE_API_BASE_URL || `${apiOrigin}/api/v1`,
    healthUrl:
      import.meta.env.VITE_HEALTH_URL || `${apiOrigin}/health`,
    timeout: {
      client: Number(import.meta.env.VITE_CLIENT_TIMEOUT) || 30000,
      server: Number(import.meta.env.VITE_SERVER_TIMEOUT) || 30000,
    },
  },
  auth: {
    loginUrl: "/login",
  },
  isDev: import.meta.env.DEV,
} as const;

export type AppConfig = typeof config;
