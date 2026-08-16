import { A, createAsync } from "@solidjs/router";
import {
  createDeferred,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "~/components/ui";
import { Pagination } from "~/components/ui/Pagination";
import { clientsApi } from "~/lib/api/clients.api";
import type {
  OAuthClientStatus,
  OAuthClientSummary,
  PaginatedResult,
} from "~/lib/api/types";
import { useI18n } from "~/i18n";

function ClientsTableSkeleton() {
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

function StatusBadge(props: { status: OAuthClientStatus; label: string }) {
  const isActive = () => props.status === "active";

  return (
    <span
      class={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive()
          ? "bg-forest-100 text-forest-700"
          : "bg-cream-200 text-forest-600"
      }`}
    >
      {props.label}
    </span>
  );
}

export default function ClientsPage() {
  const { t, locale } = useI18n();
  const [page, setPage] = createSignal(1);
  const [limit, setLimit] = createSignal(20);
  const [filters, setFilters] = createStore({
    search: "",
    status: "" as "" | OAuthClientStatus,
  });
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [reloadKey, setReloadKey] = createSignal(0);
  const debouncedSearch = createDeferred(() => filters.search, { timeoutMs: 300 });

  const clientsData = createAsync(
    async () => {
      reloadKey();
      setLoadError(null);
      try {
        return await clientsApi.list({
          page: page(),
          limit: limit(),
          status: filters.status || undefined,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("clients.loadFailed");
        setLoadError(message);
        return undefined;
      }
    },
    { deferStream: true },
  );

  const [stableClients, setStableClients] = createSignal<
    PaginatedResult<OAuthClientSummary> | undefined
  >(undefined);

  createEffect(() => {
    const data = clientsData();
    if (data !== undefined) {
      setStableClients(data);
    }
  });

  createEffect(() => {
    debouncedSearch();
    if (page() !== 1) setPage(1);
  });

  createEffect(() => {
    filters.status;
    if (page() !== 1) setPage(1);
  });

  const displayClients = createMemo(() => {
    const items = stableClients()?.data ?? [];
    const query = debouncedSearch().trim().toLowerCase();
    if (!query) return items;

    return items.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.clientId.toLowerCase().includes(query),
    );
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const clientTypeLabel = (type: OAuthClientSummary["clientType"]) =>
    type === "public" ? t("clients.typePublic") : t("clients.typeConfidential");

  const statusLabel = (status: OAuthClientStatus) =>
    status === "active" ? t("clients.statusActive") : t("clients.statusDisabled");

  const retry = () => setReloadKey((current) => current + 1);

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h1 class="h3">{t("admin.clients")}</h1>
          <p class="text-forest-700">{t("admin.clientsBlurb")}</p>
        </div>
        <A href="/clients/new">
          <Button>{t("clients.create")}</Button>
        </A>
      </div>

      <div class="flat-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={t("clients.searchPlaceholder")}
          class="focus-ring-flat w-full rounded-lg border-2 border-cream-200 bg-white px-3 py-2 text-sm text-forest-800 sm:max-w-sm"
          value={filters.search}
          onInput={(event) => setFilters("search", event.currentTarget.value)}
          aria-label={t("clients.searchPlaceholder")}
        />

        <select
          class="focus-ring-flat h-10 rounded-lg border-2 border-cream-200 bg-white px-3 text-sm text-forest-700"
          value={filters.status}
          onChange={(event) =>
            setFilters("status", event.currentTarget.value as "" | OAuthClientStatus)
          }
          aria-label={t("clients.statusFilter")}
        >
          <option value="">{t("clients.statusAll")}</option>
          <option value="active">{t("clients.statusActive")}</option>
          <option value="disabled">{t("clients.statusDisabled")}</option>
        </select>
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
            {t("clients.retry")}
          </button>
        </div>
      </Show>

      <Show when={stableClients()} fallback={<ClientsTableSkeleton />}>
        <div class="flat-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-cream-200 bg-cream-50">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-forest-600">
                  <th scope="col" class="px-6 py-3">
                    {t("clients.colName")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("clients.colClientId")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("clients.colType")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("clients.colStatus")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {t("clients.colCreated")}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    <span class="sr-only">{t("clients.colActions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cream-100">
                <Show
                  when={displayClients().length > 0}
                  fallback={
                    <tr>
                      <td colSpan={6} class="px-6 py-12 text-center text-sm text-forest-600">
                        {t("clients.empty")}
                      </td>
                    </tr>
                  }
                >
                  <For each={displayClients()}>
                    {(client) => (
                      <tr class="transition-standard hover:bg-cream-50 focus-within:bg-cream-50">
                        <td class="px-6 py-4">
                          <div class="font-medium text-forest-900">{client.name}</div>
                          <Show when={client.description}>
                            {(description) => (
                              <div class="mt-0.5 text-xs text-forest-600">{description()}</div>
                            )}
                          </Show>
                        </td>
                        <td class="px-6 py-4">
                          <code class="rounded bg-cream-100 px-1.5 py-0.5 text-xs text-forest-800">
                            {client.clientId}
                          </code>
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {clientTypeLabel(client.clientType)}
                        </td>
                        <td class="px-6 py-4">
                          <StatusBadge
                            status={client.status}
                            label={statusLabel(client.status)}
                          />
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {formatDate(client.createdAt)}
                        </td>
                        <td class="px-6 py-4 text-right">
                          <A
                            href={`/clients/${client.id}`}
                            class="rounded text-sm font-semibold text-forest-600 underline-offset-2 hover:text-forest-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
                          >
                            {t("clients.view")}
                          </A>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>

          <Show when={stableClients()?.meta}>
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
                  showing: t("clients.paginationShowing"),
                  previous: t("clients.paginationPrevious"),
                  next: t("clients.paginationNext"),
                  pageOf: (current, total) =>
                    t("clients.paginationPageOf")
                      .replace("{page}", String(current))
                      .replace("{total}", String(total)),
                  perPage: (value) =>
                    t("clients.paginationPerPage").replace("{limit}", String(value)),
                }}
              />
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
