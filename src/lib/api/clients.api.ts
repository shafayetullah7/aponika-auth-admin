import { fetcher } from "./api-client";
import type {
  AuditEventSummary,
  CreateOAuthClientDto,
  ListOAuthClientsFilter,
  OAuthClientDetail,
  OAuthClientSummary,
  PaginatedResponse,
  PaginatedResult,
  PaginationMeta,
  UpdateOAuthClientDto,
} from "./types";

const BASE_PATH = "/admin/clients";

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

  throw new Error("Clients API returned unexpected paginated format");
}

export const clientsApi = {
  list(filter?: ListOAuthClientsFilter): Promise<PaginatedResult<OAuthClientSummary>> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filter?.page !== undefined) params.page = filter.page;
    if (filter?.limit !== undefined) params.limit = filter.limit;
    if (filter?.status) params.status = filter.status;

    return fetcher<PaginatedResponse<OAuthClientSummary>>(BASE_PATH, {
      params,
      unwrapData: false,
    }).then((response) => unwrapPaginated<OAuthClientSummary>(response));
  },

  getById(id: string): Promise<OAuthClientDetail> {
    return fetcher<OAuthClientDetail>(`${BASE_PATH}/${id}`);
  },

  create(payload: CreateOAuthClientDto): Promise<OAuthClientDetail> {
    return fetcher<OAuthClientDetail>(BASE_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: UpdateOAuthClientDto): Promise<OAuthClientDetail> {
    return fetcher<OAuthClientDetail>(`${BASE_PATH}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  disable(id: string): Promise<OAuthClientSummary> {
    return fetcher<OAuthClientSummary>(`${BASE_PATH}/${id}/disable`, {
      method: "POST",
    });
  },

  enable(id: string): Promise<OAuthClientSummary> {
    return fetcher<OAuthClientSummary>(`${BASE_PATH}/${id}/enable`, {
      method: "POST",
    });
  },

  listAuditEvents(id: string): Promise<AuditEventSummary[]> {
    return fetcher<AuditEventSummary[]>(`${BASE_PATH}/${id}/audit-events`);
  },
};
