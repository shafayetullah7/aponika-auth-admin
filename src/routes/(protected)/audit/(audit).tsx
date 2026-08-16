import { createAsync } from "@solidjs/router";
import {
  createDeferred,
  createEffect,
  createSignal,
  For,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Pagination } from "~/components/ui/Pagination";
import { AUDIT_ACTION_OPTIONS, auditApi } from "~/lib/api/audit.api";
import type { AuditEventSummary, PaginatedResult } from "~/lib/api/types";
import { useI18n } from "~/i18n";

function AuditTableSkeleton() {
  return (
    <div class="flat-card overflow-hidden" aria-hidden="true">
      <div class="h-12 animate-pulse border-b border-cream-200 bg-cream-100" />
      <div class="space-y-0">
        <For each={[1, 2, 3, 4, 5]}>
          {() => <div class="h-14 animate-pulse border-b border-cream-100 bg-cream-50" />}
        </For>
      </div>
    </div>
  );
}

function toIsoStartOfDay(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toIsoEndOfDay(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

export default function AuditLogPage() {
  const { t, locale } = useI18n();
  const [page, setPage] = createSignal(1);
  const [limit, setLimit] = createSignal(20);
  const [filters, setFilters] = createStore({
    action: "",
    actor: "",
    from: "",
    to: "",
  });
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [reloadKey, setReloadKey] = createSignal(0);
  const debouncedActor = createDeferred(() => filters.actor, { timeoutMs: 300 });

  const auditData = createAsync(
    async () => {
      reloadKey();
      setLoadError(null);
      try {
        const actor = debouncedActor().trim();
        return await auditApi.list({
          page: page(),
          limit: limit(),
          action: filters.action || undefined,
          actor: actor || undefined,
          from: toIsoStartOfDay(filters.from),
          to: toIsoEndOfDay(filters.to),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("auditLog.loadFailed");
        setLoadError(message);
        return undefined;
      }
    },
    { deferStream: true },
  );

  const [stableEvents, setStableEvents] = createSignal<
    PaginatedResult<AuditEventSummary> | undefined
  >(undefined);

  createEffect(() => {
    const data = auditData();
    if (data !== undefined) {
      setStableEvents(data);
    }
  });

  createEffect(() => {
    debouncedActor();
    filters.action;
    filters.from;
    filters.to;
    if (page() !== 1) setPage(1);
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const actionLabel = (action: string) => {
    const key = `auditLog.action.${action}`;
    const translated = t(key);
    return translated === key ? action : translated;
  };

  const formatResource = (event: AuditEventSummary) => {
    if (!event.resourceType) return "—";
    if (event.resourceId) {
      return `${event.resourceType} / ${event.resourceId}`;
    }
    return event.resourceType;
  };

  const formatActor = (event: AuditEventSummary) => {
    if (event.actorId) {
      return `${event.actorType} / ${event.actorId}`;
    }
    return event.actorType;
  };

  const retry = () => setReloadKey((current) => current + 1);

  return (
    <div class="space-y-6">
      <div class="space-y-1">
        <h1 class="h3">{t("admin.audit")}</h1>
        <p class="text-forest-700">{t("admin.auditBlurb")}</p>
      </div>

      <div class="flat-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-forest-600">
            {t("auditLog.actionFilter")}
          </span>
          <select
            class="focus-ring-flat h-10 w-full rounded-lg border-2 border-cream-200 bg-white px-3 text-sm text-forest-700"
            value={filters.action}
            onChange={(event) => setFilters("action", event.currentTarget.value)}
          >
            <option value="">{t("auditLog.actionAll")}</option>
            <For each={[...AUDIT_ACTION_OPTIONS]}>
              {(action) => (
                <option value={action}>{actionLabel(action)}</option>
              )}
            </For>
          </select>
        </label>

        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-forest-600">
            {t("auditLog.actorFilter")}
          </span>
          <input
            type="search"
            class="focus-ring-flat w-full rounded-lg border-2 border-cream-200 bg-white px-3 py-2 text-sm text-forest-800"
            placeholder={t("auditLog.actorPlaceholder")}
            value={filters.actor}
            onInput={(event) => setFilters("actor", event.currentTarget.value)}
          />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-forest-600">
            {t("auditLog.fromFilter")}
          </span>
          <input
            type="date"
            class="focus-ring-flat w-full rounded-lg border-2 border-cream-200 bg-white px-3 py-2 text-sm text-forest-800"
            value={filters.from}
            onInput={(event) => setFilters("from", event.currentTarget.value)}
          />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-forest-600">
            {t("auditLog.toFilter")}
          </span>
          <input
            type="date"
            class="focus-ring-flat w-full rounded-lg border-2 border-cream-200 bg-white px-3 py-2 text-sm text-forest-800"
            value={filters.to}
            onInput={(event) => setFilters("to", event.currentTarget.value)}
          />
        </label>
      </div>

      <Show when={loadError()}>
        <div
          class="flat-card flex flex-col items-start gap-3 border-terracotta-500/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p class="text-sm text-terracotta-700">{loadError()}</p>
          <button
            type="button"
            class="text-sm font-semibold text-forest-600 underline hover:text-forest-800"
            onClick={retry}
          >
            {t("auditLog.retry")}
          </button>
        </div>
      </Show>

      <Show when={stableEvents()} fallback={<AuditTableSkeleton />}>
        <div class="flat-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-cream-200 bg-cream-50">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-forest-600">
                  <th scope="col" class="px-6 py-3">
                    {t("auditLog.colWhen")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("auditLog.colAction")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("auditLog.colActor")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("auditLog.colResource")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("auditLog.colIp")}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cream-100">
                <Show
                  when={(stableEvents()?.data.length ?? 0) > 0}
                  fallback={
                    <tr>
                      <td colSpan={5} class="px-6 py-12 text-center text-sm text-forest-600">
                        {t("auditLog.empty")}
                      </td>
                    </tr>
                  }
                >
                  <For each={stableEvents()?.data ?? []}>
                    {(event) => (
                      <tr class="transition-standard hover:bg-cream-50">
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {formatDate(event.createdAt)}
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-forest-900">
                          {actionLabel(event.action)}
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          <span class="font-mono text-xs">{formatActor(event)}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          <span class="font-mono text-xs">{formatResource(event)}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {event.ip ?? "—"}
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>

          <Show when={stableEvents()?.meta}>
            {(meta) => (
              <Pagination
                meta={meta()}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  if (page() !== 1) setPage(1);
                }}
                showLimitSelector
                labels={{
                  showing: t("auditLog.paginationShowing"),
                  previous: t("auditLog.paginationPrevious"),
                  next: t("auditLog.paginationNext"),
                  pageOf: (current, total) =>
                    t("auditLog.paginationPageOf")
                      .replace("{page}", String(current))
                      .replace("{total}", String(total)),
                  perPage: (value) =>
                    t("auditLog.paginationPerPage").replace("{limit}", String(value)),
                }}
              />
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
