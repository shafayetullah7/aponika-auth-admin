import { JSX, Show, createSignal, createUniqueId, splitProps } from "solid-js";
import { EyeIcon, EyeSlashIcon } from "~/components/icons";
import { useI18n } from "~/i18n";

export interface PasswordInputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Used for border styling and aria-invalid; error text is shown by FieldGroup. */
  error?: string;
}

export default function PasswordInput(props: PasswordInputProps) {
  const { t } = useI18n();
  const [local, rest] = splitProps(props, ["error", "class", "id"]);
  const [showPassword, setShowPassword] = createSignal(false);

  const inputId = local.id ?? createUniqueId();

  const baseStyles =
    "w-full rounded-lg border-2 bg-white px-4 py-2.5 pr-11 text-sm transition-standard focus-ring-flat disabled:cursor-not-allowed disabled:opacity-50";

  const stateStyles = local.error
    ? "border-red-500 active:border-red-600"
    : "border-cream-200 hover:border-cream-300 focus:border-forest-500";

  return (
    <div class="relative">
      <input
        {...rest}
        id={inputId}
        type={showPassword() ? "text" : "password"}
        aria-invalid={!!local.error}
        class={`${baseStyles} ${stateStyles} ${local.class || ""}`}
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center px-3 text-forest-500 transition-colors hover:text-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setShowPassword((value) => !value)}
        aria-label={
          showPassword() ? t("admin.hidePassword") : t("admin.showPassword")
        }
        disabled={rest.disabled}
      >
        <Show when={showPassword()} fallback={<EyeIcon class="size-5" />}>
          <EyeSlashIcon class="size-5" />
        </Show>
      </button>
    </div>
  );
}
