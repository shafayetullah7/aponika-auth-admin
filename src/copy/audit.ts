import { copy } from "./index";

function getNestedString(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function auditActionLabel(action: string): string {
  return getNestedString(copy.auditLog.action, action) ?? action;
}

export function clientAuditActionLabel(action: string): string {
  const key = `audit.${action}` as keyof typeof copy.clientsDetail;
  const label = copy.clientsDetail[key];
  return typeof label === "string" ? label : action;
}
