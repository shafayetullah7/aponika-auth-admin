import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { LoadingFallback } from "~/components/ui";
import { useSession } from "~/lib/auth";
import { safeReturnTo } from "~/lib/auth/return-to";

export default function AuthLayout(props: { children: unknown }) {
  const user = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  createEffect(() => {
    const currentUser = user();
    if (currentUser) {
      navigate(safeReturnTo(searchParams.returnTo), { replace: true });
    }
  });

  return (
    <Show when={user() === null} fallback={<LoadingFallback />}>
      <div class="min-h-screen">{props.children as never}</div>
    </Show>
  );
}
