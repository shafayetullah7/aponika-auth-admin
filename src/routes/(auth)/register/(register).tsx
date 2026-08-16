import { action, useAction, useSearchParams, useSubmission, A } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { createForm } from "@modular-forms/solid";
import { z } from "zod";
import { Button, Card, FieldGroup, Input, PasswordInput } from "~/components/ui";
import { adminAuthApi } from "~/lib/api/admin-auth.api";
import { ApiError } from "~/lib/api/types";
import {
  appendQueryParam,
  buildAuthPathWithReturnTo,
  safeReturnTo,
} from "~/lib/auth/return-to";
import { useI18n } from "~/i18n";
import {
  registerDetailsSchema,
  toRegisterPayload,
  type RegisterDetailsFormData,
} from "~/schemas/register.schema";

const otpInputSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type OtpFormData = z.infer<typeof otpInputSchema>;

function isRateLimitError(status?: number, message?: string, errorCode?: string) {
  return (
    status === 429 ||
    errorCode === "TOO_MANY_REQUESTS" ||
    Boolean(message?.toLowerCase().includes("once per minute"))
  );
}

const requestOtpAction = action(async (data: RegisterDetailsFormData) => {
  "use server";
  const result = await adminAuthApi.requestRegistrationOtp(toRegisterPayload(data));
  return { success: true as const, expiresAt: result.expiresAt };
}, "admin-register-request-otp");

const completeRegistrationAction = action(
  async (data: RegisterDetailsFormData & { otp: string; returnTo?: string }) => {
    "use server";
    await adminAuthApi.completeRegistration({
      ...toRegisterPayload(data),
      otp: data.otp,
    });
    const loginPath = buildAuthPathWithReturnTo("/login", data.returnTo);
    const target = appendQueryParam(loginPath, "registered", "1");
    return { success: true as const, target };
  },
  "admin-register-complete",
);

export default function RegisterPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [step, setStep] = createSignal<"details" | "otp">("details");
  const [expiresAt, setExpiresAt] = createSignal<string | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [registrationDetails, setRegistrationDetails] =
    createSignal<RegisterDetailsFormData | null>(null);

  const requestOtpTrigger = useAction(requestOtpAction);
  const requestOtpSubmission = useSubmission(requestOtpAction);
  const completeTrigger = useAction(completeRegistrationAction);
  const completeSubmission = useSubmission(completeRegistrationAction);

  const [, { Form: DetailsForm, Field: DetailsField }] =
    createForm<RegisterDetailsFormData>({
      validate: (values) => {
        const result = registerDetailsSchema.safeParse(values);
        if (result.success) return {};
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            errors[issue.path.join(".")] = issue.message;
          }
        });
        return errors;
      },
    });

  const [, { Form: OtpForm, Field: OtpField }] = createForm<OtpFormData>({
    validate: (values) => {
      const result = otpInputSchema.safeParse(values);
      if (result.success) return {};
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          errors[issue.path.join(".")] = issue.message;
        }
      });
      return errors;
    },
  });

  createEffect(() => {
    if (requestOtpSubmission.result?.success) {
      setExpiresAt(requestOtpSubmission.result.expiresAt);
      setStep("otp");
      setErrorMessage(null);
    }
  });

  createEffect(() => {
    if (completeSubmission.result?.success) {
      window.location.assign(completeSubmission.result.target);
    }
  });

  createEffect(() => {
    const error = (requestOtpSubmission.error || completeSubmission.error) as
      | ApiError
      | undefined;
    if (!error) return;

    const data = error.data as
      | { message?: string; errorCode?: string }
      | undefined;

    if (isRateLimitError(error.status, data?.message, data?.errorCode)) {
      setErrorMessage(t("admin.registrationRateLimited"));
      return;
    }

    setErrorMessage(data?.message || error.message || t("admin.registerFailed"));
  });

  const handleDetailsSubmit = (values: RegisterDetailsFormData) => {
    setErrorMessage(null);
    setRegistrationDetails(values);
    requestOtpTrigger(values);
  };

  const handleOtpSubmit = (values: OtpFormData) => {
    const details = registrationDetails();
    if (!details) {
      setStep("details");
      return;
    }

    setErrorMessage(null);
    completeTrigger({
      ...details,
      otp: values.otp,
      returnTo: safeReturnTo(searchParams.returnTo),
    });
  };

  const loginHref = () => buildAuthPathWithReturnTo("/login", searchParams.returnTo);

  return (
    <main class="flex min-h-screen items-center justify-center bg-forest-950 p-4">
      <Card class="w-full max-w-lg">
        <h1 class="h3 text-center">{t("admin.registerTitle")}</h1>
        <p class="mt-2 text-center text-forest-600">{t("admin.registerSubtitle")}</p>

        <Show when={errorMessage()}>
          <div class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage()}
          </div>
        </Show>

        <Show when={step() === "details"}>
          <DetailsForm onSubmit={handleDetailsSubmit} class="mt-8 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <DetailsField name="firstName">
                {(field, props) => (
                  <FieldGroup
                    label={t("admin.firstName")}
                    requirement="required"
                    error={field.error}
                  >
                    <Input
                      {...props}
                      value={field.value || ""}
                      error={field.error}
                      showErrorMessage={false}
                      disabled={requestOtpSubmission.pending}
                    />
                  </FieldGroup>
                )}
              </DetailsField>
              <DetailsField name="lastName">
                {(field, props) => (
                  <FieldGroup
                    label={t("admin.lastName")}
                    requirement="required"
                    error={field.error}
                  >
                    <Input
                      {...props}
                      value={field.value || ""}
                      error={field.error}
                      showErrorMessage={false}
                      disabled={requestOtpSubmission.pending}
                    />
                  </FieldGroup>
                )}
              </DetailsField>
            </div>

            <DetailsField name="userName">
              {(field, props) => (
                <FieldGroup
                  label={t("admin.userName")}
                  requirement="required"
                  error={field.error}
                >
                  <Input
                    {...props}
                    value={field.value || ""}
                    error={field.error}
                    showErrorMessage={false}
                    disabled={requestOtpSubmission.pending}
                  />
                </FieldGroup>
              )}
            </DetailsField>

            <DetailsField name="email">
              {(field, props) => (
                <FieldGroup
                  label={t("admin.email")}
                  requirement="required"
                  error={field.error}
                >
                  <Input
                    {...props}
                    type="email"
                    autocomplete="email"
                    value={field.value || ""}
                    error={field.error}
                    showErrorMessage={false}
                    disabled={requestOtpSubmission.pending}
                  />
                </FieldGroup>
              )}
            </DetailsField>

            <DetailsField name="password">
              {(field, props) => (
                <FieldGroup
                  label={t("admin.password")}
                  requirement="required"
                  error={field.error}
                >
                  <PasswordInput
                    {...props}
                    autocomplete="new-password"
                    value={field.value || ""}
                    error={field.error}
                    showPasswordLabel={t("admin.showPassword")}
                    hidePasswordLabel={t("admin.hidePassword")}
                    disabled={requestOtpSubmission.pending}
                  />
                </FieldGroup>
              )}
            </DetailsField>

            <DetailsField name="confirmPassword">
              {(field, props) => (
                <FieldGroup
                  label={t("admin.confirmPassword")}
                  requirement="required"
                  error={field.error}
                >
                  <PasswordInput
                    {...props}
                    autocomplete="new-password"
                    value={field.value || ""}
                    error={field.error}
                    showPasswordLabel={t("admin.showPassword")}
                    hidePasswordLabel={t("admin.hidePassword")}
                    disabled={requestOtpSubmission.pending}
                  />
                </FieldGroup>
              )}
            </DetailsField>

            <Button type="submit" class="w-full" loading={requestOtpSubmission.pending}>
              {requestOtpSubmission.pending ? t("admin.requestingOtp") : t("admin.requestOtp")}
            </Button>
          </DetailsForm>
        </Show>

        <Show when={step() === "otp"}>
          <div class="mt-6 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-800">
            <p>{t("admin.otpGatekeeperInfo")}</p>
            <Show when={expiresAt()}>
              <p class="mt-2 font-medium">
                {t("admin.otpExpiresAt")}: {new Date(expiresAt()!).toLocaleString()}
              </p>
            </Show>
          </div>

          <OtpForm onSubmit={handleOtpSubmit} class="mt-6 space-y-4">
            <OtpField name="otp">
              {(field, props) => (
                <FieldGroup
                  label={t("admin.otp")}
                  requirement="required"
                  error={field.error}
                >
                  <Input
                    {...props}
                    inputmode="numeric"
                    maxlength={6}
                    placeholder="123456"
                    value={field.value || ""}
                    error={field.error}
                    showErrorMessage={false}
                    disabled={completeSubmission.pending}
                  />
                </FieldGroup>
              )}
            </OtpField>

            <div class="flex gap-3">
              <Button type="button" variant="secondary" class="flex-1" onClick={() => setStep("details")}>
                {t("admin.back")}
              </Button>
              <Button type="submit" class="flex-1" loading={completeSubmission.pending}>
                {completeSubmission.pending ? t("admin.completingRegistration") : t("admin.completeRegistration")}
              </Button>
            </div>
          </OtpForm>
        </Show>

        <p class="mt-6 text-center text-sm text-forest-600">
          {t("admin.haveAccount")}{" "}
          <A href={loginHref()} class="font-semibold text-forest-700 hover:text-forest-900">
            {t("admin.signIn")}
          </A>
        </p>
      </Card>
    </main>
  );
}
