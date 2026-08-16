import { A, useLocation } from "@solidjs/router";
import { For } from "solid-js";
import { adminNavItems } from "~/config/admin-nav";
import { useI18n } from "~/i18n";

export function AdminSidebar() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <aside class="flex h-full w-60 shrink-0 flex-col border-r border-forest-900 bg-forest-950 text-forest-100">
      <div class="flex h-14 items-center border-b border-forest-900 px-5">
        <span class="text-lg font-bold text-white">{t("admin.title")}</span>
      </div>
      <nav class="flex-1 space-y-1 p-3">
        <For each={adminNavItems}>
          {(item) => {
            const active = () =>
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <A
                href={item.href}
                class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                classList={{
                  "bg-forest-800 text-white": active(),
                  "text-forest-300 hover:bg-forest-900 hover:text-white": !active(),
                }}
              >
                {t(item.labelKey)}
              </A>
            );
          }}
        </For>
      </nav>
      <div class="border-t border-forest-900 p-4 text-center text-xs text-forest-500">
        Operator console
      </div>
    </aside>
  );
}
