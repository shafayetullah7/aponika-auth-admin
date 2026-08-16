export interface AdminNavItem {
  href: string;
  labelKey: string;
}

export const adminNavItems: AdminNavItem[] = [
  { href: "/", labelKey: "admin.dashboard" },
  { href: "/users", labelKey: "admin.users" },
  { href: "/clients", labelKey: "admin.clients" },
  { href: "/audit", labelKey: "admin.audit" },
];
