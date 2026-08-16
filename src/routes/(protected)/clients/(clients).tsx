import { useI18n } from "~/i18n";

export default function ClientsPage() {
  const { t } = useI18n();

  return (
    <div class="space-y-4">
      <h1 class="h3">{t("admin.clients")}</h1>
      <p class="text-forest-700">{t("admin.clientsBlurb")}</p>
      <div class="flat-card p-6 text-sm text-forest-600">{t("common.placeholder")}</div>
    </div>
  );
}
