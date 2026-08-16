import { A, createAsync, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { LoadingFallback } from "~/components/ui";
import { clientsApi } from "~/lib/api/clients.api";
import { useI18n } from "~/i18n";

export default function ClientDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();

  const client = createAsync(() => clientsApi.getById(params.clientId!), {
    deferStream: true,
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h1 class="h3">{t("clientsDetail.title")}</h1>
          <p class="text-forest-700">{t("clientsDetail.subtitle")}</p>
        </div>
        <A href="/clients" class="text-sm font-semibold text-forest-600 hover:text-forest-800">
          {t("clientsCreate.backToList")}
        </A>
      </div>

      <Show when={client()} fallback={<LoadingFallback fullScreen={false} />}>
        {(detail) => (
          <div class="flat-card space-y-6 p-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clients.colName")}
                </p>
                <p class="mt-1 text-forest-900">{detail().name}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clients.colClientId")}
                </p>
                <code class="mt-1 block text-sm text-forest-900">{detail().clientId}</code>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clients.colType")}
                </p>
                <p class="mt-1 text-forest-900">
                  {detail().clientType === "public"
                    ? t("clients.typePublic")
                    : t("clients.typeConfidential")}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clients.colStatus")}
                </p>
                <p class="mt-1 text-forest-900">
                  {detail().status === "active"
                    ? t("clients.statusActive")
                    : t("clients.statusDisabled")}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clients.colCreated")}
                </p>
                <p class="mt-1 text-forest-900">{formatDate(detail().createdAt)}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                  {t("clientsCreate.pkceRequired")}
                </p>
                <p class="mt-1 text-forest-900">
                  {detail().pkceRequired ? t("clientsDetail.yes") : t("clientsDetail.no")}
                </p>
              </div>
            </div>

            <Show when={detail().description}>
              {(description) => (
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                    {t("clientsCreate.description")}
                  </p>
                  <p class="mt-1 text-sm text-forest-800">{description()}</p>
                </div>
              )}
            </Show>

            <UriSection
              title={t("clientsCreate.redirectUris")}
              values={detail().redirectUris ?? []}
              emptyLabel={t("clientsDetail.none")}
            />
            <UriSection
              title={t("clientsCreate.postLogoutUris")}
              values={detail().postLogoutRedirectUris ?? []}
              emptyLabel={t("clientsDetail.none")}
            />
            <UriSection
              title={t("clientsCreate.allowedOrigins")}
              values={detail().allowedOrigins ?? []}
              emptyLabel={t("clientsDetail.none")}
            />

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
                {t("clientsCreate.scopes")}
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <For each={detail().scopes}>
                  {(scope) => (
                    <span class="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                      {scope}
                    </span>
                  )}
                </For>
              </div>
            </div>

            <p class="text-sm text-forest-600">{t("clientsDetail.editComingSoon")}</p>
          </div>
        )}
      </Show>
    </div>
  );
}

function UriSection(props: { title: string; values: string[]; emptyLabel: string }) {
  return (
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">{props.title}</p>
      <Show
        when={props.values.length > 0}
        fallback={<p class="mt-1 text-sm text-forest-600">{props.emptyLabel}</p>}
      >
        <ul class="mt-2 space-y-1">
          <For each={props.values}>
            {(uri) => (
              <li>
                <code class="text-sm text-forest-900">{uri}</code>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
