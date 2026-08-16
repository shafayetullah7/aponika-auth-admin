import { useNavigate } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { LocaleToggle } from "~/components/LocaleToggle";
import { useSession } from "~/lib/auth";

export default function AuthLayout(props: { children: unknown }) {
  const user = useSession();
  const navigate = useNavigate();

  createEffect(() => {
    if (user()) {
      navigate("/", { replace: true });
    }
  });

  return (
    <Show when={user() === null}>
      <div class="relative min-h-screen">
        <div class="absolute right-4 top-4 z-10">
          <LocaleToggle />
        </div>
        {props.children as never}
      </div>
    </Show>
  );
}
