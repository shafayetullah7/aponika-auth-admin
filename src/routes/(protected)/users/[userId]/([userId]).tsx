import {
  action,
  A,
  createAsync,
  useAction,
  useParams,
  useSubmission,
} from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { Button, LoadingFallback, Modal } from "~/components/ui";
import { Pagination } from "~/components/ui/Pagination";
import { usersApi } from "~/lib/api/users.api";
import type {
  PlatformUserSession,
  PlatformUserSessionStatus,
  PlatformUserStatus,
} from "~/lib/api/types";
import { useI18n } from "~/i18n";

const suspendUserAction = action(async (id: string) => {
  "use server";
  await usersApi.suspend(id);
  return { success: true as const };
}, "admin-suspend-user");

const activateUserAction = action(async (id: string) => {
  "use server";
  await usersApi.activate(id);
  return { success: true as const };
}, "admin-activate-user");

const revokeSessionAction = action(async (input: { userId: string; sessionId: string }) => {
  "use server";
  await usersApi.revokeSession(input.userId, input.sessionId);
  return { success: true as const };
}, "admin-revoke-user-session");

export default function UserDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const userId = () => params.userId!;

  const [refreshKey, setRefreshKey] = createSignal(0);
  const [sessionsPage, setSessionsPage] = createSignal(1);
  const [showSuspendModal, setShowSuspendModal] = createSignal(false);
  const [showActivateModal, setShowActivateModal] = createSignal(false);
  const [revokeTarget, setRevokeTarget] = createSignal<PlatformUserSession | null>(null);
  const [actionError, setActionError] = createSignal<string | null>(null);

  const suspendTrigger = useAction(suspendUserAction);
  const suspendSubmission = useSubmission(suspendUserAction);
  const activateTrigger = useAction(activateUserAction);
  const activateSubmission = useSubmission(activateUserAction);
  const revokeTrigger = useAction(revokeSessionAction);
  const revokeSubmission = useSubmission(revokeSessionAction);

  const user = createAsync(async () => {
    refreshKey();
    return usersApi.getById(userId());
  }, { deferStream: true });

  const sessions = createAsync(async () => {
    refreshKey();
    sessionsPage();
    return usersApi.listSessions(userId(), { page: sessionsPage(), limit: 10 });
  }, { deferStream: true });

  const bumpRefresh = () => setRefreshKey((current) => current + 1);

  createEffect(() => {
    if (suspendSubmission.result?.success || activateSubmission.result?.success) {
      setShowSuspendModal(false);
      setShowActivateModal(false);
      setActionError(null);
      bumpRefresh();
    }
  });

  createEffect(() => {
    if (revokeSubmission.result?.success) {
      setRevokeTarget(null);
      setActionError(null);
      bumpRefresh();
    }
  });

  createEffect(() => {
    const error =
      suspendSubmission.error ?? activateSubmission.error ?? revokeSubmission.error;
    if (!error) return;
    setActionError(
      error instanceof Error ? error.message : t("usersDetail.actionFailed"),
    );
  });

  const formatDate = (value: string | null) => {
    if (!value) return t("usersDetail.never");
    return new Date(value).toLocaleString(locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status: PlatformUserStatus) =>
    status === "ACTIVE" ? t("users.statusActive") : t("users.statusSuspended");

  const sessionStatusLabel = (status: PlatformUserSessionStatus) => {
    switch (status) {
      case "active":
        return t("usersDetail.sessionActive");
      case "revoked":
        return t("usersDetail.sessionRevoked");
      case "expired":
        return t("usersDetail.sessionExpired");
    }
  };

  const formatDevice = (deviceInfo: Record<string, unknown>) => {
    const userAgent = deviceInfo.userAgent;
    if (typeof userAgent === "string" && userAgent.length > 0) {
      return userAgent.length > 72 ? `${userAgent.slice(0, 72)}…` : userAgent;
    }
    return t("usersDetail.deviceUnknown");
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h1 class="h3">{t("usersDetail.title")}</h1>
          <p class="text-forest-700">{t("usersDetail.subtitle")}</p>
        </div>
        <A href="/users" class="text-sm font-semibold text-forest-600 hover:text-forest-800">
          {t("usersDetail.backToList")}
        </A>
      </div>

      <Show when={user()} fallback={<LoadingFallback fullScreen={false} />}>
        {(detail) => (
          <div class="flat-card space-y-6 p-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-3">
                  <h2 class="h5">{detail().email}</h2>
                  <StatusBadge
                    status={detail().status}
                    label={statusLabel(detail().status)}
                  />
                </div>
                <Show when={detail().displayName}>
                  {(name) => (
                    <p class="mt-1 text-sm text-forest-700">{name()}</p>
                  )}
                </Show>
              </div>

              <div class="flex flex-wrap gap-2">
                <Show
                  when={detail().status === "ACTIVE"}
                  fallback={
                    <Button
                      type="button"
                      onClick={() => setShowActivateModal(true)}
                      loading={activateSubmission.pending}
                    >
                      {t("usersDetail.activate")}
                    </Button>
                  }
                >
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowSuspendModal(true)}
                    loading={suspendSubmission.pending}
                  >
                    {t("usersDetail.suspend")}
                  </Button>
                </Show>
              </div>
            </div>

            <Show when={actionError()}>
              <div
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {actionError()}
              </div>
            </Show>

            <div class="grid gap-4 sm:grid-cols-2">
              <SummaryField label={t("users.colVerified")}>
                {detail().emailVerified
                  ? t("users.verifiedYes")
                  : t("users.verifiedNo")}
              </SummaryField>
              <SummaryField label={t("users.colCreated")}>
                {formatDate(detail().createdAt)}
              </SummaryField>
              <SummaryField label={t("usersDetail.lastLogin")}>
                {formatDate(detail().lastLoginAt)}
              </SummaryField>
              <SummaryField label={t("usersDetail.sessions")}>
                {String(detail().sessionCount)}
              </SummaryField>
              <SummaryField label={t("usersDetail.activeSessions")}>
                {String(detail().activeSessionCount)}
              </SummaryField>
              <SummaryField label={t("usersDetail.updatedAt")}>
                {formatDate(detail().updatedAt)}
              </SummaryField>
            </div>
          </div>
        )}
      </Show>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="h5">{t("usersDetail.sessionsTitle")}</h2>
          <p class="text-sm text-forest-700">{t("usersDetail.sessionsSubtitle")}</p>
        </div>

        <Show when={sessions()} fallback={<LoadingFallback fullScreen={false} />}>
          {(sessionList) => (
            <div class="flat-card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-cream-200 bg-cream-50">
                    <tr class="text-left text-xs font-semibold uppercase tracking-wide text-forest-600">
                      <th scope="col" class="px-6 py-3">
                        {t("usersDetail.sessionCreated")}
                      </th>
                      <th scope="col" class="px-6 py-3">
                        {t("usersDetail.sessionIp")}
                      </th>
                      <th scope="col" class="px-6 py-3">
                        {t("usersDetail.sessionDevice")}
                      </th>
                      <th scope="col" class="px-6 py-3">
                        {t("usersDetail.sessionStatus")}
                      </th>
                      <th scope="col" class="px-6 py-3">
                        <span class="sr-only">{t("users.colActions")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-cream-100">
                    <Show
                      when={sessionList().data.length > 0}
                      fallback={
                        <tr>
                          <td colSpan={5} class="px-6 py-12 text-center text-sm text-forest-600">
                            {t("usersDetail.sessionsEmpty")}
                          </td>
                        </tr>
                      }
                    >
                      <For each={sessionList().data}>
                        {(session) => (
                          <tr class="hover:bg-cream-50">
                            <td class="px-6 py-4 text-sm text-forest-700">
                              {formatDate(session.createdAt)}
                            </td>
                            <td class="px-6 py-4 text-sm text-forest-700">
                              {session.ip ?? "—"}
                            </td>
                            <td class="max-w-xs px-6 py-4 text-sm text-forest-700">
                              <span class="line-clamp-2" title={formatDevice(session.deviceInfo)}>
                                {formatDevice(session.deviceInfo)}
                              </span>
                            </td>
                            <td class="px-6 py-4">
                              <SessionStatusBadge
                                status={session.status}
                                label={sessionStatusLabel(session.status)}
                              />
                            </td>
                            <td class="px-6 py-4 text-right">
                              <Show when={session.status === "active"}>
                                <button
                                  type="button"
                                  class="text-sm font-semibold text-terracotta-700 underline-offset-2 hover:underline"
                                  onClick={() => setRevokeTarget(session)}
                                >
                                  {t("usersDetail.revoke")}
                                </button>
                              </Show>
                            </td>
                          </tr>
                        )}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>

              <Show when={sessionList().meta.total > sessionList().meta.limit}>
                <Pagination
                  meta={sessionList().meta}
                  onPageChange={setSessionsPage}
                  labels={{
                    showing: t("users.paginationShowing"),
                    previous: t("users.paginationPrevious"),
                    next: t("users.paginationNext"),
                    pageOf: (current, total) =>
                      t("users.paginationPageOf")
                        .replace("{page}", String(current))
                        .replace("{total}", String(total)),
                    perPage: (value) =>
                      t("users.paginationPerPage").replace("{limit}", String(value)),
                  }}
                />
              </Show>
            </div>
          )}
        </Show>
      </section>

      <Modal
        show={showSuspendModal()}
        onClose={() => setShowSuspendModal(false)}
        title={t("usersDetail.suspendTitle")}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              {t("usersDetail.cancel")}
            </Button>
            <Button
              variant="destructive"
              loading={suspendSubmission.pending}
              onClick={() => suspendTrigger(userId())}
            >
              {t("usersDetail.suspendConfirm")}
            </Button>
          </>
        }
      >
        <p class="text-sm text-forest-700">{t("usersDetail.suspendBody")}</p>
      </Modal>

      <Modal
        show={showActivateModal()}
        onClose={() => setShowActivateModal(false)}
        title={t("usersDetail.activateTitle")}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowActivateModal(false)}>
              {t("usersDetail.cancel")}
            </Button>
            <Button
              loading={activateSubmission.pending}
              onClick={() => activateTrigger(userId())}
            >
              {t("usersDetail.activateConfirm")}
            </Button>
          </>
        }
      >
        <p class="text-sm text-forest-700">{t("usersDetail.activateBody")}</p>
      </Modal>

      <Modal
        show={!!revokeTarget()}
        onClose={() => setRevokeTarget(null)}
        title={t("usersDetail.revokeTitle")}
        footer={
          <>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              {t("usersDetail.cancel")}
            </Button>
            <Button
              variant="destructive"
              loading={revokeSubmission.pending}
              onClick={() => {
                const target = revokeTarget();
                if (!target) return;
                revokeTrigger({ userId: userId(), sessionId: target.id });
              }}
            >
              {t("usersDetail.revokeConfirm")}
            </Button>
          </>
        }
      >
        <p class="text-sm text-forest-700">{t("usersDetail.revokeBody")}</p>
      </Modal>
    </div>
  );
}

function StatusBadge(props: { status: PlatformUserStatus; label: string }) {
  const isActive = () => props.status === "ACTIVE";
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

function SessionStatusBadge(props: {
  status: PlatformUserSessionStatus;
  label: string;
}) {
  const classes = () => {
    switch (props.status) {
      case "active":
        return "bg-forest-100 text-forest-700";
      case "revoked":
        return "bg-terracotta-100 text-terracotta-700";
      case "expired":
        return "bg-cream-200 text-forest-600";
    }
  };

  return (
    <span
      class={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes()}`}
    >
      {props.label}
    </span>
  );
}

function SummaryField(props: { label: string; children: string }) {
  return (
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
        {props.label}
      </p>
      <p class="mt-1 text-forest-900">{props.children}</p>
    </div>
  );
}
