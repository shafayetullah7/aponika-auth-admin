import { Button, Card, FieldGroup, Input } from "~/components/ui";
import { useI18n } from "~/i18n";

export default function AdminLoginPage() {
  const { t } = useI18n();

  return (
    <main class="flex min-h-screen items-center justify-center bg-forest-950 p-4">
      <Card class="w-full max-w-md">
        <h1 class="h3 text-center">{t("admin.signIn")}</h1>
        <p class="mt-2 text-center text-forest-600">{t("admin.signInSubtitle")}</p>

        <div class="mt-8 space-y-4">
          <FieldGroup
            label={t("admin.email")}
            requirement="required"
            hint={t("admin.emailHint")}
          >
            <Input
              type="email"
              name="email"
              autocomplete="email"
              placeholder="admin@aponika.com"
              disabled
            />
          </FieldGroup>

          <FieldGroup label={t("admin.password")} requirement="required">
            <Input
              type="password"
              name="password"
              autocomplete="current-password"
              placeholder="••••••••"
              disabled
            />
          </FieldGroup>

          <Button type="button" class="w-full" disabled>
            {t("admin.signIn")}
          </Button>
        </div>

        <p class="mt-6 rounded-xl bg-cream-100 px-4 py-3 text-center text-sm text-forest-700">
          {t("admin.loginPlaceholder")}
        </p>
      </Card>
    </main>
  );
}
