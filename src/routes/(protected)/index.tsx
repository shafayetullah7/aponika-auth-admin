import { ApiHealthStatus } from "~/components/ApiHealthStatus";
import { useI18n } from "~/i18n";

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div class="space-y-4">
      <h1 class="h3">{t("admin.dashboard")}</h1>
      <p class="text-forest-700">{t("admin.dashboardBlurb")}</p>
      <ApiHealthStatus />
      <div class="flat-card p-6 text-sm text-forest-600">{t("common.placeholder")}</div>
    </div>
  );
}
