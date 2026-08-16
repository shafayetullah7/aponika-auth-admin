import { action, createAsync, query, redirect } from "@solidjs/router";
import { adminAuthApi } from "~/lib/api/admin-auth.api";

export const getSession = query(async () => {
  "use server";
  try {
    return await adminAuthApi.checkAuth();
  } catch {
    return null;
  }
}, "admin-session");

export const logoutAction = action(async () => {
  "use server";
  try {
    await adminAuthApi.logout();
  } catch (error: unknown) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;
    if (status !== 401) {
      console.error("[Auth] Logout error:", error);
    }
  }

  throw redirect("/login", {
    revalidate: "admin-session",
  });
}, "admin-logout");

export const useSession = () => createAsync(() => getSession());
