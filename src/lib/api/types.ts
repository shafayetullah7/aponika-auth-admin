export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  status: string;
  role: string;
}

export interface LoginLocalAdminDto {
  email: string;
  password: string;
}

export interface RegisterLocalAdminDto {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
}

export interface CompleteAdminRegistrationDto extends RegisterLocalAdminDto {
  otp: string;
}

export interface RequestAdminRegistrationOtpResponse {
  expiresAt: string;
}

export interface LoginResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  admin: AdminUser;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta & { pages?: number };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type OAuthClientStatus = "active" | "disabled";
export type OAuthClientType = "public" | "confidential";

export interface OAuthClientSummary {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  clientType: OAuthClientType;
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  pkceRequired: boolean;
  status: OAuthClientStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthClientDetail extends OAuthClientSummary {
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  allowedOrigins?: string[];
  clientSecret?: string;
}

export interface ListOAuthClientsFilter {
  page?: number;
  limit?: number;
  status?: OAuthClientStatus;
}

export type PlatformUserStatus = "ACTIVE" | "SUSPENDED";

export interface PlatformUserSummary {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  status: PlatformUserStatus;
  createdAt: string;
}

export interface PlatformUserDetail extends PlatformUserSummary {
  updatedAt: string;
  sessionCount: number;
  activeSessionCount: number;
  lastLoginAt: string | null;
}

export interface ListPlatformUsersFilter {
  page?: number;
  limit?: number;
  q?: string;
  status?: PlatformUserStatus;
}

export type PlatformUserSessionStatus = "active" | "revoked" | "expired";

export interface PlatformUserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  ip: string | null;
  deviceInfo: Record<string, unknown>;
  status: PlatformUserSessionStatus;
}

export interface ListPlatformUserSessionsFilter {
  page?: number;
  limit?: number;
}

export interface CreateOAuthClientDto {
  clientId: string;
  name: string;
  description?: string;
  clientType: OAuthClientType;
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  allowedOrigins?: string[];
  grantTypes?: string[];
  responseTypes?: string[];
  scopes: string[];
  pkceRequired?: boolean;
}

export interface UpdateOAuthClientDto {
  name?: string;
  description?: string | null;
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  allowedOrigins?: string[];
  grantTypes?: string[];
  responseTypes?: string[];
  scopes?: string[];
  pkceRequired?: boolean;
}

export interface AuditEventSummary {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface ListAuditEventsFilter {
  page?: number;
  limit?: number;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}
