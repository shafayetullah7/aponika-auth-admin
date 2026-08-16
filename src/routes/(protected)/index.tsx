import { ApiHealthStatus } from "~/components/ApiHealthStatus";
import { copy } from "~/copy";

export default function DashboardPage() {
  return (
    <div class="space-y-4">
      <h1 class="h3">{copy.admin.dashboard}</h1>
      <p class="text-forest-700">{copy.admin.dashboardBlurb}</p>
      <ApiHealthStatus />
      <div class="flat-card p-6 text-sm text-forest-600">{copy.common.placeholder}</div>
    </div>
  );
}
