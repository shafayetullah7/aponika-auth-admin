import { fetcher } from "./api-client";
import type {
  ListPlatformUsersFilter,
  ListPlatformUserSessionsFilter,
  PaginatedResponse,
  PaginatedResult,
  PaginationMeta,
  PlatformUserDetail,
  PlatformUserSession,
  PlatformUserSummary,
} from "./types";

const BASE_PATH = "/admin/users";

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

  throw new Error("Users API returned unexpected paginated format");
}

export const usersApi = {
  list(filter?: ListPlatformUsersFilter): Promise<PaginatedResult<PlatformUserSummary>> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filter?.page !== undefined) params.page = filter.page;
    if (filter?.limit !== undefined) params.limit = filter.limit;
    if (filter?.q) params.q = filter.q;
    if (filter?.status) params.status = filter.status;

    return fetcher<PaginatedResponse<PlatformUserSummary>>(BASE_PATH, {
      params,
      unwrapData: false,
    }).then((response) => unwrapPaginated<PlatformUserSummary>(response));
  },

  getById(id: string): Promise<PlatformUserDetail> {
    return fetcher<PlatformUserDetail>(`${BASE_PATH}/${id}`);
  },

  suspend(id: string): Promise<PlatformUserSummary> {
    return fetcher<PlatformUserSummary>(`${BASE_PATH}/${id}/suspend`, {
      method: "POST",
    });
  },

  activate(id: string): Promise<PlatformUserSummary> {
    return fetcher<PlatformUserSummary>(`${BASE_PATH}/${id}/activate`, {
      method: "POST",
    });
  },

  listSessions(
    userId: string,
    filter?: ListPlatformUserSessionsFilter,
  ): Promise<PaginatedResult<PlatformUserSession>> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filter?.page !== undefined) params.page = filter.page;
    if (filter?.limit !== undefined) params.limit = filter.limit;

    return fetcher<PaginatedResponse<PlatformUserSession>>(
      `${BASE_PATH}/${userId}/sessions`,
      {
        params,
        unwrapData: false,
      },
    ).then((response) => unwrapPaginated<PlatformUserSession>(response));
  },

  revokeSession(userId: string, sessionId: string): Promise<PlatformUserSession> {
    return fetcher<PlatformUserSession>(`${BASE_PATH}/${userId}/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },
};
