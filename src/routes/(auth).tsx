import { useNavigate, useSearchParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { LocaleToggle } from "~/components/LocaleToggle";
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
      <div class="relative min-h-screen">
        <div class="absolute right-4 top-4 z-10">
          <LocaleToggle />
        </div>
        {props.children as never}
      </div>
    </Show>
  );
}
