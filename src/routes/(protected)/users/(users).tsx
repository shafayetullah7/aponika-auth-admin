import { copy } from "~/copy";
import { formatDate, paginationLabels } from "~/copy/format";
import { A, createAsync } from "@solidjs/router";
import {
  createDeferred,
  createEffect,
  createSignal,
  For,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Pagination } from "~/components/ui/Pagination";
import { usersApi } from "~/lib/api/users.api";
import type {
  PaginatedResult,
  PlatformUserStatus,
  PlatformUserSummary,
} from "~/lib/api/types";

function UsersTableSkeleton() {
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

function StatusBadge(props: { status: PlatformUserStatus; label: string }) {
  const isActive = () => props.status === "ACTIVE";

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

export default function UsersPage() {
    const [page, setPage] = createSignal(1);
  const [limit, setLimit] = createSignal(20);
  const [filters, setFilters] = createStore({
    search: "",
    status: "" as "" | PlatformUserStatus,
  });
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [reloadKey, setReloadKey] = createSignal(0);
  const debouncedSearch = createDeferred(() => filters.search, { timeoutMs: 300 });

  const usersData = createAsync(
    async () => {
      reloadKey();
      setLoadError(null);
      try {
        const query = debouncedSearch().trim();
        return await usersApi.list({
          page: page(),
          limit: limit(),
          q: query || undefined,
          status: filters.status || undefined,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : copy.users.loadFailed;
        setLoadError(message);
        return undefined;
      }
    },
    { deferStream: true },
  );

  const [stableUsers, setStableUsers] = createSignal<
    PaginatedResult<PlatformUserSummary> | undefined
  >(undefined);

  createEffect(() => {
    const data = usersData();
    if (data !== undefined) {
      setStableUsers(data);
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

  const statusLabel = (status: PlatformUserStatus) =>
    status === "ACTIVE" ? copy.users.statusActive : copy.users.statusSuspended;

  const retry = () => setReloadKey((current) => current + 1);

  return (
    <div class="space-y-6">
      <div class="space-y-1">
        <h1 class="h3">{copy.admin.users}</h1>
        <p class="text-forest-700">{copy.admin.usersBlurb}</p>
      </div>

      <div class="flat-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={copy.users.searchPlaceholder}
          class="focus-ring-flat w-full rounded-lg border-2 border-cream-200 bg-white px-3 py-2 text-sm text-forest-800 sm:max-w-sm"
          value={filters.search}
          onInput={(event) => setFilters("search", event.currentTarget.value)}
          aria-label={copy.users.searchPlaceholder}
        />

        <select
          class="focus-ring-flat h-10 rounded-lg border-2 border-cream-200 bg-white px-3 text-sm text-forest-700"
          value={filters.status}
          onChange={(event) =>
            setFilters("status", event.currentTarget.value as "" | PlatformUserStatus)
          }
          aria-label={copy.users.statusFilter}
        >
          <option value="">{copy.users.statusAll}</option>
          <option value="ACTIVE">{copy.users.statusActive}</option>
          <option value="SUSPENDED">{copy.users.statusSuspended}</option>
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
            {copy.users.retry}
          </button>
        </div>
      </Show>

      <Show when={stableUsers()} fallback={<UsersTableSkeleton />}>
        <div class="flat-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-cream-200 bg-cream-50">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-forest-600">
                  <th scope="col" class="px-6 py-3">
                    {copy.users.colEmail}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {copy.users.colDisplayName}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {copy.users.colStatus}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {copy.users.colVerified}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    {copy.users.colCreated}
                  </th>
                  <th scope="col" class="px-6 py-3">
                    <span class="sr-only">{copy.users.colActions}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cream-100">
                <Show
                  when={(stableUsers()?.data.length ?? 0) > 0}
                  fallback={
                    <tr>
                      <td colSpan={6} class="px-6 py-12 text-center text-sm text-forest-600">
                        {copy.users.empty}
                      </td>
                    </tr>
                  }
                >
                  <For each={stableUsers()?.data ?? []}>
                    {(user) => (
                      <tr class="transition-standard hover:bg-cream-50 focus-within:bg-cream-50">
                        <td class="px-6 py-4 text-sm font-medium text-forest-900">
                          {user.email}
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {user.displayName ?? "—"}
                        </td>
                        <td class="px-6 py-4">
                          <StatusBadge
                            status={user.status}
                            label={statusLabel(user.status)}
                          />
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {user.emailVerified ? copy.users.verifiedYes : copy.users.verifiedNo}
                        </td>
                        <td class="px-6 py-4 text-sm text-forest-700">
                          {formatDate(user.createdAt)}
                        </td>
                        <td class="px-6 py-4 text-right">
                          <A
                            href={`/users/${user.id}`}
                            class="rounded text-sm font-semibold text-forest-600 underline-offset-2 hover:text-forest-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
                          >
                            {copy.users.view}
                          </A>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>

          <Show when={stableUsers()?.meta}>
            {(meta) => (
              <Pagination
                meta={meta()}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  if (page() !== 1) setPage(1);
                }}
                showLimitSelector
                labels={paginationLabels(copy.users)}
              />
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
