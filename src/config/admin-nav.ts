import type { Component } from "solid-js";
import { copy } from "~/copy";
import type { IconProps } from "~/components/icons";
import {
  AuditIcon,
  ClientsIcon,
  DashboardIcon,
  UsersIcon,
} from "~/components/icons";

export type NavMatch = "exact" | "prefix";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: Component<IconProps>;
  match: NavMatch;
}

export const adminNavItems: AdminNavItem[] = [
  { href: "/", label: copy.admin.dashboard, icon: DashboardIcon, match: "exact" },
  { href: "/users", label: copy.admin.users, icon: UsersIcon, match: "prefix" },
  {
    href: "/clients",
    label: copy.admin.clients,
    icon: ClientsIcon,
    match: "prefix",
  },
  { href: "/audit", label: copy.admin.audit, icon: AuditIcon, match: "prefix" },
];
