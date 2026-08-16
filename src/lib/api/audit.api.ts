import { fetcher } from "./api-client";
import type {
  AuditEventSummary,
  ListAuditEventsFilter,
  PaginatedResponse,
  PaginatedResult,
  PaginationMeta,
} from "./types";

const BASE_PATH = "/admin/audit-events";

type PaginatedApiMeta = PaginationMeta & { pages?: number };

function normalizeMeta(meta: PaginatedApiMeta): PaginationMeta {
  const totalPages = meta.totalPages ?? meta.pages ?? 1;

  return {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages,
    hasNext: meta.hasNext ?? meta.page < totalPages,
    hasPrevious: meta.hasPrevious ?? meta.page > 1,
  };
}

function unwrapPaginated<T>(response: unknown): PaginatedResult<T> {
  if (response && typeof response === "object" && "data" in response && "meta" in response) {
    const paginated = response as PaginatedResponse<T>;
    return {
      data: paginated.data,
      meta: normalizeMeta(paginated.meta),
    };
  }

  throw new Error("Audit API returned unexpected paginated format");
}

export const AUDIT_ACTION_OPTIONS = [
  "admin.registration.completed",
  "admin.login.success",
  "admin.login.failure",
  "admin.logout",
  "client.created",
  "client.updated",
  "client.disabled",
  "client.enabled",
  "user.registered",
  "user.login.success",
  "user.login.failure",
  "user.logout",
  "user.suspended",
  "user.activated",
  "user.session.revoked",
  "oidc.token.issued",
] as const;

export const auditApi = {
  list(filter?: ListAuditEventsFilter): Promise<PaginatedResult<AuditEventSummary>> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filter?.page !== undefined) params.page = filter.page;
    if (filter?.limit !== undefined) params.limit = filter.limit;
    if (filter?.action) params.action = filter.action;
    if (filter?.actor) params.actor = filter.actor;
    if (filter?.from) params.from = filter.from;
    if (filter?.to) params.to = filter.to;

    return fetcher<PaginatedResponse<AuditEventSummary>>(BASE_PATH, {
      params,
      unwrapData: false,
    }).then((response) => unwrapPaginated<AuditEventSummary>(response));
  },
};
