import { fetcher } from "./api-client";
import type {
  AdminUser,
  CompleteAdminRegistrationDto,
  LoginLocalAdminDto,
  LoginResponse,
  RegisterLocalAdminDto,
  RequestAdminRegistrationOtpResponse,
} from "./types";

export const adminAuthApi = {
  login(data: LoginLocalAdminDto): Promise<LoginResponse> {
    return fetcher<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      strict: false,
    });
  },

  requestRegistrationOtp(
    data: RegisterLocalAdminDto,
  ): Promise<RequestAdminRegistrationOtpResponse> {
    return fetcher<RequestAdminRegistrationOtpResponse>(
      "/admin/auth/register/request-otp",
      {
        method: "POST",
        body: JSON.stringify(data),
        strict: false,
      },
    );
  },

  completeRegistration(data: CompleteAdminRegistrationDto): Promise<AdminUser> {
    return fetcher<AdminUser>("/admin/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      strict: false,
    });
  },

  checkAuth(): Promise<AdminUser> {
    return fetcher<AdminUser>("/admin/auth/check", {
      strict: false,
    });
  },

  logout(): Promise<void> {
    return fetcher<void>("/admin/auth/logout", {
      method: "POST",
    });
  },
};
