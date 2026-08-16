import { A } from "@solidjs/router";
import type { AdminNavItem } from "~/config/admin-nav";
import { useI18n } from "~/i18n";

const linkBaseClass =
  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors group";
const linkActiveClass = "bg-forest-800 text-white";
const linkInactiveClass =
  "text-forest-300 hover:bg-forest-900 hover:text-white";
const iconBaseClass =
  "mr-3 size-5 text-forest-400 group-hover:text-forest-200 group-aria-[current=page]:text-white";

export interface AdminNavLinkProps {
  item: AdminNavItem;
}

export function AdminNavLink(props: AdminNavLinkProps) {
  const { t } = useI18n();
  const Icon = props.item.icon;

  return (
    <A
      href={props.item.href}
      class={linkBaseClass}
      activeClass={linkActiveClass}
      inactiveClass={linkInactiveClass}
      end={props.item.match === "exact"}
    >
      <Icon class={iconBaseClass} />
      {t(props.item.labelKey)}
    </A>
  );
}
