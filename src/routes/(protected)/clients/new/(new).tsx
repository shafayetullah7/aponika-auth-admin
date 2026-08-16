import { copy } from "~/copy";
import { action, useAction, useSubmission, A, useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { createForm, setError, type FieldValues, type FormStore } from "@modular-forms/solid";
import { ClientSecretReveal } from "~/components/clients/ClientSecretReveal";
import { UriListField } from "~/components/clients/UriListField";
import { Button, Card, FieldGroup, Input } from "~/components/ui";
import { applyApiErrorToForm } from "~/lib/api/map-api-errors";
import { clientsApi } from "~/lib/api/clients.api";
import type { OAuthClientDetail } from "~/lib/api/types";
import {
  buildCreateClientPayload,
  createClientPayloadSchema,
  createClientScalarsSchema,
  OAUTH_SCOPES,
  type CreateClientPayload,
  type CreateClientScalarsFormData,
  zodIssuesToFieldErrors,
} from "~/schemas/create-client.schema";

const createClientAction = action(async (payload: CreateClientPayload) => {
  "use server";
  const client = await clientsApi.create(payload);
  return { success: true as const, client };
}, "admin-create-oauth-client");

export default function CreateClientPage() {
    const navigate = useNavigate();
  const createTrigger = useAction(createClientAction);
  const submission = useSubmission(createClientAction);

  const [redirectUris, setRedirectUris] = createSignal(["http://localhost:3000/auth/callback"]);
  const [postLogoutUris, setPostLogoutUris] = createSignal(["http://localhost:3000/"]);
  const [allowedOrigins, setAllowedOrigins] = createSignal(["http://localhost:3000"]);
  const [selectedScopes, setSelectedScopes] = createSignal<string[]>([...OAUTH_SCOPES]);
  const [pkceRequired, setPkceRequired] = createSignal(true);
  const [uriErrors, setUriErrors] = createSignal<Record<string, string>>({});
  const [formError, setFormError] = createSignal<string | null>(null);
  const [createdClient, setCreatedClient] = createSignal<OAuthClientDetail | null>(null);

  const [form, { Form, Field }] = createForm<CreateClientScalarsFormData>({
    initialValues: {
      clientId: "byte-forge-web",
      name: "Byte Forge Web",
      description: "Byte Forge marketplace web app",
      clientType: "public",
    },
    validate: (values) => {
      const result = createClientScalarsSchema.safeParse(values);
      if (result.success) return {};
      return zodIssuesToFieldErrors(result.error.issues);
    },
  });

  createEffect(() => {
    if (submission.result?.success) {
      const client = submission.result.client;
      if (client.clientSecret) {
        setCreatedClient(client);
        return;
      }
      navigate(`/clients/${client.id}`);
    }
  });

  createEffect(() => {
    if (!submission.error) return;

    const uriMessage = applyApiErrorToForm(
      form as unknown as FormStore<FieldValues>,
      submission.error,
      {
      redirect: "redirectUris",
      origin: "allowedOrigins",
      uri: "redirectUris",
    });

    if (uriMessage) {
      setUriErrors({ redirectUris: uriMessage });
      setFormError(null);
      return;
    }

    const fallback =
      submission.error instanceof Error
        ? submission.error.message
        : copy.clientsCreate.failed;
    setFormError(fallback);
  });

  const toggleScope = (scope: string, checked: boolean) => {
    setSelectedScopes((current) => {
      if (checked) {
        return current.includes(scope) ? current : [...current, scope];
      }
      return current.filter((value) => value !== scope);
    });
  };

  const handleSubmit = (values: CreateClientScalarsFormData) => {
    setFormError(null);
    setUriErrors({});

    const payload = buildCreateClientPayload({
      scalars: { ...values, pkceRequired: pkceRequired() },
      redirectUris: redirectUris(),
      postLogoutRedirectUris: postLogoutUris(),
      allowedOrigins: allowedOrigins(),
      scopes: selectedScopes(),
    });

    const result = createClientPayloadSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
      Object.entries(fieldErrors).forEach(([key, message]) => {
        if (
          key === "redirectUris" ||
          key.startsWith("redirectUris.") ||
          key === "postLogoutRedirectUris" ||
          key.startsWith("postLogoutRedirectUris.") ||
          key === "allowedOrigins" ||
          key.startsWith("allowedOrigins.")
        ) {
          const bucket = key.split(".")[0];
          setUriErrors((current) => ({ ...current, [bucket]: message }));
          return;
        }

        if (key === "scopes") {
          setFormError(message);
          return;
        }

        setError(form, key as keyof CreateClientScalarsFormData, message);
      });
      return;
    }

    createTrigger(result.data);
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h1 class="h3">{copy.clientsCreate.title}</h1>
          <p class="text-forest-700">{copy.clientsCreate.subtitle}</p>
        </div>
        <A href="/clients" class="text-sm font-semibold text-forest-600 hover:text-forest-800">
          {copy.clientsCreate.backToList}
        </A>
      </div>

      <Show
        when={!createdClient()}
        fallback={
          <ClientSecretReveal
            clientId={createdClient()!.clientId}
            clientSecret={createdClient()!.clientSecret!}
            detailHref={`/clients/${createdClient()!.id}`}
          />
        }
      >
        <Card class="max-w-3xl">
          <Show when={formError()}>
            <div
              class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {formError()}
            </div>
          </Show>

          <Form onSubmit={handleSubmit} class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <Field name="clientId">
                {(field, props) => (
                  <FieldGroup
                    label={copy.clientsCreate.clientId}
                    requirement="required"
                    hint={copy.clientsCreate.clientIdHint}
                    error={field.error}
                  >
                    <Input
                      {...props}
                      value={field.value || ""}
                      disabled={submission.pending}
                    />
                  </FieldGroup>
                )}
              </Field>

              <Field name="clientType">
                {(field, props) => (
                  <FieldGroup
                    label={copy.clientsCreate.clientType}
                    requirement="required"
                    hint={copy.clientsCreate.clientTypeHint}
                    error={field.error}
                  >
                    <select
                      {...props}
                      class="focus-ring-flat h-11 w-full rounded-lg border-2 border-cream-200 bg-white px-3 text-sm text-forest-800"
                      value={field.value || "public"}
                      disabled={submission.pending}
                    >
                      <option value="public">{copy.clients.typePublic}</option>
                      <option value="confidential">{copy.clients.typeConfidential}</option>
                    </select>
                  </FieldGroup>
                )}
              </Field>
            </div>

            <Field name="name">
              {(field, props) => (
                <FieldGroup label={copy.clientsCreate.name} requirement="required" error={field.error}>
                  <Input {...props} value={field.value || ""} disabled={submission.pending} />
                </FieldGroup>
              )}
            </Field>

            <Field name="description">
              {(field, props) => (
                <FieldGroup
                  label={copy.clientsCreate.description}
                  requirement="optional"
                  error={field.error}
                >
                  <textarea
                    {...props}
                    class="focus-ring-flat min-h-24 w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-forest-800"
                    value={field.value || ""}
                    maxlength={2000}
                    disabled={submission.pending}
                  />
                </FieldGroup>
              )}
            </Field>

            <UriListField
              label={copy.clientsCreate.redirectUris}
              requirement="required"
              hint={copy.clientsCreate.redirectUrisHint}
              values={redirectUris()}
              onChange={setRedirectUris}
              error={uriErrors().redirectUris}
              placeholder="http://localhost:3000/auth/callback"
              disabled={submission.pending}
            />

            <UriListField
              label={copy.clientsCreate.postLogoutUris}
              requirement="optional"
              hint={copy.clientsCreate.postLogoutUrisHint}
              values={postLogoutUris()}
              onChange={setPostLogoutUris}
              error={uriErrors().postLogoutRedirectUris}
              placeholder="http://localhost:3000/"
              disabled={submission.pending}
            />

            <UriListField
              label={copy.clientsCreate.allowedOrigins}
              requirement="optional"
              hint={copy.clientsCreate.allowedOriginsHint}
              values={allowedOrigins()}
              onChange={setAllowedOrigins}
              error={uriErrors().allowedOrigins}
              placeholder="http://localhost:3000"
              disabled={submission.pending}
            />

            <FieldGroup
              label={copy.clientsCreate.scopes}
              requirement="required"
              hint={copy.clientsCreate.scopesHint}
            >
              <div class="flex flex-wrap gap-4">
                <For each={[...OAUTH_SCOPES]}>
                  {(scope) => (
                    <label class="inline-flex items-center gap-2 text-sm text-forest-800">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-cream-300 text-forest-600"
                        checked={selectedScopes().includes(scope)}
                        disabled={submission.pending}
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

            <FieldGroup
              label={copy.clientsCreate.pkceRequired}
              requirement="optional"
              hint={copy.clientsCreate.pkceHint}
            >
              <label class="inline-flex items-center gap-2 text-sm text-forest-800">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-cream-300 text-forest-600"
                  checked={pkceRequired()}
                  disabled={submission.pending}
                  onChange={(event) => setPkceRequired(event.currentTarget.checked)}
                />
                {copy.clientsCreate.pkceEnabled}
              </label>
            </FieldGroup>

            <div class="flex gap-3">
              <Button type="submit" loading={submission.pending}>
                {submission.pending ? copy.clientsCreate.submitting : copy.clientsCreate.submit}
              </Button>
              <A href="/clients">
                <Button type="button" variant="outline" disabled={submission.pending}>
                  {copy.admin.back}
                </Button>
              </A>
            </div>
          </Form>
        </Card>
      </Show>
    </div>
  );
}
