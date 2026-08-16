import {
  action,
  useAction,
  useSearchParams,
  useSubmission,
  A,
} from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { createForm } from "@modular-forms/solid";
import { Button, Card, FieldGroup, Input, PasswordInput } from "~/components/ui";
import { adminAuthApi } from "~/lib/api/admin-auth.api";
import { ApiError } from "~/lib/api/types";
import { useI18n } from "~/i18n";
import { loginSchema, type LoginFormData } from "~/schemas/login.schema";

function safeReturnTo(value: string | string[] | undefined, fallback = "/"): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  if (raw.startsWith("/login") || raw.startsWith("/register")) {
    return fallback;
  }
  return raw;
}

const loginAction = action(async (data: LoginFormData & { returnTo?: string }) => {
  "use server";
  await adminAuthApi.login({
    email: data.email,
    password: data.password,
  });

  return {
    success: true as const,
    target: safeReturnTo(data.returnTo),
  };
}, "admin-login");

export default function AdminLoginPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const loginTrigger = useAction(loginAction);
  const submission = useSubmission(loginAction);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const [, { Form, Field }] = createForm<LoginFormData>({
    validate: (values) => {
      const result = loginSchema.safeParse(values);
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
    if (!submission.error) return;

    const error = submission.error as ApiError | Error;
    if (error instanceof ApiError) {
      const data = error.data as { message?: string } | undefined;
      setErrorMessage(data?.message || error.message);
      return;
    }

    setErrorMessage(error.message || t("admin.loginFailed"));
  });

  createEffect(() => {
    if (submission.result?.success) {
      window.location.assign(submission.result.target || "/");
    }
  });

  const handleSubmit = (values: LoginFormData) => {
    setErrorMessage(null);
    loginTrigger({
      ...values,
      returnTo: safeReturnTo(searchParams.returnTo),
    });
  };

  return (
    <main class="flex min-h-screen items-center justify-center bg-forest-950 p-4">
      <Card class="w-full max-w-md">
        <h1 class="h3 text-center">{t("admin.signIn")}</h1>
        <p class="mt-2 text-center text-forest-600">{t("admin.signInSubtitle")}</p>

        <Form onSubmit={handleSubmit} class="mt-8 space-y-4">
          <Show when={searchParams.registered === "1"}>
            <div class="rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-800">
              {t("admin.registeredBanner")}
            </div>
          </Show>

          <Show when={errorMessage()}>
            <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage()}
            </div>
          </Show>

          <Field name="email">
            {(field, props) => (
              <FieldGroup label={t("admin.email")} requirement="required" hint={t("admin.emailHint")}>
                <Input
                  {...props}
                  type="email"
                  autocomplete="email"
                  placeholder="admin@aponika.com"
                  value={field.value || ""}
                  error={field.error}
                  disabled={submission.pending}
                />
              </FieldGroup>
            )}
          </Field>

          <Field name="password">
            {(field, props) => (
              <FieldGroup label={t("admin.password")} requirement="required">
                <PasswordInput
                  {...props}
                  autocomplete="current-password"
                  placeholder="••••••••"
                  value={field.value || ""}
                  error={field.error}
                  disabled={submission.pending}
                />
              </FieldGroup>
            )}
          </Field>

          <Button type="submit" class="w-full" loading={submission.pending}>
            {submission.pending ? t("admin.signingIn") : t("admin.signIn")}
          </Button>
        </Form>

        <p class="mt-6 text-center text-sm text-forest-600">
          {t("admin.needAccount")}{" "}
          <A href="/register" class="font-semibold text-forest-700 hover:text-forest-900">
            {t("admin.registerLink")}
          </A>
        </p>
      </Card>
    </main>
  );
}
