import type { JSX } from "solid-js";
import { AdminSidebar } from "~/components/layout";

/** Protected shell — auth guard added in feature phase. */
export default function ProtectedLayout(props: { children: JSX.Element }) {
  return (
    <div class="flex h-screen overflow-hidden bg-cream-50">
      <AdminSidebar />
      <main class="flex-1 overflow-y-auto p-8">{props.children}</main>
    </div>
  );
}
