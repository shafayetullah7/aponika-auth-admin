import { useNavigate } from "@solidjs/router";
import { createEffect, Show, Suspense, type JSX } from "solid-js";
import { AdminSidebar } from "~/components/layout";
import { LoadingFallback } from "~/components/ui";
import { useSession } from "~/lib/auth";

export default function ProtectedLayout(props: { children: JSX.Element }) {
  const user = useSession();
  const navigate = useNavigate();

  createEffect(() => {
    const userData = user();
    if (userData === null) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/";
      const params = new URLSearchParams();
      if (returnTo && returnTo !== "/login") {
        params.set("returnTo", returnTo);
      }
      const query = params.toString();
      navigate(query ? `/login?${query}` : "/login", { replace: true });
    }
  });

  return (
    <Show when={user()} fallback={<LoadingFallback fullScreen={false} />}>
      <div class="flex h-screen overflow-hidden bg-cream-50">
        <AdminSidebar />
        <main class="flex-1 overflow-y-auto p-8">
          <Suspense fallback={<LoadingFallback fullScreen={false} />}>
            {props.children}
          </Suspense>
        </main>
      </div>
    </Show>
  );
}
