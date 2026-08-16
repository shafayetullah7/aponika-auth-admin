import { createAsync } from "@solidjs/router";
import type { JSX } from "solid-js";
import { copy } from "~/copy";
import { getHealth } from "~/lib/api/health.api";
import { ApiError } from "~/lib/api/types";
import { config } from "~/lib/config";

type HealthResult =
  | Awaited<ReturnType<typeof getHealth>>
  | { error: unknown };

function isErrorResult(
  value: HealthResult,
): value is { error: unknown } {
  return "error" in value;
}

function HealthStatusBadge(props: {
  result: HealthResult;
  class?: string;
}): JSX.Element {
  const { result } = props;

  if (isErrorResult(result)) {
    return (
      <div
        class={`rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ${props.class ?? ""}`}
      >
        <span>
          {copy.common.apiUnreachable}
          {result.error instanceof ApiError && result.error.status > 0
            ? ` (${result.error.status})`
            : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      class={`rounded-xl px-4 py-3 text-sm ${props.class ?? ""}`}
      classList={{
        "bg-forest-50 text-forest-700": result.db === "ok",
        "bg-amber-50 text-amber-900": result.db !== "ok",
      }}
    >
      <span>
        {copy.common.apiReachable} · {copy.common.apiStatus}: {result.status} ·{" "}
        {copy.common.apiDb}:{" "}
        {result.db === "ok" ? copy.common.apiDbOk : copy.common.apiDbDown}
      </span>
    </div>
  );
}

export function ApiHealthStatus(props: { class?: string }) {
  if (!config.isDev) {
    return null;
  }

  const health = createAsync<HealthResult>(() =>
    getHealth().catch((error: unknown) => ({ error })),
  );

  return (
    <>
      {health() ? (
        <HealthStatusBadge result={health()!} class={props.class} />
      ) : null}
    </>
  );
}
