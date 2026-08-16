import type { Component } from "solid-js";
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
  labelKey: string;
  icon: Component<IconProps>;
  match: NavMatch;
}

export const adminNavItems: AdminNavItem[] = [
  { href: "/", labelKey: "admin.dashboard", icon: DashboardIcon, match: "exact" },
  { href: "/users", labelKey: "admin.users", icon: UsersIcon, match: "prefix" },
  {
    href: "/clients",
    labelKey: "admin.clients",
    icon: ClientsIcon,
    match: "prefix",
  },
  { href: "/audit", labelKey: "admin.audit", icon: AuditIcon, match: "prefix" },
];
