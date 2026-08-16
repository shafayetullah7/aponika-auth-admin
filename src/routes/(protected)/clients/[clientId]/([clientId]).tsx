import { action, createAsync, useAction, useParams, useSubmission, A } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { createForm, setError, setValue, type FieldValues, type FormStore } from "@modular-forms/solid";
import { UriListField } from "~/components/clients/UriListField";
import { Button, FieldGroup, Input, LoadingFallback, Modal } from "~/components/ui";
import { applyApiErrorToForm } from "~/lib/api/map-api-errors";
import { clientsApi } from "~/lib/api/clients.api";
import type { AuditEventSummary, OAuthClientDetail, UpdateOAuthClientDto } from "~/lib/api/types";
import { useI18n } from "~/i18n";
import { OAUTH_SCOPES } from "~/schemas/create-client.schema";
import {
  buildUpdateClientPayload,
  updateClientFormSchema,
  zodIssuesToFieldErrors,
  type UpdateClientFormData,
} from "~/schemas/update-client.schema";

const updateClientAction = action(
  async (payload: { id: string; data: UpdateOAuthClientDto }) => {
    "use server";
    const client = await clientsApi.update(payload.id, payload.data);
    return { success: true as const, client };
  },
  "admin-update-oauth-client",
);

const disableClientAction = action(async (id: string) => {
  "use server";
  await clientsApi.disable(id);
  return { success: true as const };
}, "admin-disable-oauth-client");

const enableClientAction = action(async (id: string) => {
  "use server";
  await clientsApi.enable(id);
  return { success: true as const };
}, "admin-enable-oauth-client");

export default function ClientDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const clientId = () => params.clientId!;

  const [refreshKey, setRefreshKey] = createSignal(0);
  const [isEditing, setIsEditing] = createSignal(false);
  const [showDisableModal, setShowDisableModal] = createSignal(false);
  const [showEnableModal, setShowEnableModal] = createSignal(false);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [uriErrors, setUriErrors] = createSignal<Record<string, string>>({});

  const [redirectUris, setRedirectUris] = createSignal<string[]>([""]);
  const [postLogoutUris, setPostLogoutUris] = createSignal<string[]>([""]);
  const [allowedOrigins, setAllowedOrigins] = createSignal<string[]>([""]);
  const [selectedScopes, setSelectedScopes] = createSignal<string[]>([]);
  const [pkceRequired, setPkceRequired] = createSignal(true);

  const updateTrigger = useAction(updateClientAction);
  const updateSubmission = useSubmission(updateClientAction);
  const disableTrigger = useAction(disableClientAction);
  const disableSubmission = useSubmission(disableClientAction);
  const enableTrigger = useAction(enableClientAction);
  const enableSubmission = useSubmission(enableClientAction);

  const client = createAsync(async () => {
    refreshKey();
    return clientsApi.getById(clientId());
  }, { deferStream: true });

  const auditEvents = createAsync(async () => {
    refreshKey();
    return clientsApi.listAuditEvents(clientId());
  }, { deferStream: true });

  const [form, { Form, Field }] = createForm<Pick<UpdateClientFormData, "name" | "description">>({
    validate: (values) => {
      const result = updateClientFormSchema
        .pick({ name: true, description: true })
        .safeParse(values);
      if (result.success) return {};
      return zodIssuesToFieldErrors(result.error.issues);
    },
  });

  const hydrateEditState = (detail: OAuthClientDetail) => {
    setRedirectUris(detail.redirectUris?.length ? [...detail.redirectUris] : [""]);
    setPostLogoutUris(
      detail.postLogoutRedirectUris?.length ? [...detail.postLogoutRedirectUris] : [""],
    );
    setAllowedOrigins(detail.allowedOrigins?.length ? [...detail.allowedOrigins] : [""]);
    setSelectedScopes([...detail.scopes]);
    setPkceRequired(detail.pkceRequired);
  };

  const startEditing = () => {
    const detail = client();
    if (!detail) return;
    hydrateEditState(detail);
    setValue(form, "name", detail.name);
    setValue(form, "description", detail.description ?? "");
    setIsEditing(true);
    setFormError(null);
    setUriErrors({});
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormError(null);
    setUriErrors({});
  };

  const bumpRefresh = () => setRefreshKey((current) => current + 1);

  createEffect(() => {
    if (updateSubmission.result?.success) {
      setIsEditing(false);
      bumpRefresh();
    }
  });

  createEffect(() => {
    if (disableSubmission.result?.success || enableSubmission.result?.success) {
      setShowDisableModal(false);
      setShowEnableModal(false);
      bumpRefresh();
    }
  });

  createEffect(() => {
    if (!updateSubmission.error) return;
    const uriMessage = applyApiErrorToForm(
      form as unknown as FormStore<FieldValues>,
      updateSubmission.error,
      { redirect: "redirectUris", origin: "allowedOrigins", uri: "redirectUris" },
    );
    if (uriMessage) {
      setUriErrors({ redirectUris: uriMessage });
      return;
    }
    setFormError(
      updateSubmission.error instanceof Error
        ? updateSubmission.error.message
        : t("clientsDetail.updateFailed"),
    );
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggleScope = (scope: string, checked: boolean) => {
    setSelectedScopes((current) => {
      if (checked) return current.includes(scope) ? current : [...current, scope];
      return current.filter((value) => value !== scope);
    });
  };

  const handleUpdateSubmit = (values: Pick<UpdateClientFormData, "name" | "description">) => {
    const detail = client();
    if (!detail) return;

    setFormError(null);
    setUriErrors({});

    const payload = buildUpdateClientPayload({
      name: values.name,
      description: values.description,
      redirectUris: redirectUris(),
      postLogoutRedirectUris: postLogoutUris(),
      allowedOrigins: allowedOrigins(),
      scopes: selectedScopes(),
      pkceRequired: pkceRequired(),
      isPublic: detail.clientType === "public",
    });

    const result = updateClientFormSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
      Object.entries(fieldErrors).forEach(([key, message]) => {
        if (key === "name" || key === "description") {
          setError(form, key, message);
          return;
        }
        if (key.startsWith("redirectUris")) {
          setUriErrors((current) => ({ ...current, redirectUris: message }));
          return;
        }
        if (key.startsWith("postLogoutRedirectUris")) {
          setUriErrors((current) => ({ ...current, postLogoutRedirectUris: message }));
          return;
        }
        if (key.startsWith("allowedOrigins")) {
          setUriErrors((current) => ({ ...current, allowedOrigins: message }));
          return;
        }
        setFormError(message);
      });
      return;
    }

    updateTrigger({ id: clientId(), data: result.data });
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
          <>
            <div class="flat-card space-y-6 p-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <h2 class="h5">{detail().name}</h2>
                    <StatusBadge
                      status={detail().status}
                      label={
                        detail().status === "active"
                          ? t("clients.statusActive")
                          : t("clients.statusDisabled")
                      }
                    />
                  </div>
                  <code class="mt-1 block text-sm text-forest-700">{detail().clientId}</code>
                </div>

                <Show when={!isEditing()}>
                  <div class="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={startEditing}>
                      {t("clientsDetail.edit")}
                    </Button>
                    <Show
                      when={detail().status === "active"}
                      fallback={
                        <Button
                          type="button"
                          onClick={() => setShowEnableModal(true)}
                          loading={enableSubmission.pending}
                        >
                          {t("clientsDetail.enable")}
                        </Button>
                      }
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDisableModal(true)}
                        loading={disableSubmission.pending}
                      >
                        {t("clientsDetail.disable")}
                      </Button>
                    </Show>
                  </div>
                </Show>
              </div>

              <Show
                when={isEditing()}
                fallback={
                  <ClientSummaryView detail={detail()} formatDate={formatDate} t={t} />
                }
              >
                <Show when={formError()}>
                  <div
                    class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {formError()}
                  </div>
                </Show>

                <Form onSubmit={handleUpdateSubmit} class="space-y-6">
                  <Field name="name">
                    {(field, props) => (
                      <FieldGroup label={t("clientsCreate.name")} requirement="required" error={field.error}>
                        <Input {...props} value={field.value || ""} disabled={updateSubmission.pending} />
                      </FieldGroup>
                    )}
                  </Field>

                  <Field name="description">
                    {(field, props) => (
                      <FieldGroup
                        label={t("clientsCreate.description")}
                        requirement="optional"
                        error={field.error}
                      >
                        <textarea
                          {...props}
                          class="focus-ring-flat min-h-24 w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-forest-800"
                          value={field.value || ""}
                          maxlength={2000}
                          disabled={updateSubmission.pending}
                        />
                      </FieldGroup>
                    )}
                  </Field>

                  <UriListField
                    label={t("clientsCreate.redirectUris")}
                    requirement="required"
                    values={redirectUris()}
                    onChange={setRedirectUris}
                    error={uriErrors().redirectUris}
                    disabled={updateSubmission.pending}
                  />
                  <UriListField
                    label={t("clientsCreate.postLogoutUris")}
                    requirement="optional"
                    values={postLogoutUris()}
                    onChange={setPostLogoutUris}
                    error={uriErrors().postLogoutRedirectUris}
                    disabled={updateSubmission.pending}
                  />
                  <UriListField
                    label={t("clientsCreate.allowedOrigins")}
                    requirement="optional"
                    values={allowedOrigins()}
                    onChange={setAllowedOrigins}
                    error={uriErrors().allowedOrigins}
                    disabled={updateSubmission.pending}
                  />

                  <FieldGroup label={t("clientsCreate.scopes")} requirement="required">
                    <div class="flex flex-wrap gap-4">
                      <For each={[...OAUTH_SCOPES]}>
                        {(scope) => (
                          <label class="inline-flex items-center gap-2 text-sm text-forest-800">
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded border-cream-300 text-forest-600"
                              checked={selectedScopes().includes(scope)}
                              disabled={updateSubmission.pending}
                              onChange={(event) =>
                                toggleScope(scope, event.currentTarget.checked)
                              }
                            />
                            {scope}
                          </label>
                        )}
                      </For>
                    </div>
                  </FieldGroup>

                  <FieldGroup label={t("clientsCreate.pkceRequired")} requirement="optional">
                    <label class="inline-flex items-center gap-2 text-sm text-forest-800">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-cream-300 text-forest-600"
                        checked={pkceRequired()}
                        disabled={
                          updateSubmission.pending || detail().clientType === "public"
                        }
                        onChange={(event) => setPkceRequired(event.currentTarget.checked)}
                      />
                      {t("clientsCreate.pkceEnabled")}
                    </label>
                  </FieldGroup>

                  <div class="flex gap-3">
                    <Button type="submit" loading={updateSubmission.pending}>
                      {updateSubmission.pending
                        ? t("clientsDetail.saving")
                        : t("clientsDetail.save")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updateSubmission.pending}
                      onClick={cancelEditing}
                    >
                      {t("clientsDetail.cancel")}
                    </Button>
                  </div>
                </Form>
              </Show>
            </div>

            <AuditSection
              events={auditEvents()}
              formatDate={formatDate}
              t={t}
              loading={auditEvents() === undefined}
            />
          </>
        )}
      </Show>

      <Modal
        show={showDisableModal()}
        onClose={() => setShowDisableModal(false)}
        title={t("clientsDetail.disableTitle")}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDisableModal(false)}>
              {t("clientsDetail.cancel")}
            </Button>
            <Button
              variant="destructive"
              loading={disableSubmission.pending}
              onClick={() => disableTrigger(clientId())}
            >
              {t("clientsDetail.disableConfirm")}
            </Button>
          </>
        }
      >
        <p class="text-sm text-forest-700">{t("clientsDetail.disableBody")}</p>
      </Modal>

      <Modal
        show={showEnableModal()}
        onClose={() => setShowEnableModal(false)}
        title={t("clientsDetail.enableTitle")}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEnableModal(false)}>
              {t("clientsDetail.cancel")}
            </Button>
            <Button loading={enableSubmission.pending} onClick={() => enableTrigger(clientId())}>
              {t("clientsDetail.enableConfirm")}
            </Button>
          </>
        }
      >
        <p class="text-sm text-forest-700">{t("clientsDetail.enableBody")}</p>
      </Modal>
    </div>
  );
}

function StatusBadge(props: { status: "active" | "disabled"; label: string }) {
  const isActive = () => props.status === "active";
  return (
    <span
      class={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive() ? "bg-forest-100 text-forest-700" : "bg-cream-200 text-forest-600"
      }`}
    >
      {props.label}
    </span>
  );
}

function ClientSummaryView(props: {
  detail: OAuthClientDetail;
  formatDate: (value: string) => string;
  t: (key: string) => string;
}) {
  const { detail, formatDate, t } = props;

  return (
    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <SummaryField label={t("clients.colType")}>
          {detail.clientType === "public"
            ? t("clients.typePublic")
            : t("clients.typeConfidential")}
        </SummaryField>
        <SummaryField label={t("clients.colCreated")}>
          {formatDate(detail.createdAt)}
        </SummaryField>
        <SummaryField label={t("clientsCreate.pkceRequired")}>
          {detail.pkceRequired ? t("clientsDetail.yes") : t("clientsDetail.no")}
        </SummaryField>
      </div>

      <Show when={detail.description}>
        {(description) => (
          <SummaryField label={t("clientsCreate.description")}>{description()}</SummaryField>
        )}
      </Show>

      <UriSection
        title={t("clientsCreate.redirectUris")}
        values={detail.redirectUris ?? []}
        emptyLabel={t("clientsDetail.none")}
      />
      <UriSection
        title={t("clientsCreate.postLogoutUris")}
        values={detail.postLogoutRedirectUris ?? []}
        emptyLabel={t("clientsDetail.none")}
      />
      <UriSection
        title={t("clientsCreate.allowedOrigins")}
        values={detail.allowedOrigins ?? []}
        emptyLabel={t("clientsDetail.none")}
      />

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
          {t("clientsCreate.scopes")}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <For each={detail.scopes}>
            {(scope) => (
              <span class="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                {scope}
              </span>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

function SummaryField(props: { label: string; children: string }) {
  return (
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">{props.label}</p>
      <p class="mt-1 text-forest-900">{props.children}</p>
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

function AuditSection(props: {
  events: AuditEventSummary[] | undefined;
  formatDate: (value: string) => string;
  t: (key: string) => string;
  loading: boolean;
}) {
  const actionLabel = (action: string) => {
    const key = `clientsDetail.audit.${action}`;
    const translated = props.t(key);
    return translated === key ? action : translated;
  };

  return (
    <div class="flat-card p-6">
      <h2 class="h5">{props.t("clientsDetail.auditTitle")}</h2>
      <p class="mt-1 text-sm text-forest-600">{props.t("clientsDetail.auditSubtitle")}</p>

      <Show when={!props.loading} fallback={<LoadingFallback fullScreen={false} />}>
        <Show
          when={props.events && props.events.length > 0}
          fallback={
            <p class="mt-4 text-sm text-forest-600">{props.t("clientsDetail.auditEmpty")}</p>
          }
        >
          <div class="mt-4 overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-cream-200 bg-cream-50">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-forest-600">
                  <th scope="col" class="px-4 py-3">
                    {props.t("clientsDetail.auditWhen")}
                  </th>
                  <th scope="col" class="px-4 py-3">
                    {props.t("clientsDetail.auditAction")}
                  </th>
                  <th scope="col" class="px-4 py-3">
                    {props.t("clientsDetail.auditActor")}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cream-100">
                <For each={props.events ?? []}>
                  {(event) => (
                    <tr>
                      <td class="px-4 py-3 text-sm text-forest-700">
                        {props.formatDate(event.createdAt)}
                      </td>
                      <td class="px-4 py-3 text-sm text-forest-900">
                        {actionLabel(event.action)}
                      </td>
                      <td class="px-4 py-3 text-sm text-forest-700">
                        {event.actorType}
                        <Show when={event.ip}>
                          {(ip) => <span class="block text-xs text-forest-500">{ip()}</span>}
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  );
}
