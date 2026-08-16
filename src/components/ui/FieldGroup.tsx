import { Show, type JSX } from "solid-js";
import { useI18n } from "~/i18n";

export type FieldRequirement = "required" | "optional" | "requiredForReview";

export function FieldGroup(props: {
  label: string;
  requirement?: FieldRequirement;
  /** @deprecated Use `requirement="required"` instead. */
  required?: boolean;
  hint?: string;
  error?: string;
  children: JSX.Element;
}) {
  const { t } = useI18n();

  const requirement = (): FieldRequirement => {
    if (props.requirement) return props.requirement;
    if (props.required) return "required";
    return "required";
  };

  return (
    <div>
      <label class="mb-1.5 block text-sm font-medium text-forest-800">
        {props.label}
        <Show when={requirement() === "required"}>
          <span class="ml-1 text-red-500">*</span>
        </Show>
        <Show when={requirement() === "optional"}>
          <span class="ml-1 font-normal text-gray-500">
            ({t("common.optional")})
          </span>
        </Show>
        <Show when={requirement() === "requiredForReview"}>
          <span class="ml-1 font-normal text-gray-500">
            ({t("common.requiredForReview")})
          </span>
        </Show>
      </label>
      {props.children}
      <Show when={props.error}>
        <p class="mt-1 text-xs font-medium text-red-600">{props.error}</p>
      </Show>
      <Show when={props.hint && !props.error}>
        <p class="mt-1 text-xs text-gray-500">{props.hint}</p>
      </Show>
    </div>
  );
}
