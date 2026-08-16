import { useNavigate } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { useSession } from "~/lib/auth";

export default function AuthLayout(props: { children: unknown }) {
  const user = useSession();
  const navigate = useNavigate();

  createEffect(() => {
    if (user()) {
      navigate("/", { replace: true });
    }
  });

  return <Show when={user() === null}>{props.children as never}</Show>;
}
